import logging
import requests
import json
import akshare as ak
import traceback
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
import time
import pandas as pd

from app.models import db, FavoriteFund, FundAnalysisHistory
import app.utils as utils

# 创建AI基金蓝图
fund_controller = Blueprint('fund_controller', __name__)

# AI模型配置（复用AI股市的配置）
AI_MODEL_URL = "https://api.deepseek.com/"  # Deepseek API 端点
AI_API_KEY = "sk-b1f5f2e0558a4b5daca6b20d2b68f9c4"  # API Key

@fund_controller.before_request
def log_request_info():
    current_app.logger.info(f"收到请求: {request.method} {request.url}")

@fund_controller.after_request
def log_response_info(response):
    current_app.logger.info(f"响应状态码: {response.status_code}")
    return response

@fund_controller.route('/favorites', methods=['GET'])
@jwt_required()
def get_favorite_funds():
    """获取用户自选基金列表"""
    try:
        user_id = get_jwt_identity()
        current_app.logger.info(f"获取用户 {user_id} 的自选基金列表")
        
        # 查询用户的自选基金，按添加时间降序排列
        favorite_funds = db.session.query(FavoriteFund).filter_by(
            user_id=user_id
        ).order_by(FavoriteFund.created_at.desc()).all()
        
        # 转换为字典格式
        funds_data = [fund.to_dict() for fund in favorite_funds]
        
        current_app.logger.info(f"用户 {user_id} 共有 {len(funds_data)} 只自选基金")
        return utils.success(data=funds_data, message="获取自选基金列表成功")
        
    except Exception as e:
        current_app.logger.error(f"获取自选基金列表失败: {str(e)}")
        return utils.error(message="获取自选基金列表失败", code=500)

@fund_controller.route('/favorites', methods=['POST'])
@jwt_required()
def add_favorite_fund():
    """添加自选基金"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # 安全地获取参数，确保转换为字符串
        fund_code = str(data.get('fund_code', '')).strip() if data.get('fund_code') is not None else ''
        fund_name = str(data.get('fund_name', '')).strip() if data.get('fund_name') is not None else ''
        note = str(data.get('note', '')).strip() if data.get('note', '') is not None else ''
        
        if not fund_code or not fund_name:
            return utils.error(message="基金代码和名称不能为空", code=400)
        
        current_app.logger.info(f"用户 {user_id} 添加自选基金: {fund_code} - {fund_name}")
        
        # 检查是否已经存在
        existing_fund = db.session.query(FavoriteFund).filter_by(
            user_id=user_id,
            fund_code=fund_code
        ).first()
        
        if existing_fund:
            return utils.error(message="该基金已在自选列表中", code=400)
        
        # 创建新的自选基金记录
        new_favorite = FavoriteFund(
            user_id=user_id,
            fund_code=fund_code,
            fund_name=fund_name,
            note=note
        )
        
        db.session.add(new_favorite)
        db.session.commit()
        
        current_app.logger.info(f"用户 {user_id} 成功添加自选基金: {fund_code}")
        return utils.success(data=new_favorite.to_dict(), message="添加自选基金成功")
        
    except IntegrityError:
        db.session.rollback()
        return utils.error(message="该基金已在自选列表中", code=400)
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"添加自选基金失败: {str(e)}")
        return utils.error(message="添加自选基金失败", code=500)

@fund_controller.route('/favorites/<fund_code>', methods=['DELETE'])
@jwt_required()
def remove_favorite_fund(fund_code):
    """删除自选基金"""
    try:
        user_id = get_jwt_identity()
        current_app.logger.info(f"用户 {user_id} 删除自选基金: {fund_code}")
        
        # 查找要删除的基金
        favorite_fund = db.session.query(FavoriteFund).filter_by(
            user_id=user_id,
            fund_code=fund_code
        ).first()
        
        if not favorite_fund:
            return utils.error(message="自选基金不存在", code=404)
        
        # 删除记录
        db.session.delete(favorite_fund)
        db.session.commit()
        
        current_app.logger.info(f"用户 {user_id} 成功删除自选基金: {fund_code}")
        return utils.success(message="删除自选基金成功")
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"删除自选基金失败: {str(e)}")
        return utils.error(message="删除自选基金失败", code=500)

@fund_controller.route('/favorites/<fund_code>/note', methods=['PUT'])
@jwt_required()
def update_favorite_fund_note(fund_code):
    """更新自选基金备注"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        note = data.get('note', '').strip()
        
        current_app.logger.info(f"用户 {user_id} 更新自选基金 {fund_code} 的备注")
        
        # 查找基金
        favorite_fund = db.session.query(FavoriteFund).filter_by(
            user_id=user_id,
            fund_code=fund_code
        ).first()
        
        if not favorite_fund:
            return utils.error(message="自选基金不存在", code=404)
        
        # 更新备注
        favorite_fund.note = note
        db.session.commit()
        
        current_app.logger.info(f"用户 {user_id} 成功更新自选基金 {fund_code} 的备注")
        return utils.success(data=favorite_fund.to_dict(), message="更新备注成功")
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"更新自选基金备注失败: {str(e)}")
        return utils.error(message="更新备注失败", code=500)

