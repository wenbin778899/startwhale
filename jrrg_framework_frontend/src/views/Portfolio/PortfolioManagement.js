import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, 
  Tabs, Spin, message, Typography, Tag, Space,
  Tooltip, Statistic, Row, Col, Divider, InputNumber
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, EditOutlined, 
  ReloadOutlined, LineChartOutlined, FileTextOutlined,
  StockOutlined, InfoCircleOutlined, DollarOutlined
} from '@ant-design/icons';
import {
  getPortfolios, createPortfolio, updatePortfolio, deletePortfolio,
  getPortfolioDetail, updatePortfolioPrices, createDailyStatistics
} from '../../api/portfolio';
import StockDetails from './StockDetails';
import TradeHistory from './TradeHistory';
import PortfolioChart from './PortfolioChart';
import './PortfolioManagement.css';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const PortfolioManagement = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState(null);
  const [portfolioDetail, setPortfolioDetail] = useState(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [currentPortfolio, setCurrentPortfolio] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('stocks');

  // 获取所有持仓组合
  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      const response = await getPortfolios();
      if (response.code === 0) {
        setPortfolios(response.data);
        // 如果有持仓组合且未选择，默认选择第一个
        if (response.data.length > 0 && !selectedPortfolioId) {
          setSelectedPortfolioId(response.data[0].id);
        }
      } else {
        message.error(response.message || '获取持仓组合失败');
      }
    } catch (error) {
      console.error('获取持仓组合出错:', error);
      message.error('获取持仓组合失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取持仓组合详情
  const fetchPortfolioDetail = async (portfolioId) => {
    if (!portfolioId) return;
    
    setDetailLoading(true);
    try {
      const response = await getPortfolioDetail(portfolioId);
      if (response.code === 0) {
        setPortfolioDetail(response.data);
      } else {
        message.error(response.message || '获取持仓组合详情失败');
      }
    } catch (error) {
      console.error('获取持仓组合详情出错:', error);
      message.error('获取持仓组合详情失败，请稍后重试');
    } finally {
      setDetailLoading(false);
    }
  };

  // 创建持仓组合
  const handleCreatePortfolio = async (values) => {
    try {
      const response = await createPortfolio(values);
      if (response.code === 0) {
        message.success('创建成功');
        setIsCreateModalVisible(false);
        form.resetFields();
        fetchPortfolios();
      } else {
        message.error(response.message || '创建失败');
      }
    } catch (error) {
      console.error('创建持仓组合出错:', error);
      message.error('创建失败，请稍后重试');
    }
  };

  // 更新持仓组合
  const handleUpdatePortfolio = async (values) => {
    if (!currentPortfolio) return;
    
    try {
      const response = await updatePortfolio(currentPortfolio.id, values);
      if (response.code === 0) {
        message.success('更新成功');
        setIsEditModalVisible(false);
        fetchPortfolios();
        if (selectedPortfolioId === currentPortfolio.id) {
          fetchPortfolioDetail(selectedPortfolioId);
        }
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      console.error('更新持仓组合出错:', error);
      message.error('更新失败，请稍后重试');
    }
  };

  // 删除持仓组合
  const handleDeletePortfolio = async () => {
    if (!currentPortfolio) return;
    
    try {
      const response = await deletePortfolio(currentPortfolio.id);
      if (response.code === 0) {
        message.success('删除成功');
        setIsDeleteModalVisible(false);
        
        // 如果删除的是当前选中的组合，重置选中状态
        if (selectedPortfolioId === currentPortfolio.id) {
          setSelectedPortfolioId(null);
          setPortfolioDetail(null);
        }
        
        fetchPortfolios();
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (error) {
      console.error('删除持仓组合出错:', error);
      message.error('删除失败，请稍后重试');
    }
  };

  // 更新所有持仓股票价格
  const handleUpdatePrices = async () => {
    try {
      message.loading({ content: '正在更新价格...', key: 'updatePrices' });
      const response = await updatePortfolioPrices();
      if (response.code === 0) {
        message.success({ content: '价格更新成功', key: 'updatePrices' });
        fetchPortfolios();
        if (selectedPortfolioId) {
          fetchPortfolioDetail(selectedPortfolioId);
        }
      } else {
        message.error({ content: response.message || '价格更新失败', key: 'updatePrices' });
      }
    } catch (error) {
      console.error('更新价格出错:', error);
      message.error({ content: '价格更新失败，请稍后重试', key: 'updatePrices' });
    }
  };

  // 创建每日统计数据
  const handleCreateDailyStats = async () => {
    try {
      message.loading({ content: '正在创建统计数据...', key: 'createStats' });
      const response = await createDailyStatistics();
      if (response.code === 0) {
        message.success({ content: '统计数据已更新', key: 'createStats' });
        if (selectedPortfolioId) {
          fetchPortfolioDetail(selectedPortfolioId);
        }
      } else {
        message.error({ content: response.message || '统计数据更新失败', key: 'createStats' });
      }
    } catch (error) {
      console.error('创建统计数据出错:', error);
      message.error({ content: '统计数据更新失败，请稍后重试', key: 'createStats' });
    }
  };

  // 选择持仓组合
  const handleSelectPortfolio = (portfolioId) => {
    setSelectedPortfolioId(portfolioId);
    setActiveTab('stocks'); // 重置到默认标签页
  };

  // 初始化加载
  useEffect(() => {
    fetchPortfolios();
  }, []);

  // 当选中的组合ID变化时，获取详情
  useEffect(() => {
    if (selectedPortfolioId) {
      fetchPortfolioDetail(selectedPortfolioId);
    }
  }, [selectedPortfolioId]);

  // 表格列定义
  const columns = [
    {
      title: '组合名称',
      dataIndex: 'portfolio_name',
      key: 'portfolio_name',
      render: (text, record) => (
        <Button 
          type={selectedPortfolioId === record.id ? 'primary' : 'text'} 
          onClick={() => handleSelectPortfolio(record.id)}
        >
          {text}
        </Button>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '总投资(元)',
      dataIndex: 'total_investment',
      key: 'total_investment',
      render: (value) => Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    {
      title: '当前市值(元)',
      dataIndex: 'current_value',
      key: 'current_value',
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
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => {
              setCurrentPortfolio(record);
              editForm.setFieldsValue({
                portfolio_name: record.portfolio_name,
                description: record.description
              });
              setIsEditModalVisible(true);
            }}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => {
              setCurrentPortfolio(record);
              setIsDeleteModalVisible(true);
            }}
          />
        </Space>
      )
    }
  ];

  // 渲染持仓详情卡片
  const renderPortfolioDetail = () => {
    if (!portfolioDetail) return null;

    const { portfolio, stocks, statistics } = portfolioDetail;

    return (
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{portfolio.portfolio_name} - 持仓详情</span>
            <Space>
              <Tooltip title="更新价格">
                <Button icon={<ReloadOutlined />} onClick={handleUpdatePrices}>更新价格</Button>
              </Tooltip>
            </Space>
          </div>
        }
        loading={detailLoading}
      >
        <Row gutter={16} className="portfolio-summary">
          <Col xs={12} sm={12} md={6} lg={6}>
            <Statistic
              title="总投资金额"
              value={Number(portfolio.total_investment)}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Col>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Statistic
              title="当前总市值"
              value={Number(portfolio.current_value)}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Col>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Statistic
              title="总盈亏"
              value={Number(portfolio.profit_loss)}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: Number(portfolio.profit_loss) >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Col>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Statistic
              title="总收益率"
              value={Number(portfolio.profit_loss_rate) * 100}
              precision={2}
              suffix="%"
              valueStyle={{ color: Number(portfolio.profit_loss_rate) >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Col>
        </Row>

        <Divider />

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><StockOutlined />持仓股票</span>} key="stocks">
            <StockDetails 
              portfolioId={selectedPortfolioId} 
              stocks={stocks} 
              refreshDetail={() => fetchPortfolioDetail(selectedPortfolioId)}
            />
          </TabPane>
          <TabPane tab={<span><FileTextOutlined />交易记录</span>} key="trades">
            <TradeHistory 
              portfolioId={selectedPortfolioId} 
              refreshDetail={() => fetchPortfolioDetail(selectedPortfolioId)}
            />
          </TabPane>
          <TabPane tab={<span><LineChartOutlined />收益走势</span>} key="statistics">
            <PortfolioChart statistics={statistics} />
          </TabPane>
        </Tabs>
      </Card>
    );
  };

  return (
    <div className="portfolio-management">
      <Title level={2}>持仓管理</Title>
      <Text type="secondary" className="page-description">
        管理您的股票持仓组合，追踪投资表现和盈亏情况。
      </Text>

      <div className="action-bar">
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsCreateModalVisible(true)}
        >
          新建持仓组合
        </Button>
      </div>

      <Card title="持仓组合列表" extra={<Button icon={<ReloadOutlined />} onClick={fetchPortfolios}>刷新</Button>}>
        <Table 
          dataSource={portfolios} 
          columns={columns} 
          rowKey="id" 
          loading={loading}
          pagination={false}
          locale={{ emptyText: '暂无持仓组合，请点击"新建持仓组合"按钮创建' }}
        />
      </Card>

      {selectedPortfolioId && renderPortfolioDetail()}

      {/* 创建组合的模态框 */}
      <Modal
        title="新建持仓组合"
        visible={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreatePortfolio}
        >
          <Form.Item
            name="portfolio_name"
            label="组合名称"
            rules={[{ required: true, message: '请输入组合名称' }]}
          >
            <Input placeholder="请输入组合名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="组合描述"
          >
            <Input.TextArea placeholder="请输入组合描述" rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑组合的模态框 */}
      <Modal
        title="编辑持仓组合"
        visible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdatePortfolio}
        >
          <Form.Item
            name="portfolio_name"
            label="组合名称"
            rules={[{ required: true, message: '请输入组合名称' }]}
          >
            <Input placeholder="请输入组合名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="组合描述"
          >
            <Input.TextArea placeholder="请输入组合描述" rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              更新
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除组合的确认框 */}
      <Modal
        title="删除持仓组合"
        visible={isDeleteModalVisible}
        onOk={handleDeletePortfolio}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="确认删除"
        cancelText="取消"
      >
        <p>确定要删除持仓组合 "{currentPortfolio?.portfolio_name}" 吗？此操作不可逆，组合内的所有数据都将被删除。</p>
      </Modal>
    </div>
  );
};

export default PortfolioManagement; 