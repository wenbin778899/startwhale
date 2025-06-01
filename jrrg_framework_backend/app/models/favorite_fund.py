from datetime import datetime
from app.models.db import db

class FavoriteFund(db.Model):
    """用户自选基金模型"""
    __tablename__ = 'favorite_funds'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False, comment='用户ID')
    fund_code = db.Column(db.String(10), nullable=False, comment='基金代码')
    fund_name = db.Column(db.String(50), nullable=False, comment='基金名称')
    note = db.Column(db.Text, comment='用户备注')
    created_at = db.Column(db.DateTime, default=datetime.now, comment='添加时间')
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, comment='更新时间')
    
    # 创建唯一索引，同一用户不能重复添加同一基金
    __table_args__ = (
        db.UniqueConstraint('user_id', 'fund_code', name='unique_user_fund'),
        db.Index('idx_user_id', 'user_id'),
        db.Index('idx_fund_code', 'fund_code'),
    )
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'fund_code': self.fund_code,
            'fund_name': self.fund_name,
            'note': self.note,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