@fund_controller.route('/info/<fund_code>', methods=['GET'])
@jwt_required()
def get_fund_info(fund_code):
    """获取基金基本信息"""
    try:
        user_id = get_jwt_identity()
        current_app.logger.info(f"用户 {user_id} 获取基金 {fund_code} 基本信息")
        
        # 调用akshare获取基金信息
        try:
            # 设置超时时间较长
            timeout = 25  # 25秒超时
            current_app.logger.info(f"开始获取基金 {fund_code} 信息，设置超时时间: {timeout}秒")
            
            # 获取基金信息，添加计时
            start_time = time.time()
            fund_info = ak.fund_individual_basic_info_xq(symbol=fund_code)
            elapsed_time = time.time() - start_time
            current_app.logger.info(f"获取基金 {fund_code} 信息成功，耗时: {elapsed_time:.2f}秒")
            
            # 检查返回数据的有效性
            if fund_info is None or not isinstance(fund_info, pd.DataFrame) or fund_info.empty:
                current_app.logger.error(f"获取基金 {fund_code} 信息返回空数据或无效数据")
                return utils.error(message="无法获取基金信息，请检查基金代码是否正确", code=400)
            
            # 转换为字典格式，特别处理NA值
            fund_data = {}
            for _, row in fund_info.iterrows():
                try:
                    # 使用pd.isna()和pd.isnull()函数检查NA值
                    # 这些函数可以处理各种类型的NA值，包括None, np.nan, pd.NA等
                    
                    # 检查item是否为NA
                    if pd.isna(row['item']) or pd.isnull(row['item']):
                        key = "未知项目"
                    else:
                        key = str(row['item'])
                    
                    # 检查value是否为NA
                    if pd.isna(row['value']) or pd.isnull(row['value']):
                        value = "无数据"
                    else:
                        try:
                            # 尝试转换为字符串
                            value = str(row['value'])
                        except:
                            # 如果转换失败，使用安全的默认值
                            value = "无法显示的数据"
                    
                    fund_data[key] = value
                except Exception as item_error:
                    current_app.logger.error(f"处理基金数据项出错: {str(item_error)}")
                    # 继续处理下一项，确保一个错误项不影响整体
                    continue
            
            # 检查是否有至少一个有效的数据项
            if not fund_data:
                current_app.logger.error(f"处理后的基金数据为空")
                return utils.error(message="基金数据处理后为空，无法获取有效信息", code=400)
            
            current_app.logger.info(f"成功获取基金 {fund_code} 基本信息，共 {len(fund_data)} 项")
            return utils.success(data=fund_data, message="获取基金信息成功")
            
        except Exception as ak_error:
            current_app.logger.error(f"调用akshare获取基金信息失败: {str(ak_error)}")
            current_app.logger.error(traceback.format_exc())
            
            # 提供更具体的错误信息
            error_msg = str(ak_error)
            if "NAType" in error_msg:
                return utils.error(message="获取基金信息失败：数据格式不兼容，请稍后再试", code=400)
            elif "timeout" in error_msg.lower():
                return utils.error(message="获取基金信息超时，请稍后再试", code=408)
            else:
                return utils.error(message=f"获取基金信息失败，请检查基金代码是否正确", code=400)
            
    except Exception as e:
        current_app.logger.error(f"获取基金信息失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message="获取基金信息失败，服务器内部错误", code=500)

@fund_controller.route('/search', methods=['GET'])
@jwt_required()
def search_fund():
    """搜索基金"""
    try:
        user_id = get_jwt_identity()
        keyword = request.args.get('keyword', '').strip()
        
        if not keyword:
            return utils.error(message="搜索关键词不能为空", code=400)
        
        current_app.logger.info(f"用户 {user_id} 搜索基金: {keyword}")
        
        try:
            # 设置超时时间较长，因为akshare查询可能需要较长时间
            timeout = 25  # 25秒超时
            current_app.logger.info(f"开始获取基金列表，设置超时时间: {timeout}秒")
            
            # 获取基金列表，增加超时参数
            start_time = time.time()
            fund_list = ak.fund_name_em()
            elapsed_time = time.time() - start_time
            current_app.logger.info(f"获取基金列表成功，耗时: {elapsed_time:.2f}秒")
            
            if fund_list is None or not isinstance(fund_list, pd.DataFrame) or fund_list.empty:
                current_app.logger.error("获取基金列表返回空数据或无效数据")
                return utils.error(message="无法获取基金列表，请稍后重试", code=500)
            
            # 记录基金列表的大小
            current_app.logger.info(f"基金列表大小: {len(fund_list)} 条记录")
            
            # 筛选匹配的基金
            try:
                # 使用更安全的方式筛选
                matched_funds = fund_list[
                    fund_list['基金代码'].astype(str).str.contains(keyword) | 
                    fund_list['基金简称'].astype(str).str.contains(keyword)
                ]
            except Exception as filter_error:
                current_app.logger.error(f"筛选基金数据出错: {str(filter_error)}")
                # 回退到更简单的筛选方法
                matched_funds = fund_list[fund_list['基金代码'].str.contains(keyword, na=False)]
                
            # 限制返回数量
            matched_funds = matched_funds.head(10)
            
            # 转换为字典列表
            result = []
            for _, row in matched_funds.iterrows():
                result.append({
                    'fund_code': row['基金代码'],
                    'fund_name': row['基金简称'],
                    'fund_type': row['基金类型'] if '基金类型' in row else '未知'
                })
            
            current_app.logger.info(f"搜索基金结果: 找到 {len(result)} 条匹配记录")
            return utils.success(data=result, message="搜索基金成功")
            
        except Exception as ak_error:
            current_app.logger.error(f"调用akshare搜索基金失败: {str(ak_error)}")
            current_app.logger.error(traceback.format_exc())
            return utils.error(message=f"搜索基金失败，请稍后重试。详细错误: {str(ak_error)[:100]}", code=500)
            
    except Exception as e:
        current_app.logger.error(f"搜索基金失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message="搜索基金失败，服务器内部错误", code=500)

@fund_controller.route('/ai-analysis', methods=['POST'])
@jwt_required()
def ai_fund_analysis():
    """AI基金分析接口"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        prompt = data.get('prompt', '').strip()
        fund_code = data.get('fund_code')
        
        if not prompt:
            return utils.error(message="分析问题不能为空", code=400)
        
        current_app.logger.info(f"用户 {user_id} 请求基金AI分析: {prompt[:100]}...")
        
        # 获取基金信息
        fund_name = None
        fund_info = None
        
        if fund_code:
            # 查询自选基金获取名称
            favorite_fund = db.session.query(FavoriteFund).filter_by(
                user_id=user_id,
                fund_code=fund_code
            ).first()
            
            if favorite_fund:
                fund_name = favorite_fund.fund_name
            
            # 尝试获取基金详细信息
            try:
                fund_info_df = ak.fund_individual_basic_info_xq(symbol=fund_code)
                print(fund_info_df, fund_code)
                fund_info = {}
                for _, row in fund_info_df.iterrows():
                    # 处理NA值问题
                    if pd.isna(row['item']) or pd.isnull(row['item']):
                        key = "未知项目"
                    else:
                        key = str(row['item'])
                        
                    if pd.isna(row['value']) or pd.isnull(row['value']):
                        value = "无数据"
                    else:
                        try:
                            value = str(row['value'])
                        except:
                            value = "无法显示的数据"
                    
                    fund_info[key] = value
            except Exception as info_error:
                current_app.logger.error(f"获取基金信息失败: {str(info_error)}")
                # 获取基金信息失败不影响AI分析
                fund_info = None
        
        # 构建Deepseek AI请求
        system_prompt = "你是一个专业的基金投资分析师，请基于用户的问题提供专业、客观的分析建议。请用中文回答，内容要详细且具有实用性。"
        
        user_prompt = prompt
        if fund_code and fund_info:
            # 添加基金信息到提示中
            user_prompt = f"基金代码: {fund_code}\n基金名称: {fund_info.get('基金名称', fund_name)}\n"
            user_prompt += f"基金类型: {fund_info.get('基金类型', '')}\n"
            user_prompt += f"基金评级: {fund_info.get('基金评级', '')}\n"
            user_prompt += f"投资策略: {fund_info.get('投资策略', '')}\n\n"
            user_prompt += prompt
        
        ai_request_data = {
            "model": "deepseek-chat",  # Deepseek聊天模型
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
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
        
        current_app.logger.info("向Deepseek AI服务发送基金分析请求")
        
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
                
                # 保存分析历史
                try:
                    analysis_history = FundAnalysisHistory(
                        user_id=user_id,
                        question=prompt,
                        answer=analysis_result,
                        fund_code=fund_code,
                        fund_name=fund_name,
                        model_name="deepseek-chat"
                    )
                    db.session.add(analysis_history)
                    db.session.commit()
                    current_app.logger.info(f"保存用户 {user_id} 的基金分析历史成功")
                except Exception as save_error:
                    current_app.logger.error(f"保存基金分析历史失败: {str(save_error)}")
                    # 即使保存历史失败，也要返回分析结果
                    db.session.rollback()
                
                return utils.success(
                    data={
                        'analysis': analysis_result,
                        'fund_code': fund_code,
                        'fund_name': fund_name
                    },
                    message="基金AI分析完成"
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
        current_app.logger.error(f"基金AI分析失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message="基金AI分析失败，请稍后重试", code=500)

@fund_controller.route('/analysis-history', methods=['GET'])
@jwt_required()
def get_fund_analysis_history():
    """获取用户的基金AI分析历史"""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 10, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # 限制查询数量，最多100条
        limit = min(limit, 100)
        
        current_app.logger.info(f"获取用户 {user_id} 的基金分析历史，限制 {limit} 条，偏移 {offset} 条")
        
        # 查询分析历史，按时间降序排列
        history_list = db.session.query(FundAnalysisHistory).filter_by(
            user_id=user_id
        ).order_by(FundAnalysisHistory.created_at.desc()).offset(offset).limit(limit).all()
        
        # 获取总记录数，用于分页
        total_count = db.session.query(FundAnalysisHistory).filter_by(user_id=user_id).count()
        
        # 转换为字典格式
        history_data = [history.to_dict() for history in history_list]
        
        current_app.logger.info(f"用户 {user_id} 共有 {total_count} 条基金分析历史，本次返回 {len(history_data)} 条")
        return utils.success(
            data=history_data, 
            message="获取基金分析历史成功",
            meta={
                "total": total_count,
                "limit": limit,
                "offset": offset
            }
        )
        
    except Exception as e:
        current_app.logger.error(f"获取基金分析历史失败: {str(e)}")
        return utils.error(message="获取基金分析历史失败", code=500)

@fund_controller.route('/save-analysis-history', methods=['POST'])
@jwt_required()
def save_fund_analysis_history():
    """保存基金分析历史记录（供前端直接调用大模型后使用）"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return utils.error(message="请求体不能为空", code=400)
        
        question = data.get('question', '').strip()
        answer = data.get('answer', '').strip()
        fund_code = data.get('fund_code')
        model_name = data.get('model_name', 'deepseek-chat')
        
        if not question or not answer:
            return utils.error(message="问题或回答不能为空", code=400)
            
        current_app.logger.info(f"保存用户 {user_id} 的基金分析历史记录")
        
        # 获取基金信息
        fund_name = None
        if fund_code:
            favorite_fund = db.session.query(FavoriteFund).filter_by(
                user_id=user_id,
                fund_code=fund_code
            ).first()
            if favorite_fund:
                fund_name = favorite_fund.fund_name
        
        # 创建分析历史记录
        try:
            analysis_history = FundAnalysisHistory(
                user_id=user_id,
                question=question,
                answer=answer,
                fund_code=fund_code,
                fund_name=fund_name,
                model_name=model_name
            )
            
            db.session.add(analysis_history)
            db.session.commit()
            
            current_app.logger.info(f"用户 {user_id} 的基金分析历史记录保存成功，ID: {analysis_history.id}")
            return utils.success(message="基金分析历史记录保存成功")
        except Exception as db_error:
            db.session.rollback()
            current_app.logger.error(f"数据库错误: {str(db_error)}")
            return utils.error(message=f"保存到数据库失败: {str(db_error)}", code=500)
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"保存基金分析历史记录失败: {str(e)}")
        return utils.error(message=f"保存基金分析历史记录失败: {str(e)}", code=500)
