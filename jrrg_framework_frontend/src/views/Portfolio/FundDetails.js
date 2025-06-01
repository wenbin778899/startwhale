import React, { useState } from 'react';
import { 
  Table, Button, Space, Modal, Form, 
  Input, InputNumber, message, Tag, Tooltip, 
  Popconfirm, Typography, Select 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined,
  TransactionOutlined, BankOutlined
} from '@ant-design/icons';
import {
  addPortfolioFund, updatePortfolioFund, deletePortfolioFund,
  createFundTradeRecord, getFundNav, getFundInfo
} from '../../api/fund';
import Decimal from 'decimal.js';

const { Search } = Input;
const { Text } = Typography;
const { Option } = Select;

const FundDetails = ({ portfolioId, funds = [], refreshDetail }) => {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [currentFund, setCurrentFund] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [tradeForm] = Form.useForm();

  // 确保funds始终是数组
  const safeFunds = Array.isArray(funds) ? funds : [];

  // 基金类型选项
  const fundTypes = [
    { value: 'stock', label: '股票型基金' },
    { value: 'bond', label: '债券型基金' },
    { value: 'mixed', label: '混合型基金' },
    { value: 'index', label: '指数型基金' },
    { value: 'money', label: '货币型基金' },
    { value: 'qdii', label: 'QDII基金' },
    { value: 'etf', label: 'ETF基金' },
    { value: 'lof', label: 'LOF基金' }
  ];

  // 获取基金净值和基本信息
  const handleGetFundNav = async (fundCode) => {
    try {
      message.loading('正在获取基金信息...', 0);
      
      // 同时获取净值和基金基本信息
      const [navResponse, infoResponse] = await Promise.allSettled([
        getFundNav(fundCode),
        getFundInfo(fundCode)
      ]);
      
      message.destroy(); // 关闭loading消息
      
      let navData = null;
      let fundInfo = null;
      
      // 处理净值数据
      if (navResponse.status === 'fulfilled' && navResponse.value && navResponse.value.code === 0) {
        navData = navResponse.value.data;
      }
      
      // 处理基金信息数据  
      if (infoResponse.status === 'fulfilled' && infoResponse.value && infoResponse.value.code === 0) {
        fundInfo = infoResponse.value.data;
      }
      
      // 填入表单数据
      const formData = {};
      
      // 填入净值
      if (navData && navData.unit_nav) {
        formData.current_nav = navData.unit_nav;
        message.success(`获取${fundCode}最新净值: ${navData.unit_nav}`);
      } else {
        message.warning('获取基金净值失败，请手动输入');
      }
      
      // 填入基金名称
      if (fundInfo) {
        if (fundInfo['基金名称'] || fundInfo['基金简称']) {
          formData.fund_name = fundInfo['基金名称'] || fundInfo['基金简称'];
        }
        
        // 根据基金信息推断基金类型
        const fundTypeName = fundInfo['基金类型'] || fundInfo['投资类型'] || '';
        let fundType = 'mixed'; // 默认混合型
        
        if (fundTypeName.includes('股票')) {
          fundType = 'stock';
        } else if (fundTypeName.includes('债券')) {
          fundType = 'bond';
        } else if (fundTypeName.includes('指数') || fundTypeName.includes('ETF')) {
          fundType = 'index';
        } else if (fundTypeName.includes('货币')) {
          fundType = 'money';
        } else if (fundTypeName.includes('QDII')) {
          fundType = 'qdii';
        } else if (fundTypeName.includes('ETF')) {
          fundType = 'etf';
        } else if (fundTypeName.includes('LOF')) {
          fundType = 'lof';
        }
        
        formData.fund_type = fundType;
        
        if (fundInfo['基金名称'] || fundInfo['基金简称']) {
          message.success('成功获取基金名称和类型');
        }
      } else {
        message.warning('获取基金信息失败，请手动输入名称和类型');
      }
      
      // 批量设置表单字段
      addForm.setFieldsValue(formData);
      
      return { navData, fundInfo };
      
    } catch (error) {
      message.destroy(); // 关闭loading消息
      console.error('获取基金信息出错:', error);
      message.error('获取基金信息失败，请手动输入');
      return null;
    }
  };

  // 添加基金到持仓
  const handleAddFund = async (values) => {
    setLoading(true);
    try {
      // 验证基金代码格式
      const fundCode = values.fund_code;
      if (!fundCode.match(/^[0-9]{6}$/)) {
        message.error('基金代码格式不正确，应为6位数字');
        setLoading(false);
        return;
      }
      
      // 构造API请求数据，字段名匹配后端
      const requestData = {
        fund_code: values.fund_code,
        fund_name: values.fund_name,
        fund_type: values.fund_type,
        total_shares: values.total_shares,
        avg_cost_nav: values.avg_cost_price || values.avg_cost_nav, // 兼容字段名
        current_nav: values.current_nav || 0,
        trade_fee: values.trade_fee || 0
      };
      
      const response = await addPortfolioFund(portfolioId, requestData);
      
      if (response && response.code === 0) {
        message.success('添加基金成功');
        setAddModalVisible(false);
        addForm.resetFields();
        refreshDetail(); // 刷新数据
      } else {
        message.error(response.message || '添加基金失败');
      }
    } catch (error) {
      console.error('添加基金出错:', error);
      message.error(`添加基金失败: ${error.message || '请稍后重试'}`);
    } finally {
      setLoading(false);
    }
  };

  // 更新持仓基金
  const handleEditFund = async (values) => {
    if (!currentFund) return;
    
    setLoading(true);
    try {
      // 构造更新数据，字段名匹配后端
      const updateData = {
        total_shares: values.total_shares,
        avg_cost_nav: values.avg_cost_price || values.avg_cost_nav,
        current_nav: values.current_nav
      };
      
      const response = await updatePortfolioFund(portfolioId, currentFund.fund_code, updateData);
      
      if (response && response.code === 0) {
        message.success('更新基金成功');
        setEditModalVisible(false);
        refreshDetail(); // 刷新数据
      } else {
        message.error(response.message || '更新基金失败');
      }
    } catch (error) {
      console.error('更新基金出错:', error);
      message.error('更新基金失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除持仓基金
  const handleDeleteFund = async (fundCode) => {
    setLoading(true);
    try {
      const response = await deletePortfolioFund(portfolioId, fundCode);
      
      if (response && response.code === 0) {
        message.success('删除基金成功');
        refreshDetail(); // 刷新数据
      } else {
        message.error(response.message || '删除基金失败');
      }
    } catch (error) {
      console.error('删除基金出错:', error);
      message.error('删除基金失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 提交交易记录
  const handleTradeSubmit = async (values) => {
    setLoading(true);
    try {
      // 构造交易数据
      const tradeData = {
        trade_type: values.trade_type,
        trade_nav: values.trade_nav,
        trade_shares: values.trade_shares,
        trade_fee: values.trade_fee || 0,
        trade_note: values.trade_note
      };
      
      const response = await createFundTradeRecord(portfolioId, currentFund.fund_code, tradeData);
      
      if (response && response.code === 0) {
        message.success('交易记录创建成功');
        setTradeModalVisible(false);
        refreshDetail(); // 刷新数据
      } else {
        message.error(response.message || '创建交易记录失败');
      }
    } catch (error) {
      console.error('创建基金交易记录出错:', error);
      message.error('创建交易记录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '基金代码',
      dataIndex: 'fund_code',
      key: 'fund_code',
    },
    {
      title: '基金名称',
      dataIndex: 'fund_name',
      key: 'fund_name',
    },
    {
      title: '基金类型',
      dataIndex: 'fund_type',
      key: 'fund_type',
      render: (type) => {
        const fundType = fundTypes.find(t => t.value === type);
        return <Tag color="blue">{fundType ? fundType.label : type}</Tag>;
      }
    },
    {
      title: '持有份额',
      dataIndex: 'total_shares',
      key: 'total_shares',
      render: (value) => Number(value).toLocaleString()
    },
    {
      title: '平均成本(元)',
      dataIndex: 'avg_cost_price',
      key: 'avg_cost_price',
      render: (value) => Number(value).toFixed(4)
    },
    {
      title: '当前净值(元)',
      dataIndex: 'current_nav',
      key: 'current_nav',
      render: (value) => Number(value).toFixed(4)
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
      render: (value) => {
        const numValue = Number(value);
        let color = '#8c8c8c'; // 默认灰色
        if (numValue > 0) color = '#f5222d'; // 红色表示盈利
        else if (numValue < 0) color = '#52c41a'; // 绿色表示亏损
        
        return (
          <span style={{ color }}>
            {numValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      title: '盈亏率',
      dataIndex: 'profit_loss_rate',
      key: 'profit_loss_rate',
      render: (value) => {
        const numValue = Number(value);
        let color = 'default'; // 默认灰色
        if (numValue > 0) color = 'red'; // 红色表示盈利
        else if (numValue < 0) color = 'green'; // 绿色表示亏损
        
        return (
          <Tag color={color}>
            {(numValue * 100).toFixed(2)}%
          </Tag>
        );
      }
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
                setCurrentFund(record);
                editForm.setFieldsValue({
                  total_shares: record.total_shares,
                  avg_cost_price: record.avg_cost_price,
                  current_nav: record.current_nav
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
                setCurrentFund(record);
                tradeForm.resetFields();
                setTradeModalVisible(true);
              }} 
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定删除此基金吗?"
              onConfirm={() => handleDeleteFund(record.fund_code)}
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
    <div className="fund-details">
      <div className="action-bar" style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => {
            addForm.resetFields();
            setAddModalVisible(true);
          }}
        >
          添加基金
        </Button>
      </div>

      <Table 
        dataSource={safeFunds} 
        columns={columns} 
        rowKey="id" 
        pagination={false}
        loading={loading}
        locale={{ emptyText: '暂无持仓基金，请点击"添加基金"按钮添加' }}
      />

      {/* 添加基金模态框 */}
      <Modal
        title="添加基金到持仓"
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddFund}
        >
          <Form.Item
            name="fund_code"
            label="基金代码"
            rules={[{ required: true, message: '请输入基金代码' }]}
          >
            <Input 
              placeholder="请输入6位基金代码" 
              addonAfter={
                <Button 
                  size="small" 
                  onClick={() => {
                    const fundCode = addForm.getFieldValue('fund_code');
                    if (fundCode && fundCode.match(/^[0-9]{6}$/)) {
                      handleGetFundNav(fundCode);
                    } else {
                      message.error('请先输入正确的基金代码');
                    }
                  }}
                >
                  获取净值
                </Button>
              }
            />
          </Form.Item>
          <Form.Item
            name="fund_name"
            label="基金名称"
            rules={[{ required: true, message: '请输入基金名称' }]}
          >
            <Input placeholder="请输入基金名称" />
          </Form.Item>
          <Form.Item
            name="fund_type"
            label="基金类型"
            rules={[{ required: true, message: '请选择基金类型' }]}
          >
            <Select placeholder="请选择基金类型">
              {fundTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="total_shares"
            label="持有份额"
            rules={[{ required: true, message: '请输入持有份额' }]}
          >
            <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} placeholder="请输入持有份额" />
          </Form.Item>
          <Form.Item
            name="avg_cost_price"
            label="平均成本净值(元)"
            rules={[{ required: true, message: '请输入平均成本净值' }]}
          >
            <InputNumber min={0.0001} step={0.0001} precision={4} style={{ width: '100%' }} placeholder="请输入平均成本净值" />
          </Form.Item>
          <Form.Item
            name="current_nav"
            label="当前净值(元)"
          >
            <InputNumber min={0.0001} step={0.0001} precision={4} style={{ width: '100%' }} placeholder="请输入当前净值" />
          </Form.Item>
          <Form.Item
            name="trade_fee"
            label="交易费用(元)"
          >
            <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} placeholder="请输入交易费用" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              添加
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑基金模态框 */}
      <Modal
        title="编辑持仓基金"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        {currentFund && (
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditFund}
          >
            <div className="fund-info" style={{ marginBottom: 16 }}>
              <Text strong>{currentFund.fund_name}</Text>
              <Text type="secondary">({currentFund.fund_code})</Text>
            </div>
            <Form.Item
              name="total_shares"
              label="持有份额"
              rules={[{ required: true, message: '请输入持有份额' }]}
            >
              <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} placeholder="请输入持有份额" />
            </Form.Item>
            <Form.Item
              name="avg_cost_price"
              label="平均成本净值(元)"
              rules={[{ required: true, message: '请输入平均成本净值' }]}
            >
              <InputNumber min={0.0001} step={0.0001} precision={4} style={{ width: '100%' }} placeholder="请输入平均成本净值" />
            </Form.Item>
            <Form.Item
              name="current_nav"
              label="当前净值(元)"
            >
              <InputNumber min={0.0001} step={0.0001} precision={4} style={{ width: '100%' }} placeholder="请输入当前净值" />
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
        title="创建基金交易记录"
        visible={tradeModalVisible}
        onCancel={() => setTradeModalVisible(false)}
        footer={null}
      >
        {currentFund && (
          <Form
            form={tradeForm}
            layout="vertical"
            onFinish={handleTradeSubmit}
          >
            <div className="fund-info" style={{ marginBottom: 16 }}>
              <Text strong>{currentFund.fund_name}</Text>
              <Text type="secondary">({currentFund.fund_code})</Text>
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
                  申购
                </Button>
                <Button 
                  type={tradeForm.getFieldValue('trade_type') === 'sell' ? 'primary' : 'default'} 
                  danger={tradeForm.getFieldValue('trade_type') === 'sell'}
                  onClick={() => tradeForm.setFieldsValue({ trade_type: 'sell' })}
                >
                  赎回
                </Button>
              </Space>
            </Form.Item>
            <Form.Item
              name="trade_nav"
              label="交易净值(元)"
              rules={[{ required: true, message: '请输入交易净值' }]}
              initialValue={currentFund.current_nav > 0 ? currentFund.current_nav : currentFund.avg_cost_price}
            >
              <InputNumber min={0.0001} step={0.0001} precision={4} style={{ width: '100%' }} placeholder="请输入交易净值" />
            </Form.Item>
            <Form.Item
              name="trade_shares"
              label="交易份额"
              rules={[
                { required: true, message: '请输入交易份额' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (getFieldValue('trade_type') === 'sell' && value > currentFund.total_shares) {
                      return Promise.reject(new Error(`赎回份额不能超过持有份额(${currentFund.total_shares})`));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} placeholder="请输入交易份额" />
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

export default FundDetails; 