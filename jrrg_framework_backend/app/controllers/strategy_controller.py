import logging
import requests
import json
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
import traceback
from datetime import datetime, timedelta

from app.models import db, FavoriteStock, AnalysisHistory, BacktestRecord, BacktestTrade
from app.services.backtest_service import BacktestService
import app.utils as utils

# 创建AI股市蓝图
strategy_controller = Blueprint('strategy_controller', __name__)

# AI模型配置
AI_MODEL_URL = "https://api.deepseek.com/"  # Deepseek API 端点
AI_API_KEY = "sk-b1f5f2e0558a4b5daca6b20d2b68f9c4"  # 请替换为实际的 Deepseek API Key

@strategy_controller.before_request
def log_request_info():
    current_app.logger.info(f"收到请求: {request.method} {request.url}")

@strategy_controller.after_request
def log_response_info(response):
    current_app.logger.info(f"响应状态码: {response.status_code}")
    return response

@strategy_controller.route('/favorites', methods=['GET'])
@jwt_required()
def get_favorite_stocks():
    """获取用户自选股票列表"""
    try:
        user_id = get_jwt_identity()
        current_app.logger.info(f"获取用户 {user_id} 的自选股票列表")
        
        # 查询用户的自选股票，按添加时间降序排列
        favorite_stocks = db.session.query(FavoriteStock).filter_by(
            user_id=user_id
        ).order_by(FavoriteStock.created_at.desc()).all()
        
        # 转换为字典格式
        stocks_data = [stock.to_dict() for stock in favorite_stocks]
        
        current_app.logger.info(f"用户 {user_id} 共有 {len(stocks_data)} 只自选股票")
        return utils.success(data=stocks_data, message="获取自选股票列表成功")
        
    except Exception as e:
        current_app.logger.error(f"获取自选股票列表失败: {str(e)}")
        return utils.error(message="获取自选股票列表失败", code=500)

@strategy_controller.route('/favorites', methods=['POST'])
@jwt_required()
def add_favorite_stock():
    """添加自选股票"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # 安全地获取参数，确保转换为字符串
        stock_code = str(data.get('stock_code', '')).strip() if data.get('stock_code') is not None else ''
        stock_name = str(data.get('stock_name', '')).strip() if data.get('stock_name') is not None else ''
        note = str(data.get('note', '')).strip() if data.get('note', '') is not None else ''
        
        if not stock_code or not stock_name:
            return utils.error(message="股票代码和名称不能为空", code=400)
        
        current_app.logger.info(f"用户 {user_id} 添加自选股票: {stock_code} - {stock_name}")
        
        # 检查是否已经存在
        existing_stock = db.session.query(FavoriteStock).filter_by(
            user_id=user_id,
            stock_code=stock_code
        ).first()
        
        if existing_stock:
            return utils.error(message="该股票已在自选列表中", code=400)
        
        # 创建新的自选股票记录
        new_favorite = FavoriteStock(
            user_id=user_id,
            stock_code=stock_code,
            stock_name=stock_name,
            note=note
        )
        
        db.session.add(new_favorite)
        db.session.commit()
        
        current_app.logger.info(f"用户 {user_id} 成功添加自选股票: {stock_code}")
        return utils.success(data=new_favorite.to_dict(), message="添加自选股票成功")
        
    except IntegrityError:
        db.session.rollback()
        return utils.error(message="该股票已在自选列表中", code=400)
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"添加自选股票失败: {str(e)}")
        return utils.error(message="添加自选股票失败", code=500)

@strategy_controller.route('/favorites/<stock_code>', methods=['DELETE'])
@jwt_required()
def remove_favorite_stock(stock_code):
    """删除自选股票"""
    try:
        user_id = get_jwt_identity()
        current_app.logger.info(f"用户 {user_id} 删除自选股票: {stock_code}")
        
        # 查找要删除的股票
        favorite_stock = db.session.query(FavoriteStock).filter_by(
            user_id=user_id,
            stock_code=stock_code
        ).first()
        
        if not favorite_stock:
            return utils.error(message="自选股票不存在", code=404)
        
        # 删除记录
        db.session.delete(favorite_stock)
        db.session.commit()
        
        current_app.logger.info(f"用户 {user_id} 成功删除自选股票: {stock_code}")
        return utils.success(message="删除自选股票成功")
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"删除自选股票失败: {str(e)}")
        return utils.error(message="删除自选股票失败", code=500)

@strategy_controller.route('/favorites/<stock_code>/note', methods=['PUT'])
@jwt_required()
def update_favorite_stock_note(stock_code):
    """更新自选股票备注"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        note = data.get('note', '').strip()
        
        current_app.logger.info(f"用户 {user_id} 更新自选股票 {stock_code} 的备注")
        
        # 查找股票
        favorite_stock = db.session.query(FavoriteStock).filter_by(
            user_id=user_id,
            stock_code=stock_code
        ).first()
        
        if not favorite_stock:
            return utils.error(message="自选股票不存在", code=404)
        
        # 更新备注
        favorite_stock.note = note
        db.session.commit()
        
        current_app.logger.info(f"用户 {user_id} 成功更新自选股票 {stock_code} 的备注")
        return utils.success(data=favorite_stock.to_dict(), message="更新备注成功")
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"更新自选股票备注失败: {str(e)}")
        return utils.error(message="更新备注失败", code=500)

