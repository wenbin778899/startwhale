import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Space, 
  Tag, 
  Table, 
  Button, 
  List,
  Avatar,
  Carousel,
  Divider,
  Skeleton,
  Empty
} from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LineChartOutlined,
  FireOutlined,
  RobotOutlined,
  BarChartOutlined,
  BulbOutlined,
  InfoCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import { getMarketNews } from '../../api/news'; // 导入获取市场资讯的API

const { Title, Text, Paragraph } = Typography;

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState({
    shanghai: { index: 3231.45, change: 23.47, changePercent: 0.73 },
    shenzhen: { index: 2183.19, change: -11.49, changePercent: -0.52 },
    chuangye: { index: 2043.92, change: 15.72, changePercent: 0.77 }
  });
  const [hotStocks, setHotStocks] = useState([]);
  const [recommendedStocks, setRecommendedStocks] = useState([]);
  const [newsData, setNewsData] = useState([]);  // 新添加的新闻数据状态
  const [newsLoading, setNewsLoading] = useState(true);  // 新闻加载状态
  const navigate = useNavigate();

  // 获取市场新闻数据
  const fetchNewsData = async () => {
    try {
      setNewsLoading(true);
      const response = await getMarketNews(6); // 获取6条市场新闻
      if (response.code === 200 && response.data) {
        setNewsData(response.data);
      } else {
        console.error('获取新闻数据失败:', response.message);
      }
    } catch (error) {
      console.error('获取新闻数据出错:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  // 模拟加载数据
  useEffect(() => {
    setTimeout(() => {
      // 模拟热门股票数据
      setHotStocks([
        { code: '600519', name: '贵州茅台', price: 1432.50, change: 2.35, volume: 1245324 },
        { code: '000858', name: '五粮液', price: 176.23, change: -0.89, volume: 896523 },
        { code: '601318', name: '中国平安', price: 53.47, change: 1.24, volume: 3521458 },
        { code: '600276', name: '恒瑞医药', price: 32.45, change: -1.23, volume: 1542368 },
        { code: '300750', name: '宁德时代', price: 254.67, change: 3.56, volume: 895623 },
        { code: '601899', name: '紫金矿业', price: 10.34, change: 0.87, volume: 4856239 }
      ]);

      // 模拟推荐股票数据
      setRecommendedStocks([
        { code: '600036', name: '招商银行', reason: '业绩超预期，分红率提升', change: 1.23 },
        { code: '000333', name: '美的集团', reason: '行业龙头，估值合理', change: 2.45 },
        { code: '601888', name: '中国中免', reason: '免税政策利好，出境游复苏', change: -0.67 }
      ]);

      setLoading(false);
    }, 1000);

    // 加载市场新闻数据
    fetchNewsData();
  }, []);

  // 刷新新闻数据
  const handleRefreshNews = () => {
    fetchNewsData();
  };

  // 获取指数变化图表配置
  const getIndexChartOption = () => {
    return {
      title: {
        text: '大盘指数走势',
        left: 'center',
        textStyle: {
          fontSize: 14
        }
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['上证指数', '深证成指', '创业板指'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['09:30', '10:00', '10:30', '11:00', '11:30', '13:30', '14:00', '14:30', '15:00']
      },
      yAxis: {
        type: 'value',
        scale: true
      },
      series: [
        {
          name: '上证指数',
          type: 'line',
          data: [3210.45, 3215.23, 3218.46, 3225.78, 3227.51, 3229.76, 3230.89, 3228.67, 3231.45],
          smooth: true,
          itemStyle: {
            color: '#c23531'
          }
        },
        {
          name: '深证成指',
          type: 'line',
          data: [2195.32, 2192.45, 2189.32, 2185.64, 2181.34, 2178.23, 2175.67, 2179.82, 2183.19],
          smooth: true,
          itemStyle: {
            color: '#2f4554'
          }
        },
        {
          name: '创业板指',
          type: 'line',
          data: [2025.78, 2029.45, 2035.67, 2041.23, 2038.56, 2042.78, 2045.34, 2044.67, 2043.92],
          smooth: true,
          itemStyle: {
            color: '#61a0a8'
          }
        }
      ]
    };
  };

  // 获取行业分布图表配置
  const getSectorChartOption = () => {
    return {
      title: {
        text: '市场热度分布',
        left: 'center',
        textStyle: {
          fontSize: 14
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        bottom: 0,
        left: 'center',
        data: ['金融', '科技', '医药', '消费', '能源', '制造', '其他']
      },
      series: [
        {
          name: '行业分布',
          type: 'pie',
          radius: ['40%', '60%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
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
          data: [
            { value: 25, name: '金融' },
            { value: 20, name: '科技' },
            { value: 18, name: '医药' },
            { value: 15, name: '消费' },
            { value: 10, name: '能源' },
            { value: 8, name: '制造' },
            { value: 4, name: '其他' }
          ]
        }
      ]
    };
  };

  // 表格列定义
  const stockColumns = [
    {
      title: '股票代码',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <Button type="link" onClick={() => navigate(`/stock?code=${text}`)}>{text}</Button>
    },
    {
      title: '股票名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '最新价',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `¥${price.toFixed(2)}`
    },
    {
      title: '涨跌幅',
      dataIndex: 'change',
      key: 'change',
      render: (change) => (
        <Text type={change > 0 ? 'success' : 'danger'}>
          {change > 0 ? '+' : ''}{change.toFixed(2)}%
          {change > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        </Text>
      )
    },
    {
      title: '成交量',
      dataIndex: 'volume',
      key: 'volume',
      render: (volume) => {
        if (volume >= 1000000) {
          return `${(volume / 1000000).toFixed(2)}M`;
        } else {
          return `${(volume / 1000).toFixed(0)}K`;
        }
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" onClick={() => navigate(`/stock?code=${record.code}`)}>
            详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="home-container">
      {/* 市场概览 */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Title level={4} className="section-title">市场概览</Title>
        </Col>
        
        {/* 主要指数卡片 */}
        <Col xs={24} sm={8}>
          <Card hoverable className="index-card shanghai-card">
            <Statistic
              title={<span className="index-title">上证指数</span>}
              value={marketData.shanghai.index}
              precision={2}
              valueStyle={{ color: marketData.shanghai.change >= 0 ? '#cf1322' : '#3f8600' }}
              prefix={marketData.shanghai.change >= 0 ? <RiseOutlined /> : <FallOutlined />}
              suffix={
                <Text style={{ fontSize: 16, color: marketData.shanghai.change >= 0 ? '#cf1322' : '#3f8600' }}>
                  {marketData.shanghai.change >= 0 ? '+' : ''}{marketData.shanghai.change.toFixed(2)} ({marketData.shanghai.changePercent.toFixed(2)}%)
                </Text>
              }
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={8}>
          <Card hoverable className="index-card shenzhen-card">
            <Statistic
              title={<span className="index-title">深证成指</span>}
              value={marketData.shenzhen.index}
              precision={2}
              valueStyle={{ color: marketData.shenzhen.change >= 0 ? '#cf1322' : '#3f8600' }}
              prefix={marketData.shenzhen.change >= 0 ? <RiseOutlined /> : <FallOutlined />}
              suffix={
                <Text style={{ fontSize: 16, color: marketData.shenzhen.change >= 0 ? '#cf1322' : '#3f8600' }}>
                  {marketData.shenzhen.change >= 0 ? '+' : ''}{marketData.shenzhen.change.toFixed(2)} ({marketData.shenzhen.changePercent.toFixed(2)}%)
                </Text>
              }
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={8}>
          <Card hoverable className="index-card chuangye-card">
            <Statistic
              title={<span className="index-title">创业板指</span>}
              value={marketData.chuangye.index}
              precision={2}
              valueStyle={{ color: marketData.chuangye.change >= 0 ? '#cf1322' : '#3f8600' }}
              prefix={marketData.chuangye.change >= 0 ? <RiseOutlined /> : <FallOutlined />}
              suffix={
                <Text style={{ fontSize: 16, color: marketData.chuangye.change >= 0 ? '#cf1322' : '#3f8600' }}>
                  {marketData.chuangye.change >= 0 ? '+' : ''}{marketData.chuangye.change.toFixed(2)} ({marketData.chuangye.changePercent.toFixed(2)}%)
                </Text>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* 市场趋势 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={16}>
          <Card title="市场走势" extra={<ReloadOutlined />}>
            <Skeleton loading={loading} active paragraph={{ rows: 10 }}>
              <ReactECharts
                option={getIndexChartOption()}
                style={{ height: '350px' }}
                className="echarts-for-react"
              />
            </Skeleton>
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card title="热点板块" extra={<ReloadOutlined />} className="hot-sectors">
            <Skeleton loading={loading} active paragraph={{ rows: 10 }}>
              <ReactECharts
                option={getSectorChartOption()}
                style={{ height: '350px' }}
                className="echarts-for-react"
              />
            </Skeleton>
          </Card>
        </Col>
      </Row>

      {/* 市场资讯 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card
            className="market-news-card"
            title={
              <div className="card-title-with-icon">
                <InfoCircleOutlined /> 市场资讯
              </div>
            }
            extra={
              <Button type="link" icon={<ReloadOutlined />} onClick={handleRefreshNews} loading={newsLoading}>
                刷新
              </Button>
            }
          >
            {newsLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : newsData.length > 0 ? (
              <List
                itemLayout="vertical"
                dataSource={newsData}
                renderItem={(news) => (
                  <List.Item
                    key={news.title}
                    extra={
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        <div>{news.publish_time}</div>
                        <div>来源: {news.source}</div>
                      </div>
                    }
                  >
                    <List.Item.Meta
                      title={
                        <a href={news.link} target="_blank" rel="noopener noreferrer">
                          {news.title}
                        </a>
                      }
                    />
                  </List.Item>
                )}
                pagination={{
                  pageSize: 3,
                  size: 'small',
                  hideOnSinglePage: true,
                  showSizeChanger: false
                }}
              />
            ) : (
              <Empty description="暂无市场资讯" />
            )}
          </Card>
        </Col>
      </Row>

      {/* 热门股票和AI推荐 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card 
            title={<div className="card-title-with-icon"><FireOutlined /> 热门股票</div>}
            extra={<Button type="link" icon={<ReloadOutlined />}>刷新</Button>}
          >
            <Skeleton loading={loading} active>
              <Table
                dataSource={hotStocks}
                columns={stockColumns}
                rowKey="code"
                pagination={false}
                size="small"
              />
            </Skeleton>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            title={<div className="card-title-with-icon"><RobotOutlined /> AI智能推荐</div>}
            extra={<Button type="link" onClick={() => navigate('/strategy/manage')}>更多</Button>}
            className="ai-recommend-card"
          >
            <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
              <List
                itemLayout="horizontal"
                dataSource={recommendedStocks}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar className="stock-avatar">{item.name.substring(0, 1)}</Avatar>}
                      title={
                        <Space>
                          <Text strong>{item.name}</Text>
                          <Text code>{item.code}</Text>
                          <Tag color={item.change > 0 ? "red" : "green"}>
                            {item.change > 0 ? "+" : ""}{item.change.toFixed(2)}%
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <Tag icon={<BulbOutlined />} color="processing">推荐理由</Tag>
                          <Text>{item.reason}</Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Skeleton>
            
            <Divider />
            
            <Button 
              type="primary" 
              icon={<RobotOutlined />} 
              onClick={() => navigate('/strategy/manage')}
              block
            >
              查看更多AI分析
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home; 