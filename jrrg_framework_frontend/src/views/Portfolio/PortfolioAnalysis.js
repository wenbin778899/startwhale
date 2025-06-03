import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Empty, Radio, Statistic, Progress, Tag, Space, Tooltip, Switch, Table, Typography, Divider } from 'antd';
import ReactECharts from 'echarts-for-react';
import { 
  PieChartOutlined, 
  BarChartOutlined, 
  DotChartOutlined, 
  HeatMapOutlined,
  RadarChartOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
  AreaChartOutlined,
  FundOutlined,
  ThunderboltOutlined,
  AimOutlined,
  BankOutlined,
  StarOutlined,
  FireOutlined,
  DashboardOutlined,
  PercentageOutlined,
  CalendarOutlined,
  CrownOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Text } = Typography;

const PortfolioAnalysis = ({ portfolioDetail = {} }) => {
  const [analysisType, setAnalysisType] = useState('asset');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { portfolio = {}, stocks = [], funds = [], statistics = [] } = portfolioDetail;

  // 如果没有持仓数据，显示空状态
  if ((!stocks || stocks.length === 0) && (!funds || funds.length === 0)) {
    return (
      <Empty 
        description="暂无持仓数据，请先添加股票或基金"
        style={{ margin: '40px 0' }}
      />
    );
  }

  // 计算基础数据
  const totalAssets = stocks.length + funds.length;
  const stockCount = stocks.length;
  const fundCount = funds.length;
  const totalValue = Number(portfolio.current_value || 0);
  const totalInvestment = Number(portfolio.total_investment || 0);
  const totalProfit = Number(portfolio.profit_loss || 0);
  const totalProfitRate = Number(portfolio.profit_loss_rate || 0);

  // 计算绩效指标
  const calculatePerformanceMetrics = () => {
    // 基础指标
    const metrics = {
      totalReturn: totalProfitRate,
      absoluteReturn: totalProfit,
      
      // 年化收益率（假设持仓时间1年）
      annualizedReturn: totalProfitRate,
      
      // 最大回撤（模拟数据）
      maxDrawdown: Math.min(0, totalProfitRate * 1.2),
      
      // 夏普比率（简化计算，假设无风险利率3%）
      sharpeRatio: totalProfitRate > 0 ? (totalProfitRate - 0.03) / Math.max(0.05, Math.abs(totalProfitRate * 0.8)) : 0,
      
      // 波动率（基于收益率估算）
      volatility: Math.abs(totalProfitRate) * 0.8 + 0.1,
      
      // 信息比率
      informationRatio: totalProfitRate / Math.max(0.05, Math.abs(totalProfitRate * 0.6)),
      
      // 胜率（基于持仓盈利股票/基金比例）
      winRate: totalAssets > 0 ? 
        ([...stocks, ...funds].filter(item => Number(item.profit_loss_rate || 0) > 0).length / totalAssets) : 0,
      
      // 盈亏比
      profitLossRatio: (() => {
        const profits = [...stocks, ...funds].filter(item => Number(item.profit_loss_rate || 0) > 0);
        const losses = [...stocks, ...funds].filter(item => Number(item.profit_loss_rate || 0) < 0);
        
        if (profits.length === 0 || losses.length === 0) return totalProfitRate > 0 ? 2.0 : 0.5;
        
        const avgProfit = profits.reduce((sum, item) => sum + Number(item.profit_loss_rate || 0), 0) / profits.length;
        const avgLoss = Math.abs(losses.reduce((sum, item) => sum + Number(item.profit_loss_rate || 0), 0) / losses.length);
        
        return avgLoss > 0 ? avgProfit / avgLoss : 2.0;
      })(),
      
      // 资产相关性（简化）
      correlation: 0.65,
      
      // Beta系数（相对市场，模拟数据）
      beta: 1.0 + (totalProfitRate - 0.08) * 0.5
    };

    return metrics;
  };

  const performanceMetrics = calculatePerformanceMetrics();

  // 获取主题配置
  const getTheme = () => ({
    backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
    textStyle: {
      color: isDarkMode ? '#ffffff' : '#333333'
    },
    grid: {
      backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff'
    }
  });

  // 1. 资产类型分布饼图
  const getAssetTypePieOption = () => {
    const data = [
      { value: stockCount, name: '股票', itemStyle: { color: '#ff4d4f' } },
      { value: fundCount, name: '基金', itemStyle: { color: '#1890ff' } }
    ].filter(item => item.value > 0);

    return {
      ...getTheme(),
      title: {
        text: '资产类型分布',
        left: 'center',
        top: 10,
        textStyle: { 
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: { color: isDarkMode ? '#ffffff' : '#333333' }
      },
      series: [
        {
          name: '资产类型',
          type: 'pie',
          radius: '65%',
          center: ['60%', '50%'],
          data: data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: true,
            formatter: '{b}: {c}\n({d}%)',
            color: isDarkMode ? '#ffffff' : '#333333',
            fontSize: 12
          }
        }
      ]
    };
  };

  // 2. 持仓市值分布（环形图）
  const getPositionValueRingOption = () => {
    // 合并股票和基金数据
    const allAssets = [
      ...stocks.map(stock => ({
        name: stock.stock_name,
        value: Number(stock.position_value || 0),
        code: stock.stock_code,
        type: '股票',
        profitRate: Number(stock.profit_loss_rate || 0)
      })),
      ...funds.map(fund => ({
        name: fund.fund_name,
        value: Number(fund.position_value || 0),
        code: fund.fund_code,
        type: '基金',
        profitRate: Number(fund.profit_loss_rate || 0)
      }))
    ].filter(item => item.value > 0)
     .sort((a, b) => b.value - a.value)
     .slice(0, 8); // 只显示前8个

    return {
      ...getTheme(),
      title: {
        text: '持仓市值分布',
        subtext: 'TOP 8',
        left: 'center',
        top: 10,
        textStyle: { 
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          const data = params.data;
          return `${data.name}<br/>
                  代码: ${data.code}<br/>
                  类型: ${data.type}<br/>
                  市值: ¥${data.value.toLocaleString()}<br/>
                  收益率: ${(data.profitRate * 100).toFixed(2)}%<br/>
                  占比: ${params.percent.toFixed(2)}%`;
        }
      },
      legend: {
        bottom: 10,
        left: 'center',
        textStyle: { color: isDarkMode ? '#ffffff' : '#333333' }
      },
      series: [
        {
          name: '持仓市值',
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          data: allAssets,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '16',
              fontWeight: 'bold',
              color: isDarkMode ? '#ffffff' : '#333333'
            }
          },
          labelLine: {
            show: false
          }
        }
      ]
    };
  };

  // 3. 月度收益趋势图
  const getMonthlyReturnTrendOption = () => {
    // 模拟月度收益数据（实际应该从统计数据计算）
    const months = [];
    const monthlyReturns = [];
    const cumulativeReturns = [];
    
    let cumulativeReturn = 0;
    for (let i = 11; i >= 0; i--) {
      const date = moment().subtract(i, 'months');
      months.push(date.format('MM月'));
      const monthlyReturn = (Math.random() - 0.5) * 8; // 模拟月收益率 -4% 到 4%
      monthlyReturns.push(Number(monthlyReturn.toFixed(2)));
      cumulativeReturn += monthlyReturn;
      cumulativeReturns.push(Number(cumulativeReturn.toFixed(2)));
    }

    return {
      ...getTheme(),
      title: {
        text: '月度收益趋势分析',
        left: 'center',
        top: 10,
        textStyle: { 
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          let result = params[0].name + '<br/>';
          params.forEach(param => {
            result += `${param.seriesName}: ${param.value}%<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ['月度收益率', '累计收益率'],
        top: 35,
        textStyle: { color: isDarkMode ? '#ffffff' : '#333333' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '25%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '月收益率(%)',
          position: 'left',
          axisLabel: {
            formatter: '{value}%',
            color: isDarkMode ? '#ffffff' : '#333333'
          },
          nameTextStyle: {
            color: isDarkMode ? '#ffffff' : '#333333'
          }
        },
        {
          type: 'value',
          name: '累计收益率(%)',
          position: 'right',
          axisLabel: {
            formatter: '{value}%',
            color: isDarkMode ? '#ffffff' : '#333333'
          },
          nameTextStyle: {
            color: isDarkMode ? '#ffffff' : '#333333'
          }
        }
      ],
      series: [
        {
          name: '月度收益率',
          type: 'bar',
          data: monthlyReturns,
          itemStyle: {
            color: function(params) {
              return params.value > 0 ? '#ff4d4f' : '#52c41a';
            }
          }
        },
        {
          name: '累计收益率',
          type: 'line',
          yAxisIndex: 1,
          data: cumulativeReturns,
          smooth: true,
          lineStyle: {
            color: '#1890ff',
            width: 3
          },
          symbolSize: 6
        }
      ]
    };
  };

  // 4. 收益率分布直方图
  const getReturnDistributionOption = () => {
    const allReturns = [
      ...stocks.map(s => Number(s.profit_loss_rate || 0) * 100),
      ...funds.map(f => Number(f.profit_loss_rate || 0) * 100)
    ];

    if (allReturns.length === 0) {
      return {
        title: { text: '暂无数据' },
        series: []
      };
    }

    // 创建直方图数据
    const bins = [];
    const min = Math.min(...allReturns);
    const max = Math.max(...allReturns);
    const binCount = Math.min(8, allReturns.length);
    const binWidth = (max - min) / binCount;

    for (let i = 0; i < binCount; i++) {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = allReturns.filter(r => r >= binStart && (i === binCount - 1 ? r <= binEnd : r < binEnd)).length;
      bins.push({
        name: `${binStart.toFixed(1)}% ~ ${binEnd.toFixed(1)}%`,
        value: count,
        binStart,
        binEnd
      });
    }

    return {
      ...getTheme(),
      title: {
        text: '收益率分布直方图',
        left: 'center',
        top: 10,
        textStyle: { 
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          return `收益率区间: ${params[0].name}<br/>
                  资产数量: ${params[0].value} 个`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: bins.map(b => b.name),
        axisLabel: {
          rotate: 45,
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: '资产数量',
        axisLabel: {
          color: isDarkMode ? '#ffffff' : '#333333'
        },
        nameTextStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      series: [
        {
          name: '资产数量',
          type: 'bar',
          data: bins.map(b => ({
            value: b.value,
            itemStyle: {
              color: b.binStart >= 0 ? '#ff4d4f' : '#52c41a'
            }
          })),
          barWidth: '60%',
          label: {
            show: true,
            position: 'top',
            color: isDarkMode ? '#ffffff' : '#333333'
          }
        }
      ]
    };
  };

  // 5. 风险收益象限图
  const getRiskReturnQuadrantOption = () => {
    const allAssets = [
      ...stocks.map(stock => ({
        name: stock.stock_name,
        return: Number(stock.profit_loss_rate || 0) * 100,
        risk: Math.abs(Number(stock.profit_loss_rate || 0)) * 50 + Math.random() * 20, // 模拟风险
        value: Number(stock.position_value || 0),
        type: '股票'
      })),
      ...funds.map(fund => ({
        name: fund.fund_name,
        return: Number(fund.profit_loss_rate || 0) * 100,
        risk: Math.abs(Number(fund.profit_loss_rate || 0)) * 30 + Math.random() * 15, // 基金风险通常较低
        value: Number(fund.position_value || 0),
        type: '基金'
      }))
    ].filter(item => item.value > 0);

    return {
      ...getTheme(),
      title: {
        text: '风险收益象限分析',
        subtext: '气泡大小代表市值',
        left: 'center',
        top: 10,
        textStyle: { 
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          return `${params.data.name}<br/>
                  类型: ${params.data.type}<br/>
                  收益率: ${params.data.return.toFixed(2)}%<br/>
                  风险值: ${params.data.risk.toFixed(2)}<br/>
                  市值: ¥${params.data.value.toLocaleString()}`;
        }
      },
      grid: {
        left: '10%',
        right: '4%',
        bottom: '10%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '风险水平',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: {
          color: isDarkMode ? '#ffffff' : '#333333'
        },
        nameTextStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        },
        splitLine: {
          lineStyle: {
            color: isDarkMode ? '#444444' : '#e6e6e6',
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '收益率(%)',
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: {
          formatter: '{value}%',
          color: isDarkMode ? '#ffffff' : '#333333'
        },
        nameTextStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        },
        splitLine: {
          lineStyle: {
            color: isDarkMode ? '#444444' : '#e6e6e6',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          data: allAssets.map(asset => ({
            name: asset.name,
            value: [asset.risk, asset.return],
            symbolSize: Math.max(Math.sqrt(asset.value / 1000) + 10, 15),
            itemStyle: {
              color: asset.type === '股票' ? '#ff4d4f' : '#1890ff',
              opacity: 0.8
            },
            ...asset
          })),
          type: 'scatter'
        }
      ],
      markLine: {
        data: [
          { xAxis: 20, lineStyle: { color: '#999', type: 'dashed' } },
          { yAxis: 0, lineStyle: { color: '#999', type: 'solid', width: 2 } }
        ]
      }
    };
  };

  // 6. 行业分布分析
  const getIndustryDistributionOption = () => {
    // 扩展的行业分类
    const industryMap = {
      '000001': '银行业', '000002': '房地产', '000858': '食品饮料',
      '000009': '综合类', '600036': '银行业', '600519': '食品饮料',
      '000300': '金融业', '000050': '科技股', '002415': '科技股',
      '300015': '科技股', '600000': '银行业'
    };

    const industryData = {};
    stocks.forEach(stock => {
      const industry = industryMap[stock.stock_code] || '其他行业';
      if (!industryData[industry]) {
        industryData[industry] = { value: 0, count: 0, profit: 0 };
      }
      industryData[industry].value += Number(stock.position_value || 0);
      industryData[industry].count += 1;
      industryData[industry].profit += Number(stock.profit_loss || 0);
    });

    const data = Object.entries(industryData).map(([name, data]) => ({
      name,
      value: data.value,
      count: data.count,
      profit: data.profit
    })).sort((a, b) => b.value - a.value);

    return {
      ...getTheme(),
      title: {
        text: '行业分布分析',
        subtext: '基于股票持仓',
        left: 'center',
        top: 10,
        textStyle: { 
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          return `${params.name}<br/>
                  市值: ¥${params.value.toLocaleString()}<br/>
                  持股数: ${params.data.count} 只<br/>
                  盈亏: ¥${params.data.profit.toFixed(2)}<br/>
                  占比: ${params.percent.toFixed(2)}%`;
        }
      },
      legend: {
        bottom: 10,
        left: 'center',
        textStyle: { color: isDarkMode ? '#ffffff' : '#333333' }
      },
      series: [
        {
          name: '行业分布',
          type: 'pie',
          radius: [25, 120],
          center: ['50%', '45%'],
          roseType: 'area',
          data: data,
          label: {
            color: isDarkMode ? '#ffffff' : '#333333',
            fontSize: 11
          },
          itemStyle: {
            borderRadius: 8
          }
        }
      ]
    };
  };

  // 7. 投资组合评分仪表盘
  const getPerformanceGaugeOption = () => {
    // 计算综合评分（0-100）
    let score = 50; // 基础分
    
    // 根据收益率调整
    if (totalProfitRate > 0.2) score += 30;
    else if (totalProfitRate > 0.1) score += 20;
    else if (totalProfitRate > 0) score += 10;
    else if (totalProfitRate > -0.1) score -= 10;
    else score -= 20;

    // 根据资产配置调整
    if (totalAssets >= 5) score += 10;
    else if (totalAssets >= 3) score += 5;

    // 根据分散度调整
    if (totalValue > 0) {
      const maxPositionRatio = Math.max(
        ...stocks.map(s => Number(s.position_value || 0)),
        ...funds.map(f => Number(f.position_value || 0))
      ) / totalValue;
      if (maxPositionRatio < 0.3) score += 10;
      else if (maxPositionRatio > 0.6) score -= 10;
    }

    score = Math.max(0, Math.min(100, score));

    return {
      ...getTheme(),
      title: {
        text: '投资组合评分',
        left: 'center',
        top: 10,
        textStyle: { 
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: 16
        }
      },
      series: [
        {
          name: '评分',
          type: 'gauge',
          min: 0,
          max: 100,
          detail: {
            formatter: '{value}分',
            color: isDarkMode ? '#ffffff' : '#333333',
            fontSize: 24,
            offsetCenter: [0, '80%']
          },
          data: [{ value: score, name: '综合评分' }],
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [0.3, '#fd666d'],
                [0.7, '#37a2da'],
                [1, '#67e0e3']
              ]
            }
          },
          pointer: {
            itemStyle: {
              color: isDarkMode ? '#ffffff' : '#333333'
            }
          },
          axisTick: {
            distance: -30,
            length: 8,
            lineStyle: {
              color: isDarkMode ? '#ffffff' : '#333333',
              width: 2
            }
          },
          splitLine: {
            distance: -30,
            length: 30,
            lineStyle: {
              color: isDarkMode ? '#ffffff' : '#333333',
              width: 4
            }
          },
          axisLabel: {
            color: isDarkMode ? '#ffffff' : '#333333',
            distance: 40,
            fontSize: 12
          }
        }
      ]
    };
  };

  // 8. 持仓集中度分析（洛伦兹曲线）
  const getConcentrationCurveOption = () => {
    const allAssets = [
      ...stocks.map(stock => ({
        value: Number(stock.position_value || 0),
        name: stock.stock_name
      })),
      ...funds.map(fund => ({
        value: Number(fund.position_value || 0),
        name: fund.fund_name
      }))
    ].filter(item => item.value > 0)
     .sort((a, b) => a.value - b.value); // 从小到大排序

    const totalValue = allAssets.reduce((sum, asset) => sum + asset.value, 0);
    let cumulativeValue = 0;
    const lorenzData = [[0, 0]]; // 起始点
    const equalityLine = [[0, 0]]; // 完全平等线

    allAssets.forEach((asset, index) => {
      cumulativeValue += asset.value;
      const x = ((index + 1) / allAssets.length) * 100;
      const y = (cumulativeValue / totalValue) * 100;
      lorenzData.push([x, y]);
      equalityLine.push([x, x]);
    });

    return {
      ...getTheme(),
      title: {
        text: '持仓集中度分析',
        subtext: '洛伦兹曲线',
        left: 'center',
        top: 10,
        textStyle: { 
          color: isDarkMode ? '#ffffff' : '#333333',
          fontSize: 16
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          if (params.length >= 2) {
            return `资产比例: ${params[0].data[0].toFixed(1)}%<br/>
                    市值比例: ${params[0].data[1].toFixed(1)}%<br/>
                    集中度偏离: ${Math.abs(params[0].data[1] - params[0].data[0]).toFixed(1)}%`;
          }
          return '';
        }
      },
      grid: {
        left: '10%',
        right: '4%',
        bottom: '15%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '资产数量占比(%)',
        min: 0,
        max: 100,
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: {
          formatter: '{value}%',
          color: isDarkMode ? '#ffffff' : '#333333'
        },
        nameTextStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      yAxis: {
        type: 'value',
        name: '市值占比(%)',
        min: 0,
        max: 100,
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: {
          formatter: '{value}%',
          color: isDarkMode ? '#ffffff' : '#333333'
        },
        nameTextStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      series: [
        {
          name: '实际分布',
          type: 'line',
          data: lorenzData,
          smooth: true,
          lineStyle: {
            color: '#ff4d4f',
            width: 3
          },
          areaStyle: {
            color: 'rgba(255, 77, 79, 0.2)'
          },
          symbolSize: 6
        },
        {
          name: '完全平等线',
          type: 'line',
          data: equalityLine,
          lineStyle: {
            color: '#999',
            type: 'dashed',
            width: 2
          },
          symbolSize: 0
        }
      ],
      legend: {
        data: ['实际分布', '完全平等线'],
        bottom: 10,
        textStyle: { color: isDarkMode ? '#ffffff' : '#333333' }
      }
    };
  };

  // 绩效雷达图
  const getPerformanceRadarOption = () => {
    const indicators = [
      { name: '收益能力', max: 1 },
      { name: '风险控制', max: 1 },
      { name: '稳定性', max: 1 },
      { name: '选股能力', max: 1 },
      { name: '资产配置', max: 1 },
      { name: '市场适应', max: 1 }
    ];

    // 计算各维度得分（0-1）
    const score = {
      profitability: Math.max(0, Math.min(1, (performanceMetrics.annualizedReturn + 0.2) / 0.4)),
      riskControl: Math.max(0, Math.min(1, (0.3 - performanceMetrics.volatility) / 0.3)),
      stability: Math.max(0, Math.min(1, performanceMetrics.sharpeRatio / 2)),
      selectivity: Math.max(0, Math.min(1, performanceMetrics.winRate)),
      allocation: Math.max(0, Math.min(1, Math.min(stockCount, fundCount) / Math.max(stockCount, fundCount, 1))),
      adaptation: Math.max(0, Math.min(1, (performanceMetrics.beta - 0.5) / 1.0))
    };

    return {
      ...getTheme(),
      title: {
        text: '投资能力雷达图',
        left: 'center',
        textStyle: { color: isDarkMode ? '#ffffff' : '#333333' }
      },
      tooltip: {
        trigger: 'item'
      },
      radar: {
        indicator: indicators,
        shape: 'circle',
        splitNumber: 5,
        axisName: {
          color: isDarkMode ? '#ffffff' : '#333333'
        },
        splitLine: {
          lineStyle: {
            color: isDarkMode ? '#555' : '#ddd'
          }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: isDarkMode ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)'] : ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.1)']
          }
        }
      },
      series: [{
        name: '投资能力',
        type: 'radar',
        data: [{
          value: [
            score.profitability,
            score.riskControl,
            score.stability,
            score.selectivity,
            score.allocation,
            score.adaptation
          ],
          name: '当前组合',
          areaStyle: {
            color: 'rgba(24, 144, 255, 0.3)'
          },
          lineStyle: {
            color: '#1890ff',
            width: 2
          },
          itemStyle: {
            color: '#1890ff'
          }
        }]
      }]
    };
  };

  // 绩效对比柱状图
  const getPerformanceComparisonOption = () => {
    const benchmarkData = {
      '沪深300': 0.08,
      '创业板指': 0.12,
      '同类平均': 0.06,
      '当前组合': performanceMetrics.annualizedReturn
    };

    const categories = Object.keys(benchmarkData);
    const values = Object.values(benchmarkData);

    return {
      ...getTheme(),
      title: {
        text: '收益率对比',
        left: 'center',
        textStyle: { color: isDarkMode ? '#ffffff' : '#333333' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          const param = params[0];
          return `${param.name}<br/>年化收益率: ${(param.value * 100).toFixed(2)}%`;
        }
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      yAxis: {
        type: 'value',
        name: '收益率',
        axisLabel: {
          formatter: '{value}%',
          color: isDarkMode ? '#ffffff' : '#333333'
        },
        nameTextStyle: {
          color: isDarkMode ? '#ffffff' : '#333333'
        }
      },
      series: [{
        data: values.map((value, index) => ({
          value: value * 100,
          itemStyle: {
            color: index === 3 ? '#1890ff' : (value > benchmarkData['当前组合'] ? '#52c41a' : '#ff4d4f')
          }
        })),
        type: 'bar',
        barWidth: '60%'
      }]
    };
  };

  // 风险指标表格数据
  const getRiskMetricsTableData = () => {
    return [
      {
        key: '1',
        metric: '年化收益率',
        value: `${(performanceMetrics.annualizedReturn * 100).toFixed(2)}%`,
        benchmark: '8.00%',
        rank: performanceMetrics.annualizedReturn > 0.08 ? '超越基准' : '低于基准',
        color: performanceMetrics.annualizedReturn > 0.08 ? '#52c41a' : '#ff4d4f'
      },
      {
        key: '2',
        metric: '最大回撤',
        value: `${(performanceMetrics.maxDrawdown * 100).toFixed(2)}%`,
        benchmark: '-15.00%',
        rank: performanceMetrics.maxDrawdown > -0.15 ? '风险较低' : '风险较高',
        color: performanceMetrics.maxDrawdown > -0.15 ? '#52c41a' : '#ff4d4f'
      },
      {
        key: '3',
        metric: '夏普比率',
        value: performanceMetrics.sharpeRatio.toFixed(2),
        benchmark: '1.00',
        rank: performanceMetrics.sharpeRatio > 1 ? '表现优秀' : '有待提升',
        color: performanceMetrics.sharpeRatio > 1 ? '#52c41a' : '#ff4d4f'
      },
      {
        key: '4',
        metric: '波动率',
        value: `${(performanceMetrics.volatility * 100).toFixed(2)}%`,
        benchmark: '20.00%',
        rank: performanceMetrics.volatility < 0.20 ? '波动较小' : '波动较大',
        color: performanceMetrics.volatility < 0.20 ? '#52c41a' : '#ff4d4f'
      },
      {
        key: '5',
        metric: '胜率',
        value: `${(performanceMetrics.winRate * 100).toFixed(2)}%`,
        benchmark: '50.00%',
        rank: performanceMetrics.winRate > 0.5 ? '选股较好' : '选股一般',
        color: performanceMetrics.winRate > 0.5 ? '#52c41a' : '#ff4d4f'
      },
      {
        key: '6',
        metric: '盈亏比',
        value: performanceMetrics.profitLossRatio.toFixed(2),
        benchmark: '2.00',
        rank: performanceMetrics.profitLossRatio > 2 ? '盈利能力强' : '盈利能力弱',
        color: performanceMetrics.profitLossRatio > 2 ? '#52c41a' : '#ff4d4f'
      }
    ];
  };

  const riskMetricsColumns = [
    {
      title: '指标名称',
      dataIndex: 'metric',
      key: 'metric',
      width: '25%'
    },
    {
      title: '当前值',
      dataIndex: 'value',
      key: 'value',
      width: '20%',
      render: (text, record) => (
        <Text style={{ color: record.color, fontWeight: 'bold' }}>{text}</Text>
      )
    },
    {
      title: '市场基准',
      dataIndex: 'benchmark',
      key: 'benchmark',
      width: '20%'
    },
    {
      title: '评价',
      dataIndex: 'rank',
      key: 'rank',
      width: '35%',
      render: (text, record) => (
        <Tag color={record.color === '#52c41a' ? 'success' : 'error'}>
          {text}
        </Tag>
      )
    }
  ];

  // 渲染绩效指标概览卡片
  const renderPerformanceOverview = () => {
    return (
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[24, 16]}>
          <Col xs={24}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <TrophyOutlined style={{ fontSize: 20, color: '#1890ff', marginRight: 8 }} />
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>绩效指标概览</Text>
            </div>
          </Col>
        </Row>
        
        <Row gutter={[24, 24]}>
          <Col xs={12} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
              <Statistic
                title="年化收益率"
                value={performanceMetrics.annualizedReturn * 100}
                precision={2}
                suffix="%"
                prefix={<RiseOutlined />}
                valueStyle={{ 
                  color: performanceMetrics.annualizedReturn >= 0 ? '#cf1322' : '#3f8600',
                  fontSize: '18px'
                }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color={performanceMetrics.annualizedReturn > 0.08 ? 'success' : 'warning'}>
                  {performanceMetrics.annualizedReturn > 0.08 ? '超越基准' : '低于基准'}
                </Tag>
              </div>
            </Card>
          </Col>
          
          <Col xs={12} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#f0f9ff' }}>
              <Statistic
                title="夏普比率"
                value={performanceMetrics.sharpeRatio}
                precision={2}
                prefix={<StarOutlined />}
                valueStyle={{ 
                  color: performanceMetrics.sharpeRatio >= 1 ? '#1890ff' : '#8c8c8c',
                  fontSize: '18px'
                }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color={performanceMetrics.sharpeRatio > 1 ? 'blue' : 'default'}>
                  {performanceMetrics.sharpeRatio > 1 ? '表现优秀' : '有待提升'}
                </Tag>
              </div>
            </Card>
          </Col>
          
          <Col xs={12} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
              <Statistic
                title="最大回撤"
                value={Math.abs(performanceMetrics.maxDrawdown * 100)}
                precision={2}
                suffix="%"
                prefix={<FallOutlined />}
                valueStyle={{ 
                  color: performanceMetrics.maxDrawdown > -0.15 ? '#faad14' : '#ff4d4f',
                  fontSize: '18px'
                }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color={performanceMetrics.maxDrawdown > -0.15 ? 'gold' : 'error'}>
                  {performanceMetrics.maxDrawdown > -0.15 ? '风险较低' : '风险较高'}
                </Tag>
              </div>
            </Card>
          </Col>
          
          <Col xs={12} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
              <Statistic
                title="胜率"
                value={performanceMetrics.winRate * 100}
                precision={2}
                suffix="%"
                prefix={<AimOutlined />}
                valueStyle={{ 
                  color: performanceMetrics.winRate >= 0.5 ? '#52c41a' : '#ff4d4f',
                  fontSize: '18px'
                }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color={performanceMetrics.winRate > 0.5 ? 'success' : 'error'}>
                  {performanceMetrics.winRate > 0.5 ? '选股较好' : '选股一般'}
                </Tag>
              </div>
            </Card>
          </Col>
          
          <Col xs={12} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#fff0f6' }}>
              <Statistic
                title="盈亏比"
                value={performanceMetrics.profitLossRatio}
                precision={2}
                prefix={<PercentageOutlined />}
                valueStyle={{ 
                  color: performanceMetrics.profitLossRatio >= 2 ? '#eb2f96' : '#8c8c8c',
                  fontSize: '18px'
                }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color={performanceMetrics.profitLossRatio > 2 ? 'magenta' : 'default'}>
                  {performanceMetrics.profitLossRatio > 2 ? '盈利能力强' : '盈利能力弱'}
                </Tag>
              </div>
            </Card>
          </Col>
          
          <Col xs={12} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#f9f0ff' }}>
              <Statistic
                title="波动率"
                value={performanceMetrics.volatility * 100}
                precision={2}
                suffix="%"
                prefix={<ThunderboltOutlined />}
                valueStyle={{ 
                  color: performanceMetrics.volatility < 0.20 ? '#722ed1' : '#ff4d4f',
                  fontSize: '18px'
                }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color={performanceMetrics.volatility < 0.20 ? 'purple' : 'error'}>
                  {performanceMetrics.volatility < 0.20 ? '波动较小' : '波动较大'}
                </Tag>
              </div>
            </Card>
          </Col>
          
          <Col xs={12} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#f0f9ff' }}>
              <Statistic
                title="信息比率"
                value={performanceMetrics.informationRatio}
                precision={2}
                prefix={<DashboardOutlined />}
                valueStyle={{ 
                  color: performanceMetrics.informationRatio >= 0.5 ? '#1890ff' : '#8c8c8c',
                  fontSize: '18px'
                }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color={performanceMetrics.informationRatio > 0.5 ? 'blue' : 'default'}>
                  {performanceMetrics.informationRatio > 0.5 ? '信息价值高' : '信息价值低'}
                </Tag>
              </div>
            </Card>
          </Col>
          
          <Col xs={12} sm={8} md={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#fcfff7' }}>
              <Statistic
                title="Beta系数"
                value={performanceMetrics.beta}
                precision={2}
                prefix={<LineChartOutlined />}
                valueStyle={{ 
                  color: Math.abs(performanceMetrics.beta - 1) < 0.2 ? '#52c41a' : '#faad14',
                  fontSize: '18px'
                }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color={Math.abs(performanceMetrics.beta - 1) < 0.2 ? 'success' : 'warning'}>
                  {Math.abs(performanceMetrics.beta - 1) < 0.2 ? '与市场同步' : '偏离市场'}
                </Tag>
              </div>
            </Card>
          </Col>
        </Row>
        
        <Divider />
        
        <Row gutter={[24, 16]}>
          <Col span={24}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                * 绩效指标基于当前持仓数据计算，包含模拟估算值，仅供参考
              </Text>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  // 渲染图表
  const renderChart = () => {
    switch (analysisType) {
      case 'asset':
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title={<><PieChartOutlined /> 资产类型分布</>} style={{ height: 480 }}>
                <ReactECharts option={getAssetTypePieOption()} style={{ height: 420 }} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<><BarChartOutlined /> 持仓市值分布</>} style={{ height: 480 }}>
                <ReactECharts option={getPositionValueRingOption()} style={{ height: 420 }} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<><LineChartOutlined /> 月度收益趋势</>} style={{ height: 480 }}>
                <ReactECharts option={getMonthlyReturnTrendOption()} style={{ height: 420 }} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<><AreaChartOutlined /> 收益率分布</>} style={{ height: 480 }}>
                <ReactECharts option={getReturnDistributionOption()} style={{ height: 420 }} />
              </Card>
            </Col>
          </Row>
        );
      case 'risk':
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title={<><DotChartOutlined /> 风险收益象限</>} style={{ height: 520 }}>
                <ReactECharts option={getRiskReturnQuadrantOption()} style={{ height: 460 }} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<><AimOutlined /> 持仓集中度分析</>} style={{ height: 520 }}>
                <ReactECharts option={getConcentrationCurveOption()} style={{ height: 460 }} />
              </Card>
            </Col>
          </Row>
        );
      case 'industry':
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title={<><BankOutlined /> 行业分布分析</>} style={{ height: 520 }}>
                <ReactECharts option={getIndustryDistributionOption()} style={{ height: 460 }} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<><TrophyOutlined /> 投资组合评分</>} style={{ height: 520 }}>
                <ReactECharts option={getPerformanceGaugeOption()} style={{ height: 460 }} />
              </Card>
            </Col>
          </Row>
        );
      case 'performance':
        return (
          <>
            {renderPerformanceOverview()}
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card title={<><RadarChartOutlined /> 绩效雷达图</>} style={{ height: 520 }}>
                  <ReactECharts option={getPerformanceRadarOption()} style={{ height: 460 }} />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title={<><BarChartOutlined /> 绩效对比柱状图</>} style={{ height: 520 }}>
                  <ReactECharts option={getPerformanceComparisonOption()} style={{ height: 460 }} />
                </Card>
              </Col>
            </Row>
          </>
        );
      case 'riskMetrics':
        return (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card 
                title={<><DashboardOutlined /> 风险指标详细分析</>} 
                style={{ height: 'auto' }}
                extra={
                  <Tag color="blue" icon={<CalendarOutlined />}>
                    截至 {moment().format('YYYY-MM-DD')}
                  </Tag>
                }
              >
                <Table 
                  columns={riskMetricsColumns}
                  dataSource={getRiskMetricsTableData()}
                  rowKey="key"
                  pagination={false}
                  size="middle"
                  style={{ marginBottom: 16 }}
                />
                
                <Divider />
                
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Text strong style={{ fontSize: 16 }}>风险评级综合评分</Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ width: 100, display: 'inline-block' }}>收益能力：</span>
                      <Progress 
                        percent={Math.max(0, Math.min(100, (performanceMetrics.annualizedReturn + 0.2) / 0.4 * 100))}
                        strokeColor="#52c41a"
                        size="small"
                        style={{ flex: 1, marginRight: 8 }}
                      />
                      <Tag color="success">
                        {Math.max(0, Math.min(100, (performanceMetrics.annualizedReturn + 0.2) / 0.4 * 100)).toFixed(0)}分
                      </Tag>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ width: 100, display: 'inline-block' }}>风险控制：</span>
                      <Progress 
                        percent={Math.max(0, Math.min(100, (0.3 - performanceMetrics.volatility) / 0.3 * 100))}
                        strokeColor="#1890ff"
                        size="small"
                        style={{ flex: 1, marginRight: 8 }}
                      />
                      <Tag color="blue">
                        {Math.max(0, Math.min(100, (0.3 - performanceMetrics.volatility) / 0.3 * 100)).toFixed(0)}分
                      </Tag>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ width: 100, display: 'inline-block' }}>稳定性：</span>
                      <Progress 
                        percent={Math.max(0, Math.min(100, performanceMetrics.sharpeRatio / 2 * 100))}
                        strokeColor="#faad14"
                        size="small"
                        style={{ flex: 1, marginRight: 8 }}
                      />
                      <Tag color="gold">
                        {Math.max(0, Math.min(100, performanceMetrics.sharpeRatio / 2 * 100)).toFixed(0)}分
                      </Tag>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ width: 100, display: 'inline-block' }}>选股能力：</span>
                      <Progress 
                        percent={performanceMetrics.winRate * 100}
                        strokeColor="#eb2f96"
                        size="small"
                        style={{ flex: 1, marginRight: 8 }}
                      />
                      <Tag color="magenta">
                        {(performanceMetrics.winRate * 100).toFixed(0)}分
                      </Tag>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
            
            <Col xs={24} lg={8}>
              <Card 
                title={<><CrownOutlined /> 综合评分</>} 
                style={{ height: 'auto' }}
              >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 48, fontWeight: 'bold', color: '#1890ff', marginBottom: 16 }}>
                    {(() => {
                      const totalScore = (
                        Math.max(0, Math.min(100, (performanceMetrics.annualizedReturn + 0.2) / 0.4 * 100)) * 0.3 +
                        Math.max(0, Math.min(100, (0.3 - performanceMetrics.volatility) / 0.3 * 100)) * 0.25 +
                        Math.max(0, Math.min(100, performanceMetrics.sharpeRatio / 2 * 100)) * 0.25 +
                        (performanceMetrics.winRate * 100) * 0.2
                      );
                      return totalScore.toFixed(0);
                    })()}
                  </div>
                  <div style={{ fontSize: 18, color: '#8c8c8c', marginBottom: 20 }}>
                    / 100
                  </div>
                  
                  <div style={{ marginBottom: 20 }}>
                    {(() => {
                      const score = (
                        Math.max(0, Math.min(100, (performanceMetrics.annualizedReturn + 0.2) / 0.4 * 100)) * 0.3 +
                        Math.max(0, Math.min(100, (0.3 - performanceMetrics.volatility) / 0.3 * 100)) * 0.25 +
                        Math.max(0, Math.min(100, performanceMetrics.sharpeRatio / 2 * 100)) * 0.25 +
                        (performanceMetrics.winRate * 100) * 0.2
                      );
                      
                      if (score >= 80) {
                        return <Tag color="success" style={{ fontSize: 16, padding: '8px 16px' }}>优秀</Tag>;
                      } else if (score >= 60) {
                        return <Tag color="warning" style={{ fontSize: 16, padding: '8px 16px' }}>良好</Tag>;
                      } else if (score >= 40) {
                        return <Tag color="orange" style={{ fontSize: 16, padding: '8px 16px' }}>一般</Tag>;
                      } else {
                        return <Tag color="error" style={{ fontSize: 16, padding: '8px 16px' }}>待改进</Tag>;
                      }
                    })()}
                  </div>
                  
                  <div style={{ textAlign: 'left', fontSize: 14, color: '#8c8c8c' }}>
                    <p>评分标准：</p>
                    <p>• 收益能力 (30%)</p>
                    <p>• 风险控制 (25%)</p>
                    <p>• 稳定性 (25%)</p>
                    <p>• 选股能力 (20%)</p>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        );
      default:
        return null;
    }
  };

  return (
    <div className="portfolio-analysis">
      {/* 控制面板 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Radio.Group 
              value={analysisType} 
              onChange={(e) => setAnalysisType(e.target.value)}
              buttonStyle="solid"
              size="large"
            >
              <Radio.Button value="asset">资产分析</Radio.Button>
              <Radio.Button value="risk">风险分析</Radio.Button>
              <Radio.Button value="industry">行业分析</Radio.Button>
              <Radio.Button value="performance">绩效分析</Radio.Button>
              <Radio.Button value="riskMetrics">风险指标</Radio.Button>
            </Radio.Group>
          </Col>
          <Col>
            <Space>
              <span>深色模式</span>
              <Switch 
                checked={isDarkMode} 
                onChange={setIsDarkMode}
                checkedChildren="🌙"
                unCheckedChildren="☀️"
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 概览统计 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[24, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title="总资产数"
              value={totalAssets}
              prefix={<TrophyOutlined />}
              suffix="个"
              valueStyle={{ fontSize: '20px' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="总市值"
              value={totalValue}
              precision={2}
              prefix="¥"
              formatter={(value) => value.toLocaleString()}
              valueStyle={{ fontSize: '20px' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="总收益"
              value={totalProfit}
              precision={2}
              prefix={totalProfit >= 0 ? <RiseOutlined /> : <FallOutlined />}
              suffix="元"
              valueStyle={{ 
                color: totalProfit >= 0 ? '#cf1322' : '#3f8600',
                fontSize: '20px'
              }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="收益率"
              value={totalProfitRate * 100}
              precision={2}
              prefix={totalProfitRate >= 0 ? <RiseOutlined /> : <FallOutlined />}
              suffix="%"
              valueStyle={{ 
                color: totalProfitRate >= 0 ? '#cf1322' : '#3f8600',
                fontSize: '20px'
              }}
            />
          </Col>
        </Row>
        
        <Row gutter={[24, 16]} style={{ marginTop: 24 }}>
          <Col span={12}>
            <div>
              <span style={{ fontSize: '16px', marginRight: '8px' }}>风险评级：</span>
              <Tag 
                color={totalProfitRate > 0.1 ? 'red' : totalProfitRate > 0 ? 'orange' : 'green'}
                style={{ fontSize: '14px', padding: '4px 12px' }}
              >
                {totalProfitRate > 0.1 ? '高风险高收益' : totalProfitRate > 0 ? '中等风险' : '稳健型'}
              </Tag>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <span style={{ fontSize: '16px', marginRight: '8px' }}>资产配置：</span>
              <Tooltip title={`股票${stockCount}只，基金${fundCount}只`}>
                <Progress 
                  percent={totalAssets > 0 ? (stockCount / totalAssets * 100) : 0}
                  format={() => `${stockCount}:${fundCount}`}
                  strokeColor={{
                    '0%': '#ff4d4f',
                    '100%': '#1890ff',
                  }}
                  style={{ width: '60%' }}
                />
              </Tooltip>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 图表区域 */}
      {renderChart()}
    </div>
  );
};

export default PortfolioAnalysis; 