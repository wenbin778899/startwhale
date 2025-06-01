import React, { useState } from 'react';
import { 
  Table, Button, Space, Modal, Form, 
  Input, InputNumber, message, Tag, Tooltip, 
  Popconfirm, Typography 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined,
  TransactionOutlined
} from '@ant-design/icons';
import { 
  addPortfolioStock, updatePortfolioStock, 
  deletePortfolioStock, createTradeRecord 
} from '../../api/portfolio';
import { searchStock } from '../../api/stock';
import Decimal from 'decimal.js';

const { Search } = Input;
const { Text } = Typography;

const StockDetails = ({ portfolioId, stocks = [], refreshDetail }) => {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [currentStock, setCurrentStock] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [tradeForm] = Form.useForm();

  // 搜索股票
  const handleSearchStock = async (value) => {
    if (!value) return;
    
    setSearchLoading(true);
    try {
      const response = await searchStock(value);
      if (response.code === 0) {
        setSearchResults(response.data || []);
      } else {
        message.error(response.message || '搜索股票失败');
      }
    } catch (error) {
      console.error('搜索股票出错:', error);
      message.error('搜索股票失败，请稍后重试');
    } finally {
      setSearchLoading(false);
    }
  };

  // 选择搜索结果中的股票
  const handleSelectStock = (stock) => {
    addForm.setFieldsValue({
      stock_code: stock.代码,
      stock_name: stock.名称
    });
    setSearchResults([]);
  };

  // 添加股票到持仓
  const handleAddStock = async (values) => {
    setLoading(true);
    try {
      // 验证股票代码格式
      const stockCode = values.stock_code;
      if (!stockCode.match(/^[0-9]{6}$/)) {
        message.error('股票代码格式不正确，应为6位数字');
        setLoading(false);
        return;
      }
      
      // 确保数值类型正确，使用Decimal进行精确计算
      const formattedValues = {
        ...values,
        total_shares: values.total_shares.toString(),
        avg_cost_price: values.avg_cost_price.toString(),
        current_price: values.current_price ? values.current_price.toString() : "0",
        trade_fee: values.trade_fee ? values.trade_fee.toString() : "0"
      };
      
      const response = await addPortfolioStock(portfolioId, formattedValues);
      if (response.code === 0) {
        message.success('添加股票成功');
        setAddModalVisible(false);
        addForm.resetFields();
        refreshDetail();
      } else {
        message.error(response.message || '添加股票失败');
        console.error('添加股票响应错误:', response);
      }
    } catch (error) {
      console.error('添加股票出错:', error);
      message.error(`添加股票失败: ${error.message || '请稍后重试'}`);
    } finally {
      setLoading(false);
    }
  };

  // 更新持仓股票
  const handleEditStock = async (values) => {
    if (!currentStock) return;
    
    setLoading(true);
    try {
      // 使用字符串形式传递数值，确保精度保持
      const formattedValues = {
        ...values,
        total_shares: values.total_shares.toString(),
        avg_cost_price: values.avg_cost_price.toString(),
        current_price: values.current_price ? values.current_price.toString() : "0"
      };
      
      const response = await updatePortfolioStock(portfolioId, currentStock.stock_code, formattedValues);
      if (response.code === 0) {
        message.success('更新股票成功');
        setEditModalVisible(false);
        refreshDetail();
      } else {
        message.error(response.message || '更新股票失败');
      }
    } catch (error) {
      console.error('更新股票出错:', error);
      message.error('更新股票失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除持仓股票
  const handleDeleteStock = async (stockCode) => {
    setLoading(true);
    try {
      const response = await deletePortfolioStock(portfolioId, stockCode);
      if (response.code === 0) {
        message.success('删除股票成功');
        refreshDetail();
      } else {
        message.error(response.message || '删除股票失败');
      }
    } catch (error) {
      console.error('删除股票出错:', error);
      message.error('删除股票失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 创建交易记录
  const handleTradeSubmit = async (values) => {
    if (!currentStock) return;
    
    // 添加股票代码和名称
    values.stock_code = currentStock.stock_code;
    values.stock_name = currentStock.stock_name;
    
    setLoading(true);
    try {
      const response = await createTradeRecord(portfolioId, values);
      if (response.code === 0) {
        message.success('交易记录已创建');
        setTradeModalVisible(false);
        tradeForm.resetFields();
        refreshDetail();
      } else {
        message.error(response.message || '创建交易记录失败');
      }
    } catch (error) {
      console.error('创建交易记录出错:', error);
      message.error('创建交易记录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
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
      title: '持有股数',
      dataIndex: 'total_shares',
      key: 'total_shares',
      render: (value) => Number(value).toLocaleString()
    },
    {
      title: '平均成本价(元)',
      dataIndex: 'avg_cost_price',
      key: 'avg_cost_price',
      render: (value) => Number(value).toFixed(2)
    },
    {
      title: '当前价格(元)',
      dataIndex: 'current_price',
      key: 'current_price',
      render: (value) => Number(value).toFixed(2)
    },
    {
      title: '持仓市值(元)',
      dataIndex: 'position_value',
      key: 'position_value',
      render: (value) => Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    {
      title: '盈亏金额(元)',
      dataIndex: 'profit_loss',
      key: 'profit_loss',
      render: (value) => (
        <span style={{ color: Number(value) >= 0 ? '#52c41a' : '#f5222d' }}>
          {Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      title: '盈亏率',
      dataIndex: 'profit_loss_rate',
      key: 'profit_loss_rate',
      render: (value) => (
        <Tag color={Number(value) >= 0 ? 'green' : 'red'}>
          {(Number(value) * 100).toFixed(2)}%
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => {
                setCurrentStock(record);
                editForm.setFieldsValue({
                  total_shares: record.total_shares,
                  avg_cost_price: record.avg_cost_price,
                  current_price: record.current_price
                });
                setEditModalVisible(true);
              }} 
            />
          </Tooltip>
          <Tooltip title="交易">
            <Button 
              type="text" 
              icon={<TransactionOutlined />} 
              onClick={() => {
                setCurrentStock(record);
                tradeForm.resetFields();
                setTradeModalVisible(true);
              }} 
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定删除此股票吗?"
              onConfirm={() => handleDeleteStock(record.stock_code)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    },
  ];

  return (
    <div className="stock-details">
      <div className="action-bar" style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => {
            addForm.resetFields();
            setAddModalVisible(true);
          }}
        >
          添加股票
        </Button>
      </div>

      <Table 
        dataSource={stocks} 
        columns={columns} 
        rowKey="id" 
        pagination={false}
        loading={loading}
        locale={{ emptyText: '暂无持仓股票，请点击"添加股票"按钮添加' }}
      />

      {/* 添加股票模态框 */}
      <Modal
        title="添加股票到持仓"
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddStock}
        >
          <Form.Item label="搜索股票代码或名称">
            <Search
              placeholder="输入股票代码或名称"
              onSearch={handleSearchStock}
              loading={searchLoading}
              enterButton
            />
            {searchResults.length > 0 && (
              <div className="search-results">
                <ul>
                  {searchResults.map((stock) => (
                    <li 
                      key={stock.代码} 
                      onClick={() => handleSelectStock(stock)}
                    >
                      {stock.名称}（{stock.代码}）
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Form.Item>
          <Form.Item
            name="stock_code"
            label="股票代码"
            rules={[{ required: true, message: '请输入股票代码' }]}
          >
            <Input placeholder="请输入股票代码" />
          </Form.Item>
          <Form.Item
            name="stock_name"
            label="股票名称"
            rules={[{ required: true, message: '请输入股票名称' }]}
          >
            <Input placeholder="请输入股票名称" />
          </Form.Item>
          <Form.Item
            name="total_shares"
            label="持有股数"
            rules={[{ required: true, message: '请输入持有股数' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入持有股数" />
          </Form.Item>
          <Form.Item
            name="avg_cost_price"
            label="平均成本价(元)"
            rules={[{ required: true, message: '请输入平均成本价' }]}
          >
            <InputNumber min={0.01} step={0.01} precision={2} style={{ width: '100%' }} placeholder="请输入平均成本价" />
          </Form.Item>
          <Form.Item
            name="current_price"
            label="当前价格(元)"
          >
            <InputNumber min={0.01} step={0.01} precision={2} style={{ width: '100%' }} placeholder="请输入当前价格（可选）" />
          </Form.Item>
          <Form.Item
            name="trade_fee"
            label="交易费用(元)"
          >
            <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} placeholder="请输入交易费用（可选）" />
          </Form.Item>
          <Form.Item
            name="trade_note"
            label="交易备注"
          >
            <Input.TextArea placeholder="请输入交易备注（可选）" rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              添加
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑股票模态框 */}
      <Modal
        title="编辑持仓股票"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        {currentStock && (
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditStock}
          >
            <div className="stock-info">
              <Text strong>{currentStock.stock_name}</Text>
              <Text type="secondary">({currentStock.stock_code})</Text>
            </div>
            <Form.Item
              name="total_shares"
              label="持有股数"
              rules={[{ required: true, message: '请输入持有股数' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入持有股数" />
            </Form.Item>
            <Form.Item
              name="avg_cost_price"
              label="平均成本价(元)"
              rules={[{ required: true, message: '请输入平均成本价' }]}
            >
              <InputNumber min={0.01} step={0.01} precision={2} style={{ width: '100%' }} placeholder="请输入平均成本价" />
            </Form.Item>
            <Form.Item
              name="current_price"
              label="当前价格(元)"
            >
              <InputNumber min={0.01} step={0.01} precision={2} style={{ width: '100%' }} placeholder="请输入当前价格" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                更新
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 交易模态框 */}
      <Modal
        title="创建交易记录"
        visible={tradeModalVisible}
        onCancel={() => setTradeModalVisible(false)}
        footer={null}
      >
        {currentStock && (
          <Form
            form={tradeForm}
            layout="vertical"
            onFinish={handleTradeSubmit}
          >
            <div className="stock-info">
              <Text strong>{currentStock.stock_name}</Text>
              <Text type="secondary">({currentStock.stock_code})</Text>
            </div>
            <Form.Item
              name="trade_type"
              label="交易类型"
              rules={[{ required: true, message: '请选择交易类型' }]}
              initialValue="buy"
            >
              <Space>
                <Button 
                  type={tradeForm.getFieldValue('trade_type') === 'buy' ? 'primary' : 'default'}
                  onClick={() => tradeForm.setFieldsValue({ trade_type: 'buy' })}
                >
                  买入
                </Button>
                <Button 
                  type={tradeForm.getFieldValue('trade_type') === 'sell' ? 'primary' : 'default'} 
                  danger={tradeForm.getFieldValue('trade_type') === 'sell'}
                  onClick={() => tradeForm.setFieldsValue({ trade_type: 'sell' })}
                >
                  卖出
                </Button>
              </Space>
            </Form.Item>
            <Form.Item
              name="trade_price"
              label="交易价格(元)"
              rules={[{ required: true, message: '请输入交易价格' }]}
              initialValue={currentStock.current_price > 0 ? currentStock.current_price : currentStock.avg_cost_price}
            >
              <InputNumber min={0.01} step={0.01} precision={2} style={{ width: '100%' }} placeholder="请输入交易价格" />
            </Form.Item>
            <Form.Item
              name="trade_shares"
              label="交易股数"
              rules={[
                { required: true, message: '请输入交易股数' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (getFieldValue('trade_type') === 'sell' && value > currentStock.total_shares) {
                      return Promise.reject(new Error(`卖出股数不能超过持仓股数(${currentStock.total_shares})`));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入交易股数" />
            </Form.Item>
            <Form.Item
              name="trade_fee"
              label="交易费用(元)"
            >
              <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} placeholder="请输入交易费用" />
            </Form.Item>
            <Form.Item
              name="trade_note"
              label="交易备注"
            >
              <Input.TextArea placeholder="请输入交易备注" rows={3} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                提交交易
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default StockDetails; 