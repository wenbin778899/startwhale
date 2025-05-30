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
 * 直接调用Deepseek API进行AI分析
 * @param {string} prompt - 分析问题
 * @param {string} stockCode - 股票代码（可选）
 * @param {Object} previousContext - 前一个对话的上下文（可选）
 * @returns {Promise} - 返回分析结果
 */
export function getDeepseekAnalysis(prompt, stockCode, previousContext = null) {
  console.log('直接调用Deepseek API开始分析:', prompt);
  
  // 安全考虑：在生产环境中应该使用环境变量或专门的密钥管理服务
  // 这里使用前端环境变量(需在.env文件中配置)
  const DEEPSEEK_API_KEY = process.env.REACT_APP_DEEPSEEK_API_KEY || "sk-b1f5f2e0558a4b5daca6b20d2b68f9c4";
  
  // 构建消息列表，包含前一个对话的上下文（如果存在）
  let messages = [
    {
      role: "system",
      content: "你是一个专业的股票投资分析师，请基于用户的问题提供专业、客观的分析建议。请用中文回答，内容要详细且具有实用性。"
    }
  ];
  
  // 如果有前一个对话，添加到消息列表中
  if (previousContext) {
    messages.push({ 
      role: "user", 
      content: previousContext.question 
    });
    
    messages.push({ 
      role: "assistant", 
      content: previousContext.answer 
    });
    
    console.log("添加前一个对话上下文");
  }
  
  // 添加当前用户问题
  messages.push({
    role: "user",
    content: stockCode ? `股票代码：${stockCode}，分析问题：${prompt}` : prompt
  });
  
  const payload = {
    model: "deepseek-chat",
    messages: messages,
    temperature: 0.7,
    max_tokens: 1000,
    stream: false
  };

  return fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Deepseek API 请求失败: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Deepseek API 返回数据:', data);
    // 提取回答内容
    const analysisContent = data.choices[0]?.message?.content || '无法获取分析结果';
    
    // 可选：保存分析历史到后端
    saveAnalysisHistory(prompt, analysisContent, stockCode);
    
    return {
      analysis: analysisContent,
      stock_code: stockCode,
      timestamp: new Date().toISOString()
    };
  })
  .catch(error => {
    console.error('调用Deepseek API失败:', error);
    // 失败时尝试回退到原有接口
    console.log('尝试使用后端API作为备选');
    return getAIAnalysis(prompt, stockCode).catch(backendError => {
      console.error('后端API也失败:', backendError);
      throw error; // 仍然抛出原始错误
    });
  });
}

/**
 * 保存分析历史到后端（可选，如果仍需要保存历史）
 */
function saveAnalysisHistory(question, answer, stockCode) {
  try {
    http.post('/api/strategy/save-analysis-history', {
      question,
      answer,
      stock_code: stockCode,
      model_name: "deepseek-chat"
    }).then(response => {
      console.log('分析历史保存成功:', response);
      // 保存成功后立即刷新历史记录
      refreshAnalysisHistory();
    }).catch(error => {
      console.error('保存分析历史失败:', error);
    });
  } catch (error) {
    console.error('保存分析历史时出错:', error);
  }
}

/**
 * 刷新分析历史（在保存历史后调用）
 */
export function refreshAnalysisHistory(limit = 5) {
  console.log('刷新分析历史记录');
  // 返回Promise以便能够在组件中使用
  return getAnalysisHistory(limit);
}

/**
 * 获取AI分析结果（原有后端API方法）
 * @param {string} prompt - 分析问题
 * @param {string} stockCode - 股票代码（可选）
 * @returns {Promise} - 返回分析结果
 */
export function getAIAnalysis(prompt, stockCode) {
  console.log('使用后端API进行分析:', prompt);
  return http.post('/api/strategy/ai-analysis', {
    prompt: prompt,
    stock_code: stockCode
  });
}

/**
 * 获取用户的分析历史
 * @param {number} limit - 获取数量限制
 * @param {number} offset - 偏移量，用于分页
 * @returns {Promise}
 */
export function getAnalysisHistory(limit = 10, offset = 0) {
  return http.get(`/api/strategy/analysis-history?limit=${limit}&offset=${offset}`);
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