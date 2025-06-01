import React, { useState } from 'react';
import { Radio, Empty, Card, Space } from 'antd';
import ReactECharts from 'echarts-for-react';
import moment from 'moment';

const PortfolioChart = ({ statistics = [] }) => {
  const [chartType, setChartType] = useState('value');

  // 如果没有统计数据，显示空状态
  if (!statistics || statistics.length === 0) {
    return (
      <Empty 
        description="暂无收益数据，请点击更新统计按钮生成统计数据"
        style={{ margin: '40px 0' }}
      />
    );
  }

  // 按日期排序（从早到晚）
  const sortedStatistics = [...statistics].sort(
    (a, b) => moment(a.statistics_date).valueOf() - moment(b.statistics_date).valueOf()
  );

  // 提取日期和对应的数据
  const dates = sortedStatistics.map(item => item.statistics_date);
  const totalValues = sortedStatistics.map(item => Number(item.total_value));
  const totalProfitLoss = sortedStatistics.map(item => Number(item.total_profit_loss));
  const totalProfitLossRate = sortedStatistics.map(item => (Number(item.total_profit_loss_rate) * 100).toFixed(2));
  const dailyProfitLoss = sortedStatistics.map(item => Number(item.daily_profit_loss));
  const dailyProfitLossRate = sortedStatistics.map(item => (Number(item.daily_profit_loss_rate) * 100).toFixed(2));

  // 总市值和盈亏走势图配置
  const getValueChartOption = () => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        }
      },
      legend: {
        data: ['总市值', '总盈亏']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates
      },
      yAxis: [
        {
          type: 'value',
          name: '金额（元）',
        }
      ],
      series: [
        {
          name: '总市值',
          type: 'line',
          smooth: true,
          stack: '总量',
          emphasis: {
            focus: 'series'
          },
          data: totalValues
        },
        {
          name: '总盈亏',
          type: 'line',
          smooth: true,
          stack: '总量',
          emphasis: {
            focus: 'series'
          },
          data: totalProfitLoss,
          lineStyle: {
            color: '#5470C6'
          },
          itemStyle: {
            color: function(params) {
              const value = params.value;
              if (value > 0) return '#ee6666'; // 红色表示盈利
              if (value < 0) return '#91cc75'; // 绿色表示亏损
              return '#bfbfbf'; // 灰色表示无盈亏
            }
          }
        }
      ]
    };
  };

  // 盈亏率走势图配置
  const getRateChartOption = () => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function(params) {
          return params[0].name + '<br/>' + 
                params[0].seriesName + ': ' + params[0].value + '%<br/>' +
                params[1].seriesName + ': ' + params[1].value + '%';
        }
      },
      legend: {
        data: ['总收益率', '日收益率']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates
      },
      yAxis: {
        type: 'value',
        name: '收益率（%）',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [
        {
          name: '总收益率',
          type: 'line',
          smooth: true,
          emphasis: {
            focus: 'series'
          },
          data: totalProfitLossRate,
          itemStyle: {
            color: function(params) {
              const value = params.value;
              if (value > 0) return '#ee6666'; // 红色表示盈利
              if (value < 0) return '#91cc75'; // 绿色表示亏损
              return '#bfbfbf'; // 灰色表示无盈亏
            }
          }
        },
        {
          name: '日收益率',
          type: 'bar',
          emphasis: {
            focus: 'series'
          },
          data: dailyProfitLossRate,
          itemStyle: {
            color: function(params) {
              const value = params.value;
              if (value > 0) return '#ee6666'; // 红色表示盈利
              if (value < 0) return '#91cc75'; // 绿色表示亏损
              return '#bfbfbf'; // 灰色表示无盈亏
            }
          }
        }
      ]
    };
  };

  // 日盈亏柱状图配置
  const getDailyProfitChartOption = () => {
    return {
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
        type: 'category',
        data: dates,
        axisTick: {
          alignWithLabel: true
        }
      },
      yAxis: {
        type: 'value',
        name: '日盈亏（元）'
      },
      series: [
        {
          name: '日盈亏',
          type: 'bar',
          barWidth: '60%',
          data: dailyProfitLoss,
          itemStyle: {
            color: function(params) {
              const value = params.value;
              if (value > 0) return '#ee6666'; // 红色表示盈利
              if (value < 0) return '#91cc75'; // 绿色表示亏损
              return '#bfbfbf'; // 灰色表示无盈亏
            }
          },
          label: {
            show: true,
            position: 'top',
            formatter: function(params) {
              return params.value > 0 ? '+' + params.value.toFixed(2) : params.value.toFixed(2);
            }
          }
        }
      ]
    };
  };

  // 根据选择的图表类型返回相应的配置
  const getChartOption = () => {
    switch (chartType) {
      case 'value':
        return getValueChartOption();
      case 'rate':
        return getRateChartOption();
      case 'daily':
        return getDailyProfitChartOption();
      default:
        return getValueChartOption();
    }
  };

  return (
    <div className="portfolio-chart">
      <div className="chart-controls" style={{ marginBottom: 16, textAlign: 'center' }}>
        <Radio.Group 
          value={chartType} 
          onChange={(e) => setChartType(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="value">总市值/盈亏走势</Radio.Button>
          <Radio.Button value="rate">盈亏率走势</Radio.Button>
          <Radio.Button value="daily">日盈亏柱状图</Radio.Button>
        </Radio.Group>
      </div>

      <Card>
        <ReactECharts 
          option={getChartOption()} 
          style={{ height: 400 }} 
          opts={{ renderer: 'svg' }}
        />
      </Card>

      {/* 显示最新统计数据 */}
      {statistics.length > 0 && (
        <div className="latest-stats" style={{ marginTop: 16 }}>
          <Card size="small" title="最新收益统计">
            <Space size="large" wrap>
              <div>
                <span>统计日期：</span>
                <span>{sortedStatistics[sortedStatistics.length - 1].statistics_date}</span>
              </div>
              <div>
                <span>总市值：</span>
                <span>{Number(sortedStatistics[sortedStatistics.length - 1].total_value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}元</span>
              </div>
              <div>
                <span>总盈亏：</span>
                <span style={{ 
                  color: (() => {
                    const value = Number(sortedStatistics[sortedStatistics.length - 1].total_profit_loss);
                    if (value > 0) return '#f5222d'; // 红色表示盈利
                    if (value < 0) return '#52c41a'; // 绿色表示亏损
                    return '#8c8c8c'; // 灰色表示无盈亏
                  })()
                }}>
                  {Number(sortedStatistics[sortedStatistics.length - 1].total_profit_loss).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}元
                </span>
              </div>
              <div>
                <span>总收益率：</span>
                <span style={{ 
                  color: (() => {
                    const value = Number(sortedStatistics[sortedStatistics.length - 1].total_profit_loss_rate);
                    if (value > 0) return '#f5222d'; // 红色表示盈利
                    if (value < 0) return '#52c41a'; // 绿色表示亏损
                    return '#8c8c8c'; // 灰色表示无盈亏
                  })()
                }}>
                  {(Number(sortedStatistics[sortedStatistics.length - 1].total_profit_loss_rate) * 100).toFixed(2)}%
                </span>
              </div>
              <div>
                <span>日盈亏：</span>
                <span style={{ 
                  color: (() => {
                    const value = Number(sortedStatistics[sortedStatistics.length - 1].daily_profit_loss);
                    if (value > 0) return '#f5222d'; // 红色表示盈利
                    if (value < 0) return '#52c41a'; // 绿色表示亏损
                    return '#8c8c8c'; // 灰色表示无盈亏
                  })()
                }}>
                  {Number(sortedStatistics[sortedStatistics.length - 1].daily_profit_loss).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}元
                </span>
              </div>
              <div>
                <span>日收益率：</span>
                <span style={{ 
                  color: (() => {
                    const value = Number(sortedStatistics[sortedStatistics.length - 1].daily_profit_loss_rate);
                    if (value > 0) return '#f5222d'; // 红色表示盈利
                    if (value < 0) return '#52c41a'; // 绿色表示亏损
                    return '#8c8c8c'; // 灰色表示无盈亏
                  })()
                }}>
                  {(Number(sortedStatistics[sortedStatistics.length - 1].daily_profit_loss_rate) * 100).toFixed(2)}%
                </span>
              </div>
            </Space>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PortfolioChart; 