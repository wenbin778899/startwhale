import http from '../utils/http';

/**
 * 提交用户问卷数据
 * @param {object} questionnaireData - 问卷数据
 * @returns {Promise}
 */
export function submitQuestionnaire(questionnaireData) {
  console.log('提交问卷数据:', questionnaireData);
  return http.post('/api/user-profile/questionnaire', questionnaireData)
    .then(response => {
      console.log('问卷提交响应:', response);
      return response;
    })
    .catch(error => {
      console.error('问卷提交错误:', error);
      throw error;
    });
}

/**
 * 获取用户画像数据
 * @returns {Promise}
 */
export function getUserProfile() {
  return http.get('/api/user-profile/profile')
    .then(response => {
      console.log('获取用户画像响应:', response);
      
      // 标准化响应数据，确保关键字段存在并具有预期的格式
      if (response && response.data) {
        const data = response.data;
        
        // 确保questionnaire字段
        if (!data.questionnaire) {
          data.questionnaire = null;
        }
        
        // 确保industry_preferences是数组
        if (!data.industry_preferences || !Array.isArray(data.industry_preferences)) {
          data.industry_preferences = [];
        }
        
        // 确保trading_habits是对象
        if (!data.trading_habits) {
          data.trading_habits = null;
        }
        
        // 确保favorite_stocks是数组
        if (!data.favorite_stocks || !Array.isArray(data.favorite_stocks)) {
          data.favorite_stocks = [];
        }
      }
      
      return response;
    })
    .catch(error => {
      console.error('获取用户画像错误:', error);
      throw error;
    });
}