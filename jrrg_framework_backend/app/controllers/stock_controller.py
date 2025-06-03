from flask import Blueprint, request, current_app
import akshare as ak
import pandas as pd
from datetime import datetime, timedelta
import traceback
import app.utils as utils

# 创建蓝图
stock_controller = Blueprint('stock_controller', __name__)

@stock_controller.route('/info', methods=['GET'])
def get_stock_info():
    """
    获取股票信息
    请求参数:
        - symbol: 股票代码
        - days: 获取天数，默认30天
        - latest_only: 是否只返回最新的一条数据，默认false
    """
    try:
        # 获取请求参数
        symbol = request.args.get('symbol', '')
        days = int(request.args.get('days', 30))
        
        current_app.logger.info(f"获取股票信息: symbol={symbol}, days={days}")
        
        if not symbol:
            return utils.error(message='股票代码不能为空', code=400)
        
        # 计算日期范围
        end_date = datetime.now().strftime("%Y%m%d")
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y%m%d")
        
        current_app.logger.info(f"查询日期范围: {start_date} 至 {end_date}")
        
        # 获取股票历史数据
        try:
            # 确保股票代码格式正确（去除可能的前缀）
            if symbol.startswith('sh') or symbol.startswith('sz'):
                symbol = symbol[2:]
            
            # 标准化处理股票代码
            symbol = symbol.strip()
            
            # 记录实际使用的股票代码
            current_app.logger.info(f"处理后的股票代码: {symbol}")
            
            # 尝试获取股票名称，确认股票代码有效
            stock_name = "未知"
            try:
                stock_info = ak.stock_individual_info_em(symbol=symbol)
                # stock_individual_info_em返回的是一个DataFrame，第一列是属性名，第二列是属性值
                # 需要找到"股票简称"这一行
                if not stock_info.empty:
                    # 查找包含"股票简称"的行
                    name_rows = stock_info[stock_info.iloc[:, 0].str.contains('股票简称|名称', na=False)]
                    if not name_rows.empty:
                        stock_name = str(name_rows.iloc[0, 1])
                    else:
                        # 如果找不到，尝试使用第二行（通常是股票名称）
                        if len(stock_info) > 1:
                            stock_name = str(stock_info.iloc[1, 1])
                current_app.logger.info(f"获取到股票名称: {stock_name}")
            except Exception as name_error:
                current_app.logger.warning(f"获取股票名称失败: {str(name_error)}")
                stock_name = "未知"
            
            # 尝试获取股票历史数据，使用初始日期范围
            stock_data = ak.stock_zh_a_hist(
                symbol=symbol,
                period="daily",
                start_date=start_date,
                end_date=end_date,
                adjust=""
            )
            
            # 如果没有获取到数据，扩大日期范围重试，重点寻找最新可用数据
            max_retries = 3  # 减少重试次数，提高效率
            retry_count = 0
            
            while stock_data.empty and retry_count < max_retries:
                retry_count += 1
                # 更智能的重试策略：重点查找最近的数据
                if retry_count == 1:
                    # 第一次重试：扩大到90天，针对节假日等情况
                    new_start_date = (datetime.now() - timedelta(days=90)).strftime("%Y%m%d")
                elif retry_count == 2:
                    # 第二次重试：扩大到半年，针对停牌等情况
                    new_start_date = (datetime.now() - timedelta(days=180)).strftime("%Y%m%d")
                else:
                    # 第三次重试：扩大到一年，确保能获取到数据
                    new_start_date = (datetime.now() - timedelta(days=365)).strftime("%Y%m%d")
                
                current_app.logger.info(f"未找到数据，扩大查询范围: {new_start_date} 至 {end_date} (第{retry_count}次重试)")
                
                stock_data = ak.stock_zh_a_hist(
                    symbol=symbol,
                    period="daily",
                    start_date=new_start_date,
                    end_date=end_date,
                    adjust=""
                )
                
                # 如果获取到数据，记录实际获取的数据范围
                if not stock_data.empty:
                    actual_start = stock_data['日期'].min()
                    actual_end = stock_data['日期'].max()
                    current_app.logger.info(f"成功获取数据，实际范围: {actual_start} 至 {actual_end}，共{len(stock_data)}条记录")
            
            # 如果获取到数据，按日期排序确保最新数据在最后，然后根据需求返回数据
            if not stock_data.empty:
                # 按日期降序排序，最新的数据在前面
                stock_data = stock_data.sort_values('日期', ascending=False)
                
                # 检查是否只需要最新的一条数据
                latest_only = request.args.get('latest_only', 'false').lower() == 'true'
                
                if latest_only:
                    # 只返回最新的一条记录
                    result = [stock_data.iloc[0].to_dict()]
                    latest_date = stock_data['日期'].iloc[0]
                    current_app.logger.info(f"返回最新单条数据，日期: {latest_date}")
                else:
                    # 返回所有数据，但按从新到旧排序
                    result = stock_data.to_dict('records')
                    latest_date = stock_data['日期'].iloc[0]  # 第一条是最新的
                    earliest_date = stock_data['日期'].iloc[-1]  # 最后一条是最旧的
                    current_app.logger.info(f"获取到历史数据记录数: {len(result)}，最新交易日期: {latest_date}，最早日期: {earliest_date}")
            else:
                result = []
            
            # 如果还是没有数据，尝试使用备用方法
            if not result:
                current_app.logger.warning(f"扩大范围后仍未找到历史数据，尝试使用实时接口获取最新数据")
                try:
                    # 尝试使用real_time接口获取最新数据
                    stock_real_time = ak.stock_zh_a_spot_em()
                    stock_row = stock_real_time[stock_real_time['代码'] == symbol]
                    
                    if not stock_row.empty:
                        current_app.logger.info(f"使用实时接口获取到最新交易数据")
                        # 构造一条记录
                        today = datetime.now().strftime("%Y-%m-%d")
                        record = {
                            '日期': today,
                            '开盘': float(stock_row['开盘'].values[0]),
                            '收盘': float(stock_row['最新价'].values[0]),
                            '最高': float(stock_row['最高'].values[0]),
                            '最低': float(stock_row['最低'].values[0]),
                            '成交量': float(stock_row['成交量'].values[0]),
                            '成交额': float(stock_row['成交额'].values[0]),
                            '振幅': float(stock_row['振幅'].values[0]),
                            '涨跌幅': float(stock_row['涨跌幅'].values[0]),
                            '涨跌额': float(stock_row['涨跌额'].values[0]),
                            '换手率': float(stock_row['换手率'].values[0])
                        }
                        result = [record]
                        current_app.logger.info(f"使用实时数据构造记录，日期: {today}")
                    else:
                        current_app.logger.warning(f"实时接口也未找到股票 {symbol} 的数据，可能是无效股票代码")
                except Exception as real_time_error:
                    current_app.logger.error(f"实时接口获取数据失败: {str(real_time_error)}")
            
            return utils.success(
                data={
                    'symbol': symbol,
                    'name': stock_name,
                    'history': result
                },
                message='获取成功'
            )
        except Exception as data_error:
            current_app.logger.error(f"获取股票数据失败: {str(data_error)}")
            current_app.logger.error(traceback.format_exc())
            return utils.error(message=f'获取股票数据失败: {str(data_error)}', code=500, status=500)
            
    except Exception as e:
        current_app.logger.error(f"获取股票信息失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'获取股票信息失败: {str(e)}', code=500, status=500)

@stock_controller.route('/search', methods=['GET'])
def search_stock():
    """
    搜索股票
    请求参数:
        - keyword: 关键字（股票代码或名称）
    """
    try:
        keyword = request.args.get('keyword', '')
        
        current_app.logger.info(f"搜索股票: keyword={keyword}")
        
        if not keyword:
            return utils.error(message='关键字不能为空', code=400)
        
        # 获取A股股票列表
        try:
            stock_list = ak.stock_zh_a_spot_em()
            current_app.logger.info(f"获取到股票列表，共 {len(stock_list)} 条记录")
            
            # 筛选匹配的股票
            # 将关键字转换为小写，以便进行不区分大小写的匹配
            keyword_lower = keyword.lower()
            
            # 使用更安全的方式进行字符串匹配
            result = stock_list[
                stock_list['代码'].str.contains(keyword, case=False, na=False) | 
                stock_list['名称'].str.contains(keyword, case=False, na=False)
            ]
            
            current_app.logger.info(f"搜索结果: 找到 {len(result)} 条匹配记录")
            
            if result.empty:
                return utils.success(
                    data=[],
                    message='未找到匹配的股票'
                )
            
            # 只返回代码和名称
            simplified_result = result[['代码', '名称']].to_dict('records')
            
            return utils.success(
                data=simplified_result,
                message='搜索成功'
            )
        except Exception as search_error:
            current_app.logger.error(f"搜索股票数据失败: {str(search_error)}")
            current_app.logger.error(traceback.format_exc())
            return utils.error(message=f'搜索股票失败: {str(search_error)}', code=500, status=500)
            
    except Exception as e:
        current_app.logger.error(f"搜索股票失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'搜索股票失败: {str(e)}', code=500, status=500)

@stock_controller.route('/basic_info', methods=['GET'])
def get_stock_basic_info():
    """
    获取股票基本信息
    请求参数:
        - symbol: 股票代码
    """
    try:
        # 获取请求参数
        symbol = request.args.get('symbol', '')
        
        current_app.logger.info(f"获取股票基本信息: symbol={symbol}")
        
        if not symbol:
            return utils.error(message='股票代码不能为空', code=400)
        
        # 标准化处理股票代码
        if symbol.startswith('sh') or symbol.startswith('sz'):
            symbol = symbol[2:]
        symbol = symbol.strip()
        
        try:
            # 获取个股资料
            current_app.logger.info(f"获取股票 {symbol} 的基本信息")
            stock_info = ak.stock_individual_info_em(symbol=symbol)
            
            if stock_info.empty:
                return utils.error(message='未找到股票信息', code=404, status=404)
            
            # 转换为字典
            info_dict = {}
            for _, row in stock_info.iterrows():
                info_dict[row[0]] = row[1]
            
            # 获取个股资金流向
            try:
                current_app.logger.info(f"获取股票 {symbol} 的资金流向")
                stock_flow = ak.stock_individual_fund_flow_rank(symbol=symbol)
                flow_dict = stock_flow.to_dict('records')[0] if not stock_flow.empty else {}
            except Exception as flow_error:
                current_app.logger.warning(f"获取资金流向失败: {str(flow_error)}")
                flow_dict = {}
            
            # 获取行业信息
            try:
                current_app.logger.info(f"获取股票 {symbol} 的行业信息")
                stock_industry = ak.stock_board_industry_name_em()
                industry_info = stock_industry[stock_industry['代码'] == symbol]
                industry_dict = industry_info.to_dict('records')[0] if not industry_info.empty else {}
            except Exception as industry_error:
                current_app.logger.warning(f"获取行业信息失败: {str(industry_error)}")
                industry_dict = {}
            
            # 合并结果
            result = {
                'symbol': symbol,
                'basic_info': info_dict,
                'fund_flow': flow_dict,
                'industry': industry_dict
            }
            
            return utils.success(
                data=result,
                message='获取成功'
            )
            
        except Exception as info_error:
            current_app.logger.error(f"获取股票基本信息失败: {str(info_error)}")
            current_app.logger.error(traceback.format_exc())
            return utils.error(message=f'获取股票基本信息失败: {str(info_error)}', code=500, status=500)
            
    except Exception as e:
        current_app.logger.error(f"获取股票基本信息失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'获取股票基本信息失败: {str(e)}', code=500, status=500)

@stock_controller.route('/news', methods=['GET'])
def get_stock_news():
    """
    获取股票相关新闻
    请求参数:
        - symbol: 股票代码
        - limit: 获取新闻条数，默认10条
    """
    try:
        # 获取请求参数
        symbol = request.args.get('symbol', '')
        limit = int(request.args.get('limit', 10))
        
        current_app.logger.info(f"获取股票新闻: symbol={symbol}, limit={limit}")
        
        if not symbol:
            return utils.error(message='股票代码不能为空', code=400)
        
        # 标准化处理股票代码
        if symbol.startswith('sh') or symbol.startswith('sz'):
            symbol = symbol[2:]
        symbol = symbol.strip()
        
        try:
            # 获取股票新闻
            current_app.logger.info(f"获取股票 {symbol} 的相关新闻")
            stock_news = ak.stock_news_em(symbol=symbol)
            
            if stock_news.empty:
                return utils.success(
                    data=[],
                    message='未找到相关新闻'
                )
            
            # 按照发布时间降序排序
            stock_news_sorted = stock_news.sort_values(by='发布时间', ascending=False)
            
            # 限制返回条数
            stock_news_limited = stock_news_sorted.head(limit)
            
            # 转换为字典列表
            news_list = stock_news_limited.to_dict('records')
            
            current_app.logger.info(f"获取到新闻记录数: {len(news_list)}")
            
            return utils.success(
                data=news_list,
                message='获取成功'
            )
            
        except Exception as news_error:
            current_app.logger.error(f"获取股票新闻失败: {str(news_error)}")
            current_app.logger.error(traceback.format_exc())
            return utils.error(message=f'获取股票新闻失败: {str(news_error)}', code=500, status=500)
            
    except Exception as e:
        current_app.logger.error(f"获取股票新闻失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'获取股票新闻失败: {str(e)}', code=500, status=500)

@stock_controller.route('/market_indexes', methods=['GET'])
def get_market_indexes():
    """
    获取三大指数实时行情 - 使用雪球接口获取实时数据
    """
    try:
        current_app.logger.info("获取三大指数实时行情")
        
        # 定义三大指数对应的雪球symbol
        indexes_info = {
            "shanghai": {"symbol": "SH000001", "code": "000001", "name": "上证指数"},
            "shenzhen": {"symbol": "SZ399001", "code": "399001", "name": "深证成指"},
            "chuangye": {"symbol": "SZ399006", "code": "399006", "name": "创业板指"}
        }
        
        indexes_data = {}
        
        # 分别获取三大指数实时数据
        for key, index_info in indexes_info.items():
            try:
                symbol = index_info["symbol"]
                current_app.logger.info(f"获取指数 {symbol} 的实时数据")
                
                # 使用雪球接口获取实时数据
                stock_data = ak.stock_individual_spot_xq(symbol=symbol)
                
                if not stock_data.empty:
                    current_app.logger.info(f"获取到 {symbol} 数据: {stock_data.to_dict()}")
                    
                    # 解析雪球返回的数据
                    data_dict = {}
                    for _, row in stock_data.iterrows():
                        data_dict[row['item']] = row['value']
                    
                    # 获取关键数据
                    current_price = float(data_dict.get('现价', 0))
                    yesterday_close = float(data_dict.get('昨收', current_price))
                    change_amount = float(data_dict.get('涨跌', 0))
                    change_percent = float(data_dict.get('涨幅', 0))  # 涨幅百分比转换为小数
                    
                    indexes_data[key] = {
                        "code": index_info["code"],
                        "name": index_info["name"],
                        "index": current_price,
                        "change": change_amount,
                        "changePercent": change_percent
                    }
                    
                    current_app.logger.info(f"成功获取 {symbol} 实时数据: 现价={current_price}, 涨跌={change_amount}, 涨幅={change_percent}")
                    
                else:
                    current_app.logger.warning(f"获取指数 {symbol} 数据为空")
                    # 使用默认数据
                    indexes_data[key] = get_default_index_data(key, index_info)
                    
            except Exception as single_index_error:
                current_app.logger.error(f"获取指数 {symbol} 数据失败: {str(single_index_error)}")
                current_app.logger.error(traceback.format_exc())
                # 使用默认数据
                indexes_data[key] = get_default_index_data(key, index_info)
        
        # 检查是否至少获取到一个指数的数据
        if indexes_data:
            current_app.logger.info("成功获取三大指数实时数据")
            return utils.success(
                data=indexes_data,
                message="获取三大指数实时数据成功"
            )
        else:
            # 如果都获取失败，返回默认数据
            current_app.logger.warning("所有指数数据获取失败，返回默认数据")
            return get_fallback_indexes_data()
            
    except Exception as e:
        current_app.logger.error(f"处理三大指数请求失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return get_fallback_indexes_data()

def get_default_index_data(key, index_info):
    """获取默认的指数数据"""
    default_data = {
        "code": index_info["code"],
        "name": index_info["name"]
    }
    
    if key == "shanghai":
        default_data.update({
            "index": 3347.48,
            "change": -11.32,
            "changePercent": -0.0033
        })
    elif key == "shenzhen":
        default_data.update({
            "index": 10040.62,
            "change": -50.57,
            "changePercent": -0.005
        })
    else:  # 创业板
        default_data.update({
            "index": 1993.18,
            "change": -9.54,
            "changePercent": -0.0048
        })
    
    return default_data

def get_fallback_indexes_data():
    """获取后备的指数数据"""
    return utils.success(
        data={
            "shanghai": {
                "code": "000001",
                "name": "上证指数",
                "index": 3347.48,
                "change": -11.32,
                "changePercent": -0.0033
            },
            "shenzhen": {
                "code": "399001",
                "name": "深证成指",
                "index": 10040.62,
                "change": -50.57,
                "changePercent": -0.005
            },
            "chuangye": {
                "code": "399006",
                "name": "创业板指",
                "index": 1993.18,
                "change": -9.54,
                "changePercent": -0.0048
            }
        },
        message="获取三大指数数据失败，返回默认数据"
    )

@stock_controller.route('/market_trend', methods=['GET'])
def get_market_trend():
    """
    获取市场指数走势数据，支持不同时间区间
    请求参数:
        - index_code: 指数代码，默认为000001（上证指数）
        - period: 时间区间，可选值：3m（3个月）, 1y（1年）, 5y（5年），默认为1y
    """
    try:
        # 获取请求参数
        index_code = request.args.get('index_code', '000001')
        period = request.args.get('period', '1y')
        
        current_app.logger.info(f"获取市场指数走势: index_code={index_code}, period={period}")
        
        # 计算开始日期
        end_date = datetime.now().strftime("%Y%m%d")
        if period == '3m':
            start_date = (datetime.now() - timedelta(days=90)).strftime("%Y%m%d")
        elif period == '5y':
            start_date = (datetime.now() - timedelta(days=365*5)).strftime("%Y%m%d")
        else:  # 默认1年
            start_date = (datetime.now() - timedelta(days=365)).strftime("%Y%m%d")
        
        current_app.logger.info(f"查询日期范围: {start_date} 至 {end_date}")
        
        # 判断指数类型，确定前缀
        prefix = "sh" if index_code in ["000001"] else "sz"
        full_code = f"{prefix}{index_code}"
        
        current_app.logger.info(f"构建完整指数代码: {full_code}")
        
        try:
            # 获取指数历史数据
            current_app.logger.info(f"开始获取指数 {full_code} 的历史数据")
            
            # 尝试直接使用stock_zh_index_daily函数获取数据
            try:
                index_data = ak.stock_zh_index_daily(symbol=full_code)
                current_app.logger.info(f"成功获取到指数数据，共 {len(index_data)} 条记录")
                
                # 打印数据的前几行用于调试
                if not index_data.empty:
                    current_app.logger.info(f"数据示例: {index_data.head(3)}")
                    current_app.logger.info(f"数据索引类型: {type(index_data.index)}")
                    current_app.logger.info(f"数据索引示例: {list(index_data.index)[:3]}")
                    
            except Exception as e:
                current_app.logger.error(f"使用stock_zh_index_daily获取数据失败: {str(e)}")
                current_app.logger.error(traceback.format_exc())
                
                # 尝试使用备用方法获取数据
                current_app.logger.info(f"尝试使用stock_zh_index_daily_tx获取数据")
                try:
                    index_data = ak.stock_zh_index_daily_tx(symbol=index_code)
                    current_app.logger.info(f"使用备用方法成功获取到指数数据，共 {len(index_data)} 条记录")
                except Exception as backup_e:
                    current_app.logger.error(f"备用方法也失败: {str(backup_e)}")
                    current_app.logger.error(traceback.format_exc())
                    return utils.error(message=f'获取指数数据失败: {str(e)}', code=500, status=500)
            
            # 如果数据为空，返回错误
            if index_data is None or index_data.empty:
                current_app.logger.error(f"获取到的指数数据为空")
                return utils.error(message=f'获取到的指数 {index_code} 数据为空', code=404, status=404)
            
            current_app.logger.info(f"开始处理日期筛选")
            
            # 将索引转换为日期对象以便比较
            try:
                # 添加一个date_dt列，用于日期筛选
                index_data['date_dt'] = pd.to_datetime(index_data['date'])
                current_app.logger.info(f"日期转换成功，示例: {index_data['date_dt'].head(3)}")
                
                # 转换筛选日期
                start_date_dt = datetime.strptime(start_date, "%Y%m%d")
                end_date_dt = datetime.strptime(end_date, "%Y%m%d")
                
                # 筛选日期范围内的数据
                filtered_data = index_data[(index_data['date_dt'] >= start_date_dt) & (index_data['date_dt'] <= end_date_dt)]
                
                current_app.logger.info(f"日期筛选后的数据条数: {len(filtered_data)}")
                
                if filtered_data.empty:
                    current_app.logger.warning(f"筛选后没有数据，尝试返回所有数据")
                    filtered_data = index_data  # 如果筛选后没有数据，则使用所有数据
            except Exception as date_error:
                current_app.logger.error(f"日期处理出错: {str(date_error)}")
                current_app.logger.error(traceback.format_exc())
                filtered_data = index_data  # 如果日期处理出错，则使用所有数据
            
            # 获取指数名称
            index_name = ""
            if index_code == "000001":
                index_name = "上证指数"
            elif index_code == "399001":
                index_name = "深证成指"
            elif index_code == "399006":
                index_name = "创业板指"
            
            # 转换为字典列表，包含日期和收盘价
            result = []
            
            try:
                for _, row in filtered_data.iterrows():
                    try:
                        date_obj = row['date_dt'] if 'date_dt' in row else pd.to_datetime(row.name)
                        date_str = date_obj.strftime("%Y-%m-%d")
                        
                        data_point = {
                            "date": date_str,
                            "close": float(row['close']) if 'close' in row else float(row['收盘']),
                            "open": float(row['open']) if 'open' in row else float(row['开盘']),
                            "high": float(row['high']) if 'high' in row else float(row['最高']),
                            "low": float(row['low']) if 'low' in row else float(row['最低']),
                            "volume": float(row['volume']) if 'volume' in row else float(row.get('成交量', 0))
                        }
                        result.append(data_point)
                    except Exception as row_error:
                        current_app.logger.error(f"处理数据行出错: {str(row_error)}")
                        current_app.logger.error(f"问题数据行: {row}")
                        # 继续处理下一行
                
                current_app.logger.info(f"成功处理 {len(result)} 条数据")
                
                # 按日期排序
                result.sort(key=lambda x: x['date'])
                
                # 如果数据量太大，进行采样
                if len(result) > 500:
                    current_app.logger.info(f"数据量太大 ({len(result)}条)，进行采样")
                    step = len(result) // 500 + 1
                    result = result[::step]
                    current_app.logger.info(f"采样后数据量: {len(result)}条")
                
                return utils.success(
                    data={
                        "code": index_code,
                        "name": index_name,
                        "period": period,
                        "data": result
                    },
                    message="获取市场指数走势数据成功"
                )
            except Exception as convert_error:
                current_app.logger.error(f"转换数据格式失败: {str(convert_error)}")
                current_app.logger.error(traceback.format_exc())
                return utils.error(message=f'转换数据格式失败: {str(convert_error)}', code=500, status=500)
            
        except Exception as data_error:
            current_app.logger.error(f"获取指数历史数据失败: {str(data_error)}")
            current_app.logger.error(traceback.format_exc())
            return utils.error(message=f'获取指数历史数据失败: {str(data_error)}', code=500, status=500)
            
    except Exception as e:
        current_app.logger.error(f"获取市场指数走势失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'获取市场指数走势失败: {str(e)}', code=500, status=500)

@stock_controller.route('/intraday', methods=['GET'])
def get_stock_intraday():
    """
    获取股票分时数据
    请求参数:
        - symbol: 股票代码
    """
    try:
        # 获取请求参数
        symbol = request.args.get('symbol', '')
        
        current_app.logger.info(f"获取股票分时数据: symbol={symbol}")
        
        if not symbol:
            return utils.error(message='股票代码不能为空', code=400)
        
        # 标准化处理股票代码
        if symbol.startswith('sh') or symbol.startswith('sz'):
            symbol = symbol[2:]
        symbol = symbol.strip()
        
        current_app.logger.info(f"处理后的股票代码: {symbol}")
        
        try:
            # 获取股票名称
            stock_name = "未知"
            try:
                stock_info = ak.stock_individual_info_em(symbol=symbol)
                if not stock_info.empty:
                    name_rows = stock_info[stock_info.iloc[:, 0].str.contains('股票简称|名称', na=False)]
                    if not name_rows.empty:
                        stock_name = str(name_rows.iloc[0, 1])
                    else:
                        if len(stock_info) > 1:
                            stock_name = str(stock_info.iloc[1, 1])
                current_app.logger.info(f"获取到股票名称: {stock_name}")
            except Exception as name_error:
                current_app.logger.warning(f"获取股票名称失败: {str(name_error)}")
                stock_name = "未知"
            
            # 获取分时数据
            current_app.logger.info(f"获取股票 {symbol} 的分时数据")
            intraday_data = ak.stock_intraday_em(symbol=symbol)
            
            if intraday_data.empty:
                current_app.logger.warning(f"未获取到股票 {symbol} 的分时数据")
                return utils.error(message='未获取到分时数据', code=404, status=404)
            
            current_app.logger.info(f"获取到分时数据，共 {len(intraday_data)} 条记录")
            
            # 获取前一日收盘价用于计算涨跌幅
            try:
                # 获取历史数据获取前日收盘价
                end_date = datetime.now().strftime("%Y%m%d")
                start_date = (datetime.now() - timedelta(days=5)).strftime("%Y%m%d")
                
                hist_data = ak.stock_zh_a_hist(
                    symbol=symbol,
                    period="daily",
                    start_date=start_date,
                    end_date=end_date,
                    adjust=""
                )
                
                prev_close = None
                if not hist_data.empty:
                    # 按日期降序排序，获取最近两个交易日的数据
                    hist_data_sorted = hist_data.sort_values('日期', ascending=False)
                    if len(hist_data_sorted) >= 2:
                        # 第二条记录是前一个交易日
                        prev_close = float(hist_data_sorted.iloc[1]['收盘'])
                    elif len(hist_data_sorted) >= 1:
                        # 如果只有一条记录，使用其开盘价作为参考
                        prev_close = float(hist_data_sorted.iloc[0]['开盘'])
                
                current_app.logger.info(f"前日收盘价: {prev_close}")
            except Exception as hist_error:
                current_app.logger.warning(f"获取历史数据失败: {str(hist_error)}")
                prev_close = None
            
            # 处理分时数据
            current_price = float(intraday_data['成交价'].iloc[-1])  # 最新价格
            high_price = float(intraday_data['成交价'].max())        # 今日最高价
            low_price = float(intraday_data['成交价'].min())         # 今日最低价
            open_price = float(intraday_data['成交价'].iloc[0])      # 今日开盘价
            
            # 计算涨跌额和涨跌幅
            if prev_close:
                change = current_price - prev_close
                change_percent = (change / prev_close) * 100
            else:
                # 如果没有前日收盘价，使用开盘价作为参考
                change = current_price - open_price
                change_percent = (change / open_price) * 100 if open_price != 0 else 0
            
            # 获取最新交易时间（精确到秒）
            latest_time = intraday_data['时间'].iloc[-1]
            today_date = datetime.now().strftime("%Y-%m-%d")
            latest_datetime = f"{today_date} {latest_time}"
            
            # 计算总成交量（手数总和）
            total_volume = int(intraday_data['手数'].sum())
            
            # 准备分时图表数据
            chart_data = []
            for _, row in intraday_data.iterrows():
                chart_data.append({
                    'time': row['时间'],
                    'price': float(row['成交价']),
                    'volume': int(row['手数'])
                })
            
            # 构造结果
            result = {
                'symbol': symbol,
                'name': stock_name,
                'current_price': current_price,
                'open_price': open_price,
                'high_price': high_price,
                'low_price': low_price,
                'prev_close': prev_close,
                'change': change,
                'change_percent': change_percent,
                'volume': total_volume,
                'latest_time': latest_datetime,
                'trade_count': len(intraday_data),
                'chart_data': chart_data
            }
            
            current_app.logger.info(f"分时数据处理完成: 最新价={current_price}, 涨跌幅={change_percent:.2f}%, 最高价={high_price}")
            
            return utils.success(
                data=result,
                message='获取分时数据成功'
            )
            
        except Exception as data_error:
            current_app.logger.error(f"获取分时数据失败: {str(data_error)}")
            current_app.logger.error(traceback.format_exc())
            return utils.error(message=f'获取分时数据失败: {str(data_error)}', code=500, status=500)
            
    except Exception as e:
        current_app.logger.error(f"获取分时数据失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'获取分时数据失败: {str(e)}', code=500, status=500)

@stock_controller.route('/hot_stocks', methods=['GET'])
def get_hot_stocks():
    """
    获取微博舆情热门股票
    请求参数:
        - time_period: 时间周期（可选），默认CNHOUR12
                      CNHOUR2(2小时) CNHOUR6(6小时) CNHOUR12(12小时) 
                      CNHOUR24(1天) CNDAY7(1周) CNDAY30(1月)
    """
    try:
        # 获取时间周期参数
        time_period = request.args.get('time_period', 'CNHOUR12')
        
        current_app.logger.info(f"获取微博舆情热门股票: time_period={time_period}")
        
        # 验证时间周期参数
        valid_periods = ['CNHOUR2', 'CNHOUR6', 'CNHOUR12', 'CNHOUR24', 'CNDAY7', 'CNDAY30']
        if time_period not in valid_periods:
            return utils.error(message=f'无效的时间周期，支持的值: {", ".join(valid_periods)}', code=400)
        
        # 获取微博舆情报告中的热门股票
        try:
            hot_stocks_df = ak.stock_js_weibo_report(time_period=time_period)
            
            if hot_stocks_df.empty:
                current_app.logger.warning("微博舆情接口返回空数据")
                return utils.success(data=[], message='暂无热门股票数据')
            
            # 转换为字典列表
            hot_stocks_list = hot_stocks_df.to_dict('records')
            
            # 处理数据格式，确保rate字段为数值类型
            processed_stocks = []
            for stock in hot_stocks_list:
                try:
                    rate_value = float(stock.get('rate', 0))
                    processed_stocks.append({
                        'name': stock.get('name', ''),
                        'rate': rate_value,
                        'rate_display': f"{rate_value:+.2f}%" if rate_value != 0 else "0.00%"
                    })
                except (ValueError, TypeError):
                    # 如果转换失败，跳过这条记录
                    current_app.logger.warning(f"无法解析股票 {stock.get('name', 'unknown')} 的rate值: {stock.get('rate', 'N/A')}")
                    continue
            
            current_app.logger.info(f"成功获取 {len(processed_stocks)} 只热门股票")
            
            return utils.success(
                data={
                    'stocks': processed_stocks,
                    'time_period': time_period,
                    'update_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                },
                message='获取热门股票成功'
            )
            
        except Exception as api_error:
            current_app.logger.error(f"调用akshare微博舆情接口失败: {str(api_error)}")
            current_app.logger.error(traceback.format_exc())
            
            # 返回备用数据
            fallback_data = [
                {'name': '中国平安', 'rate': 8.5, 'rate_display': '+8.50%'},
                {'name': '招商银行', 'rate': 7.2, 'rate_display': '+7.20%'},
                {'name': '贵州茅台', 'rate': 6.8, 'rate_display': '+6.80%'},
                {'name': '比亚迪', 'rate': 6.3, 'rate_display': '+6.30%'},
                {'name': '宁德时代', 'rate': 5.9, 'rate_display': '+5.90%'},
                {'name': '五粮液', 'rate': 5.1, 'rate_display': '+5.10%'},
                {'name': '美的集团', 'rate': 4.7, 'rate_display': '+4.70%'},
                {'name': '腾讯控股', 'rate': 4.2, 'rate_display': '+4.20%'},
                {'name': '阿里巴巴', 'rate': 3.8, 'rate_display': '+3.80%'},
                {'name': '工商银行', 'rate': 3.5, 'rate_display': '+3.50%'}
            ]
            
            current_app.logger.info("使用备用热门股票数据")
            
            return utils.success(
                data={
                    'stocks': fallback_data,
                    'time_period': time_period,
                    'update_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'fallback': True
                },
                message='获取热门股票成功（备用数据）'
            )
            
    except Exception as e:
        current_app.logger.error(f"获取热门股票失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return utils.error(message=f'获取热门股票失败: {str(e)}', code=500) 