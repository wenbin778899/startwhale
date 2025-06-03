from datetime import datetime
import json
from app.models.db import db

class BacktestRecord(db.Model):
    """回测记录模型"""
    __tablename__ = 'backtest_records'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='主键ID')
    user_id = db.Column(db.Integer, nullable=False, comment='用户ID')
    strategy_name = db.Column(db.String(100), nullable=False, comment='策略名称')
    stock_code = db.Column(db.String(10), nullable=False, comment='股票代码')
    stock_name = db.Column(db.String(50), nullable=False, comment='股票名称')
    start_date = db.Column(db.Date, nullable=False, comment='回测开始日期')
    end_date = db.Column(db.Date, nullable=False, comment='回测结束日期')
    initial_cash = db.Column(db.Numeric(12, 2), nullable=False, comment='初始资金')
    final_value = db.Column(db.Numeric(12, 2), nullable=False, comment='最终价值')
    total_return = db.Column(db.Numeric(10, 4), nullable=False, comment='总收益率')
    annual_return = db.Column(db.Numeric(10, 4), comment='年化收益率')
    max_drawdown = db.Column(db.Numeric(10, 4), comment='最大回撤')
    sharpe_ratio = db.Column(db.Numeric(10, 4), comment='夏普比率')
    trade_count = db.Column(db.Integer, comment='交易次数')
    win_rate = db.Column(db.Numeric(10, 4), comment='胜率')
    strategy_params = db.Column(db.Text, comment='策略参数(JSON格式)')
    result_data = db.Column(db.Text, comment='回测结果数据(JSON格式)')
    created_at = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    
    # 关系
    trades = db.relationship('BacktestTrade', backref='backtest', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'strategy_name': self.strategy_name,
            'stock_code': self.stock_code,
            'stock_name': self.stock_name,
            'start_date': self.start_date.strftime('%Y-%m-%d') if self.start_date else None,
            'end_date': self.end_date.strftime('%Y-%m-%d') if self.end_date else None,
            'initial_cash': float(self.initial_cash) if self.initial_cash else 0,
            'final_value': float(self.final_value) if self.final_value else 0,
            'total_return': float(self.total_return) if self.total_return else 0,
            'annual_return': float(self.annual_return) if self.annual_return else 0,
            'max_drawdown': float(self.max_drawdown) if self.max_drawdown else 0,
            'sharpe_ratio': float(self.sharpe_ratio) if self.sharpe_ratio else 0,
            'trade_count': self.trade_count,
            'win_rate': float(self.win_rate) if self.win_rate else 0,
            'strategy_params': json.loads(self.strategy_params) if self.strategy_params else {},
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }

class BacktestTrade(db.Model):
    """回测交易明细模型"""
    __tablename__ = 'backtest_trades'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True, comment='主键ID')
    backtest_id = db.Column(db.Integer, db.ForeignKey('backtest_records.id'), nullable=False, comment='关联的回测记录ID')
    trade_type = db.Column(db.Enum('BUY', 'SELL'), nullable=False, comment='交易类型')
    trade_date = db.Column(db.Date, nullable=False, comment='交易日期')
    price = db.Column(db.Numeric(12, 4), nullable=False, comment='交易价格')
    size = db.Column(db.Integer, nullable=False, comment='交易数量')
    commission = db.Column(db.Numeric(12, 4), nullable=False, comment='手续费')
    pnl = db.Column(db.Numeric(12, 4), comment='收益(仅对SELL有效)')
    created_at = db.Column(db.DateTime, default=datetime.now, comment='创建时间')
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'backtest_id': self.backtest_id,
            'trade_type': self.trade_type,
            'trade_date': self.trade_date.strftime('%Y-%m-%d') if self.trade_date else None,
            'price': float(self.price) if self.price else 0,
            'size': self.size,
            'commission': float(self.commission) if self.commission else 0,
            'pnl': float(self.pnl) if self.pnl else 0,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S')
        } 