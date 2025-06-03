import React, { useState, useEffect, useRef } from 'react';
import { Button, Drawer, Spin, Input, Badge, Tooltip, Tag, Space, Typography, Divider, message } from 'antd';
import { 
  RobotOutlined, 
  CloseOutlined, 
  FullscreenOutlined, 
  FullscreenExitOutlined, 
  SendOutlined,
  HistoryOutlined,
  DeleteOutlined,
  LineChartOutlined,
  FundOutlined,
  AppstoreOutlined,
  DragOutlined
} from '@ant-design/icons';
import './AIAssistant.scss';

const { Text } = Typography;

// 预设问题列表
const quickQuestions = [
  { text: '什么是KDJ指标？', icon: <LineChartOutlined /> },
  { text: '如何分析量能？', icon: <LineChartOutlined /> },
  { text: '请解释MACD指标', icon: <LineChartOutlined /> },
  { text: '如何使用布林带？', icon: <FundOutlined /> },
  { text: '现在市场行情如何？', icon: <FundOutlined /> },
  { text: '分析一下贵州茅台', icon: <AppstoreOutlined /> },
];

/**
 * AI助手组件 - 提供浮动图标和问答窗口
 */
const AIAssistant = () => {
  // 控制窗口是否可见
  const [visible, setVisible] = useState(false);
  // 控制窗口大小
  const [maximized, setMaximized] = useState(false);
  // 控制iframe加载状态
  const [loading, setLoading] = useState(true);
  // 跟踪是否发生加载错误
  const [loadError, setLoadError] = useState(false);
  // 控制新消息通知
  const [hasNewMessage, setHasNewMessage] = useState(false);
  // 保存用户输入
  const [userInput, setUserInput] = useState('');
  // 打字机效果的欢迎消息
  const [welcomeMessage, setWelcomeMessage] = useState('');
  // 对话历史
  const [chatHistory, setChatHistory] = useState([]);
  // 是否显示对话历史
  const [showHistory, setShowHistory] = useState(false);
  // iframe对象的引用
  const iframeRef = useRef(null);
  // 为iframe生成唯一key，用于强制重新渲染
  const [iframeKey, setIframeKey] = useState(Date.now());
  // 按钮位置状态
  const [position, setPosition] = useState(() => {
    // 从本地存储获取保存的位置，如果没有则使用默认位置
    const savedPosition = localStorage.getItem('aiAssistantPosition');
    return savedPosition ? JSON.parse(savedPosition) : { left: '30px', bottom: '30px' };
  });
  // 拖动状态
  const [isDragging, setIsDragging] = useState(false);
  // 拖动起始点
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  // 是否隐藏欢迎消息
  const [hideWelcome, setHideWelcome] = useState(false);
  // 检查是否在登录页面
  const [isLoginPage, setIsLoginPage] = useState(false);
  
  // 大模型问答系统URL
  const aiAssistantUrl = 'http://114.212.96.222:8080/';
  // 完整欢迎消息
  const fullWelcomeMessage = '您好！我是您的AI股票智能助手。我可以帮您分析股票走势、提供投资建议、解答金融问题，或者只是聊聊天。请问有什么我可以帮您的吗？';

  // 检查当前页面是否为登录页
  useEffect(() => {
    const checkLoginPage = () => {
      const currentPath = window.location.pathname;
      setIsLoginPage(currentPath === '/login' || currentPath === '/register');
    };
    
    // 初始检查
    checkLoginPage();
    
    // 监听路径变化
    const handleLocationChange = () => {
      checkLoginPage();
    };
    
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // 从localStorage加载聊天历史
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('aiAssistantChatHistory');
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('无法加载聊天历史:', error);
    }
  }, []);

  // 保存聊天历史到localStorage
  const saveChatHistory = (history) => {
    try {
      localStorage.setItem('aiAssistantChatHistory', JSON.stringify(history));
    } catch (error) {
      console.error('无法保存聊天历史:', error);
    }
  };

  // 处理iframe加载完成事件
  const handleIframeLoad = () => {
    setLoading(false);
    setLoadError(false);
    // 加载完成后开始显示打字机效果的欢迎消息
    if (!hideWelcome) {
      startTypingEffect();
    }
  };

  // 处理iframe加载错误
  const handleIframeError = () => {
    setLoading(false);
    setLoadError(true);
    console.error('iframe加载失败');
    message.error('AI助手加载失败，请点击重试按钮');
  };

  // 重新加载iframe
  const handleRetry = () => {
    setLoading(true);
    setLoadError(false);
    // 生成新的key以强制iframe重新渲染
    setIframeKey(Date.now());
  };

  // 打字机效果函数
  const startTypingEffect = () => {
    const speed = 50; // 每个字符显示的间隔毫秒数
    let i = 0;
    const timer = setInterval(() => {
      if (i < fullWelcomeMessage.length) {
        setWelcomeMessage(prev => prev + fullWelcomeMessage.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
  };

  // 关闭欢迎消息
  const closeWelcomeMessage = () => {
    setHideWelcome(true);
    setWelcomeMessage('');
    // 保存此偏好到本地存储，避免每次都显示欢迎消息
    localStorage.setItem('aiAssistantHideWelcome', 'true');
  };

  // 拖动相关函数
  const handleDragStart = (e) => {
    // 阻止默认行为，防止在某些浏览器中触发不必要的拖放操作
    e.preventDefault();
    e.stopPropagation(); // 添加这行确保事件不会冒泡
    
    if (e.type === 'mousedown') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
      
      // 添加mousemove和mouseup事件监听器
      document.addEventListener('mousemove', handleDragMove, { passive: false });
      document.addEventListener('mouseup', handleDragEnd);
    } else if (e.type === 'touchstart' && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
      
      // 添加touchmove和touchend事件监听器
      document.addEventListener('touchmove', handleDragMove, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
    }
  };
  
  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    // 阻止默认行为，防止滚动
    e.preventDefault();
    e.stopPropagation(); // 添加这行确保事件不会冒泡
    
    let clientX, clientY;
    
    if (e.type === 'mousemove') {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.type === 'touchmove' && e.touches.length === 1) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      return;
    }
    
    // 计算位置差异
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    // 获取视口尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 解析当前位置
    let currentLeft = parseInt(position.left) || 0;
    let currentBottom = parseInt(position.bottom) || 0;
    
    // 如果使用的是其他定位方式，转换为left和bottom
    if (position.right !== undefined) {
      currentLeft = viewportWidth - parseInt(position.right) - 56;
    }
    if (position.top !== undefined) {
      currentBottom = viewportHeight - parseInt(position.top) - 56;
    }
    
    // 计算新位置（使用left和bottom定位）
    let newLeft = Math.max(10, Math.min(currentLeft + deltaX, viewportWidth - 66));
    let newBottom = Math.max(10, Math.min(currentBottom - deltaY, viewportHeight - 66));
    
    // 更新位置状态
    setPosition({
      left: `${newLeft}px`,
      bottom: `${newBottom}px`
    });
    
    // 更新拖动起点
    setDragStart({
      x: clientX,
      y: clientY
    });
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
    
    // 移除事件监听器
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
    
    // 保存位置到本地存储
    localStorage.setItem('aiAssistantPosition', JSON.stringify(position));
  };

  // 切换窗口大小
  const toggleWindowSize = () => {
    setMaximized(!maximized);
  };

  // 显示聊天窗口
  const showDrawer = () => {
    setVisible(true);
    setLoading(true); // 重新打开时重置加载状态
    setLoadError(false); // 重置错误状态
    if (!hideWelcome) {
      setWelcomeMessage(''); // 重置欢迎消息
    }
    setHasNewMessage(false); // 清除新消息通知
    // 生成新的iframe key以强制重新渲染
    setIframeKey(Date.now());
    
    // 设置超时处理，避免加载状态卡住
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setLoadError(true);
      }
    }, 10000); // 10秒超时
    
    return () => clearTimeout(loadingTimeout);
  };

  // 关闭聊天窗口
  const closeDrawer = () => {
    setVisible(false);
  };

  // 切换显示/隐藏历史记录
  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  // 清空聊天历史
  const clearHistory = () => {
    setChatHistory([]);
    saveChatHistory([]);
  };

  // 模拟发送消息到iframe
  const sendMessage = (text = userInput) => {
    if (!text.trim()) return;
    
    // 保存到聊天历史
    const newMessage = {
      text: text.trim(),
      timestamp: new Date().toISOString()
    };
    
    const updatedHistory = [...chatHistory, newMessage].slice(-10); // 只保留最近10条
    setChatHistory(updatedHistory);
    saveChatHistory(updatedHistory);
    
    try {
      // 尝试获取iframe中的输入框和发送按钮
      // 注意：由于跨域限制，这种方式可能不会在所有环境下工作
      const iframeDocument = iframeRef.current.contentWindow.document;
      const inputElement = iframeDocument.querySelector('input[type="text"], textarea');
      const sendButton = iframeDocument.querySelector('button[type="submit"]');
      
      if (inputElement && sendButton) {
        // 如果当前窗口不可见，先显示窗口
        if (!visible) {
          setVisible(true);
          // 简单等待iframe加载
          setTimeout(() => {
            try {
              const newIframeDocument = iframeRef.current.contentWindow.document;
              const newInputElement = newIframeDocument.querySelector('input[type="text"], textarea');
              const newSendButton = newIframeDocument.querySelector('button[type="submit"]');
              
              if (newInputElement && newSendButton) {
                // 设置输入值
                newInputElement.value = text;
                // 触发输入事件以确保框架检测到值的变化
                const event = new Event('input', { bubbles: true });
                newInputElement.dispatchEvent(event);
                // 点击发送按钮
                newSendButton.click();
              }
            } catch (delayedError) {
              console.error('延迟发送消息失败:', delayedError);
            }
          }, 1000); // 等待1秒钟以确保iframe已加载
        } else {
          // 设置输入值
          inputElement.value = text;
          // 触发输入事件以确保框架检测到值的变化
          const event = new Event('input', { bubbles: true });
          inputElement.dispatchEvent(event);
          // 点击发送按钮
          sendButton.click();
        }
      } else {
        console.log('无法找到iframe中的输入框或发送按钮');
      }
    } catch (error) {
      console.error('跨域限制阻止了与iframe的交互', error);
    }
    
    // 关闭欢迎消息（如果有显示）
    if (welcomeMessage) {
      setHideWelcome(true);
      setWelcomeMessage('');
    }
    
    // 清空输入框
    setUserInput('');
  };

  // 处理键盘按下事件，以便在按下Enter键时发送消息
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // 处理历史条目点击
  const handleHistoryItemClick = (text) => {
    sendMessage(text);
    setShowHistory(false);
  };

  // 处理快速问题点击
  const handleQuickQuestionClick = (question) => {
    // 确保是新的对话
    clearHistory(); // 清除当前历史记录
    setShowHistory(false); // 确保历史记录面板是关闭的
    
    // 如果当前问答界面是开启的，先关闭再打开以强制刷新
    if (visible) {
      closeDrawer();
      setTimeout(() => {
        showDrawer();
        setTimeout(() => {
          sendMessage(question.text);
        }, 500); // 给界面一点时间加载
      }, 100);
    } else {
      showDrawer();
      setTimeout(() => {
        sendMessage(question.text);
      }, 500); // 给界面一点时间加载
    }
  };

  // 当组件不可见时，模拟收到新消息
  useEffect(() => {
    let timer = null;
    if (!visible) {
      // 随机1-3分钟后显示新消息提醒
      const delay = Math.floor(Math.random() * 120000) + 60000;
      timer = setTimeout(() => {
        setHasNewMessage(true);
      }, delay);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible]);

  // 检查是否需要隐藏欢迎消息
  useEffect(() => {
    const hideWelcomePreference = localStorage.getItem('aiAssistantHideWelcome');
    if (hideWelcomePreference === 'true') {
      setHideWelcome(true);
    }
  }, []);

  // 抽屉标题组件
  const DrawerTitle = () => (
    <div className="assistant-drawer-title">
      <span>AI股票助手</span>
      <div className="drawer-actions">
        <Button 
          type="text" 
          icon={maximized ? <FullscreenExitOutlined /> : <FullscreenOutlined />} 
          onClick={toggleWindowSize}
        />
        <Button type="text" icon={<CloseOutlined />} onClick={closeDrawer} />
      </div>
    </div>
  );

  // 根据窗口大小状态设置抽屉宽度和高度
  const drawerWidth = maximized ? '80%' : '400px';
  const drawerHeight = maximized ? '80%' : '600px';

  // 确定Tooltip的放置位置
  const tooltipPlacement = position.left ? 'right' : 'left';

  // 如果在登录页面，则不显示AI助手
  if (isLoginPage) {
    return null;
  }

  return (
    <>
      {/* 悬浮机器人按钮 */}
      <Badge dot={hasNewMessage} offset={[-5, 5]}>
        <div 
          className="assistant-button-container"
          style={position}
        >
          <Tooltip title="按住拖动可移动位置" placement="top">
            <Button
              className="drag-handle"
              type="text"
              size="small"
              icon={<DragOutlined />}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            />
          </Tooltip>
          <Tooltip title="AI股票助手" placement={tooltipPlacement}>
            <Button
              className="floating-assistant-button"
              type="primary"
              shape="circle"
              icon={<RobotOutlined />}
              size="large"
              onClick={showDrawer}
            />
          </Tooltip>
        </div>
      </Badge>

      {/* 聊天窗口抽屉 */}
      <Drawer
        title={<DrawerTitle />}
        placement="left"
        closable={false}
        onClose={closeDrawer}
        open={visible}
        width={drawerWidth}
        height={drawerHeight}
        className={`assistant-drawer ${maximized ? 'maximized' : ''}`}
        mask={false}
        destroyOnClose={true} // 改为true，确保每次关闭后都重新创建内容
        footer={
          <div className="assistant-input-container">
            {/* 快速提问按钮 */}
            <div className="quick-questions">
              <Space wrap>
                {quickQuestions.slice(0, maximized ? 6 : 3).map((q, index) => (
                  <Tag
                    key={index}
                    icon={q.icon}
                    color="blue"
                    className="quick-question-tag"
                    onClick={() => handleQuickQuestionClick(q)}
                  >
                    {q.text}
                  </Tag>
                ))}
              </Space>
            </div>
            
            <Input
              placeholder="输入您的问题..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              suffix={
                <Button 
                  type="primary" 
                  icon={<SendOutlined />} 
                  onClick={() => sendMessage()}
                />
              }
            />
          </div>
        }
      >
        {/* 聊天历史面板 */}
        {showHistory && (
          <div className="chat-history-panel">
            <div className="chat-history-header">
              <Text strong>历史问题</Text>
              <Button 
                type="text" 
                icon={<DeleteOutlined />} 
                onClick={clearHistory} 
                size="small"
                danger
              >
                清空历史
              </Button>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div className="chat-history-content">
              {chatHistory.length > 0 ? (
                chatHistory.map((item, index) => (
                  <div 
                    key={index} 
                    className="chat-history-item"
                    onClick={() => handleHistoryItemClick(item.text)}
                  >
                    <div className="chat-history-text">{item.text}</div>
                    <div className="chat-history-time">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                )).reverse()
              ) : (
                <div className="chat-history-empty">暂无聊天历史</div>
              )}
            </div>
          </div>
        )}

        {/* 加载指示器 */}
        {loading && (
          <div className="assistant-loading">
            <Spin size="large" tip="正在加载AI助手..." />
          </div>
        )}

        {/* 错误状态显示 */}
        {loadError && !loading && (
          <div className="assistant-error">
            <div className="error-content">
              <div className="error-icon"><CloseOutlined /></div>
              <h3>加载失败</h3>
              <p>无法连接到AI服务，请检查您的网络连接</p>
              <Button type="primary" onClick={handleRetry}>重新加载</Button>
            </div>
          </div>
        )}

        {/* 欢迎消息 */}
        {welcomeMessage && !loading && !hideWelcome && (
          <div className="welcome-message-container">
            <div className="welcome-message">
              {welcomeMessage}
              {welcomeMessage.length < fullWelcomeMessage.length && (
                <span className="typing-cursor">|</span>
              )}
              {welcomeMessage.length === fullWelcomeMessage.length && (
                <Button
                  type="text"
                  size="small"
                  className="welcome-close-btn"
                  icon={<CloseOutlined />}
                  onClick={closeWelcomeMessage}
                />
              )}
            </div>
          </div>
        )}
        
        {/* 嵌入大模型问答界面 */}
        <iframe
          ref={iframeRef}
          src={aiAssistantUrl}
          title="AI股票助手"
          className="assistant-iframe"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allowFullScreen
          key={iframeKey} // 使用动态key强制重新渲染
        />
      </Drawer>
    </>
  );
};

export default AIAssistant; 