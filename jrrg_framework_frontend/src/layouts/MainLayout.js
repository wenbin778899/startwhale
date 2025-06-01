import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button } from 'antd';
import {
  HomeOutlined,
  LineChartOutlined,
  SearchOutlined,
  BulbOutlined,
  StarOutlined,
  UserOutlined,
  BankOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbFilled,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../views/Home/Home';
import StockQuery from '../views/Stock/StockQuery';
import AIAnalysis from '../views/AI/AIAnalysis';
import StrategyManage from '../views/Strategy/StrategyManage';
import FundManage from '../views/Fund/FundManage';
import UserCenter from '../views/User/UserCenter';
import NotFound from '../views/NotFound/NotFound';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768 && !collapsed) {
        setCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed]);

  useEffect(() => {
    // 检查之前保存的主题偏好
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return '1';
    if (path.startsWith('/stock')) return '2';
    if (path.startsWith('/ai')) return '3';
    if (path.startsWith('/strategy')) return '4';
    if (path.startsWith('/user')) return '5';
    return '1';
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} 
        breakpoint="lg" 
        width={220}
        className="main-sider"
        theme={isDarkMode ? "dark" : "light"}
        style={{ display: isMobile ? 'none' : 'block' }}
      >
        <div className="logo">
          {!collapsed ? 'JRRG股票分析' : 'JR'}
        </div>
        <Menu
          theme={isDarkMode ? "dark" : "light"}
          mode="inline"
          defaultSelectedKeys={[getSelectedKey()]}
          selectedKeys={[getSelectedKey()]}
          items={[
            {
              key: '1',
              icon: <HomeOutlined />,
              label: <Link to="/">首页</Link>,
            },
            {
              key: '2',
              icon: <LineChartOutlined />,
              label: <Link to="/stock">股票查询</Link>,
            },
            {
              key: '3',
              icon: <BulbOutlined />,
              label: <Link to="/ai">AI分析</Link>,
            },
            {
              key: '4',
              icon: <StarOutlined />,
              label: <Link to="/strategy/manage">AI股市</Link>,
            },
            {
              key: '5',
              icon: <BankOutlined />,
              label: <Link to="/strategy/fund">AI基金</Link>,
            },
            {
              key: '6',
              icon: <UserOutlined />,
              label: <Link to="/user">个人中心</Link>,
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header className={`main-header ${isDarkMode ? 'dark' : ''}`}>
          <div className="header-left">
            <Button 
              type="text" 
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
              onClick={toggleSidebar} 
              className="trigger-button"
              style={{ display: isMobile ? 'none' : 'inline-block' }}
            />
            <div className="current-section">
              {location.pathname === '/' && <HomeOutlined />}
              {location.pathname.startsWith('/stock') && <LineChartOutlined />}
              {location.pathname.startsWith('/ai') && <BulbOutlined />}
              {location.pathname.startsWith('/strategy') && <StarOutlined />}
              {location.pathname.startsWith('/user') && <UserOutlined />}
              <span>
                {location.pathname === '/' && '首页'}
                {location.pathname.startsWith('/stock') && '股票查询'}
                {location.pathname.startsWith('/ai') && 'AI分析'}
                {location.pathname.startsWith('/strategy') && 'AI股市'}
                {location.pathname.startsWith('/user') && '个人中心'}
              </span>
            </div>
          </div>
          <div className="header-right">
            <Button 
              type="text" 
              icon={isDarkMode ? <MoonOutlined /> : <SunOutlined />} 
              onClick={toggleTheme}
              className="theme-toggle"
              title={isDarkMode ? "切换到亮色模式" : "切换到暗色模式"}
            />
            <Button type="link" icon={<UserOutlined />} className="user-button">
              张三
            </Button>
            <Button type="link" icon={<SettingOutlined />} className="settings-button" />
          </div>
        </Header>
        <Content className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stock" element={<StockQuery />} />
            <Route path="/ai" element={<AIAnalysis />} />
            <Route path="/strategy/manage" element={<StrategyManage />} />
            <Route path="/strategy/fund" element={<FundManage />} />
            <Route path="/user" element={<UserCenter />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 