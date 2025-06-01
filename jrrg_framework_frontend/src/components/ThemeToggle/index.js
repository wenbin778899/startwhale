import React, { useState, useEffect } from 'react';
import { Button, Tooltip, message } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import './style.css';

const ThemeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 检查主题偏好
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // 切换主题
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
    message.success(newDarkMode ? '已切换到深色模式' : '已切换到浅色模式');
  };

  return (
    <div className="theme-toggle-container">
      <Tooltip title={isDarkMode ? "切换到浅色模式" : "切换到深色模式"}>
        <Button 
          type="primary" 
          shape="circle"
          icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />} 
          onClick={toggleTheme}
          className="theme-switch-btn"
        />
      </Tooltip>
    </div>
  );
};

export default ThemeToggle; 