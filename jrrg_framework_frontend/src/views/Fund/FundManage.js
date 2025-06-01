import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Table, 
  Button, 
  Input, 
  message, 
  Divider, 
  Space, 
  Tag, 
  Typography, 
  Modal, 
  Form,
  Spin,
  Alert,
  Select,
  Tooltip,
  Statistic,
  Empty,
  List,
  Avatar,
  Badge,
  Descriptions
} from 'antd';
import { 
  StarOutlined, 
  DeleteOutlined, 
  SearchOutlined, 
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  HeartOutlined,
  HeartFilled,
  RiseOutlined,
  FallOutlined,
  RollbackOutlined,
  FullscreenOutlined,
  DownOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { 
  getFavoriteFunds, 
  addFavoriteFund, 
  removeFavoriteFund,
  updateFavoriteFundNote,
  getFundAIAnalysis,
  getDeepseekFundAnalysis,
  getFundAnalysisHistory,
  refreshFundAnalysisHistory,
  getFundInfo
} from '../../api/fund';
import { searchFund } from '../../api/fund';
import './FundManage.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const FundManage = () => {
  // 自选基金相关状态
  const [favoriteFunds, setFavoriteFunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addFundModalVisible, setAddFundModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // AI分析相关状态
  const [aiAnalysisVisible, setAiAnalysisVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [selectedFundForAI, setSelectedFundForAI] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  // 基金详情相关状态
  const [fundDetailVisible, setFundDetailVisible] = useState(false);
  const [fundDetailLoading, setFundDetailLoading] = useState(false);
  const [fundDetail, setFundDetail] = useState(null);
  const [selectedFund, setSelectedFund] = useState(null);

  // 历史记录分页和加载状态
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(5);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyMoreAvailable, setHistoryMoreAvailable] = useState(true);
  const [historyFullscreen, setHistoryFullscreen] = useState(false);

  // 添加新的状态变量
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [historyDetailVisible, setHistoryDetailVisible] = useState(false);

  // 新增状态跟踪前一个对话
  const [previousContext, setPreviousContext] = useState(null);

  // 页面加载时获取自选基金
  useEffect(() => {
    loadFavoriteFunds();
    loadAnalysisHistory();
  }, []);

  // 加载自选基金列表
  const loadFavoriteFunds = async () => {
    setLoading(true);
    try {
      const response = await getFavoriteFunds();
      if (response && response.code === 0) {
        if (!response.data || response.data.length === 0) {
          setFavoriteFunds([]);
          setLoading(false);
          return;
        }
        
        // 确保数据是数组
        setFavoriteFunds(Array.isArray(response.data) ? response.data : []);
      } else {
        message.error('获取自选基金列表失败');
        setFavoriteFunds([]);
      }
    } catch (error) {
      console.error('加载自选基金失败:', error);
      message.error('加载自选基金失败');
      setFavoriteFunds([]);
    } finally {
      setLoading(false);
    }
  };

  // 加载基金分析历史
  const loadAnalysisHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await getFundAnalysisHistory(historyPageSize);
      if (response && response.code === 0) {
        // 确保数据是数组
        setAnalysisHistory(Array.isArray(response.data) ? response.data : []);
        setHistoryTotal(response.meta?.total || 0);
        setHistoryMoreAvailable((Array.isArray(response.data) ? response.data.length : 0) < (response.meta?.total || 0));
      } else {
        console.error('获取基金分析历史失败:', response);
        setAnalysisHistory([]);
      }
    } catch (error) {
      console.error('加载基金分析历史失败:', error);
      setAnalysisHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 加载更多历史记录
  const loadMoreHistory = async () => {
    if (historyLoading || !historyMoreAvailable) return;
    
    setHistoryLoading(true);
    try {
      const nextPage = historyPage + 1;
      const offset = (nextPage - 1) * historyPageSize;
      
      const response = await getFundAnalysisHistory(historyPageSize, offset);
      if (response && response.code === 0) {
        // 确保响应数据是数组
        const newData = Array.isArray(response.data) ? response.data : [];
        
        if (newData.length > 0) {
          // 确保当前历史记录也是数组
          const currentHistory = Array.isArray(analysisHistory) ? analysisHistory : [];
          setAnalysisHistory([...currentHistory, ...newData]);
          setHistoryPage(nextPage);
          setHistoryMoreAvailable(currentHistory.length + newData.length < (response.meta?.total || 0));
        } else {
          setHistoryMoreAvailable(false);
        }
      } else {
        console.error('加载更多历史记录失败:', response);
        setHistoryMoreAvailable(false);
      }
    } catch (error) {
      console.error('加载更多历史记录失败:', error);
      setHistoryMoreAvailable(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  // 刷新历史记录
  const handleRefreshHistory = async () => {
    setHistoryPage(1);
    await loadAnalysisHistory();
  };

  // 处理基金搜索
  const handleFundSearch = async () => {
    if (!searchKeyword.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }
    
    setSearchLoading(true);
    setSearchResults([]); // 清空之前的搜索结果
    
    try {
      // 显示加载提示
      const searchLoadingMsg = message.loading('正在搜索基金，可能需要几秒钟...', 0);
      
      const response = await searchFund(searchKeyword.trim());
      
      // 关闭加载提示
      searchLoadingMsg();
      
      if (response && response.code === 0) {
        // 确保数据是数组
        const results = Array.isArray(response.data) ? response.data : [];
        setSearchResults(results);
        
        // 根据结果显示不同提示
        if (results.length === 0) {
          message.info('未找到匹配的基金，请尝试其他关键词');
        } else {
          message.success(`找到 ${results.length} 条匹配基金`);
        }
      } else {
        message.error(response?.message || '搜索基金失败');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('搜索基金失败:', error);
      message.error('搜索基金失败: ' + (error.message || '未知错误'));
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // 添加自选基金
  const handleAddFavoriteFund = async (fundCode, fundName) => {
    try {
      const response = await addFavoriteFund(fundCode, fundName);
      if (response && response.code === 0) {
        message.success('添加自选基金成功');
        setAddFundModalVisible(false);
        loadFavoriteFunds();
      } else {
        message.error(response?.message || '添加自选基金失败');
      }
    } catch (error) {
      console.error('添加自选基金失败:', error);
      message.error('添加自选基金失败');
    }
  };

  // 删除自选基金
  const handleRemoveFavoriteFund = async (fundCode) => {
    try {
      const response = await removeFavoriteFund(fundCode);
      if (response && response.code === 0) {
        message.success('删除自选基金成功');
        loadFavoriteFunds();
      } else {
        message.error(response?.message || '删除自选基金失败');
      }
    } catch (error) {
      console.error('删除自选基金失败:', error);
      message.error('删除自选基金失败');
    }
  };

  // 查看基金详情
  const handleViewFundDetail = async (fund) => {
    setSelectedFund(fund);
    setFundDetailVisible(true);
    setFundDetailLoading(true);
    setFundDetail(null);
    
    try {
      // 显示加载提示
      const loadingMsg = message.loading('正在获取基金详情，可能需要几秒钟...', 0);
      
      // 设置请求超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时，请稍后再试')), 30000); // 30秒超时
      });
      
      const fetchPromise = getFundInfo(fund.fund_code);
      
      // 使用Promise.race确保请求不会超时
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      // 关闭加载提示
      loadingMsg();
      
      if (response && response.code === 0) {
        if (!response.data || Object.keys(response.data).length === 0) {
          message.info('未能获取到基金详细信息');
          setFundDetail({});
        } else {
          setFundDetail(response.data);
        }
      } else {
        const errorMsg = response?.message || '获取基金详情失败';
        message.error(errorMsg);
        setFundDetail(null);
      }
    } catch (error) {
      console.error('获取基金详情失败:', error);
      message.error('获取基金详情失败: ' + (error.message || '未知错误'));
      setFundDetail(null);
    } finally {
      setFundDetailLoading(false);
    }
  };

  // 打开AI分析弹窗
  const handleOpenAIAnalysis = (fund = null) => {
    setSelectedFundForAI(fund);
    setUserMessage('');
    setAiResponse('');
    setPreviousContext(null);
    setAiAnalysisVisible(true);
  };

  // 继续对话
  const handleContinueDialog = () => {
    if (aiResponse) {
      setPreviousContext({
        question: userMessage,
        answer: aiResponse
      });
      setUserMessage('');
      setAiResponse('');
    }
  };

  // 发送AI分析请求
  const handleAIAnalysis = async () => {
    if (!userMessage.trim()) {
      message.warning('请输入分析问题');
      return;
    }
    
    setAiLoading(true);
    try {
      const fundCode = selectedFundForAI?.fund_code;
      
      // 尝试直接调用Deepseek API
      try {
        const response = await getDeepseekFundAnalysis(
          userMessage,
          fundCode,
          previousContext
        );
        
        setAiResponse(response.analysis);
        await handleRefreshHistory();
      } catch (directError) {
        console.error('直接调用Deepseek API失败，尝试后端API:', directError);
        
        // 回退到后端API
        const response = await getFundAIAnalysis(userMessage, fundCode);
        if (response && response.code === 0) {
          setAiResponse(response.data.analysis);
          await handleRefreshHistory();
        } else {
          message.error('AI分析失败');
        }
      }
    } catch (error) {
      console.error('基金AI分析失败:', error);
      message.error('基金AI分析失败');
    } finally {
      setAiLoading(false);
    }
  };

  // 查看历史分析详情
  const handleHistoryItemClick = (historyItem) => {
    setSelectedHistory(historyItem);
    setHistoryDetailVisible(true);
  };

  // 表格列定义
  const columns = [
    {
      title: '基金代码',
      dataIndex: 'fund_code',
      key: 'fund_code',
      width: 100,
    },
    {
      title: '基金名称',
      dataIndex: 'fund_name',
      key: 'fund_name',
      width: 200,
    },
    {
      title: '添加时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => handleViewFundDetail(record)}
            className="action-btn details-btn"
          >
            详情
          </Button>
          <Button 
            type="primary" 
            size="small"
            icon={<RobotOutlined />}
            onClick={() => handleOpenAIAnalysis(record)}
            className="action-btn analysis-btn"
          >
            AI分析
          </Button>
          <Button 
            danger 
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveFavoriteFund(record.fund_code)}
            className="action-btn delete-btn"
          >
            删除
          </Button>
        </Space>
      ),
    }
  ];

  // 搜索结果表格列
  const searchResultColumns = [
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
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small" 
          icon={<PlusOutlined />}
          onClick={() => handleAddFavoriteFund(record.fund_code, record.fund_name)}
        >
          添加
        </Button>
      ),
    }
  ];

  return (
    <div className="fund-manage">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card 
            title={
              <div className="favorite-title">
                <StarOutlined className="favorite-icon" />
                <Title level={4} style={{ margin: 0 }}>我的自选基金</Title>
                <Badge 
                  count={Array.isArray(favoriteFunds) ? favoriteFunds.length : 0} 
                  style={{ backgroundColor: '#52c41a' }} 
                  className="favorite-badge"
                />
              </div>
            }
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setAddFundModalVisible(true)}
                className="add-favorite-btn"
              >
                添加自选
              </Button>
            }
            className="favorite-fund-card"
            bordered={false}
          >
            {Array.isArray(favoriteFunds) && favoriteFunds.length > 0 ? (
              <Table 
                columns={columns}
                dataSource={favoriteFunds}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content', y: 500 }}
                className="favorite-table"
                rowClassName="favorite-table-row"
              />
            ) : (
              <div className="empty-favorite">
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                  description={
                    <div>
                      <p>暂无自选基金</p>
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => setAddFundModalVisible(true)}
                      >
                        添加您的第一只基金
                      </Button>
                    </div>
                  } 
                />
              </div>
            )}
          </Card>
        </Col>

        <Col span={12}>
          <Card 
            title={<Title level={4}><RobotOutlined /> AI基金分析</Title>}
            extra={
              <Button 
                type="primary" 
                icon={<RobotOutlined />}
                onClick={() => handleOpenAIAnalysis()}
                className="gradient-button"
              >
                新建分析
              </Button>
            }
            className="ai-card"
            bordered={false}
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div className="ai-banner">
                  <div className="ai-banner-content">
                    <Title level={4} className="ai-banner-title">AI基金分析助手</Title>
                    <Paragraph className="ai-banner-desc">
                      使用AI分析助手获取专业的基金投资建议和市场分析，助您做出更明智的投资决策。
                    </Paragraph>
                    <Button 
                      type="primary" 
                      icon={<RobotOutlined />} 
                      size="large"
                      onClick={() => handleOpenAIAnalysis()}
                      className="ai-banner-button"
                    >
                      开始AI对话
                    </Button>
                  </div>
                  <div className="ai-banner-image">
                    <RobotOutlined className="ai-robot-icon" />
                  </div>
                </div>
              </Col>
              
              <Col span={24}>
                <Card 
                  title={
                    <div className="history-card-title">
                      <span>历史分析记录</span>
                      <Badge count={analysisHistory.length} style={{ backgroundColor: '#52c41a' }} />
                    </div>
                  }
                  className="history-card"
                  extra={
                    <Button 
                      type="primary"
                      ghost
                      icon={<ReloadOutlined />} 
                      onClick={handleRefreshHistory}
                      loading={historyLoading}
                    >
                      刷新
                    </Button>
                  }
                  bordered={false}
                >
                  <List
                    loading={historyLoading}
                    itemLayout="horizontal"
                    dataSource={Array.isArray(analysisHistory) ? analysisHistory : []}
                    locale={{ emptyText: <Empty description="暂无分析历史" /> }}
                    renderItem={item => (
                      <List.Item
                        key={item.id}
                        className="history-item"
                        actions={[
                          <Button 
                            type="primary"
                            ghost
                            onClick={() => handleHistoryItemClick(item)}
                          >
                            查看详情
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              icon={<RobotOutlined />} 
                              className="ai-avatar"
                              size="large"
                            />
                          }
                          title={
                            <div className="history-item-title">
                              <Text strong>{item.question.length > 50 ? `${item.question.substring(0, 50)}...` : item.question}</Text>
                              {item.fund_code && (
                                <Tag color="blue" className="fund-tag">
                                  {item.fund_name || item.fund_code}
                                </Tag>
                              )}
                            </div>
                          }
                          description={
                            <div className="history-item-desc">
                              <Text type="secondary">
                                <ClockCircleOutlined style={{ marginRight: 4 }} />
                                {new Date(item.created_at).toLocaleString()}
                              </Text>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                    footer={
                      historyMoreAvailable ? (
                        <div className="history-footer">
                          <Button 
                            type="link" 
                            onClick={loadMoreHistory}
                            loading={historyLoading}
                            className="load-more-btn"
                          >
                            加载更多 <DownOutlined />
                          </Button>
                        </div>
                      ) : (analysisHistory.length > 0 ? (
                        <div className="history-footer">
                          <Text type="secondary">已显示全部历史记录</Text>
                        </div>
                      ) : null)
                    }
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 添加自选基金模态框 */}
      <Modal
        title="添加自选基金"
        open={addFundModalVisible}
        onCancel={() => setAddFundModalVisible(false)}
        footer={null}
        width={700}
      >
        <div style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="输入基金代码或名称搜索"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={handleFundSearch}
            loading={searchLoading}
            enterButton
          />
        </div>
        
        <Table
          columns={searchResultColumns}
          dataSource={Array.isArray(searchResults) ? searchResults : []}
          rowKey="fund_code"
          loading={searchLoading}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: <Empty description="请搜索基金" /> }}
        />
      </Modal>

      {/* 基金详情模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <span>基金详情: {selectedFund?.fund_name || ''}</span>
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {selectedFund?.fund_code || ''}
            </Tag>
          </div>
        }
        open={fundDetailVisible}
        onCancel={() => setFundDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setFundDetailVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="analyze" 
            type="primary" 
            icon={<RobotOutlined />}
            onClick={() => {
              setFundDetailVisible(false);
              handleOpenAIAnalysis(selectedFund);
            }}
          >
            AI分析此基金
          </Button>
        ]}
        width={800}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        {fundDetailLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" tip="正在获取基金详情..." />
          </div>
        ) : fundDetail ? (
          <div className="fund-detail-container">
            {/* 如果有净值信息，显示在顶部突出位置 */}
            {(fundDetail['单位净值'] || fundDetail['累计净值'] || fundDetail['净值日期']) && (
              <Card className="fund-value-card" bordered={false} style={{ marginBottom: 16, background: '#f0f7ff' }}>
                <Row gutter={16}>
                  {fundDetail['单位净值'] && (
                    <Col span={8}>
                      <Statistic 
                        title="单位净值" 
                        value={fundDetail['单位净值']} 
                        precision={4}
                        valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                      />
                    </Col>
                  )}
                  {fundDetail['累计净值'] && (
                    <Col span={8}>
                      <Statistic 
                        title="累计净值" 
                        value={fundDetail['累计净值']} 
                        precision={4}
                        valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                      />
                    </Col>
                  )}
                  {fundDetail['净值日期'] && (
                    <Col span={8}>
                      <Statistic 
                        title="净值日期" 
                        value={fundDetail['净值日期']}
                        valueStyle={{ fontSize: '14px' }}
                      />
                    </Col>
                  )}
                </Row>
              </Card>
            )}
            
            {/* 基金基本信息卡片 */}
            <Card 
              title={<div><span style={{ borderLeft: '4px solid #1890ff', paddingLeft: 8 }}>基金基本信息</span></div>} 
              bordered={false}
              style={{ marginBottom: 16 }}
            >
              <Row gutter={[16, 16]}>
                {fundDetail['基金类型'] && (
                  <Col span={12}>
                    <div className="fund-info-item">
                      <span className="info-label">基金类型:</span>
                      <Tag color="cyan">{fundDetail['基金类型']}</Tag>
                    </div>
                  </Col>
                )}
                {fundDetail['成立日期'] && (
                  <Col span={12}>
                    <div className="fund-info-item">
                      <span className="info-label">成立日期:</span>
                      <span className="info-value">{fundDetail['成立日期']}</span>
                    </div>
                  </Col>
                )}
                {fundDetail['基金规模'] && (
                  <Col span={12}>
                    <div className="fund-info-item">
                      <span className="info-label">基金规模:</span>
                      <span className="info-value">{fundDetail['基金规模']}</span>
                    </div>
                  </Col>
                )}
                {fundDetail['基金评级'] && (
                  <Col span={12}>
                    <div className="fund-info-item">
                      <span className="info-label">基金评级:</span>
                      <span className="info-value">{fundDetail['基金评级']}</span>
                    </div>
                  </Col>
                )}
              </Row>
            </Card>
            
            {/* 基金业绩信息 */}
            {(fundDetail['近1月'] || fundDetail['近3月'] || fundDetail['近6月'] || fundDetail['近1年'] || fundDetail['今年来'] || fundDetail['成立来']) && (
              <Card 
                title={<div><span style={{ borderLeft: '4px solid #52c41a', paddingLeft: 8 }}>业绩表现</span></div>}
                bordered={false}
                style={{ marginBottom: 16 }}
              >
                <Row gutter={[16, 16]}>
                  {fundDetail['近1月'] && (
                    <Col span={8}>
                      <Statistic
                        title="近1月"
                        value={fundDetail['近1月'].replace('%', '')}
                        precision={2}
                        suffix="%"
                        valueStyle={{ 
                          color: fundDetail['近1月'].includes('-') ? '#cf1322' : '#3f8600',
                          fontSize: '16px'
                        }}
                        prefix={fundDetail['近1月'].includes('-') ? <FallOutlined /> : <RiseOutlined />}
                      />
                    </Col>
                  )}
                  {fundDetail['近3月'] && (
                    <Col span={8}>
                      <Statistic
                        title="近3月"
                        value={fundDetail['近3月'].replace('%', '')}
                        precision={2}
                        suffix="%"
                        valueStyle={{ 
                          color: fundDetail['近3月'].includes('-') ? '#cf1322' : '#3f8600',
                          fontSize: '16px'
                        }}
                        prefix={fundDetail['近3月'].includes('-') ? <FallOutlined /> : <RiseOutlined />}
                      />
                    </Col>
                  )}
                  {fundDetail['近6月'] && (
                    <Col span={8}>
                      <Statistic
                        title="近6月"
                        value={fundDetail['近6月'].replace('%', '')}
                        precision={2}
                        suffix="%"
                        valueStyle={{ 
                          color: fundDetail['近6月'].includes('-') ? '#cf1322' : '#3f8600',
                          fontSize: '16px'
                        }}
                        prefix={fundDetail['近6月'].includes('-') ? <FallOutlined /> : <RiseOutlined />}
                      />
                    </Col>
                  )}
                  {fundDetail['近1年'] && (
                    <Col span={8}>
                      <Statistic
                        title="近1年"
                        value={fundDetail['近1年'].replace('%', '')}
                        precision={2}
                        suffix="%"
                        valueStyle={{ 
                          color: fundDetail['近1年'].includes('-') ? '#cf1322' : '#3f8600',
                          fontSize: '16px'
                        }}
                        prefix={fundDetail['近1年'].includes('-') ? <FallOutlined /> : <RiseOutlined />}
                      />
                    </Col>
                  )}
                  {fundDetail['今年来'] && (
                    <Col span={8}>
                      <Statistic
                        title="今年来"
                        value={fundDetail['今年来'].replace('%', '')}
                        precision={2}
                        suffix="%"
                        valueStyle={{ 
                          color: fundDetail['今年来'].includes('-') ? '#cf1322' : '#3f8600',
                          fontSize: '16px'
                        }}
                        prefix={fundDetail['今年来'].includes('-') ? <FallOutlined /> : <RiseOutlined />}
                      />
                    </Col>
                  )}
                  {fundDetail['成立来'] && (
                    <Col span={8}>
                      <Statistic
                        title="成立来"
                        value={fundDetail['成立来'].replace('%', '')}
                        precision={2}
                        suffix="%"
                        valueStyle={{ 
                          color: fundDetail['成立来'].includes('-') ? '#cf1322' : '#3f8600',
                          fontSize: '16px'
                        }}
                        prefix={fundDetail['成立来'].includes('-') ? <FallOutlined /> : <RiseOutlined />}
                      />
                    </Col>
                  )}
                </Row>
              </Card>
            )}
            
            {/* 其他所有信息 */}
            <Card
              title={<div><span style={{ borderLeft: '4px solid #722ed1', paddingLeft: 8 }}>详细信息</span></div>}
              bordered={false}
              className="detail-info-card"
            >
              <div className="fund-detail-table">
                {Object.entries(fundDetail).filter(([key]) => {
                  // 过滤掉已经在上面显示的字段
                  const excludedKeys = ['单位净值', '累计净值', '净值日期', '基金类型', '成立日期', 
                                        '基金规模', '基金评级', '近1月', '近3月', '近6月', 
                                        '近1年', '今年来', '成立来'];
                  return !excludedKeys.includes(key);
                }).map(([key, value], index) => (
                  <div key={key} className={`detail-row ${index % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                    <div className="detail-label">
                      <span>{key}</span>
                    </div>
                    <div className="detail-value">
                      <span>{value || '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <Empty 
            description={
              <span style={{ color: '#999' }}>
                无法获取基金详情，请稍后再试
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        )}
      </Modal>

      {/* AI分析模态框 */}
      <Modal
        title={
          <div className="ai-modal-title">
            <div className="ai-modal-icon">
              <RobotOutlined />
            </div>
            <span>AI基金分析</span>
            {selectedFundForAI && (
              <Tag color="blue" className="ai-modal-tag">
                {selectedFundForAI.fund_name} ({selectedFundForAI.fund_code})
              </Tag>
            )}
          </div>
        }
        open={aiAnalysisVisible}
        onCancel={() => setAiAnalysisVisible(false)}
        footer={null}
        width={800}
        bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
        className="ai-analysis-modal"
        destroyOnClose
      >
        <div className="ai-analysis-container">
          {previousContext && (
            <div className="previous-dialog">
              <Alert
                message={<span className="context-title">基于前一个对话的上下文</span>}
                description={
                  <div className="context-content">
                    <div className="previous-question">
                      <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>您</Avatar>
                      <div className="question-text">{previousContext.question}</div>
                    </div>
                    <div className="previous-answer">
                      <Avatar size="small" icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
                      <div className="answer-text">
                        {previousContext.answer.length > 100 
                          ? `${previousContext.answer.substring(0, 100)}...` 
                          : previousContext.answer}
                      </div>
                    </div>
                  </div>
                }
                type="info"
                showIcon
              />
              <div className="context-actions">
                <Button 
                  size="small" 
                  onClick={() => setPreviousContext(null)}
                  className="clear-context-btn"
                >
                  清除上下文
                </Button>
              </div>
            </div>
          )}
          
          <div className="input-container">
            <div className="input-header">
              <span className="input-title">您的问题</span>
              {selectedFundForAI && (
                <Tag color="blue" className="selected-fund-tag">
                  分析: {selectedFundForAI.fund_name}
                </Tag>
              )}
            </div>
            <TextArea
              placeholder={`请输入您的问题${selectedFundForAI ? '，例如：分析这只基金的投资价值' : '，例如：如何挑选合适的基金'}`}
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              autoSize={{ minRows: 3, maxRows: 6 }}
              disabled={aiLoading}
              className="ai-input"
            />
            <div className="action-buttons">
              <Button 
                onClick={() => setAiAnalysisVisible(false)}
                className="cancel-btn"
                disabled={aiLoading}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                icon={<SendOutlined />}
                onClick={handleAIAnalysis}
                loading={aiLoading}
                disabled={!userMessage.trim()}
                className="send-btn"
              >
                获取AI分析
              </Button>
              {aiResponse && (
                <Button 
                  onClick={handleContinueDialog}
                  icon={<RollbackOutlined />}
                  className="continue-btn"
                >
                  继续对话
                </Button>
              )}
            </div>
          </div>
          
          {aiLoading && (
            <div className="loading-container">
              <div className="loading-animation">
                <Spin size="large" />
              </div>
              <div className="loading-text">
                <p>AI正在思考中...</p>
                <p className="loading-subtext">我们正在分析基金数据，这可能需要几秒钟时间</p>
              </div>
            </div>
          )}
          
          {aiResponse && (
            <div className="response-container">
              <div className="response-header">
                <div className="response-avatar">
                  <Avatar icon={<RobotOutlined />} size="large" className="ai-response-avatar" />
                </div>
                <div className="response-title">
                  <Title level={5}>AI分析结果</Title>
                </div>
              </div>
              <Card 
                bordered={false} 
                className="response-card"
              >
                <div className="response-content">
                  {aiResponse.split('\n').map((line, index) => (
                    <p key={index}>{line || <br />}</p>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </Modal>

      {/* 历史详情模态框 */}
      <Modal
        title={
          <div>
            <RobotOutlined /> 历史分析详情
            {selectedHistory?.fund_code && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                {selectedHistory.fund_name || selectedHistory.fund_code}
              </Tag>
            )}
          </div>
        }
        open={historyDetailVisible}
        onCancel={() => setHistoryDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryDetailVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="reuse" 
            type="primary"
            onClick={() => {
              setHistoryDetailVisible(false);
              setUserMessage(selectedHistory.question);
              if (selectedHistory.fund_code) {
                const relatedFund = favoriteFunds.find(f => f.fund_code === selectedHistory.fund_code);
                setSelectedFundForAI(relatedFund || { 
                  fund_code: selectedHistory.fund_code,
                  fund_name: selectedHistory.fund_name || selectedHistory.fund_code
                });
              } else {
                setSelectedFundForAI(null);
              }
              setAiResponse('');
              setPreviousContext(null);
              setAiAnalysisVisible(true);
            }}
          >
            重新分析
          </Button>
        ]}
        width={800}
      >
        <div className="history-detail">
          <div className="history-question">
            <Title level={5}>问题:</Title>
            <Paragraph>{selectedHistory?.question}</Paragraph>
          </div>
          <Divider />
          <div className="history-answer">
            <Title level={5}>回答:</Title>
            <div className="response-content">
              {selectedHistory?.answer.split('\n').map((line, index) => (
                <p key={index}>{line || <br />}</p>
              ))}
            </div>
          </div>
          <div className="history-meta">
            <Text type="secondary">
              分析时间: {selectedHistory ? new Date(selectedHistory.created_at).toLocaleString() : ''}
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FundManage; 