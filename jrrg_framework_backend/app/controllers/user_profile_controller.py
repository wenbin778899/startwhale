from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import traceback
from sqlalchemy.exc import IntegrityError

from app.models import db, UserQuestionnaire, UserIndustryPreference, UserTradingHabit, User
import app.utils as utils

# 创建用户画像蓝图
user_profile_controller = Blueprint('user_profile_controller', __name__)

@user_profile_controller.route('/questionnaire', methods=['POST'])
@jwt_required()
def submit_questionnaire():
    """提交用户问卷"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # 记录输入数据，便于调试
        current_app.logger.info(f"用户{user_id}提交问卷数据: {data}")
        
        # 验证必填字段
        required_fields = ['risk_tolerance', 'investment_horizon', 'investment_style', 
                           'income_requirement', 'liquidity_need']
        
        for field in required_fields:
            if field not in data or not data[field]:
                return utils.error(message=f"{field} 不能为空", code=400)
        
        # 检查风险承受能力是否在有效范围内
        if not (1 <= data['risk_tolerance'] <= 5):
            return utils.error(message="风险承受能力必须在1-5范围内", code=400)
        
        # 查找是否已有问卷
        questionnaire = UserQuestionnaire.query.filter_by(user_id=user_id).first()
        
        if questionnaire:
            # 更新现有问卷
            current_app.logger.info(f"更新用户{user_id}的现有问卷")
            questionnaire.risk_tolerance = data['risk_tolerance']
            questionnaire.investment_horizon = data['investment_horizon']
            questionnaire.investment_style = data['investment_style']
            questionnaire.income_requirement = data['income_requirement']
            questionnaire.liquidity_need = data['liquidity_need']
            questionnaire.avg_investment_amount = data.get('avg_investment_amount')
            questionnaire.market_experience = data.get('market_experience')
        else:
            # 创建新问卷
            current_app.logger.info(f"创建用户{user_id}的新问卷")
            questionnaire = UserQuestionnaire(
                user_id=user_id,
                risk_tolerance=data['risk_tolerance'],
                investment_horizon=data['investment_horizon'],
                investment_style=data['investment_style'],
                income_requirement=data['income_requirement'],
                liquidity_need=data['liquidity_need'],
                avg_investment_amount=data.get('avg_investment_amount'),
                market_experience=data.get('market_experience')
            )
            db.session.add(questionnaire)
        
        # 处理行业偏好
        if 'industry_preferences' in data and isinstance(data['industry_preferences'], list):
            current_app.logger.info(f"处理用户{user_id}的行业偏好数据: {data['industry_preferences']}")
            # 先删除现有偏好
            UserIndustryPreference.query.filter_by(user_id=user_id).delete()
            
            # 添加新偏好
            added_prefs = 0
            for pref in data['industry_preferences']:
                if 'industry_name' in pref and 'preference_level' in pref:
                    try:
                        industry_name = pref['industry_name']
                        # 确保preference_level是整数
                        preference_level = int(pref['preference_level'])
                        
                        # 验证preference_level是否在有效范围内
                        if not (1 <= preference_level <= 5):
                            current_app.logger.warning(f"行业{industry_name}的偏好值{preference_level}超出范围，将调整到1-5")
                            preference_level = max(1, min(5, preference_level))
                        
                        industry_pref = UserIndustryPreference(
                            user_id=user_id,
                            industry_name=industry_name,
                            preference_level=preference_level
                        )
                        db.session.add(industry_pref)
                        added_prefs += 1
                    except ValueError as ve:
                        current_app.logger.error(f"处理行业偏好数据出错: {str(ve)}")
                    except Exception as e:
                        current_app.logger.error(f"添加行业偏好时出错: {str(e)}")
                else:
                    current_app.logger.warning(f"行业偏好数据格式不正确: {pref}")
            
            current_app.logger.info(f"成功添加{added_prefs}个行业偏好")
        else:
            current_app.logger.warning(f"未找到有效的行业偏好数据")
        
        # 处理交易习惯
        if 'trading_habits' in data and isinstance(data['trading_habits'], dict):
            habits = data['trading_habits']
            current_app.logger.info(f"处理用户{user_id}的交易习惯数据: {habits}")
            # 查找现有交易习惯
            trading_habit = UserTradingHabit.query.filter_by(user_id=user_id).first()
            
            if trading_habit:
                # 更新现有习惯
                current_app.logger.info(f"更新用户{user_id}的现有交易习惯")
                for key, value in habits.items():
                    if hasattr(trading_habit, key):
                        try:
                            # 根据字段类型转换值
                            if key in ['avg_holding_period', 'technical_analysis_reliance', 
                                      'fundamental_analysis_reliance', 'news_sensitivity']:
                                value = int(value) if value is not None else None
                            elif key in ['stop_loss_percentage', 'profit_taking_percentage']:
                                value = float(value) if value is not None else None
                                
                            setattr(trading_habit, key, value)
                            current_app.logger.debug(f"设置交易习惯字段{key}={value}")
                        except (ValueError, TypeError) as e:
                            current_app.logger.error(f"交易习惯字段{key}值{value}格式错误: {str(e)}")
                    else:
                        current_app.logger.warning(f"未知的交易习惯字段: {key}")
            else:
                # 创建新习惯
                current_app.logger.info(f"创建用户{user_id}的新交易习惯")
                try:
                    # 确保数据类型正确
                    avg_holding_period = int(habits.get('avg_holding_period')) if habits.get('avg_holding_period') is not None else None
                    stop_loss_percentage = float(habits.get('stop_loss_percentage')) if habits.get('stop_loss_percentage') is not None else None
                    profit_taking_percentage = float(habits.get('profit_taking_percentage')) if habits.get('profit_taking_percentage') is not None else None
                    technical_analysis_reliance = int(habits.get('technical_analysis_reliance')) if habits.get('technical_analysis_reliance') is not None else None
                    fundamental_analysis_reliance = int(habits.get('fundamental_analysis_reliance')) if habits.get('fundamental_analysis_reliance') is not None else None
                    news_sensitivity = int(habits.get('news_sensitivity')) if habits.get('news_sensitivity') is not None else None
                    
                    trading_habit = UserTradingHabit(
                        user_id=user_id,
                        avg_holding_period=avg_holding_period,
                        preferred_trading_time=habits.get('preferred_trading_time'),
                        stop_loss_percentage=stop_loss_percentage,
                        profit_taking_percentage=profit_taking_percentage,
                        technical_analysis_reliance=technical_analysis_reliance,
                        fundamental_analysis_reliance=fundamental_analysis_reliance,
                        news_sensitivity=news_sensitivity
                    )
                    db.session.add(trading_habit)
                    current_app.logger.info(f"已创建交易习惯记录")
                except (ValueError, TypeError) as e:
                    current_app.logger.error(f"创建交易习惯记录时类型转换错误: {str(e)}")
        else:
            current_app.logger.warning(f"未找到有效的交易习惯数据")
        
        try:
            db.session.commit()
            current_app.logger.info(f"用户{user_id}的问卷数据已成功保存到数据库")
            return utils.success(message="问卷提交成功")
        except IntegrityError as ie:
            db.session.rollback()
            current_app.logger.error(f"数据库完整性错误: {str(ie)}")
            return utils.error(message=f"提交失败: 数据完整性错误", code=500)
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"提交问卷时数据库错误: {str(e)}")
            return utils.error(message=f"提交失败: 数据库错误", code=500)
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"问卷提交失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f"问卷提交失败: {str(e)}", code=500)

@user_profile_controller.route('/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    """获取用户画像数据"""
    try:
        user_id = get_jwt_identity()
        
        # 获取用户基本信息
        user = User.query.get(user_id)
        if not user:
            return utils.error(message="用户不存在", code=404)
        
        # 获取问卷数据
        questionnaire = UserQuestionnaire.query.filter_by(user_id=user_id).first()
        questionnaire_data = questionnaire.to_dict() if questionnaire else None
        
        # 获取行业偏好
        industry_preferences = UserIndustryPreference.query.filter_by(user_id=user_id).all()
        industry_data = [pref.to_dict() for pref in industry_preferences]
        
        # 获取交易习惯
        trading_habit = UserTradingHabit.query.filter_by(user_id=user_id).first()
        trading_data = trading_habit.to_dict() if trading_habit else None
        
        # 获取自选股票信息
        from app.models import FavoriteStock
        favorite_stocks = FavoriteStock.query.filter_by(user_id=user_id).all()
        favorite_data = [stock.to_dict() for stock in favorite_stocks]
        
        # 返回组合数据
        profile_data = {
            'user_info': {
                'username': user.username,
                'nickname': user.nickname,
                'email': user.email
            },
            'questionnaire': questionnaire_data,
            'industry_preferences': industry_data,
            'trading_habits': trading_data,
            'favorite_stocks': favorite_data
        }
        
        return utils.success(data=profile_data, message="获取用户画像成功")
    
    except Exception as e:
        current_app.logger.error(f"获取用户画像失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f"获取用户画像失败: {str(e)}", code=500) 