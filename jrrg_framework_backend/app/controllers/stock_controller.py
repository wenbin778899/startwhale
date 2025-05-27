from flask import Blueprint, request, jsonify, current_app
import akshare as ak
import pandas as pd
from datetime import datetime, timedelta
import traceback

# 创建蓝图
stock_controller = Blueprint('stock_controller', __name__)

@stock_controller.route('/info', methods=['GET'])
def get_stock_info():
    """
    获取股票信息
    请求参数:
        - symbol: 股票代码
        - days: 获取天数，默认30天
    """
    try:
        # 获取请求参数
        symbol = request.args.get('symbol', '')
        days = int(request.args.get('days', 30))
        
        current_app.logger.info(f"获取股票信息: symbol={symbol}, days={days}")
        
        if not symbol:
            return jsonify({'code': 400, 'message': '股票代码不能为空'}), 400
        
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
            try:
                stock_info = ak.stock_individual_info_em(symbol=symbol)
                stock_name = stock_info.iloc[0, 1] if not stock_info.empty else "未知"
                current_app.logger.info(f"获取到股票名称: {stock_name}")
            except Exception as name_error:
                current_app.logger.warning(f"获取股票名称失败: {str(name_error)}")
                stock_name = "未知"
            
            # 获取股票历史数据
            stock_data = ak.stock_zh_a_hist(
                symbol=symbol,
                period="daily",
                start_date=start_date,
                end_date=end_date,
                adjust=""
            )
            
            # 转换为字典列表
            result = stock_data.to_dict('records')
            current_app.logger.info(f"获取到历史数据记录数: {len(result)}")
            
            return jsonify({
                'code': 200,
                'message': '获取成功',
                'data': {
                    'symbol': symbol,
                    'name': stock_name,
                    'history': result
                }
            })
        except Exception as data_error:
            current_app.logger.error(f"获取股票数据失败: {str(data_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({'code': 500, 'message': f'获取股票数据失败: {str(data_error)}'}), 500
            
    except Exception as e:
        current_app.logger.error(f"获取股票信息失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'code': 500, 'message': f'获取股票信息失败: {str(e)}'}), 500

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
            return jsonify({'code': 400, 'message': '关键字不能为空'}), 400
        
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
                return jsonify({
                    'code': 200,
                    'message': '未找到匹配的股票',
                    'data': []
                })
            
            # 只返回代码和名称
            simplified_result = result[['代码', '名称']].to_dict('records')
            
            return jsonify({
                'code': 200,
                'message': '搜索成功',
                'data': simplified_result
            })
        except Exception as search_error:
            current_app.logger.error(f"搜索股票数据失败: {str(search_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({'code': 500, 'message': f'搜索股票失败: {str(search_error)}'}), 500
            
    except Exception as e:
        current_app.logger.error(f"搜索股票失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'code': 500, 'message': f'搜索股票失败: {str(e)}'}), 500

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
            return jsonify({'code': 400, 'message': '股票代码不能为空'}), 400
        
        # 标准化处理股票代码
        if symbol.startswith('sh') or symbol.startswith('sz'):
            symbol = symbol[2:]
        symbol = symbol.strip()
        
        try:
            # 获取个股资料
            current_app.logger.info(f"获取股票 {symbol} 的基本信息")
            stock_info = ak.stock_individual_info_em(symbol=symbol)
            
            if stock_info.empty:
                return jsonify({'code': 404, 'message': '未找到股票信息'}), 404
            
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
            
            return jsonify({
                'code': 200,
                'message': '获取成功',
                'data': result
            })
            
        except Exception as info_error:
            current_app.logger.error(f"获取股票基本信息失败: {str(info_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({'code': 500, 'message': f'获取股票基本信息失败: {str(info_error)}'}), 500
            
    except Exception as e:
        current_app.logger.error(f"获取股票基本信息失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'code': 500, 'message': f'获取股票基本信息失败: {str(e)}'}), 500

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
            return jsonify({'code': 400, 'message': '股票代码不能为空'}), 400
        
        # 标准化处理股票代码
        if symbol.startswith('sh') or symbol.startswith('sz'):
            symbol = symbol[2:]
        symbol = symbol.strip()
        
        try:
            # 获取股票新闻
            current_app.logger.info(f"获取股票 {symbol} 的相关新闻")
            stock_news = ak.stock_news_em(symbol=symbol)
            
            if stock_news.empty:
                return jsonify({
                    'code': 200,
                    'message': '未找到相关新闻',
                    'data': []
                })
            
            # 按照发布时间降序排序
            stock_news_sorted = stock_news.sort_values(by='发布时间', ascending=False)
            
            # 限制返回条数
            stock_news_limited = stock_news_sorted.head(limit)
            
            # 转换为字典列表
            news_list = stock_news_limited.to_dict('records')
            
            current_app.logger.info(f"获取到新闻记录数: {len(news_list)}")
            
            return jsonify({
                'code': 200,
                'message': '获取成功',
                'data': news_list
            })
            
        except Exception as news_error:
            current_app.logger.error(f"获取股票新闻失败: {str(news_error)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({'code': 500, 'message': f'获取股票新闻失败: {str(news_error)}'}), 500
            
    except Exception as e:
        current_app.logger.error(f"获取股票新闻失败: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'code': 500, 'message': f'获取股票新闻失败: {str(e)}'}), 500 