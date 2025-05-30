import logging
import requests
import json
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
import traceback

from app.models import db, FavoriteStock, AnalysisHistory
import app.utils as utils

# 创建策略管理蓝图
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