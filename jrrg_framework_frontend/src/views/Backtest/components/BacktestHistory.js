import React, { useState, useEffect } from 'react';
import {
  List,
  Card,
  Button,
  Tooltip,
  Tag,
  Divider,
  message,
  Pagination,
  Spin,
  Empty,
  Popconfirm,
  Typography,
  Collapse,
  Skeleton,
  Modal,
  Progress,
  Badge
} from 'antd';
import {
  LineChartOutlined,
  DeleteOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ExperimentOutlined,
  CalendarOutlined,
  DollarOutlined,
  PictureOutlined,
  FullscreenOutlined,
  LoadingOutlined,
  TrophyOutlined,
  TransactionOutlined
} from '@ant-design/icons';
import { getBacktestHistory, deleteBacktest, getBacktestDetail } from '../../../api/strategy';

const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

const BacktestHistory = ({ onViewDetail, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [recordCharts, setRecordCharts] = useState({});

  // 加载回测历史记录
  useEffect(() => {
    loadBacktestHistory();
  }, [pagination.current]);

  // 加载回测历史数据
  const loadBacktestHistory = async () => {
    try {
      setLoading(true);
      const offset = (pagination.current - 1) * pagination.pageSize;
      const response = await getBacktestHistory(pagination.pageSize, offset);
      
      if (response && response.data) {
        setRecords(response.data.records || []);
        setPagination({
          ...pagination,
          total: response.data.total || 0
        });
      }
    } catch (error) {
      console.error('获取回测历史记录失败:', error);
      message.error('获取回测历史记录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理页码变化
  const handlePageChange = (page) => {
    setPagination({
      ...pagination,
      current: page
    });
  };

  // 处理删除回测记录
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteBacktest(id);
      message.success('删除回测记录成功');
      loadBacktestHistory();
      if (onDelete) onDelete();
    } catch (error) {
      console.error('删除回测记录失败:', error);
      message.error('删除回测记录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 渲染收益率标签
  const renderReturnTag = (value) => {
    if (value > 0) {
      return (
        <Tag color="red">
          <ArrowUpOutlined /> {value.toFixed(2)}%
        </Tag>
      );
    } else if (value < 0) {
      return (
        <Tag color="green">
          <ArrowDownOutlined /> {Math.abs(value).toFixed(2)}%
        </Tag>
      );
    } else {
      return <Tag color="gray">0.00%</Tag>;
    }
  };

  // 加载回测图表
  const loadBacktestChart = async (recordId) => {
    // 如果已经加载过，就不再加载
    if (recordCharts[recordId]) {
      return;
    }

    try {
      setChartLoading(true);
      const response = await getBacktestDetail(recordId);
      
      if (response && response.data && response.data.chart_image) {
        setRecordCharts(prev => ({
          ...prev,
          [recordId]: response.data.chart_image
        }));
      }
    } catch (error) {
      console.error('获取回测图表失败:', error);
      message.error('获取回测图表失败');
    } finally {
      setChartLoading(false);
    }
  };

  // 处理展开回测记录
  const handleExpandRecord = (recordId) => {
    if (expandedRecord === recordId) {
      setExpandedRecord(null);
    } else {
      setExpandedRecord(recordId);
      loadBacktestChart(recordId);
    }
  };

  // 显示图表全屏
  const showFullScreenChart = (chartImage) => {
    Modal.info({
      title: '回测图表',
      content: (
        <div style={{ textAlign: 'center' }}>
          <img
            src={`data:image/png;base64,${chartImage}`}
            alt="回测结果图表全屏"
            style={{ width: '100%', maxWidth: '100%', height: 'auto' }}
          />
        </div>
      ),
      width: '90%',
      maskClosable: true,
      okText: '关闭'
    });
  };
  
  // 获取绩效评级
  const getPerformanceRating = (record) => {
    const totalReturn = record.total_return;
    const winRate = record.win_rate;
    const sharpeRatio = record.sharpe_ratio;
    
    // 简单评分系统
    let score = 0;
    
    // 根据总收益率评分
    if (totalReturn >= 20) score += 3;
    else if (totalReturn >= 10) score += 2;
    else if (totalReturn >= 0) score += 1;
    
    // 根据胜率评分
    if (winRate >= 70) score += 3;
    else if (winRate >= 55) score += 2;
    else if (winRate >= 40) score += 1;
    
    // 根据夏普比率评分
    if (sharpeRatio >= 2) score += 3;
    else if (sharpeRatio >= 1) score += 2;
    else if (sharpeRatio >= 0) score += 1;
    
    // 返回评级和颜色
    if (score >= 7) return { rating: '优秀', color: '#52c41a' };
    else if (score >= 5) return { rating: '良好', color: '#1890ff' };
    else if (score >= 3) return { rating: '一般', color: '#faad14' };
    else return { rating: '较差', color: '#ff4d4f' };
  };

  return (
    <div className="backtest-history">
      <Spin spinning={loading}>
        {records.length === 0 ? (
          <Empty
            description="暂无回测记录"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            <List
              dataSource={records}
              renderItem={(record, index) => {
                const performanceRating = getPerformanceRating(record);
                return (
                  <Card 
                    className="history-item"
                    key={record.id}
                    style={{ 
                      animation: `fadeInUp 0.3s ease-out ${index * 0.1}s both`
                    }}
                  >
                    <div className="history-item-header">
                      <div className="history-item-title">
                        <ExperimentOutlined style={{ marginRight: 8 }} />
                        {record.strategy_name} - {record.stock_code} {record.stock_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Badge 
                          text={performanceRating.rating} 
                          color={performanceRating.color} 
                          style={{ fontSize: '12px', padding: '0 8px' }} 
                        />
                        {renderReturnTag(record.total_return)}
                      </div>
                    </div>
                    
                    <div className="history-item-content">
                      <div className="history-item-stat">
                        <Text type="secondary">总收益率:</Text> 
                        <Text className={record.total_return > 0 ? 'profit-positive' : 'profit-negative'}>
                          {record.total_return > 0 ? '+' : ''}{record.total_return.toFixed(2)}%
                        </Text>
                        {record.total_return !== 0 && (
                          <Progress 
                            percent={Math.min(Math.abs(record.total_return), 100)} 
                            showInfo={false} 
                            strokeColor={record.total_return > 0 ? '#ff4d4f' : '#52c41a'}
                            size="small"
                            style={{ marginTop: 4 }}
                          />
                        )}
                      </div>
                      <div className="history-item-stat">
                        <Text type="secondary">年化收益:</Text> 
                        <Text className={record.annual_return > 0 ? 'profit-positive' : 'profit-negative'}>
                          {record.annual_return > 0 ? '+' : ''}{record.annual_return.toFixed(2)}%
                        </Text>
                      </div>
                      <div className="history-item-stat">
                        <Text type="secondary">最大回撤:</Text> 
                        <Text>{record.max_drawdown.toFixed(2)}%</Text>
                        {record.max_drawdown > 0 && (
                          <Progress 
                            percent={Math.min(record.max_drawdown, 100)} 
                            showInfo={false} 
                            strokeColor="#cf1322"
                            size="small"
                            style={{ marginTop: 4 }}
                          />
                        )}
                      </div>
                      <div className="history-item-stat">
                        <Text type="secondary">交易次数:</Text> 
                        <Text>
                          <TransactionOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                          {record.trade_count}
                        </Text>
                      </div>
                      <div className="history-item-stat">
                        <Text type="secondary">胜率:</Text> 
                        <Text>
                          <TrophyOutlined style={{ marginRight: 4, color: '#faad14' }} />
                          {record.win_rate.toFixed(2)}%
                        </Text>
                        <Progress 
                          percent={record.win_rate} 
                          showInfo={false} 
                          strokeColor={
                            record.win_rate >= 60 ? '#52c41a' : 
                            record.win_rate >= 40 ? '#1890ff' : '#faad14'
                          }
                          size="small"
                          style={{ marginTop: 4 }}
                        />
                      </div>
                      <div className="history-item-stat">
                        <Text type="secondary">初始资金:</Text> 
                        <Text>￥{record.initial_cash.toLocaleString()}</Text>
                      </div>
                      <div className="history-item-stat">
                        <Text type="secondary">最终价值:</Text> 
                        <Text>￥{record.final_value.toLocaleString()}</Text>
                      </div>
                      <div className="history-item-stat">
                        <Text type="secondary">夏普比率:</Text> 
                        <Text>{record.sharpe_ratio.toFixed(2)}</Text>
                      </div>
                      <div className="history-item-stat" style={{ gridColumn: 'span 2' }}>
                        <CalendarOutlined style={{ marginRight: 4 }} />
                        <Text type="secondary">
                          {record.start_date} 至 {record.end_date}
                        </Text>
                      </div>
                      <div className="history-item-stat">
                        <Text type="secondary">创建时间:</Text> 
                        <Text>{record.created_at}</Text>
                      </div>
                    </div>
                    
                    {/* 图表预览展开区域 */}
                    <div className="chart-preview">
                      <Button 
                        type="link" 
                        icon={<PictureOutlined />} 
                        onClick={() => handleExpandRecord(record.id)}
                        style={{ padding: 0, margin: '8px 0' }}
                      >
                        {expandedRecord === record.id ? '收起图表' : '展开图表预览'}
                      </Button>
                      
                      {expandedRecord === record.id && (
                        <div className="chart-container" style={{ marginTop: 8 }}>
                          {chartLoading ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} tip="加载图表中..." />
                            </div>
                          ) : recordCharts[record.id] ? (
                            <div>
                              <div style={{ textAlign: 'center', position: 'relative' }}>
                                <img 
                                  src={`data:image/png;base64,${recordCharts[record.id]}`}
                                  alt="回测图表预览" 
                                  style={{ maxWidth: '100%', height: 'auto' }}
                                />
                                <Button
                                  type="primary"
                                  icon={<FullscreenOutlined />}
                                  style={{ position: 'absolute', right: 10, top: 10, opacity: 0.8 }}
                                  onClick={() => showFullScreenChart(recordCharts[record.id])}
                                >
                                  全屏查看
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Empty description="无图表数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <Divider style={{ margin: '8px 0' }} />
                    
                    <div className="history-item-actions">
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={() => onViewDetail(record.id)}
                        style={{ marginRight: 8 }}
                      >
                        查看详情
                      </Button>
                      <Popconfirm
                        title="确定删除此回测记录吗？"
                        onConfirm={() => handleDelete(record.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    </div>
                  </Card>
                );
              }}
            />
            
            {pagination.total > pagination.pageSize && (
              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        )}
      </Spin>
    </div>
  );
};

export default BacktestHistory; 