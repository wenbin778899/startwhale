import http from '../utils/http';

/**
 * 获取用户自选基金列表
 * @returns {Promise}
 */
export function getFavoriteFunds() {
  return http.get('/api/fund/favorites').then(response => {
    // 确保返回的数据有效
    if (response && response.code === 0) {
      // 确保data是数组
      response.data = Array.isArray(response.data) ? response.data : [];
    }
    return response;
  });
}

/**
 * 添加自选基金
 * @param {string} fundCode - 基金代码
 * @param {string} fundName - 基金名称
 * @returns {Promise}
 */
export function addFavoriteFund(fundCode, fundName) {
  return http.post('/api/fund/favorites', {
    fund_code: fundCode,
    fund_name: fundName
  });
}

/**
 * 删除自选基金
 * @param {string} fundCode - 基金代码
 * @returns {Promise}
 */
export function removeFavoriteFund(fundCode) {
  return http.delete(`/api/fund/favorites/${fundCode}`);
}

/**
 * 搜索基金
 * @param {string} keyword - 搜索关键字
 * @returns {Promise}
 */
export function searchFund(keyword) {
  // 增加请求超时时间，因为akshare可能处理较慢
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('请求超时，请稍后再试')), 30000); // 设置30秒超时
  });

  const fetchPromise = http.get(`/api/fund/search?keyword=${encodeURIComponent(keyword)}`)
    .then(response => {
      // 确保返回的数据有效
      if (response && response.code === 0) {
        // 确保data是数组
        response.data = Array.isArray(response.data) ? response.data : [];
      }
      return response;
    })
    .catch(error => {
      console.error('搜索基金API调用失败:', error);
      // 返回格式化的错误对象，而不是直接抛出错误
      return {
        code: 500,
        message: error.message || '搜索基金时发生错误，请稍后重试',
        data: []
      };
    });

  // 使用Promise.race让两个Promise竞争，谁先完成就返回谁的结果
  return Promise.race([fetchPromise, timeoutPromise]);
}

/**
 * 获取基金基本信息
 * @param {string} fundCode - 基金代码
 * @returns {Promise}
 */
export function getFundInfo(fundCode) {
  // 增加请求超时时间
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('请求超时，请稍后再试')), 30000); // 设置30秒超时
  });

  const fetchPromise = http.get(`/api/fund/info/${fundCode}`)
    .then(response => {
      // 确保返回的数据有效
      if (response && response.code === 0) {
        // 确保data是对象
        response.data = response.data || {};
      }
      return response;
    })
    .catch(error => {
      console.error('获取基金信息失败:', error);
      // 返回格式化的错误对象，而不是直接抛出错误
      return {
        code: 500,
        message: error.message || '获取基金信息失败，请稍后重试',
        data: {}
      };
    });

  // 使用Promise.race让两个Promise竞争，谁先完成就返回谁的结果
  return Promise.race([fetchPromise, timeoutPromise]);
}

/**
 * 直接调用Deepseek API进行AI分析
 * @param {string} prompt - 分析问题
 * @param {string} fundCode - 基金代码（可选）
 * @param {Object} previousContext - 前一个对话的上下文（可选）
 * @returns {Promise} - 返回分析结果
 */
export function getDeepseekFundAnalysis(prompt, fundCode, previousContext = null) {
  console.log('直接调用Deepseek API开始基金分析:', prompt);
  
  // 安全考虑：在生产环境中应该使用环境变量或专门的密钥管理服务
  // 这里使用前端环境变量(需在.env文件中配置)
  const DEEPSEEK_API_KEY = process.env.REACT_APP_DEEPSEEK_API_KEY || "sk-b1f5f2e0558a4b5daca6b20d2b68f9c4";
  
  // 构建消息列表，包含前一个对话的上下文（如果存在）
  let messages = [
    {
      role: "system",
      content: "你是一个专业的基金投资分析师，请基于用户的问题提供专业、客观的分析建议。请用中文回答，内容要详细且具有实用性。"
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
    content: fundCode ? `基金代码：${fundCode}，分析问题：${prompt}` : prompt
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
    saveFundAnalysisHistory(prompt, analysisContent, fundCode);
    
    return {
      analysis: analysisContent,
      fund_code: fundCode,
      timestamp: new Date().toISOString()
    };
  })
  .catch(error => {
    console.error('调用Deepseek API失败:', error);
    // 失败时尝试回退到原有接口
    console.log('尝试使用后端API作为备选');
    return getFundAIAnalysis(prompt, fundCode).catch(backendError => {
      console.error('后端API也失败:', backendError);
      throw error; // 仍然抛出原始错误
    });
  });
}

