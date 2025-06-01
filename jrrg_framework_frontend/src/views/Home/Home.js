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
  Empty,
  message,
  Tooltip,
  Radio
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
  ReloadOutlined,
  LinkOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import { getMarketNews } from '../../api/news'; // 导入获取市场资讯的API
import { getMarketIndexes, getMarketTrend } from '../../api/stock'; // 导入获取指数和走势的API

const { Title, Text, Paragraph, Link } = Typography;

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [combinedTrendLoading, setCombinedTrendLoading] = useState(true);
  const [marketData, setMarketData] = useState({
    shanghai: { index: 3231.45, change: 23.47, changePercent: 0.73, code: '000001' },
    shenzhen: { index: 2183.19, change: -11.49, changePercent: -0.52, code: '399001' },
    chuangye: { index: 2043.92, change: 15.72, changePercent: 0.77, code: '399006' }
  });
  const [trendData, setTrendData] = useState(null);
  const [combinedTrendData, setCombinedTrendData] = useState({
    shanghai: null,
    shenzhen: null,
    chuangye: null
  });
  const [currentIndex, setCurrentIndex] = useState('000001'); // 当前选择的指数
  const [trendPeriod, setTrendPeriod] = useState('1y'); // 当前选择的时间间隔
  const [showCombined, setShowCombined] = useState(false); // 是否显示组合视图
  const [hotStocks, setHotStocks] = useState([]);
  const [recommendedStocks, setRecommendedStocks] = useState([]);
  const [newsData, setNewsData] = useState([]);  // 新添加的新闻数据状态
  const [newsLoading, setNewsLoading] = useState(true);  // 新闻加载状态
  const navigate = useNavigate();

  // 获取市场新闻数据
  const fetchNewsData = async () => {
    try {
      setNewsLoading(true);
      const response = await getMarketNews(10); // 获取10条市场新闻
      
      // 确保响应对象存在并且code为0（成功状态）
      if (response && response.code === 0) {
        // 确保数据是数组且不为空
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setNewsData(response.data);
          console.log(`成功获取${response.data.length}条市场新闻`);
        } else {
          console.log('获取到的新闻数据为空');
          setNewsData([]);
        }
      } else {
        console.error('获取新闻数据失败:', response ? response.message : '未知错误');
        setNewsData([]);
      }
    } catch (error) {
      console.error('获取新闻数据出错:', error);
      setNewsData([]);
    } finally {
      setNewsLoading(false);
    }
  };

  // 获取三大指数实时数据
  const fetchMarketIndexes = async () => {
    try {
      const response = await getMarketIndexes();
      if (response && response.code === 0) {
        console.log('获取到三大指数数据:', response.data);
        setMarketData(response.data);
      } else {
        console.error('获取三大指数数据失败:', response ? response.message : '未知错误');
      }
    } catch (error) {
      console.error('获取三大指数数据出错:', error);
    }
  };

  // 获取市场指数走势数据
  const fetchMarketTrend = async (indexCode = '000001', period = '1y') => {
    try {
      setTrendLoading(true);
      console.log(`开始获取市场走势数据: indexCode=${indexCode}, period=${period}`);
      
      const response = await getMarketTrend(indexCode, period);
      if (response && response.code === 0 && response.data) {
        console.log('获取到市场走势数据:', response.data);
        
        // 检查数据是否为空
        if (!response.data.data || response.data.data.length === 0) {
          console.error('获取到的市场走势数据为空');
          message.error('获取市场走势数据失败: 数据为空');
          setTrendData(null);
          return;
        }
        
        // 检查数据格式
        const sampleData = response.data.data[0];
        console.log('数据样例:', sampleData);
        
        if (!sampleData.date || !sampleData.close) {
          console.error('数据格式不正确:', sampleData);
          message.error('获取市场走势数据失败: 数据格式不正确');
          setTrendData(null);
          return;
        }
        
        setTrendData(response.data);
      } else {
        console.error('获取市场走势数据失败:', response ? response.message : '未知错误');
        message.error(`获取市场走势数据失败: ${response ? response.message : '未知错误'}`);
        setTrendData(null);
      }
    } catch (error) {
      console.error('获取市场走势数据出错:', error);
      message.error(`获取市场走势数据出错: ${error.message}`);
      setTrendData(null);
    } finally {
      setTrendLoading(false);
    }
  };

  // 获取组合指数走势数据
  const fetchCombinedTrendData = async (period = '1y') => {
    setCombinedTrendLoading(true);
    try {
      console.log(`开始获取组合市场走势数据: period=${period}`);
      
      // 并行获取三个指数的数据
      const [shanghaiRes, shenzhenRes, chuangyeRes] = await Promise.all([
        getMarketTrend('000001', period),
        getMarketTrend('399001', period),
        getMarketTrend('399006', period)
      ]);
      
      const newCombinedData = { ...combinedTrendData };
      
      if (shanghaiRes && shanghaiRes.code === 0 && shanghaiRes.data && shanghaiRes.data.data) {
        console.log('获取到上证指数数据，数据点数量:', shanghaiRes.data.data.length);
        newCombinedData.shanghai = shanghaiRes.data;
      }
      
      if (shenzhenRes && shenzhenRes.code === 0 && shenzhenRes.data && shenzhenRes.data.data) {
        console.log('获取到深证成指数据，数据点数量:', shenzhenRes.data.data.length);
        newCombinedData.shenzhen = shenzhenRes.data;
      }
      
      if (chuangyeRes && chuangyeRes.code === 0 && chuangyeRes.data && chuangyeRes.data.data) {
        console.log('获取到创业板指数据，数据点数量:', chuangyeRes.data.data.length);
        newCombinedData.chuangye = chuangyeRes.data;
      }
      
      setCombinedTrendData(newCombinedData);
    } catch (error) {
      console.error('获取组合市场走势数据出错:', error);
      message.error(`获取组合市场走势数据出错: ${error.message}`);
    } finally {
      setCombinedTrendLoading(false);
    }
  };

  // 处理显示模式切换
  const toggleDisplayMode = () => {
    const newMode = !showCombined;
    setShowCombined(newMode);
    if (newMode && (!combinedTrendData.shanghai || !combinedTrendData.shenzhen || !combinedTrendData.chuangye)) {
      fetchCombinedTrendData(trendPeriod);
    }
  };

  // 处理指数切换
  const handleIndexChange = (indexCode) => {
    setCurrentIndex(indexCode);
    if (showCombined) {
      fetchCombinedTrendData(trendPeriod);
    } else {
      fetchMarketTrend(indexCode, trendPeriod);
    }
  };

  // 处理时间间隔切换
  const handlePeriodChange = (e) => {
    const period = e.target.value;
    setTrendPeriod(period);
    if (showCombined) {
      fetchCombinedTrendData(period);
    } else {
      fetchMarketTrend(currentIndex, period);
    }
  };

  // 刷新指数数据
  const handleRefreshIndexes = () => {
    setLoading(true);
    fetchMarketIndexes().finally(() => {
      setLoading(false);
      message.success('指数数据已更新');
    });
  };

  // 模拟加载数据
  useEffect(() => {
    // 获取三大指数实时数据
    fetchMarketIndexes();
    
    // 获取市场走势数据
    fetchMarketTrend('000001', '1y');
    
    // 获取组合走势数据（预加载）
    fetchCombinedTrendData('1y');
    
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

  // 跳转到指数行情页面
  const navigateToIndex = (code) => {
    navigate(`/stock?code=${code}`);
  };

  // 刷新新闻数据
  const handleRefreshNews = () => {
    fetchNewsData();
  };

  // 获取指数变化图表配置
  const getIndexChartOption = () => {
    // 如果没有数据，返回空配置
    if (!trendData || !trendData.data || trendData.data.length === 0) {
      console.log('没有趋势数据，返回空图表配置');
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
        xAxis: {
          type: 'category',
          data: []
        },
        yAxis: {
          type: 'value',
          scale: true
        },
        series: []
      };
    }

    try {
      // 准备数据
      const dates = trendData.data.map(item => item.date);
      const prices = trendData.data.map(item => item.close);
      
      console.log(`处理了 ${dates.length} 条数据`);
      console.log('日期范围:', dates[0], '至', dates[dates.length - 1]);
      console.log('价格范围:', Math.min(...prices), '至', Math.max(...prices));

      // 根据指数类型设置不同颜色
      let lineColor = '#c23531'; // 默认颜色（红色）
      if (currentIndex === '000001') {
        lineColor = '#c23531'; // 上证指数 - 红色
      } else if (currentIndex === '399001') {
        lineColor = '#2f4554'; // 深证成指 - 蓝黑色
      } else if (currentIndex === '399006') {
        lineColor = '#61a0a8'; // 创业板指 - 青绿色
      }

      return {
        title: {
          text: `${trendData.name}走势图`,
          left: 'center',
          textStyle: {
            fontSize: 14
          }
        },
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            try {
              const dataIndex = params[0].dataIndex;
              const item = trendData.data[dataIndex];
              return `日期: ${item.date}<br/>
                      开盘价: ${item.open.toFixed(2)}<br/>
                      收盘价: ${item.close.toFixed(2)}<br/>
                      最高价: ${item.high.toFixed(2)}<br/>
                      最低价: ${item.low.toFixed(2)}<br/>
                      成交量: ${(item.volume/10000).toFixed(2)}万手`;
            } catch (error) {
              console.error('提示框数据处理错误:', error);
              return '数据加载中...';
            }
          }
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
          data: dates,
          axisLabel: {
            rotate: 45,
            interval: Math.floor(dates.length / 10)
          }
        },
        yAxis: {
          type: 'value',
          scale: true,
          splitLine: {
            show: true,
            lineStyle: {
              type: 'dashed'
            }
          }
        },
        dataZoom: [
          {
            type: 'inside',
            start: 0,
            end: 100
          },
          {
            start: 0,
            end: 100
          }
        ],
        series: [
          {
            name: trendData.name,
            type: 'line',
            data: prices,
            smooth: true,
            itemStyle: {
              color: lineColor
            },
            lineStyle: {
              width: 2,
              color: lineColor
            },
            symbolSize: 5,
            showSymbol: false,
            markPoint: {
              data: [
                { type: 'max', name: '最高' },
                { type: 'min', name: '最低' }
              ]
            }
          }
        ]
      };
    } catch (error) {
      console.error('生成图表配置出错:', error);
      return {
        title: {
          text: '数据处理出错',
          left: 'center',
          textStyle: {
            fontSize: 14,
            color: '#ff0000'
          }
        },
        xAxis: {
          type: 'category',
          data: []
        },
        yAxis: {
          type: 'value',
          scale: true
        }
      };
    }
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

  // 获取组合指数图表配置
  const getCombinedChartOption = () => {
    try {
      const { shanghai, shenzhen, chuangye } = combinedTrendData;
      
      // 检查数据可用性
      if (!shanghai || !shanghai.data || !shenzhen || !shenzhen.data || !chuangye || !chuangye.data) {
        return {
          title: {
            text: '三大指数走势对比',
            left: 'center',
            textStyle: {
              fontSize: 14
            }
          },
          xAxis: {
            type: 'category',
            data: []
          },
          yAxis: {
            type: 'value',
            scale: true
          },
          series: []
        };
      }
      
      // 为了对比，需要将各个指数的收盘价标准化处理
      // 以第一个交易日的收盘价为基准，计算之后每日的涨跌幅
      const processIndexData = (data) => {
        if (!data || !data.data || data.data.length === 0) return { dates: [], values: [] };
        
        const baseValue = data.data[0].close;
        const dates = data.data.map(item => item.date);
        const values = data.data.map(item => (item.close / baseValue * 100).toFixed(2));
        
        return { dates, values, name: data.name };
      };
      
      const shanghaiData = processIndexData(shanghai);
      const shenzhenData = processIndexData(shenzhen);
      const chuangyeData = processIndexData(chuangye);
      
      // 使用最长的日期数组作为X轴数据
      let xAxisDates = [];
      if (shanghaiData.dates.length >= shenzhenData.dates.length && 
          shanghaiData.dates.length >= chuangyeData.dates.length) {
        xAxisDates = shanghaiData.dates;
      } else if (shenzhenData.dates.length >= shanghaiData.dates.length && 
                 shenzhenData.dates.length >= chuangyeData.dates.length) {
        xAxisDates = shenzhenData.dates;
      } else {
        xAxisDates = chuangyeData.dates;
      }
      
      return {
        title: {
          text: '三大指数走势对比',
          left: 'center',
          textStyle: {
            fontSize: 14
          }
        },
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            try {
              let tooltipText = `日期: ${params[0].axisValue}<br/>`;
              
              params.forEach(param => {
                tooltipText += `${param.seriesName}: ${param.value}%<br/>`;
              });
              
              return tooltipText;
            } catch (error) {
              console.error('提示框数据处理错误:', error);
              return '数据加载中...';
            }
          }
        },
        legend: {
          data: [shanghaiData.name, shenzhenData.name, chuangyeData.name],
          bottom: 10
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
          data: xAxisDates,
          axisLabel: {
            rotate: 45,
            interval: Math.floor(xAxisDates.length / 10)
          }
        },
        yAxis: {
          type: 'value',
          name: '指数涨跌(%)',
          scale: true,
          splitLine: {
            show: true,
            lineStyle: {
              type: 'dashed'
            }
          }
        },
        dataZoom: [
          {
            type: 'inside',
            start: 0,
            end: 100
          },
          {
            start: 0,
            end: 100
          }
        ],
        series: [
          {
            name: shanghaiData.name,
            type: 'line',
            data: shanghaiData.values,
            smooth: true,
            itemStyle: {
              color: '#c23531'  // 红色
            },
            lineStyle: {
              width: 2
            },
            symbolSize: 5,
            showSymbol: false
          },
          {
            name: shenzhenData.name,
            type: 'line',
            data: shenzhenData.values,
            smooth: true,
            itemStyle: {
              color: '#2f4554'  // 蓝黑色
            },
            lineStyle: {
              width: 2
            },
            symbolSize: 5,
            showSymbol: false
          },
          {
            name: chuangyeData.name,
            type: 'line',
            data: chuangyeData.values,
            smooth: true,
            itemStyle: {
              color: '#61a0a8'  // 青绿色
            },
            lineStyle: {
              width: 2
            },
            symbolSize: 5,
            showSymbol: false
          }
        ]
      };
    } catch (error) {
      console.error('生成组合图表配置出错:', error);
      return {
        title: {
          text: '数据处理出错',
          left: 'center',
          textStyle: {
            fontSize: 14,
            color: '#ff0000'
          }
        },
        xAxis: {
          type: 'category',
          data: []
        },
        yAxis: {
          type: 'value',
          scale: true
        }
      };
    }
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
          <Button 
            type="link" 
            icon={<ReloadOutlined spin={loading} />}
            onClick={handleRefreshIndexes}
            style={{ marginLeft: 8 }}
            disabled={loading}
          >
            刷新指数
          </Button>
        </Col>
        
        {/* 主要指数卡片 */}
        <Col xs={24} sm={8}>
          <Card 
            hoverable 
            className="index-card shanghai-card"
            onClick={() => navigateToIndex(marketData.shanghai.code)}
          >
            <Statistic
              title={<span className="index-title">上证指数</span>}
              value={marketData.shanghai.index}
              precision={2}
              valueStyle={{ 
                color: marketData.shanghai.change >= 0 ? '#cf1322' : '#3f8600',
                fontSize: '24px',
                fontWeight: 'bold'
              }}
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
          <Card 
            hoverable 
            className="index-card shenzhen-card"
            onClick={() => navigateToIndex(marketData.shenzhen.code)}
          >
            <Statistic
              title={<span className="index-title">深证成指</span>}
              value={marketData.shenzhen.index}
              precision={2}
              valueStyle={{ 
                color: marketData.shenzhen.change >= 0 ? '#cf1322' : '#3f8600',
                fontSize: '24px',
                fontWeight: 'bold'
              }}
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
          <Card 
            hoverable 
            className="index-card chuangye-card"
            onClick={() => navigateToIndex(marketData.chuangye.code)}
          >
            <Statistic
              title={<span className="index-title">创业板指</span>}
              value={marketData.chuangye.index}
              precision={2}
              valueStyle={{ 
                color: marketData.chuangye.change >= 0 ? '#cf1322' : '#3f8600',
                fontSize: '24px',
                fontWeight: 'bold'
              }}
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
          <Card 
            title={
              <div className="card-title-with-icon">
                <LineChartOutlined /> 市场走势
              </div>
            } 
            extra={
              <Space>
                <Button 
                  type={showCombined ? "primary" : "default"} 
                  onClick={toggleDisplayMode}
                >
                  {showCombined ? "单指数视图" : "对比视图"}
                </Button>
                <Button 
                  type="link" 
                  icon={<ReloadOutlined spin={showCombined ? combinedTrendLoading : trendLoading} />} 
                  onClick={() => showCombined ? fetchCombinedTrendData(trendPeriod) : fetchMarketTrend(currentIndex, trendPeriod)} 
                />
              </Space>
            }
          >
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {!showCombined && (
                  <Radio.Group value={currentIndex} onChange={(e) => handleIndexChange(e.target.value)} buttonStyle="solid">
                    <Radio.Button value="000001">上证指数</Radio.Button>
                    <Radio.Button value="399001">深证成指</Radio.Button>
                    <Radio.Button value="399006">创业板指</Radio.Button>
                  </Radio.Group>
                )}
              </div>
              <div>
                <Radio.Group value={trendPeriod} onChange={handlePeriodChange} buttonStyle="solid">
                  <Radio.Button value="3m">三个月</Radio.Button>
                  <Radio.Button value="1y">一年</Radio.Button>
                  <Radio.Button value="5y">五年</Radio.Button>
                </Radio.Group>
              </div>
            </div>
            
            {showCombined ? (
              <Skeleton loading={combinedTrendLoading} active paragraph={{ rows: 10 }}>
                <ReactECharts
                  option={getCombinedChartOption()}
                  style={{ height: '350px' }}
                  className="echarts-for-react"
                />
              </Skeleton>
            ) : (
              <Skeleton loading={trendLoading} active paragraph={{ rows: 10 }}>
                <ReactECharts
                  option={getIndexChartOption()}
                  style={{ height: '350px' }}
                  className="echarts-for-react"
                />
              </Skeleton>
            )}
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <Card 
            title={
              <div className="card-title-with-icon">
                <BarChartOutlined /> 热点板块
              </div>
            } 
            extra={<Button type="link" icon={<ReloadOutlined />} onClick={() => setLoading(true)} />} 
            className="hot-sectors"
          >
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
              <Button 
                type="link" 
                icon={<ReloadOutlined spin={newsLoading} />} 
                onClick={handleRefreshNews}
                disabled={newsLoading}
              >
                刷新
              </Button>
            }
          >
            {newsLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : newsData.length > 0 ? (
              <List
                itemLayout="vertical"
                dataSource={newsData}
                pagination={{
                  pageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ['5', '10'],
                  showTotal: (total) => `共 ${total} 条新闻`
                }}
                renderItem={(news) => (
                  <List.Item
                    key={news.title + (news.publish_time || '')}
                    actions={[]}
                    extra={
                      <Button 
                        type="primary" 
                        icon={<LinkOutlined />} 
                        href={news.link} 
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        阅读原文
                      </Button>
                    }
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          <Link href={news.link} target="_blank" rel="noopener noreferrer">
                            {news.title}
                          </Link>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty 
                description="暂无市场资讯" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 热门股票和AI推荐 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card 
            title={
              <div className="card-title-with-icon">
                <FireOutlined /> 热门股票
              </div>
            }
            extra={
              <Button 
                type="link" 
                icon={<ReloadOutlined spin={loading} />}
                onClick={() => setLoading(true)}
                disabled={loading}
              >
                刷新
              </Button>
            }
          >
            <Skeleton loading={loading} active>
              <Table
                dataSource={hotStocks}
                columns={stockColumns}
                rowKey="code"
                pagination={false}
                size="small"
                rowClassName={() => 'stock-table-row'}
              />
            </Skeleton>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            title={
              <div className="card-title-with-icon">
                <RobotOutlined /> AI智能推荐
              </div>
            }
            extra={
              <Button 
                type="link" 
                onClick={() => navigate('/strategy/manage')}
              >
                更多
              </Button>
            }
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
              size="large"
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