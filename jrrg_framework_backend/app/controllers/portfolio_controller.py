from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import traceback
import akshare as ak
import pandas as pd
import decimal

from app.models import db
from app.models.portfolio import UserPortfolio, PortfolioStock, TradeRecord, PortfolioStatistics, FavoritePortfolio
import app.utils as utils

# 创建蓝图
portfolio_controller = Blueprint('portfolio_controller', __name__)

@portfolio_controller.before_request
def log_request_info():
    current_app.logger.info(f"收到请求: {request.method} {request.url}")

@portfolio_controller.after_request
def log_response_info(response):
    current_app.logger.info(f"响应状态码: {response.status_code}")
    return response

@portfolio_controller.route('/', methods=['GET'])
@jwt_required()
def get_portfolios():
    """
    获取当前用户的所有持仓组合
    """
    try:
        user_id = get_jwt_identity()
        
        current_app.logger.info(f"获取用户ID={user_id}的所有持仓组合")
        
        portfolios = UserPortfolio.query.filter_by(user_id=user_id).all()
        
        result = [portfolio.to_dict() for portfolio in portfolios]
        
        return utils.success(
            data=result,
            message='获取成功'
        )
        
    except Exception as e:
        current_app.logger.error(f"获取持仓组合失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'获取持仓组合失败: {str(e)}', code=500, status=500)

@portfolio_controller.route('/<int:portfolio_id>', methods=['GET'])
@jwt_required()
def get_portfolio(portfolio_id):
    """
    获取指定持仓组合的详细信息，包括持仓股票列表
    """
    try:
        user_id = get_jwt_identity()
        
        current_app.logger.info(f"获取用户ID={user_id}的持仓组合ID={portfolio_id}")
        
        # 检查持仓是否属于该用户
        portfolio = UserPortfolio.query.filter_by(id=portfolio_id, user_id=user_id).first()
        if not portfolio:
            return utils.error(message='持仓组合不存在或无权访问', code=404, status=404)
        
        # 获取持仓股票列表
        stocks = PortfolioStock.query.filter_by(portfolio_id=portfolio_id).all()
        stock_list = [stock.to_dict() for stock in stocks]
        
        # 获取持仓统计数据（最近30天）
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        
        statistics_data = PortfolioStatistics.query.filter(
            PortfolioStatistics.portfolio_id == portfolio_id,
            PortfolioStatistics.statistics_date >= start_date,
            PortfolioStatistics.statistics_date <= end_date
        ).order_by(PortfolioStatistics.statistics_date.asc()).all()
        
        statistics_list = [stat.to_dict() for stat in statistics_data]
        
        # 返回组合详情和持仓列表
        result = {
            'portfolio': portfolio.to_dict(),
            'stocks': stock_list,
            'statistics': statistics_list
        }
        
        return utils.success(
            data=result,
            message='获取成功'
        )
        
    except Exception as e:
        current_app.logger.error(f"获取持仓组合详情失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'获取持仓组合详情失败: {str(e)}', code=500, status=500)

@portfolio_controller.route('/', methods=['POST'])
@jwt_required()
def create_portfolio():
    """
    创建新的持仓组合
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # 验证必需字段
        if not data.get('portfolio_name'):
            return utils.error(message='持仓组合名称不能为空', code=400)
        
        # 创建持仓组合
        portfolio = UserPortfolio(
            user_id=user_id,
            portfolio_name=data.get('portfolio_name'),
            description=data.get('description', ''),
            total_investment=data.get('total_investment', 0),
            current_value=data.get('current_value', 0),
            profit_loss=data.get('profit_loss', 0),
            profit_loss_rate=data.get('profit_loss_rate', 0)
        )
        
        db.session.add(portfolio)
        db.session.commit()
        
        current_app.logger.info(f"用户ID={user_id}创建持仓组合成功，ID={portfolio.id}")
        
        return utils.success(
            data=portfolio.to_dict(),
            message='创建成功'
        )
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"创建持仓组合失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'创建持仓组合失败: {str(e)}', code=500, status=500)

@portfolio_controller.route('/<int:portfolio_id>', methods=['PUT'])
@jwt_required()
def update_portfolio(portfolio_id):
    """
    更新持仓组合信息
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # 检查持仓是否属于该用户
        portfolio = UserPortfolio.query.filter_by(id=portfolio_id, user_id=user_id).first()
        if not portfolio:
            return utils.error(message='持仓组合不存在或无权访问', code=404, status=404)
        
        # 更新字段
        if 'portfolio_name' in data:
            portfolio.portfolio_name = data['portfolio_name']
        if 'description' in data:
            portfolio.description = data['description']
        if 'total_investment' in data:
            portfolio.total_investment = data['total_investment']
        if 'current_value' in data:
            portfolio.current_value = data['current_value']
        if 'profit_loss' in data:
            portfolio.profit_loss = data['profit_loss']
        if 'profit_loss_rate' in data:
            portfolio.profit_loss_rate = data['profit_loss_rate']
        
        db.session.commit()
        
        current_app.logger.info(f"更新持仓组合成功，ID={portfolio.id}")
        
        return utils.success(
            data=portfolio.to_dict(),
            message='更新成功'
        )
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"更新持仓组合失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'更新持仓组合失败: {str(e)}', code=500, status=500)

@portfolio_controller.route('/<int:portfolio_id>', methods=['DELETE'])
@jwt_required()
def delete_portfolio(portfolio_id):
    """
    删除持仓组合
    """
    try:
        user_id = get_jwt_identity()
        
        # 检查持仓是否属于该用户
        portfolio = UserPortfolio.query.filter_by(id=portfolio_id, user_id=user_id).first()
        if not portfolio:
            return utils.error(message='持仓组合不存在或无权访问', code=404, status=404)
        
        # 删除持仓组合（关联的持仓股票、交易记录等会级联删除）
        db.session.delete(portfolio)
        db.session.commit()
        
        current_app.logger.info(f"删除持仓组合成功，ID={portfolio_id}")
        
        return utils.success(
            message='删除成功'
        )
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"删除持仓组合失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'删除持仓组合失败: {str(e)}', code=500, status=500)

@portfolio_controller.route('/<int:portfolio_id>/stocks', methods=['GET'])
@jwt_required()
def get_portfolio_stocks(portfolio_id):
    """
    获取持仓组合的所有股票
    """
    try:
        user_id = get_jwt_identity()
        
        # 检查持仓是否属于该用户
        portfolio = UserPortfolio.query.filter_by(id=portfolio_id, user_id=user_id).first()
        if not portfolio:
            return utils.error(message='持仓组合不存在或无权访问', code=404, status=404)
        
        # 获取持仓股票列表
        stocks = PortfolioStock.query.filter_by(portfolio_id=portfolio_id).all()
        stock_list = [stock.to_dict() for stock in stocks]
        
        return utils.success(
            data=stock_list,
            message='获取成功'
        )
        
    except Exception as e:
        current_app.logger.error(f"获取持仓股票列表失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'获取持仓股票列表失败: {str(e)}', code=500, status=500)

@portfolio_controller.route('/<int:portfolio_id>/stocks', methods=['POST'])
@jwt_required()
def add_portfolio_stock(portfolio_id):
    """
    向持仓组合添加股票
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # 验证必填字段
        required_fields = ['stock_code', 'stock_name', 'total_shares', 'avg_cost_price']
        for field in required_fields:
            if field not in data:
                return utils.error(message=f'{field}不能为空', code=400)
        
        current_app.logger.info(f"尝试添加股票，用户ID={user_id}，组合ID={portfolio_id}，数据={data}")
        
        # 检查持仓是否属于该用户
        portfolio = UserPortfolio.query.filter_by(id=portfolio_id, user_id=user_id).first()
        if not portfolio:
            return utils.error(message='持仓组合不存在或无权访问', code=404, status=404)
        
        # 检查股票是否已经存在
        existing_stock = PortfolioStock.query.filter_by(
            portfolio_id=portfolio_id,
            stock_code=data['stock_code']
        ).first()
        
        if existing_stock:
            return utils.error(message='该组合中已存在此股票', code=400)
        
        # 使用Decimal处理数值
        from decimal import Decimal
        
        # 确保传入的数据类型正确
        try:
            total_shares = Decimal(str(data['total_shares']))
            avg_cost_price = Decimal(str(data['avg_cost_price']))
            current_price = Decimal(str(data.get('current_price', 0)))
        except (ValueError, TypeError) as e:
            current_app.logger.error(f"数值转换错误: {str(e)}")
            return utils.error(message=f'数值格式错误: {str(e)}', code=400)
        
        # 创建持仓股票
        try:
            # 计算持仓市值和盈亏
            position_value = total_shares * current_price if current_price > 0 else Decimal('0')
            cost_basis = total_shares * avg_cost_price
            profit_loss = position_value - cost_basis
            profit_loss_rate = Decimal('0')
            if cost_basis > 0:
                profit_loss_rate = profit_loss / cost_basis
            
            # 直接使用Decimal对象，而非字符串形式
            stock = PortfolioStock(
                portfolio_id=portfolio_id,
                stock_code=data['stock_code'],
                stock_name=data['stock_name'],
                total_shares=total_shares,
                avg_cost_price=avg_cost_price,
                current_price=current_price,
                position_value=position_value,
                profit_loss=profit_loss,
                profit_loss_rate=profit_loss_rate
            )
            
            db.session.add(stock)
            db.session.flush()  # 刷新会话，但不提交事务
            current_app.logger.info("股票对象创建成功，准备添加到数据库")
            
            # 更新持仓组合的总投资和当前市值
            portfolio.total_investment = Decimal(str(portfolio.total_investment)) + cost_basis
            if current_price > 0:
                portfolio.current_value = Decimal(str(portfolio.current_value)) + position_value
                portfolio.profit_loss = portfolio.current_value - portfolio.total_investment
                if portfolio.total_investment > 0:
                    portfolio.profit_loss_rate = portfolio.profit_loss / portfolio.total_investment
                else:
                    portfolio.profit_loss_rate = Decimal('0')
            
            db.session.commit()
            current_app.logger.info(f"添加股票成功，持仓ID={portfolio_id}，股票代码={data['stock_code']}")
            
            return utils.success(
                message='添加成功',
                data=stock.to_dict()
            )
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"添加股票失败: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return utils.error(message=f'添加股票失败: {str(e)}', code=500, status=500)
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"添加持仓股票失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'添加持仓股票失败: {str(e)}', code=500, status=500)

@portfolio_controller.route('/<int:portfolio_id>/stocks/<string:stock_code>', methods=['PUT'])
@jwt_required()
def update_portfolio_stock(portfolio_id, stock_code):
    """
    更新持仓股票信息
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        current_app.logger.info(f"尝试更新股票，用户ID={user_id}，组合ID={portfolio_id}，股票代码={stock_code}，数据={data}")
        
        # 检查持仓是否属于该用户
        portfolio = UserPortfolio.query.filter_by(id=portfolio_id, user_id=user_id).first()
        if not portfolio:
            return utils.error(message='持仓组合不存在或无权访问', code=404, status=404)
        
        # 检查股票是否存在
        stock = PortfolioStock.query.filter_by(
            portfolio_id=portfolio_id,
            stock_code=stock_code
        ).first()
        
        if not stock:
            return utils.error(message='该组合中不存在此股票', code=404, status=404)
        
        # 使用Decimal处理数值
        from decimal import Decimal
        
        # 保存原始值，用于更新组合总值
        original_shares = Decimal(str(stock.total_shares))
        original_avg_cost = Decimal(str(stock.avg_cost_price))
        original_value = original_shares * original_avg_cost
        
        # 准备更新的值
        new_shares = original_shares
        new_avg_cost = original_avg_cost
        new_current_price = Decimal(str(stock.current_price)) if stock.current_price else Decimal('0')
        
        # 更新字段
        if 'total_shares' in data:
            new_shares = Decimal(str(data['total_shares']))
            stock.total_shares = new_shares
            
        if 'avg_cost_price' in data:
            new_avg_cost = Decimal(str(data['avg_cost_price']))
            stock.avg_cost_price = new_avg_cost
            
        if 'current_price' in data:
            new_current_price = Decimal(str(data['current_price']))
            stock.current_price = new_current_price
        
        # 重新计算持仓市值和盈亏
        if new_current_price > 0:
            position_value = new_shares * new_current_price
            cost_basis = new_shares * new_avg_cost
            profit_loss = position_value - cost_basis
            
            stock.position_value = position_value
            stock.profit_loss = profit_loss
            
            if cost_basis > 0:
                stock.profit_loss_rate = profit_loss / cost_basis
            else:
                stock.profit_loss_rate = Decimal('0')
        
        # 更新持仓组合的总投资和当前市值
        new_value = new_shares * new_avg_cost
        portfolio.total_investment = portfolio.total_investment - original_value + new_value
        
        # 如果有当前价格，重新计算整个组合的当前市值和盈亏
        try:
            # 重新计算整个组合的当前市值
            portfolio_stocks = PortfolioStock.query.filter_by(portfolio_id=portfolio_id).all()
            total_current_value = Decimal('0')
            
            for s in portfolio_stocks:
                if s.id == stock.id:  # 使用已更新的值
                    s_shares = new_shares
                    s_price = new_current_price
                else:  # 使用数据库中的值
                    s_shares = Decimal(str(s.total_shares)) if s.total_shares else Decimal('0')
                    s_price = Decimal(str(s.current_price)) if s.current_price else Decimal('0')
                
                total_current_value += s_shares * s_price
            
            portfolio.current_value = total_current_value
            portfolio.profit_loss = portfolio.current_value - portfolio.total_investment
            
            if portfolio.total_investment > 0:
                portfolio.profit_loss_rate = portfolio.profit_loss / portfolio.total_investment
            else:
                portfolio.profit_loss_rate = Decimal('0')
                
        except Exception as calc_error:
            current_app.logger.error(f"计算组合市值时出错: {str(calc_error)}")
        
        try:
            db.session.commit()
            current_app.logger.info(f"更新股票成功，持仓ID={portfolio_id}，股票代码={stock_code}")
        except Exception as commit_error:
            db.session.rollback()
            current_app.logger.error(f"更新股票提交事务时出错: {str(commit_error)}")
            current_app.logger.error(traceback.format_exc())
            return utils.error(message=f'更新股票失败: {str(commit_error)}', code=500, status=500)
        
        return utils.success(
            data=stock.to_dict(),
            message='更新成功'
        )
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"更新持仓股票失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'更新持仓股票失败: {str(e)}', code=500, status=500)

@portfolio_controller.route('/<int:portfolio_id>/stocks/<string:stock_code>', methods=['DELETE'])
@jwt_required()
def delete_portfolio_stock(portfolio_id, stock_code):
    """
    从持仓组合中删除股票
    """
    try:
        user_id = get_jwt_identity()
        
        current_app.logger.info(f"尝试删除股票，用户ID={user_id}，组合ID={portfolio_id}，股票代码={stock_code}")
        
        # 检查持仓是否属于该用户
        portfolio = UserPortfolio.query.filter_by(id=portfolio_id, user_id=user_id).first()
        if not portfolio:
            return utils.error(message='持仓组合不存在或无权访问', code=404, status=404)
        
        # 检查股票是否存在
        stock = PortfolioStock.query.filter_by(
            portfolio_id=portfolio_id,
            stock_code=stock_code
        ).first()
        
        if not stock:
            return utils.error(message='该组合中不存在此股票', code=404, status=404)
        
        # 使用Decimal处理数值
        from decimal import Decimal
        
        # 更新持仓组合的总投资和当前市值
        stock_shares = Decimal(str(stock.total_shares))
        stock_avg_cost = Decimal(str(stock.avg_cost_price))
        stock_current_price = Decimal(str(stock.current_price)) if stock.current_price else Decimal('0')
        
        position_cost = stock_shares * stock_avg_cost
        position_value = stock_shares * stock_current_price
        
        # 减去被删除股票的投资值
        portfolio.total_investment = Decimal(str(portfolio.total_investment)) - position_cost
        if portfolio.total_investment < Decimal('0'):
            portfolio.total_investment = Decimal('0')
        
        # 如果股票有当前价格，更新组合的当前市值和盈亏
        if stock_current_price > 0:
            portfolio.current_value = Decimal(str(portfolio.current_value)) - position_value
            if portfolio.current_value < Decimal('0'):
                portfolio.current_value = Decimal('0')
                
            portfolio.profit_loss = portfolio.current_value - portfolio.total_investment
            
            if portfolio.total_investment > 0:
                portfolio.profit_loss_rate = portfolio.profit_loss / portfolio.total_investment
            else:
                portfolio.profit_loss_rate = Decimal('0')
        
        # 使用单独的事务处理删除操作
        try:
            db.session.delete(stock)
            db.session.flush()  # 刷新会话，但不提交事务
            current_app.logger.info(f"股票对象删除成功，准备提交事务")
        except Exception as delete_error:
            db.session.rollback()
            current_app.logger.error(f"删除股票对象时出错: {str(delete_error)}")
            current_app.logger.error(traceback.format_exc())
            return utils.error(message=f'删除股票失败: {str(delete_error)}', code=500, status=500)
            
        # 更新完成后提交事务
        try:
            db.session.commit()
            current_app.logger.info(f"删除股票成功，持仓ID={portfolio_id}，股票代码={stock_code}")
        except Exception as commit_error:
            db.session.rollback()
            current_app.logger.error(f"删除股票提交事务时出错: {str(commit_error)}")
            current_app.logger.error(traceback.format_exc())
            return utils.error(message=f'删除股票失败: {str(commit_error)}', code=500, status=500)
        
        return utils.success(
            message='删除成功'
        )
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"删除持仓股票失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'删除持仓股票失败: {str(e)}', code=500, status=500)

@portfolio_controller.route('/<int:portfolio_id>/trades', methods=['GET'])
@jwt_required()
def get_trades(portfolio_id):
    """
    获取持仓组合的交易记录
    """
    try:
        user_id = get_jwt_identity()
        
        # 检查持仓是否属于该用户
        portfolio = UserPortfolio.query.filter_by(id=portfolio_id, user_id=user_id).first()
        if not portfolio:
            return utils.error(message='持仓组合不存在或无权访问', code=404, status=404)
        
        # 获取交易记录
        trades = TradeRecord.query.filter_by(portfolio_id=portfolio_id).order_by(TradeRecord.trade_time.desc()).all()
        trade_list = [trade.to_dict() for trade in trades]
        
        return utils.success(
            data=trade_list,
            message='获取成功'
        )
        
    except Exception as e:
        current_app.logger.error(f"获取交易记录失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'获取交易记录失败: {str(e)}', code=500, status=500)

@portfolio_controller.route('/<int:portfolio_id>/trades', methods=['POST'])
@jwt_required()
def create_trade(portfolio_id):
    """
    创建交易记录并更新持仓
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        current_app.logger.info(f"尝试创建交易记录，用户ID={user_id}，组合ID={portfolio_id}，数据={data}")
        
        # 检查持仓是否属于该用户
        portfolio = UserPortfolio.query.filter_by(id=portfolio_id, user_id=user_id).first()
        if not portfolio:
            return utils.error(message='持仓组合不存在或无权访问', code=404, status=404)
        
        # 验证必需字段
        required_fields = ['stock_code', 'stock_name', 'trade_type', 'trade_price', 'trade_shares']
        for field in required_fields:
            if field not in data:
                return utils.error(message=f'{field}不能为空', code=400)
        
        # 使用Decimal处理数值
        from decimal import Decimal
        
        trade_price = Decimal(str(data['trade_price']))
        trade_shares = Decimal(str(data['trade_shares']))
        trade_fee = Decimal(str(data.get('trade_fee', 0)))
        
        # 计算交易金额
        trade_amount = trade_price * trade_shares
        
        # 创建交易记录
        trade = TradeRecord(
            portfolio_id=portfolio_id,
            stock_code=data['stock_code'],
            stock_name=data['stock_name'],
            trade_type=data['trade_type'],
            trade_price=trade_price,
            trade_shares=trade_shares,
            trade_amount=trade_amount,
            trade_fee=trade_fee,
            trade_time=data.get('trade_time', datetime.now()),
            trade_note=data.get('trade_note', '')
        )
        
        db.session.add(trade)
        
        # 更新持仓股票
        stock = PortfolioStock.query.filter_by(
            portfolio_id=portfolio_id,
            stock_code=data['stock_code']
        ).first()
        
        if data['trade_type'] == 'buy':
            if stock:
                # 已有持仓，更新平均成本和股数
                original_shares = Decimal(str(stock.total_shares))
                original_avg_price = Decimal(str(stock.avg_cost_price))
                
                original_cost = original_shares * original_avg_price
                new_cost = trade_amount
                new_shares = original_shares + trade_shares
                
                if new_shares > 0:
                    new_avg_price = (original_cost + new_cost) / new_shares
                else:
                    new_avg_price = Decimal('0')
                
                stock.avg_cost_price = new_avg_price
                stock.total_shares = new_shares
                
                current_app.logger.info(f"更新现有持仓：股票={data['stock_code']}，新持仓={new_shares}，新成本={new_avg_price}")
            else:
                # 新建持仓
                stock = PortfolioStock(
                    portfolio_id=portfolio_id,
                    stock_code=data['stock_code'],
                    stock_name=data['stock_name'],
                    total_shares=trade_shares,
                    avg_cost_price=trade_price,
                    current_price=Decimal('0'),
                    position_value=Decimal('0'),
                    profit_loss=Decimal('0'),
                    profit_loss_rate=Decimal('0')
                )
                db.session.add(stock)
                current_app.logger.info(f"创建新持仓：股票={data['stock_code']}，持仓={trade_shares}，成本={trade_price}")
            
            # 更新组合总投资
            portfolio.total_investment = portfolio.total_investment + trade_amount
            
        elif data['trade_type'] == 'sell':
            if not stock:
                return utils.error(message='该组合中不存在此股票，无法卖出', code=400)
            
            current_shares = Decimal(str(stock.total_shares))
            if current_shares < trade_shares:
                return utils.error(message='卖出股数超过持仓数量', code=400)
            
            # 计算卖出部分的成本
            avg_cost_price = Decimal(str(stock.avg_cost_price))
            sell_cost = trade_shares * avg_cost_price
            
            # 更新持仓
            new_shares = current_shares - trade_shares
            
            if new_shares > 0:
                stock.total_shares = new_shares
                current_app.logger.info(f"更新持仓（部分卖出）：股票={data['stock_code']}，剩余持仓={new_shares}")
            else:
                # 如果全部卖出，删除持仓记录
                db.session.delete(stock)
                current_app.logger.info(f"删除持仓（全部卖出）：股票={data['stock_code']}")
            
            # 更新组合总投资
            portfolio.total_investment = portfolio.total_investment - sell_cost
        
        # 如果股票还有持仓且有当前价格，更新盈亏
        if stock and hasattr(stock, 'id') and stock.id and stock.current_price:
            current_price = Decimal(str(stock.current_price))
            if current_price > 0 and stock.total_shares > 0:
                stock_shares = Decimal(str(stock.total_shares))
                stock_avg_price = Decimal(str(stock.avg_cost_price))
                
                position_value = stock_shares * current_price
                cost_basis = stock_shares * stock_avg_price
                profit_loss = position_value - cost_basis
                
                stock.position_value = position_value
                stock.profit_loss = profit_loss
                
                if cost_basis > 0:
                    stock.profit_loss_rate = profit_loss / cost_basis
                else:
                    stock.profit_loss_rate = Decimal('0')
        
        # 更新持仓组合的当前市值和盈亏
        try:
            update_portfolio_values(portfolio_id)
            current_app.logger.info(f"更新组合市值成功，组合ID={portfolio_id}")
        except Exception as update_error:
            current_app.logger.error(f"更新组合市值失败: {str(update_error)}")
            current_app.logger.error(traceback.format_exc())
        
        try:
            db.session.commit()
            current_app.logger.info(f"创建交易记录成功，持仓ID={portfolio_id}，股票代码={data['stock_code']}，交易类型={data['trade_type']}")
        except Exception as commit_error:
            db.session.rollback()
            current_app.logger.error(f"提交交易记录事务时出错: {str(commit_error)}")
            current_app.logger.error(traceback.format_exc())
            return utils.error(message=f'创建交易记录失败: {str(commit_error)}', code=500, status=500)
        
        return utils.success(
            data=trade.to_dict(),
            message='交易成功'
        )
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"创建交易记录失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'创建交易记录失败: {str(e)}', code=500, status=500)

@portfolio_controller.route('/update-prices', methods=['POST'])
@jwt_required()
def update_portfolio_prices():
    """
    更新所有持仓股票的当前价格
    """
    try:
        user_id = get_jwt_identity()
        
        # 获取用户的所有持仓组合
        portfolios = UserPortfolio.query.filter_by(user_id=user_id).all()
        
        if not portfolios:
            return utils.success(message='没有找到持仓组合')
        
        updated_portfolios = []
        
        for portfolio in portfolios:
            # 获取该组合下的所有股票
            stocks = PortfolioStock.query.filter_by(portfolio_id=portfolio.id).all()
            if not stocks:
                continue
            
            # 收集所有股票代码
            stock_codes = [stock.stock_code for stock in stocks]
            
            try:
                # 获取实时行情
                stock_data = ak.stock_zh_a_spot_em()
                
                # 更新每只股票的价格
                for stock in stocks:
                    stock_row = stock_data[stock_data['代码'] == stock.stock_code]
                    
                    if not stock_row.empty:
                        # 获取实时价格
                        current_price = float(stock_row['最新价'].values[0])
                        
                        # 更新股票价格和盈亏
                        stock.current_price = current_price
                        stock.position_value = float(stock.total_shares) * current_price
                        stock.profit_loss = stock.position_value - (float(stock.total_shares) * float(stock.avg_cost_price))
                        if float(stock.avg_cost_price) > 0:
                            stock.profit_loss_rate = stock.profit_loss / (float(stock.total_shares) * float(stock.avg_cost_price))
                    
                # 更新组合总市值和盈亏
                update_portfolio_values(portfolio.id)
                
                # 添加到更新列表
                updated_portfolios.append(portfolio.id)
                
            except Exception as stock_error:
                current_app.logger.error(f"更新股票价格失败: {str(stock_error)}")
                continue
        
        db.session.commit()
        
        return utils.success(
            data={'updated_portfolios': updated_portfolios},
            message='价格更新成功'
        )
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"更新价格失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'更新价格失败: {str(e)}', code=500, status=500)

@portfolio_controller.route('/statistics/daily', methods=['POST'])
@jwt_required()
def create_daily_statistics():
    """
    创建每日统计数据（可由定时任务调用）
    """
    try:
        user_id = get_jwt_identity()
        
        # 获取用户的所有持仓组合
        portfolios = UserPortfolio.query.filter_by(user_id=user_id).all()
        
        if not portfolios:
            return utils.success(message='没有找到持仓组合')
        
        today = datetime.now().date()
        results = []
        
        for portfolio in portfolios:
            # 检查今天是否已经有统计
            existing_stat = PortfolioStatistics.query.filter_by(
                portfolio_id=portfolio.id,
                statistics_date=today
            ).first()
            
            if existing_stat:
                # 已存在今日统计，更新
                existing_stat.total_value = portfolio.current_value
                existing_stat.total_profit_loss = portfolio.profit_loss
                existing_stat.total_profit_loss_rate = portfolio.profit_loss_rate
                
                # 计算日盈亏（与昨天相比）
                yesterday = today - timedelta(days=1)
                yesterday_stat = PortfolioStatistics.query.filter_by(
                    portfolio_id=portfolio.id,
                    statistics_date=yesterday
                ).first()
                
                if yesterday_stat:
                    daily_profit_loss = float(existing_stat.total_value) - float(yesterday_stat.total_value)
                    existing_stat.daily_profit_loss = daily_profit_loss
                    if float(yesterday_stat.total_value) > 0:
                        existing_stat.daily_profit_loss_rate = daily_profit_loss / float(yesterday_stat.total_value)
                
                results.append(existing_stat.to_dict())
            else:
                # 创建新统计
                statistic = PortfolioStatistics(
                    portfolio_id=portfolio.id,
                    statistics_date=today,
                    total_value=portfolio.current_value,
                    total_profit_loss=portfolio.profit_loss,
                    total_profit_loss_rate=portfolio.profit_loss_rate
                )
                
                # 计算日盈亏（与昨天相比）
                yesterday = today - timedelta(days=1)
                yesterday_stat = PortfolioStatistics.query.filter_by(
                    portfolio_id=portfolio.id,
                    statistics_date=yesterday
                ).first()
                
                if yesterday_stat:
                    daily_profit_loss = float(portfolio.current_value) - float(yesterday_stat.total_value)
                    statistic.daily_profit_loss = daily_profit_loss
                    if float(yesterday_stat.total_value) > 0:
                        statistic.daily_profit_loss_rate = daily_profit_loss / float(yesterday_stat.total_value)
                
                db.session.add(statistic)
                results.append(statistic.to_dict())
        
        db.session.commit()
        
        return utils.success(
            data=results,
            message='统计数据已更新'
        )
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"创建统计数据失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'创建统计数据失败: {str(e)}', code=500, status=500)

# 辅助函数：更新组合的市值和盈亏
def update_portfolio_values(portfolio_id):
    """更新持仓组合的总市值和盈亏"""
    try:
        from decimal import Decimal
        
        # 获取该组合下的所有股票
        stocks = PortfolioStock.query.filter_by(portfolio_id=portfolio_id).all()
        
        # 计算总市值
        total_value = Decimal('0')
        for stock in stocks:
            if stock.position_value:
                total_value += Decimal(str(stock.position_value))
        
        # 获取组合
        portfolio = UserPortfolio.query.get(portfolio_id)
        if portfolio:
            portfolio.current_value = total_value
            if portfolio.total_investment:
                total_investment = Decimal(str(portfolio.total_investment))
                portfolio.profit_loss = total_value - total_investment
                
                if total_investment > 0:
                    portfolio.profit_loss_rate = portfolio.profit_loss / total_investment
                else:
                    portfolio.profit_loss_rate = Decimal('0')
        
        return True
    except Exception as e:
        current_app.logger.error(f"更新组合市值失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return False 