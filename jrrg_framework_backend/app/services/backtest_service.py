import logging
import datetime
import json
import pandas as pd
import numpy as np
import backtrader as bt
import akshare as ak
import io
import base64
# 设置matplotlib使用非交互式后端，防止弹出窗口
import matplotlib
matplotlib.use('Agg')  # 必须在导入pyplot之前设置
import matplotlib.pyplot as plt
from matplotlib.dates import date2num
from datetime import datetime, timedelta
import pytz
import traceback

# 定义自定义策略
class MovingAverageStrategy(bt.Strategy):
    """移动平均线策略"""
    
    params = (
        ('ma_period', 20),  # 移动平均线周期
        ('size', 100),      # 交易数量
    )

    def __init__(self):
        # 记录收盘价
        self.dataclose = self.datas[0].close
        
        # 初始化交易状态
        self.order = None
        self.buyprice = None
        self.buycomm = None
        
        # 添加移动平均线指标
        self.sma = bt.indicators.SimpleMovingAverage(
            self.datas[0], period=self.params.ma_period
        )
        
        # 记录交叉信号
        self.crossover = bt.indicators.CrossOver(self.dataclose, self.sma)
        
        # 打印初始化信息
        logging.info(f"初始化移动平均线策略, 周期: {self.params.ma_period}, 交易数量: {self.params.size}")
        
    def notify_order(self, order):
        if order.status in [order.Submitted, order.Accepted]:
            # 订单已提交/接受 - 无操作
            return
        
        # 检查订单是否已完成
        if order.status in [order.Completed]:
            if order.isbuy():
                self.log(f'买入执行: 价格={order.executed.price:.2f}, 成本={order.executed.value:.2f}, 手续费={order.executed.comm:.2f}')
                self.buyprice = order.executed.price
                self.buycomm = order.executed.comm
            else:
                self.log(f'卖出执行: 价格={order.executed.price:.2f}, 成本={order.executed.value:.2f}, 手续费={order.executed.comm:.2f}')
                
            self.bar_executed = len(self)
            
        elif order.status in [order.Canceled, order.Margin, order.Rejected]:
            self.log('订单取消/保证金不足/拒绝')
        
        # 重置订单
        self.order = None

    def notify_trade(self, trade):
        if not trade.isclosed:
            return
            
        self.log(f'交易利润: 毛利={trade.pnl:.2f}, 净利={trade.pnlcomm:.2f}')

    def log(self, txt, dt=None):
        """记录日志"""
        dt = dt or self.datas[0].datetime.date(0)
        logging.debug(f'{dt.isoformat()}, {txt}')

    def next(self):
        # 记录当前价格和指标
        logging.debug(f'日期: {self.datas[0].datetime.date(0).isoformat()}, 收盘价: {self.dataclose[0]:.2f}, SMA: {self.sma[0]:.2f}')
        
        # 如果有订单正在处理中，直接返回
        if self.order:
            return
            
        # 检查是否已持仓
        if not self.position:
            # 没有持仓 - 当收盘价上穿移动平均线时买入
            if self.crossover > 0:  # 使用CrossOver指标
                self.log(f'买入信号, 价格={self.dataclose[0]:.2f}')
                # 下买入订单，使用默认数量
                self.order = self.buy(size=self.params.size)
                logging.info(f'创建买入订单: 数量={self.params.size}, 价格={self.dataclose[0]:.2f}')
        else:
            # 有持仓 - 当收盘价下穿移动平均线时卖出
            if self.crossover < 0:  # 使用CrossOver指标
                self.log(f'卖出信号, 价格={self.dataclose[0]:.2f}')
                # 下卖出订单，卖出所有持仓
                self.order = self.sell(size=self.params.size)
                logging.info(f'创建卖出订单: 数量={self.params.size}, 价格={self.dataclose[0]:.2f}')


