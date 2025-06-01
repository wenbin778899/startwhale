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
  DownOutlined
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
      
      const response = await getFundInfo(fund.fund_code);
      
      // 关闭加载提示
      loadingMsg();
      
      if (response && response.code === 0) {
        setFundDetail(response.data);
        
        // 如果没有数据，显示提示
        if (!response.data || Object.keys(response.data).length === 0) {
          message.info('未能获取到基金详细信息');
        }
      } else {
        message.error(response?.message || '获取基金详情失败');
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
      title: '备注',
      dataIndex: 'note',
      key: 'note',
      width: 150,
      ellipsis: true,
      render: (text) => text || '-',
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
          >
            详情
          </Button>
          <Button 
            type="primary" 
            size="small"
            icon={<RobotOutlined />}
            onClick={() => handleOpenAIAnalysis(record)}
          >
            AI分析
          </Button>
          <Button 
            type="danger" 
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveFavoriteFund(record.fund_code)}
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
        <Col span={24}>
          <Card 
            title={<Title level={4}><StarOutlined /> 我的自选基金</Title>}
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setAddFundModalVisible(true)}
              >
                添加自选
              </Button>
            }
          >
            <Table 
              columns={columns}
              dataSource={Array.isArray(favoriteFunds) ? favoriteFunds : []}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: <Empty description="暂无自选基金" /> }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card 
            title={<Title level={4}><RobotOutlined /> AI基金分析</Title>}
            extra={
              <Button 
                type="primary" 
                icon={<RobotOutlined />}
                onClick={() => handleOpenAIAnalysis()}
              >
                新建分析
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Alert
                  message="AI基金分析助手"
                  description="使用AI分析助手，获取专业的基金投资建议和分析。您可以询问特定基金的表现、投资策略、风险分析等。"
                  type="info"
                  showIcon
                  icon={<RobotOutlined />}
                />
              </Col>
              
              <Col span={24}>
                <Card 
                  title="历史分析记录" 
                  size="small"
                  extra={
                    <Button 
                      type="text" 
                      icon={<ReloadOutlined />} 
                      onClick={handleRefreshHistory}
                      loading={historyLoading}
                    >
                      刷新
                    </Button>
                  }
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
                            type="link" 
                            onClick={() => handleHistoryItemClick(item)}
                          >
                            查看详情
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Avatar icon={<RobotOutlined />} />}
                          title={
                            <div>
                              <Text strong>{item.question.length > 50 ? `${item.question.substring(0, 50)}...` : item.question}</Text>
                              {item.fund_code && (
                                <Tag color="blue" style={{ marginLeft: 8 }}>
                                  {item.fund_name || item.fund_code}
                                </Tag>
                              )}
                            </div>
                          }
                          description={
                            <Text type="secondary">
                              {new Date(item.created_at).toLocaleString()}
                            </Text>
                          }
                        />
                      </List.Item>
                    )}
                    footer={
                      historyMoreAvailable ? (
                        <div style={{ textAlign: 'center' }}>
                          <Button 
                            type="link" 
                            onClick={loadMoreHistory}
                            loading={historyLoading}
                          >
                            加载更多
                          </Button>
                        </div>
                      ) : (analysisHistory.length > 0 ? (
                        <div style={{ textAlign: 'center' }}>
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
        title={`基金详情: ${selectedFund?.fund_name || ''} (${selectedFund?.fund_code || ''})`}
        open={fundDetailVisible}
        onCancel={() => setFundDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setFundDetailVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="analyze" 
            type="primary" 
            onClick={() => {
              setFundDetailVisible(false);
              handleOpenAIAnalysis(selectedFund);
            }}
          >
            AI分析此基金
          </Button>
        ]}
        width={700}
      >
        {fundDetailLoading ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <Spin tip="加载基金详情..." />
          </div>
        ) : fundDetail ? (
          <Descriptions bordered column={1}>
            {Object.entries(fundDetail).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>
                {value || '-'}
              </Descriptions.Item>
            ))}
          </Descriptions>
        ) : (
          <Empty description="无法获取基金详情" />
        )}
      </Modal>

      {/* AI分析模态框 */}
      <Modal
        title={
          <div>
            <RobotOutlined /> AI基金分析
            {selectedFundForAI && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
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
      >
        <div className="ai-analysis-container">
          {previousContext && (
            <div className="previous-dialog">
              <Alert
                message="基于前一个对话的上下文"
                description={
                  <div>
                    <div className="previous-question">
                      <strong>您:</strong> {previousContext.question}
                    </div>
                    <div className="previous-answer">
                      <strong>AI:</strong> {previousContext.answer.length > 100 
                        ? `${previousContext.answer.substring(0, 100)}...` 
                        : previousContext.answer}
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
                >
                  清除上下文
                </Button>
              </div>
            </div>
          )}
          
          <div className="input-container">
            <TextArea
              placeholder={`请输入您的问题${selectedFundForAI ? '，例如：分析这只基金的投资价值' : '，例如：如何挑选合适的基金'}`}
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              autoSize={{ minRows: 3, maxRows: 6 }}
              disabled={aiLoading}
            />
            <div className="action-buttons">
              <Button 
                type="primary" 
                icon={<SendOutlined />}
                onClick={handleAIAnalysis}
                loading={aiLoading}
                disabled={!userMessage.trim()}
              >
                获取AI分析
              </Button>
              {aiResponse && (
                <Button 
                  onClick={handleContinueDialog}
                  icon={<RollbackOutlined />}
                >
                  继续对话
                </Button>
              )}
            </div>
          </div>
          
          {aiLoading && (
            <div className="loading-container">
              <Spin tip="AI正在思考中..." />
            </div>
          )}
          
          {aiResponse && (
            <div className="response-container">
              <Card 
                title="AI分析结果" 
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