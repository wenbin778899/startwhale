import http from '../utils/http';

/**
 * 获取市场新闻
 * @param {number} limit - 获取数量限制
 * @returns {Promise} - 返回新闻数据
 */
export function getMarketNews(limit = 10) {
  return http.get(`/api/news/market?limit=${limit}`);
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