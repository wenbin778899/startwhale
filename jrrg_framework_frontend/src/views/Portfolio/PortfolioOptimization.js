import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Statistic, 
  Progress, 
  Alert, 
  Tabs, 
  Radio,
  Slider,
  message,
  Tooltip,
  Typography,
  Divider,
  Spin
} from 'antd';
import { 
  ThunderboltOutlined, 
  AimOutlined, 
  RiseOutlined, 
  FallOutlined,
  BarChartOutlined,
  BulbOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  LineChartOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getPortfolioOptimization } from '../../api/portfolio';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;

const PortfolioOptimization = ({ portfolioDetail = {} }) => {
  const [optimizationType, setOptimizationType] = useState('max_sharpe'); // max_sharpe, min_risk, balanced
  const [riskTolerance, setRiskTolerance] = useState(5); // 1-10风险承受能力
  const [targetReturn, setTargetReturn] = useState(0.12); // 目标收益率
  const [optimizationData, setOptimizationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { portfolio = {}, stocks = [], funds = [] } = portfolioDetail;

  // 如果没有持仓数据，显示提示
  if ((!stocks || stocks.length === 0) && (!funds || funds.length === 0)) {
    return (
      <Card>
        <Alert
          message="暂无持仓数据"
          description="请先添加股票或基金持仓，然后再进行优化分析"
          type="info"
          showIcon
        />
      </Card>
    );
  }

  // 获取优化数据
  const fetchOptimizationData = async () => {
    if (!portfolio.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getPortfolioOptimization(portfolio.id);
      if (response.code === 0) {
        setOptimizationData(response.data);
      } else {
        setError(response.message || '获取优化数据失败');
        message.error(response.message || '获取优化数据失败');
      }
    } catch (err) {
      const errorMsg = '获取优化数据失败，请稍后重试';
      setError(errorMsg);
      message.error(errorMsg);
      console.error('获取优化数据出错:', err);
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载数据
  useEffect(() => {
    if (portfolio.id) {
      fetchOptimizationData();
    }
  }, [portfolio.id]);

  // 当优化策略类型改变时，触发重新渲染
  useEffect(() => {
    // 这里不需要重新获取数据，只需要触发组件重新渲染
    // 因为所有策略的数据已经在初始加载时获取了
  }, [optimizationType]);

  // 获取当前选择的优化策略数据
  const getCurrentStrategy = () => {
    if (!optimizationData?.optimization_strategies) return null;
    return optimizationData.optimization_strategies[optimizationType];
  };

  // 获取当前策略的推荐数据
  const getCurrentRecommendations = () => {
    if (!optimizationData?.optimization_strategies) return [];
    
    // 根据不同策略返回对应的推荐
    const currentStrategy = optimizationData.optimization_strategies[optimizationType];
    return currentStrategy?.recommendations || [];
  };

  // 权重对比图表
  const getWeightComparisonOption = () => {
    if (!optimizationData?.assets_stats) return {};
    
    const currentStrategy = getCurrentStrategy();
    if (!currentStrategy) return {};

    const assets = optimizationData.assets_stats;
    const categories = assets.map(asset => asset.name);
    const currentWeights = assets.map(asset => (asset.current_weight * 100).toFixed(2));
    const optimizedWeights = currentStrategy.weights.map(weight => (weight * 100).toFixed(2));

    return {
      title: {
        text: '权重配置对比',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['当前配置', '优化配置'],
        bottom: 0
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          rotate: 45,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        name: '权重 (%)'
      },
      series: [
        {
          name: '当前配置',
          type: 'bar',
          data: currentWeights,
          itemStyle: { color: '#91d5ff' }
        },
        {
          name: '优化配置',
          type: 'bar',
          data: optimizedWeights,
          itemStyle: { color: '#1890ff' }
        }
      ]
    };
  };

  // 风险收益散点图
  const getRiskReturnScatterOption = () => {
    if (!optimizationData?.assets_stats) return {};

    const assets = optimizationData.assets_stats;
    const currentData = assets.map(asset => [
      asset.volatility * 100,
      asset.expected_return * 100,
      asset.name,
      asset.current_weight * 100
    ]);

    return {
      title: {
        text: '风险收益分布',
        left: 'center'
      },
      tooltip: {
        formatter: function(params) {
          return `${params.data[2]}<br/>
                  风险: ${params.data[0].toFixed(2)}%<br/>
                  收益: ${params.data[1].toFixed(2)}%<br/>
                  权重: ${params.data[3].toFixed(2)}%`;
        }
      },
      xAxis: {
        type: 'value',
        name: '风险 (%)',
        nameLocation: 'middle',
        nameGap: 30
      },
      yAxis: {
        type: 'value',
        name: '收益 (%)',
        nameLocation: 'middle',
        nameGap: 40
      },
      series: [{
        type: 'scatter',
        data: currentData,
        symbolSize: function(data) {
          return Math.max(10, data[3] * 2); // 根据权重调整气泡大小
        },
        label: {
          show: true,
          formatter: '{c}',
          position: 'top'
        }
      }]
    };
  };

  // 建议操作表格列定义
  const recommendationColumns = [
    {
      title: '资产名称',
      dataIndex: 'asset_name',
      key: 'asset_name',
      render: (text, record) => (
        <Space>
          <Tag color={record.asset_type === 'stock' ? 'blue' : 'green'}>
            {record.asset_type === 'stock' ? '股票' : '基金'}
          </Tag>
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '操作建议',
      dataIndex: 'action',
      key: 'action',
      render: (text, record) => {
        let color = 'blue';
        if (text.includes('增持')) color = 'green';
        if (text.includes('减持')) color = 'orange';
        
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '当前权重',
      dataIndex: 'current_weight',
      key: 'current_weight',
      render: text => `${text}%`
    },
    {
      title: '目标权重',
      dataIndex: 'target_weight',
      key: 'target_weight',
      render: text => `${text}%`
    },
    {
      title: '权重调整',
      dataIndex: 'weight_change',
      key: 'weight_change',
      render: text => (
        <span style={{ color: parseFloat(text) > 0 ? '#52c41a' : '#f5222d' }}>
          {parseFloat(text) > 0 ? '+' : ''}{text}%
        </span>
      )
    },
    {
      title: '价值调整',
      dataIndex: 'value_change',
      key: 'value_change',
      render: text => (
        <span style={{ color: parseFloat(text) > 0 ? '#52c41a' : '#f5222d' }}>
          {parseFloat(text) > 0 ? '+' : ''}¥{Math.abs(parseFloat(text)).toLocaleString()}
        </span>
      )
    },
    {
      title: '夏普比率',
      dataIndex: 'sharpe_ratio',
      key: 'sharpe_ratio',
      render: text => (
        <span style={{ color: parseFloat(text) > 0 ? '#52c41a' : '#f5222d' }}>
          {text}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <Card style={{ textAlign: 'center', minHeight: 400 }}>
        <Spin size="large" tip="正在分析投资组合，请稍候..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={fetchOptimizationData}>
              重新加载
            </Button>
          }
        />
      </Card>
    );
  }

  const currentStrategy = getCurrentStrategy();
  const recommendations = getCurrentRecommendations();
  const currentMetrics = optimizationData?.current_portfolio_metrics || {};

  return (
    <div>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Title level={4}>
              <BulbOutlined /> 投资组合优化推荐
            </Title>
            <Paragraph>
              基于现代投资组合理论，通过数学模型优化您的资产配置，以实现更好的风险收益平衡。
            </Paragraph>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Text strong>优化目标：</Text>
                <Radio.Group 
                  value={optimizationType} 
                  onChange={e => setOptimizationType(e.target.value)}
                  style={{ marginLeft: 8 }}
                >
                  <Radio.Button value="max_sharpe">最大夏普比率</Radio.Button>
                  <Radio.Button value="min_risk">最小风险</Radio.Button>
                  <Radio.Button value="balanced">平衡配置</Radio.Button>
                </Radio.Group>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>风险承受能力：</Text>
                <Slider
                  min={1}
                  max={10}
                  value={riskTolerance}
                  onChange={setRiskTolerance}
                  style={{ marginLeft: 8, width: 120 }}
                  tooltip={{ formatter: v => `${v}/10` }}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />} 
                  onClick={fetchOptimizationData}
                  loading={loading}
                >
                  重新分析
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="recommendations" size="large">
        <TabPane tab={<span><ThunderboltOutlined />优化建议</span>} key="recommendations">
          <Row gutter={[24, 24]}>
            {/* 组合指标对比 */}
            <Col span={24}>
              <Card title="优化效果对比">
                {currentStrategy && (
                  <Row gutter={[24, 24]}>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="预期收益率"
                        value={currentStrategy.expected_return * 100}
                        precision={2}
                        suffix="%"
                        valueStyle={{ 
                          color: currentStrategy.expected_return > currentMetrics.return ? '#3f8600' : '#cf1322' 
                        }}
                        prefix={
                          currentStrategy.expected_return > currentMetrics.return ? 
                          <RiseOutlined /> : <FallOutlined />
                        }
                      />
                      <Text type="secondary">
                        当前: {(currentMetrics.return * 100).toFixed(2)}%
                      </Text>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="投资组合风险"
                        value={currentStrategy.expected_volatility * 100}
                        precision={2}
                        suffix="%"
                        valueStyle={{ 
                          color: currentStrategy.expected_volatility < currentMetrics.volatility ? '#3f8600' : '#cf1322' 
                        }}
                      />
                      <Text type="secondary">
                        当前: {(currentMetrics.volatility * 100).toFixed(2)}%
                      </Text>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="夏普比率"
                        value={((currentStrategy.expected_return - 0.03) / (currentStrategy.expected_volatility + 0.01))}
                        precision={3}
                        valueStyle={{ 
                          color: ((currentStrategy.expected_return - 0.03) / (currentStrategy.expected_volatility + 0.01)) > currentMetrics.sharpe_ratio ? '#3f8600' : '#cf1322' 
                        }}
                      />
                      <Text type="secondary">
                        当前: {currentMetrics.sharpe_ratio?.toFixed(3) || '0.000'}
                      </Text>
                    </Col>
                  </Row>
                )}
                
                <Alert
                  style={{ marginTop: 16 }}
                  message={`${currentStrategy?.strategy || '优化策略'}`}
                  description={currentStrategy?.description || '正在计算优化建议...'}
                  type="info"
                  showIcon
                />
              </Card>
            </Col>

            {/* 具体调仓建议 */}
            <Col span={24}>
              <Card title="具体调仓建议" extra={
                <Button type="primary" icon={<CheckCircleOutlined />} disabled={!recommendations.length}>
                  一键执行优化
                </Button>
              }>
                {recommendations.length > 0 ? (
                  <Table
                    dataSource={recommendations}
                    columns={recommendationColumns}
                    rowKey="asset_id"
                    pagination={false}
                    size="middle"
                  />
                ) : (
                  <Alert
                    message="当前配置已相对优化"
                    description="您的投资组合配置已经相对合理，暂无需要大幅调整的建议。"
                    type="success"
                    showIcon
                  />
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab={<span><BarChartOutlined />权重分析</span>} key="weights">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="权重配置对比">
                <ReactECharts option={getWeightComparisonOption()} style={{ height: 400 }} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="风险收益分布">
                <ReactECharts option={getRiskReturnScatterOption()} style={{ height: 400 }} />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab={<span><TrophyOutlined />优化策略</span>} key="strategy">
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Card title="优化策略说明">
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <Card size="small" title="最大夏普比率" type="inner">
                      <Paragraph>
                        通过最大化夏普比率来优化投资组合，寻求最佳的风险调整收益。
                        夏普比率 = (投资组合收益率 - 无风险收益率) / 投资组合标准差
                      </Paragraph>
                      <Tag color="blue">适合：追求风险调整收益最大化的投资者</Tag>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="最小风险" type="inner">
                      <Paragraph>
                        在给定收益目标下，通过最小化投资组合方差来降低投资风险。
                        适用于风险厌恶型投资者。
                      </Paragraph>
                      <Tag color="green">适合：保守型投资者</Tag>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="平衡配置" type="inner">
                      <Paragraph>
                        基于传统的股债配置理论，通常采用60%股票+40%基金的经典配置。
                        提供相对稳定的长期收益。
                      </Paragraph>
                      <Tag color="orange">适合：稳健型投资者</Tag>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="智能优化算法" type="inner">
                      <Paragraph>
                        本系统使用现代投资组合理论(MPT)，结合马科维茨均值方差模型，
                        为您提供科学的资产配置建议。
                      </Paragraph>
                      <Tag color="purple">基于：马科维茨投资组合理论</Tag>
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>
            
            <Col span={24}>
              <Card title="投资建议与风险提示">
                <Alert
                  message="重要提示"
                  description={
                    <div>
                      <p>1. 本优化建议基于历史数据和数学模型，不构成投资建议，请结合自身情况谨慎决策。</p>
                      <p>2. 投资有风险，过往业绩不代表未来表现，请根据自身风险承受能力进行投资。</p>
                      <p>3. 建议定期评估和调整投资组合，以适应市场变化和个人目标调整。</p>
                      <p>4. 分散投资是降低风险的有效方式，避免过度集中持仓。</p>
                      <p>5. 优化算法基于现代投资组合理论，但市场存在不确定性，请理性对待建议。</p>
                    </div>
                  }
                  type="warning"
                  showIcon
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default PortfolioOptimization; 