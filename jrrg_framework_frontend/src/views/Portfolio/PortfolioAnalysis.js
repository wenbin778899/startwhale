import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Empty, Radio, Statistic, Progress, Tag, Space, Tooltip, Switch } from 'antd';
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
  BankOutlined
} from '@ant-design/icons';
import moment from 'moment';

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