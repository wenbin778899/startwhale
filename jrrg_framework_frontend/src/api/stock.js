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