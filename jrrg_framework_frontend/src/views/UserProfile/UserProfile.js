import React, { useState, useEffect } from 'react';

import { 

  Avatar, 

  Card, 

  Typography, 

  Row, 

  Col, 

  Button, 

  Spin, 

  message, 

  Divider, 

  Tabs, 

  List, 

  Tag, 

  Tooltip,

  Statistic 

} from 'antd';

import { 

  UserOutlined, 

  EditOutlined, 

  MailOutlined, 

  PhoneOutlined, 

  IdcardOutlined, 

  ArrowLeftOutlined,

  EnvironmentOutlined,

  CalendarOutlined,

  SafetyCertificateOutlined,

  KeyOutlined,

  TeamOutlined,

  SettingOutlined,

  AuditOutlined

} from '@ant-design/icons';

import './UserProfile.scss';

import { $getCurrentUserInfo } from '../../api/userApi';

import { useNavigate } from 'react-router-dom';



const { Title, Text, Paragraph } = Typography;

const { TabPane } = Tabs;



const UserProfile = () => {

  // 状态定义

  const [userInfo, setUserInfo] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('basic');

  const navigate = useNavigate();



  // 在组件挂载时获取用户信息

  useEffect(() => {

    const fetchUserInfo = async () => {

      try {

        setLoading(true);

        const response = await $getCurrentUserInfo();

        setUserInfo(response.data);

        setError(null);

      } catch (err) {

        console.error('获取用户信息失败:', err);

        setError('获取用户信息失败，请稍后重试');

        message.error('获取用户信息失败');

      } finally {

        setLoading(false);

      }

    };



    fetchUserInfo();

  }, []);



  // 处理编辑按钮点击事件

  const handleEditProfile = () => {

    message.info('编辑个人资料功能待开发');

  };



  // 处理返回按钮点击事件

  const handleGoBack = () => {

    navigate(-1); // 返回上一页

  };

  

  // 处理修改密码点击事件

  const handleChangePassword = () => {

    message.info('修改密码功能待开发');

  };

  

  // 处理头像更改点击事件

  const handleAvatarChange = () => {

    message.info('更换头像功能待开发');

  };

  

  // 计算用户等级和积分进度

  const getUserLevelInfo = () => {

    // 模拟数据，实际应从userInfo中获取

    const level = 3;

    const points = 2350;

    const nextLevelPoints = 3000;

    const progress = Math.round((points / nextLevelPoints) * 100);

    

    return { level, points, nextLevelPoints, progress };

  };

  

  // 渲染活动记录

  const renderActivityList = () => {

    // 模拟数据

    const activities = [

      { type: '登录', time: '2023-07-22 12:35', detail: '登录成功' },

      { type: '修改', time: '2023-07-20 15:40', detail: '修改了个人资料' },

      { type: '订阅', time: '2023-07-18 09:15', detail: '订阅了市场日报' },

      { type: '登录', time: '2023-07-16 08:30', detail: '登录成功' }

    ];

    

    return (

      <List

        className="activity-list"

        itemLayout="horizontal"

        dataSource={activities}

        renderItem={item => (

          <List.Item>

            <List.Item.Meta

              avatar={

                <div className="activity-icon">

                  {item.type === '登录' && <KeyOutlined />}

                  {item.type === '修改' && <EditOutlined />}

                  {item.type === '订阅' && <AuditOutlined />}

                </div>

              }

              title={item.detail}

              description={item.time}

            />

          </List.Item>

        )}

      />

    );

  };



  // 如果正在加载，显示加载状态

  if (loading) {

    return (

      <div className="user-profile-container">

        <div className="loading-container">

          <Spin size="large" tip="加载用户信息中..." />

        </div>

      </div>

    );

  }



  // 如果加载出错，显示错误信息

  if (error) {

    return (

      <div className="user-profile-container">

        <div className="error-message">

          <Typography.Text type="danger">{error}</Typography.Text>

          <br />

          <Button type="primary" onClick={() => window.location.reload()} style={{ marginTop: '16px' }}>

            重新加载

          </Button>

        </div>

      </div>

    );

  }



  return (

    <div className="user-profile-container">

      <Card className="profile-card">

        <Button 

          type="link" 

          icon={<ArrowLeftOutlined />} 

          onClick={handleGoBack}

          className="back-button"

        >

          返回

        </Button>

        

        <div className="profile-header">

          <div className="avatar-section">

            <Avatar size={100} icon={<UserOutlined />} src={userInfo.avatar} className="user-avatar" />

            <div className="avatar-actions">

              <Button type="primary" icon={<EditOutlined />} onClick={handleAvatarChange}>

                更换头像

              </Button>

            </div>

          </div>

          

          <div className="user-info-section">

            <Title level={3} className="user-name">{userInfo.nickname}</Title>

            <div className="user-meta">

              <Tag color="blue">{userInfo.role || '普通用户'}</Tag>

              <Tag color="green">Lv.{getUserLevelInfo().level}</Tag>

              <Tag color="purple">积分: {getUserLevelInfo().points}</Tag>

            </div>

            <Text className="user-id">账号: {userInfo.username}</Text>

          </div>

        </div>



        <Divider style={{ margin: '20px 0' }} />

        

        <Tabs 

          activeKey={activeTab} 

          onChange={setActiveTab}

          className="profile-tabs"

        >

          <TabPane tab={<span><UserOutlined /> 基本资料</span>} key="basic">

            <div className="tab-content">

              <Row gutter={[24, 24]}>

                <Col xs={24} md={12}>

                  <Card title="个人信息" bordered={false} className="info-card">

                    <div className="info-item">

                      <div className="info-label">

                        <IdcardOutlined /> 用户ID

                      </div>

                      <div className="info-value">{userInfo.id}</div>

                    </div>

                    

                    <div className="info-item">

                      <div className="info-label">

                        <UserOutlined /> 昵称

                      </div>

                      <div className="info-value">{userInfo.nickname}</div>

                    </div>

                    

                    <div className="info-item">

                      <div className="info-label">

                        <MailOutlined /> 电子邮箱

                      </div>

                      <div className="info-value">{userInfo.email}</div>

                    </div>

                    

                    <div className="info-item">

                      <div className="info-label">

                        <PhoneOutlined /> 手机号码

                      </div>

                      <div className="info-value">{userInfo.phone}</div>

                    </div>

                    

                    <div className="info-item">

                      <div className="info-label">

                        <EnvironmentOutlined /> 所在地区

                      </div>

                      <div className="info-value">{userInfo.location || '未设置'}</div>

                    </div>

                    

                    <div className="info-item">

                      <div className="info-label">

                        <CalendarOutlined /> 注册时间

                      </div>

                      <div className="info-value">{userInfo.registerTime || '未知'}</div>

                    </div>

                  </Card>

                </Col>

                

                <Col xs={24} md={12}>

                  <Row gutter={[16, 16]}>

                    <Col xs={24}>

                      <Card bordered={false} className="stats-card">

                        <Row gutter={16}>

                          <Col span={8}>

                            <Statistic 

                              title="已创建策略" 

                              value={userInfo.strategies || 0} 

                              valueStyle={{ color: '#1890ff' }}

                            />

                          </Col>

                          <Col span={8}>

                            <Statistic 

                              title="已关注股票" 

                              value={userInfo.watchedStocks || 0} 

                              valueStyle={{ color: '#52c41a' }}

                            />

                          </Col>

                          <Col span={8}>

                            <Statistic 

                              title="账户安全分" 

                              value={userInfo.securityScore || 85} 

                              suffix="/100" 

                              valueStyle={{ color: '#722ed1' }}

                            />

                          </Col>

                        </Row>

                      </Card>

                    </Col>

                    <Col xs={24}>

                      <Card 

                        title="账户安全" 

                        bordered={false}

                        className="security-card"

                        extra={<Button type="link" icon={<SettingOutlined />}>安全设置</Button>}

                      >

                        <div className="security-item">

                          <div className="security-label">

                            <SafetyCertificateOutlined /> 登录密码

                          </div>

                          <div className="security-actions">

                            <Button 

                              type="primary" 

                              size="small" 

                              onClick={handleChangePassword}

                            >

                              修改

                            </Button>

                          </div>

                        </div>

                        

                        <div className="security-item">

                          <div className="security-label">

                            <PhoneOutlined /> 手机验证

                          </div>

                          <div className="security-status">

                            <Tag color="success">已绑定</Tag>

                          </div>

                        </div>

                        

                        <div className="security-item">

                          <div className="security-label">

                            <MailOutlined /> 邮箱验证

                          </div>

                          <div className="security-status">

                            <Tag color="warning">未验证</Tag>

                          </div>

                        </div>

                      </Card>

                    </Col>

                  </Row>

                </Col>

              </Row>

              

              <div className="profile-actions">

                <Button type="primary" icon={<EditOutlined />} onClick={handleEditProfile}>

                  编辑个人资料

                </Button>

              </div>

            </div>

          </TabPane>

          

          <TabPane tab={<span><TeamOutlined /> 活动记录</span>} key="activity">

            <div className="tab-content">

              <Card bordered={false} className="activity-card">

                {renderActivityList()}

              </Card>

            </div>

          </TabPane>

          

          <TabPane tab={<span><SettingOutlined /> 账户设置</span>} key="settings">

            <div className="tab-content">

              <Card bordered={false} className="settings-card">

                <Row gutter={[16, 24]}>

                  <Col span={24}>

                    <Title level={4}>偏好设置</Title>

                    <Divider />

                    <Paragraph>账户设置功能正在开发中...</Paragraph>

                  </Col>

                </Row>

              </Card>

            </div>

          </TabPane>

        </Tabs>

      </Card>

    </div>

  );

};



export default UserProfile; 





