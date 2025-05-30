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
  Badge
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
  FallOutlined
} from '@ant-design/icons';
import { 
  getFavoriteStocks, 
  addFavoriteStock, 
  removeFavoriteStock,
  getAIAnalysis
} from '../../api/strategy';
import { getStockInfo } from '../../api/stock';
import './StrategyManage.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const StrategyManage = () => {
  // 自选股票相关状态
  const [favoriteStocks, setFavoriteStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addStockModalVisible, setAddStockModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // AI分析相关状态
  const [aiAnalysisVisible, setAiAnalysisVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [selectedStockForAI, setSelectedStockForAI] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  // 页面加载时获取自选股票
  useEffect(() => {
    loadFavoriteStocks();
  }, []);

  // 加载自选股票列表
  const loadFavoriteStocks = async () => {
    setLoading(true);
    try {
      const response = await getFavoriteStocks();
      console.log('获取自选股票响应:', response);
      
      if (response && response.code === 0) {
        // 检查数据是否存在
        if (!response.data || response.data.length === 0) {
          console.log('自选股票列表为空');
          setFavoriteStocks([]);
          return;
        }
        
        console.log(`获取到 ${response.data.length} 只自选股票`);
        
        // 获取每只股票的实时数据
        const stocksWithData = await Promise.all(
          response.data.map(async (stock) => {
            try {
              // 先设置基础数据，确保即使获取实时数据失败也能显示
              const baseStock = {
                ...stock,
                stock_code: stock.stock_code,
                stock_name: stock.stock_name,
                created_at: stock.created_at,
                current_price: '-',
                open_price: '-',
                high_price: '-',
                low_price: '-',
                change: 0,
                change_percent: 0,
                volume: '-',
                amount: '-'
              };
              
              // 尝试获取实时数据
              const stockDataResponse = await getStockInfo(stock.stock_code, 1);
              console.log(`股票 ${stock.stock_code} 数据响应:`, stockDataResponse);
              
              if (stockDataResponse.code === 0 && stockDataResponse.data) {
                // 检查history数据
                if (stockDataResponse.data.history && stockDataResponse.data.history.length > 0) {
                  const latestData = stockDataResponse.data.history[0];
                  return {
                    ...baseStock,
                    current_price: latestData['收盘'],
                    open_price: latestData['开盘'],
                    high_price: latestData['最高'],
                    low_price: latestData['最低'],
                    change: latestData['涨跌额'],
                    change_percent: latestData['涨跌幅'],
                    volume: latestData['成交量'],
                    amount: latestData['成交额'],
                    stock_name: stockDataResponse.data.name || stock.stock_name
                  };
                } else {
                  console.warn(`股票 ${stock.stock_code} 没有历史数据`);
                  return baseStock;
                }
              } else {
                console.warn(`股票 ${stock.stock_code} 数据请求失败`);
                return baseStock;
              }
            } catch (error) {
              console.error(`获取股票 ${stock.stock_code} 数据失败:`, error);
              // 返回基础数据，确保股票能够显示
              return {
                ...stock,
                stock_code: stock.stock_code,
                stock_name: stock.stock_name,
                created_at: stock.created_at,
                current_price: '-',
                open_price: '-',
                high_price: '-',
                low_price: '-',
                change: 0,
                change_percent: 0,
                volume: '-',
                amount: '-'
              };
            }
          })
        );
        
        console.log('处理后的股票数据:', stocksWithData);
        console.log('股票数据长度:', stocksWithData.length);
        console.log('股票数据详情:', JSON.stringify(stocksWithData, null, 2));
        
        // 确保数据是有效的数组
        if (Array.isArray(stocksWithData) && stocksWithData.length > 0) {
          setFavoriteStocks(stocksWithData);
          console.log('已设置favoriteStocks状态，长度:', stocksWithData.length);
        } else {
          console.error('处理后的股票数据无效:', stocksWithData);
          setFavoriteStocks([]);
        }
      } else if (response && response.code === 401) {
        // 未授权，可能是token过期
        console.error('未授权访问，请重新登录');
        message.error('登录已过期，请重新登录');
      } else {
        console.error('获取自选股票失败，响应:', response);
        message.error(response?.message || '获取自选股票列表失败');
      }
    } catch (error) {
      console.error('加载自选股票出错:', error);
      
      // 更详细的错误处理
      if (error.response) {
        // 服务器返回了错误响应
        console.error('错误响应:', error.response);
        if (error.response.status === 401) {
          message.error('登录已过期，请重新登录');
        } else if (error.response.status === 404) {
          message.error('接口不存在，请检查后端服务');
        } else if (error.response.status === 500) {
          message.error('服务器错误，请稍后重试');
        } else {
          message.error(`请求失败: ${error.response.status}`);
        }
      } else if (error.request) {
        // 请求已发出但没有收到响应
        console.error('请求失败:', error.request);
        message.error('网络错误，请检查后端服务是否运行');
      } else {
        // 其他错误
        console.error('未知错误:', error.message);
        message.error('加载自选股票失败');
      }
      
      setFavoriteStocks([]); // 确保状态被设置
    } finally {
      setLoading(false);
    }
  };

  // 处理输入变化（简化版，不再进行自动搜索）
  const handleInputChange = (value) => {
    setSearchKeyword(value);
  };

  // 直接查询股票信息并添加
  const handleDirectAddStock = async () => {
    if (!searchKeyword.trim()) {
      message.error('请输入股票代码');
      return;
    }

    // 检查是否为6位数字（股票代码格式）
    if (!/^\d{6}$/.test(searchKeyword.trim())) {
      message.error('请输入正确的6位股票代码');
      return;
    }

    setSearchLoading(true);
    try {
      // 先检查是否已在自选列表
      const existingStock = favoriteStocks.find(stock => stock.stock_code === searchKeyword.trim());
      if (existingStock) {
        message.warning('该股票已在自选列表中');
        setSearchLoading(false);
        return;
      }

      // 股票名称映射表（备用）
      const stockNameMap = {
        '000001': '平安银行',
        '000002': '万科A',
        '600036': '招商银行',
        '600519': '贵州茅台',
        '000858': '五粮液',
        '002415': '海康威视',
        '300750': '宁德时代',
        '601318': '中国平安',
        '000333': '美的集团',
        '002230': '科大讯飞'
      };

      // 直接使用getStockInfo获取股票信息（这个在股票行情页面工作正常）
      const stockInfoResponse = await getStockInfo(searchKeyword.trim(), 1);
      console.log('股票信息响应:', stockInfoResponse);
      
      if (stockInfoResponse.code === 0 && stockInfoResponse.data) {
        // 从响应中提取股票名称和代码
        const stockCode = searchKeyword.trim();
        let stockName = '未知股票';
        
        // 尝试从不同位置获取股票名称
        if (stockInfoResponse.data.name && typeof stockInfoResponse.data.name === 'string' && 
            !stockInfoResponse.data.name.includes('.') && stockInfoResponse.data.name.length > 1) {
          // 确保name是有效的股票名称而不是价格
          stockName = stockInfoResponse.data.name;
        } else if (stockNameMap[stockCode]) {
          // 使用映射表中的名称
          stockName = stockNameMap[stockCode];
        } else if (stockInfoResponse.data.history && stockInfoResponse.data.history.length > 0) {
          // 如果都没有，使用股票代码作为临时名称
          stockName = `股票${stockCode}`;
        }
        
        console.log(`准备添加股票: ${stockCode} - ${stockName}`);
        
        // 添加到自选
        await handleAddFavoriteStock(stockCode, stockName);
      } else {
        message.error('获取股票信息失败，请检查股票代码是否正确');
      }
    } catch (error) {
      console.error('查询股票信息失败:', error);
      message.error('查询股票信息失败，请稍后重试');
    } finally {
      setSearchLoading(false);
    }
  };

  // 搜索股票（已废弃，保留但不使用）
  const handleStockSearch = async () => {
    // 直接调用新的添加方法
    handleDirectAddStock();
  };

  // 添加自选股票
  const handleAddFavoriteStock = async (stockCode, stockName) => {
    try {
      console.log(`尝试添加股票: ${stockCode} - ${stockName}`);
      
      // 注意：这里只检查前端状态中的股票，可能不准确
      // 后端会进行真正的重复检查
      const existingStock = favoriteStocks.find(stock => stock.stock_code === stockCode);
      if (existingStock) {
        message.warning('该股票已在自选列表中');
        return;
      }

      const response = await addFavoriteStock(stockCode, stockName);
      console.log('添加股票响应:', response);
      
      if (response.code === 0) {
        message.success('添加成功');
        setAddStockModalVisible(false);
        setSearchKeyword('');
        // 重新加载列表，确保显示最新数据
        await loadFavoriteStocks();
      } else if (response.code === 1) {
        // 后端返回错误，通常表示股票已存在
        message.warning(response.message || '该股票已在自选列表中');
        // 重新加载列表，确保前端数据同步
        await loadFavoriteStocks();
      } else {
        message.error(response.message || '添加失败');
      }
    } catch (error) {
      console.error('添加自选股票失败:', error);
      
      // 如果后端返回400错误，说明股票已存在
      if (error.response && error.response.status === 400) {
        message.warning('该股票已在自选列表中');
        // 重新加载列表，确保前端显示正确
        await loadFavoriteStocks();
      } else if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('添加失败，请稍后重试');
      }
    }
  };

  // 删除自选股票
  const handleRemoveFavoriteStock = async (stockCode) => {
    try {
      const response = await removeFavoriteStock(stockCode);
      if (response.code === 0) {
        message.success('删除成功');
        loadFavoriteStocks(); // 重新加载列表
      }
    } catch (error) {
      message.error('删除失败');
      console.error('删除自选股票失败:', error);
    }
  };

  // 发起AI分析
  const handleAIAnalysis = async () => {
    if (!userMessage.trim()) {
      message.warning('请输入分析问题');
      return;
    }

    setAiLoading(true);
    try {
      let analysisPrompt = userMessage;
      
      // 如果选择了特定股票，加入股票信息
      if (selectedStockForAI) {
        const stockData = favoriteStocks.find(stock => stock.stock_code === selectedStockForAI);
        if (stockData) {
          analysisPrompt = `请分析股票 ${stockData.stock_name}(${stockData.stock_code})，当前价格：${stockData.current_price || '未知'}，涨跌幅：${stockData.change_percent || '未知'}%。用户问题：${userMessage}`;
        }
      }

      const response = await getAIAnalysis(analysisPrompt);
      if (response.code === 0) {
        setAiResponse(response.data.analysis);
        // 添加到历史记录
        const newHistory = {
          id: Date.now(),
          question: userMessage,
          answer: response.data.analysis,
          stock: selectedStockForAI ? favoriteStocks.find(stock => stock.stock_code === selectedStockForAI) : null,
          timestamp: new Date().toLocaleString()
        };
        setAnalysisHistory(prev => [newHistory, ...prev.slice(0, 4)]); // 保留最近5条记录
      }
    } catch (error) {
      message.error('AI分析失败，请稍后重试');
      console.error('AI分析失败:', error);
    } finally {
      setAiLoading(false);
    }
  };

  // 自选股票表格列定义
  const favoriteStockColumns = [
    {
      title: '股票代码',
      dataIndex: 'stock_code',
      key: 'stock_code',
      width: 100,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '股票名称',
      dataIndex: 'stock_name',
      key: 'stock_name',
      width: 120,
    },
    {
      title: '最新价',
      dataIndex: 'current_price',
      key: 'current_price',
      width: 100,
      render: (price) => price ? `¥${parseFloat(price).toFixed(2)}` : '-'
    },
    {
      title: '涨跌额',
      dataIndex: 'change',
      key: 'change',
      width: 100,
      render: (change) => {
        if (!change && change !== 0) return '-';
        const changeNum = parseFloat(change);
        return (
          <Text type={changeNum > 0 ? 'success' : changeNum < 0 ? 'danger' : 'secondary'}>
            {changeNum > 0 ? '+' : ''}{changeNum.toFixed(2)}
          </Text>
        );
      }
    },
    {
      title: '涨跌幅',
      dataIndex: 'change_percent',
      key: 'change_percent',
      width: 100,
      render: (percent) => {
        if (!percent && percent !== 0) return '-';
        const value = parseFloat(percent);
        return (
          <Space>
            {value > 0 ? <RiseOutlined style={{ color: '#cf1322' }} /> : 
             value < 0 ? <FallOutlined style={{ color: '#3f8600' }} /> : null}
            <Tag color={value > 0 ? 'red' : value < 0 ? 'green' : 'default'}>
              {value > 0 ? '+' : ''}{value.toFixed(2)}%
            </Tag>
          </Space>
        );
      }
    },
    {
      title: '最高价',
      dataIndex: 'high_price',
      key: 'high_price',
      width: 100,
      render: (price) => price ? `¥${parseFloat(price).toFixed(2)}` : '-'
    },
    {
      title: '最低价',
      dataIndex: 'low_price',
      key: 'low_price',
      width: 100,
      render: (price) => price ? `¥${parseFloat(price).toFixed(2)}` : '-'
    },
    {
      title: '成交量',
      dataIndex: 'volume',
      key: 'volume',
      width: 120,
      render: (volume) => {
        if (!volume) return '-';
        const vol = parseFloat(volume);
        if (vol >= 100000000) {
          return `${(vol / 100000000).toFixed(2)}亿`;
        } else if (vol >= 10000) {
          return `${(vol / 10000).toFixed(2)}万`;
        }
        return vol.toString();
      }
    },
    {
      title: '成交额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => {
        if (!amount) return '-';
        const amt = parseFloat(amount);
        if (amt >= 100000000) {
          return `${(amt / 100000000).toFixed(2)}亿`;
        } else if (amt >= 10000) {
          return `${(amt / 10000).toFixed(2)}万`;
        }
        return amt.toString();
      }
    },
    {
      title: '添加时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (time) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            type="primary"
            icon={<RobotOutlined />}
            onClick={() => {
              setSelectedStockForAI(record.stock_code);
              setAiAnalysisVisible(true);
            }}
          >
            AI分析
          </Button>
          <Button 
            size="small" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveFavoriteStock(record.stock_code)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="strategy-manage">
      <div className="strategy-manage-header">
        <Title level={2}>
          <StarOutlined style={{ color: '#faad14' }} /> 策略管理中心
        </Title>
        <Paragraph type="secondary">
          管理您的自选股票，获取AI智能分析建议，制定投资策略
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {/* 自选股票管理 */}
        <Col span={16}>
          <Card 
            title={
              <Space>
                <HeartFilled style={{ color: '#ff4d4f' }} />
                <span>我的自选股票</span>
                <Badge count={favoriteStocks.length} style={{ backgroundColor: '#52c41a' }} />
              </Space>
            }
            extra={
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setAddStockModalVisible(true)}
                >
                  添加自选
                </Button>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={loadFavoriteStocks}
                  loading={loading}
                >
                  刷新
                </Button>
              </Space>
            }
            className="favorite-stocks-card"
          >
            {favoriteStocks.length === 0 && !loading ? (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无自选股票，点击添加自选开始关注股票"
              />
            ) : (
              <Table
                columns={favoriteStockColumns}
                dataSource={favoriteStocks}
                loading={loading}
                rowKey="stock_code"
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ x: 1200 }}
              />
            )}
          </Card>
        </Col>

        {/* AI智能分析面板 */}
        <Col span={8}>
          <Card 
            title={
              <Space>
                <RobotOutlined style={{ color: '#1890ff' }} />
                <span>AI智能分析</span>
              </Space>
            }
            className="ai-analysis-card"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Alert
                message="AI投资分析助手"
                description="基于大数据模型为您提供专业的股票分析建议"
                type="info"
                showIcon
              />
              
              <div>
                <Text strong>选择股票（可选）：</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="选择要分析的股票"
                  allowClear
                  value={selectedStockForAI}
                  onChange={setSelectedStockForAI}
                >
                  {favoriteStocks.map(stock => (
                    <Option key={stock.stock_code} value={stock.stock_code}>
                      {stock.stock_name}({stock.stock_code})
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <Text strong>分析问题：</Text>
                <TextArea
                  style={{ marginTop: 8 }}
                  rows={4}
                  placeholder="请输入您想要分析的问题，例如：这只股票的技术指标如何？近期走势分析？投资建议？"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                />
              </div>

              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={aiLoading}
                onClick={handleAIAnalysis}
                style={{ width: '100%' }}
                size="large"
              >
                获取AI分析
              </Button>

              {/* 分析历史 */}
              {analysisHistory.length > 0 && (
                <div>
                  <Divider orientation="left">
                    <Text strong>分析历史</Text>
                  </Divider>
                  <List
                    size="small"
                    dataSource={analysisHistory}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<RobotOutlined />} />}
                          title={
                            <Space>
                              <Text ellipsis style={{ maxWidth: 200 }}>{item.question}</Text>
                              {item.stock && <Tag color="blue">{item.stock.stock_name}</Tag>}
                            </Space>
                          }
                          description={
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.timestamp}
                            </Text>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 添加自选股票弹窗 */}
      <Modal
        title="添加自选股票"
        open={addStockModalVisible}
        onCancel={() => {
          setAddStockModalVisible(false);
          setSearchKeyword('');
        }}
        footer={null}
        width={500}
      >
        <Form layout="vertical">
          <Form.Item label="股票代码">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                style={{ width: '100%' }}
                value={searchKeyword}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="请输入6位股票代码（如：000001）"
                onPressEnter={handleDirectAddStock}
                maxLength={6}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleDirectAddStock}
                loading={searchLoading}
              >
                添加
              </Button>
            </Space.Compact>
          </Form.Item>

          <Alert
            message="使用提示"
            description="请输入准确的6位股票代码，例如：000001（平安银行）、600036（招商银行）"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* 示例股票 */}
          <div style={{ marginTop: 16 }}>
            <Text strong>热门股票示例：</Text>
            <div style={{ marginTop: 8 }}>
              <Space wrap>
                <Button size="small" onClick={() => { setSearchKeyword('000001'); }}>
                  000001 平安银行
                </Button>
                <Button size="small" onClick={() => { setSearchKeyword('600036'); }}>
                  600036 招商银行
                </Button>
                <Button size="small" onClick={() => { setSearchKeyword('000002'); }}>
                  000002 万科A
                </Button>
                <Button size="small" onClick={() => { setSearchKeyword('600519'); }}>
                  600519 贵州茅台
                </Button>
              </Space>
            </div>
          </div>
        </Form>
      </Modal>

      {/* AI分析结果弹窗 */}
      <Modal
        title="AI分析结果"
        open={aiAnalysisVisible}
        onCancel={() => {
          setAiAnalysisVisible(false);
          setAiResponse('');
          setUserMessage('');
          setSelectedStockForAI(null);
        }}
        footer={[
          <Button key="close" onClick={() => setAiAnalysisVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {selectedStockForAI && (
            <Alert
              message={`正在分析：${favoriteStocks.find(s => s.stock_code === selectedStockForAI)?.stock_name}(${selectedStockForAI})`}
              type="info"
            />
          )}
          
          <div>
            <Text strong>分析问题：</Text>
            <TextArea
              rows={3}
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="请输入您的分析问题..."
            />
          </div>

          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={aiLoading}
            onClick={handleAIAnalysis}
          >
            获取分析
          </Button>

          {aiResponse && (
            <div>
              <Divider orientation="left">
                <Text strong>AI分析结果</Text>
              </Divider>
              <div style={{ 
                backgroundColor: '#f6f6f6', 
                padding: '16px', 
                borderRadius: '6px',
                border: '1px solid #d9d9d9'
              }}>
                <Text>{aiResponse}</Text>
              </div>
            </div>
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default StrategyManage; 