import React, { useState, useEffect } from 'react';
import { Input, Button, Table, Card, message, Select, Spin, Tabs, Alert, Space, Typography, AutoComplete, Descriptions, Divider, List, InputNumber } from 'antd';
import { SearchOutlined, InfoCircleOutlined, LinkOutlined, ReloadOutlined } from '@ant-design/icons';
import { searchStock, getStockInfo, getStockBasicInfo, getStockNews } from '../../api/stock';
import ReactECharts from 'echarts-for-react';

const { Option } = Select;
const { TabPane } = Tabs;
const { Text, Link } = Typography;

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
      if (response.code === 200 && response.data && response.data.length > 0) {
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
      if (response.code === 200) {
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
      if (response.code === 200) {
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
      if (response.code === 200) {
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
      if (response.code === 200) {
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

  // 渲染基本信息卡片
  const renderBasicInfoCard = () => {
    if (!stockData) return null;
    
    // 从stockData中获取基本信息
    const stockName = stockData.name || '未知';
    const stockCode = stockData.symbol || '未知';
    
    // 获取最新的股票价格信息（如果有历史数据）
    let latestPrice = null;
    let priceChange = null;
    let priceChangePercent = null;
    
    if (stockData.history && stockData.history.length > 0) {
      const latestData = stockData.history[0]; // 假设历史数据是按日期降序排列的
      latestPrice = latestData['收盘'];
      priceChange = latestData['涨跌额'];
      priceChangePercent = latestData['涨跌幅'];
    }
    
    // 确定价格变化的颜色
    const priceColor = priceChange > 0 ? '#f5222d' : priceChange < 0 ? '#52c41a' : 'inherit';
    
    return (
      <Card 
        size="small" 
        title={<span>股票基本信息 <Text type="secondary" style={{ fontSize: '12px' }}>(点击股票代码可直接查询)</Text></span>}
        style={{ marginBottom: '20px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong style={{ fontSize: '18px', marginRight: '10px' }}>{stockName}</Text>
            <Button 
              type="link" 
              style={{ padding: '0', fontSize: '16px' }}
              onClick={() => {
                setKeyword(stockCode);
                handleQuery(stockCode);
              }}
            >
              {stockCode}
            </Button>
          </div>
          
          {latestPrice && (
            <div style={{ textAlign: 'right' }}>
              <Text strong style={{ fontSize: '18px', color: priceColor, display: 'block' }}>
                {latestPrice}
              </Text>
              <Space>
                <Text style={{ color: priceColor }}>{priceChange > 0 ? '+' : ''}{priceChange}</Text>
                <Text style={{ color: priceColor }}>({priceChangePercent}%)</Text>
              </Space>
            </div>
          )}
        </div>
        
        {stockBasicInfo && stockBasicInfo.industry && stockBasicInfo.industry['所属行业'] && (
          <div style={{ marginTop: '10px' }}>
            <Text type="secondary">所属行业: {stockBasicInfo.industry['所属行业']}</Text>
          </div>
        )}
        
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            type="primary" 
            size="small"
            onClick={() => handleQuery(stockCode)}
          >
            刷新数据
          </Button>
          
          <Space>
            <Text type="secondary">数据更新时间: {stockData.history && stockData.history.length > 0 ? stockData.history[0]['日期'] : '未知'}</Text>
          </Space>
        </div>
      </Card>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title="股票信息查询" bordered={false}>
        <Alert
          message="使用说明"
          description={
            <div>
              <p>1. 输入股票代码进行搜索，例如：000001（平安银行）</p>
              <p>2. 选择时间范围（默认30天）</p>
              <p>3. 在搜索结果中点击查询按钮获取详细信息</p>
              <p>4. 在基本资料中点击股票代码可以直接查询该股票</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />

        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <AutoComplete
            style={{ width: '300px' }}
            options={autoCompleteOptions}
            onSelect={handleAutoCompleteSelect}
            onSearch={handleInputChange}
            value={keyword}
            //notFoundContent={autoCompleteLoading ? <Spin size="small" /> : "   "}
            placeholder="请输入股票代码"
            filterOption={false}
            defaultActiveFirstOption={false}
          >
            <Input 
              prefix={<SearchOutlined />}
              onPressEnter={handleSearch}
              allowClear
            />
          </AutoComplete>
          <Button 
            type="primary" 
            onClick={handleSearch} 
            loading={searchLoading}
          >
            搜索
          </Button>
          <Select
            style={{ width: '120px' }}
            value={days}
            onChange={(value) => setDays(value)}
          >
            <Option value={7}>最近7天</Option>
            <Option value={30}>最近30天</Option>
            <Option value={90}>最近90天</Option>
            <Option value={180}>最近180天</Option>
            <Option value={365}>最近一年</Option>
          </Select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <Text type="secondary">示例股票：</Text>
          <Space>
            {exampleStocks.map(stock => (
              <Button 
                key={stock.code} 
                type="link" 
                onClick={() => handleExampleClick(stock)}
              >
                {stock.name}({stock.code})
              </Button>
            ))}
          </Space>
        </div>

        {errorMessage && (
          <Alert
            message="错误"
            description={errorMessage}
            type="error"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}

        {stockData && renderBasicInfoCard()}

        {searchResults.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3>搜索结果</h3>
            <Table
              dataSource={searchResults}
              columns={searchColumns}
              rowKey="代码"
              size="small"
              pagination={false}
            />
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : stockData && (
          <div>
            <h2>{stockData.name} ({stockData.symbol})</h2>
            
            <Tabs defaultActiveKey="chart" style={{ marginBottom: '20px' }}>
              <TabPane tab="K线图" key="chart">
                <div style={{ height: '400px', marginBottom: '20px' }}>
                  <ReactECharts option={getKLineOption()} style={{ height: '100%' }} />
                </div>
              </TabPane>
              <TabPane tab="成交量" key="volume">
                <div style={{ height: '400px', marginBottom: '20px' }}>
                  <ReactECharts option={getVolumeOption()} style={{ height: '100%' }} />
                </div>
              </TabPane>
              <TabPane tab="涨跌幅" key="change">
                <div style={{ height: '400px', marginBottom: '20px' }}>
                  <ReactECharts option={getPriceChangeOption()} style={{ height: '100%' }} />
                </div>
              </TabPane>
              <TabPane tab="数据表" key="table">
                <Table
                  dataSource={stockData.history}
                  columns={columns}
                  rowKey="日期"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 'max-content' }}
                />
              </TabPane>
              <TabPane tab="基本资料" key="basic">
                {basicInfoLoading ? (
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  renderBasicInfo()
                )}
              </TabPane>
              <TabPane tab="相关新闻" key="news">
                {newsLoading ? (
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  renderStockNews()
                )}
              </TabPane>
            </Tabs>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StockQuery; 