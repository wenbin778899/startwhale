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

  Statistic,

  Modal,

  Form,

  Input

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

  AuditOutlined,

  LockOutlined

} from '@ant-design/icons';

import './UserProfile.scss';

import { $getCurrentUserInfo, $changePassword, $updateUserInfo } from '../../api/userApi';

import { useNavigate } from 'react-router-dom';



const { Title, Text, Paragraph } = Typography;

const { TabPane } = Tabs;



const UserProfile = () => {

  // 状态定义

  const [userInfo, setUserInfo] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('basic');

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  const [passwordForm] = Form.useForm();

  const [passwordLoading, setPasswordLoading] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);

  const [editForm] = Form.useForm();

  const [editLoading, setEditLoading] = useState(false);

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

    setEditModalVisible(true);

    // 预填充表单数据

    editForm.setFieldsValue({

      nickname: userInfo.nickname,

      email: userInfo.email,

      phone: userInfo.phone

    });

  };



  // 处理返回按钮点击事件

  const handleGoBack = () => {

    navigate(-1); // 返回上一页

  };

  

  // 处理修改密码点击事件

  const handleChangePassword = () => {

    setPasswordModalVisible(true);

    passwordForm.resetFields();

  };

  

  // 处理头像更改点击事件

  const handleAvatarChange = () => {

    message.info('更换头像功能待开发');

  };

  

  // 处理密码修改提交

  const handlePasswordSubmit = async (values) => {

    try {

      setPasswordLoading(true);

      await $changePassword(values.oldPassword, values.newPassword);
      

      message.success('密码修改成功');

      setPasswordModalVisible(false);

      passwordForm.resetFields();

    } catch (error) {

      console.error('密码修改错误:', error);
      

      // 显示具体的错误信息

      if (error.response && error.response.data && error.response.data.message) {

        message.error(error.response.data.message);

      } else if (error.message) {

        message.error(error.message);

      } else {

        message.error('密码修改失败，请重试');

      }

    } finally {

      setPasswordLoading(false);

    }

  };

  

  // 取消密码修改

  const handlePasswordCancel = () => {

    setPasswordModalVisible(false);

    passwordForm.resetFields();

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



  // 处理个人资料修改提交

  const handleEditSubmit = async (values) => {

    try {

      setEditLoading(true);

      await $updateUserInfo(values);
      

      message.success('个人资料更新成功');

      setEditModalVisible(false);

      editForm.resetFields();
      

      // 重新获取用户信息

      const response = await $getCurrentUserInfo();

      setUserInfo(response.data);

    } catch (error) {

      console.error('更新个人资料错误:', error);
      

      // 显示具体的错误信息

      if (error.response && error.response.data && error.response.data.message) {

        message.error(error.response.data.message);

      } else if (error.message) {

        message.error(error.message);

      } else {

        message.error('更新个人资料失败，请重试');

      }

    } finally {

      setEditLoading(false);

    }

  };

  

  // 取消编辑个人资料

  const handleEditCancel = () => {

    setEditModalVisible(false);

    editForm.resetFields();

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

                        <CalendarOutlined /> 注册时间

                      </div>

                      <div className="info-value">{userInfo.registerTime || '未知'}</div>

                    </div>



                    <Divider />
                    

                    <div className="info-item">

                      <div className="info-label">

                        <SafetyCertificateOutlined /> 登录密码

                      </div>

                      <div className="info-value">

                        <Button 

                          type="primary" 

                          size="small" 

                          onClick={handleChangePassword}

                          icon={<EditOutlined />}

                        >

                          修改密码

                        </Button>

                      </div>

                    </div>

                  </Card>

                </Col>

                

                <Col xs={24} md={12}>

                  <Card 

                    title="账户安全" 

                    bordered={false}

                    className="security-card"

                    extra={<Button type="link" icon={<SettingOutlined />}>安全设置</Button>}

                  >

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



      {/* 修改密码模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <LockOutlined style={{ marginRight: '8px' }} />
            修改登录密码
          </div>
        }
        open={passwordModalVisible}
        onCancel={handlePasswordCancel}
        footer={null}
        width={450}
        destroyOnClose
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordSubmit}
          style={{ marginTop: '20px' }}
        >
          <Form.Item
            name="oldPassword"
            label="当前密码"
            rules={[
              { required: true, message: '请输入当前密码' },
              { min: 6, message: '密码长度至少6位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入当前密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' },
              { max: 20, message: '密码长度不能超过20位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入新密码"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入新密码"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button 
                onClick={handlePasswordCancel}
                size="large"
              >
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={passwordLoading}
                size="large"
              >
                确认修改
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑个人资料模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <EditOutlined style={{ marginRight: '8px' }} />
            编辑个人资料
          </div>
        }
        open={editModalVisible}
        onCancel={handleEditCancel}
        footer={null}
        width={500}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
          style={{ marginTop: '20px' }}
        >
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[
              { required: true, message: '请输入昵称' },
              { max: 50, message: '昵称长度不能超过50个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入昵称"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="电子邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
              { max: 100, message: '邮箱长度不能超过100个字符' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号码"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的中国大陆手机号码' }
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="请输入手机号"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button 
                onClick={handleEditCancel}
                size="large"
              >
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={editLoading}
                size="large"
              >
                保存修改
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};



export default UserProfile; 





