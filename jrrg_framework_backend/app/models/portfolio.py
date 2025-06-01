from app.models import db
from datetime import datetime

class UserPortfolio(db.Model):
    """用户持仓组合表模型"""
    __tablename__ = 'user_portfolio'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False)
    portfolio_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500))
    create_time = db.Column(db.TIMESTAMP, default=datetime.now)
    update_time = db.Column(db.TIMESTAMP, default=datetime.now, onupdate=datetime.now)
    total_investment = db.Column(db.DECIMAL(14, 2), default=0)
    current_value = db.Column(db.DECIMAL(14, 2), default=0)
    profit_loss = db.Column(db.DECIMAL(14, 2), default=0)
    profit_loss_rate = db.Column(db.DECIMAL(8, 4), default=0)
    
    # 关联关系
    stocks = db.relationship('PortfolioStock', backref='portfolio', lazy='dynamic', cascade='all, delete-orphan')
    trades = db.relationship('TradeRecord', backref='portfolio', lazy='dynamic', cascade='all, delete-orphan')
    statistics = db.relationship('PortfolioStatistics', backref='portfolio', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        """将模型转换为字典"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'portfolio_name': self.portfolio_name,
            'description': self.description,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S'),
            'update_time': self.update_time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_investment': str(self.total_investment) if self.total_investment is not None else "0",
            'current_value': str(self.current_value) if self.current_value is not None else "0",
            'profit_loss': str(self.profit_loss) if self.profit_loss is not None else "0",
            'profit_loss_rate': str(self.profit_loss_rate) if self.profit_loss_rate is not None else "0"
        }


class PortfolioStock(db.Model):
    """持仓股票明细表模型"""
    __tablename__ = 'portfolio_stock'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('user_portfolio.id'), nullable=False)
    stock_code = db.Column(db.String(10), nullable=False)
    stock_name = db.Column(db.String(100), nullable=False)
    total_shares = db.Column(db.DECIMAL(14, 2), nullable=False)
    avg_cost_price = db.Column(db.DECIMAL(10, 4), nullable=False)
    current_price = db.Column(db.DECIMAL(10, 4), default=0)
    position_value = db.Column(db.DECIMAL(14, 2), default=0)
    profit_loss = db.Column(db.DECIMAL(14, 2), default=0)
    profit_loss_rate = db.Column(db.DECIMAL(8, 4), default=0)
    create_time = db.Column(db.TIMESTAMP, default=datetime.now)
    update_time = db.Column(db.TIMESTAMP, default=datetime.now, onupdate=datetime.now)
    
    # 唯一索引约束
    __table_args__ = (
        db.UniqueConstraint('portfolio_id', 'stock_code', name='unique_portfolio_stock'),
    )
    
    def to_dict(self):
        """将模型转换为字典"""
        return {
            'id': self.id,
            'portfolio_id': self.portfolio_id,
            'stock_code': self.stock_code,
            'stock_name': self.stock_name,
            'total_shares': str(self.total_shares) if self.total_shares is not None else "0",
            'avg_cost_price': str(self.avg_cost_price) if self.avg_cost_price is not None else "0",
            'current_price': str(self.current_price) if self.current_price is not None else "0",
            'position_value': str(self.position_value) if self.position_value is not None else "0",
            'profit_loss': str(self.profit_loss) if self.profit_loss is not None else "0",
            'profit_loss_rate': str(self.profit_loss_rate) if self.profit_loss_rate is not None else "0",
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S'),
            'update_time': self.update_time.strftime('%Y-%m-%d %H:%M:%S')
        }


class TradeRecord(db.Model):
    """交易记录表模型"""
    __tablename__ = 'trade_record'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('user_portfolio.id'), nullable=False)
    stock_code = db.Column(db.String(10), nullable=False)
    stock_name = db.Column(db.String(100), nullable=False)
    trade_type = db.Column(db.Enum('buy', 'sell'), nullable=False)
    trade_price = db.Column(db.DECIMAL(10, 4), nullable=False)
    trade_shares = db.Column(db.DECIMAL(14, 2), nullable=False)
    trade_amount = db.Column(db.DECIMAL(14, 2), nullable=False)
    trade_fee = db.Column(db.DECIMAL(10, 2), default=0)
    trade_time = db.Column(db.TIMESTAMP, default=datetime.now)
    trade_note = db.Column(db.String(500))
    
    def to_dict(self):
        """将模型转换为字典"""
        return {
            'id': self.id,
            'portfolio_id': self.portfolio_id,
            'stock_code': self.stock_code,
            'stock_name': self.stock_name,
            'trade_type': self.trade_type,
            'trade_price': str(self.trade_price) if self.trade_price else "0",
            'trade_shares': str(self.trade_shares) if self.trade_shares else "0",
            'trade_amount': str(self.trade_amount) if self.trade_amount else "0",
            'trade_fee': str(self.trade_fee) if self.trade_fee else "0",
            'trade_time': self.trade_time.strftime('%Y-%m-%d %H:%M:%S'),
            'trade_note': self.trade_note
        }


class PortfolioStatistics(db.Model):
    """持仓统计表模型"""
    __tablename__ = 'portfolio_statistics'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    portfolio_id = db.Column(db.Integer, db.ForeignKey('user_portfolio.id'), nullable=False)
    statistics_date = db.Column(db.Date, nullable=False)
    total_value = db.Column(db.DECIMAL(14, 2), nullable=False)
    daily_profit_loss = db.Column(db.DECIMAL(14, 2), default=0)
    daily_profit_loss_rate = db.Column(db.DECIMAL(8, 4), default=0)
    total_profit_loss = db.Column(db.DECIMAL(14, 2), default=0)
    total_profit_loss_rate = db.Column(db.DECIMAL(8, 4), default=0)
    
    # 唯一索引约束
    __table_args__ = (
        db.UniqueConstraint('portfolio_id', 'statistics_date', name='unique_portfolio_date'),
    )
    
    def to_dict(self):
        """将模型转换为字典"""
        return {
            'id': self.id,
            'portfolio_id': self.portfolio_id,
            'statistics_date': self.statistics_date.strftime('%Y-%m-%d'),
            'total_value': str(self.total_value) if self.total_value else "0",
            'daily_profit_loss': str(self.daily_profit_loss) if self.daily_profit_loss else "0",
            'daily_profit_loss_rate': str(self.daily_profit_loss_rate) if self.daily_profit_loss_rate else "0",
            'total_profit_loss': str(self.total_profit_loss) if self.total_profit_loss else "0",
            'total_profit_loss_rate': str(self.total_profit_loss_rate) if self.total_profit_loss_rate else "0"
        }


class FavoritePortfolio(db.Model):
    """关注组合表模型"""
    __tablename__ = 'favorite_portfolio'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    target_portfolio_id = db.Column(db.Integer, db.ForeignKey('user_portfolio.id'), nullable=False)
    create_time = db.Column(db.TIMESTAMP, default=datetime.now)
    
    # 唯一索引约束
    __table_args__ = (
        db.UniqueConstraint('user_id', 'target_portfolio_id', name='unique_user_portfolio'),
    )
    
    # 关联关系
    target_portfolio = db.relationship('UserPortfolio', foreign_keys=[target_portfolio_id])
    
    def to_dict(self):
        """将模型转换为字典"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'target_portfolio_id': self.target_portfolio_id,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S')
        } 