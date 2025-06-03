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
  Typography
} from 'antd';
import {
  LineChartOutlined,
  DeleteOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ExperimentOutlined,
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { getBacktestHistory, deleteBacktest } from '../../../api/strategy';

const { Text, Title } = Typography;

const BacktestHistory = ({ onViewDetail, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

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
              renderItem={record => (
                <Card 
                  className="history-item"
                  key={record.id}
                >
                  <div className="history-item-header">
                    <div className="history-item-title">
                      <ExperimentOutlined style={{ marginRight: 8 }} />
                      {record.strategy_name} - {record.stock_code} {record.stock_name}
                    </div>
                    {renderReturnTag(record.total_return)}
                  </div>
                  
                  <div className="history-item-content">
                    <div className="history-item-stat">
                      <Text type="secondary">总收益率:</Text> 
                      <Text className={record.total_return > 0 ? 'profit-positive' : 'profit-negative'}>
                        {record.total_return > 0 ? '+' : ''}{record.total_return.toFixed(2)}%
                      </Text>
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
                    </div>
                    <div className="history-item-stat">
                      <Text type="secondary">交易次数:</Text> 
                      <Text>{record.trade_count}</Text>
                    </div>
                    <div className="history-item-stat">
                      <Text type="secondary">胜率:</Text> 
                      <Text>{record.win_rate.toFixed(2)}%</Text>
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
                    <div className="history-item-stat">
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
                  
                  <Divider style={{ margin: '12px 0' }} />
                  
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
              )}
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