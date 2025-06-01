from app.models import db
from datetime import datetime

class PortfolioFund(db.Model):
    """持仓基金明细表模型"""
    __tablename__ = 'portfolio_fund'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('user_portfolio.id'), nullable=False)
    fund_code = db.Column(db.String(10), nullable=False)
    fund_name = db.Column(db.String(100), nullable=False)
    fund_type = db.Column(db.String(20), nullable=False)
    total_shares = db.Column(db.DECIMAL(14, 4), nullable=False)
    avg_cost_nav = db.Column(db.DECIMAL(10, 6), nullable=False)
    current_nav = db.Column(db.DECIMAL(10, 6), default=0)
    position_value = db.Column(db.DECIMAL(14, 2), default=0)
    profit_loss = db.Column(db.DECIMAL(14, 2), default=0)
    profit_loss_rate = db.Column(db.DECIMAL(8, 4), default=0)
    create_time = db.Column(db.TIMESTAMP, default=datetime.now)
    update_time = db.Column(db.TIMESTAMP, default=datetime.now, onupdate=datetime.now)
    
    # 唯一索引约束
    __table_args__ = (
        db.UniqueConstraint('portfolio_id', 'fund_code', name='unique_portfolio_fund'),
    )
    
    def to_dict(self):
        """将模型转换为字典"""
        return {
            'id': self.id,
            'portfolio_id': self.portfolio_id,
            'fund_code': self.fund_code,
            'fund_name': self.fund_name,
            'fund_type': self.fund_type,
            'total_shares': str(self.total_shares) if self.total_shares is not None else "0",
            'avg_cost_nav': str(self.avg_cost_nav) if self.avg_cost_nav is not None else "0",
            'current_nav': str(self.current_nav) if self.current_nav is not None else "0",
            'position_value': str(self.position_value) if self.position_value is not None else "0",
            'profit_loss': str(self.profit_loss) if self.profit_loss is not None else "0",
            'profit_loss_rate': str(self.profit_loss_rate) if self.profit_loss_rate is not None else "0",
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S'),
            'update_time': self.update_time.strftime('%Y-%m-%d %H:%M:%S')
        }


class FundNavHistory(db.Model):
    """基金净值历史数据表模型"""
    __tablename__ = 'fund_nav_history'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    fund_code = db.Column(db.String(10), nullable=False)
    nav_date = db.Column(db.Date, nullable=False)
    unit_nav = db.Column(db.DECIMAL(10, 6), nullable=False)
    cumulative_nav = db.Column(db.DECIMAL(10, 6), nullable=False)
    daily_growth_rate = db.Column(db.DECIMAL(8, 4), default=None)
    purchase_status = db.Column(db.String(20), default=None)
    redeem_status = db.Column(db.String(20), default=None)
    create_time = db.Column(db.TIMESTAMP, default=datetime.now)
    update_time = db.Column(db.TIMESTAMP, default=datetime.now, onupdate=datetime.now)
    
    # 唯一索引约束
    __table_args__ = (
        db.UniqueConstraint('fund_code', 'nav_date', name='unique_fund_nav_date'),
    )
    
    def to_dict(self):
        """将模型转换为字典"""
        return {
            'id': self.id,
            'fund_code': self.fund_code,
            'nav_date': self.nav_date.strftime('%Y-%m-%d'),
            'unit_nav': str(self.unit_nav) if self.unit_nav is not None else "0",
            'cumulative_nav': str(self.cumulative_nav) if self.cumulative_nav is not None else "0",
            'daily_growth_rate': str(self.daily_growth_rate) if self.daily_growth_rate is not None else None,
            'purchase_status': self.purchase_status,
            'redeem_status': self.redeem_status,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S'),
            'update_time': self.update_time.strftime('%Y-%m-%d %H:%M:%S')
        }


class FundTradeRecord(db.Model):
    """基金交易记录表模型"""
    __tablename__ = 'fund_trade_record'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('user_portfolio.id'), nullable=False)
    fund_code = db.Column(db.String(10), nullable=False)
    fund_name = db.Column(db.String(100), nullable=False)
    trade_type = db.Column(db.Enum('buy', 'sell'), nullable=False)
    trade_nav = db.Column(db.DECIMAL(10, 6), nullable=False)
    trade_shares = db.Column(db.DECIMAL(14, 4), nullable=False)
    trade_amount = db.Column(db.DECIMAL(14, 2), nullable=False)
    trade_fee = db.Column(db.DECIMAL(10, 2), default=0)
    trade_note = db.Column(db.String(500), default=None)
    trade_date = db.Column(db.Date, nullable=False)
    create_time = db.Column(db.TIMESTAMP, default=datetime.now)
    
    def to_dict(self):
        """将模型转换为字典"""
        return {
            'id': self.id,
            'portfolio_id': self.portfolio_id,
            'fund_code': self.fund_code,
            'fund_name': self.fund_name,
            'trade_type': self.trade_type,
            'trade_nav': str(self.trade_nav) if self.trade_nav is not None else "0",
            'trade_shares': str(self.trade_shares) if self.trade_shares is not None else "0",
            'trade_amount': str(self.trade_amount) if self.trade_amount is not None else "0",
            'trade_fee': str(self.trade_fee) if self.trade_fee is not None else "0",
            'trade_note': self.trade_note,
            'trade_date': self.trade_date.strftime('%Y-%m-%d'),
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S')
        } 