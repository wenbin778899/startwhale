import http from '../utils/http';

/**
 * 获取用户自选股票列表
 * @returns {Promise}
 */
export function getFavoriteStocks() {
  return http.get('/api/strategy/favorites');
}

/**
 * 添加自选股票
 * @param {string} stockCode - 股票代码
 * @param {string} stockName - 股票名称
 * @returns {Promise}
 */
export function addFavoriteStock(stockCode, stockName) {
  return http.post('/api/strategy/favorites', {
    stock_code: stockCode,
    stock_name: stockName
  });
}

/**
 * 删除自选股票
 * @param {string} stockCode - 股票代码
 * @returns {Promise}
 */
export function removeFavoriteStock(stockCode) {
  return http.delete(`/api/strategy/favorites/${stockCode}`);
}

/**
 * 搜索股票（复用stock模块的搜索功能）
 * @param {string} keyword - 搜索关键字
 * @returns {Promise}
 */
export function searchStock(keyword) {
  return http.get(`/api/stock/search?keyword=${encodeURIComponent(keyword)}`);
}

/**
 * 获取AI分析结果
 * @param {string} prompt - 分析问题
 * @param {string} stockCode - 股票代码（可选）
 * @returns {Promise}
 */
export function getAIAnalysis(prompt, stockCode = null) {
  return http.post('/api/strategy/ai-analysis', {
    prompt: prompt,
    stock_code: stockCode
  });
}

/**
 * 获取用户的分析历史
 * @param {number} limit - 获取数量限制
 * @returns {Promise}
 */
export function getAnalysisHistory(limit = 10) {
  return http.get(`/api/strategy/analysis-history?limit=${limit}`);
}

/**
 * 批量获取自选股票的实时数据
 * @param {Array} stockCodes - 股票代码数组
 * @returns {Promise}
 */
export function getFavoriteStocksRealtime(stockCodes) {
  return http.post('/api/strategy/favorites/realtime', {
    stock_codes: stockCodes
  });
}

/**
 * 更新自选股票备注
 * @param {string} stockCode - 股票代码
 * @param {string} note - 备注内容
 * @returns {Promise}
 */
export function updateFavoriteStockNote(stockCode, note) {
  return http.put(`/api/strategy/favorites/${stockCode}/note`, {
    note: note
  });
} 