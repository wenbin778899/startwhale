import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, message, DatePicker } from 'antd';
import { getTradeRecords } from '../../api/portfolio';
import { RedoOutlined } from '@ant-design/icons';
import moment from 'moment';

const { RangePicker } = DatePicker;

const TradeHistory = ({ portfolioId, refreshDetail }) => {
  const [tradeRecords, setTradeRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);

  // 获取交易记录
  const fetchTradeRecords = async () => {
    if (!portfolioId) return;
    
    setLoading(true);
    try {
      const response = await getTradeRecords(portfolioId);
      if (response.code === 0) {
        setTradeRecords(response.data);
      } else {
        message.error(response.message || '获取交易记录失败');
      }
    } catch (error) {
      console.error('获取交易记录出错:', error);
      message.error('获取交易记录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 过滤交易记录
  const getFilteredData = () => {
    if (!dateRange) return tradeRecords;

    const [startDate, endDate] = dateRange;
    return tradeRecords.filter(record => {
      const recordDate = moment(record.trade_time);
      return recordDate.isSameOrAfter(startDate, 'day') && 
             recordDate.isSameOrBefore(endDate, 'day');
    });
  };

  // 初始化加载
  useEffect(() => {
    fetchTradeRecords();
  }, [portfolioId]);

  // 表格列定义
  const columns = [
    {
      title: '交易时间',
      dataIndex: 'trade_time',
      key: 'trade_time',
      render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => moment(a.trade_time).valueOf() - moment(b.trade_time).valueOf(),
      defaultSortOrder: 'descend'
    },
    {
      title: '股票代码',
      dataIndex: 'stock_code',
      key: 'stock_code',
    },
    {
      title: '股票名称',
      dataIndex: 'stock_name',
      key: 'stock_name',
    },
    {
      title: '交易类型',
      dataIndex: 'trade_type',
      key: 'trade_type',
      render: (type) => (
        <Tag color={type === 'buy' ? 'blue' : 'red'}>
          {type === 'buy' ? '买入' : '卖出'}
        </Tag>
      ),
      filters: [
        { text: '买入', value: 'buy' },
        { text: '卖出', value: 'sell' },
      ],
      onFilter: (value, record) => record.trade_type === value,
    },
    {
      title: '交易价格(元)',
      dataIndex: 'trade_price',
      key: 'trade_price',
      render: (value) => Number(value).toFixed(2),
      sorter: (a, b) => a.trade_price - b.trade_price,
    },
    {
      title: '交易股数',
      dataIndex: 'trade_shares',
      key: 'trade_shares',
      render: (value) => Number(value).toLocaleString(),
      sorter: (a, b) => a.trade_shares - b.trade_shares,
    },
    {
      title: '交易金额(元)',
      dataIndex: 'trade_amount',
      key: 'trade_amount',
      render: (value) => value.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' }),
      sorter: (a, b) => a.trade_amount - b.trade_amount,
    },
    {
      title: '交易费用(元)',
      dataIndex: 'trade_fee',
      key: 'trade_fee',
      render: (value) => value.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' }),
    },
    {
      title: '交易备注',
      dataIndex: 'trade_note',
      key: 'trade_note',
      ellipsis: true,
    },
  ];

  return (
    <div className="trade-history">
      <div className="filter-bar" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <RangePicker 
          onChange={(dates) => setDateRange(dates)}
          allowClear
          placeholder={['开始日期', '结束日期']}
          style={{ marginRight: 16 }}
        />
        <Button 
          type="primary" 
          icon={<RedoOutlined />} 
          onClick={fetchTradeRecords}
        >
          刷新
        </Button>
      </div>

      <Table 
        dataSource={getFilteredData()} 
        columns={columns} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
        loading={loading}
        locale={{ emptyText: '暂无交易记录' }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default TradeHistory; 