from .db import db
from datetime import datetime

class UserQuestionnaire(db.Model):
    __tablename__ = 'user_questionnaire'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    risk_tolerance = db.Column(db.Integer, nullable=False)  # 1-5
    investment_horizon = db.Column(db.String(20), nullable=False)  # 短期/中期/长期
    investment_style = db.Column(db.String(20), nullable=False)  # 价值/成长/混合
    income_requirement = db.Column(db.String(20), nullable=False)  # 低/中/高
    liquidity_need = db.Column(db.String(20), nullable=False)  # 低/中/高
    avg_investment_amount = db.Column(db.Numeric(12, 2))
    market_experience = db.Column(db.Integer)
    last_updated = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'risk_tolerance': self.risk_tolerance,
            'investment_horizon': self.investment_horizon,
            'investment_style': self.investment_style,
            'income_requirement': self.income_requirement,
            'liquidity_need': self.liquidity_need,
            'avg_investment_amount': float(self.avg_investment_amount) if self.avg_investment_amount else None,
            'market_experience': self.market_experience,
            'last_updated': self.last_updated.strftime('%Y-%m-%d %H:%M:%S')
        }

class UserIndustryPreference(db.Model):
    __tablename__ = 'user_industry_preference'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    industry_name = db.Column(db.String(50), nullable=False)
    preference_level = db.Column(db.Integer, nullable=False)  # 1-5
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'industry_name': self.industry_name,
            'preference_level': self.preference_level,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class UserTradingHabit(db.Model):
    __tablename__ = 'user_trading_habit'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    avg_holding_period = db.Column(db.Integer)
    preferred_trading_time = db.Column(db.String(20))
    stop_loss_percentage = db.Column(db.Numeric(5, 2))
    profit_taking_percentage = db.Column(db.Numeric(5, 2))
    technical_analysis_reliance = db.Column(db.Integer)  # 1-5
    fundamental_analysis_reliance = db.Column(db.Integer)  # 1-5
    news_sensitivity = db.Column(db.Integer)  # 1-5
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'avg_holding_period': self.avg_holding_period,
            'preferred_trading_time': self.preferred_trading_time,
            'stop_loss_percentage': float(self.stop_loss_percentage) if self.stop_loss_percentage else None,
            'profit_taking_percentage': float(self.profit_taking_percentage) if self.profit_taking_percentage else None,
            'technical_analysis_reliance': self.technical_analysis_reliance,
            'fundamental_analysis_reliance': self.fundamental_analysis_reliance,
            'news_sensitivity': self.news_sensitivity,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S')
        } 