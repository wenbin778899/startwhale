import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Radio, Select, Slider, InputNumber, 
  Card, Divider, message, Steps, Row, Col, Space, Typography, Rate
} from 'antd';
import { submitQuestionnaire, getUserProfile } from '../../api/userProfile';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;

// 行业列表
const INDUSTRIES = [
  '金融', '科技', '医药', '房地产', '消费', '能源', '工业制造',
  '通信', '公用事业', '农业', '材料', '服务业', '传媒', '汽车'
];

const UserQuestionnaire = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  // 检查用户是否登录
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    const userInfo = localStorage.getItem('user_info');
    
    if (!token || !userInfo) {
      message.error('用户未登录，请先登录');
      navigate('/login');
      return;
    }

    // 加载用户已有的问卷数据
    const fetchUserProfile = async () => {
      try {
        const res = await getUserProfile();
        if (res && res.questionnaire) {
          // 预填问卷数据
          const questionnaire = res.questionnaire;
          form.setFieldsValue({
            risk_tolerance: questionnaire.risk_tolerance,
            investment_horizon: questionnaire.investment_horizon,
            investment_style: questionnaire.investment_style,
            income_requirement: questionnaire.income_requirement,
            liquidity_need: questionnaire.liquidity_need,
            avg_investment_amount: questionnaire.avg_investment_amount,
            market_experience: questionnaire.market_experience,
          });
          
          // 更新formData状态，确保这些值也被保存
          setFormData(prevData => ({
            ...prevData,
            risk_tolerance: questionnaire.risk_tolerance,
            investment_horizon: questionnaire.investment_horizon,
            investment_style: questionnaire.investment_style,
            income_requirement: questionnaire.income_requirement,
            liquidity_need: questionnaire.liquidity_need,
            avg_investment_amount: questionnaire.avg_investment_amount,
            market_experience: questionnaire.market_experience,
          }));

          // 设置行业偏好
          if (res.industry_preferences && res.industry_preferences.length > 0) {
            const industryPrefs = {};
            res.industry_preferences.forEach(pref => {
              industryPrefs[`industry_${pref.industry_name}`] = pref.preference_level;
            });
            form.setFieldsValue(industryPrefs);
            
            // 更新formData状态，保存行业偏好
            setFormData(prevData => ({
              ...prevData,
              ...industryPrefs
            }));
          }

          // 设置交易习惯
          if (res.trading_habits) {
            const tradingHabits = res.trading_habits;
            form.setFieldsValue({
              avg_holding_period: tradingHabits.avg_holding_period,
              preferred_trading_time: tradingHabits.preferred_trading_time,
              stop_loss_percentage: tradingHabits.stop_loss_percentage,
              profit_taking_percentage: tradingHabits.profit_taking_percentage,
              technical_analysis_reliance: tradingHabits.technical_analysis_reliance,
              fundamental_analysis_reliance: tradingHabits.fundamental_analysis_reliance,
              news_sensitivity: tradingHabits.news_sensitivity,
            });
            
            // 更新formData状态，保存交易习惯
            setFormData(prevData => ({
              ...prevData,
              avg_holding_period: tradingHabits.avg_holding_period,
              preferred_trading_time: tradingHabits.preferred_trading_time,
              stop_loss_percentage: tradingHabits.stop_loss_percentage,
              profit_taking_percentage: tradingHabits.profit_taking_percentage,
              technical_analysis_reliance: tradingHabits.technical_analysis_reliance,
              fundamental_analysis_reliance: tradingHabits.fundamental_analysis_reliance,
              news_sensitivity: tradingHabits.news_sensitivity,
            }));
          }

          setUserData(res);
        }
      } catch (error) {
        console.error('加载用户画像数据失败:', error);
        if (error.response) {
          console.error('错误响应:', error.response.data);
          message.error(`加载失败: ${error.response.data?.message || '未知错误'}`);
        } else if (error.request) {
          message.error('服务器未响应，请检查网络连接');
        } else {
          message.error('请求配置错误');
        }
      }
    };

    fetchUserProfile();
  }, [form, navigate]);

  const next = () => {
    form
      .validateFields()
      .then(values => {
        // 保存当前步骤的表单值到formData
        setFormData(prevData => ({
          ...prevData,
          ...values
        }));
        console.log('保存当前步骤数据:', values);
        console.log('累积的表单数据:', {...formData, ...values});
        
        // 进入下一步
        setCurrentStep(currentStep + 1);
      })
      .catch(err => {
        console.error('表单验证错误:', err);
      });
  };

  const prev = () => {
    // 保存当前步骤的表单数据（即使不完整）
    const currentValues = form.getFieldsValue();
    setFormData(prevData => ({
      ...prevData,
      ...currentValues
    }));
    
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // 合并当前步骤的值和之前保存的值
      const allFormValues = {
        ...formData,
        ...values
      };
      
      console.log('表单所有字段:', Object.keys(allFormValues));
      console.log('完整的表单数据:', allFormValues);
      
      // 检查用户是否登录
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        message.error('登录已过期，请重新登录');
        navigate('/login');
        return;
      }
      
      // 处理行业偏好数据
      const industryPreferences = [];
      // 定义默认行业列表和默认偏好值
      const defaultIndustries = ['科技', '金融', '医药', '消费', '能源'];
      const defaultPreferences = [4, 3, 3, 2, 2]; // 默认偏好值
      
      let hasAnyIndustryPreference = false;
      
      INDUSTRIES.forEach(industry => {
        const prefLevel = allFormValues[`industry_${industry}`];
        if (prefLevel) {
          hasAnyIndustryPreference = true;
          industryPreferences.push({
            industry_name: industry,
            preference_level: parseInt(prefLevel)
          });
        }
        delete allFormValues[`industry_${industry}`]; // 删除临时字段
      });
      
      // 如果没有设置任何行业偏好，添加默认行业偏好
      if (!hasAnyIndustryPreference) {
        console.log('未设置行业偏好，添加默认偏好');
        defaultIndustries.forEach((industry, index) => {
          industryPreferences.push({
            industry_name: industry,
            preference_level: defaultPreferences[index]
          });
        });
      }
      
      console.log('构建的行业偏好数据:', industryPreferences);
      
      // 构建交易习惯数据
      const tradingHabits = {
        avg_holding_period: parseInt(allFormValues.avg_holding_period) || 30, // 默认30天
        preferred_trading_time: allFormValues.preferred_trading_time || '不固定',
        stop_loss_percentage: parseFloat(allFormValues.stop_loss_percentage) || 5, // 默认5%
        profit_taking_percentage: parseFloat(allFormValues.profit_taking_percentage) || 10, // 默认10%
        technical_analysis_reliance: parseInt(allFormValues.technical_analysis_reliance) || 3,
        fundamental_analysis_reliance: parseInt(allFormValues.fundamental_analysis_reliance) || 3,
        news_sensitivity: parseInt(allFormValues.news_sensitivity) || 3
      };
      
      console.log('构建的交易习惯数据:', tradingHabits);
      
      // 构建提交的数据 - 使用合并后的表单数据
      const submitData = {
        // 基本问卷信息
        risk_tolerance: allFormValues.risk_tolerance,
        investment_horizon: allFormValues.investment_horizon,
        investment_style: allFormValues.investment_style,
        income_requirement: allFormValues.income_requirement,
        liquidity_need: allFormValues.liquidity_need,
        avg_investment_amount: allFormValues.avg_investment_amount,
        market_experience: allFormValues.market_experience,
        // 行业偏好和交易习惯
        industry_preferences: industryPreferences,
        trading_habits: tradingHabits
      };

      console.log('最终提交的问卷数据:', submitData);
      
      const result = await submitQuestionnaire(submitData);
      console.log('服务器响应:', result);
      message.success('问卷提交成功！');
      
      // 刷新用户画像数据
      const updatedProfile = await getUserProfile();
      setUserData(updatedProfile);
      
    } catch (error) {
      console.error('提交问卷失败详情:', error);
      if (error.response) {
        console.error('错误响应状态:', error.response.status);
        console.error('错误响应内容:', error.response.data);
        message.error(`提交失败: ${error.response.data?.message || '未知错误'} (状态码: ${error.response.status})`);
      } else if (error.request) {
        console.error('未收到响应:', error.request);
        message.error('服务器未响应，请检查网络连接');
      } else {
        console.error('请求配置错误:', error.message);
        message.error('请求配置错误');
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: '基本投资偏好',
      content: (
        <Card className="questionnaire-card">
          <Title level={4}>第一步：了解您的投资偏好</Title>
          <Paragraph type="secondary">
            请回答以下问题，帮助我们了解您的投资风格和目标。
          </Paragraph>
          
          <Form.Item name="risk_tolerance" label="风险承受能力" rules={[{ required: true }]}>
            <Slider
              marks={{
                1: '极低',
                2: '低',
                3: '中等',
                4: '高',
                5: '极高'
              }}
              min={1}
              max={5}
            />
          </Form.Item>
          
          <Form.Item name="investment_horizon" label="投资期限" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="短期">短期（1年以内）</Radio>
              <Radio value="中期">中期（1-5年）</Radio>
              <Radio value="长期">长期（5年以上）</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item name="investment_style" label="投资风格" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="价值">价值投资</Radio>
              <Radio value="成长">成长投资</Radio>
              <Radio value="混合">混合投资</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item name="income_requirement" label="收入需求" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="低">低（以资本增值为主）</Radio>
              <Radio value="中">中等（资本增值和收入平衡）</Radio>
              <Radio value="高">高（以固定收入为主）</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item name="liquidity_need" label="流动性需求" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="低">低（长期持有）</Radio>
              <Radio value="中">中等（部分资金需要灵活使用）</Radio>
              <Radio value="高">高（随时可能需要资金）</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item name="avg_investment_amount" label="平均投资金额">
            <InputNumber
              addonBefore="￥"
              style={{ width: '100%' }}
              placeholder="请输入您的平均单笔投资金额"
              min={0}
              step={1000}
            />
          </Form.Item>
          
          <Form.Item name="market_experience" label="股市经验（年）">
            <InputNumber min={0} max={50} />
          </Form.Item>
        </Card>
      ),
    },
    {
      title: '行业偏好',
      content: (
        <Card className="questionnaire-card">
          <Title level={4}>第二步：您的行业偏好</Title>
          <Paragraph type="secondary">
            请评估您对以下行业的投资偏好程度（1-5，5为最高）。
          </Paragraph>
          
          <Row gutter={[16, 16]}>
            {INDUSTRIES.map(industry => (
              <Col span={8} key={industry}>
                <Form.Item label={industry} name={`industry_${industry}`}>
                  <Rate allowClear />
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Card>
      ),
    },
    {
      title: '交易习惯',
      content: (
        <Card className="questionnaire-card">
          <Title level={4}>第三步：您的交易习惯</Title>
          <Paragraph type="secondary">
            请告诉我们您的交易偏好和习惯。
          </Paragraph>
          
          <Form.Item name="avg_holding_period" label="平均持股周期（天）">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="preferred_trading_time" label="偏好交易时段">
            <Select placeholder="请选择">
              <Option value="开盘">开盘</Option>
              <Option value="上午">上午</Option>
              <Option value="午盘">午盘</Option>
              <Option value="下午">下午</Option>
              <Option value="尾盘">尾盘</Option>
              <Option value="不固定">不固定</Option>
            </Select>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="stop_loss_percentage" label="止损设置（%）">
                <InputNumber min={0} max={100} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="profit_taking_percentage" label="止盈设置（%）">
                <InputNumber min={0} max={1000} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="technical_analysis_reliance" label="技术分析依赖度">
            <Slider min={1} max={5} marks={{ 1: '极低', 3: '中等', 5: '极高' }} />
          </Form.Item>
          
          <Form.Item name="fundamental_analysis_reliance" label="基本面分析依赖度">
            <Slider min={1} max={5} marks={{ 1: '极低', 3: '中等', 5: '极高' }} />
          </Form.Item>
          
          <Form.Item name="news_sensitivity" label="新闻敏感度">
            <Slider min={1} max={5} marks={{ 1: '极低', 3: '中等', 5: '极高' }} />
          </Form.Item>
        </Card>
      ),
    },
  ];

  return (
    <div className="user-questionnaire">
      <Card title="投资者画像问卷" bordered={false}>
        <Steps current={currentStep}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="questionnaire-form"
          initialValues={{
            risk_tolerance: 4,
            investment_horizon: '中期',
            investment_style: '混合',
            income_requirement: '中',
            liquidity_need: '中'
          }}
        >
          <div className="steps-content" style={{ margin: '24px 0' }}>
            {steps[currentStep].content}
          </div>
          
          <div className="steps-action">
            <Space>
              {currentStep > 0 && (
                <Button style={{ margin: '0 8px' }} onClick={() => prev()}>
                  上一步
                </Button>
              )}
              
              {currentStep < steps.length - 1 && (
                <Button type="primary" onClick={() => next()}>
                  下一步
                </Button>
              )}
              
              {currentStep === steps.length - 1 && (
                <Button 
                  type="primary" 
                  onClick={() => {
                    // 先保存当前步骤数据
                    const currentValues = form.getFieldsValue();
                    setFormData(prevData => {
                      const newData = {...prevData, ...currentValues};
                      console.log('提交前合并的完整数据:', newData);
                      return newData;
                    });
                    // 提交表单
                    form.submit();
                  }}
                  loading={loading}
                >
                  提交
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default UserQuestionnaire; 