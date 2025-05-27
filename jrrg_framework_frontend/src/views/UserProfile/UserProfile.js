import React, { useState, useEffect } from 'react';
import { Avatar, Card, Typography, Row, Col, Button, Spin, message, Divider } from 'antd';
import { UserOutlined, EditOutlined, MailOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import './UserProfile.scss';
import { $getCurrentUserInfo } from '../../api/userApi';

const { Title, Text } = Typography;

const UserProfile = () => {
  // 状态定义
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // 处理编辑按钮点击事件（这里只是示例，实际功能需要进一步开发）
  const handleEditProfile = () => {
    message.info('编辑个人资料功能待开发');
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
      <div className="profile-header">
        <div className="avatar-container">
          <Avatar size={100} icon={<UserOutlined />} />
          <div className="edit-avatar-btn">
            <Button type="link" icon={<EditOutlined />}>
              更换头像
            </Button>
          </div>
        </div>
        <Title level={3} className="user-title">{userInfo.nickname}</Title>
        <Text className="user-subtitle">账号: {userInfo.username}</Text>
      </div>

      <Divider />

      <div className="profile-content">
        <div className="info-section">
          <div className="section-title">
            <UserOutlined /> 个人信息
          </div>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div className="info-item">
                <div className="info-label">
                  <IdcardOutlined /> 用户ID
                </div>
                <div className="info-value">{userInfo.id}</div>
              </div>
            </Col>
            <Col span={12}>
              <div className="info-item">
                <div className="info-label">
                  <UserOutlined /> 昵称
                </div>
                <div className="info-value">{userInfo.nickname}</div>
              </div>
            </Col>
            <Col span={12}>
              <div className="info-item">
                <div className="info-label">
                  <MailOutlined /> 电子邮箱
                </div>
                <div className="info-value">{userInfo.email}</div>
              </div>
            </Col>
            <Col span={12}>
              <div className="info-item">
                <div className="info-label">
                  <PhoneOutlined /> 手机号码
                </div>
                <div className="info-value">{userInfo.phone}</div>
              </div>
            </Col>
          </Row>

          <div className="actions">
            <Button type="primary" icon={<EditOutlined />} onClick={handleEditProfile}>
              编辑个人资料
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 