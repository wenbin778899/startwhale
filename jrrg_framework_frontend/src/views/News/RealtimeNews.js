import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Space, 
  Tag, 
  Button, 
  List,
  Skeleton,
  Empty,
  message,
  Tabs,
  Radio,
  Badge,
  Spin,
  Tooltip,
  Input,
  Select,
  Switch,
  Divider,
  Avatar
} from 'antd';
import {
  ReloadOutlined,
  LinkOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  CoffeeOutlined,
  TrophyOutlined,
  LineChartOutlined,
  BankOutlined,
  SearchOutlined,
  EyeOutlined,
  FilterOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  StarFilled,
  FireOutlined,
  TrendingUpOutlined,
  BellOutlined,
  HeartOutlined
} from '@ant-design/icons';
import './RealtimeNews.css';
import { 
  getMarketNews, 
  getBreakfastNews, 
  getFutuNews, 
  getThsNews, 
  getSinaNews, 
  getRealtimeNews 
} from '../../api/news';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;

const RealtimeNews = () => {
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [newsData, setNewsData] = useState({
    market: [],
    breakfast: [],
    futu: [],
    ths: [],
    sina: [],
    combined: []
  });
  const [loadingStates, setLoadingStates] = useState({
    market: false,
    breakfast: false,
    futu: false,
    ths: false,
    sina: false,
    combined: false
  });
  const [activeTab, setActiveTab] = useState('combined');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState({});

  // 数据源配置 - 升级设计
  const dataSources = [
    {
      key: 'combined',
      name: '智能综合',
      icon: <RocketOutlined />,
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      description: '全方位智能整合资讯',
      premium: true
    },
    {
      key: 'market',
      name: '全球快讯',
      icon: <GlobalOutlined />,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      description: '东方财富全球财经快讯',
      premium: false
    },
    {
      key: 'breakfast',
      name: '财经早餐',
      icon: <CoffeeOutlined />,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      description: '东方财富财经早餐',
      premium: false
    },
    {
      key: 'futu',
      name: '富途快讯',
      icon: <TrophyOutlined />,
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      description: '富途牛牛快讯',
      premium: false
    },
    {
      key: 'ths',
      name: '同花顺',
      icon: <LineChartOutlined />,
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      description: '同花顺财经直播',
      premium: false
    },
    {
      key: 'sina',
      name: '新浪财经',
      icon: <BankOutlined />,
      color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      description: '新浪财经快讯',
      premium: false
    }
  ];

  // 获取各个数据源的新闻
  const fetchNewsData = useCallback(async (source, showMessage = true) => {
    try {
      setLoadingStates(prev => ({ ...prev, [source]: true }));
      
      let response;
      let limit = 20;
      
      switch (source) {
        case 'market':
          response = await getMarketNews(limit);
          break;
        case 'breakfast':
          limit = 10; // 财经早餐数据较少
          response = await getBreakfastNews(limit);
          break;
        case 'futu':
          response = await getFutuNews(limit);
          break;
        case 'ths':
          response = await getThsNews(limit);
          break;
        case 'sina':
          response = await getSinaNews(limit);
          break;
        case 'combined':
          response = await getRealtimeNews('global,breakfast,futu,ths', 8);
          break;
        default:
          throw new Error(`未知数据源: ${source}`);
      }
      
      if (response && response.code === 0) {
        setNewsData(prev => ({
          ...prev,
          [source]: response.data || []
        }));
        
        setLastUpdateTime(prev => ({
          ...prev,
          [source]: new Date().toLocaleTimeString()
        }));
        
        if (showMessage) {
          message.success({
            content: `${dataSources.find(s => s.key === source)?.name} 更新成功`,
            icon: <ThunderboltOutlined style={{ color: '#52c41a' }} />
          });
        }
      } else {
        console.error(`获取${source}数据失败:`, response?.message);
        if (showMessage) {
          message.error(`获取${dataSources.find(s => s.key === source)?.name}失败`);
        }
      }
    } catch (error) {
      console.error(`获取${source}数据出错:`, error);
      if (showMessage) {
        message.error(`获取${dataSources.find(s => s.key === source)?.name}失败`);
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [source]: false }));
    }
  }, []);

  // 获取所有数据源
  const fetchAllNews = useCallback(async (showMessage = true) => {
    setLoading(true);
    try {
      const promises = dataSources.map(source => 
        fetchNewsData(source.key, false)
      );
      await Promise.all(promises);
      
      if (showMessage) {
        message.success({
          content: '所有资讯更新完成',
          icon: <RocketOutlined style={{ color: '#1890ff' }} />
        });
      }
    } catch (error) {
      console.error('获取资讯数据出错:', error);
      if (showMessage) {
        message.error('获取资讯失败');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchNewsData]);

  // 筛选新闻数据
  const filterNews = (newsItems) => {
    if (!searchKeyword) return newsItems;
    
    return newsItems.filter(item => 
      item.title?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.source?.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  };

  // 处理自动刷新
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchNewsData(activeTab, false);
      }, 30000); // 30秒刷新一次
      
      setRefreshInterval(interval);
      message.info({
        content: '已开启自动刷新 (30秒)',
        icon: <SyncOutlined spin style={{ color: '#1890ff' }} />
      });
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
        message.info('已关闭自动刷新');
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, activeTab, fetchNewsData]);

  // 初始化数据
  useEffect(() => {
    fetchAllNews(false);
  }, [fetchAllNews]);

  // 获取数据源徽章
  const getSourceBadge = (source) => {
    const config = dataSources.find(s => s.key === source);
    if (!config) return null;
    
    return (
      <div className="modern-badge" style={{ background: config.color }}>
        {config.icon}
        <span>{config.name}</span>
      </div>
    );
  };

  // 渲染新闻项 - 现代化设计
  const renderNewsItem = (news, index) => (
    <div
      key={`${news.source}-${index}-${news.title}`}
      className="modern-news-item"
    >
      <div className="news-item-header">
        <div className="news-meta">
          {getSourceBadge(news.category || 'unknown')}
          <div className="news-time">
            <ClockCircleOutlined />
            <span>{news.publish_time}</span>
          </div>
        </div>
        {news.link && news.link !== 'nan' && (
          <Button 
            type="primary" 
            size="small"
            icon={<LinkOutlined />} 
            href={news.link} 
            target="_blank"
            rel="noopener noreferrer"
            className="modern-read-btn"
          >
            阅读原文
          </Button>
        )}
      </div>
      
      <div className="news-content">
        <h3 className="news-title">
          {news.link && news.link !== 'nan' ? (
            <a 
              href={news.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="news-title-link"
            >
              {news.title}
            </a>
          ) : (
            news.title
          )}
        </h3>
        
        {news.summary && news.summary !== 'nan' && (
          <p className="news-summary">
            {news.summary}
          </p>
        )}
      </div>
      
      <div className="news-actions">
        <Space>
          <Button type="text" size="small" icon={<HeartOutlined />}>
            收藏
          </Button>
          <Button type="text" size="small" icon={<BellOutlined />}>
            提醒
          </Button>
        </Space>
      </div>
    </div>
  );

  // 渲染控制面板 - 现代化设计
  const renderControlPanel = () => (
    <Card className="modern-control-panel" bodyStyle={{ padding: '20px' }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={8}>
          <div className="search-container">
            <Search
              placeholder="智能搜索资讯内容..."
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
              size="large"
              className="modern-search"
            />
          </div>
        </Col>
        
        <Col xs={12} sm={6} md={4}>
          <div className="switch-container">
            <Space align="center">
              <Text strong>自动刷新</Text>
              <Switch
                size="default"
                checked={autoRefresh}
                onChange={setAutoRefresh}
                checkedChildren={<SyncOutlined spin />}
                unCheckedChildren={<SyncOutlined />}
                className="modern-switch"
              />
            </Space>
          </div>
        </Col>
        
        <Col xs={12} sm={6} md={4}>
          <Button
            type="primary"
            icon={<ReloadOutlined spin={loadingStates[activeTab]} />}
            onClick={() => fetchNewsData(activeTab)}
            disabled={loadingStates[activeTab]}
            size="large"
            block
            className="modern-btn primary"
          >
            刷新当前
          </Button>
        </Col>
        
        <Col xs={24} md={4}>
          <Button
            icon={<ThunderboltOutlined />}
            onClick={() => fetchAllNews()}
            disabled={loading}
            size="large"
            block
            className="modern-btn secondary"
          >
            全部刷新
          </Button>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div className="modern-realtime-news">
      {/* 顶部头部区域 */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              <RocketOutlined />
            </div>
            <div className="header-text">
              <Title level={2} className="page-title">
                实时资讯中心
              </Title>
              <Text className="page-subtitle">
                AI驱动的智能资讯聚合平台，为您提供最新财经动态
              </Text>
            </div>
          </div>
          <div className="header-right">
            <div className="status-indicators">
              <div className="status-item">
                <div className="status-dot active"></div>
                <span>实时同步</span>
              </div>
              <div className="status-item">
                <div className="status-dot"></div>
                <span>智能筛选</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 控制面板 */}
      {renderControlPanel()}

      {/* 主要内容区域 */}
      <Card className="modern-tabs-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          className="modern-tabs"
          tabBarExtraContent={
            <Space className="tab-extra">
              <Badge 
                count={filterNews(newsData[activeTab] || []).length} 
                showZero 
                className="modern-badge-count"
              />
              <Tooltip title="数据源信息">
                <Button 
                  type="text" 
                  icon={<EyeOutlined />} 
                  size="small"
                  className="info-btn"
                />
              </Tooltip>
            </Space>
          }
        >
          {dataSources.map(source => (
            <TabPane
              tab={
                <div className="modern-tab">
                  <div className="tab-icon" style={{ background: source.color }}>
                    {source.icon}
                  </div>
                  <div className="tab-info">
                    <span className="tab-name">{source.name}</span>
                    {source.premium && <StarFilled className="premium-icon" />}
                  </div>
                  <Badge 
                    count={newsData[source.key]?.length || 0} 
                    showZero 
                    size="small"
                    className="tab-badge"
                  />
                </div>
              }
              key={source.key}
            >
              <div className="tab-content">
                {loadingStates[source.key] ? (
                  <div className="loading-container">
                    <Spin size="large" tip="正在获取最新资讯..." />
                    <div className="loading-skeleton">
                      <Skeleton active paragraph={{ rows: 6 }} />
                    </div>
                  </div>
                ) : filterNews(newsData[source.key] || []).length > 0 ? (
                  <div className="news-container">
                    {filterNews(newsData[source.key] || []).map((news, index) => 
                      renderNewsItem(news, index)
                    )}
                  </div>
                ) : (
                  <div className="empty-container">
                    <Empty 
                      description={
                        <div className="empty-text">
                          <Text strong style={{ fontSize: '16px' }}>
                            {searchKeyword ? 
                              `未找到包含"${searchKeyword}"的资讯` : 
                              `暂无${source.name}资讯`
                            }
                          </Text>
                          <br />
                          <Text type="secondary">
                            请稍后再试或尝试其他数据源
                          </Text>
                        </div>
                      }
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      className="modern-empty"
                    />
                  </div>
                )}
              </div>
            </TabPane>
          ))}
        </Tabs>
      </Card>

      {/* 数据源说明 */}
      <Card className="sources-info-card">
        <div className="sources-header">
          <Space>
            <FilterOutlined style={{ color: '#1890ff' }} />
            <Text strong style={{ fontSize: '16px' }}>数据源说明</Text>
          </Space>
        </div>
        <Row gutter={[16, 16]} className="sources-grid">
          {dataSources.slice(1).map(source => (
            <Col xs={24} sm={12} md={8} lg={6} key={source.key}>
              <div className="source-card" style={{ borderLeft: `4px solid ${source.color}` }}>
                <div className="source-header">
                  <div className="source-icon" style={{ background: source.color }}>
                    {source.icon}
                  </div>
                  <Text strong className="source-name">
                    {source.name}
                  </Text>
                </div>
                <Text type="secondary" className="source-description">
                  {source.description}
                </Text>
                <div className="source-stats">
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    已获取 {newsData[source.key]?.length || 0} 条资讯
                  </Text>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default RealtimeNews; 