/**
 * 保存基金分析历史到后端
 */
function saveFundAnalysisHistory(question, answer, fundCode) {
  try {
    http.post('/api/fund/save-analysis-history', {
      question,
      answer,
      fund_code: fundCode,
      model_name: "deepseek-chat"
    }).then(response => {
      console.log('基金分析历史保存成功:', response);
      // 保存成功后立即刷新历史记录
      refreshFundAnalysisHistory();
    }).catch(error => {
      console.error('保存基金分析历史失败:', error);
    });
  } catch (error) {
    console.error('保存基金分析历史时出错:', error);
  }
}

/**
 * 刷新基金分析历史
 */
export function refreshFundAnalysisHistory(limit = 5) {
  console.log('刷新基金分析历史记录');
  // 返回Promise以便能够在组件中使用
  return getFundAnalysisHistory(limit);
}

/**
 * 获取基金AI分析结果（后端API方法）
 * @param {string} prompt - 分析问题
 * @param {string} fundCode - 基金代码（可选）
 * @returns {Promise} - 返回分析结果
 */
export function getFundAIAnalysis(prompt, fundCode) {
  console.log('使用后端API进行基金分析:', prompt);
  return http.post('/api/fund/ai-analysis', {
    prompt: prompt,
    fund_code: fundCode
  });
}

/**
 * 获取用户的基金分析历史
 * @param {number} limit - 获取数量限制
 * @param {number} offset - 偏移量，用于分页
 * @returns {Promise}
 */
export function getFundAnalysisHistory(limit = 10, offset = 0) {
  return http.get(`/api/fund/analysis-history?limit=${limit}&offset=${offset}`).then(response => {
    // 确保返回的数据有效
    if (response && response.code === 0) {
      // 确保data是数组
      response.data = Array.isArray(response.data) ? response.data : [];
    }
    return response;
  });
}

/**
 * 更新自选基金备注
 * @param {string} fundCode - 基金代码
 * @param {string} note - 备注内容
 * @returns {Promise}
 */
export function updateFavoriteFundNote(fundCode, note) {
  return http.put(`/api/fund/favorites/${fundCode}/note`, {
    note: note
  });
}

/**
 * 获取持仓基金列表
 * @param {number} portfolioId - 组合ID
 * @returns {Promise}
 */
export function getPortfolioFunds(portfolioId) {
  return http.get(`/api/fund/portfolio/${portfolioId}/funds`);
}

/**
 * 添加基金到持仓组合
 * @param {number} portfolioId - 组合ID
 * @param {Object} fundData - 基金数据
 * @returns {Promise}
 */
export function addPortfolioFund(portfolioId, fundData) {
  return http.post(`/api/fund/portfolio/${portfolioId}/funds`, fundData);
}

/**
 * 更新持仓基金信息
 * @param {number} portfolioId - 组合ID
 * @param {string} fundCode - 基金代码
 * @param {Object} updateData - 更新数据
 * @returns {Promise}
 */
export function updatePortfolioFund(portfolioId, fundCode, updateData) {
  return http.put(`/api/fund/portfolio/${portfolioId}/funds/${fundCode}`, updateData);
}

/**
 * 删除持仓基金
 * @param {number} portfolioId - 组合ID
 * @param {string} fundCode - 基金代码
 * @returns {Promise}
 */
export function deletePortfolioFund(portfolioId, fundCode) {
  return http.delete(`/api/fund/portfolio/${portfolioId}/funds/${fundCode}`);
}

/**
 * 创建基金交易记录
 * @param {number} portfolioId - 组合ID
 * @param {string} fundCode - 基金代码
 * @param {Object} tradeData - 交易数据
 * @returns {Promise}
 */
export function createFundTradeRecord(portfolioId, fundCode, tradeData) {
  return http.post(`/api/fund/portfolio/${portfolioId}/funds/${fundCode}/trade`, tradeData);
}

/**
 * 获取基金净值信息
 * @param {string} fundCode - 基金代码
 * @returns {Promise}
 */
export function getFundNav(fundCode) {
  return http.get(`/api/fund/nav/${fundCode}`);
}

/**
 * 更新所有基金净值
 * @param {number} portfolioId - 组合ID（可选）
 * @returns {Promise}
 */
export function updateFundPrices(portfolioId = null) {
  const data = portfolioId ? { portfolio_id: portfolioId } : {};
  return http.post('/api/fund/update-prices', data);
} 