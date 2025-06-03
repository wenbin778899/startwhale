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
  ExclamationCircleOutlined,
  PieChartOutlined,
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
import { getMarketIndexes, getMarketTrend, getRiskWarningStocks, getIndustryBoards } from '../../api/stock'; // 导入获取指数和风险警示板的API

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
  const [riskWarningStocks, setRiskWarningStocks] = useState([]);
  const [newsData, setNewsData] = useState([]);  // 新添加的新闻数据状态
  const [newsLoading, setNewsLoading] = useState(true);  // 新闻加载状态
  const [riskWarningLoading, setRiskWarningLoading] = useState(false); // 风险警示股票加载状态
  const [isHeatmapFullscreen, setIsHeatmapFullscreen] = useState(false); // 热力图全屏状态
  const [industryData, setIndustryData] = useState([]); // 行业板块数据
  const [industryLoading, setIndustryLoading] = useState(false); // 行业数据加载状态
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
    setShowCombined(!showCombined);
    if (!showCombined) {
      // 切换到组合视图时，获取所有三个指数的数据
      fetchCombinedTrendData(trendPeriod);
    }
  };

  // 处理指数切换
  const handleIndexChange = (indexCode) => {
    setCurrentIndex(indexCode);
    if (!showCombined) {
      fetchMarketTrend(indexCode, trendPeriod);
    }
  };

  // 处理时间区间切换
  const handlePeriodChange = (e) => {
    const newPeriod = e.target.value;
    setTrendPeriod(newPeriod);
    if (showCombined) {
      fetchCombinedTrendData(newPeriod);
    } else {
      fetchMarketTrend(currentIndex, newPeriod);
    }
  };

  // 手动刷新指数数据
  const handleRefreshIndexes = () => {
    setLoading(true);
    fetchMarketIndexes().finally(() => setLoading(false));
  };

  const fetchRiskWarningStocks = async (limit = 15) => {
    try {
      setRiskWarningLoading(true);
      console.log(`开始获取风险警示板数据: limit=${limit}`);
      const response = await getRiskWarningStocks(limit);
      
      if (response && response.code === 0 && response.data) {
        const stocksData = response.data.stocks || [];
        console.log(`成功获取${stocksData.length}只风险警示股票`);
        
        // 转换数据格式以适配表格
        const formattedStocks = stocksData.map((stock, index) => ({
          key: index,
          rank: stock.rank,
          code: stock.code,
          name: stock.name,
          price: stock.price,
          change_percent: stock.change_percent,
          change_amount: stock.change_amount,
          volume: stock.volume,
          turnover: stock.turnover,
          amplitude: stock.amplitude,
          pe_dynamic: stock.pe_dynamic,
          pb: stock.pb
        }));
        
        setRiskWarningStocks(formattedStocks);
        
        if (response.data.fallback) {
          message.info('使用备用风险警示数据');
        } else {
          message.success(`成功更新${stocksData.length}只风险警示股票`);
        }
      } else {
        console.error('获取风险警示数据失败:', response ? response.message : '未知错误');
        // 使用备用数据
        setRiskWarningStocks([
          { key: 0, rank: 1, code: '300313', name: '*ST天山', price: 7.61, change_percent: 10.45, change_amount: 0.72, volume: 245680000, turnover: 1863450000, amplitude: 11.96, pe_dynamic: -90.65, pb: 33.49 },
          { key: 1, rank: 2, code: '300167', name: 'ST迪威迅', price: 3.19, change_percent: 7.41, change_amount: 0.22, volume: 123450000, turnover: 393850000, amplitude: 9.31, pe_dynamic: -5.82, pb: 54.39 },
          { key: 2, rank: 3, code: '002569', name: 'ST步森', price: 6.90, change_percent: 5.02, change_amount: 0.33, volume: 87650000, turnover: 604550000, amplitude: 0.93, pe_dynamic: -27.27, pb: 7.05 },
          { key: 3, rank: 4, code: '000996', name: '*ST中期', price: 5.24, change_percent: 5.01, change_amount: 0.25, volume: 65430000, turnover: 342800000, amplitude: 4.47, pe_dynamic: 6823.87, pb: 3.73 },
          { key: 4, rank: 5, code: '600589', name: '*ST榕泰', price: 5.48, change_percent: 4.98, change_amount: 0.26, volume: 98760000, turnover: 540920000, amplitude: 4.07, pe_dynamic: -24.53, pb: -5.13 }
        ]);
        message.error('获取风险警示数据失败，使用备用数据');
      }
    } catch (error) {
      console.error('获取风险警示数据出错:', error);
      // 使用备用数据
      setRiskWarningStocks([
        { key: 0, rank: 1, code: '300313', name: '*ST天山', price: 7.61, change_percent: 10.45, change_amount: 0.72, volume: 245680000, turnover: 1863450000, amplitude: 11.96, pe_dynamic: -90.65, pb: 33.49 },
        { key: 1, rank: 2, code: '300167', name: 'ST迪威迅', price: 3.19, change_percent: 7.41, change_amount: 0.22, volume: 123450000, turnover: 393850000, amplitude: 9.31, pe_dynamic: -5.82, pb: 54.39 },
        { key: 2, rank: 3, code: '002569', name: 'ST步森', price: 6.90, change_percent: 5.02, change_amount: 0.33, volume: 87650000, turnover: 604550000, amplitude: 0.93, pe_dynamic: -27.27, pb: 7.05 },
        { key: 3, rank: 4, code: '000996', name: '*ST中期', price: 5.24, change_percent: 5.01, change_amount: 0.25, volume: 65430000, turnover: 342800000, amplitude: 4.47, pe_dynamic: 6823.87, pb: 3.73 },
        { key: 4, rank: 5, code: '600589', name: '*ST榕泰', price: 5.48, change_percent: 4.98, change_amount: 0.26, volume: 98760000, turnover: 540920000, amplitude: 4.07, pe_dynamic: -24.53, pb: -5.13 }
      ]);
      message.error('获取风险警示数据失败，使用备用数据');
    } finally {
      setRiskWarningLoading(false);
    }
  };

  // 获取行业板块数据
  const fetchIndustryBoards = async () => {
    try {
      setIndustryLoading(true);
      const response = await getIndustryBoards();
      
      if (response && response.code === 0) {
        console.log('获取到行业板块数据:', response.data);
        setIndustryData(response.data.industries || []);
        
        // 根据是否为备用数据显示不同的提示
        if (response.data.is_fallback) {
          message.warning(`数据获取异常，已显示示例数据 (${response.data.fallback_reason || '未知原因'})`);
        } else {
          message.success('行业数据更新成功');
        }
      } else {
        console.error('获取行业板块数据失败:', response ? response.message : '未知错误');
        // 使用更丰富的备用数据
        const fallbackData = [
          { name: '电子信息', change_percent: 3.45, market_value: 2850000000000, rank: 1 },
          { name: '生物医药', change_percent: 2.78, market_value: 1920000000000, rank: 2 },
          { name: '新能源', change_percent: 2.34, market_value: 1750000000000, rank: 3 },
          { name: '人工智能', change_percent: 1.89, market_value: 1450000000000, rank: 4 },
          { name: '半导体', change_percent: 1.67, market_value: 1320000000000, rank: 5 },
          { name: '新材料', change_percent: 1.23, market_value: 980000000000, rank: 6 },
          { name: '节能环保', change_percent: 0.98, market_value: 850000000000, rank: 7 },
          { name: '高端装备', change_percent: 0.76, market_value: 720000000000, rank: 8 },
          { name: '数字创意', change_percent: 0.45, market_value: 650000000000, rank: 9 },
          { name: '现代服务', change_percent: 0.23, market_value: 580000000000, rank: 10 }
        ];
        setIndustryData(fallbackData);
        message.warning('获取行业数据失败，已切换至示例数据');
      }
    } catch (error) {
      console.error('获取行业板块数据出错:', error);
      // 使用更丰富的备用数据
      const fallbackData = [
        { name: '电子信息', change_percent: 3.45, market_value: 2850000000000, rank: 1 },
        { name: '生物医药', change_percent: 2.78, market_value: 1920000000000, rank: 2 },
        { name: '新能源', change_percent: 2.34, market_value: 1750000000000, rank: 3 },
        { name: '人工智能', change_percent: 1.89, market_value: 1450000000000, rank: 4 },
        { name: '半导体', change_percent: 1.67, market_value: 1320000000000, rank: 5 },
        { name: '新材料', change_percent: 1.23, market_value: 980000000000, rank: 6 },
        { name: '节能环保', change_percent: 0.98, market_value: 850000000000, rank: 7 },
        { name: '高端装备', change_percent: 0.76, market_value: 720000000000, rank: 8 },
        { name: '数字创意', change_percent: 0.45, market_value: 650000000000, rank: 9 },
        { name: '现代服务', change_percent: 0.23, market_value: 580000000000, rank: 10 }
      ];
      setIndustryData(fallbackData);
      
      // 根据错误类型显示不同的提示
      if (error.message && error.message.includes('网络')) {
        message.error('网络连接失败，已显示示例数据');
      } else if (error.message && error.message.includes('timeout')) {
        message.error('请求超时，已显示示例数据');
      } else {
        message.warning('数据获取异常，已显示示例数据');
      }
    } finally {
      setIndustryLoading(false);
    }
  };

  // 获取行业分析饼图配置
  const getIndustryPieChartOption = () => {
    if (!industryData || industryData.length === 0) {
      return {
        title: {
          text: '暂无数据',
          left: 'center',
          top: 'middle'
        },
        series: []
      };
    }

    // 定义丰富的颜色数组
    const colorPalette = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b',
      '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e',
      '#e17055', '#00b894', '#00cec9', '#0984e3', '#6c5ce7',
      '#a29bfe', '#fd79a8', '#fdcb6e', '#e17055', '#00b894',
      '#74b9ff', '#81ecec', '#fab1a0', '#ff7675', '#fd79a8'
    ];

    // 准备饼图数据，按市值排序取前10个
    const pieData = industryData
      .sort((a, b) => b.market_value - a.market_value)
      .slice(0, 10)
      .map((item, index) => {
        // 根据涨跌幅调整颜色透明度
        const baseColor = colorPalette[index % colorPalette.length];
        let opacity = 0.8;
        
        // 涨幅越大，透明度越高（更鲜艳）
        if (item.change_percent > 3) {
          opacity = 1.0;
        } else if (item.change_percent > 1) {
          opacity = 0.9;
        } else if (item.change_percent > 0) {
          opacity = 0.8;
        } else if (item.change_percent > -1) {
          opacity = 0.7;
        } else {
          opacity = 0.6;
        }

        return {
          name: item.name,
          value: item.market_value,
          changePercent: item.change_percent,
          itemStyle: {
            color: baseColor,
            opacity: opacity,
            borderColor: '#fff',
            borderWidth: 1
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: baseColor + '80',
              borderWidth: 2,
              opacity: 1.0
            }
          }
        };
      });

    return {
      title: {
        text: '行业市值分布',
        subtext: 'TOP 10',
        left: 'center',
        top: 15,
        textStyle: {
          fontSize: 14,
          fontWeight: 'bold',
          color: '#2c3e50'
        },
        subtextStyle: {
          fontSize: 12,
          color: '#7f8c8d'
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(50,50,50,0.9)',
        borderColor: '#ddd',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 12
        },
        formatter: function(params) {
          const value = params.value;
          const changePercent = params.data.changePercent;
          const trendIcon = changePercent >= 0 ? '📈' : '📉';
          const marketValueYi = (value / 100000000).toFixed(0);
          
          return `<div style="padding: 6px;">
                    <div style="font-weight: bold; margin-bottom: 4px; color: #fff;">
                      ${trendIcon} ${params.name}
                    </div>
                    <div>市值: <span style="color: #74b9ff; font-weight: bold;">${marketValueYi}亿元</span></div>
                    <div>涨跌幅: <span style="color: ${changePercent >= 0 ? '#52c41a' : '#ff4d4f'}; font-weight: bold;">${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%</span></div>
                    <div>占比: <span style="color: #ffa940; font-weight: bold;">${params.percent.toFixed(1)}%</span></div>
                  </div>`;
        }
      },
      legend: {
        orient: 'vertical',
        left: 10,
        top: 80,
        bottom: 20,
        width: 120,
        textStyle: {
          fontSize: 10,
          color: '#2c3e50'
        },
        formatter: function(name) {
          const item = industryData.find(d => d.name === name);
          const changePercent = item ? item.change_percent : 0;
          const trendIcon = changePercent >= 0 ? '↗' : '↘';
          const shortName = name.length > 4 ? name.substring(0, 4) : name;
          return `${shortName} ${trendIcon}${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
        },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 6,
        icon: 'circle'
      },
      series: [
        {
          name: '行业市值',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['65%', '55%'],
          avoidLabelOverlap: true,
          data: pieData,
          animationType: 'scale',
          animationEasing: 'elasticOut',
          animationDelay: function (idx) {
            return idx * 100;
          },
          label: {
            show: true,
            position: 'outside',
            fontSize: 10,
            fontWeight: 'bold',
            color: '#2c3e50',
            formatter: function(params) {
              if (params.percent < 3) return ''; // 小于3%不显示标签，避免重叠
              const shortName = params.name.length > 3 ? params.name.substring(0, 3) : params.name;
              return `${shortName}\n${params.percent.toFixed(1)}%`;
            },
            distanceToLabelLine: 5
          },
          labelLine: {
            show: true,
            length: 8,
            length2: 5,
            smooth: false,
            lineStyle: {
              width: 1
            }
          },
          emphasis: {
            scale: true,
            scaleSize: 5
          }
        }
      ]
    };
  };

  // 模拟加载数据
  useEffect(() => {
    // 页面加载时获取所有数据
    fetchMarketIndexes();
    fetchNewsData();
    fetchRiskWarningStocks();  
    fetchIndustryBoards(); // 添加获取行业板块数据
    
    // 获取默认的走势数据
    fetchMarketTrend();
    fetchCombinedTrendData();

    // 模拟加载数据
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
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
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (rank) => <Text strong style={{ color: '#1890ff' }}>{rank}</Text>
    },
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
      width: 80,
      render: (code) => <Text type="secondary" style={{ fontSize: '12px' }}>{code}</Text>
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      render: (text) => (
        <Text strong style={{ 
          color: text.includes('ST') ? '#ff4d4f' : '#1890ff',
          fontSize: '13px'
        }}>
          {text}
        </Text>
      )
    },
    {
      title: '最新价',
      dataIndex: 'price',
      key: 'price',
      width: 70,
      render: (price) => (
        <Text style={{ fontSize: '12px', fontWeight: 'bold' }}>
          {price ? price.toFixed(2) : '-'}
        </Text>
      )
    },
    {
      title: '涨跌幅',
      dataIndex: 'change_percent',
      key: 'change_percent',
      width: 80,
      render: (changePercent) => (
        <Tag color={changePercent > 0 ? 'red' : changePercent < 0 ? 'green' : 'default'} size="small">
          {changePercent ? `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%` : '-'}
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

      {/* 市场资讯、热门股票和行业分析 */}
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
                      <Space size="small" key="meta">
                        <Tag color="blue" style={{ fontSize: '11px', margin: 0 }}>
                          {news.source || '东方财富'}
                        </Tag>
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
                <ExclamationCircleOutlined /> 风险警示 <Text type="secondary" style={{fontSize: '12px'}}>(东方财富)</Text>
              </div>
            }
            extra={
              <Button 
                type="link" 
                icon={<ReloadOutlined spin={riskWarningLoading} />}
                onClick={() => fetchRiskWarningStocks()}
                disabled={riskWarningLoading}
              >
                刷新
              </Button>
            }
            style={{ height: '500px' }}
            bodyStyle={{ height: '440px', overflowY: 'auto', padding: '16px' }}
          >
            <Skeleton loading={riskWarningLoading || loading} active>
              <Table
                dataSource={riskWarningStocks}
                columns={stockColumns}
                rowKey="key"
                pagination={{
                  pageSize: 6,
                  showSizeChanger: false,
                  showTotal: (total) => `共 ${total} 只风险警示股票`,
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
                <PieChartOutlined /> 行业分析 
                <Text type="secondary" style={{fontSize: '12px', marginLeft: '4px'}}>
                  {industryData.length > 0 && industryData[0].rank ? '(示例数据)' : '(东方财富)'}
                </Text>
              </div>
            }
            extra={
              <Space>
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => navigate('/industry')}
                  style={{ fontSize: '12px' }}
                >
                  查看详情
                </Button>
                <Button 
                  type="link" 
                  icon={<ReloadOutlined spin={industryLoading} />}
                  onClick={() => fetchIndustryBoards()}
                  disabled={industryLoading}
                >
                  {industryLoading ? '获取中' : '刷新'}
                </Button>
              </Space>
            }
            style={{ height: '500px' }}
            bodyStyle={{ height: '440px', padding: '8px' }}
          >
            <Skeleton loading={industryLoading || loading} active>
              <ReactECharts
                option={getIndustryPieChartOption()}
                style={{ height: '400px', width: '100%' }}
                className="echarts-for-react"
                notMerge={true}
                lazyUpdate={true}
              />
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {industryData.length > 0 && industryData[0].rank ? 
                    '* 当前显示示例数据，点击刷新获取实时数据' : 
                    '* 数据来源：东方财富行业板块'
                  }
                </Text>
              </div>
            </Skeleton>
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