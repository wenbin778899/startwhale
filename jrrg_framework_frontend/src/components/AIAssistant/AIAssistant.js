import React, { useState, useEffect, useRef } from 'react';
import { Button, Drawer, Spin, Badge, Tooltip, Typography, Divider, message } from 'antd';
import { 
  RobotOutlined, 
  CloseOutlined, 
  FullscreenOutlined, 
  FullscreenExitOutlined, 
  DeleteOutlined,
  DragOutlined
} from '@ant-design/icons';
import './AIAssistant.scss';

const { Text } = Typography;

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

  // 全面重写拖动逻辑，修复拖动问题
  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 捕获初始鼠标坐标和按钮位置
    let clientX, clientY;
    
    if (e.type === 'mousedown') {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.type === 'touchstart' && e.touches && e.touches.length) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      return;
    }
    
    // 获取当前按钮位置
    const buttonElement = e.currentTarget.closest('.assistant-button-container');
    const buttonRect = buttonElement.getBoundingClientRect();
    
    // 计算鼠标点击位置与按钮左上角的偏移量
    const offsetX = clientX - buttonRect.left;
    const offsetY = clientY - buttonRect.top;
    
    // 鼠标移动时更新按钮位置
    const handleMove = (moveEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      
      let moveClientX, moveClientY;
      
      if (moveEvent.type === 'mousemove') {
        moveClientX = moveEvent.clientX;
        moveClientY = moveEvent.clientY;
      } else if (moveEvent.type === 'touchmove' && moveEvent.touches && moveEvent.touches.length) {
        moveClientX = moveEvent.touches[0].clientX;
        moveClientY = moveEvent.touches[0].clientY;
      } else {
        return;
      }
      
      // 计算新位置，考虑偏移量
      const newLeft = moveClientX - offsetX;
      const newBottom = window.innerHeight - (moveClientY - offsetY + buttonRect.height);
      
      // 限制在视口范围内
      const constrainedLeft = Math.max(0, Math.min(newLeft, window.innerWidth - buttonRect.width));
      const constrainedBottom = Math.max(0, Math.min(newBottom, window.innerHeight - buttonRect.height));
      
      // 更新位置
      setPosition({
        left: `${constrainedLeft}px`,
        bottom: `${constrainedBottom}px`
      });
    };
    
    // 鼠标释放时清除事件监听
    const handleRelease = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleRelease);
      document.removeEventListener('touchend', handleRelease);
      document.removeEventListener('mouseleave', handleRelease);
      
      // 保存位置到本地存储
      localStorage.setItem('aiAssistantPosition', JSON.stringify(position));
    };
    
    // 添加事件监听
    document.addEventListener('mousemove', handleMove, { passive: false });
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('mouseup', handleRelease);
    document.addEventListener('touchend', handleRelease);
    document.addEventListener('mouseleave', handleRelease);
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

  // 处理历史条目点击
  const handleHistoryItemClick = (text) => {
    // 向iframe发送消息（省略实现）
    setShowHistory(false);
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

  // 极简抽屉标题组件，只保留收缩放大按钮
  const DrawerTitle = () => (
    <div className="assistant-drawer-title">
      <div className="drawer-spacer"></div>
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

      {/* 聊天窗口抽屉 - 移除footer和输入组件 */}
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
        destroyOnClose={true}
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
        
        {/* 嵌入大模型问答界面 */}
        <iframe
          ref={iframeRef}
          src={aiAssistantUrl}
          title="AI股票助手"
          className="assistant-iframe"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allowFullScreen
          key={iframeKey}
        />
      </Drawer>
    </>
  );
};

export default AIAssistant; 