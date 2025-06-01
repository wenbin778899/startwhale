import akshare as ak
import pandas as pd
from datetime import datetime, timedelta
from decimal import Decimal
from flask import current_app
from app.models import db
from app.models.fund import FundNavHistory, PortfolioFund
import traceback

class FundService:
    
    @staticmethod
    def get_fund_nav_data(fund_code, start_date=None, end_date=None):
        """
        获取基金净值数据
        使用akshare的fund_etf_fund_info_em接口获取场内交易基金历史数据
        """
        try:
            # 设置默认日期范围
            if not start_date:
                start_date = (datetime.now() - timedelta(days=365)).strftime('%Y%m%d')
            else:
                start_date = start_date.replace('-', '')
                
            if not end_date:
                end_date = datetime.now().strftime('%Y%m%d')
            else:
                end_date = end_date.replace('-', '')
            
            current_app.logger.info(f"开始获取基金 {fund_code} 的净值数据: {start_date} - {end_date}")
            
            # 调用akshare接口获取基金净值数据
            fund_data = ak.fund_etf_fund_info_em(
                fund=fund_code, 
                start_date=start_date, 
                end_date=end_date
            )
            
            if fund_data.empty:
                current_app.logger.warning(f"基金 {fund_code} 未获取到净值数据")
                return []
            
            # 转换数据格式
            result = []
            for _, row in fund_data.iterrows():
                try:
                    # 处理净值日期
                    nav_date = pd.to_datetime(row['净值日期']).date()
                    
                    # 处理单位净值 - 可能是字符串或数值
                    unit_nav = float(str(row['单位净值']).replace(',', '')) if pd.notna(row['单位净值']) else 0.0
                    
                    # 处理累计净值
                    cumulative_nav = float(str(row['累计净值']).replace(',', '')) if pd.notna(row['累计净值']) else 0.0
                    
                    # 处理日增长率
                    daily_growth = None
                    if pd.notna(row['日增长率']):
                        try:
                            daily_growth = float(row['日增长率'])
                        except (ValueError, TypeError):
                            daily_growth = None
                    
                    nav_record = {
                        'fund_code': fund_code,
                        'nav_date': nav_date.strftime('%Y-%m-%d'),
                        'unit_nav': unit_nav,
                        'cumulative_nav': cumulative_nav,
                        'daily_growth_rate': daily_growth,
                        'purchase_status': str(row['申购状态']) if pd.notna(row['申购状态']) else None,
                        'redeem_status': str(row['赎回状态']) if pd.notna(row['赎回状态']) else None
                    }
                    
                    result.append(nav_record)
                    
                except Exception as e:
                    current_app.logger.error(f"处理基金净值数据行出错: {e}, 行数据: {row}")
                    continue
            
            current_app.logger.info(f"成功获取基金 {fund_code} 的 {len(result)} 条净值数据")
            return result
            
        except Exception as e:
            current_app.logger.error(f"获取基金 {fund_code} 净值数据失败: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return []
    
    @staticmethod
    def save_fund_nav_data(fund_code, nav_data_list):
        """
        保存基金净值数据到数据库
        """
        try:
            saved_count = 0
            updated_count = 0
            
            for nav_data in nav_data_list:
                # 检查是否已存在
                existing = FundNavHistory.query.filter_by(
                    fund_code=fund_code,
                    nav_date=datetime.strptime(nav_data['nav_date'], '%Y-%m-%d').date()
                ).first()
                
                if existing:
                    # 更新现有记录
                    existing.unit_nav = Decimal(str(nav_data['unit_nav']))
                    existing.cumulative_nav = Decimal(str(nav_data['cumulative_nav']))
                    if nav_data['daily_growth_rate'] is not None:
                        existing.daily_growth_rate = Decimal(str(nav_data['daily_growth_rate']))
                    existing.purchase_status = nav_data['purchase_status']
                    existing.redeem_status = nav_data['redeem_status']
                    existing.update_time = datetime.now()
                    updated_count += 1
                else:
                    # 创建新记录
                    nav_history = FundNavHistory(
                        fund_code=fund_code,
                        nav_date=datetime.strptime(nav_data['nav_date'], '%Y-%m-%d').date(),
                        unit_nav=Decimal(str(nav_data['unit_nav'])),
                        cumulative_nav=Decimal(str(nav_data['cumulative_nav'])),
                        daily_growth_rate=Decimal(str(nav_data['daily_growth_rate'])) if nav_data['daily_growth_rate'] is not None else None,
                        purchase_status=nav_data['purchase_status'],
                        redeem_status=nav_data['redeem_status']
                    )
                    db.session.add(nav_history)
                    saved_count += 1
            
            db.session.commit()
            current_app.logger.info(f"基金 {fund_code} 净值数据保存完成: 新增 {saved_count} 条, 更新 {updated_count} 条")
            return saved_count + updated_count
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"保存基金 {fund_code} 净值数据失败: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return 0
    
    @staticmethod
    def get_latest_fund_nav(fund_code):
        """
        获取基金最新净值
        """
        try:
            # 先从数据库查询最新净值
            latest_nav = FundNavHistory.query.filter_by(fund_code=fund_code)\
                .order_by(FundNavHistory.nav_date.desc()).first()
            
            if latest_nav:
                # 检查是否为最近的交易日数据
                days_diff = (datetime.now().date() - latest_nav.nav_date).days
                if days_diff <= 3:  # 3天内的数据认为是最新的
                    return {
                        'fund_code': fund_code,
                        'nav_date': latest_nav.nav_date.strftime('%Y-%m-%d'),
                        'unit_nav': float(latest_nav.unit_nav),
                        'cumulative_nav': float(latest_nav.cumulative_nav),
                        'daily_growth_rate': float(latest_nav.daily_growth_rate) if latest_nav.daily_growth_rate else None
                    }
            
            # 如果数据库没有最新数据，从akshare获取
            current_app.logger.info(f"从akshare获取基金 {fund_code} 最新净值")
            
            # 获取最近30天的数据
            end_date = datetime.now().strftime('%Y%m%d')
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y%m%d')
            
            nav_data_list = FundService.get_fund_nav_data(fund_code, start_date, end_date)
            
            if nav_data_list:
                # 保存到数据库
                FundService.save_fund_nav_data(fund_code, nav_data_list)
                
                # 返回最新的净值数据
                latest_data = sorted(nav_data_list, key=lambda x: x['nav_date'], reverse=True)[0]
                return {
                    'fund_code': fund_code,
                    'nav_date': latest_data['nav_date'],
                    'unit_nav': latest_data['unit_nav'],
                    'cumulative_nav': latest_data['cumulative_nav'],
                    'daily_growth_rate': latest_data['daily_growth_rate']
                }
            
            return None
            
        except Exception as e:
            current_app.logger.error(f"获取基金 {fund_code} 最新净值失败: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return None
    
    @staticmethod
    def calculate_fund_profit_loss(portfolio_fund):
        """
        计算基金盈亏
        """
        try:
            if not portfolio_fund.current_nav or portfolio_fund.current_nav == 0:
                return portfolio_fund
            
            # 计算持仓市值
            position_value = Decimal(str(portfolio_fund.total_shares)) * Decimal(str(portfolio_fund.current_nav))
            
            # 计算总成本
            total_cost = Decimal(str(portfolio_fund.total_shares)) * Decimal(str(portfolio_fund.avg_cost_nav))
            
            # 计算盈亏金额
            profit_loss = position_value - total_cost
            
            # 计算盈亏率
            profit_loss_rate = profit_loss / total_cost if total_cost > 0 else Decimal('0')
            
            # 更新基金持仓数据
            portfolio_fund.position_value = position_value
            portfolio_fund.profit_loss = profit_loss
            portfolio_fund.profit_loss_rate = profit_loss_rate
            portfolio_fund.update_time = datetime.now()
            
            return portfolio_fund
            
        except Exception as e:
            current_app.logger.error(f"计算基金盈亏失败: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return portfolio_fund
    
    @staticmethod
    def update_portfolio_fund_prices(portfolio_id=None):
        """
        更新持仓基金价格
        """
        try:
            # 构建查询条件
            if portfolio_id:
                funds = PortfolioFund.query.filter_by(portfolio_id=portfolio_id).all()
            else:
                funds = PortfolioFund.query.all()
            
            updated_count = 0
            
            for fund in funds:
                try:
                    # 获取最新净值
                    latest_nav = FundService.get_latest_fund_nav(fund.fund_code)
                    
                    if latest_nav:
                        # 更新当前净值
                        fund.current_nav = Decimal(str(latest_nav['unit_nav']))
                        
                        # 重新计算盈亏
                        fund = FundService.calculate_fund_profit_loss(fund)
                        
                        updated_count += 1
                        current_app.logger.info(f"更新基金 {fund.fund_code} 净值: {latest_nav['unit_nav']}")
                    else:
                        current_app.logger.warning(f"未能获取基金 {fund.fund_code} 的最新净值")
                        
                except Exception as e:
                    current_app.logger.error(f"更新基金 {fund.fund_code} 价格失败: {str(e)}")
                    continue
            
            if updated_count > 0:
                db.session.commit()
                current_app.logger.info(f"成功更新 {updated_count} 只基金的净值")
            
            return updated_count
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"更新持仓基金价格失败: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return 0 