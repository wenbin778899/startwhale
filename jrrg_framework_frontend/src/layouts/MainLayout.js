import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Badge, Avatar, Dropdown, Space, Tooltip } from 'antd';
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
  MoonOutlined,
  BellOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  TeamOutlined,
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
  PieChartOutlined,
  FundOutlined,
  GlobalOutlined,
  BookOutlined,
  ReadOutlined,
  FileTextOutlined,
  AlertOutlined,
  SafetyOutlined,
  DashboardOutlined,
  RobotOutlined,
  CloudOutlined
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Home from '../views/Home/Home';
import StockQuery from '../views/Stock/StockQuery';
import AIAnalysis from '../views/AI/AIAnalysis';
import StrategyManage from '../views/Strategy/StrategyManage';
import FundManage from '../views/Fund/FundManage';
import UserCenter from '../views/User/UserCenter';
import NotFound from '../views/NotFound/NotFound';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;
const { SubMenu } = Menu;

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
    if (path === '/' || path === '/home') return '1';
    if (path.startsWith('/stock')) return '2';
    if (path.startsWith('/ai')) return '3';
    if (path.startsWith('/strategy')) return '4';
    if (path.startsWith('/portfolio')) return '5';
    if (path.startsWith('/industry')) return '6';
    if (path.startsWith('/news')) return '7';
    if (path.startsWith('/user')) return '8';
    return '1';
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // 用户菜单项
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账户设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  // 通知菜单项
  const notificationItems = [
    {
      key: 'notification1',
      label: '系统更新通知',
      description: '系统已更新到最新版本',
      time: '10分钟前',
    },
    {
      key: 'notification2',
      label: '股票价格提醒',
      description: '您关注的股票价格已达到设定值',
      time: '30分钟前',
    },
    {
      key: 'notification3',
      label: '账户安全提醒',
      description: '请定期修改您的密码',
      time: '1小时前',
    },
  ];

  // 侧边栏菜单项
  const sidebarMenuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: '首页',
      path: '/',
    },
    {
      key: '2',
      icon: <LineChartOutlined />,
      label: '股票市场',
      children: [
        {
          key: '2-1',
          label: '股票查询',
          path: '/stock',
          icon: <SearchOutlined />,
        },
        {
          key: '2-2',
          label: '行情走势',
          path: '/stock/trend',
          icon: <RiseOutlined />,
        },
        {
          key: '2-3',
          label: '热门板块',
          path: '/stock/hot',
          icon: <FireOutlined />,
        }
      ]
    },
    {
      key: '3',
      icon: <RobotOutlined />,
      label: 'AI智能分析',
      children: [
        {
          key: '3-1',
          label: '智能诊股',
          path: '/ai',
          icon: <BulbOutlined />,
        },
        {
          key: '3-2',
          label: '智能选股',
          path: '/ai/selection',
          icon: <FundOutlined />,
        },
        {
          key: '3-3',
          label: '市场预测',
          path: '/ai/prediction',
          icon: <CloudOutlined />,
        }
      ]
    },
    {
      key: '4',
      icon: <StarOutlined />,
      label: '投资策略',
      children: [
        {
          key: '4-1',
          label: 'AI股市策略',
          path: '/strategy/manage',
          icon: <BarChartOutlined />,
        },
        {
          key: '4-2',
          label: 'AI基金策略',
          path: '/strategy/fund',
          icon: <BankOutlined />,
        },
        {
          key: '4-3',
          label: '策略回测',
          path: '/strategy/backtest',
          icon: <PieChartOutlined />,
        }
      ]
    },
    {
      key: '5',
      icon: <SafetyOutlined />,
      label: '投资组合',
      children: [
        {
          key: '5-1',
          label: '我的持仓',
          path: '/portfolio',
          icon: <FundOutlined />,
        },
        {
          key: '5-2',
          label: '风险评估',
          path: '/portfolio/risk',
          icon: <AlertOutlined />,
        },
        {
          key: '5-3',
          label: '收益分析',
          path: '/portfolio/returns',
          icon: <RiseOutlined />,
        }
      ]
    },
    {
      key: '6',
      icon: <GlobalOutlined />,
      label: '行业分析',
      path: '/industry',
    },
    {
      key: '7',
      icon: <ReadOutlined />,
      label: '市场资讯',
      children: [
        {
          key: '7-1',
          label: '实时新闻',
          path: '/news',
          icon: <FileTextOutlined />,
        },
        {
          key: '7-2',
          label: '研究报告',
          path: '/news/research',
          icon: <BookOutlined />,
        }
      ]
    },
    {
      key: '8',
      icon: <UserOutlined />,
      label: '个人中心',
      path: '/user',
    },
  ];

  // 渲染侧边栏菜单
  const renderMenu = (menuItems) => {
    return menuItems.map(item => {
      if (item.children) {
        return (
          <SubMenu 
            key={item.key} 
            icon={item.icon} 
            title={item.label}
            className="sidebar-submenu"
          >
            {renderMenu(item.children)}
          </SubMenu>
        );
      }
      return (
        <Menu.Item key={item.key} icon={item.icon} className="sidebar-menu-item">
          <Link to={item.path}>{item.label}</Link>
        </Menu.Item>
      );
    });
  };

  // 获取当前页面标题和图标
  const getCurrentPageInfo = () => {
    const path = location.pathname;
    const currentMenu = findMenuByPath(sidebarMenuItems, path);
    
    return {
      title: currentMenu ? currentMenu.label : '首页',
      icon: currentMenu ? currentMenu.icon : <DashboardOutlined />
    };
  };

  // 通过路径查找菜单项
  const findMenuByPath = (items, path) => {
    for (const item of items) {
      if (item.path === path) {
        return item;
      }
      if (item.children) {
        const found = findMenuByPath(item.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const currentPageInfo = getCurrentPageInfo();

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
          defaultOpenKeys={collapsed ? [] : ['2', '3', '4', '5', '7']}
        >
          {renderMenu(sidebarMenuItems)}
        </Menu>
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
              {currentPageInfo.icon}
              <span>{currentPageInfo.title}</span>
            </div>
          </div>
          <div className="header-right">
            <Tooltip title={isDarkMode ? "切换到亮色模式" : "切换到暗色模式"}>
              <Button 
                type="text" 
                icon={isDarkMode ? <MoonOutlined /> : <SunOutlined />} 
                onClick={toggleTheme}
                className="theme-toggle"
              />
            </Tooltip>
            
            <Dropdown
              menu={{
                items: notificationItems.map(item => ({
                  key: item.key,
                  label: (
                    <div style={{ padding: '8px 0' }}>
                      <div style={{ fontWeight: 'bold' }}>{item.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{item.description}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{item.time}</div>
                    </div>
                  ),
                })),
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Badge count={3} size="small">
                <Button type="text" icon={<BellOutlined />} className="settings-button" />
              </Badge>
            </Dropdown>
            
            <Dropdown 
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button type="link" className="user-button">
                <Space>
                  <Avatar icon={<UserOutlined />} size="small" />
                  <span>张三</span>
                </Space>
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content className="main-content">
          <TransitionGroup>
            <CSSTransition
              key={location.pathname}
              timeout={300}
              classNames="page-transition"
            >
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/stock" element={<StockQuery />} />
                <Route path="/ai" element={<AIAnalysis />} />
                <Route path="/strategy/manage" element={<StrategyManage />} />
                <Route path="/strategy/fund" element={<FundManage />} />
                <Route path="/user" element={<UserCenter />} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </CSSTransition>
          </TransitionGroup>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 