import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Spin, Typography, Tag, Divider, Empty, 
  Statistic, Progress, Button, Avatar, message
} from 'antd';
import { 
  RiseOutlined, FallOutlined, ClockCircleOutlined, 
  UserOutlined, FireOutlined, AreaChartOutlined,
  SafetyOutlined, DollarOutlined, BulbOutlined,
  PieChartOutlined, BarChartOutlined, ReloadOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getUserProfile } from '../../api/userProfile';
import './UserPortrait.css';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

const UserPortrait = () => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      console.log('开始获取用户画像数据...');
      
      // 检查JWT令牌
      const token = localStorage.getItem('jwt_token');
      console.log('当前JWT令牌存在:', !!token);
      if (!token) {
        message.error('用户未登录，即将跳转到登录页');
        setTimeout(() => navigate('/login'), 1000);
        return;
      }
      
      // 获取用户画像数据
      const response = await getUserProfile();
      console.log('API返回的原始响应:', response);
      
      // 检查API响应格式
      if (!response || typeof response !== 'object') {
        throw new Error('API返回数据格式错误');
      }
      
      // 检查API返回的数据字段
      const data = response.data;
      console.log('获取到的用户画像数据:', data);
      
      if (!data) {
        throw new Error('返回的数据为空');
      }
      
      // 标准化数据格式，确保关键字段存在
      const standardizedData = {
        user_info: data.user_info || {},
        questionnaire: data.questionnaire || null,
        industry_preferences: Array.isArray(data.industry_preferences) ? data.industry_preferences : [],
        trading_habits: data.trading_habits || null,
        favorite_stocks: Array.isArray(data.favorite_stocks) ? data.favorite_stocks : []
      };
      
      console.log('标准化后的数据:', standardizedData);
      setProfileData(standardizedData);
      setError(null);
    } catch (err) {
      console.error('获取用户画像数据失败:', err);
      if (err.response) {
        console.error('错误状态码:', err.response.status);
        console.error('错误信息:', err.response.data);
        setError(`获取数据失败 (${err.response.status}): ${err.response.data?.message || '未知错误'}`);
      } else if (err.request) {
        console.error('未收到响应:', err.request);
        setError('服务器未响应，请检查网络连接');
      } else {
        console.error('请求错误:', err.message);
        setError(`请求错误: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 首次加载时获取数据
  useEffect(() => {
    fetchProfileData();
  }, []);

  // 根据风险等级返回相应的颜色和标签
  const getRiskLevelInfo = (level) => {
    const levelMap = {
      1: { color: '#52c41a', label: '极低风险', description: '追求稳定收益，极少承担风险' },
      2: { color: '#85d13b', label: '低风险', description: '追求较为稳定的收益，承担有限风险' },
      3: { color: '#faad14', label: '中等风险', description: '追求平衡的风险与回报' },
      4: { color: '#fa8c16', label: '高风险', description: '追求较高回报，能够承担较大波动' },
      5: { color: '#f5222d', label: '极高风险', description: '追求高回报，能够承受大幅波动和潜在损失' }
    };
    return levelMap[level] || { color: '#999', label: '未知', description: '' };
  };

  // 投资风格描述
  const getInvestmentStyleDescription = (style) => {
    const styleMap = {
      '价值': '您倾向于寻找被低估的股票，关注公司基本面与内在价值',
      '成长': '您倾向于投资高增长潜力的企业，即使估值较高',
      '混合': '您结合价值与成长理念，寻找合理价格的增长型股票'
    };
    return styleMap[style] || '未填写投资风格';
  };

  // 生成行业偏好雷达图配置
  const getIndustryRadarOption = (industryPreferences) => {
    if (!industryPreferences || !Array.isArray(industryPreferences) || industryPreferences.length === 0) {
      console.warn('行业偏好数据为空或格式不正确，无法生成雷达图');
      return {
        title: {
          text: '行业偏好雷达图',
          subtext: '暂无数据'
        },
        series: []
      };
    }

    console.log('原始行业偏好数据:', industryPreferences);

    try {
      // 检查数据格式
      const validPrefs = industryPreferences.filter(item => 
        item && typeof item === 'object' && 
        item.industry_name && 
        (typeof item.preference_level === 'number' || 
         (typeof item.preference_level === 'string' && !isNaN(parseInt(item.preference_level))))
      ).map(item => ({
        ...item, 
        preference_level: typeof item.preference_level === 'string' ? 
          parseInt(item.preference_level) : item.preference_level
      }));
      
      console.log('有效的行业偏好数据:', validPrefs);
      
      if (validPrefs.length === 0) {
        throw new Error('没有有效的行业偏好数据');
      }
      
      // 按偏好程度排序
      const sortedPrefs = [...validPrefs].sort((a, b) => b.preference_level - a.preference_level);
      const industries = sortedPrefs.map(item => item.industry_name);
      const values = sortedPrefs.map(item => item.preference_level);
      
      console.log('处理后的行业数据:', industries);
      console.log('处理后的偏好值:', values);

      return {
        title: {
          text: '行业偏好雷达图'
        },
        tooltip: {},
        radar: {
          shape: 'circle',
          indicator: industries.map(name => ({ name, max: 5 }))
        },
        series: [{
          name: '行业偏好',
          type: 'radar',
          data: [
            {
              value: values,
              name: '偏好程度',
              areaStyle: {
                color: 'rgba(64, 158, 255, 0.5)'
              }
            }
          ]
        }]
      };
    } catch (error) {
      console.error('生成雷达图配置时出错:', error);
      return {
        title: {
          text: '数据处理出错',
          subtext: error.message,
          textStyle: {
            color: 'red'
          }
        }
      };
    }
  };

  // 生成交易习惯柱状图配置
  const getTradingHabitsBarOption = (habits) => {
    if (!habits || typeof habits !== 'object') {
      console.warn('交易习惯数据为空或格式不正确，无法生成柱状图');
      return {
        title: {
          text: '交易分析依赖度',
          subtext: '暂无数据'
        },
        series: []
      };
    }

    console.log('原始交易习惯数据:', habits);

    try {
      const categories = [
        '技术分析依赖度',
        '基本面分析依赖度',
        '新闻敏感度'
      ];

      // 确保值是数字类型，处理字符串和null/undefined情况
      const values = [
        habits.technical_analysis_reliance !== null && habits.technical_analysis_reliance !== undefined ? 
          parseFloat(habits.technical_analysis_reliance) : 0,
        habits.fundamental_analysis_reliance !== null && habits.fundamental_analysis_reliance !== undefined ? 
          parseFloat(habits.fundamental_analysis_reliance) : 0,
        habits.news_sensitivity !== null && habits.news_sensitivity !== undefined ? 
          parseFloat(habits.news_sensitivity) : 0
      ];
      
      console.log('处理后的分析依赖类别:', categories);
      console.log('处理后的分析依赖值:', values);

      return {
        title: {
          text: '交易分析依赖度'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          max: 5
        },
        yAxis: {
          type: 'category',
          data: categories
        },
        series: [
          {
            name: '依赖程度',
            type: 'bar',
            data: values.map((value, index) => ({
              value,
              itemStyle: {
                color: function() {
                  const colorList = ['#51adcf', '#a5dee5', '#e7f2f8'];
                  return colorList[index % colorList.length];
                }()
              }
            }))
          }
        ]
      };
    } catch (error) {
      console.error('生成柱状图配置时出错:', error);
      return {
        title: {
          text: '数据处理出错',
          subtext: error.message,
          textStyle: {
            color: 'red'
          }
        }
      };
    }
  };

  // 生成自选股票饼图配置
  const getFavoriteStocksPieOption = (favoriteStocks) => {
    if (!favoriteStocks || favoriteStocks.length === 0) return {};

    return {
      title: {
        text: '自选股票分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        top: 'middle',
        data: favoriteStocks.map(stock => stock.stock_name)
      },
      series: [
        {
          name: '自选股票',
          type: 'pie',
          radius: ['50%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: favoriteStocks.map(stock => ({
            name: stock.stock_name,
            value: 1
          }))
        }
      ]
    };
  };

  if (loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Spin size="large" tip="加载用户画像数据中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Empty
          description={error}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
        <Button type="primary" onClick={fetchProfileData}>
          重试
        </Button>
      </div>
    );
  }

  // 添加更多的调试信息
  console.log('profileData状态:', profileData);
  console.log('questionnaire数据存在:', profileData?.questionnaire);

  if (!profileData) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Empty
          description="未获取到用户画像数据"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
        <Button type="primary" onClick={fetchProfileData}>
          重新加载数据
        </Button>
      </div>
    );
  }

  if (!profileData.questionnaire) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Empty
          description="您尚未完成投资者画像问卷"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
        <div style={{ marginTop: '20px' }}>
          <Button onClick={fetchProfileData}>
            刷新数据
          </Button>
        </div>
      </div>
    );
  }

  const { user_info, questionnaire, industry_preferences, trading_habits, favorite_stocks } = profileData;
  const riskInfo = getRiskLevelInfo(questionnaire.risk_tolerance);
  
  return (
    <div className="user-portrait">
      {/* 添加刷新按钮 */}
      <Button 
        type="primary" 
        icon={<ReloadOutlined />} 
        onClick={() => {
          message.info('正在刷新数据...');
          fetchProfileData();
        }}
        style={{ position: 'absolute', right: '20px', top: '20px', zIndex: 10 }}
      >
        刷新数据
      </Button>
      
      <Row gutter={[16, 16]}>
        {/* 用户基本资料卡片 */}
        <Col xs={24}>
          <Card className="portrait-card" bordered={false}>
            <div className="portrait-header">
              <div className="portrait-header-overlay"></div>
              <div className="portrait-header-content">
                <Title level={3} style={{ color: 'white', margin: 0 }}>
                  投资者画像报告
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                  基于您的问卷回答，生成个性化投资画像
                </Text>
              </div>
            </div>
            <div className="portrait-body">
              <Row align="middle">
                <Col>
                  <Avatar
                    size={64}
                    icon={<UserOutlined />}
                    className="portrait-avatar"
                  />
                </Col>
                <Col style={{ marginLeft: 16 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {user_info?.nickname || user_info?.username || '未知用户'}
                  </Title>
                  <div>
                    <Text type="secondary">风险承受能力：</Text>
                    <Tag color={riskInfo.color} className="risk-tag">
                      {riskInfo.label}
                    </Tag>
                  </div>
                </Col>
              </Row>
              
              <div className="portrait-stats">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Statistic 
                      title="投资期限"
                      value={questionnaire.investment_horizon}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic 
                      title="投资风格"
                      value={questionnaire.investment_style}
                      prefix={<BarChartOutlined />}
                    />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic 
                      title="市场经验"
                      value={questionnaire.market_experience || 0}
                      suffix="年"
                      prefix={<PieChartOutlined />}
                    />
                  </Col>
                </Row>
              </div>

              <Divider />

              <Paragraph style={{ fontSize: 16 }}>
                <SafetyOutlined className="style-icon" style={{ color: riskInfo.color }} />
                <Text strong>风险偏好：</Text>
                {riskInfo.description}
              </Paragraph>

              <Paragraph style={{ fontSize: 16 }}>
                <BulbOutlined className="style-icon" style={{ color: '#722ed1' }} />
                <Text strong>投资风格：</Text>
                {getInvestmentStyleDescription(questionnaire.investment_style)}
              </Paragraph>

              <Paragraph style={{ fontSize: 16 }}>
                <DollarOutlined className="style-icon" style={{ color: '#13c2c2' }} />
                <Text strong>资金偏好：</Text>
                收入需求{questionnaire.income_requirement}，流动性需求{questionnaire.liquidity_need}，
                {questionnaire.avg_investment_amount ? `平均单笔投资金额约为￥${questionnaire.avg_investment_amount}` : '未填写平均投资金额'}
              </Paragraph>
            </div>
          </Card>
        </Col>

        {/* 行业偏好雷达图 */}
        <Col xs={24} md={12}>
          <Card title="行业投资偏好" className="portrait-chart-card" bordered={false}>
            {industry_preferences && industry_preferences.length > 0 ? (
              <ReactECharts 
                option={getIndustryRadarOption(industry_preferences)} 
                style={{ height: '350px' }}
                notMerge={true}
                lazyUpdate={false}
                onEvents={{ 'rendered': () => console.log('行业偏好图表渲染完成') }}
              />
            ) : (
              <Empty description="暂无行业偏好数据" />
            )}
          </Card>
        </Col>

        {/* 交易习惯图表 */}
        <Col xs={24} md={12}>
          <Card title="交易分析依赖特征" className="portrait-chart-card" bordered={false}>
            {trading_habits ? (
              <ReactECharts 
                option={getTradingHabitsBarOption(trading_habits)} 
                style={{ height: '350px' }}
                notMerge={true}
                lazyUpdate={false}
                onEvents={{ 'rendered': () => console.log('交易习惯图表渲染完成') }}
              />
            ) : (
              <Empty description="暂无交易习惯数据" />
            )}
          </Card>
        </Col>

        {/* 交易习惯详情 */}
        <Col xs={24} md={12}>
          <Card title="交易习惯详情" className="portrait-chart-card" bordered={false}>
            {trading_habits ? (
              <div>
                <div className="trading-habit-item">
                  <Text strong>平均持股周期：</Text>
                  <Text>{trading_habits.avg_holding_period || '未填写'} 天</Text>
                </div>

                <div className="trading-habit-item">
                  <Text strong>偏好交易时段：</Text>
                  <Text>{trading_habits.preferred_trading_time || '未填写'}</Text>
                </div>

                <div className="trading-habit-item">
                  <Row>
                    <Col span={12}>
                      <Text strong>止损设置：</Text>
                      <Text>{trading_habits.stop_loss_percentage || '未填写'} %</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>止盈设置：</Text>
                      <Text>{trading_habits.profit_taking_percentage || '未填写'} %</Text>
                    </Col>
                  </Row>
                </div>

                <Divider />
                
                <Title level={5}>分析指标依赖度：</Title>
                
                <div style={{ padding: '10px 0' }}>
                  <Text>技术分析依赖度：</Text>
                  <Progress 
                    percent={trading_habits.technical_analysis_reliance * 20 || 0} 
                    strokeColor="#1890ff"
                    format={() => `${trading_habits.technical_analysis_reliance || 0}/5`}
                  />
                </div>
                
                <div style={{ padding: '10px 0' }}>
                  <Text>基本面分析依赖度：</Text>
                  <Progress 
                    percent={trading_habits.fundamental_analysis_reliance * 20 || 0} 
                    strokeColor="#13c2c2"
                    format={() => `${trading_habits.fundamental_analysis_reliance || 0}/5`}
                  />
                </div>
                
                <div style={{ padding: '10px 0' }}>
                  <Text>新闻敏感度：</Text>
                  <Progress 
                    percent={trading_habits.news_sensitivity * 20 || 0} 
                    strokeColor="#722ed1"
                    format={() => `${trading_habits.news_sensitivity || 0}/5`}
                  />
                </div>
              </div>
            ) : (
              <Empty description="暂无交易习惯数据" />
            )}
          </Card>
        </Col>

        {/* 自选股票分布 */}
        <Col xs={24} md={12}>
          <Card title="自选股票分布" className="portrait-chart-card" bordered={false}>
            {favorite_stocks && favorite_stocks.length > 0 ? (
              <ReactECharts 
                option={getFavoriteStocksPieOption(favorite_stocks)} 
                style={{ height: '350px' }}
              />
            ) : (
              <Empty description="暂无自选股票数据" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserPortrait; 