from datetime import datetime
from app.models.db import db

class FundAnalysisHistory(db.Model):
    """基金AI分析历史模型"""
    __tablename__ = 'fund_analysis_history'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False, comment='用户ID')
    question = db.Column(db.Text, nullable=False, comment='用户提问')
    answer = db.Column(db.Text, nullable=False, comment='AI回答')
    fund_code = db.Column(db.String(10), comment='相关基金代码')
    fund_name = db.Column(db.String(50), comment='相关基金名称')
    model_name = db.Column(db.String(50), comment='使用的AI模型名称')
    created_at = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    
    # 创建索引
    __table_args__ = (
        db.Index('idx_user_id', 'user_id'),
        db.Index('idx_fund_code', 'fund_code'),
        db.Index('idx_created_at', 'created_at'),
    )
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'question': self.question,
            'answer': self.answer,
            'fund_code': self.fund_code,
            'fund_name': self.fund_name,
            'model_name': self.model_name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
