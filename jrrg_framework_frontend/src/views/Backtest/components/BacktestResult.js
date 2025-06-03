import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Statistic,
  Table,
  Button,
  Divider,
  Spin,
  message,
  Tag,
  Tooltip,
  Typography,
  Alert,
  Modal,
  Progress
} from 'antd';
import {
  ArrowLeftOutlined,
  AreaChartOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
  CalculatorOutlined,
  PercentageOutlined,
  FullscreenOutlined,
  TrophyOutlined,
  TransactionOutlined,
  MoneyCollectOutlined,
  StockOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { getBacktestDetail } from '../../../api/strategy';

const { Title, Text } = Typography;

// 交易明细表格列定义
const tradeColumns = [
  {
    title: '类型',
    dataIndex: 'entry_type',
    key: 'entry_type',
    render: (type) => (
      <Tag color={type === 'BUY' ? 'blue' : 'orange'}>
        {type === 'BUY' ? '买入' : '卖出'}
      </Tag>
    )
  },
  {
    title: '交易日期',
    dataIndex: 'entry_date',
    key: 'entry_date'
  },
  {
    title: '交易价格',
    dataIndex: 'entry_price',
    key: 'entry_price',
    render: (price) => `¥${price.toFixed(2)}`
  },
  {
    title: '交易数量',
    dataIndex: 'size',
    key: 'size'
  },
  {
    title: '平仓日期',
    dataIndex: 'exit_date',
    key: 'exit_date',
  },
  {
    title: '平仓价格',
    dataIndex: 'exit_price',
    key: 'exit_price',
    render: (price) => `¥${price.toFixed(2)}`
  },
  {
    title: '收益',
    dataIndex: 'pl',
    key: 'pl',
    render: (pl) => (
      <span className={pl > 0 ? 'profit-positive' : 'profit-negative'}>
        {pl > 0 ? '+' : ''}{pl.toFixed(2)}
      </span>
    )
  },
  {
    title: '收益率',
    dataIndex: 'pl_pct',
    key: 'pl_pct',
    render: (pl_pct) => (
      <span className={pl_pct > 0 ? 'profit-positive' : 'profit-negative'}>
        {pl_pct > 0 ? '+' : ''}{pl_pct.toFixed(2)}%
      </span>
    )
  },
  {
    title: '手续费',
    dataIndex: 'commission',
    key: 'commission',
    render: (commission) => `¥${commission.toFixed(2)}`
  }
];

const BacktestResult = ({ backtestResult, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  // 加载回测详情
  useEffect(() => {
    if (backtestResult) {
      if (backtestResult.loadFromHistory) {
        // 从历史记录加载
        loadBacktestDetail(backtestResult.id);
      } else {
        // 直接使用回测结果
        setResult(backtestResult);
        setImageLoading(true);
        setImageError(false);
      }
      // 添加延迟以创建淡入效果
      setTimeout(() => {
        setFadeIn(true);
      }, 100);
    }
  }, [backtestResult]);

  // 加载回测详情
  const loadBacktestDetail = async (id) => {
    try {
      setLoading(true);
      const response = await getBacktestDetail(id);
      if (response && response.data) {
        setResult(response.data);
        setImageLoading(true);
        setImageError(false);
      }
    } catch (error) {
      console.error('获取回测详情失败:', error);
      message.error('获取回测详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理图片加载完成
  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // 处理图片加载错误
  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // 如果没有回测结果，显示加载中
  if (!result) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 获取合适的图标和颜色
  const getStatisticIcon = (type) => {
    switch(type) {
      case 'total_return':
        return result.total_return >= 0 ? <RiseOutlined /> : <FallOutlined />;
      case 'annual_return':
        return result.annual_return >= 0 ? <RiseOutlined /> : <FallOutlined />;
      case 'max_drawdown':
        return <PercentageOutlined />;
      case 'sharpe_ratio':
        return <CalculatorOutlined />;
      case 'trade_count':
        return <TransactionOutlined />;
      case 'win_rate':
        return <TrophyOutlined />;
      case 'initial_cash':
        return <MoneyCollectOutlined />;
      case 'final_value':
        return <DollarOutlined />;
      default:
        return <StockOutlined />;
    }
  };

  const getStatisticColor = (type) => {
    switch(type) {
      case 'total_return':
        return result.total_return >= 0 ? '#ff4d4f' : '#52c41a';
      case 'annual_return':
        return result.annual_return >= 0 ? '#ff4d4f' : '#52c41a';
      case 'max_drawdown':
        return '#cf1322';
      case 'sharpe_ratio':
        return result.sharpe_ratio >= 2 ? '#52c41a' : 
               result.sharpe_ratio >= 1 ? '#1890ff' : '#faad14';
      case 'win_rate':
        return result.win_rate >= 60 ? '#52c41a' : 
               result.win_rate >= 40 ? '#1890ff' : '#faad14';
      case 'final_value':
        return result.final_value >= result.initial_cash ? '#ff4d4f' : '#52c41a';
      default:
        return '#1890ff';
    }
  };

  return (
    <div className={`backtest-result ${fadeIn ? 'fade-in' : ''}`} style={{ transition: 'opacity 0.5s, transform 0.5s', opacity: fadeIn ? 1 : 0, transform: fadeIn ? 'translateY(0)' : 'translateY(20px)' }}>
      <Button
        type="primary"
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
        style={{ marginBottom: 16 }}
        className="back-button"
      >
        返回
      </Button>
      
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <LineChartOutlined style={{ marginRight: 8, fontSize: 20 }} />
            <span>{result.strategy_name} - {result.stock_code} {result.stock_name}</span>
          </div>
        }
        loading={loading}
        className="result-card"
        extra={
          <Tag color="#1890ff" style={{ fontSize: '14px', padding: '4px 12px' }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {result.start_date} 至 {result.end_date}
          </Tag>
        }
      >
        {result.total_return === 0 && result.annual_return === 0 && result.max_drawdown === 0 && (
          <Alert
            message="回测结果异常"
            description={
              <div>
                <p>回测未产生任何交易或所有指标为0，可能的原因：</p>
                <ul>
                  <li>选择的日期范围内没有符合策略条件的交易信号</li>
                  <li>股票数据不足以生成交易信号（例如数据量太少无法计算均线）</li>
                  <li>策略参数设置不当（例如均线周期过长）</li>
                </ul>
                <p>建议：尝试延长回测周期、调整策略参数或选择其他股票</p>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 24, borderRadius: 8 }}
          />
        )}
        
        <div className="backtest-summary">
          <div className="summary-item">
            <Statistic
              title="总收益率"
              value={result.total_return}
              precision={2}
              valueStyle={{ color: getStatisticColor('total_return') }}
              prefix={getStatisticIcon('total_return')}
              suffix="%"
            />
            {result.total_return !== 0 && (
              <Progress 
                percent={Math.min(Math.abs(result.total_return), 100)} 
                showInfo={false} 
                strokeColor={getStatisticColor('total_return')}
                style={{ marginTop: 8 }}
              />
            )}
          </div>
          <div className="summary-item">
            <Statistic
              title="年化收益率"
              value={result.annual_return}
              precision={2}
              valueStyle={{ color: getStatisticColor('annual_return') }}
              prefix={getStatisticIcon('annual_return')}
              suffix="%"
            />
            {result.annual_return !== 0 && (
              <Progress 
                percent={Math.min(Math.abs(result.annual_return), 100)} 
                showInfo={false} 
                strokeColor={getStatisticColor('annual_return')}
                style={{ marginTop: 8 }}
              />
            )}
          </div>
          <div className="summary-item">
            <Statistic
              title="最大回撤"
              value={result.max_drawdown}
              precision={2}
              valueStyle={{ color: getStatisticColor('max_drawdown') }}
              prefix={getStatisticIcon('max_drawdown')}
              suffix="%"
            />
            {result.max_drawdown > 0 && (
              <Progress 
                percent={Math.min(result.max_drawdown, 100)} 
                showInfo={false} 
                strokeColor={getStatisticColor('max_drawdown')}
                style={{ marginTop: 8 }}
              />
            )}
          </div>
          <div className="summary-item">
            <Statistic
              title="夏普比率"
              value={result.sharpe_ratio}
              precision={2}
              valueStyle={{ color: getStatisticColor('sharpe_ratio') }}
              prefix={getStatisticIcon('sharpe_ratio')}
            />
            <Progress 
              percent={Math.min(result.sharpe_ratio * 33.3, 100)} 
              showInfo={false} 
              strokeColor={getStatisticColor('sharpe_ratio')}
              style={{ marginTop: 8 }}
            />
          </div>
          <div className="summary-item">
            <Statistic
              title="交易次数"
              value={result.trade_count}
              prefix={getStatisticIcon('trade_count')}
            />
          </div>
          <div className="summary-item">
            <Statistic
              title="胜率"
              value={result.win_rate}
              precision={2}
              valueStyle={{ color: getStatisticColor('win_rate') }}
              prefix={getStatisticIcon('win_rate')}
              suffix="%"
            />
            <Progress 
              percent={result.win_rate} 
              showInfo={false} 
              strokeColor={getStatisticColor('win_rate')}
              style={{ marginTop: 8 }}
            />
          </div>
          <div className="summary-item">
            <Statistic
              title="初始资金"
              value={result.initial_cash}
              precision={2}
              prefix="¥"
              prefix={getStatisticIcon('initial_cash')}
            />
          </div>
          <div className="summary-item">
            <Statistic
              title="最终价值"
              value={result.final_value}
              precision={2}
              prefix={getStatisticIcon('final_value')}
              prefix="¥"
              valueStyle={{ color: getStatisticColor('final_value') }}
            />
            {result.initial_cash > 0 && (
              <Progress 
                percent={Math.min((result.final_value / result.initial_cash) * 100, 200)} 
                showInfo={false} 
                strokeColor={getStatisticColor('final_value')}
                style={{ marginTop: 8 }}
              />
            )}
          </div>
        </div>
        
        <Divider orientation="left">回测参数</Divider>
        
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} className="backtest-descriptions">
          <Descriptions.Item label="股票代码">{result.stock_code}</Descriptions.Item>
          <Descriptions.Item label="股票名称">{result.stock_name}</Descriptions.Item>
          <Descriptions.Item label="策略名称">{result.strategy_name}</Descriptions.Item>
          <Descriptions.Item label="回测区间">{result.start_date} 至 {result.end_date}</Descriptions.Item>
          <Descriptions.Item label="初始资金">¥{result.initial_cash.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{result.created_at}</Descriptions.Item>
        </Descriptions>
        
        {result.chart_image && (
          <>
            <Divider orientation="left">回测图表</Divider>
            <div className="chart-container" style={{ position: 'relative', margin: '16px 0' }}>
              {imageLoading && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin tip="图表加载中..." />
                </div>
              )}
              {imageError && (
                <Alert
                  message="图表加载失败"
                  description="无法显示回测图表，请尝试重新加载页面或重新执行回测"
                  type="error"
                  showIcon
                />
              )}
              <img
                src={`data:image/png;base64,${result.chart_image}`}
                alt="回测结果图表"
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  display: imageLoading ? 'none' : 'block'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <Tooltip title="全屏查看">
                  <Button 
                    icon={<FullscreenOutlined />} 
                    onClick={() => {
                      Modal.info({
                        title: '回测图表',
                        content: (
                          <div style={{ textAlign: 'center' }}>
                            <img
                              src={`data:image/png;base64,${result.chart_image}`}
                              alt="回测结果图表全屏"
                              style={{ width: '100%', maxWidth: '100%', height: 'auto' }}
                            />
                          </div>
                        ),
                        width: '90%',
                        maskClosable: true,
                        okText: '关闭'
                      });
                    }}
                  >
                    全屏查看
                  </Button>
                </Tooltip>
              </div>
            </div>
          </>
        )}
        
        {result.trades && result.trades.length > 0 && (
          <>
            <Divider orientation="left">交易记录</Divider>
            <Table
              columns={tradeColumns}
              dataSource={result.trades.map((trade, index) => ({ ...trade, key: index }))}
              className="trades-table"
              scroll={{ x: 'max-content' }}
              pagination={{
                pageSize: 10,
                showSizeChanger: false
              }}
            />
          </>
        )}
        
        {result.debug_info && (
          <>
            <Divider orientation="left">调试信息</Divider>
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 3 }} className="debug-descriptions">
              <Descriptions.Item label="数据长度">{result.debug_info.data_length} 条记录</Descriptions.Item>
              <Descriptions.Item label="数据日期范围">{result.debug_info.data_range}</Descriptions.Item>
              <Descriptions.Item label="是否有交易">
                {result.debug_info.has_trades ? 
                  <Tag color="green">是</Tag> : 
                  <Tag color="red">否</Tag>
                }
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>
    </div>
  );
};

export default BacktestResult; 