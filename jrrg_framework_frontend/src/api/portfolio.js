import http from '../utils/http';

/**
 * 获取用户所有持仓组合
 * @returns {Promise}
 */
export function getPortfolios() {
  return http.get('/api/portfolio/');
}

/**
 * 获取持仓组合详情，包括持仓股票列表和统计数据
 * @param {number} portfolioId - 组合ID
 * @returns {Promise}
 */
export function getPortfolioDetail(portfolioId) {
  return http.get(`/api/portfolio/${portfolioId}`);
}

/**
 * 创建新的持仓组合
 * @param {Object} portfolioData - 持仓组合数据
 * @param {string} portfolioData.portfolio_name - 组合名称
 * @param {string} portfolioData.description - 组合描述
 * @returns {Promise}
 */
export function createPortfolio(portfolioData) {
  return http.post('/api/portfolio/', portfolioData);
}

/**
 * 更新持仓组合信息
 * @param {number} portfolioId - 组合ID
 * @param {Object} portfolioData - 待更新的数据
 * @returns {Promise}
 */
export function updatePortfolio(portfolioId, portfolioData) {
  return http.put(`/api/portfolio/${portfolioId}`, portfolioData);
}

/**
 * 删除持仓组合
 * @param {number} portfolioId - 组合ID
 * @returns {Promise}
 */
export function deletePortfolio(portfolioId) {
  return http.delete(`/api/portfolio/${portfolioId}`);
}

/**
 * 获取持仓组合的股票列表
 * @param {number} portfolioId - 组合ID
 * @returns {Promise}
 */
export function getPortfolioStocks(portfolioId) {
  return http.get(`/api/portfolio/${portfolioId}/stocks`);
}

/**
 * 添加股票到持仓组合
 * @param {number} portfolioId - 组合ID
 * @param {Object} stockData - 股票数据
 * @returns {Promise}
 */
export function addPortfolioStock(portfolioId, stockData) {
  return http.post(`/api/portfolio/${portfolioId}/stocks`, stockData);
}

/**
 * 更新持仓股票信息
 * @param {number} portfolioId - 组合ID
 * @param {string} stockCode - 股票代码
 * @param {Object} stockData - 待更新的数据
 * @returns {Promise}
 */
export function updatePortfolioStock(portfolioId, stockCode, stockData) {
  return http.put(`/api/portfolio/${portfolioId}/stocks/${stockCode}`, stockData);
}

/**
 * 从持仓组合中删除股票
 * @param {number} portfolioId - 组合ID
 * @param {string} stockCode - 股票代码
 * @returns {Promise}
 */
export function deletePortfolioStock(portfolioId, stockCode) {
  return http.delete(`/api/portfolio/${portfolioId}/stocks/${stockCode}`);
}

/**
 * 获取交易记录
 * @param {number} portfolioId - 组合ID
 * @returns {Promise}
 */
export function getTradeRecords(portfolioId) {
  return http.get(`/api/portfolio/${portfolioId}/trades`);
}

/**
 * 创建交易记录
 * @param {number} portfolioId - 组合ID
 * @param {Object} tradeData - 交易数据
 * @returns {Promise}
 */
export function createTradeRecord(portfolioId, tradeData) {
  return http.post(`/api/portfolio/${portfolioId}/trades`, tradeData);
}

/**
 * 更新所有持仓股票的当前价格
 * @returns {Promise}
 */
export function updatePortfolioPrices() {
  return http.post('/api/portfolio/update-prices');
}

/**
 * 创建每日统计数据
 * @returns {Promise}
 */
export function createDailyStatistics() {
  return http.post('/api/portfolio/statistics/daily');
} 