@strategy_controller.route('/ai-analysis', methods=['POST'])
@jwt_required()
def ai_analysis():
    """AI分析接口"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        prompt = data.get('prompt', '').strip()
        stock_code = data.get('stock_code')
        
        if not prompt:
            return utils.error(message="分析问题不能为空", code=400)
        
        current_app.logger.info(f"用户 {user_id} 请求AI分析: {prompt[:100]}...")
        
        # 构建Deepseek AI请求
        ai_request_data = {
            "model": "deepseek-chat",  # Deepseek聊天模型
            "messages": [
                {
                    "role": "system",
                    "content": "你是一个专业的股票投资分析师，请基于用户的问题提供专业、客观的分析建议。请用中文回答，内容要详细且具有实用性。"
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 1000,
            "stream": False
        }
        
        # 发送请求到Deepseek AI模型服务
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {AI_API_KEY}'
        }
        
        current_app.logger.info(f"向Deepseek AI服务发送请求")
        
        try:
            # 设置超时时间为30秒
            response = requests.post(
                f"{AI_MODEL_URL}v1/chat/completions",
                headers=headers,
                json=ai_request_data,
                timeout=30
            )
            
            current_app.logger.info(f"Deepseek AI服务响应状态码: {response.status_code}")
            
            if response.status_code == 200:
                ai_response = response.json()
                # 解析Deepseek响应格式
                analysis_result = ai_response.get('choices', [{}])[0].get('message', {}).get('content', '')
                
                if not analysis_result:
                    current_app.logger.error("Deepseek AI返回空结果")
                    return utils.error(message="AI分析服务暂时不可用，请稍后重试", code=503)
                
                # 获取股票信息
                stock_name = None
                if stock_code:
                    favorite_stock = db.session.query(FavoriteStock).filter_by(
                        user_id=user_id,
                        stock_code=stock_code
                    ).first()
                    if favorite_stock:
                        stock_name = favorite_stock.stock_name
                
                # 保存分析历史
                try:
                    analysis_history = AnalysisHistory(
                        user_id=user_id,
                        question=prompt,
                        answer=analysis_result,
                        stock_code=stock_code,
                        stock_name=stock_name,
                        model_name="deepseek-chat"  # 更新模型名称
                    )
                    db.session.add(analysis_history)
                    db.session.commit()
                    current_app.logger.info(f"保存用户 {user_id} 的分析历史成功")
                except Exception as save_error:
                    current_app.logger.error(f"保存分析历史失败: {str(save_error)}")
                    # 即使保存历史失败，也要返回分析结果
                    db.session.rollback()
                
                return utils.success(
                    data={
                        'analysis': analysis_result,
                        'stock_code': stock_code,
                        'stock_name': stock_name
                    },
                    message="AI分析完成"
                )
            else:
                error_msg = f"Deepseek AI服务返回错误: {response.status_code}"
                current_app.logger.error(f"{error_msg}, 响应内容: {response.text}")
                return utils.error(message="AI分析服务暂时不可用，请稍后重试", code=503)
                
        except requests.exceptions.Timeout:
            current_app.logger.error("Deepseek AI服务请求超时")
            return utils.error(message="AI分析服务响应超时，请稍后重试", code=504)
        except requests.exceptions.ConnectionError:
            current_app.logger.error("无法连接到Deepseek AI服务")
            return utils.error(message="无法连接到AI分析服务，请检查网络连接", code=503)
        except requests.exceptions.RequestException as req_error:
            current_app.logger.error(f"Deepseek AI服务请求失败: {str(req_error)}")
            return utils.error(message="AI分析服务暂时不可用，请稍后重试", code=503)
            
    except Exception as e:
        current_app.logger.error(f"AI分析失败: {str(e)}")
        return utils.error(message="AI分析失败，请稍后重试", code=500)

@strategy_controller.route('/analysis-history', methods=['GET'])
@jwt_required()
def get_analysis_history():
    """获取用户的AI分析历史"""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # 限制查询数量，最多100条
        limit = min(limit, 100)
        
        current_app.logger.info(f"获取用户 {user_id} 的分析历史，限制 {limit} 条，偏移 {offset} 条")
        
        # 查询分析历史，按时间降序排列
        history_list = db.session.query(AnalysisHistory).filter_by(
            user_id=user_id
        ).order_by(AnalysisHistory.created_at.desc()).offset(offset).limit(limit).all()
        
        # 获取总记录数，用于分页
        total_count = db.session.query(AnalysisHistory).filter_by(user_id=user_id).count()
        
        # 转换为字典格式
        history_data = [history.to_dict() for history in history_list]
        
        current_app.logger.info(f"用户 {user_id} 共有 {total_count} 条分析历史，本次返回 {len(history_data)} 条")
        return utils.success(
            data=history_data, 
            message="获取分析历史成功",
            meta={
                "total": total_count,
                "limit": limit,
                "offset": offset
            }
        )
        
    except Exception as e:
        current_app.logger.error(f"获取分析历史失败: {str(e)}")
        return utils.error(message="获取分析历史失败", code=500)

@strategy_controller.route('/save-analysis-history', methods=['POST'])
@jwt_required()
def save_analysis_history():
    """保存分析历史记录（供前端直接调用大模型后使用）"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        current_app.logger.info(f"接收到保存分析历史请求: {data}")
        
        if not data:
            current_app.logger.error("请求体为空")
            return utils.error(message="请求体不能为空", code=400)
        
        question = data.get('question', '').strip()
        answer = data.get('answer', '').strip()
        stock_code = data.get('stock_code')
        model_name = data.get('model_name', 'deepseek-chat')
        
        if not question or not answer:
            current_app.logger.error(f"问题或回答为空: question={question}, answer=有内容但不显示")
            return utils.error(message="问题或回答不能为空", code=400)
            
        current_app.logger.info(f"保存用户 {user_id} 的分析历史记录")
        
        # 获取股票信息
        stock_name = None
        if stock_code:
            favorite_stock = db.session.query(FavoriteStock).filter_by(
                user_id=user_id,
                stock_code=stock_code
            ).first()
            if favorite_stock:
                stock_name = favorite_stock.stock_name
                current_app.logger.info(f"找到股票名称: {stock_name}")
            else:
                current_app.logger.info(f"未找到股票 {stock_code} 的名称")
        
        # 创建分析历史记录
        try:
            analysis_history = AnalysisHistory(
                user_id=user_id,
                question=question,
                answer=answer,
                stock_code=stock_code,
                stock_name=stock_name,
                model_name=model_name
            )
            
            db.session.add(analysis_history)
            db.session.commit()
            
            current_app.logger.info(f"用户 {user_id} 的分析历史记录保存成功，ID: {analysis_history.id}")
            return utils.success(message="分析历史记录保存成功")
        except Exception as db_error:
            db.session.rollback()
            current_app.logger.error(f"数据库错误: {str(db_error)}")
            current_app.logger.error(traceback.format_exc())
            return utils.error(message=f"保存到数据库失败: {str(db_error)}", code=500)
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"保存分析历史记录失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f"保存分析历史记录失败: {str(e)}", code=500)