class MACrossStrategy(bt.Strategy):
    """双均线交叉策略"""
    
    params = (
        ('fast_period', 5),  # 快速移动平均线周期
        ('slow_period', 20),  # 慢速移动平均线周期
        ('size', 100),        # 交易数量
    )

    def __init__(self):
        # 记录收盘价
        self.dataclose = self.datas[0].close
        
        # 初始化交易状态
        self.order = None
        self.buyprice = None
        self.buycomm = None
        
        # 添加移动平均线指标
        self.fast_sma = bt.indicators.SimpleMovingAverage(
            self.datas[0], period=self.params.fast_period
        )
        self.slow_sma = bt.indicators.SimpleMovingAverage(
            self.datas[0], period=self.params.slow_period
        )
        
        # 添加交叉指标
        self.crossover = bt.indicators.CrossOver(self.fast_sma, self.slow_sma)
        
    def notify_order(self, order):
        if order.status in [order.Submitted, order.Accepted]:
            # 订单已提交/接受 - 无操作
            return
        
        # 检查订单是否已完成
        if order.status in [order.Completed]:
            if order.isbuy():
                self.log(f'买入执行: 价格={order.executed.price:.2f}, 成本={order.executed.value:.2f}, 手续费={order.executed.comm:.2f}')
                self.buyprice = order.executed.price
                self.buycomm = order.executed.comm
            else:
                self.log(f'卖出执行: 价格={order.executed.price:.2f}, 成本={order.executed.value:.2f}, 手续费={order.executed.comm:.2f}')
                
            self.bar_executed = len(self)
            
        elif order.status in [order.Canceled, order.Margin, order.Rejected]:
            self.log('订单取消/保证金不足/拒绝')
        
        # 重置订单
        self.order = None

    def notify_trade(self, trade):
        if not trade.isclosed:
            return
            
        self.log(f'交易利润: 毛利={trade.pnl:.2f}, 净利={trade.pnlcomm:.2f}')

    def log(self, txt, dt=None):
        """记录日志"""
        dt = dt or self.datas[0].datetime.date(0)
        logging.debug(f'{dt.isoformat()}, {txt}')

    def next(self):
        # 如果有订单正在处理中，直接返回
        if self.order:
            return
            
        # 检查是否已持仓
        if not self.position:
            # 没有持仓 - 当快速均线上穿慢速均线时买入
            if self.crossover > 0:
                self.log(f'买入信号, 价格={self.dataclose[0]:.2f}')
                self.order = self.buy(size=self.params.size)
        else:
            # 有持仓 - 当快速均线下穿慢速均线时卖出
            if self.crossover < 0:
                self.log(f'卖出信号, 价格={self.dataclose[0]:.2f}')
                self.order = self.sell(size=self.params.size)


class RSIStrategy(bt.Strategy):
    """RSI策略"""
    
    params = (
        ('rsi_period', 14),  # RSI周期
        ('rsi_overbought', 70),  # RSI超买阈值
        ('rsi_oversold', 30),   # RSI超卖阈值
        ('size', 100),          # 交易数量
    )

    def __init__(self):
        # 记录收盘价
        self.dataclose = self.datas[0].close
        
        # 初始化交易状态
        self.order = None
        self.buyprice = None
        self.buycomm = None
        
        # 添加RSI指标
        self.rsi = bt.indicators.RSI(
            self.datas[0], period=self.params.rsi_period
        )
        
    def notify_order(self, order):
        if order.status in [order.Submitted, order.Accepted]:
            # 订单已提交/接受 - 无操作
            return
        
        # 检查订单是否已完成
        if order.status in [order.Completed]:
            if order.isbuy():
                self.log(f'买入执行: 价格={order.executed.price:.2f}, 成本={order.executed.value:.2f}, 手续费={order.executed.comm:.2f}')
                self.buyprice = order.executed.price
                self.buycomm = order.executed.comm
            else:
                self.log(f'卖出执行: 价格={order.executed.price:.2f}, 成本={order.executed.value:.2f}, 手续费={order.executed.comm:.2f}')
                
            self.bar_executed = len(self)
            
        elif order.status in [order.Canceled, order.Margin, order.Rejected]:
            self.log('订单取消/保证金不足/拒绝')
        
        # 重置订单
        self.order = None

    def notify_trade(self, trade):
        if not trade.isclosed:
            return
            
        self.log(f'交易利润: 毛利={trade.pnl:.2f}, 净利={trade.pnlcomm:.2f}')

    def log(self, txt, dt=None):
        """记录日志"""
        dt = dt or self.datas[0].datetime.date(0)
        logging.debug(f'{dt.isoformat()}, {txt}')

    def next(self):
        # 如果有订单正在处理中，直接返回
        if self.order:
            return
            
        # 检查是否已持仓
        if not self.position:
            # 没有持仓 - 当RSI低于超卖阈值时买入
            if self.rsi[0] < self.params.rsi_oversold:
                self.log(f'买入信号, RSI={self.rsi[0]:.2f}, 价格={self.dataclose[0]:.2f}')
                self.order = self.buy(size=self.params.size)
        else:
            # 有持仓 - 当RSI高于超买阈值时卖出
            if self.rsi[0] > self.params.rsi_overbought:
                self.log(f'卖出信号, RSI={self.rsi[0]:.2f}, 价格={self.dataclose[0]:.2f}')
                self.order = self.sell(size=self.params.size)


