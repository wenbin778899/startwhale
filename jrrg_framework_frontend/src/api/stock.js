import http from '../utils/http';

/**
 * 搜索股票
 * @param {string} keyword - 搜索关键字
 * @returns {Promise}
 */
export function searchStock(keyword) {
  return http.get(`/api/stock/search?keyword=${encodeURIComponent(keyword)}`);
}

/**
 * 获取股票信息
 * @param {string} symbol - 股票代码
 * @param {number} days - 获取天数
 * @returns {Promise}
 */
export function getStockInfo(symbol, days = 30) {
  return http.get(`/api/stock/info?symbol=${symbol}&days=${days}`);
}

/**
 * 获取股票基本信息
 * @param {string} symbol - 股票代码
 * @returns {Promise}
 */
export function getStockBasicInfo(symbol) {
  return http.get(`/api/stock/basic_info?symbol=${symbol}`);
}

/**
 * 获取股票相关新闻
 * @param {string} symbol - 股票代码
 * @param {number} limit - 获取新闻条数
 * @returns {Promise}
 */
export function getStockNews(symbol, limit = 10) {
  return http.get(`/api/stock/news?symbol=${symbol}&limit=${limit}`);
}

/**
 * 获取三大指数实时数据
 * @returns {Promise}
 */
export function getMarketIndexes() {
  return http.get('/api/stock/market_indexes');
}

/**
 * 获取市场指数走势数据
 * @param {string} indexCode - 指数代码，默认为000001（上证指数）
 * @param {string} period - 时间区间，可选值：3m（3个月）, 1y（1年）, 5y（5年），默认为1y
 * @returns {Promise}
 */
export function getMarketTrend(indexCode = '000001', period = '1y') {
  return http.get(`/api/stock/market_trend?index_code=${indexCode}&period=${period}`);
} 