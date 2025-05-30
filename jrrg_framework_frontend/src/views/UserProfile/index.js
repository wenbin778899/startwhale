import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import UserPortrait from './UserPortrait';
import UserQuestionnaire from './UserQuestionnaire';

const { TabPane } = Tabs;

const UserProfile = () => {
  // 从sessionStorage获取选项卡信息，默认为'portrait'
  const defaultActiveTab = sessionStorage.getItem('userProfileActiveTab') || 'portrait';
  const [activeTab, setActiveTab] = useState(defaultActiveTab);

  // 在组件卸载时清除sessionStorage中的选项卡信息
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('userProfileActiveTab');
    };
  }, []);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  return (
    <div style={{ padding: '20px' }}>
      <Tabs activeKey={activeTab} onChange={handleTabChange} type="card">
        <TabPane tab="投资者画像" key="portrait">
          <UserPortrait />
        </TabPane>
        <TabPane tab="问卷设置" key="questionnaire">
          <UserQuestionnaire />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default UserProfile; 