# 记录交易
class TradeRecorder(bt.Analyzer):
    """交易记录分析器"""
    
    def get_analysis(self):
        """返回交易记录分析结果"""
        return {
            'total': self.trade_count,
            'won': self.win_count,
            'lost': self.loss_count,
            'win_rate': self.win_rate,
            'trades': self.trades
        }
        
    def __init__(self):
        self.trades = []
        self.trade_count = 0
        self.win_count = 0
        self.loss_count = 0
        self.win_rate = 0.0
        
    def notify_trade(self, trade):
        if trade.isclosed:
            # 设置默认交易类型
            entry_type = 'BUY'
            exit_type = 'SELL'
            
            # 安全地检查交易历史
            if hasattr(trade, 'history') and trade.history and len(trade.history) > 0:
                entry_type = 'BUY' if trade.history[0].event == 0 else 'SELL'
                exit_type = 'SELL' if trade.history[0].event == 0 else 'BUY'
            
            # 安全地获取交易属性
            # 获取入场日期
            dtopen = trade.dtopen if hasattr(trade, 'dtopen') else None
            entry_date = self.data.num2date(dtopen).date().isoformat() if dtopen is not None else "未知"
            
            # 获取出场日期
            dtclose = trade.dtclose if hasattr(trade, 'dtclose') else None
            exit_date = self.data.num2date(dtclose).date().isoformat() if dtclose is not None else "未知"
            
            # 获取入场价格
            entry_price = trade.price if hasattr(trade, 'price') else 0
            
            # 获取出场价格 - 尝试多个可能的属性名
            exit_price = 0
            for attr in ['priceclosed', 'pclose', 'price_closed', 'closeprice', 'close_price']:
                if hasattr(trade, attr):
                    exit_price = getattr(trade, attr)
                    break
            
            # 记录交易详情
            trade_record = {
                'entry_date': entry_date,
                'entry_price': entry_price,
                'entry_type': entry_type,
                'exit_date': exit_date,
                'exit_price': exit_price,
                'exit_type': exit_type,
                'pl': trade.pnl if hasattr(trade, 'pnl') else 0,
                'pl_pct': (trade.pnlcomm / entry_price * 100) if hasattr(trade, 'pnlcomm') and entry_price else 0,
                'size': trade.size if hasattr(trade, 'size') else 0,
                'commission': trade.commission if hasattr(trade, 'commission') else 0
            }
            
            self.trades.append(trade_record)
            self.trade_count += 1
            
            if hasattr(trade, 'pnlcomm') and trade.pnlcomm > 0:
                self.win_count += 1
            else:
                self.loss_count += 1
                
            if self.trade_count > 0:
                self.win_rate = self.win_count / self.trade_count * 100


