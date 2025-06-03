import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Table, 
  Space, 
  Button, 
  Select, 
  Tag, 
  Typography, 
  Statistic, 
  Spin, 
  message, 
  Tooltip,
  Radio,
  Progress,
  Divider,
  Switch,
  Tabs
} from 'antd';
import {
  ReloadOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  FireOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  StarOutlined,
  TableOutlined,
  DashboardOutlined,
  RadarChartOutlined,
  HeatMapOutlined,
  FundOutlined,
  NodeIndexOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { getIndustryBoards } from '../../api/stock';
import './IndustryAnalysis.css';

const { Title, Text } = Typography;
const { Option } = Select;

const IndustryAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [industryData, setIndustryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [sortField, setSortField] = useState('market_value');
  const [sortOrder, setSortOrder] = useState('desc');
  const [chartType, setChartType] = useState('pie');
  const [dataSource, setDataSource] = useState('realtime'); // realtime or fallback
  const [autoRefresh, setAutoRefresh] = useState(false); // 自动刷新开关
  const [refreshInterval, setRefreshInterval] = useState(null); // 刷新定时器

  // 自动刷新功能
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchIndustryData();
      }, 30000); // 30秒刷新一次
      setRefreshInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh]);

  // 处理自动刷新切换
  const handleAutoRefreshChange = (checked) => {
    setAutoRefresh(checked);
    if (checked) {
      message.success('已开启自动刷新（30秒间隔）');
    } else {
      message.info('已关闭自动刷新');
    }
  };

  // 获取行业板块数据
  const fetchIndustryData = async () => {
    try {
      setLoading(true);
      const response = await getIndustryBoards();
      
      if (response && response.code === 0) {
        console.log('获取到行业板块数据:', response.data);
        setIndustryData(response.data.industries || []);
        setFilteredData(response.data.industries || []);
        setDataSource(response.data.is_fallback ? 'fallback' : 'realtime');
        
        if (response.data.is_fallback) {
          message.warning(`数据获取异常，已显示示例数据 (${response.data.fallback_reason || '未知原因'})`);
        } else {
          message.success('行业数据更新成功');
        }
      } else {
        console.error('获取行业板块数据失败:', response ? response.message : '未知错误');
        // 使用更丰富的备用数据
        const fallbackData = [
          { name: '电子信息', change_percent: 3.45, market_value: 2850000000000, rank: 1, price: 156.78, change_amount: 5.23, turnover_rate: 3.2, rising_count: 156, falling_count: 34, leading_stock: '宁德时代', leading_stock_change: 5.67 },
          { name: '生物医药', change_percent: 2.78, market_value: 1920000000000, rank: 2, price: 89.45, change_amount: 2.42, turnover_rate: 2.8, rising_count: 112, falling_count: 23, leading_stock: '药明康德', leading_stock_change: 4.23 },
          { name: '新能源', change_percent: 2.34, market_value: 1750000000000, rank: 3, price: 234.12, change_amount: 5.35, turnover_rate: 4.1, rising_count: 89, falling_count: 18, leading_stock: '比亚迪', leading_stock_change: 6.78 },
          { name: '人工智能', change_percent: 1.89, market_value: 1450000000000, rank: 4, price: 298.67, change_amount: 5.54, turnover_rate: 5.2, rising_count: 67, falling_count: 12, leading_stock: '科大讯飞', leading_stock_change: 3.89 },
          { name: '半导体', change_percent: 1.67, market_value: 1320000000000, rank: 5, price: 187.23, change_amount: 3.08, turnover_rate: 3.8, rising_count: 78, falling_count: 15, leading_stock: '中芯国际', leading_stock_change: 4.12 },
          { name: '新材料', change_percent: 1.23, market_value: 980000000000, rank: 6, price: 123.45, change_amount: 1.49, turnover_rate: 2.5, rising_count: 56, falling_count: 9, leading_stock: '隆基绿能', leading_stock_change: 2.34 },
          { name: '节能环保', change_percent: 0.98, market_value: 850000000000, rank: 7, price: 98.76, change_amount: 0.95, turnover_rate: 1.9, rising_count: 45, falling_count: 8, leading_stock: '先导智能', leading_stock_change: 1.78 },
          { name: '高端装备', change_percent: 0.76, market_value: 720000000000, rank: 8, price: 167.89, change_amount: 1.26, turnover_rate: 2.1, rising_count: 38, falling_count: 7, leading_stock: '海康威视', leading_stock_change: 1.45 },
          { name: '数字创意', change_percent: 0.45, market_value: 650000000000, rank: 9, price: 145.67, change_amount: 0.65, turnover_rate: 1.7, rising_count: 32, falling_count: 6, leading_stock: '华为概念', leading_stock_change: 0.89 },
          { name: '现代服务', change_percent: 0.23, market_value: 580000000000, rank: 10, price: 76.54, change_amount: 0.17, turnover_rate: 1.2, rising_count: 28, falling_count: 5, leading_stock: '美团', leading_stock_change: 0.56 },
          { name: '汽车制造', change_percent: -0.12, market_value: 540000000000, rank: 11, price: 134.28, change_amount: -0.16, turnover_rate: 1.8, rising_count: 23, falling_count: 12, leading_stock: '特斯拉概念', leading_stock_change: -0.23 },
          { name: '食品饮料', change_percent: -0.34, market_value: 480000000000, rank: 12, price: 89.45, change_amount: -0.31, turnover_rate: 1.1, rising_count: 18, falling_count: 15, leading_stock: '贵州茅台', leading_stock_change: -0.45 },
          { name: '房地产', change_percent: -0.78, market_value: 420000000000, rank: 13, price: 56.78, change_amount: -0.45, turnover_rate: 0.8, rising_count: 12, falling_count: 28, leading_stock: '万科A', leading_stock_change: -1.23 },
          { name: '银行', change_percent: -1.23, market_value: 380000000000, rank: 14, price: 5.67, change_amount: -0.07, turnover_rate: 0.5, rising_count: 8, falling_count: 36, leading_stock: '招商银行', leading_stock_change: -1.67 },
          { name: '钢铁', change_percent: -1.67, market_value: 320000000000, rank: 15, price: 8.45, change_amount: -0.14, turnover_rate: 1.3, rising_count: 5, falling_count: 42, leading_stock: '宝钢股份', leading_stock_change: -2.34 }
        ];
        setIndustryData(fallbackData);
        setFilteredData(fallbackData);
        setDataSource('fallback');
        message.error('获取行业数据失败，已显示示例数据');
      }
    } catch (error) {
      console.error('获取行业板块数据出错:', error);
      // 使用更丰富的备用数据
      const fallbackData = [
        { name: '电子信息', change_percent: 3.45, market_value: 2850000000000, rank: 1, price: 156.78, change_amount: 5.23, turnover_rate: 3.2, rising_count: 156, falling_count: 34, leading_stock: '宁德时代', leading_stock_change: 5.67 },
        { name: '生物医药', change_percent: 2.78, market_value: 1920000000000, rank: 2, price: 89.45, change_amount: 2.42, turnover_rate: 2.8, rising_count: 112, falling_count: 23, leading_stock: '药明康德', leading_stock_change: 4.23 },
        { name: '新能源', change_percent: 2.34, market_value: 1750000000000, rank: 3, price: 234.12, change_amount: 5.35, turnover_rate: 4.1, rising_count: 89, falling_count: 18, leading_stock: '比亚迪', leading_stock_change: 6.78 },
        { name: '人工智能', change_percent: 1.89, market_value: 1450000000000, rank: 4, price: 298.67, change_amount: 5.54, turnover_rate: 5.2, rising_count: 67, falling_count: 12, leading_stock: '科大讯飞', leading_stock_change: 3.89 },
        { name: '半导体', change_percent: 1.67, market_value: 1320000000000, rank: 5, price: 187.23, change_amount: 3.08, turnover_rate: 3.8, rising_count: 78, falling_count: 15, leading_stock: '中芯国际', leading_stock_change: 4.12 },
        { name: '新材料', change_percent: 1.23, market_value: 980000000000, rank: 6, price: 123.45, change_amount: 1.49, turnover_rate: 2.5, rising_count: 56, falling_count: 9, leading_stock: '隆基绿能', leading_stock_change: 2.34 },
        { name: '节能环保', change_percent: 0.98, market_value: 850000000000, rank: 7, price: 98.76, change_amount: 0.95, turnover_rate: 1.9, rising_count: 45, falling_count: 8, leading_stock: '先导智能', leading_stock_change: 1.78 },
        { name: '高端装备', change_percent: 0.76, market_value: 720000000000, rank: 8, price: 167.89, change_amount: 1.26, turnover_rate: 2.1, rising_count: 38, falling_count: 7, leading_stock: '海康威视', leading_stock_change: 1.45 },
        { name: '数字创意', change_percent: 0.45, market_value: 650000000000, rank: 9, price: 145.67, change_amount: 0.65, turnover_rate: 1.7, rising_count: 32, falling_count: 6, leading_stock: '华为概念', leading_stock_change: 0.89 },
        { name: '现代服务', change_percent: 0.23, market_value: 580000000000, rank: 10, price: 76.54, change_amount: 0.17, turnover_rate: 1.2, rising_count: 28, falling_count: 5, leading_stock: '美团', leading_stock_change: 0.56 },
        { name: '汽车制造', change_percent: -0.12, market_value: 540000000000, rank: 11, price: 134.28, change_amount: -0.16, turnover_rate: 1.8, rising_count: 23, falling_count: 12, leading_stock: '特斯拉概念', leading_stock_change: -0.23 },
        { name: '食品饮料', change_percent: -0.34, market_value: 480000000000, rank: 12, price: 89.45, change_amount: -0.31, turnover_rate: 1.1, rising_count: 18, falling_count: 15, leading_stock: '贵州茅台', leading_stock_change: -0.45 },
        { name: '房地产', change_percent: -0.78, market_value: 420000000000, rank: 13, price: 56.78, change_amount: -0.45, turnover_rate: 0.8, rising_count: 12, falling_count: 28, leading_stock: '万科A', leading_stock_change: -1.23 },
        { name: '银行', change_percent: -1.23, market_value: 380000000000, rank: 14, price: 5.67, change_amount: -0.07, turnover_rate: 0.5, rising_count: 8, falling_count: 36, leading_stock: '招商银行', leading_stock_change: -1.67 },
        { name: '钢铁', change_percent: -1.67, market_value: 320000000000, rank: 15, price: 8.45, change_amount: -0.14, turnover_rate: 1.3, rising_count: 5, falling_count: 42, leading_stock: '宝钢股份', leading_stock_change: -2.34 }
      ];
      setIndustryData(fallbackData);
      setFilteredData(fallbackData);
      setDataSource('fallback');
      
      // 根据错误类型显示不同的提示
      if (error.message && error.message.includes('网络')) {
        message.error('网络连接失败，已显示示例数据');
      } else if (error.message && error.message.includes('timeout')) {
        message.error('请求超时，已显示示例数据');
      } else {
        message.warning('数据获取异常，已显示示例数据');
      }
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchIndustryData();
  }, []);

  // 处理排序
  const handleSort = (field, order) => {
    setSortField(field);
    setSortOrder(order);
    filterData(field, order);
  };

  // 数据过滤和排序
  const filterData = (field, order) => {
    let filtered = [...industryData];
    
    // 排序
    filtered.sort((a, b) => {
      let aVal = a[field] || 0;
      let bVal = b[field] || 0;
      
      if (order === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });
    
    setFilteredData(filtered);
  };

  // 获取统计数据
  const getStatistics = () => {
    if (!filteredData.length) return { total: 0, rising: 0, falling: 0, avgChange: 0 };
    
    const rising = filteredData.filter(item => item.change_percent > 0).length;
    const falling = filteredData.filter(item => item.change_percent < 0).length;
    const avgChange = filteredData.reduce((sum, item) => sum + item.change_percent, 0) / filteredData.length;
    
    return {
      total: filteredData.length,
      rising,
      falling,
      avgChange
    };
  };

  // 饼图配置
  const getPieChartOption = () => {
    const topData = filteredData.slice(0, 15);
    const colorPalette = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4ecdc4',
      '#45b7d1', '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3',
      '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#10ac84'
    ];

    const pieData = topData.map((item, index) => ({
      name: item.name,
      value: item.market_value,
      changePercent: item.change_percent,
      itemStyle: {
        color: colorPalette[index % colorPalette.length],
        borderWidth: 2,
        borderColor: '#fff',
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.1)'
      }
    }));

    return {
      title: {
        text: '行业市值分布',
        subtext: `TOP ${topData.length} 行业`,
        left: 'center',
        top: 30,
        textStyle: { 
          fontSize: 20, 
          fontWeight: '600',
          color: '#1e293b',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        subtextStyle: {
          fontSize: 16,
          color: '#64748b',
          fontWeight: '500'
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: {
          color: '#1e293b',
          fontSize: 13
        },
        formatter: (params) => {
          const value = params.value;
          const changePercent = params.data.changePercent;
          const changeIcon = changePercent >= 0 ? '📈' : '📉';
          const changeColor = changePercent >= 0 ? '#dc2626' : '#16a34a';
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">${params.name}</div>
              <div style="margin-bottom: 4px;">💰 市值: <span style="font-weight: 600;">${(value / 100000000).toFixed(0)}亿元</span></div>
              <div style="margin-bottom: 4px;">${changeIcon} 涨跌幅: <span style="color: ${changeColor}; font-weight: 600;">${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%</span></div>
              <div>📊 占比: <span style="font-weight: 600;">${params.percent.toFixed(1)}%</span></div>
            </div>
          `;
        }
      },
      legend: {
        orient: 'vertical',
        left: 20,
        top: 'middle',
        textStyle: { 
          fontSize: 13,
          color: '#475569',
          fontWeight: '500'
        },
        itemWidth: 16,
        itemHeight: 16,
        itemGap: 14
      },
      series: [{
        name: '行业市值',
        type: 'pie',
        radius: ['35%', '75%'],
        center: ['65%', '55%'],
        data: pieData,
        roseType: 'area',
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: function (idx) {
          return Math.random() * 200;
        },
        label: {
          show: true,
          position: 'outside',
          fontSize: 12,
          fontWeight: '600',
          color: '#475569',
          formatter: '{b}\n{d}%'
        },
        labelLine: {
          show: true,
          length: 18,
          length2: 12,
          smooth: true
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          },
          label: {
            fontSize: 14,
            fontWeight: '700'
          }
        }
      }]
    };
  };

  // 散点图配置
  const getScatterChartOption = () => {
    const scatterData = filteredData.map(item => [
      item.market_value / 100000000, // 市值（亿元）
      item.change_percent, // 涨跌幅
      item.name,
      item.turnover_rate || 0 // 换手率用于设置点的大小
    ]);

    return {
      title: {
        text: '市值 vs 涨跌幅关系分析',
        subtext: '气泡大小表示换手率高低',
        left: 'center',
        top: 20,
        textStyle: { 
          fontSize: 20, 
          fontWeight: '600',
          color: '#1e293b',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        subtextStyle: {
          fontSize: 16,
          color: '#64748b',
          fontWeight: '500'
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: {
          color: '#1e293b',
          fontSize: 13
        },
        formatter: (params) => {
          const data = params.data;
          const changeIcon = data[1] >= 0 ? '📈' : '📉';
          const changeColor = data[1] >= 0 ? '#dc2626' : '#16a34a';
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">${data[2]}</div>
              <div style="margin-bottom: 4px;">💰 市值: <span style="font-weight: 600;">${data[0].toFixed(0)}亿元</span></div>
              <div style="margin-bottom: 4px;">${changeIcon} 涨跌幅: <span style="color: ${changeColor}; font-weight: 600;">${data[1] >= 0 ? '+' : ''}${data[1].toFixed(2)}%</span></div>
              <div>🔄 换手率: <span style="font-weight: 600;">${data[3].toFixed(2)}%</span></div>
            </div>
          `;
        }
      },
      grid: {
        left: '12%',
        right: '12%',
        bottom: '15%',
        top: '25%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '市值（亿元）',
        nameLocation: 'middle',
        nameGap: 35,
        nameTextStyle: {
          fontSize: 14,
          fontWeight: '600',
          color: '#475569'
        },
        scale: true,
        axisLabel: {
          formatter: '{value}',
          fontSize: 12,
          color: '#64748b'
        },
        axisLine: {
          lineStyle: {
            color: '#e2e8f0',
            width: 2
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '涨跌幅（%）',
        nameLocation: 'middle',
        nameGap: 55,
        nameTextStyle: {
          fontSize: 14,
          fontWeight: '600',
          color: '#475569'
        },
        axisLabel: {
          formatter: '{value}%',
          fontSize: 12,
          color: '#64748b'
        },
        axisLine: {
          lineStyle: {
            color: '#e2e8f0',
            width: 2
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
            type: 'dashed'
          }
        }
      },
      series: [{
        name: '行业',
        type: 'scatter',
        data: scatterData,
        symbolSize: function (data) {
          // 根据换手率设置气泡大小，最小15，最大55
          return Math.max(15, Math.min(55, data[3] * 7 + 10));
        },
        itemStyle: {
          color: function(params) {
            // 根据涨跌幅设置颜色 - 红涨绿跌
            if (params.data[1] >= 2) return '#dc2626'; // 大涨 - 深红
            if (params.data[1] >= 0) return '#ef4444'; // 上涨 - 红色
            if (params.data[1] >= -2) return '#16a34a'; // 小跌 - 绿色
            return '#15803d'; // 大跌 - 深绿
          },
          opacity: 0.8,
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 8,
          shadowColor: 'rgba(0, 0, 0, 0.1)'
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
            shadowBlur: 15,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            borderWidth: 3
          }
        },
        animationDelay: function (idx) {
          return idx * 50;
        }
      }]
    };
  };

  // 柱状图配置
  const getBarChartOption = () => {
    const topData = filteredData.slice(0, 15);
    
    return {
      title: {
        text: '行业涨跌幅排行榜',
        subtext: `TOP ${topData.length} 行业表现`,
        left: 'center',
        top: 20,
        textStyle: { 
          fontSize: 20, 
          fontWeight: '600',
          color: '#1e293b',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        subtextStyle: {
          fontSize: 16,
          color: '#64748b',
          fontWeight: '500'
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: {
          color: '#1e293b',
          fontSize: 13
        },
        formatter: (params) => {
          const item = params[0];
          const changeIcon = item.value >= 0 ? '📈' : '📉';
          const changeColor = item.value >= 0 ? '#dc2626' : '#16a34a';
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">${item.name}</div>
              <div>${changeIcon} 涨跌幅: <span style="color: ${changeColor}; font-weight: 600;">${item.value >= 0 ? '+' : ''}${item.value.toFixed(2)}%</span></div>
            </div>
          `;
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '15%',
        top: '25%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: topData.map(item => item.name),
        axisLabel: {
          rotate: 45,
          interval: 0,
          fontSize: 11,
          color: '#64748b',
          fontWeight: '500'
        },
        axisLine: {
          lineStyle: {
            color: '#e2e8f0',
            width: 2
          }
        },
        axisTick: {
          alignWithLabel: true,
          lineStyle: {
            color: '#e2e8f0'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '涨跌幅(%)',
        nameTextStyle: {
          fontSize: 14,
          fontWeight: '600',
          color: '#475569'
        },
        axisLabel: {
          formatter: '{value}%',
          fontSize: 12,
          color: '#64748b'
        },
        axisLine: {
          lineStyle: {
            color: '#e2e8f0',
            width: 2
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
            type: 'dashed'
          }
        }
      },
      series: [{
        name: '涨跌幅',
        type: 'bar',
        data: topData.map(item => ({
          value: item.change_percent,
          itemStyle: {
            color: item.change_percent >= 0 ? 
              new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {offset: 0, color: '#dc2626'},
                {offset: 1, color: '#991b1b'}
              ]) :
              new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {offset: 0, color: '#16a34a'},
                {offset: 1, color: '#15803d'}
              ]),
            borderRadius: [4, 4, 0, 0],
            shadowBlur: 8,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowOffsetY: 2
          }
        })),
        barWidth: '60%',
        label: {
          show: true,
          position: item => item.value >= 0 ? 'top' : 'bottom',
          fontSize: 11,
          fontWeight: '600',
          color: '#475569',
          formatter: (params) => `${params.value >= 0 ? '+' : ''}${params.value.toFixed(2)}%`
        },
        animationDelay: function (idx) {
          return idx * 100;
        },
        animationEasing: 'elasticOut'
      }]
    };
  };

  // 折线图配置 - 行业表现趋势
  const getLineChartOption = () => {
    const topData = filteredData.slice(0, 10);
    
    return {
      title: {
        text: '行业表现趋势分析',
        subtext: '模拟近期走势数据',
        left: 'center',
        top: 20,
        textStyle: { 
          fontSize: 20, 
          fontWeight: '600',
          color: '#1e293b',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        subtextStyle: {
          fontSize: 16,
          color: '#64748b',
          fontWeight: '500'
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: {
          color: '#1e293b',
          fontSize: 13
        }
      },
      legend: {
        top: '15%',
        left: 'center',
        data: topData.map(item => item.name),
        textStyle: {
          fontSize: 12,
          color: '#475569'
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '15%',
        top: '30%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['5日前', '4日前', '3日前', '2日前', '1日前', '今日'],
        axisLabel: {
          fontSize: 12,
          color: '#64748b'
        },
        axisLine: {
          lineStyle: {
            color: '#e2e8f0',
            width: 2
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '涨跌幅(%)',
        nameTextStyle: {
          fontSize: 14,
          fontWeight: '600',
          color: '#475569'
        },
        axisLabel: {
          formatter: '{value}%',
          fontSize: 12,
          color: '#64748b'
        },
        splitLine: {
          lineStyle: {
            color: '#f1f5f9',
            type: 'dashed'
          }
        }
      },
      series: topData.map((item, index) => ({
        name: item.name,
        type: 'line',
        data: Array.from({length: 6}, () => 
          item.change_percent + (Math.random() - 0.5) * 4
        ),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: `hsl(${index * 36}, 70%, 50%)`
        },
        itemStyle: {
          color: `hsl(${index * 36}, 70%, 50%)`,
          borderColor: '#fff',
          borderWidth: 2
        },
        emphasis: {
          itemStyle: {
            symbolSize: 10
          }
        }
      }))
    };
  };

  // 雷达图配置 - 多维度分析
  const getRadarChartOption = () => {
    const topData = filteredData.slice(0, 6);
    
    return {
      title: {
        text: '行业多维度对比分析',
        subtext: '综合评估各行业表现',
        left: 'center',
        top: 20,
        textStyle: { 
          fontSize: 20, 
          fontWeight: '600',
          color: '#1e293b',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        subtextStyle: {
          fontSize: 16,
          color: '#64748b',
          fontWeight: '500'
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: {
          color: '#1e293b',
          fontSize: 13
        }
      },
      legend: {
        bottom: 20,
        left: 'center',
        data: topData.map(item => item.name),
        textStyle: {
          fontSize: 12,
          color: '#475569'
        }
      },
      radar: {
        center: ['50%', '55%'],
        radius: '70%',
        indicator: [
          { name: '涨跌幅', max: 5, color: '#475569' },
          { name: '市值规模', max: 100, color: '#475569' },
          { name: '换手率', max: 10, color: '#475569' },
          { name: '活跃度', max: 100, color: '#475569' },
          { name: '成长性', max: 100, color: '#475569' },
          { name: '稳定性', max: 100, color: '#475569' }
        ],
        name: {
          textStyle: {
            fontSize: 14,
            fontWeight: '600',
            color: '#1e293b'
          }
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(102, 126, 234, 0.05)', 'rgba(118, 75, 162, 0.05)']
          }
        },
        axisLine: {
          lineStyle: {
            color: '#e2e8f0'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#e2e8f0'
          }
        }
      },
      series: [{
        name: '行业指标',
        type: 'radar',
        data: topData.map((item, index) => ({
          value: [
            Math.max(0, item.change_percent),
            (item.market_value / 100000000000) * 10,
            item.turnover_rate || 0,
            Math.random() * 80 + 20,
            Math.random() * 80 + 20,
            Math.random() * 80 + 20
          ],
          name: item.name,
          itemStyle: {
            color: `hsla(${index * 60}, 70%, 50%, 0.8)`
          },
          lineStyle: {
            width: 2,
            color: `hsl(${index * 60}, 70%, 50%)`
          },
          areaStyle: {
            opacity: 0.3,
            color: `hsl(${index * 60}, 70%, 50%)`
          }
        }))
      }]
    };
  };

  // 热力图配置 - 行业表现矩阵
  const getHeatmapChartOption = () => {
    const data = filteredData.slice(0, 15);
    const categories = ['涨跌幅', '市值', '换手率', '活跃度'];
    
    const heatmapData = [];
    data.forEach((item, i) => {
      categories.forEach((cat, j) => {
        let value;
        switch(j) {
          case 0: value = item.change_percent; break;
          case 1: value = Math.log10(item.market_value / 100000000); break;
          case 2: value = item.turnover_rate || 0; break;
          default: value = Math.random() * 10;
        }
        heatmapData.push([j, i, Math.round(value * 100) / 100]);
      });
    });

    return {
      title: {
        text: '行业表现热力图',
        subtext: '多维度数据可视化矩阵',
        left: 'center',
        top: 20,
        textStyle: { 
          fontSize: 20, 
          fontWeight: '600',
          color: '#1e293b',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        subtextStyle: {
          fontSize: 16,
          color: '#64748b',
          fontWeight: '500'
        }
      },
      tooltip: {
        position: 'top',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: {
          color: '#1e293b',
          fontSize: 13
        },
        formatter: function (params) {
          return `${data[params.data[1]]?.name}<br/>
                  ${categories[params.data[0]]}: ${params.data[2]}`;
        }
      },
      grid: {
        height: '60%',
        top: '25%',
        left: '15%',
        right: '5%'
      },
      xAxis: {
        type: 'category',
        data: categories,
        splitArea: {
          show: true
        },
        axisLabel: {
          fontSize: 12,
          color: '#64748b',
          fontWeight: '600'
        }
      },
      yAxis: {
        type: 'category',
        data: data.map(item => item.name),
        splitArea: {
          show: true
        },
        axisLabel: {
          fontSize: 11,
          color: '#64748b'
        }
      },
      visualMap: {
        min: -5,
        max: 5,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        inRange: {
          color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', 
                 '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
        },
        textStyle: {
          color: '#64748b'
        }
      },
      series: [{
        name: '数值',
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: true,
          fontSize: 10,
          color: '#fff',
          fontWeight: '600'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  };

  // 仪表盘配置 - 市场综合指数
  const getGaugeChartOption = () => {
    const statistics = getStatistics();
    const marketIndex = Math.round((statistics.avgChange + 5) * 10); // 转换为0-100的指数
    
    return {
      title: {
        text: '市场综合表现指数',
        subtext: '基于行业平均表现计算',
        left: 'center',
        top: 20,
        textStyle: { 
          fontSize: 20, 
          fontWeight: '600',
          color: '#1e293b',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        subtextStyle: {
          fontSize: 16,
          color: '#64748b',
          fontWeight: '500'
        }
      },
      series: [
        {
          name: '市场指数',
          type: 'gauge',
          center: ['50%', '60%'],
          radius: '80%',
          min: 0,
          max: 100,
          splitNumber: 10,
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [0.3, '#ef4444'],
                [0.7, '#f59e0b'],
                [1, '#10b981']
              ]
            }
          },
          pointer: {
            itemStyle: {
              color: '#667eea',
              shadowBlur: 10,
              shadowColor: 'rgba(102, 126, 234, 0.5)'
            }
          },
          axisTick: {
            distance: -20,
            length: 8,
            lineStyle: {
              color: '#fff',
              width: 2
            }
          },
          splitLine: {
            distance: -20,
            length: 15,
            lineStyle: {
              color: '#fff',
              width: 4
            }
          },
          axisLabel: {
            color: '#64748b',
            fontSize: 12,
            distance: -50,
            fontWeight: '600'
          },
          detail: {
            valueAnimation: true,
            formatter: '{value}',
            color: '#1e293b',
            fontSize: 28,
            fontWeight: '700',
            offsetCenter: [0, '70%']
          },
          data: [
            {
              value: marketIndex,
              name: '市场指数'
            }
          ]
        },
        // 添加小仪表盘
        {
          name: '上涨比例',
          type: 'gauge',
          center: ['25%', '85%'],
          radius: '25%',
          min: 0,
          max: 100,
          axisLine: {
            lineStyle: {
              width: 8,
              color: [
                [statistics.rising / statistics.total, '#dc2626'],
                [1, '#e5e7eb']
              ]
            }
          },
          pointer: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          },
          axisLabel: {
            show: false
          },
          detail: {
            formatter: '上涨\n{value}%',
            color: '#dc2626',
            fontSize: 14,
            fontWeight: '600',
            lineHeight: 20,
            offsetCenter: [0, 0]
          },
          data: [
            {
              value: Math.round((statistics.rising / statistics.total) * 100)
            }
          ]
        },
        {
          name: '下跌比例',
          type: 'gauge',
          center: ['75%', '85%'],
          radius: '25%',
          min: 0,
          max: 100,
          axisLine: {
            lineStyle: {
              width: 8,
              color: [
                [statistics.falling / statistics.total, '#16a34a'],
                [1, '#e5e7eb']
              ]
            }
          },
          pointer: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: false
          },
          axisLabel: {
            show: false
          },
          detail: {
            formatter: '下跌\n{value}%',
            color: '#16a34a',
            fontSize: 14,
            fontWeight: '600',
            lineHeight: 20,
            offsetCenter: [0, 0]
          },
          data: [
            {
              value: Math.round((statistics.falling / statistics.total) * 100)
            }
          ]
        }
      ]
    };
  };

  // 树状图配置 - 行业层次结构
  const getTreemapChartOption = () => {
    const data = filteredData.slice(0, 20);
    
    const treemapData = data.map(item => ({
      name: item.name,
      value: item.market_value / 100000000,
      itemStyle: {
        color: item.change_percent >= 0 ? 
          `rgba(220, 38, 38, ${0.3 + (item.change_percent / 10) * 0.7})` : 
          `rgba(22, 163, 74, ${0.3 + (Math.abs(item.change_percent) / 10) * 0.7})`,
        borderColor: item.change_percent >= 0 ? '#dc2626' : '#16a34a',
        borderWidth: 2
      },
      label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1e293b'
      }
    }));

    return {
      title: {
        text: '行业市值树状图',
        subtext: '面积大小代表市值，颜色深浅代表涨跌幅',
        left: 'center',
        top: 20,
        textStyle: { 
          fontSize: 20, 
          fontWeight: '600',
          color: '#1e293b',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        subtextStyle: {
          fontSize: 16,
          color: '#64748b',
          fontWeight: '500'
        }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: {
          color: '#1e293b',
          fontSize: 13
        },
        formatter: function (info) {
          const item = data.find(d => d.name === info.name);
          const changeIcon = item?.change_percent >= 0 ? '📈' : '📉';
          const changeColor = item?.change_percent >= 0 ? '#dc2626' : '#16a34a';
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">${info.name}</div>
              <div style="margin-bottom: 4px;">💰 市值: <span style="font-weight: 600;">${info.value}亿元</span></div>
              <div>${changeIcon} 涨跌幅: <span style="color: ${changeColor}; font-weight: 600;">${item?.change_percent >= 0 ? '+' : ''}${item?.change_percent?.toFixed(2) || '0.00'}%</span></div>
            </div>
          `;
        }
      },
      series: [{
        name: '行业市值',
        type: 'treemap',
        top: '15%',
        left: '3%',
        bottom: '3%',
        right: '3%',
        roam: false,
        nodeClick: false,
        data: treemapData,
        breadcrumb: {
          show: false
        },
        label: {
          show: true,
          position: 'inside',
          formatter: function(params) {
            return `${params.name}\n${params.value}亿`;
          }
        },
        upperLabel: {
          show: true,
          height: 30
        }
      }]
    };
  };

  // 表格列定义
  const tableColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (rank, record, index) => (
        <div style={{ textAlign: 'center' }}>
          {index < 3 ? (
            <CrownOutlined 
              className={
                index === 0 ? 'crown-gold' : 
                index === 1 ? 'crown-silver' : 
                'crown-bronze'
              }
              style={{ fontSize: 18 }} 
            />
          ) : (
            <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#64748b' }}>{index + 1}</span>
          )}
        </div>
      )
    },
    {
      title: '行业名称',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <Text strong style={{ fontSize: '14px', color: '#1e293b' }}>{name}</Text>
          {record.code && <Text type="secondary" style={{fontSize: '12px'}}>({record.code})</Text>}
        </Space>
      )
    },
    {
      title: '最新价',
      dataIndex: 'price',
      key: 'price',
      sorter: true,
      render: (price) => <Text style={{ fontWeight: '600' }}>{price ? price.toFixed(2) : '-'}</Text>
    },
    {
      title: '涨跌额',
      dataIndex: 'change_amount',
      key: 'change_amount',
      sorter: true,
      render: (amount) => (
        <Text style={{ 
          color: amount >= 0 ? '#dc2626' : '#16a34a',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          {amount >= 0 ? '+' : ''}{amount ? amount.toFixed(2) : '0.00'}
        </Text>
      )
    },
    {
      title: '涨跌幅',
      dataIndex: 'change_percent',
      key: 'change_percent',
      sorter: true,
      render: (percent) => (
        <Tag 
          color={percent >= 0 ? 'red' : 'green'} 
          style={{ 
            minWidth: '70px', 
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          {percent >= 0 ? '+' : ''}{percent ? percent.toFixed(2) : '0.00'}%
        </Tag>
      )
    },
    {
      title: '总市值',
      dataIndex: 'market_value',
      key: 'market_value',
      sorter: true,
      render: (value) => (
        <Text style={{ fontWeight: '600', color: '#6366f1' }}>
          {value ? `${(value / 100000000).toFixed(0)}亿` : '-'}
        </Text>
      )
    },
    {
      title: '换手率',
      dataIndex: 'turnover_rate',
      key: 'turnover_rate',
      sorter: true,
      render: (rate) => (
        <Text style={{ fontWeight: '600' }}>
          {rate ? `${rate.toFixed(2)}%` : '-'}
        </Text>
      )
    },
    {
      title: '上涨/下跌',
      key: 'up_down',
      render: (_, record) => (
        <Space>
          <Text style={{ color: '#dc2626', fontWeight: '600' }}>
            <RiseOutlined style={{ marginRight: 4 }} /> {record.rising_count || 0}
          </Text>
          <Text style={{ color: '#16a34a', fontWeight: '600' }}>
            <FallOutlined style={{ marginRight: 4 }} /> {record.falling_count || 0}
          </Text>
        </Space>
      )
    },
    {
      title: '领涨股票',
      key: 'leading_stock',
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
            {record.leading_stock || '-'}
          </Text>
          {record.leading_stock_change && (
            <Tag 
              size="small" 
              color={record.leading_stock_change >= 0 ? 'red' : 'green'}
              style={{ fontSize: '11px', fontWeight: '600' }}
            >
              {record.leading_stock_change >= 0 ? '+' : ''}{record.leading_stock_change.toFixed(2)}%
            </Tag>
          )}
        </Space>
      )
    }
  ];

  const statistics = getStatistics();

  // 获取当前图表的高度
  const getChartHeight = () => {
    switch(chartType) {
      case 'heatmap':
        return '850px';
      case 'line':
        return '800px';
      case 'radar':
        return '800px';
      case 'treemap':
        return '800px';
      default:
        return '750px';
    }
  };

  // 获取图表数值高度（用于opts配置）
  const getChartHeightNumber = () => {
    switch(chartType) {
      case 'heatmap':
        return 850;
      case 'line':
        return 800;
      case 'radar':
        return 800;
      case 'treemap':
        return 800;
      default:
        return 750;
    }
  };

  return (
    <div className="industry-analysis-container">
      {/* 页面标题 */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2}>
          <BarChartOutlined />
          行业分析
          <Text type="secondary" style={{ fontSize: '16px', marginLeft: 12, color: 'rgba(255, 255, 255, 0.8)' }}>
            ({dataSource === 'fallback' ? '示例数据' : '东方财富实时数据'})
          </Text>
        </Title>
      </div>

      {/* 统计概览 */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={6}>
          <Card className="statistic-card">
            <Statistic
              title={
                <span>
                  <FireOutlined style={{ color: '#667eea', marginRight: 8 }} />
                  行业总数
                </span>
              }
              value={statistics.total}
              valueStyle={{ fontSize: '32px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="statistic-card">
            <Statistic
              title={
                <span>
                  <RiseOutlined style={{ color: '#dc2626', marginRight: 8 }} />
                  上涨行业
                </span>
              }
              value={statistics.rising}
              suffix={`/ ${statistics.total}`}
              valueStyle={{ fontSize: '32px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="statistic-card">
            <Statistic
              title={
                <span>
                  <FallOutlined style={{ color: '#16a34a', marginRight: 8 }} />
                  下跌行业
                </span>
              }
              value={statistics.falling}
              suffix={`/ ${statistics.total}`}
              valueStyle={{ fontSize: '32px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="statistic-card">
            <Statistic
              title={
                <span>
                  {statistics.avgChange >= 0 ? 
                    <RiseOutlined style={{ color: '#f093fb', marginRight: 8 }} /> : 
                    <FallOutlined style={{ color: '#f093fb', marginRight: 8 }} />
                  }
                  平均涨跌幅
                </span>
              }
              value={statistics.avgChange}
              precision={2}
              suffix="%"
              valueStyle={{ fontSize: '32px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 控制面板 */}
      <Card className="control-panel" style={{ marginBottom: 32 }}>
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} sm={6}>
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ color: '#1e293b' }}>排序字段</Text>
            </div>
            <Select
              value={sortField}
              onChange={(value) => handleSort(value, sortOrder)}
              style={{ width: '100%' }}
              placeholder="选择排序字段"
              size="large"
            >
              <Option value="market_value">📊 按市值排序</Option>
              <Option value="change_percent">📈 按涨跌幅排序</Option>
              <Option value="turnover_rate">🔄 按换手率排序</Option>
              <Option value="price">💰 按价格排序</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ color: '#1e293b' }}>排序方向</Text>
            </div>
            <Radio.Group 
              value={sortOrder} 
              onChange={(e) => handleSort(sortField, e.target.value)}
              buttonStyle="solid"
              size="large"
            >
              <Radio.Button value="desc">⬇️ 降序</Radio.Button>
              <Radio.Button value="asc">⬆️ 升序</Radio.Button>
            </Radio.Group>
          </Col>
          <Col xs={24} sm={4}>
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ color: '#1e293b' }}>自动刷新</Text>
            </div>
            <Space size="large">
              <Switch 
                checked={autoRefresh}
                onChange={handleAutoRefreshChange}
                size="default"
                checkedChildren="🔄"
                unCheckedChildren="⏸️"
              />
              <Text style={{ fontSize: '12px', color: '#64748b' }}>
                {autoRefresh ? '30秒间隔' : '手动模式'}
              </Text>
            </Space>
          </Col>
          <Col xs={24} sm={10}>
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ color: '#1e293b' }}>数据控制</Text>
            </div>
            <Space size="large">
              <Button 
                type="primary" 
                icon={<ReloadOutlined spin={loading} />}
                onClick={fetchIndustryData}
                disabled={loading}
                size="large"
                style={{ minWidth: '120px' }}
              >
                {loading ? '🔄 获取中' : '🚀 刷新数据'}
              </Button>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text style={{ fontSize: '12px', color: '#64748b' }}>
                  状态: {autoRefresh ? '🟢 自动刷新中' : '🔴 手动刷新'}
                </Text>
                <Text style={{ fontSize: '11px', color: '#94a3b8' }}>
                  数据源: {dataSource === 'fallback' ? '示例数据' : '东方财富'}
                </Text>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 数据分析区域 */}
      <Card 
        className="chart-card"
        title={
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ 
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginRight: '8px',
              fontSize: '20px'
            }}>
              📊
            </span>
            数据分析中心
          </span>
        }
        style={{ marginBottom: 32 }}
      >
        <Tabs
          defaultActiveKey="chart"
          size="large"
          type="card"
          items={[
            {
              key: 'chart',
              label: (
                <span>
                  <DashboardOutlined />
                  可视化分析
                </span>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: 16, textAlign: 'center' }}>
                    <Radio.Group 
                      value={chartType} 
                      onChange={(e) => setChartType(e.target.value)}
                      buttonStyle="solid"
                      size="large"
                      className="chart-radio-group"
                    >
                      <Radio.Button value="pie">
                        <PieChartOutlined /> 饼图
                      </Radio.Button>
                      <Radio.Button value="bar">
                        <BarChartOutlined /> 柱状图
                      </Radio.Button>
                      <Radio.Button value="scatter">
                        <ThunderboltOutlined /> 散点图
                      </Radio.Button>
                      <Radio.Button value="line">
                        <LineChartOutlined /> 折线图
                      </Radio.Button>
                      <Radio.Button value="radar">
                        <RadarChartOutlined /> 雷达图
                      </Radio.Button>
                      <Radio.Button value="heatmap">
                        <HeatMapOutlined /> 热力图
                      </Radio.Button>
                      <Radio.Button value="gauge">
                        <FundOutlined /> 仪表盘
                      </Radio.Button>
                      <Radio.Button value="treemap">
                        <NodeIndexOutlined /> 树状图
                      </Radio.Button>
                    </Radio.Group>
                  </div>
                  <Spin spinning={loading} size="large">
                    <ReactECharts
                      option={
                        chartType === 'pie' ? getPieChartOption() : 
                        chartType === 'bar' ? getBarChartOption() : 
                        chartType === 'scatter' ? getScatterChartOption() :
                        chartType === 'line' ? getLineChartOption() :
                        chartType === 'radar' ? getRadarChartOption() :
                        chartType === 'heatmap' ? getHeatmapChartOption() :
                        chartType === 'gauge' ? getGaugeChartOption() :
                        getTreemapChartOption()
                      }
                      style={{ height: getChartHeight() }}
                      className="echarts-for-react"
                      notMerge={true}
                      opts={{
                        devicePixelRatio: window.devicePixelRatio || 2,
                        renderer: 'canvas',
                        width: 'auto',
                        height: getChartHeightNumber()
                      }}
                    />
                  </Spin>
                </div>
              )
            },
            {
              key: 'table',
              label: (
                <span>
                  <TableOutlined />
                  详细数据
                </span>
              ),
              children: (
                <Table
                  columns={tableColumns}
                  dataSource={filteredData}
                  rowKey={(record, index) => `${record.name}-${index}`}
                  loading={loading}
                  pagination={{
                    pageSize: 15,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => (
                      <span style={{ fontWeight: '600', color: '#667eea' }}>
                        📊 共 {total} 个行业
                      </span>
                    ),
                    pageSizeOptions: ['10', '15', '25', '50']
                  }}
                  scroll={{ x: 1200 }}
                  size="middle"
                  onChange={(pagination, filters, sorter) => {
                    if (sorter.field) {
                      handleSort(sorter.field, sorter.order === 'ascend' ? 'asc' : 'desc');
                    }
                  }}
                />
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default IndustryAnalysis; 