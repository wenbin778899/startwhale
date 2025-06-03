import React, { useState, useEffect } from 'react';
import {
  Form,
  Select,
  DatePicker,
  InputNumber,
  Button,
  message,
  Divider,
  Alert,
  Spin,
  Space,
  Tooltip,
  Typography,
  Card
} from 'antd';
import {
  QuestionCircleOutlined,
  ExperimentOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  CalendarOutlined,
  MoneyCollectOutlined,
  PercentageOutlined,
  StockOutlined,
  RocketOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { getBacktestStrategies, runBacktest } from '../../../api/strategy';
import http from '../../../utils/http';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;

const BacktestForm = ({ favoriteStocks, onBacktestComplete }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [strategiesLoading, setStrategiesLoading] = useState(false);
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  // 加载策略列表
  useEffect(() => {
    loadStrategies();
  }, []);

  // 加载可用的回测策略
  const loadStrategies = async () => {
    try {
      setStrategiesLoading(true);
      const response = await getBacktestStrategies();
      if (response && response.data) {
        setStrategies(response.data);
        // 默认选择第一个策略
        if (response.data.length > 0) {
          setSelectedStrategy(response.data[0]);
          form.setFieldsValue({
            strategy_name: response.data[0].id
          });
        }
      }
    } catch (error) {
      console.error('加载策略列表失败:', error);
      message.error('加载策略列表失败，请稍后重试');
    } finally {
      setStrategiesLoading(false);
    }
  };

  // 处理策略选择变化
  const handleStrategyChange = (strategyId) => {
    const strategy = strategies.find(s => s.id === strategyId);
    setSelectedStrategy(strategy);
    
    // 重置策略参数为默认值
    if (strategy && strategy.params) {
      const defaultParams = {};
      strategy.params.forEach(param => {
        defaultParams[param.name] = param.default;
      });
      form.setFieldsValue({
        strategy_params: defaultParams
      });
    }
  };

  // 提交回测表单
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // 获取选中的股票信息
      const stockInfo = favoriteStocks.find(stock => stock.stock_code === values.stock_code);
      
      // 构建回测参数
      const backtestParams = {
        stock_code: values.stock_code,
        stock_name: stockInfo ? stockInfo.stock_name : '',
        strategy_name: values.strategy_name,
        start_date: values.date_range[0].format('YYYY-MM-DD'),
        end_date: values.date_range[1].format('YYYY-MM-DD'),
        initial_cash: values.initial_cash,
        commission: values.commission / 100, // 转换为小数
        strategy_params: values.strategy_params
      };
      
      console.log('回测参数:', backtestParams);
      
      // 检查日期范围是否过短
      const startDate = values.date_range[0];
      const endDate = values.date_range[1];
      const daysDiff = endDate.diff(startDate, 'days');
      
      if (daysDiff < 30) {
        message.warning('回测日期范围过短，建议至少选择30天以上的日期范围以获得更准确的结果');
      }
      
      // 调用回测API
      const response = await runBacktest(backtestParams);
      
      if (response && response.data) {
        message.success('回测完成');
        // 调用回调函数，传递回测结果
        onBacktestComplete(response.data);
      } else {
        // 服务器返回了响应，但没有data字段
        message.error('回测失败: 服务器返回了无效的响应');
        console.error('回测响应异常:', response);
      }
      
    } catch (error) {
      console.error('回测失败:', error);
      
      // 尝试提取更详细的错误信息
      let errorMessage = '回测失败';
      if (error.response) {
        // 服务器返回了错误状态码
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `服务器错误 (${error.response.status})`;
        }
      } else if (error.request) {
        // 请求发送了但没有收到响应
        errorMessage = '无法连接到服务器，请检查网络连接';
      } else if (error.message) {
        // 请求设置时出现问题
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 添加测试股票数据的功能
  const testStockData = async () => {
    try {
      // 获取当前表单值
      const values = form.getFieldsValue();
      
      if (!values.stock_code) {
        message.warning('请先选择股票');
        return;
      }
      
      if (!values.date_range || !values.date_range[0] || !values.date_range[1]) {
        message.warning('请先选择日期范围');
        return;
      }
      
      const startDate = values.date_range[0].format('YYYY-MM-DD');
      const endDate = values.date_range[1].format('YYYY-MM-DD');
      
      // 检查日期范围
      const daysDiff = values.date_range[1].diff(values.date_range[0], 'days');
      if (daysDiff < 30) {
        message.warning('日期范围较短，建议选择至少30天以上的回测周期');
      }
      
      message.loading({ content: '正在测试股票数据...', key: 'testData', duration: 0 });
      
      // 调用测试接口
      const response = await http.get('/api/strategy/test_stock_data', {
        params: {
          stock_code: values.stock_code,
          start_date: startDate,
          end_date: endDate
        }
      });
      
      if (response && response.code === 0 && response.data) {
        const { data_length, first_rows, last_rows } = response.data;
        
        if (data_length > 0) {
          // 计算数据范围中的交易日数量，作为参考
          let tradingDaysMsg = '';
          if (daysDiff > 0) {
            const avgTradingDaysPerMonth = (data_length / daysDiff) * 30;
            tradingDaysMsg = `，约占选定时间范围的 ${(data_length / daysDiff * 100).toFixed(1)}%`;
          }
          
          message.success({ 
            content: (
              <div>
                <div>测试成功! 获取到 <b>{data_length}</b> 条股票数据记录{tradingDaysMsg}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  数据范围: {first_rows.length > 0 ? first_rows[0].date : startDate} 至 
                  {last_rows.length > 0 ? last_rows[last_rows.length-1].date : endDate}
                </div>
              </div>
            ), 
            key: 'testData',
            icon: <CheckCircleOutlined />,
            duration: 5
          });
          
          // 如果数据量足够，建议用户继续
          if (data_length >= 60) {
            setTimeout(() => {
              message.info('数据量充足，可以开始回测');
            }, 1000);
          } else if (data_length < 60) {
            // 如果数据量不足，建议用户扩大时间范围
            setTimeout(() => {
              message.warning({
                content: '数据量较少，建议扩大回测时间范围以获得更准确的结果',
                duration: 5
              });
            }, 1000);
          }
        } else {
          message.warning({ 
            content: '获取到的数据记录为空，回测可能无法正常进行，请尝试其他股票或修改日期范围', 
            key: 'testData',
            duration: 5
          });
        }
      } else {
        message.error({ 
          content: '测试失败: ' + (response?.message || '未知错误'), 
          key: 'testData',
          duration: 5
        });
      }
    } catch (error) {
      console.error('测试股票数据失败:', error);
      let errorMessage = '测试失败';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error({ content: errorMessage, key: 'testData', duration: 5 });
    }
  };

  return (
    <div className="backtest-form">
      <Alert
        message="回测说明"
        description="策略回测使用历史行情数据模拟交易策略的执行过程，帮助评估策略的有效性。请注意，历史业绩不代表未来表现，回测结果仅供参考。"
        type="info"
        showIcon
        style={{ marginBottom: '12px' }}
      />
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark="optional"
        className="backtest-form-container"
        size="small"
      >
        <div className="strategy-select-container">
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                <RocketOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                <span>选择回测策略</span>
              </div>
            }
            bordered={false}
            className="form-card"
            size="small"
          >
            <Form.Item
              name="strategy_name"
              label="策略"
              rules={[{ required: true, message: '请选择策略' }]}
            >
              <Select
                placeholder="选择回测策略"
                onChange={handleStrategyChange}
                loading={strategiesLoading}
                disabled={strategiesLoading}
                suffixIcon={<SettingOutlined />}
              >
                {strategies.map(strategy => (
                  <Option key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            {selectedStrategy && (
              <Paragraph className="strategy-description">
                {selectedStrategy.description}
              </Paragraph>
            )}
          </Card>
        </div>
        
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              <StockOutlined style={{ marginRight: 6, color: '#1890ff' }} />
              <span>选择股票和时间范围</span>
            </div>
          }
          bordered={false}
          className="form-card"
          size="small"
        >
          <Form.Item
            name="stock_code"
            label="股票"
            rules={[{ required: true, message: '请选择股票' }]}
          >
            <Select
              placeholder="选择回测股票"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {favoriteStocks.map(stock => (
                <Option key={stock.stock_code} value={stock.stock_code}>
                  {stock.stock_code} {stock.stock_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="date_range"
            label={
              <span>
                回测日期范围 
                <Tooltip title="建议选择至少6个月的日期范围以获得更准确的回测结果">
                  <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: '请选择回测日期范围' }]}
          >
            <RangePicker 
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder={['开始日期', '结束日期']}
              ranges={{
                '近一个月': [moment().subtract(1, 'months'), moment()],
                '近三个月': [moment().subtract(3, 'months'), moment()],
                '近六个月': [moment().subtract(6, 'months'), moment()],
                '近一年': [moment().subtract(1, 'years'), moment()],
                '近两年': [moment().subtract(2, 'years'), moment()],
              }}
              allowClear={true}
              suffixIcon={<CalendarOutlined />}
            />
          </Form.Item>
        </Card>
        
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              <MoneyCollectOutlined style={{ marginRight: 6, color: '#1890ff' }} />
              <span>回测资金设置</span>
            </div>
          }
          bordered={false}
          className="form-card"
          size="small"
        >
          <div className="date-range-selector">
            <Form.Item
              name="initial_cash"
              label="初始资金"
              initialValue={100000}
              rules={[{ required: true, message: '请设置初始资金' }]}
              style={{ width: '48%' }}
            >
              <InputNumber
                min={10000}
                max={10000000}
                step={10000}
                style={{ width: '100%' }}
                formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/¥\s?|(,*)/g, '')}
              />
            </Form.Item>
            
            <Form.Item
              name="commission"
              label={
                <span>
                  手续费率(%) 
                  <Tooltip title="交易手续费比例，默认0.1%">
                    <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                  </Tooltip>
                </span>
              }
              initialValue={0.1}
              rules={[{ required: true, message: '请设置手续费率' }]}
              style={{ width: '48%' }}
            >
              <InputNumber
                min={0}
                max={5}
                step={0.01}
                style={{ width: '100%' }}
                formatter={value => `${value}%`}
                parser={value => value.replace('%', '')}
              />
            </Form.Item>
          </div>
        </Card>

        {/* 策略参数设置 */}
        {selectedStrategy && selectedStrategy.params && (
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                <SettingOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                <span>策略参数设置</span>
              </div>
            }
            bordered={false}
            className="strategy-params-form"
            size="small"
          >
            <div className="strategy-params-content">
              {selectedStrategy.params.map(param => (
                <Form.Item
                  key={param.name}
                  label={
                    <span>
                      {param.label} 
                      {param.name !== 'size' && (
                        <Tooltip title={`推荐范围: ${param.min} - ${param.max}`}>
                          <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                        </Tooltip>
                      )}
                    </span>
                  }
                  name={['strategy_params', param.name]}
                  initialValue={param.default}
                  style={{ width: param.name === 'size' ? '100%' : '48%', display: 'inline-block', paddingRight: '10px' }}
                >
                  <InputNumber
                    min={param.min}
                    max={param.max}
                    step={param.step || 1}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              ))}
            </div>
          </Card>
        )}
        
        <div className="form-actions">
          <Form.Item>
            <Button
              type="default"
              icon={<SyncOutlined />}
              onClick={testStockData}
              className="test-data-button"
            >
              测试股票数据
            </Button>
          </Form.Item>
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<ExperimentOutlined />}
              loading={loading}
              block
              className="submit-button"
            >
              开始回测
            </Button>
          </Form.Item>
        </div>
      </Form>
    </div>
  );
};

export default BacktestForm; 