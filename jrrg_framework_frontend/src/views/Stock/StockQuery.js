import React, { useState, useEffect } from 'react';
import { 
  Input, Button, Table, Card, message, Select, Spin, Tabs, Alert, 
  Space, Typography, AutoComplete, Descriptions, Divider, List, 
  InputNumber, Row, Col, Statistic, Progress, Badge, Tag, Avatar
} from 'antd';
import { 
  SearchOutlined, InfoCircleOutlined, LinkOutlined, ReloadOutlined,
  RiseOutlined, SecurityScanFilled, DollarOutlined,
  LineChartOutlined, BarChartOutlined, StockOutlined, NotificationOutlined,
  FallOutlined, SwapOutlined
} from '@ant-design/icons';
import { searchStock, getStockInfo, getStockBasicInfo, getStockNews } from '../../api/stock';
import ReactECharts from 'echarts-for-react';
import './StockQuery.css';

const { Option } = Select;
const { TabPane } = Tabs;
const { Text, Link, Title } = Typography;

const StockQuery = () => {
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [stockBasicInfo, setStockBasicInfo] = useState(null);
  const [stockNews, setStockNews] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [basicInfoLoading, setBasicInfoLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [autoCompleteOptions, setAutoCompleteOptions] = useState([]);
  const [autoCompleteLoading, setAutoCompleteLoading] = useState(false);
  const [newsLimit, setNewsLimit] = useState(10);

  // 示例股票代码
  const exampleStocks = [
    { code: '000001', name: '平安银行' },
    { code: '600000', name: '浦发银行' },
    { code: '601318', name: '中国平安' },
  ];

  // 处理输入变化，提供自动完成建议
  const handleInputChange = async (value) => {
    setKeyword(value);
    
    // 如果输入少于1个字符，不进行自动完成
    if (!value || value.length < 1) {
      setAutoCompleteOptions([]);
      return;
    }
    
    setAutoCompleteLoading(true);
    try {
      const response = await searchStock(value);
      if (response.code === 0 && response.data && response.data.length > 0) {
        // 转换为AutoComplete需要的格式
        const options = response.data.map(item => ({
          value: item.代码,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.名称}</span>
              <span style={{ color: '#888' }}>{item.代码}</span>
            </div>
          )
        }));
        setAutoCompleteOptions(options);
        console.log('自动完成选项:', options);
      } else {
        setAutoCompleteOptions([]);
        console.log('未找到匹配的股票');
      }
    } catch (error) {
      console.error('获取自动完成数据失败:', error);
      setAutoCompleteOptions([]);
    } finally {
      setAutoCompleteLoading(false);
    }
  };

  // 处理自动完成选择
  const handleAutoCompleteSelect = (value, option) => {
    setKeyword(value);
    handleQuery(value);
  };

  // 搜索股票
  const handleSearch = async () => {
    if (!keyword.trim()) {
      message.error('请输入股票代码');
      return;
    }

    setSearchLoading(true);
    setErrorMessage('');
    try {
      // 检查输入是否为6位数字（股票代码格式）
      if (/^\d{6}$/.test(keyword.trim())) {
        // 如果是标准股票代码格式，直接查询详细信息
        setSearchLoading(false);
        handleQuery(keyword.trim());
        return;
      }
      
      // 如果不是股票代码，则先搜索获取股票代码
      const response = await searchStock(keyword);
      if (response.code === 0) {
        if (!response.data || response.data.length === 0) {
          message.info('未找到匹配的股票');
          setSearchResults([]);
        } else if (response.data.length === 1) {
          // 如果只找到一个匹配结果，自动查询详细信息
          const stockCode = response.data[0].代码;
          message.success(`已找到股票: ${response.data[0].名称}(${stockCode}), 正在获取详细信息...`);
          handleQuery(stockCode);
          setSearchResults([]); // 清空搜索结果，因为已经直接查询了
        } else {
          // 找到多个匹配结果，显示列表
          setSearchResults(response.data);
          message.info(`找到 ${response.data.length} 个匹配结果，请选择一个进行查询`);
        }
      } else {
        setErrorMessage(response.message || '搜索失败');
        message.error(response.message || '搜索失败');
      }
    } catch (error) {
      console.error('搜索股票出错:', error);
      setErrorMessage('搜索股票失败，请稍后重试');
      message.error('搜索股票失败，请稍后重试');
    } finally {
      setSearchLoading(false);
    }
  };

  // 查询股票信息
  const handleQuery = async (symbol) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await getStockInfo(symbol, days);
      if (response.code === 0) {
        setStockData(response.data);
        setSelectedStock(response.data.symbol);
        
        // 获取股票基本信息
        fetchStockBasicInfo(response.data.symbol);
        
        // 获取股票相关新闻
        fetchStockNews(response.data.symbol);
      } else {
        setErrorMessage(response.message || '获取股票信息失败');
        message.error(response.message || '获取股票信息失败');
      }
    } catch (error) {
      console.error('获取股票信息出错:', error);
      setErrorMessage('获取股票信息失败，请稍后重试');
      message.error('获取股票信息失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取股票基本信息
  const fetchStockBasicInfo = async (symbol) => {
    setBasicInfoLoading(true);
    try {
      const response = await getStockBasicInfo(symbol);
      if (response.code === 0) {
        setStockBasicInfo(response.data);
      } else {
        console.error('获取股票基本信息失败:', response.message);
      }
    } catch (error) {
      console.error('获取股票基本信息出错:', error);
    } finally {
      setBasicInfoLoading(false);
    }
  };

  // 获取股票相关新闻
  const fetchStockNews = async (symbol, limit = newsLimit) => {
    setNewsLoading(true);
    try {
      const response = await getStockNews(symbol, limit);
      if (response.code === 0) {
        setStockNews(response.data);
        if (response.data.length === 0) {
          message.info('未找到相关新闻');
        } else {
          message.success(`成功获取到 ${response.data.length} 条相关新闻`);
        }
      } else {
        console.error('获取股票新闻失败:', response.message);
        message.error('获取股票新闻失败');
      }
    } catch (error) {
      console.error('获取股票新闻出错:', error);
      message.error('获取股票新闻失败，请稍后重试');
    } finally {
      setNewsLoading(false);
    }
  };

  // 处理示例股票点击
  const handleExampleClick = (stock) => {
    setKeyword(stock.code);
    handleQuery(stock.code);
  };

  // 处理新闻数量变化
  const handleNewsLimitChange = (value) => {
    if (value && value > 0) {
      setNewsLimit(value);
      if (selectedStock) {
        fetchStockNews(selectedStock, value);
      }
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: '日期',
      key: '日期',
    },
    {
      title: '开盘',
      dataIndex: '开盘',
      key: '开盘',
    },
    {
      title: '收盘',
      dataIndex: '收盘',
      key: '收盘',
    },
    {
      title: '最高',
      dataIndex: '最高',
      key: '最高',
    },
    {
      title: '最低',
      dataIndex: '最低',
      key: '最低',
    },
    {
      title: '成交量',
      dataIndex: '成交量',
      key: '成交量',
    },
    {
      title: '成交额',
      dataIndex: '成交额',
      key: '成交额',
    },
    {
      title: '振幅',
      dataIndex: '振幅',
      key: '振幅',
    },
    {
      title: '涨跌幅',
      dataIndex: '涨跌幅',
      key: '涨跌幅',
    },
    {
      title: '涨跌额',
      dataIndex: '涨跌额',
      key: '涨跌额',
    },
  ];

  // 搜索结果列定义
  const searchColumns = [
    {
      title: '股票代码',
      dataIndex: '代码',
      key: '代码',
    },
    {
      title: '股票名称',
      dataIndex: '名称',
      key: '名称',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small" 
          onClick={() => {
            message.success(`已选择股票: ${record.名称}(${record.代码}), 正在获取详细信息...`);
            handleQuery(record.代码);
            setSearchResults([]); // 清空搜索结果，因为已经选择了一个
          }}
        >
          查询
        </Button>
      ),
    },
  ];

  // 准备K线图数据
  const getKLineOption = () => {
    if (!stockData || !stockData.history || stockData.history.length === 0) {
      return {};
    }

    const dates = stockData.history.map(item => item['日期']);
    const data = stockData.history.map(item => [
      item['开盘'],
      item['收盘'],
      item['最低'],
      item['最高'],
    ]);

    return {
      title: {
        text: `${stockData.name} (${stockData.symbol}) K线图`,
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      xAxis: {
        type: 'category',
        data: dates,
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        splitNumber: 20
      },
      yAxis: {
        scale: true,
        splitArea: {
          show: true
        }
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          show: true,
          type: 'slider',
          top: '90%',
          start: 0,
          end: 100
        }
      ],
      series: [
        {
          name: '价格',
          type: 'candlestick',
          data: data,
          itemStyle: {
            color: '#ef232a',
            color0: '#14b143',
            borderColor: '#ef232a',
            borderColor0: '#14b143'
          }
        }
      ]
    };
  };

  // 准备成交量图表数据
  const getVolumeOption = () => {
    if (!stockData || !stockData.history || stockData.history.length === 0) {
      return {};
    }

    const dates = stockData.history.map(item => item['日期']);
    const volumes = stockData.history.map(item => item['成交量']);
    const closes = stockData.history.map(item => item['收盘']);
    const opens = stockData.history.map(item => item['开盘']);

    // 计算涨跌颜色
    const colors = [];
    for (let i = 0; i < closes.length; i++) {
      if (closes[i] >= opens[i]) {
        colors.push('#ef232a'); // 红色表示上涨
      } else {
        colors.push('#14b143'); // 绿色表示下跌
      }
    }

    return {
      title: {
        text: `${stockData.name} (${stockData.symbol}) 成交量`,
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      xAxis: {
        type: 'category',
        data: dates,
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        splitNumber: 20
      },
      yAxis: {
        scale: true,
        splitArea: {
          show: true
        }
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          show: true,
          type: 'slider',
          top: '90%',
          start: 0,
          end: 100
        }
      ],
      series: [
        {
          name: '成交量',
          type: 'bar',
          data: volumes,
          itemStyle: {
            color: function(params) {
              return colors[params.dataIndex];
            }
          }
        }
      ]
    };
  };

  // 准备涨跌幅图表数据
  const getPriceChangeOption = () => {
    if (!stockData || !stockData.history || stockData.history.length === 0) {
      return {};
    }

    const dates = stockData.history.map(item => item['日期']);
    const changes = stockData.history.map(item => item['涨跌幅']);

    return {
      title: {
        text: `${stockData.name} (${stockData.symbol}) 涨跌幅`,
        left: 'center',
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [
        {
          name: '涨跌幅',
          type: 'line',
          data: changes,
          markLine: {
            data: [
              { yAxis: 0, lineStyle: { color: '#999' } }
            ]
          },
          itemStyle: {
            color: function(params) {
              return params.value >= 0 ? '#ef232a' : '#14b143';
            }
          },
          lineStyle: {
            width: 2
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0,
                color: 'rgba(239, 35, 42, 0.3)'
              }, {
                offset: 1,
                color: 'rgba(20, 177, 67, 0.3)'
              }]
            }
          }
        }
      ]
    };
  };

  // 渲染股票基本信息
  const renderBasicInfo = () => {
    if (!stockBasicInfo) return null;
    
    const { basic_info, fund_flow, industry } = stockBasicInfo;
    
    // 创建一个函数，用于处理点击股票代码的事件
    const handleStockCodeClick = (code) => {
      if (code && /^\d{6}$/.test(code)) {
        setKeyword(code);
        handleQuery(code);
        message.info(`正在查询股票: ${code}`);
      }
    };
    
    // 自定义渲染描述项，如果是股票代码则可点击
    const renderDescriptionItem = (key, value) => {
      // 检查是否是股票代码格式（6位数字）
      if (value && typeof value === 'string' && /^\d{6}$/.test(value)) {
        return (
          <Descriptions.Item key={key} label={key}>
            <Button 
              type="link" 
              style={{ padding: '0' }}
              onClick={() => handleStockCodeClick(value)}
            >
              {value}
            </Button>
          </Descriptions.Item>
        );
      }
      
      return (
        <Descriptions.Item key={key} label={key}>{value}</Descriptions.Item>
      );
    };
    
    return (
      <div>
        <div style={{ marginBottom: '20px' }}>
          <Alert
            message="提示"
            description="点击股票代码可以直接查询该股票的详细信息"
            type="info"
            showIcon
          />
        </div>
        
        <Divider orientation="left">基本信息</Divider>
        <Descriptions bordered size="small" column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
          {basic_info && Object.entries(basic_info).map(([key, value]) => 
            renderDescriptionItem(key, value)
          )}
        </Descriptions>
        
        {industry && Object.keys(industry).length > 0 && (
          <>
            <Divider orientation="left">行业信息</Divider>
            <Descriptions bordered size="small" column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
              {Object.entries(industry).map(([key, value]) => 
                renderDescriptionItem(key, value)
              )}
            </Descriptions>
          </>
        )}
        
        {fund_flow && Object.keys(fund_flow).length > 0 && (
          <>
            <Divider orientation="left">资金流向</Divider>
            <Descriptions bordered size="small" column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
              {Object.entries(fund_flow).map(([key, value]) => 
                renderDescriptionItem(key, value)
              )}
            </Descriptions>
          </>
        )}
      </div>
    );
  };

  // 渲染股票新闻
  const renderStockNews = () => {
    if (stockNews.length === 0) {
      return (
        <div>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Text strong>新闻数量限制:</Text>
              <InputNumber 
                min={1} 
                max={50} 
                value={newsLimit} 
                onChange={handleNewsLimitChange} 
                style={{ width: '80px' }}
              />
            </Space>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={() => selectedStock && fetchStockNews(selectedStock)}
              loading={newsLoading}
            >
              刷新新闻
            </Button>
          </div>
          <Alert message="暂无相关新闻" type="info" />
        </div>
      );
    }
    
    return (
      <div>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Text strong>共找到 {stockNews.length} 条相关新闻</Text>
            <Divider type="vertical" />
            <Text strong>新闻数量限制:</Text>
            <InputNumber 
              min={1} 
              max={50} 
              value={newsLimit} 
              onChange={handleNewsLimitChange} 
              style={{ width: '80px' }}
            />
          </Space>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={() => selectedStock && fetchStockNews(selectedStock)}
            loading={newsLoading}
          >
            刷新新闻
          </Button>
        </div>
        
        <List
          itemLayout="vertical"
          dataSource={stockNews}
          pagination={{
            pageSize: 5,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
            showTotal: (total) => `共 ${total} 条新闻`
          }}
          renderItem={(item) => (
            <List.Item
              key={item.新闻标题 + item.发布时间}
              actions={[
                <Space key="info">
                  <Text type="secondary" key="time">
                    <span style={{ marginRight: '8px' }}>发布时间: {item.发布时间}</span>
                  </Text>
                  <Text type="secondary" key="source">
                    来源: {item.新闻来源}
                  </Text>
                </Space>
              ]}
              extra={
                <Button 
                  type="primary" 
                  icon={<LinkOutlined />} 
                  href={item.新闻链接} 
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  阅读原文
                </Button>
              }
            >
              <List.Item.Meta
                title={
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    <Link href={item.新闻链接} target="_blank" rel="noopener noreferrer">
                      {item.新闻标题}
                    </Link>
                  </div>
                }
                description={
                  <div style={{ marginTop: '8px' }}>
                    {item.新闻内容 ? (
                      <div>
                        <Text type="secondary" ellipsis={{ rows: 3 }}>
                          {item.新闻内容}
                        </Text>
                      </div>
                    ) : (
                      <Text type="secondary" italic>无内容预览</Text>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
    );
  };

  // 完整的搜索框组件
  const renderSearchBox = () => {
    return (
      <div className="integrated-search-container">
        <div className="search-box-wrapper">
          <div className="search-input-section">
            <SearchOutlined className="search-icon" />
            <AutoComplete
              className="search-autocomplete"
              options={autoCompleteOptions}
              onSelect={handleAutoCompleteSelect}
              onSearch={handleInputChange}
              value={keyword}
              filterOption={false}
              defaultActiveFirstOption={false}
              dropdownClassName="search-dropdown"
            >
              <Input
                className="search-input"
                onPressEnter={handleSearch}
                allowClear
                bordered={false}
              />
            </AutoComplete>
          </div>
          <Button
            type="primary"
            className="search-submit-btn"
            onClick={handleSearch}
            loading={searchLoading}
            icon={<SearchOutlined />}
          >
            搜索
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="modern-stock-container">
      {/* 顶部搜索区域 */}
      <div className="stock-search-header">
        <div className="search-header-background">
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} lg={16}>
              <div className="search-section">
                <Title level={2} className="search-title">
                  <StockOutlined className="title-icon" />
                  股票行情分析
                </Title>
                
                <Space.Compact size="large" className="search-input-group">
                  {renderSearchBox()}
                </Space.Compact>
              </div>
            </Col>
            
            <Col xs={24} lg={8}>
              <div className="quick-stocks">
                <div className="control-section">
                  <Text className="quick-title">查询设置</Text>
                  <div style={{ marginBottom: '16px' }}>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginRight: '8px' }}>时间范围:</Text>
                    <Select
                      size="middle"
                      value={days}
                      onChange={(value) => setDays(value)}
                      className="time-selector-separate"
                      style={{ minWidth: '100px' }}
                    >
                      <Option value={7}>7天</Option>
                      <Option value={30}>30天</Option>
                      <Option value={90}>90天</Option>
                      <Option value={180}>180天</Option>
                      <Option value={365}>一年</Option>
                    </Select>
                  </div>
                </div>
                
                <Text className="quick-title">热门股票</Text>
                <div className="stock-tags">
                  {exampleStocks.map(stock => (
                    <Tag 
                      key={stock.code} 
                      className="stock-tag"
                      onClick={() => handleExampleClick(stock)}
                      icon={<RiseOutlined />}
                    >
                      {stock.name}
                    </Tag>
                  ))}
                </div>
              </div>
            </Col>
          </Row>
        </div>
        </div>

      {/* 错误提示 */}
        {errorMessage && (
          <Alert
          message="查询失败"
            description={errorMessage}
            type="error"
            showIcon
          closable
          className="error-alert"
        />
      )}

      {/* 股票基本信息概览 */}
      {stockData && (
        <div className="stock-overview-section">
          <Card className="stock-overview-card" bordered={false}>
            <Row gutter={[24, 16]} align="middle">
              <Col xs={24} md={12} lg={8}>
                <div className="stock-info-main">
                  <div className="stock-name-section">
                    <Avatar 
                      size={48} 
                      className="stock-avatar"
                      style={{ backgroundColor: '#1890ff' }}
                    >
                      {stockData.name ? stockData.name.charAt(0) : 'S'}
                    </Avatar>
                    <div className="stock-name-details">
                      <Title level={3} className="stock-name">
                        {stockData.name || '未知股票'}
                      </Title>
                      <Text className="stock-code">{stockData.symbol}</Text>
                    </div>
                  </div>
                </div>
              </Col>
              
              <Col xs={24} md={12} lg={16}>
                {stockData.history && stockData.history.length > 0 && (
                  <div className="stock-price-section">
                    <Row gutter={[16, 8]}>
                      <Col xs={12} sm={6}>
                        <Statistic 
                          title="最新价格" 
                          value={stockData.history[0]['收盘']} 
                          precision={2}
                          valueStyle={{ 
                            color: stockData.history[0]['涨跌额'] >= 0 ? '#f5222d' : '#52c41a',
                            fontSize: '24px',
                            fontWeight: 'bold'
                          }}
                          prefix={<DollarOutlined />}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic 
                          title="涨跌额" 
                          value={stockData.history[0]['涨跌额']} 
                          precision={2}
                          valueStyle={{ 
                            color: stockData.history[0]['涨跌额'] >= 0 ? '#f5222d' : '#52c41a' 
                          }}
                          prefix={stockData.history[0]['涨跌额'] >= 0 ? <RiseOutlined /> : <FallOutlined />}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic 
                          title="涨跌幅" 
                          value={stockData.history[0]['涨跌幅']} 
                          precision={2}
                          suffix="%"
                          valueStyle={{ 
                            color: stockData.history[0]['涨跌幅'] >= 0 ? '#f5222d' : '#52c41a' 
                          }}
                        />
                      </Col>
                      <Col xs={12} sm={6}>
                        <Statistic 
                          title="成交量" 
                          value={stockData.history[0]['成交量']} 
                          formatter={(value) => `${(value / 10000).toFixed(2)}万`}
                          valueStyle={{ color: '#1890ff' }}
                          prefix={<BarChartOutlined />}
                        />
                      </Col>
                    </Row>
                  </div>
                )}
              </Col>
            </Row>
            
            <Divider style={{ margin: '16px 0' }} />
            
            <Row gutter={16}>
              <Col span={8}>
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />}
                  onClick={() => handleQuery(stockData.symbol)}
                  className="action-button"
                >
                  刷新数据
                </Button>
              </Col>
              <Col span={16}>
                <Text type="secondary" className="update-time">
                  数据更新时间: {stockData.history && stockData.history.length > 0 ? stockData.history[0]['日期'] : '未知'}
                </Text>
              </Col>
            </Row>
          </Card>
        </div>
      )}

      {/* 搜索结果表格 */}
        {searchResults.length > 0 && (
        <Card 
          title={
            <Space>
              <SearchOutlined />
              搜索结果 ({searchResults.length}个)
            </Space>
          }
          className="search-results-card"
        >
            <Table
              dataSource={searchResults}
              columns={searchColumns}
              rowKey="代码"
            size="middle"
              pagination={false}
            className="search-results-table"
            />
        </Card>
        )}

      {/* 加载状态 */}
      {loading && (
        <div className="loading-section">
            <Spin size="large" />
          <Text className="loading-text">正在加载股票数据...</Text>
          </div>
      )}

      {/* 主要图表和数据区域 */}
      {stockData && !loading && (
        <div className="stock-data-section">
          <Tabs 
            defaultActiveKey="chart" 
            className="stock-data-tabs"
            size="large"
            items={[
              {
                key: 'chart',
                label: (
                  <Space>
                    <LineChartOutlined />
                    K线图
                  </Space>
                ),
                children: (
                  <Card className="chart-card" bordered={false}>
                    <div className="chart-container">
                      <ReactECharts 
                        option={getKLineOption()} 
                        style={{ height: '500px', width: '100%' }} 
                        className="stock-chart"
                      />
                </div>
                  </Card>
                )
              },
              {
                key: 'volume',
                label: (
                  <Space>
                    <BarChartOutlined />
                    成交量
                  </Space>
                ),
                children: (
                  <Card className="chart-card" bordered={false}>
                    <div className="chart-container">
                      <ReactECharts 
                        option={getVolumeOption()} 
                        style={{ height: '500px', width: '100%' }} 
                        className="stock-chart"
                      />
                </div>
                  </Card>
                )
              },
              {
                key: 'change',
                label: (
                  <Space>
                    <SwapOutlined />
                    涨跌幅
                  </Space>
                ),
                children: (
                  <Card className="chart-card" bordered={false}>
                    <div className="chart-container">
                      <ReactECharts 
                        option={getPriceChangeOption()} 
                        style={{ height: '500px', width: '100%' }} 
                        className="stock-chart"
                      />
                </div>
                  </Card>
                )
              },
              {
                key: 'table',
                label: (
                  <Space>
                    <InfoCircleOutlined />
                    数据表
                  </Space>
                ),
                children: (
                  <Card className="data-table-card" bordered={false}>
                <Table
                  dataSource={stockData.history}
                  columns={columns}
                  rowKey="日期"
                      pagination={{ 
                        pageSize: 15,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 条记录`
                      }}
                  scroll={{ x: 'max-content' }}
                      className="stock-data-table"
                    />
                  </Card>
                )
              },
              {
                key: 'basic',
                label: (
                  <Space>
                    <InfoCircleOutlined />
                    基本资料
                  </Space>
                ),
                children: (
                  <Card className="basic-info-card" bordered={false}>
                {basicInfoLoading ? (
                      <div className="loading-section">
                    <Spin size="large" />
                        <Text className="loading-text">正在加载基本资料...</Text>
                  </div>
                ) : (
                      <div className="basic-info-content">
                        {renderBasicInfo()}
                      </div>
                    )}
                  </Card>
                )
              },
              {
                key: 'news',
                label: (
                  <Space>
                    <NotificationOutlined />
                    相关新闻
                    <Badge count={stockNews.length} size="small" />
                  </Space>
                ),
                children: (
                  <Card className="news-card" bordered={false}>
                    <div className="news-header">
                      <Title level={4}>
                        <NotificationOutlined /> 相关新闻
                      </Title>
                      <Space>
                        <Text>显示条数：</Text>
                        <Select
                          size="small"
                          value={newsLimit}
                          onChange={handleNewsLimitChange}
                          style={{ width: 80 }}
                        >
                          <Option value={5}>5条</Option>
                          <Option value={10}>10条</Option>
                          <Option value={20}>20条</Option>
                          <Option value={50}>50条</Option>
                        </Select>
                      </Space>
                    </div>
                {newsLoading ? (
                      <div className="loading-section">
                    <Spin size="large" />
                        <Text className="loading-text">正在加载新闻数据...</Text>
                  </div>
                ) : (
                      <div className="news-content">
                        {renderStockNews()}
          </div>
        )}
      </Card>
                )
              }
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default StockQuery; 