@strategy_controller.route('/backtest', methods=['POST'])
@jwt_required()
def run_backtest():
    """运行回测"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # 获取请求参数
        stock_code = data.get('stock_code')
        stock_name = data.get('stock_name')
        strategy_name = data.get('strategy_name')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        initial_cash = float(data.get('initial_cash', 100000))
        commission = float(data.get('commission', 0.001))
        strategy_params = data.get('strategy_params', {})
        
        current_app.logger.info(f"用户 {user_id} 请求回测: {stock_code} - {strategy_name}")
        current_app.logger.info(f"回测参数: 日期范围 {start_date} 至 {end_date}, 初始资金 {initial_cash}, 手续费 {commission}")
        current_app.logger.info(f"策略参数: {strategy_params}")
        
        # 参数验证
        if not stock_code or not strategy_name or not start_date or not end_date:
            current_app.logger.error(f"回测参数验证失败: stock_code={stock_code}, strategy_name={strategy_name}, start_date={start_date}, end_date={end_date}")
            return utils.error(message="缺少必要参数", code=400)
        
        # 如果没有提供股票名称，尝试从自选股票中获取
        if not stock_name:
            current_app.logger.info(f"未提供股票名称，尝试从自选股票获取")
            favorite_stock = db.session.query(FavoriteStock).filter_by(
                user_id=user_id,
                stock_code=stock_code
            ).first()
            
            if favorite_stock:
                stock_name = favorite_stock.stock_name
                current_app.logger.info(f"从自选股票中获取到股票名称: {stock_name}")
            else:
                # 尝试从股票实时数据接口获取股票名称
                try:
                    # 直接使用akshare获取股票信息
                    import akshare as ak
                    stock_info = ak.stock_individual_info_em(symbol=stock_code)
                    if not stock_info.empty:
                        # 查找包含"股票简称"的行
                        name_rows = stock_info[stock_info.iloc[:, 0].str.contains('股票简称|名称', na=False)]
                        if not name_rows.empty:
                            stock_name = str(name_rows.iloc[0, 1])
                            current_app.logger.info(f"从akshare获取到股票名称: {stock_name}")
                except Exception as name_error:
                    current_app.logger.warning(f"从akshare获取股票名称失败: {str(name_error)}")
                
                # 如果仍未获取到名称，使用股票代码作为名称
                if not stock_name:
                    stock_name = stock_code
                    current_app.logger.info(f"未能获取股票名称，使用股票代码作为名称: {stock_name}")
                
        # 运行回测前进行数据可用性检查
        try:
            # 转换日期为datetime对象
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
            
            # 检查日期范围
            if start_date_obj >= end_date_obj:
                current_app.logger.error(f"日期范围无效: {start_date} 至 {end_date}")
                return utils.error(message="开始日期必须早于结束日期", code=400)
                
            # 检查数据可用性
            try:
                current_app.logger.info(f"检查股票数据可用性: {stock_code}, {start_date} 至 {end_date}")
                test_data = BacktestService.get_stock_data(stock_code, start_date_obj, end_date_obj)
                if test_data.empty:
                    current_app.logger.error(f"股票 {stock_code} 在指定日期范围没有数据")
                    return utils.error(message=f"股票 {stock_code} 在指定日期范围没有数据，请尝试其他股票或修改日期范围", code=400)
                else:
                    current_app.logger.info(f"股票数据检查通过，共 {len(test_data)} 条记录")
            except Exception as data_error:
                current_app.logger.error(f"股票数据可用性检查失败: {str(data_error)}")
                return utils.error(message=f"获取股票数据失败: {str(data_error)}", code=400)
                
        except ValueError as date_error:
            current_app.logger.error(f"日期格式无效: {start_date}, {end_date}, 错误: {str(date_error)}")
            return utils.error(message="日期格式无效，请使用YYYY-MM-DD格式", code=400)
                
        # 运行回测
        try:
            current_app.logger.info(f"开始执行回测: {stock_code} - {strategy_name}")
            result = BacktestService.run_backtest(
                stock_code=stock_code,
                stock_name=stock_name,
                strategy_name=strategy_name,
                params=strategy_params,
                start_date=start_date,
                end_date=end_date,
                initial_cash=initial_cash,
                commission=commission
            )
            current_app.logger.info(f"回测执行完成: 总收益率 {result['total_return']:.2f}%, 交易次数 {result['trade_count']}")
        except Exception as backtest_error:
            current_app.logger.error(f"回测执行失败: {str(backtest_error)}")
            current_app.logger.error(traceback.format_exc())
            return utils.error(message=f"回测执行失败: {str(backtest_error)}", code=400)
        
        # 保存回测记录到数据库
        try:
            current_app.logger.info(f"保存回测记录到数据库")
            backtest_record = BacktestRecord(
                user_id=user_id,
                strategy_name=strategy_name,
                stock_code=stock_code,
                stock_name=stock_name,
                start_date=datetime.strptime(start_date, '%Y-%m-%d').date(),
                end_date=datetime.strptime(end_date, '%Y-%m-%d').date(),
                initial_cash=initial_cash,
                final_value=result['final_value'],
                total_return=result['total_return'],
                annual_return=result['annual_return'],
                max_drawdown=result['max_drawdown'],
                sharpe_ratio=result['sharpe_ratio'],
                trade_count=result['trade_count'],
                win_rate=result['win_rate'],
                strategy_params=json.dumps(strategy_params),
                result_data=json.dumps({
                    'trades': result['trades'],
                    'chart_image': result['chart_image']
                })
            )
            
            db.session.add(backtest_record)
            db.session.commit()
            
            # 保存交易记录
            for trade in result['trades']:
                trade_record = BacktestTrade(
                    backtest_id=backtest_record.id,
                    trade_type=trade['entry_type'],
                    trade_date=datetime.strptime(trade['entry_date'], '%Y-%m-%d').date(),
                    price=trade['entry_price'],
                    size=trade['size'],
                    commission=trade['commission'],
                    pnl=trade['pl']
                )
                db.session.add(trade_record)
                
            db.session.commit()
            
            current_app.logger.info(f"用户 {user_id} 回测完成，ID: {backtest_record.id}")
            
            # 移除base64图片数据，减少响应大小
            result_copy = result.copy()
            result_copy['id'] = backtest_record.id
            result_copy.pop('chart_image', None)
            
            return utils.success(data=result_copy, message="回测完成")
        except Exception as db_error:
            db.session.rollback()
            current_app.logger.error(f"保存回测记录失败: {str(db_error)}")
            current_app.logger.error(traceback.format_exc())
            return utils.error(message=f"回测完成但保存记录失败: {str(db_error)}", code=500)
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"回测失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f"回测失败: {str(e)}", code=500)

@strategy_controller.route('/backtest/history', methods=['GET'])
@jwt_required()
def get_backtest_history():
    """获取回测历史记录"""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        current_app.logger.info(f"用户 {user_id} 获取回测历史记录")
        
        # 查询回测历史记录
        backtest_records = db.session.query(BacktestRecord).filter_by(
            user_id=user_id
        ).order_by(BacktestRecord.created_at.desc()).limit(limit).offset(offset).all()
        
        # 转换为字典格式
        records = [record.to_dict() for record in backtest_records]
        
        # 查询总记录数
        total_count = db.session.query(BacktestRecord).filter_by(user_id=user_id).count()
        
        current_app.logger.info(f"用户 {user_id} 共有 {total_count} 条回测记录")
        
        return utils.success(data={
            'records': records,
            'total': total_count
        }, message="获取回测历史记录成功")
        
    except Exception as e:
        current_app.logger.error(f"获取回测历史记录失败: {str(e)}")
        return utils.error(message="获取回测历史记录失败", code=500)

@strategy_controller.route('/backtest/<int:backtest_id>', methods=['GET'])
@jwt_required()
def get_backtest_detail(backtest_id):
    """获取回测详情"""
    try:
        user_id = get_jwt_identity()
        
        current_app.logger.info(f"用户 {user_id} 获取回测详情: {backtest_id}")
        
        # 查询回测记录
        backtest_record = db.session.query(BacktestRecord).filter_by(
            id=backtest_id,
            user_id=user_id
        ).first()
        
        if not backtest_record:
            return utils.error(message="回测记录不存在", code=404)
            
        # 获取回测详情
        backtest_detail = backtest_record.to_dict()
        
        # 获取图表数据
        result_data = json.loads(backtest_record.result_data) if backtest_record.result_data else {}
        backtest_detail['chart_image'] = result_data.get('chart_image', '')
        backtest_detail['trades'] = result_data.get('trades', [])
        
        # 查询交易记录
        trades = db.session.query(BacktestTrade).filter_by(
            backtest_id=backtest_id
        ).all()
        
        # 转换为字典格式
        trade_records = [trade.to_dict() for trade in trades]
        backtest_detail['trade_records'] = trade_records
        
        current_app.logger.info(f"获取回测详情成功: {backtest_id}")
        
        return utils.success(data=backtest_detail, message="获取回测详情成功")
        
    except Exception as e:
        current_app.logger.error(f"获取回测详情失败: {str(e)}")
        return utils.error(message="获取回测详情失败", code=500)

@strategy_controller.route('/backtest/<int:backtest_id>', methods=['DELETE'])
@jwt_required()
def delete_backtest(backtest_id):
    """删除回测记录"""
    try:
        user_id = get_jwt_identity()
        
        current_app.logger.info(f"用户 {user_id} 删除回测记录: {backtest_id}")
        
        # 查询回测记录
        backtest_record = db.session.query(BacktestRecord).filter_by(
            id=backtest_id,
            user_id=user_id
        ).first()
        
        if not backtest_record:
            return utils.error(message="回测记录不存在", code=404)
            
        # 删除回测记录及关联的交易记录
        db.session.delete(backtest_record)
        db.session.commit()
        
        current_app.logger.info(f"删除回测记录成功: {backtest_id}")
        
        return utils.success(message="删除回测记录成功")
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"删除回测记录失败: {str(e)}")
        return utils.error(message="删除回测记录失败", code=500)

@strategy_controller.route('/backtest/strategies', methods=['GET'])
@jwt_required()
def get_strategies():
    """获取可用的回测策略列表"""
    try:
        user_id = get_jwt_identity()
        
        current_app.logger.info(f"用户 {user_id} 获取可用策略列表")
        
        # 返回可用的策略列表
        strategies = [
            {
                'id': 'MovingAverageStrategy',
                'name': '单均线策略',
                'description': '当收盘价上穿均线买入，下穿均线卖出',
                'params': [
                    {
                        'name': 'ma_period',
                        'label': '均线周期',
                        'type': 'number',
                        'default': 20,
                        'min': 5,
                        'max': 200
                    },
                    {
                        'name': 'size',
                        'label': '交易数量',
                        'type': 'number',
                        'default': 100,
                        'min': 100,
                        'max': 10000,
                        'step': 100
                    }
                ]
            },
            {
                'id': 'MACrossStrategy',
                'name': '双均线交叉策略',
                'description': '当快速均线上穿慢速均线买入，下穿时卖出',
                'params': [
                    {
                        'name': 'fast_period',
                        'label': '快速均线周期',
                        'type': 'number',
                        'default': 5,
                        'min': 3,
                        'max': 60
                    },
                    {
                        'name': 'slow_period',
                        'label': '慢速均线周期',
                        'type': 'number',
                        'default': 20,
                        'min': 10,
                        'max': 120
                    },
                    {
                        'name': 'size',
                        'label': '交易数量',
                        'type': 'number',
                        'default': 100,
                        'min': 100,
                        'max': 10000,
                        'step': 100
                    }
                ]
            },
            {
                'id': 'RSIStrategy',
                'name': 'RSI超买超卖策略',
                'description': '当RSI低于超卖阈值买入，高于超买阈值卖出',
                'params': [
                    {
                        'name': 'rsi_period',
                        'label': 'RSI周期',
                        'type': 'number',
                        'default': 14,
                        'min': 5,
                        'max': 30
                    },
                    {
                        'name': 'rsi_overbought',
                        'label': '超买阈值',
                        'type': 'number',
                        'default': 70,
                        'min': 60,
                        'max': 90
                    },
                    {
                        'name': 'rsi_oversold',
                        'label': '超卖阈值',
                        'type': 'number',
                        'default': 30,
                        'min': 10,
                        'max': 40
                    },
                    {
                        'name': 'size',
                        'label': '交易数量',
                        'type': 'number',
                        'default': 100,
                        'min': 100,
                        'max': 10000,
                        'step': 100
                    }
                ]
            }
        ]
        
        return utils.success(data=strategies, message="获取策略列表成功")
        
    except Exception as e:
        current_app.logger.error(f"获取策略列表失败: {str(e)}")
        return utils.error(message="获取策略列表失败", code=500)

@strategy_controller.route('/test_stock_data', methods=['GET'])
def test_stock_data():
    """测试股票数据获取，用于诊断回测问题"""
    try:
        # 获取请求参数
        stock_code = request.args.get('stock_code', '')
        start_date_str = request.args.get('start_date', '')
        end_date_str = request.args.get('end_date', '')
        
        if not stock_code:
            return utils.error(message="股票代码不能为空", code=400)
            
        current_app.logger.info(f"测试获取股票数据: {stock_code}, {start_date_str} - {end_date_str}")
        
        # 设置默认日期
        if not start_date_str:
            start_date = datetime.now() - timedelta(days=180)
        else:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            
        if not end_date_str:
            end_date = datetime.now()
        else:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        
        # 尝试获取股票数据
        try:
            from app.services.backtest_service import BacktestService
            stock_data = BacktestService.get_stock_data(stock_code, start_date, end_date)
            
            # 转换为字典格式
            data_dict = {
                'success': True,
                'stock_code': stock_code,
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'data_length': len(stock_data),
                'first_rows': stock_data.head(3).reset_index().to_dict('records') if not stock_data.empty else [],
                'last_rows': stock_data.tail(3).reset_index().to_dict('records') if not stock_data.empty else []
            }
            
            current_app.logger.info(f"成功获取股票数据，共 {len(stock_data)} 条记录")
            
            return utils.success(data=data_dict, message="获取股票数据成功")
            
        except Exception as e:
            current_app.logger.error(f"获取股票数据失败: {str(e)}")
            return utils.error(message=f"获取股票数据失败: {str(e)}", code=400)
        
    except Exception as e:
        current_app.logger.error(f"测试股票数据获取失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f"测试股票数据获取失败: {str(e)}", code=500) 