class BacktestService:
    """回测服务"""
    
    @staticmethod
    def get_stock_data(stock_code, start_date, end_date):
        """从akshare获取股票数据"""
        try:
            # 标准化处理股票代码
            symbol = stock_code.strip()
            
            # 获取日期字符串
            start_date_str = start_date.strftime('%Y%m%d')
            end_date_str = end_date.strftime('%Y%m%d')
            
            logging.info(f"获取股票 {symbol} 的历史数据: {start_date_str} 至 {end_date_str}")
            
            # 直接使用stock_zh_a_hist获取数据（与策略管理界面一致）
            try:
                stock_data = ak.stock_zh_a_hist(
                    symbol=symbol,
                    period="daily",
                    start_date=start_date_str,
                    end_date=end_date_str,
                    adjust="qfq"  # 前复权
                )
            except Exception as ak_error:
                logging.error(f"使用akshare获取股票 {symbol} 数据失败: {str(ak_error)}")
                # 检查股票代码是否有效
                try:
                    # 尝试获取股票信息验证股票代码
                    stock_info = ak.stock_individual_info_em(symbol=symbol)
                    if stock_info.empty:
                        raise ValueError(f"无效的股票代码: {symbol}")
                    logging.info(f"股票代码 {symbol} 有效，但获取历史数据失败")
                except Exception as info_error:
                    logging.error(f"获取股票 {symbol} 信息失败: {str(info_error)}")
                    raise ValueError(f"无效的股票代码或数据源暂时不可用: {symbol}")
                
                # 如果股票代码有效但获取数据失败，可能是日期范围问题
                raise ValueError(f"获取股票 {symbol} 在日期范围 {start_date_str} 至 {end_date_str} 的数据失败，请尝试其他时间范围")
            
            # 如果没有获取到数据，尝试扩大日期范围或调整参数
            if stock_data.empty:
                logging.warning(f"未获取到股票 {symbol} 数据，尝试扩大日期范围")
                # 扩大到180天
                new_start_date = (start_date - timedelta(days=180)).strftime('%Y%m%d')
                
                try:
                    stock_data = ak.stock_zh_a_hist(
                        symbol=symbol,
                        period="daily",
                        start_date=new_start_date,
                        end_date=end_date_str,
                        adjust="qfq"
                    )
                except Exception as retry_error:
                    logging.error(f"扩大日期范围后获取股票 {symbol} 数据仍失败: {str(retry_error)}")
                    raise ValueError(f"获取股票 {symbol} 历史数据失败，请检查股票代码是否正确或尝试其他时间范围")
                
                if not stock_data.empty:
                    logging.info(f"使用扩大的日期范围获取到数据，共 {len(stock_data)} 条记录")
            
            # 如果仍然没有数据，尝试不同的方法
            if stock_data.empty:
                # 尝试不使用前复权
                try:
                    logging.info(f"尝试不使用前复权获取股票 {symbol} 数据")
                    stock_data = ak.stock_zh_a_hist(
                        symbol=symbol,
                        period="daily",
                        start_date=start_date_str,
                        end_date=end_date_str,
                        adjust=""  # 不使用前复权
                    )
                except Exception as no_adjust_error:
                    logging.error(f"不使用前复权获取股票 {symbol} 数据失败: {str(no_adjust_error)}")
                
                if stock_data.empty:
                    logging.error(f"尝试多种方法后仍无法获取股票 {symbol} 的历史数据")
                    raise ValueError(f"无法获取股票 {symbol} 的历史数据，请尝试其他股票或调整日期范围")
                else:
                    logging.info(f"不使用前复权成功获取到股票数据，共 {len(stock_data)} 条记录")
            
            # 重命名列以适配backtrader
            stock_data.rename(columns={
                '日期': 'date',
                '开盘': 'open',
                '最高': 'high',
                '最低': 'low',
                '收盘': 'close',
                '成交量': 'volume'
            }, inplace=True)
            
            # 添加openinterest列
            stock_data['openinterest'] = 0
            
            # 设置日期索引
            stock_data['date'] = pd.to_datetime(stock_data['date'])
            stock_data.set_index('date', inplace=True)
            
            # 按日期排序
            stock_data.sort_index(inplace=True)
            
            # 选择必要的列
            stock_data = stock_data[['open', 'high', 'low', 'close', 'volume', 'openinterest']]
            
            logging.info(f"股票数据处理完成，共 {len(stock_data)} 条记录")
            return stock_data
            
        except Exception as e:
            logging.error(f"获取股票数据失败: {str(e)}")
            error_traceback = traceback.format_exc()
            logging.error(error_traceback)
            raise Exception(f"获取股票数据失败: {str(e)}")
    
    @staticmethod
    def run_backtest(stock_code, stock_name, strategy_name, params, start_date, end_date, initial_cash=100000, commission=0.001):
        """运行回测"""
        try:
            # 转换日期为datetime对象
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, '%Y-%m-%d')
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, '%Y-%m-%d')
                
            logging.info(f"开始回测: {stock_code} - {strategy_name}, 日期范围: {start_date.strftime('%Y-%m-%d')} 至 {end_date.strftime('%Y-%m-%d')}")
            logging.info(f"策略参数: {params}")
            
            # 获取股票数据
            logging.info(f"获取股票 {stock_code} 的历史数据")
            stock_data = BacktestService.get_stock_data(stock_code, start_date, end_date)
            
            if stock_data.empty:
                raise ValueError(f"获取到的股票 {stock_code} 数据为空")
            
            logging.info(f"成功获取股票数据，数据范围: {stock_data.index.min().strftime('%Y-%m-%d')} 至 {stock_data.index.max().strftime('%Y-%m-%d')}, 共 {len(stock_data)} 条记录")
            
            # 创建cerebro实例
            cerebro = bt.Cerebro()
            
            # 设置禁用交互式绘图
            cerebro.runonce = True
            cerebro.exactbars = False
            cerebro.stdstats = False  # 禁用标准状态图表
            
            # 添加数据
            data = bt.feeds.PandasData(dataname=stock_data)
            cerebro.adddata(data)
            
            # 选择策略
            logging.info(f"设置策略: {strategy_name}")
            if strategy_name == 'MovingAverageStrategy':
                cerebro.addstrategy(MovingAverageStrategy, **params)
            elif strategy_name == 'MACrossStrategy':
                cerebro.addstrategy(MACrossStrategy, **params)
            elif strategy_name == 'RSIStrategy':
                cerebro.addstrategy(RSIStrategy, **params)
            else:
                raise ValueError(f"不支持的策略: {strategy_name}")
                
            # 设置初始资金
            cerebro.broker.setcash(initial_cash)
            
            # 设置佣金
            cerebro.broker.setcommission(commission=commission)
            
            # 添加分析器
            cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name='sharpe')
            cerebro.addanalyzer(bt.analyzers.DrawDown, _name='drawdown')
            cerebro.addanalyzer(bt.analyzers.Returns, _name='returns')
            cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name='trade')
            cerebro.addanalyzer(TradeRecorder, _name='trade_recorder')
            
            # 运行回测
            logging.info(f"开始执行回测计算")
            try:
                # 添加详细日志记录
                cerebro.addobserver(bt.observers.Broker)
                cerebro.addobserver(bt.observers.Trades)
                cerebro.addobserver(bt.observers.BuySell)
                
                # 运行回测
                results = cerebro.run(stdstats=True, verbose=True)
                if not results or len(results) == 0:
                    raise ValueError("回测未返回结果")
                    
                strategy = results[0]
                
                # 记录策略交易信息
                logging.info(f"回测执行完成，检查是否有交易发生")
                
                # 获取账户最终价值
                final_value = cerebro.broker.getvalue()
                logging.info(f"初始资金: {initial_cash}, 最终价值: {final_value}")
                
                # 计算总收益率
                total_return = (final_value / initial_cash - 1) * 100
                logging.info(f"总收益率: {total_return:.2f}%")
                
            except Exception as run_error:
                logging.error(f"回测执行失败: {str(run_error)}")
                logging.error(traceback.format_exc())
                raise Exception(f"回测执行失败: {str(run_error)}")
            
            # 生成图表
            try:
                logging.info(f"生成回测图表")
                
                # 关闭所有可能存在的图表，防止内存泄漏
                plt.close('all')
                
                # 创建一个新的图表对象但不显示
                fig = plt.figure(figsize=(12, 8))
                
                # 使用returnfigs=True确保不显示图形而是返回对象
                figs = cerebro.plot(style='candlestick', barup='red', bardown='green', 
                                   grid=True, iplot=False, returnfigs=True)
                
                # 保存第一个图表为base64编码的字符串
                if figs and len(figs) > 0 and len(figs[0]) > 0:
                    fig = figs[0][0]
                    buffer = io.BytesIO()
                    fig.savefig(buffer, format='png', dpi=100)
                    buffer.seek(0)
                    chart_image = base64.b64encode(buffer.getvalue()).decode('utf-8')
                    
                    # 确保关闭所有图表
                    plt.close('all')
                else:
                    logging.warning("回测没有生成图表")
                    chart_image = ""
            except Exception as plot_error:
                logging.error(f"生成回测图表失败: {str(plot_error)}")
                logging.error(traceback.format_exc())
                chart_image = ""
                # 确保关闭所有图表
                plt.close('all')
            
            # 提取回测结果
            logging.info(f"提取回测结果")
            total_return = (final_value / initial_cash - 1) * 100
            
            # 获取夏普比率
            try:
                sharpe_ratio = strategy.analyzers.sharpe.get_analysis().get('sharperatio', 0)
                if sharpe_ratio is None:
                    sharpe_ratio = 0
            except Exception as sharpe_error:
                logging.warning(f"获取夏普比率失败: {str(sharpe_error)}")
                sharpe_ratio = 0
            
            # 获取最大回撤
            try:
                max_drawdown = strategy.analyzers.drawdown.get_analysis().get('max', {}).get('drawdown', 0)
                if max_drawdown is None:
                    max_drawdown = 0
            except Exception as drawdown_error:
                logging.warning(f"获取最大回撤失败: {str(drawdown_error)}")
                max_drawdown = 0
            
            # 获取交易分析
            try:
                trade_analysis = strategy.analyzers.trade.get_analysis()
                total_trades = trade_analysis.get('total', {}).get('total', 0)
                if total_trades is None:
                    total_trades = 0
            except Exception as trade_error:
                logging.warning(f"获取交易分析失败: {str(trade_error)}")
                total_trades = 0
            
            # 计算胜率
            try:
                if total_trades > 0:
                    winning_trades = trade_analysis.get('won', {}).get('total', 0)
                    if winning_trades is None:
                        winning_trades = 0
                    win_rate = (winning_trades / total_trades) * 100
                else:
                    win_rate = 0
            except Exception as winrate_error:
                logging.warning(f"计算胜率失败: {str(winrate_error)}")
                win_rate = 0
                
            # 获取交易记录
            try:
                trade_recorder = strategy.analyzers.trade_recorder.get_analysis()
                trades = trade_recorder.get('trades', [])
                
                # 如果没有交易记录，添加一个空数组，确保前端不会出错
                if not trades:
                    logging.warning("回测期间没有交易发生")
                    trades = []
            except Exception as trades_error:
                logging.warning(f"获取交易记录失败: {str(trades_error)}")
                logging.warning(traceback.format_exc())
                trades = []
            
            # 计算年化收益率
            try:
                days = (end_date - start_date).days
                if days > 0:
                    annual_return = ((1 + total_return / 100) ** (365 / days) - 1) * 100
                else:
                    annual_return = 0
            except Exception as annual_error:
                logging.warning(f"计算年化收益率失败: {str(annual_error)}")
                annual_return = 0
                
            # 构建回测结果
            logging.info(f"回测完成: 总收益率 {total_return:.2f}%, 年化收益率 {annual_return:.2f}%, 交易次数 {total_trades}")
            
            # 添加调试信息
            debug_info = {
                'data_length': len(stock_data),
                'data_range': f"{stock_data.index.min().strftime('%Y-%m-%d')} 至 {stock_data.index.max().strftime('%Y-%m-%d')}",
                'has_trades': total_trades > 0,
                'strategy_logs': []
            }
            
            # 构建最终结果
            backtest_result = {
                'stock_code': stock_code,
                'stock_name': stock_name,
                'strategy_name': strategy_name,
                'strategy_params': params,
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'initial_cash': initial_cash,
                'final_value': final_value,
                'total_return': total_return,
                'annual_return': annual_return,
                'sharpe_ratio': sharpe_ratio,
                'max_drawdown': max_drawdown,
                'trade_count': total_trades,
                'win_rate': win_rate,
                'trades': trades,
                'chart_image': chart_image,
                'debug_info': debug_info  # 添加调试信息
            }
            
            return backtest_result
            
        except Exception as e:
            logging.error(f"回测失败: {str(e)}")
            error_traceback = traceback.format_exc()
            logging.error(error_traceback)
            raise Exception(f"回测失败: {str(e)}") 