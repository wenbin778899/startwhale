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
  Radio,
  Modal
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
  LinkOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import { getMarketNews } from '../../api/news'; // 导入获取市场资讯的API
import { getMarketIndexes, getMarketTrend, getHotStocks } from '../../api/stock'; // 导入获取指数和走势的API

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
  const [hotStocksLoading, setHotStocksLoading] = useState(false); // 热门股票加载状态
  const [isHeatmapFullscreen, setIsHeatmapFullscreen] = useState(false); // 热力图全屏状态
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

  // 获取热门股票数据
  const fetchHotStocks = async (timePeriod = 'CNHOUR12') => {
    try {
      setHotStocksLoading(true);
      console.log(`开始获取热门股票数据: timePeriod=${timePeriod}`);
      const response = await getHotStocks(timePeriod);
      
      if (response && response.code === 0 && response.data) {
        const stocksData = response.data.stocks || [];
        console.log(`成功获取${stocksData.length}只热门股票`);
        
        // 转换数据格式以适配表格
        const formattedStocks = stocksData.map((stock, index) => ({
          key: index,
          name: stock.name,
          rate: stock.rate,
          rate_display: stock.rate_display
        }));
        
        setHotStocks(formattedStocks);
        
        if (response.data.fallback) {
          message.info('使用备用热门股票数据');
        } else {
          message.success(`成功更新${stocksData.length}只热门股票`);
        }
      } else {
        console.error('获取热门股票数据失败:', response ? response.message : '未知错误');
        // 使用备用数据
        setHotStocks([
          { key: 0, name: '贵州茅台', rate: 8.5, rate_display: '+8.50%' },
          { key: 1, name: '五粮液', rate: 7.2, rate_display: '+7.20%' },
          { key: 2, name: '中国平安', rate: 6.8, rate_display: '+6.80%' },
          { key: 3, name: '宁德时代', rate: 6.3, rate_display: '+6.30%' },
          { key: 4, name: '紫金矿业', rate: 5.9, rate_display: '+5.90%' }
        ]);
        message.error('获取热门股票失败，使用备用数据');
      }
    } catch (error) {
      console.error('获取热门股票数据出错:', error);
      // 使用备用数据
      setHotStocks([
        { key: 0, name: '贵州茅台', rate: 8.5, rate_display: '+8.50%' },
        { key: 1, name: '五粮液', rate: 7.2, rate_display: '+7.20%' },
        { key: 2, name: '中国平安', rate: 6.8, rate_display: '+6.80%' },
        { key: 3, name: '宁德时代', rate: 6.3, rate_display: '+6.30%' },
        { key: 4, name: '紫金矿业', rate: 5.9, rate_display: '+5.90%' }
      ]);
      message.error('获取热门股票失败，使用备用数据');
    } finally {
      setHotStocksLoading(false);
    }
  };

  // 模拟加载数据
  useEffect(() => {
    // 获取三大指数实时数据
    fetchMarketIndexes();
    
    // 获取市场走势数据
    fetchMarketTrend('000001', '1y');
    
    // 获取组合走势数据（预加载）
    fetchCombinedTrendData('1y');
    
    // 获取热门股票数据
    fetchHotStocks();
    
    setTimeout(() => {
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
      title: '股票名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '人气指数',
      dataIndex: 'rate',
      key: 'rate',
      render: (rate, record) => (
        <Tag color={rate > 0 ? 'red' : rate < 0 ? 'green' : 'default'}>
          {record.rate_display || `${rate.toFixed(2)}%`}
        </Tag>
      )
    }
  ];

  return (
    <div className="home-container">
      {/* 市场概览 */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Title level={4} className="section-title" style={{ marginBottom: 0, marginRight: 8 }}>市场概览</Title>
              <Tooltip title="数据来源：雪球实时接口，刷新获取最新数据">
                <Tag color="green" style={{ fontSize: '10px', padding: '0 4px' }}>
                  <span style={{ color: '#52c41a' }}>●</span> 实时
                </Tag>
              </Tooltip>
            </div>
          <Button 
            type="link" 
            icon={<ReloadOutlined spin={loading} />}
            onClick={handleRefreshIndexes}
            disabled={loading}
              size="small"
          >
            刷新指数
          </Button>
          </div>
        </Col>
        
        {/* 主要指数卡片 */}
        <Col xs={24} sm={8}>
          <Card 
            hoverable 
            className="index-card shanghai-card"
            onClick={() => navigateToIndex(marketData.shanghai.code)}
            style={{ 
              backgroundColor: '#e6f7ff',
              borderColor: '#40a9ff',
              minHeight: '120px'
            }}
          >
            <Statistic
              title={<span className="index-title" style={{ color: marketData.shanghai.change >= 0 ? '#cf1322' : '#3f8600' }}>上证指数</span>}
              value={marketData.shanghai.index}
              precision={2}
              valueStyle={{ 
                color: marketData.shanghai.change >= 0 ? '#cf1322' : '#3f8600',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
              prefix={marketData.shanghai.change >= 0 ? <RiseOutlined /> : <FallOutlined />}
              suffix={
                <Text style={{ fontSize: 14, color: marketData.shanghai.change >= 0 ? '#cf1322' : '#3f8600' }}>
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
            style={{ 
              backgroundColor: '#f6ffed',
              borderColor: '#52c41a',
              minHeight: '120px'
            }}
          >
            <Statistic
              title={<span className="index-title" style={{ color: marketData.shenzhen.change >= 0 ? '#cf1322' : '#3f8600' }}>深证成指</span>}
              value={marketData.shenzhen.index}
              precision={2}
              valueStyle={{ 
                color: marketData.shenzhen.change >= 0 ? '#cf1322' : '#3f8600',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
              prefix={marketData.shenzhen.change >= 0 ? <RiseOutlined /> : <FallOutlined />}
              suffix={
                <Text style={{ fontSize: 14, color: marketData.shenzhen.change >= 0 ? '#cf1322' : '#3f8600' }}>
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
            style={{ 
              backgroundColor: '#fff2e8',
              borderColor: '#fa8c16',
              minHeight: '120px'
            }}
          >
            <Statistic
              title={<span className="index-title" style={{ color: marketData.chuangye.change >= 0 ? '#cf1322' : '#3f8600' }}>创业板指</span>}
              value={marketData.chuangye.index}
              precision={2}
              valueStyle={{ 
                color: marketData.chuangye.change >= 0 ? '#cf1322' : '#3f8600',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
              prefix={marketData.chuangye.change >= 0 ? <RiseOutlined /> : <FallOutlined />}
              suffix={
                <Text style={{ fontSize: 14, color: marketData.chuangye.change >= 0 ? '#cf1322' : '#3f8600' }}>
                  {marketData.chuangye.change >= 0 ? '+' : ''}{marketData.chuangye.change.toFixed(2)} ({marketData.chuangye.changePercent.toFixed(2)}%)
                </Text>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* 市场趋势与热力图 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
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
                  size="small"
                >
                  {showCombined ? "单指数" : "对比"}
                </Button>
                <Button 
                  type="link" 
                  icon={<ReloadOutlined spin={showCombined ? combinedTrendLoading : trendLoading} />} 
                  onClick={() => showCombined ? fetchCombinedTrendData(trendPeriod) : fetchMarketTrend(currentIndex, trendPeriod)} 
                />
              </Space>
            }
            style={{ height: '500px' }}
          >
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {!showCombined && (
                  <Radio.Group value={currentIndex} onChange={(e) => handleIndexChange(e.target.value)} buttonStyle="solid" size="small">
                    <Radio.Button value="000001">上证</Radio.Button>
                    <Radio.Button value="399001">深证</Radio.Button>
                    <Radio.Button value="399006">创业板</Radio.Button>
                  </Radio.Group>
                )}
              </div>
              <div>
                <Radio.Group value={trendPeriod} onChange={handlePeriodChange} buttonStyle="solid" size="small">
                  <Radio.Button value="3m">3月</Radio.Button>
                  <Radio.Button value="1y">1年</Radio.Button>
                  <Radio.Button value="5y">5年</Radio.Button>
                </Radio.Group>
              </div>
            </div>
            
            {showCombined ? (
              <Skeleton loading={combinedTrendLoading} active paragraph={{ rows: 8 }}>
                <ReactECharts
                  option={getCombinedChartOption()}
                  style={{ height: '400px' }}
                  className="echarts-for-react"
                />
              </Skeleton>
            ) : (
              <Skeleton loading={trendLoading} active paragraph={{ rows: 8 }}>
                <ReactECharts
                  option={getIndexChartOption()}
                  style={{ height: '400px' }}
                  className="echarts-for-react"
                />
              </Skeleton>
            )}
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card 
            title={
              <div className="card-title-with-icon">
                <BarChartOutlined /> 市场热力 <Text type="secondary" style={{fontSize: '12px'}}>(大盘云图)</Text>
              </div>
            }
            extra={
              <Space>
                <Tooltip title="全屏查看">
                  <Button 
                    type="link" 
                    icon={<FullscreenOutlined />} 
                    onClick={() => setIsHeatmapFullscreen(true)} 
                  />
                </Tooltip>
                <Tooltip title="刷新页面">
                  <Button 
                    type="link" 
                    icon={<ReloadOutlined />} 
                    onClick={() => {
                      // 刷新iframe
                      const iframe = document.getElementById('heatmap-iframe');
                      if (iframe) {
                        iframe.src = iframe.src;
                      }
                      message.success('热力图已刷新');
                    }} 
                  />
                </Tooltip>
              </Space>
            }
            bodyStyle={{ padding: '4px', height: '440px' }}
            style={{ height: '500px' }}
          >
            <div style={{ height: '100%', border: '1px solid #d9d9d9', borderRadius: '6px', overflow: 'hidden' }}>
              <iframe
                id="heatmap-iframe"
                //src="https://dapanyuntu.com/"
                src="https://stock.diedong.com/"
                style={{
                  width: '166.67%',
                  height: '166.67%',
                  border: 'none',
                  transform: 'scale(0.6)',
                  transformOrigin: '0 0'
                }}
                title="市场热力 - 大盘云图全屏模式"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 市场资讯、热门股票和AI推荐 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={8}>
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
            style={{ height: '500px' }}
            bodyStyle={{ height: '440px', overflowY: 'auto', padding: '16px' }}
          >
            {newsLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : newsData.length > 0 ? (
              <List
                itemLayout="vertical"
                dataSource={newsData}
                pagination={{
                  pageSize: 3,
                  showSizeChanger: false,
                  showTotal: (total) => `共 ${total} 条新闻`,
                  size: 'small'
                }}
                renderItem={(news) => (
                  <List.Item
                    key={news.title + (news.publish_time || '')}
                    actions={[
                      <Space key="source-info">
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {news.source || '财新网'}
                        </Text>
                        {news.interval_time && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {news.interval_time}
                          </Text>
                        )}
                        {news.publish_time && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {news.publish_time}
                          </Text>
                        )}
                      </Space>
                    ]}
                    extra={
                      news.link && (
                        <Button 
                          type="primary" 
                          icon={<LinkOutlined />} 
                          href={news.link} 
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                        >
                          阅读
                        </Button>
                      )
                    }
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                          {news.link ? (
                            <Link href={news.link} target="_blank" rel="noopener noreferrer">
                              {news.title}
                            </Link>
                          ) : (
                            news.title
                          )}
                        </div>
                      }
                      description={
                        news.summary && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {news.summary.length > 60 ? news.summary.substring(0, 60) + '...' : news.summary}
                          </Text>
                        )
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
        
        <Col xs={24} lg={8}>
          <Card 
            title={
              <div className="card-title-with-icon">
                <FireOutlined /> 热门股票 <Text type="secondary" style={{fontSize: '12px'}}>(微博舆情)</Text>
              </div>
            }
            extra={
              <Button 
                type="link" 
                icon={<ReloadOutlined spin={hotStocksLoading} />}
                onClick={() => fetchHotStocks()}
                disabled={hotStocksLoading}
              >
                刷新
              </Button>
            }
            style={{ height: '500px' }}
            bodyStyle={{ height: '440px', overflowY: 'auto', padding: '16px' }}
          >
            <Skeleton loading={hotStocksLoading || loading} active>
              <Table
                dataSource={hotStocks}
                columns={stockColumns}
                rowKey="key"
                pagination={{
                  pageSize: 6,
                  showSizeChanger: false,
                  showTotal: (total) => `共 ${total} 只热门股票`,
                  size: 'small'
                }}
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
            style={{ height: '500px' }}
            bodyStyle={{ height: '440px', overflowY: 'auto', padding: '16px' }}
          >
            <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
              <List
                itemLayout="horizontal"
                dataSource={recommendedStocks}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar className="stock-avatar" size="small">{item.name.substring(0, 1)}</Avatar>}
                      title={
                        <Space>
                          <Text strong style={{ fontSize: '14px' }}>{item.name}</Text>
                          <Text code style={{ fontSize: '12px' }}>{item.code}</Text>
                          <Tag color={item.change > 0 ? "red" : "green"} size="small">
                            {item.change > 0 ? "+" : ""}{item.change.toFixed(2)}%
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <Tag icon={<BulbOutlined />} color="processing" size="small">推荐理由</Tag>
                          <Text style={{ fontSize: '12px' }}>{item.reason}</Text>
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
      
      {/* 大盘云图全屏模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              <BarChartOutlined style={{ marginRight: 8 }} />
              市场热力 - 大盘云图
            </span>
            <Button 
              type="link" 
              icon={<FullscreenExitOutlined />} 
              onClick={() => setIsHeatmapFullscreen(false)}
            >
              退出全屏
            </Button>
          </div>
        }
        open={isHeatmapFullscreen}
        onCancel={() => setIsHeatmapFullscreen(false)}
        footer={null}
        width="100vw"
        style={{ 
          top: 0, 
          paddingBottom: 0,
          maxWidth: 'none'
        }}
        bodyStyle={{ 
          height: 'calc(100vh - 110px)', 
          padding: 0,
          overflow: 'hidden'
        }}
        destroyOnClose={false}
      >
        <iframe
          src="https://stock.diedong.com/"
          style={{
            width: '166.67%',
            height: '166.67%',
            border: 'none',
            transform: 'scale()',
            transformOrigin: '0 0'
          }}
          title="市场热力 - 大盘云图全屏模式"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </Modal>
    </div>
  );
};

export default Home; 