import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, message, DatePicker } from 'antd';
import { getTradeRecords } from '../../api/portfolio';
import { RedoOutlined, StockOutlined, BankOutlined } from '@ant-design/icons';
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
        // 确保响应数据是数组
        setTradeRecords(Array.isArray(response.data) ? response.data : []);
      } else {
        message.error(response.message || '获取交易记录失败');
        setTradeRecords([]); // 设置为空数组
      }
    } catch (error) {
      console.error('获取交易记录出错:', error);
      message.error('获取交易记录失败，请稍后重试');
      setTradeRecords([]); // 设置为空数组
    } finally {
      setLoading(false);
    }
  };

  // 过滤交易记录
  const getFilteredData = () => {
    // 确保tradeRecords是数组
    const safeTradeRecords = Array.isArray(tradeRecords) ? tradeRecords : [];
    
    if (!dateRange) return safeTradeRecords;

    const [startDate, endDate] = dateRange;
    return safeTradeRecords.filter(record => {
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
      title: '资产类型',
      dataIndex: 'asset_type',
      key: 'asset_type',
      render: (type) => (
        <Tag color={type === 'stock' ? 'blue' : 'green'} icon={type === 'stock' ? <StockOutlined /> : <BankOutlined />}>
          {type === 'stock' ? '股票' : '基金'}
        </Tag>
      ),
      filters: [
        { text: '股票', value: 'stock' },
        { text: '基金', value: 'fund' },
      ],
      onFilter: (value, record) => record.asset_type === value,
      width: 100,
    },
    {
      title: '代码',
      dataIndex: 'asset_code',
      key: 'asset_code',
      width: 100,
    },
    {
      title: '名称',
      dataIndex: 'asset_name',
      key: 'asset_name',
      ellipsis: true,
    },
    {
      title: '交易类型',
      dataIndex: 'trade_type',
      key: 'trade_type',
      render: (type, record) => {
        let text = '';
        let color = '';
        
        if (record.asset_type === 'stock') {
          text = type === 'buy' ? '买入' : '卖出';
          color = type === 'buy' ? 'blue' : 'red';
        } else {
          text = type === 'buy' ? '申购' : '赎回';
          color = type === 'buy' ? 'green' : 'orange';
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: '买入/申购', value: 'buy' },
        { text: '卖出/赎回', value: 'sell' },
      ],
      onFilter: (value, record) => record.trade_type === value,
      width: 100,
    },
    {
      title: '价格/净值(元)',
      dataIndex: 'trade_price',
      key: 'trade_price',
      render: (value, record) => {
        const precision = record.asset_type === 'fund' ? 4 : 2;
        return Number(value).toFixed(precision);
      },
      sorter: (a, b) => a.trade_price - b.trade_price,
      width: 120,
    },
    {
      title: '数量',
      dataIndex: 'trade_quantity',
      key: 'trade_quantity',
      render: (value, record) => {
        const unit = record.asset_type === 'stock' ? '股' : '份';
        return `${Number(value).toLocaleString()} ${unit}`;
      },
      sorter: (a, b) => a.trade_quantity - b.trade_quantity,
      width: 120,
    },
    {
      title: '交易金额(元)',
      dataIndex: 'trade_amount',
      key: 'trade_amount',
      render: (value) => Number(value).toLocaleString('zh-CN', { 
        style: 'currency', 
        currency: 'CNY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      }),
      sorter: (a, b) => Number(a.trade_amount) - Number(b.trade_amount),
      width: 140,
    },
    {
      title: '交易费用(元)',
      dataIndex: 'trade_fee',
      key: 'trade_fee',
      render: (value) => Number(value).toLocaleString('zh-CN', { 
        style: 'currency', 
        currency: 'CNY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      }),
      width: 120,
    },
    {
      title: '交易备注',
      dataIndex: 'trade_note',
      key: 'trade_note',
      ellipsis: true,
      render: (text) => text || '-',
    },
  ];

  return (
    <div className="trade-history">
      <div className="filter-bar" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <RangePicker 
            onChange={(dates) => setDateRange(dates)}
            allowClear
            placeholder={['开始日期', '结束日期']}
            style={{ marginRight: 16 }}
          />
          <span style={{ color: '#666', fontSize: '14px' }}>
            共 {getFilteredData().length} 条记录
          </span>
        </div>
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
        pagination={{ pageSize: 20, showSizeChanger: true, showQuickJumper: true }}
        loading={loading}
        locale={{ emptyText: '暂无交易记录' }}
        scroll={{ x: 'max-content' }}
        size="small"
      />
    </div>
  );
};

export default TradeHistory; 