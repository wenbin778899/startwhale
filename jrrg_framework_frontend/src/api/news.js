import http from '../utils/http';

/**
 * 获取市场新闻 (东财全球财经快讯)
 * @param {number} limit - 获取数量限制
 * @returns {Promise} - 返回新闻数据
 */
export function getMarketNews(limit = 10) {
  return http.get(`/api/news/market?limit=${limit}`);
}

/**
 * 获取财经早餐 (东财财经早餐)
 * @param {number} limit - 获取数量限制
 * @returns {Promise} - 返回新闻数据
 */
export function getBreakfastNews(limit = 10) {
  return http.get(`/api/news/breakfast?limit=${limit}`);
}

/**
 * 获取富途牛牛快讯
 * @param {number} limit - 获取数量限制
 * @returns {Promise} - 返回新闻数据
 */
export function getFutuNews(limit = 20) {
  return http.get(`/api/news/futu?limit=${limit}`);
}

/**
 * 获取同花顺财经直播
 * @param {number} limit - 获取数量限制
 * @returns {Promise} - 返回新闻数据
 */
export function getThsNews(limit = 20) {
  return http.get(`/api/news/ths?limit=${limit}`);
}

/**
 * 获取新浪财经快讯
 * @param {number} limit - 获取数量限制
 * @returns {Promise} - 返回新闻数据
 */
export function getSinaNews(limit = 20) {
  return http.get(`/api/news/sina?limit=${limit}`);
}

/**
 * 获取实时综合资讯
 * @param {string} sources - 数据源，逗号分隔，如 'global,breakfast,futu,ths,sina'
 * @param {number} limit - 每个数据源获取条数
 * @returns {Promise} - 返回新闻数据
 */
export function getRealtimeNews(sources = 'global,breakfast,futu,ths', limit = 10) {
  return http.get(`/api/news/realtime?sources=${sources}&limit=${limit}`);
}

/**
 * 获取特定主题相关的新闻
 * @param {string} topic - 主题关键词
 * @param {number} limit - 获取数量限制
 * @returns {Promise} - 返回新闻数据
 */
export function getTopicNews(topic, limit = 5) {
  return http.get(`/api/news/topic?topic=${encodeURIComponent(topic)}&limit=${limit}`);
} 