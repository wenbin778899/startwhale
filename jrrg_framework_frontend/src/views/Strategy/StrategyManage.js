import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Table, 
  Button, 
  Input, 
  message, 
  Divider, 
  Space, 
  Tag, 
  Typography, 
  Modal, 
  Form,
  Spin,
  Alert,
  Select,
  Tooltip,
  Statistic,
  Empty,
  List,
  Avatar,
  Badge
} from 'antd';
import { 
  StarOutlined, 
  DeleteOutlined, 
  SearchOutlined, 
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  HeartOutlined,
  HeartFilled,
  RiseOutlined,
  FallOutlined,
  RollbackOutlined,
  FullscreenOutlined,
  DownOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { 
  getFavoriteStocks, 
  addFavoriteStock, 
  removeFavoriteStock,
  updateFavoriteStockNote,
  getAIAnalysis,
  getDeepseekAnalysis,
  getAnalysisHistory,
  refreshAnalysisHistory
} from '../../api/strategy';
import { getStockInfo, getStockIntraday } from '../../api/stock';
import './StrategyManage.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 分时图表组件
const IntradayChart = ({ data }) => {
  const chartRef = React.useRef(null);
  const [hoveredPoint, setHoveredPoint] = React.useState(null);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (!data || !data.chart_data || !chartRef.current) return;

    // 准备图表数据
    const chartData = data.chart_data;
    const prices = chartData.map(item => item.price);
    const basePrice = data.prev_close || data.open_price;
    
    // 计算价格范围
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const margin = Math.max(priceRange * 0.15, 0.01); // 至少15%边距
    
    const chartWidth = 1000;
    const chartHeight = 400;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;
    const plotWidth = chartWidth - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;

    // 创建SVG容器
    const createChart = () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('viewBox', `0 0 ${chartWidth} ${chartHeight}`);
      svg.style.backgroundColor = '#fafafa';
      
      // 创建渐变定义
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      
      // 上涨渐变（红色）
      const upGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      upGradient.setAttribute('id', 'upGradient');
      upGradient.setAttribute('x1', '0%');
      upGradient.setAttribute('y1', '0%');
      upGradient.setAttribute('x2', '0%');
      upGradient.setAttribute('y2', '100%');
      
      const upStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      upStop1.setAttribute('offset', '0%');
      upStop1.setAttribute('stop-color', '#ff4d4f');
      upStop1.setAttribute('stop-opacity', '0.3');
      
      const upStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      upStop2.setAttribute('offset', '100%');
      upStop2.setAttribute('stop-color', '#ff4d4f');
      upStop2.setAttribute('stop-opacity', '0.05');
      
      upGradient.appendChild(upStop1);
      upGradient.appendChild(upStop2);
      
      // 下跌渐变（绿色）
      const downGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      downGradient.setAttribute('id', 'downGradient');
      downGradient.setAttribute('x1', '0%');
      downGradient.setAttribute('y1', '0%');
      downGradient.setAttribute('x2', '0%');
      downGradient.setAttribute('y2', '100%');
      
      const downStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      downStop1.setAttribute('offset', '0%');
      downStop1.setAttribute('stop-color', '#52c41a');
      downStop1.setAttribute('stop-opacity', '0.3');
      
      const downStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      downStop2.setAttribute('offset', '100%');
      downStop2.setAttribute('stop-color', '#52c41a');
      downStop2.setAttribute('stop-opacity', '0.05');
      
      defs.appendChild(upGradient);
      defs.appendChild(downGradient);
      svg.appendChild(defs);
      
      // 绘制网格线
      const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      gridGroup.setAttribute('class', 'grid');
      
      // 水平网格线（价格）
      for (let i = 0; i <= 5; i++) {
        const price = minPrice - margin + (priceRange + 2 * margin) * i / 5;
        const y = paddingTop + plotHeight - (i / 5) * plotHeight;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', paddingLeft);
        line.setAttribute('y1', y);
        line.setAttribute('x2', paddingLeft + plotWidth);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#e8e8e8');
        line.setAttribute('stroke-width', i === 0 || i === 5 ? '1' : '0.5');
        gridGroup.appendChild(line);
        
        // 价格标签
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', paddingLeft - 5);
        text.setAttribute('y', y + 4);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('font-size', '11');
        text.setAttribute('fill', '#666');
        text.textContent = price.toFixed(2);
        gridGroup.appendChild(text);
      }
      
      // 垂直网格线（时间）
      const timePoints = [0, 0.25, 0.5, 0.75, 1];
      const timeLabels = ['09:30', '10:45', '12:00', '13:45', '15:00'];
      
      timePoints.forEach((ratio, index) => {
        const x = paddingLeft + ratio * plotWidth;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', paddingTop);
        line.setAttribute('x2', x);
        line.setAttribute('y2', paddingTop + plotHeight);
        line.setAttribute('stroke', '#e8e8e8');
        line.setAttribute('stroke-width', '0.5');
        gridGroup.appendChild(line);
        
        // 时间标签
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', paddingTop + plotHeight + 15);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '11');
        text.setAttribute('fill', '#666');
        text.textContent = timeLabels[index];
        gridGroup.appendChild(text);
      });
      
      svg.appendChild(gridGroup);
      
      // 绘制基准线
      if (basePrice) {
        const baseY = paddingTop + plotHeight - ((basePrice - minPrice + margin) / (priceRange + 2 * margin)) * plotHeight;
        const baseLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        baseLine.setAttribute('x1', paddingLeft);
        baseLine.setAttribute('y1', baseY);
        baseLine.setAttribute('x2', paddingLeft + plotWidth);
        baseLine.setAttribute('y2', baseY);
        baseLine.setAttribute('stroke', '#faad14');
        baseLine.setAttribute('stroke-width', '1.5');
        baseLine.setAttribute('stroke-dasharray', '5,3');
        svg.appendChild(baseLine);
        
        // 基准线标签
        const baseText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        baseText.setAttribute('x', paddingLeft + plotWidth + 5);
        baseText.setAttribute('y', baseY + 4);
        baseText.setAttribute('font-size', '11');
        baseText.setAttribute('fill', '#faad14');
        baseText.textContent = `前收 ${basePrice.toFixed(2)}`;
        svg.appendChild(baseText);
      }
      
      // 创建价格线路径
      const pathData = prices.map((price, index) => {
        const x = paddingLeft + (index / (prices.length - 1)) * plotWidth;
        const y = paddingTop + plotHeight - ((price - minPrice + margin) / (priceRange + 2 * margin)) * plotHeight;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ');
      
      // 判断整体趋势
      const currentPrice = prices[prices.length - 1];
      const isUp = currentPrice >= basePrice;
      const lineColor = isUp ? '#ff4d4f' : '#52c41a';
      const fillGradient = isUp ? 'url(#upGradient)' : 'url(#downGradient)';
      
      // 创建填充区域
      const fillData = pathData + ` L ${paddingLeft + plotWidth} ${paddingTop + plotHeight} L ${paddingLeft} ${paddingTop + plotHeight} Z`;
      const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      fillPath.setAttribute('d', fillData);
      fillPath.setAttribute('fill', fillGradient);
      svg.appendChild(fillPath);
      
      // 创建价格线
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', lineColor);
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');
      svg.appendChild(path);
      
      // 找到最高点和最低点的索引
      const maxPriceIndex = prices.findIndex(price => price === maxPrice);
      const minPriceIndex = prices.findIndex(price => price === minPrice);
      
      // 标记最高点
      const maxX = paddingLeft + (maxPriceIndex / (prices.length - 1)) * plotWidth;
      const maxY = paddingTop + plotHeight - ((maxPrice - minPrice + margin) / (priceRange + 2 * margin)) * plotHeight;
      
      // 最高点圆形标记
      const maxCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      maxCircle.setAttribute('cx', maxX);
      maxCircle.setAttribute('cy', maxY);
      maxCircle.setAttribute('r', '4');
      maxCircle.setAttribute('fill', '#ff4d4f');
      maxCircle.setAttribute('stroke', '#fff');
      maxCircle.setAttribute('stroke-width', '2');
      svg.appendChild(maxCircle);
      
      // 最高点标签
      const maxLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      maxLabel.setAttribute('x', maxX);
      maxLabel.setAttribute('y', maxY - 10);
      maxLabel.setAttribute('text-anchor', 'middle');
      maxLabel.setAttribute('font-size', '12');
      maxLabel.setAttribute('font-weight', 'bold');
      maxLabel.setAttribute('fill', '#ff4d4f');
      maxLabel.textContent = `最高 ${maxPrice.toFixed(2)}`;
      svg.appendChild(maxLabel);
      
      // 标记最低点
      const minX = paddingLeft + (minPriceIndex / (prices.length - 1)) * plotWidth;
      const minY = paddingTop + plotHeight - ((minPrice - minPrice + margin) / (priceRange + 2 * margin)) * plotHeight;
      
      // 最低点圆形标记
      const minCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      minCircle.setAttribute('cx', minX);
      minCircle.setAttribute('cy', minY);
      minCircle.setAttribute('r', '4');
      minCircle.setAttribute('fill', '#52c41a');
      minCircle.setAttribute('stroke', '#fff');
      minCircle.setAttribute('stroke-width', '2');
      svg.appendChild(minCircle);
      
      // 最低点标签
      const minLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      minLabel.setAttribute('x', minX);
      minLabel.setAttribute('y', minY + 20);
      minLabel.setAttribute('text-anchor', 'middle');
      minLabel.setAttribute('font-size', '12');
      minLabel.setAttribute('font-weight', 'bold');
      minLabel.setAttribute('fill', '#52c41a');
      minLabel.textContent = `最低 ${minPrice.toFixed(2)}`;
      svg.appendChild(minLabel);
      
      // 添加交互层
      const interactiveRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      interactiveRect.setAttribute('x', paddingLeft);
      interactiveRect.setAttribute('y', paddingTop);
      interactiveRect.setAttribute('width', plotWidth);
      interactiveRect.setAttribute('height', plotHeight);
      interactiveRect.setAttribute('fill', 'transparent');
      interactiveRect.setAttribute('cursor', 'crosshair');
      
      // 创建标定线组（初始隐藏）
      const crosshairGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      crosshairGroup.setAttribute('id', 'crosshair');
      crosshairGroup.style.display = 'none';
      
      // 垂直标定线
      const verticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      verticalLine.setAttribute('y1', paddingTop);
      verticalLine.setAttribute('y2', paddingTop + plotHeight);
      verticalLine.setAttribute('stroke', '#666');
      verticalLine.setAttribute('stroke-width', '1');
      verticalLine.setAttribute('stroke-dasharray', '3,3');
      verticalLine.setAttribute('opacity', '0.8');
      
      // 水平标定线
      const horizontalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      horizontalLine.setAttribute('x1', paddingLeft);
      horizontalLine.setAttribute('x2', paddingLeft + plotWidth);
      horizontalLine.setAttribute('stroke', '#666');
      horizontalLine.setAttribute('stroke-width', '1');
      horizontalLine.setAttribute('stroke-dasharray', '3,3');
      horizontalLine.setAttribute('opacity', '0.8');
      
      // 标定点
      const crosshairPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      crosshairPoint.setAttribute('r', '3');
      crosshairPoint.setAttribute('fill', '#1890ff');
      crosshairPoint.setAttribute('stroke', '#fff');
      crosshairPoint.setAttribute('stroke-width', '2');
      
      crosshairGroup.appendChild(verticalLine);
      crosshairGroup.appendChild(horizontalLine);
      crosshairGroup.appendChild(crosshairPoint);
      svg.appendChild(crosshairGroup);
      
      // 鼠标移动事件
      interactiveRect.addEventListener('mousemove', (e) => {
        const rect = svg.getBoundingClientRect();
        const scaleX = rect.width / chartWidth;
        
        // 计算相对于SVG的实际坐标
        const svgX = (e.clientX - rect.left) / scaleX;
        
        if (svgX >= paddingLeft && svgX <= paddingLeft + plotWidth) {
          // 计算最近的数据点索引
          const relativeX = svgX - paddingLeft;
          const dataRatio = relativeX / plotWidth;
          const dataIndex = Math.round(dataRatio * (chartData.length - 1));
          
          if (dataIndex >= 0 && dataIndex < chartData.length) {
            const dataPoint = chartData[dataIndex];
            const pointX = paddingLeft + (dataIndex / (chartData.length - 1)) * plotWidth;
            const pointY = paddingTop + plotHeight - ((dataPoint.price - minPrice + margin) / (priceRange + 2 * margin)) * plotHeight;
            
            // 更新标定线位置
            // 垂直线跟随鼠标精确位置
            verticalLine.setAttribute('x1', svgX);
            verticalLine.setAttribute('x2', svgX);
            // 水平线使用数据点的Y坐标
            horizontalLine.setAttribute('y1', pointY);
            horizontalLine.setAttribute('y2', pointY);
            // 标定点在数据点的精确位置
            crosshairPoint.setAttribute('cx', pointX);
            crosshairPoint.setAttribute('cy', pointY);
            crosshairGroup.style.display = 'block';
            
            setHoveredPoint({
              index: dataIndex,
              data: dataPoint,
              x: pointX,
              y: pointY
            });
            setMousePosition({ x: e.clientX, y: e.clientY });
          }
        }
      });
      
      interactiveRect.addEventListener('mouseleave', () => {
        setHoveredPoint(null);
        crosshairGroup.style.display = 'none';
      });
      
      svg.appendChild(interactiveRect);
      
      return svg;
    };

    // 清空并添加图表
    chartRef.current.innerHTML = '';
    chartRef.current.appendChild(createChart());
  }, [data]);

  if (!data || !data.chart_data || data.chart_data.length === 0) {
    return <Empty description="暂无分时数据" />;
  }

  const currentPrice = data.current_price;
  const basePrice = data.prev_close || data.open_price;
  const isUp = currentPrice >= basePrice;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic 
              title="最新价" 
              value={data.current_price} 
              precision={2} 
              prefix="¥"
              valueStyle={{ 
                color: isUp ? '#ff4d4f' : '#52c41a',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="涨跌额" 
              value={data.change} 
              precision={2}
              prefix={data.change > 0 ? '+' : ''}
              valueStyle={{ 
                color: isUp ? '#ff4d4f' : '#52c41a',
                fontSize: '16px'
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="涨跌幅" 
              value={data.change_percent} 
              precision={2} 
              suffix="%"
              prefix={data.change_percent > 0 ? '+' : ''}
              valueStyle={{ 
                color: isUp ? '#ff4d4f' : '#52c41a',
                fontSize: '16px'
              }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="成交量" 
              value={data.volume} 
              suffix="手"
              valueStyle={{ fontSize: '16px' }}
            />
          </Col>
        </Row>
      </div>
      
      <div 
        ref={chartRef} 
        style={{ 
          width: '100%', 
          height: 420, 
          border: '1px solid #e8e8e8',
          borderRadius: '6px',
          backgroundColor: '#fafafa',
          position: 'relative'
        }}
      />
      
      {/* 悬停提示框 */}
      {hoveredPoint && (() => {
        // 计算涨跌幅
        const currentPointPrice = hoveredPoint.data.price;
        const prevClosePrice = data.prev_close || data.open_price;
        let changePercent = 0;
        let isUp = false;
        
        if (prevClosePrice && prevClosePrice > 0) {
          changePercent = ((currentPointPrice - prevClosePrice) / prevClosePrice * 100);
          isUp = currentPointPrice >= prevClosePrice;
        }
        
        return (
          <div
            style={{
              position: 'fixed',
              left: mousePosition.x + 10,
              top: mousePosition.y - 60,
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              pointerEvents: 'none',
              zIndex: 1000,
              whiteSpace: 'nowrap'
            }}
          >
            <div>时间: {hoveredPoint.data.time}</div>
            <div>价格: ¥{currentPointPrice.toFixed(2)}</div>
            <div>成交量: {hoveredPoint.data.volume}手</div>
            {prevClosePrice && prevClosePrice > 0 && (
              <div style={{ color: isUp ? '#ff4d4f' : '#52c41a' }}>
                {isUp ? '▲' : '▼'} 
                {changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%
              </div>
            )}
          </div>
        );
      })()}
      
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <Text type="secondary">
          交易时间: 09:30 - 15:00 | 数据点: {data.chart_data.length} 个 | 
          <span style={{ color: isUp ? '#ff4d4f' : '#52c41a', marginLeft: 8 }}>
            {isUp ? '📈 上涨' : '📉 下跌'}
          </span>
        </Text>
      </div>
    </div>
  );
};

const StrategyManage = () => {
  // 自选股票相关状态
  const [favoriteStocks, setFavoriteStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addStockModalVisible, setAddStockModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // AI分析相关状态
  const [aiAnalysisVisible, setAiAnalysisVisible] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [selectedStockForAI, setSelectedStockForAI] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  // 历史记录分页和加载状态
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(5);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyMoreAvailable, setHistoryMoreAvailable] = useState(true);
  const [historyFullscreen, setHistoryFullscreen] = useState(false);

  // 添加新的状态变量
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [historyDetailVisible, setHistoryDetailVisible] = useState(false);

  // 新增状态跟踪前一个对话
  const [previousContext, setPreviousContext] = useState(null);

  // 分时图表相关状态
  const [chartVisible, setChartVisible] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);

  // 页面加载时获取自选股票
  useEffect(() => {
    loadFavoriteStocks();
  }, []);

  // 加载自选股票列表
  const loadFavoriteStocks = async () => {
    setLoading(true);
    try {
      const response = await getFavoriteStocks();
      console.log('获取自选股票响应:', response);
      
      if (response && response.code === 0) {
        // 检查数据是否存在
        if (!response.data || response.data.length === 0) {
          console.log('自选股票列表为空');
          setFavoriteStocks([]);
          return;
        }
        
        console.log(`获取到 ${response.data.length} 只自选股票`);
        
        // 获取每只股票的实时数据
        const stocksWithData = await Promise.all(
          response.data.map(async (stock) => {
            try {
              // 先设置基础数据，确保即使获取实时数据失败也能显示
              const baseStock = {
                ...stock,
                stock_code: stock.stock_code,
                stock_name: stock.stock_name,
                created_at: stock.created_at,
                current_price: '-',
                open_price: '-',
                high_price: '-',
                low_price: '-',
                change: 0,
                change_percent: 0,
                volume: '-',
                amount: '-',
                trade_date: '-'
              };
              
              // 尝试获取实时数据
              const stockDataResponse = await getStockIntraday(stock.stock_code);
              console.log(`股票 ${stock.stock_code} 分时数据响应:`, stockDataResponse);
              
              if (stockDataResponse.code === 0 && stockDataResponse.data) {
                const data = stockDataResponse.data;
                return {
                  ...baseStock,
                  current_price: data.current_price,
                  open_price: data.open_price,
                  high_price: data.high_price,
                  low_price: data.low_price,
                  change: data.change,
                  change_percent: data.change_percent,
                  volume: data.volume,
                  amount: data.volume * data.current_price, // 估算成交额
                  trade_date: data.latest_time,
                  stock_name: data.name || stock.stock_name
                };
              } else {
                console.warn(`股票 ${stock.stock_code} 分时数据请求失败`);
                return baseStock;
              }
            } catch (error) {
              console.error(`获取股票 ${stock.stock_code} 数据失败:`, error);
              // 返回基础数据，确保股票能够显示
              return {
                ...stock,
                stock_code: stock.stock_code,
                stock_name: stock.stock_name,
                created_at: stock.created_at,
                current_price: '-',
                open_price: '-',
                high_price: '-',
                low_price: '-',
                change: 0,
                change_percent: 0,
                volume: '-',
                amount: '-',
                trade_date: '-'
              };
            }
          })
        );
        
        console.log('处理后的股票数据:', stocksWithData);
        console.log('股票数据长度:', stocksWithData.length);
        console.log('股票数据详情:', JSON.stringify(stocksWithData, null, 2));
        
        // 确保数据是有效的数组
        if (Array.isArray(stocksWithData) && stocksWithData.length > 0) {
          setFavoriteStocks(stocksWithData);
          console.log('已设置favoriteStocks状态，长度:', stocksWithData.length);
        } else {
          console.error('处理后的股票数据无效:', stocksWithData);
          setFavoriteStocks([]);
        }
      } else if (response && response.code === 401) {
        // 未授权，可能是token过期
        console.error('未授权访问，请重新登录');
        message.error('登录已过期，请重新登录');
      } else {
        console.error('获取自选股票失败，响应:', response);
        message.error(response?.message || '获取自选股票列表失败');
      }
    } catch (error) {
      console.error('加载自选股票出错:', error);
      
      // 更详细的错误处理
      if (error.response) {
        // 服务器返回了错误响应
        console.error('错误响应:', error.response);
        if (error.response.status === 401) {
          message.error('登录已过期，请重新登录');
        } else if (error.response.status === 404) {
          message.error('接口不存在，请检查后端服务');
        } else if (error.response.status === 500) {
          message.error('服务器错误，请稍后重试');
        } else {
          message.error(`请求失败: ${error.response.status}`);
        }
      } else if (error.request) {
        // 请求已发出但没有收到响应
        console.error('请求失败:', error.request);
        //message.error('网络错误，请检查后端服务是否运行');
      } else {
        // 其他错误
        console.error('未知错误:', error.message);
        //message.error('加载自选股票失败');
      }
      
      setFavoriteStocks([]); // 确保状态被设置
    } finally {
      setLoading(false);
    }
  };

  // 处理输入变化（简化版，不再进行自动搜索）
  const handleInputChange = (value) => {
    setSearchKeyword(value);
  };

  // 直接查询股票信息并添加
  const handleDirectAddStock = async () => {
    if (!searchKeyword.trim()) {
      message.error('请输入股票代码');
      return;
    }

    // 检查是否为6位数字（股票代码格式）
    if (!/^\d{6}$/.test(searchKeyword.trim())) {
      message.error('请输入正确的6位股票代码');
      return;
    }

    setSearchLoading(true);
    try {
      // 先检查是否已在自选列表
      const existingStock = favoriteStocks.find(stock => stock.stock_code === searchKeyword.trim());
      if (existingStock) {
        message.warning('该股票已在自选列表中');
        setSearchLoading(false);
        return;
      }

      // 股票名称映射表（备用）
      const stockNameMap = {
        '000001': '平安银行',
        '000002': '万科A',
        '600036': '招商银行',
        '600519': '贵州茅台',
        '000858': '五粮液',
        '002415': '海康威视',
        '300750': '宁德时代',
        '601318': '中国平安',
        '000333': '美的集团',
        '002230': '科大讯飞'
      };

      // 直接使用getStockIntraday获取股票信息
      const stockInfoResponse = await getStockIntraday(searchKeyword.trim());
      console.log('股票分时信息响应:', stockInfoResponse);
      
      if (stockInfoResponse.code === 0 && stockInfoResponse.data) {
        // 从响应中提取股票名称和代码
        const stockCode = searchKeyword.trim();
        let stockName = stockInfoResponse.data.name || '未知股票';
        
        // 如果分时接口没有返回名称，使用映射表
        if (stockName === '未知' && stockNameMap[stockCode]) {
          stockName = stockNameMap[stockCode];
        }
        
        console.log(`准备添加股票: ${stockCode} - ${stockName}`);
        
        // 添加到自选
        await handleAddFavoriteStock(stockCode, stockName);
      } else {
        message.error('获取股票信息失败，请检查股票代码是否正确');
      }
    } catch (error) {
      console.error('查询股票信息失败:', error);
      message.error('查询股票信息失败，请稍后重试');
    } finally {
      setSearchLoading(false);
    }
  };

  // 搜索股票（已废弃，保留但不使用）
  const handleStockSearch = async () => {
    // 直接调用新的添加方法
    handleDirectAddStock();
  };

  // 添加自选股票
  const handleAddFavoriteStock = async (stockCode, stockName) => {
    try {
      console.log(`尝试添加股票: ${stockCode} - ${stockName}`);
      
      // 注意：这里只检查前端状态中的股票，可能不准确
      // 后端会进行真正的重复检查
      const existingStock = favoriteStocks.find(stock => stock.stock_code === stockCode);
      if (existingStock) {
        message.warning('该股票已在自选列表中');
        return;
      }

      const response = await addFavoriteStock(stockCode, stockName);
      console.log('添加股票响应:', response);
      
      if (response.code === 0) {
        message.success('添加成功');
        setAddStockModalVisible(false);
        setSearchKeyword('');
        // 重新加载列表，确保显示最新数据
        await loadFavoriteStocks();
      } else if (response.code === 1) {
        // 后端返回错误，通常表示股票已存在
        message.warning(response.message || '该股票已在自选列表中');
        // 重新加载列表，确保前端数据同步
        await loadFavoriteStocks();
      } else {
        message.error(response.message || '添加失败');
      }
    } catch (error) {
      console.error('添加自选股票失败:', error);
      
      // 如果后端返回400错误，说明股票已存在
      if (error.response && error.response.status === 400) {
        message.warning('该股票已在自选列表中');
        // 重新加载列表，确保前端显示正确
        await loadFavoriteStocks();
      } else if (error.response && error.response.data && error.response.data.message) {
        message.error(error.response.data.message);
      } else {
        message.error('添加失败，请稍后重试');
      }
    }
  };

  // 删除自选股票
  const handleRemoveFavoriteStock = async (stockCode) => {
    try {
      const response = await removeFavoriteStock(stockCode);
      if (response.code === 0) {
        message.success('删除成功');
        loadFavoriteStocks(); // 重新加载列表
      }
    } catch (error) {
      message.error('删除失败');
      console.error('删除自选股票失败:', error);
    }
  };

  // 处理继续对话按钮点击
  const handleContinueDialog = () => {
    if (selectedHistory) {
      // 获取历史分析的股票信息
      const historyStock = selectedHistory.stock ? {
        stock_code: selectedHistory.stock.stock_code,
        stock_name: selectedHistory.stock.stock_name
      } : null;
      
      // 设置股票和前置内容
      if (historyStock) {
        setSelectedStockForAI(historyStock.stock_code);
      }
      
      // 准备提示，告知用户这是基于上一个对话的继续
      const continuationPrompt = `基于刚才关于"${selectedHistory.question}"的问题，我想进一步询问：`;
      setUserMessage(continuationPrompt);
      
      // 设置前一个对话上下文
      setPreviousContext({
        question: selectedHistory.question,
        answer: selectedHistory.answer
      });
      
      // 关闭历史详情模态框，打开AI分析模态框
      setHistoryDetailVisible(false);
      setAiAnalysisVisible(true);
      
      // 提示用户
      message.info('您可以继续对话，修改问题后点击"获取分析"');
    }
  };

  // 发起AI分析
  const handleAIAnalysis = async () => {
    if (!userMessage.trim()) {
      message.warning('请输入分析问题');
      return;
    }

    setAiLoading(true);
    try {
      let analysisPrompt = userMessage;
      
      // 如果选择了特定股票，加入股票信息
      if (selectedStockForAI) {
        const stockData = favoriteStocks.find(stock => stock.stock_code === selectedStockForAI);
        if (stockData) {
          analysisPrompt = `请分析股票 ${stockData.stock_name}(${stockData.stock_code})，当前价格：${stockData.current_price || '未知'}，涨跌幅：${stockData.change_percent || '未知'}%。用户问题：${userMessage}`;
        }
      }

      // 直接调用Deepseek API，传入前一个对话上下文（如果有）
      const response = await getDeepseekAnalysis(analysisPrompt, selectedStockForAI, previousContext);
      
      // 重置上下文状态，避免影响下一次对话
      setPreviousContext(null);
      
      // 处理响应结果
      if (response && response.analysis) {
        setAiResponse(response.analysis);
        setAiAnalysisVisible(true);
        
        // 添加到本地历史记录（临时显示）
        const newHistory = {
          id: Date.now(),
          question: userMessage,
          answer: response.analysis,
          stock: selectedStockForAI ? favoriteStocks.find(stock => stock.stock_code === selectedStockForAI) : null,
          timestamp: new Date().toLocaleString()
        };
        setAnalysisHistory(prev => [newHistory, ...prev.slice(0, 4)]);
        
        // 添加一个小延迟，确保后端先保存完成，再刷新历史记录
        setTimeout(() => {
          handleRefreshHistory();
        }, 500);
      } else {
        message.error('未获取到有效的分析结果');
      }
    } catch (error) {
      message.error('AI分析失败，请稍后重试');
      console.error('AI分析失败:', error);
    } finally {
      setAiLoading(false);
    }
  };

  // 加载更多历史记录
  const loadMoreHistory = async () => {
    if (!historyMoreAvailable || historyLoading) return;
    
    setHistoryLoading(true);
    try {
      // 计算当前已加载的记录数作为偏移量
      const currentOffset = analysisHistory.length;
      const currentLimit = historyPageSize;
      
      console.log(`加载更多历史记录，偏移量：${currentOffset}，限制：${currentLimit}`);
      const historyResponse = await getAnalysisHistory(currentLimit, currentOffset);
      
      if (historyResponse && historyResponse.code === 0) {
        // 将服务器返回的历史记录映射为前端需要的格式
        const newServerHistory = historyResponse.data.map(item => ({
          id: item.id,
          question: item.question,
          answer: item.answer,
          stock: item.stock_code ? {
            stock_code: item.stock_code,
            stock_name: item.stock_name || '未知股票'
          } : null,
          timestamp: new Date(item.created_at).toLocaleString()
        }));
        
        // 获取元数据
        const meta = historyResponse.meta || {};
        const total = meta.total || 0;
        
        // 将新记录追加到现有历史记录
        const updatedHistory = [...analysisHistory, ...newServerHistory];
        
        // 检查是否还有更多可以加载
        setHistoryMoreAvailable(updatedHistory.length < total);
        setHistoryPage(historyPage + 1);
        setHistoryTotal(total);
        
        // 更新历史记录状态
        setAnalysisHistory(updatedHistory);
        
        if (newServerHistory.length > 0) {
          message.success(`已加载${newServerHistory.length}条新记录`);
        } else {
          message.info('没有更多历史记录了');
          setHistoryMoreAvailable(false);
        }
      }
    } catch (error) {
      console.error('加载更多历史记录失败:', error);
      message.error('加载历史记录失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  // 添加初始加载历史记录的功能
  useEffect(() => {
    loadFavoriteStocks();
    
    // 加载分析历史
    const loadAnalysisHistory = async () => {
      setHistoryLoading(true);
      try {
        // 初始加载20条历史记录
        const historyResponse = await getAnalysisHistory(20, 0);
        if (historyResponse && historyResponse.code === 0) {
          console.log('初始加载分析历史:', historyResponse);
          // 将服务器返回的历史记录映射为前端需要的格式
          const serverHistory = historyResponse.data.map(item => ({
            id: item.id,
            question: item.question,
            answer: item.answer,
            stock: item.stock_code ? {
              stock_code: item.stock_code,
              stock_name: item.stock_name || '未知股票'
            } : null,
            timestamp: new Date(item.created_at).toLocaleString()
          }));
          
          // 获取元数据
          const meta = historyResponse.meta || {};
          const total = meta.total || serverHistory.length;
          
          // 更新历史记录状态
          setAnalysisHistory(serverHistory);
          setHistoryTotal(total);
          setHistoryMoreAvailable(serverHistory.length < total);
          
          if (total > 0) {
            message.success(`成功加载${serverHistory.length}条历史记录，共${total}条`);
          }
        }
      } catch (error) {
        console.error('加载分析历史失败:', error);
        message.error('加载历史记录失败');
      } finally {
        setHistoryLoading(false);
      }
    };
    
    loadAnalysisHistory();
  }, []);

  // 处理刷新历史记录
  const handleRefreshHistory = async () => {
    setHistoryLoading(true);
    try {
      // 重置分页状态，重新加载第一页
      setHistoryPage(1);
      
      // 获取20条历史记录
      const historyResponse = await getAnalysisHistory(20, 0);
      
      if (historyResponse && historyResponse.code === 0) {
        const serverHistory = historyResponse.data.map(item => ({
          id: item.id,
          question: item.question,
          answer: item.answer,
          stock: item.stock_code ? {
            stock_code: item.stock_code,
            stock_name: item.stock_name || '未知股票'
          } : null,
          timestamp: new Date(item.created_at).toLocaleString()
        }));
        
        // 获取元数据
        const meta = historyResponse.meta || {};
        const total = meta.total || 0;
        
        setAnalysisHistory(serverHistory);
        setHistoryTotal(total);
        setHistoryMoreAvailable(serverHistory.length < total);
        message.success('历史记录已刷新');
      }
    } catch (error) {
      console.error('刷新历史记录失败:', error);
      message.error('刷新历史记录失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  // 处理历史项点击
  const handleHistoryItemClick = (historyItem) => {
    setSelectedHistory(historyItem);
    setHistoryDetailVisible(true);
  };

  // 处理显示分时图
  const handleShowChart = async (stock) => {
    setSelectedStock(stock);
    setChartVisible(true);
    setChartLoading(true);
    setChartData(null);

    try {
      console.log(`获取股票 ${stock.stock_code} 的分时数据`);
      const response = await getStockIntraday(stock.stock_code);
      
      if (response.code === 0 && response.data) {
        // 准备图表数据
        const stockData = response.data;
        setChartData(stockData);
        console.log('分时图表数据获取成功:', stockData);
      } else {
        message.error('获取分时数据失败');
      }
    } catch (error) {
      console.error('获取分时数据失败:', error);
      message.error('获取分时数据失败');
    } finally {
      setChartLoading(false);
    }
  };

  // 自选股票表格列定义
  const favoriteStockColumns = [
    {
      title: '股票代码',
      dataIndex: 'stock_code',
      key: 'stock_code',
      width: 100,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '股票名称',
      dataIndex: 'stock_name',
      key: 'stock_name',
      width: 120,
    },
    {
      title: '最新价',
      dataIndex: 'current_price',
      key: 'current_price',
      width: 100,
      render: (price) => price ? `¥${parseFloat(price).toFixed(2)}` : '-'
    },
    {
      title: '涨跌额',
      dataIndex: 'change',
      key: 'change',
      width: 100,
      render: (change) => {
        if (!change && change !== 0) return '-';
        const changeNum = parseFloat(change);
        return (
          <Text style={{ color: changeNum > 0 ? '#cf1322' : changeNum < 0 ? '#3f8600' : 'inherit' }}>
            {changeNum > 0 ? '+' : ''}{changeNum.toFixed(2)}
          </Text>
        );
      }
    },
    {
      title: '涨跌幅',
      dataIndex: 'change_percent',
      key: 'change_percent',
      width: 100,
      render: (percent) => {
        if (!percent && percent !== 0) return '-';
        const value = parseFloat(percent);
        return (
          <Space>
            {value > 0 ? <RiseOutlined style={{ color: '#cf1322' }} /> : 
             value < 0 ? <FallOutlined style={{ color: '#3f8600' }} /> : null}
            <Tag color={value > 0 ? 'red' : value < 0 ? 'green' : 'default'}>
              {value > 0 ? '+' : ''}{value.toFixed(2)}%
            </Tag>
          </Space>
        );
      }
    },
    {
      title: '最高价',
      dataIndex: 'high_price',
      key: 'high_price',
      width: 100,
      render: (price) => price ? `¥${parseFloat(price).toFixed(2)}` : '-'
    },
    {
      title: '交易时间',
      dataIndex: 'trade_date',
      key: 'trade_date',
      width: 120,
      render: (datetime) => {
        if (!datetime) return '-';
        try {
          // 如果包含日期和时间，显示时间部分
          if (datetime.includes(' ')) {
            const timePart = datetime.split(' ')[1];
            return timePart; // 显示 HH:MM:SS 格式
          }
          // 如果只有日期，显示日期
          const dateObj = new Date(datetime);
          return dateObj.toLocaleDateString('zh-CN');
        } catch (error) {
          return datetime;
        }
      }
    },
    {
      title: '最低价',
      dataIndex: 'low_price',
      key: 'low_price',
      width: 100,
      render: (price) => price ? `¥${parseFloat(price).toFixed(2)}` : '-'
    },
    {
      title: '成交量',
      dataIndex: 'volume',
      key: 'volume',
      width: 120,
      render: (volume) => {
        if (!volume) return '-';
        const vol = parseFloat(volume);
        if (vol >= 100000000) {
          return `${(vol / 100000000).toFixed(2)}亿`;
        } else if (vol >= 10000) {
          return `${(vol / 10000).toFixed(2)}万`;
        }
        return vol.toString();
      }
    },
    {
      title: '成交额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => {
        if (!amount) return '-';
        const amt = parseFloat(amount);
        if (amt >= 100000000) {
          return `${(amt / 100000000).toFixed(2)}亿`;
        } else if (amt >= 10000) {
          return `${(amt / 10000).toFixed(2)}万`;
        }
        return amt.toString();
      }
    },
    {
      title: '添加时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (time) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="AI分析">
            <Button 
              size="small" 
              type="default"
              //shape="circle"
              icon={<RobotOutlined />}
              onClick={() => {
                setSelectedStockForAI(record.stock_code);
                setAiAnalysisVisible(true);
              }}
              style={{ 
                color: '#7b68ee',
                borderColor: '#e6e6fa',
                backgroundColor: '#f0f0ff'
              }}
            />
          </Tooltip>
          <Tooltip title="分时图">
            <Button 
              size="small" 
              type="default"
              icon={<LineChartOutlined />}
              onClick={() => handleShowChart(record)}
              style={{ 
                color: '#20b2aa',
                borderColor: '#e0ffff',
                backgroundColor: '#f0ffff'
              }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button 
              size="small" 
              type="default"
              shape=""
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveFavoriteStock(record.stock_code)}
              style={{ 
                color: '#ff6b6b',
                borderColor: '#ffe4e4',
                backgroundColor: '#fff5f5'
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // 修改历史记录详情模态框的底部按钮
  const historyModalFooter = [
    <Button 
      key="continue" 
      type="primary" 
      icon={<SendOutlined />}
      onClick={handleContinueDialog}
    >
      继续对话
    </Button>,
    <Button key="close" onClick={() => setHistoryDetailVisible(false)}>
      关闭
    </Button>
  ];

  return (
    <div className="strategy-manage">
      <div className="strategy-manage-header">
        <Title level={2}>
          <StarOutlined style={{ color: '#faad14' }} /> AI助手
        </Title>
        <Paragraph type="secondary">
          管理您的自选股票，获取AI智能分析建议，制定投资策略
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {/* 自选股票管理 */}
        <Col span={16}>
          <Card 
            title={
              <Space>
                <HeartFilled style={{ color: '#ff4d4f' }} />
                <span>我的自选股票</span>
                <Badge count={favoriteStocks.length} style={{ backgroundColor: '#52c41a' }} />
              </Space>
            }
            extra={
              <Space>
                <Button 
                  type="default" 
                  icon={<PlusOutlined />}
                  onClick={() => setAddStockModalVisible(true)}
                />
                <Button 
                  type="default"
                  icon={<ReloadOutlined />}
                  onClick={loadFavoriteStocks}
                  loading={loading}
                />
              </Space>
            }
            className="favorite-stocks-card"
          >
            {favoriteStocks.length === 0 && !loading ? (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无自选股票，点击添加自选开始关注股票"
              />
            ) : (
              <Table
                columns={favoriteStockColumns}
                dataSource={favoriteStocks}
                loading={loading}
                rowKey="stock_code"
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ x: 1200 }}
              />
            )}
          </Card>
        </Col>

        {/* AI智能分析面板 */}
        <Col span={8}>
          <Card 
            title={
              <Space>
                <RobotOutlined style={{ color: '#1890ff' }} />
                <span>AI智能分析</span>
              </Space>
            }
            className="ai-analysis-card"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Alert
                message="AI投资分析助手"
                description="基于大数据模型为您提供专业的股票分析建议"
                type="info"
                showIcon
              />
              
              <div>
                <Text strong>选择股票（可选）：</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="选择要分析的股票"
                  allowClear
                  value={selectedStockForAI}
                  onChange={setSelectedStockForAI}
                >
                  {favoriteStocks.map(stock => (
                    <Option key={stock.stock_code} value={stock.stock_code}>
                      {stock.stock_name}({stock.stock_code})
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <Text strong>分析问题：</Text>
                <TextArea
                  style={{ marginTop: 8 }}
                  rows={4}
                  placeholder="请输入您想要分析的问题，例如：这只股票的技术指标如何？近期走势分析？投资建议？"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                />
              </div>

              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={aiLoading}
                onClick={handleAIAnalysis}
                style={{ width: '100%' }}
                size="large"
              >
                获取AI分析
              </Button>

              {/* 分析历史 */}
              {analysisHistory.length > 0 && (
                <div className={historyFullscreen ? "history-fullscreen" : ""}>
                  <Divider orientation="left">
                    <Space>
                      <Text strong>分析历史</Text>
                      <Text type="secondary">({historyTotal}条)</Text>
                      <Button 
                        type="link" 
                        icon={<ReloadOutlined />} 
                        onClick={handleRefreshHistory}
                        loading={historyLoading}
                        size="small"
                      >
                        刷新
                      </Button>
                      <Button 
                        type="link" 
                        icon={historyFullscreen ? <RollbackOutlined /> : <FullscreenOutlined />} 
                        onClick={() => setHistoryFullscreen(!historyFullscreen)}
                        size="small"
                      >
                        {historyFullscreen ? '返回' : '展开'}
                      </Button>
                    </Space>
                  </Divider>
                  
                  <div className="history-list-container">
                    <List
                      loading={historyLoading}
                      className="history-list"
                      size="small"
                      dataSource={analysisHistory}
                      renderItem={(item) => (
                        <List.Item 
                          className="history-item" 
                          onClick={() => handleHistoryItemClick(item)}
                          style={{ cursor: 'pointer' }}
                          hoverable="true"
                        >
                          <List.Item.Meta
                            avatar={<Avatar icon={<RobotOutlined />} />}
                            title={
                              <Space>
                                <Text ellipsis style={{ maxWidth: 200 }}>{item.question}</Text>
                                {item.stock && <Tag color="blue">{item.stock.stock_name}</Tag>}
                              </Space>
                            }
                            description={
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {item.timestamp} <span style={{ color: '#1890ff' }}>[点击查看]</span>
                              </Text>
                            }
                          />
                        </List.Item>
                      )}
                    />
                    
                    {historyMoreAvailable && (
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <Button 
                          onClick={loadMoreHistory} 
                          loading={historyLoading}
                          type="default"
                          size="small"
                          icon={<DownOutlined />}
                        >
                          加载更多
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 添加自选股票弹窗 */}
      <Modal
        title="添加自选股票"
        open={addStockModalVisible}
        onCancel={() => {
          setAddStockModalVisible(false);
          setSearchKeyword('');
        }}
        footer={null}
        width={500}
      >
        <Form layout="vertical">
          <Form.Item label="股票代码">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                style={{ width: '100%' }}
                value={searchKeyword}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="请输入6位股票代码（如：000001）"
                onPressEnter={handleDirectAddStock}
                maxLength={6}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleDirectAddStock}
                loading={searchLoading}
              >
                添加
              </Button>
            </Space.Compact>
          </Form.Item>

          <Alert
            message="使用提示"
            description="请输入准确的6位股票代码，例如：000001（平安银行）、600036（招商银行）"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* 示例股票 */}
          <div style={{ marginTop: 16 }}>
            <Text strong>热门股票示例：</Text>
            <div style={{ marginTop: 8 }}>
              <Space wrap>
                <Button size="small" onClick={() => { setSearchKeyword('000001'); }}>
                  000001 平安银行
                </Button>
                <Button size="small" onClick={() => { setSearchKeyword('600036'); }}>
                  600036 招商银行
                </Button>
                <Button size="small" onClick={() => { setSearchKeyword('000002'); }}>
                  000002 万科A
                </Button>
                <Button size="small" onClick={() => { setSearchKeyword('600519'); }}>
                  600519 贵州茅台
                </Button>
              </Space>
            </div>
          </div>
        </Form>
      </Modal>

      {/* AI分析结果弹窗 */}
      <Modal
        title="AI分析结果"
        open={aiAnalysisVisible}
        onCancel={() => {
          setAiAnalysisVisible(false);
          setAiResponse('');
          setUserMessage('');
          setSelectedStockForAI(null);
        }}
        footer={[
          <Button key="close" onClick={() => setAiAnalysisVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {selectedStockForAI && (
            <Alert
              message={`正在分析：${favoriteStocks.find(s => s.stock_code === selectedStockForAI)?.stock_name}(${selectedStockForAI})`}
              type="info"
            />
          )}
          
          <div>
            <Text strong>分析问题：</Text>
            <TextArea
              rows={3}
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="请输入您的分析问题..."
              style={{ marginTop: 8 }}
            />
          </div>

          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={aiLoading}
            onClick={handleAIAnalysis}
          >
            获取分析
          </Button>

          {aiResponse && (
            <div>
              <Divider orientation="left">
                <Text strong>AI分析结果</Text>
              </Divider>
              <div className="history-detail-answer">
                <Text>{aiResponse}</Text>
              </div>
            </div>
          )}
          
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <Text type="secondary">生成时间: {new Date().toLocaleString()}</Text>
          </div>
        </Space>
      </Modal>

      {/* 历史记录详情弹窗 */}
      <Modal
        title="历史分析详情"
        open={historyDetailVisible}
        onCancel={() => setHistoryDetailVisible(false)}
        footer={historyModalFooter}
        width={800}
      >
        {selectedHistory && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {selectedHistory.stock && (
              <Alert
                message={`分析股票：${selectedHistory.stock.stock_name}(${selectedHistory.stock.stock_code})`}
                type="info"
              />
            )}
            
            <div>
              <Text strong>分析问题：</Text>
              <div className="history-detail-question">
                <Text>{selectedHistory.question}</Text>
              </div>
            </div>

            <div>
              <Divider orientation="left">
                <Text strong>AI分析结果</Text>
              </Divider>
              <div className="history-detail-answer">
                <Text>{selectedHistory.answer}</Text>
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary">分析时间: {selectedHistory.timestamp}</Text>
            </div>
          </Space>
        )}
      </Modal>

      {/* 分时图表弹窗 */}
      <Modal
        title={
          selectedStock ? 
          `${selectedStock.stock_name}(${selectedStock.stock_code}) - 分时图` : 
          '分时图'
        }
        open={chartVisible}
        onCancel={() => {
          setChartVisible(false);
          setChartData(null);
          setSelectedStock(null);
        }}
        footer={[
          <Button 
            key="refresh" 
            icon={<ReloadOutlined />}
            onClick={() => selectedStock && handleShowChart(selectedStock)}
            loading={chartLoading}
          >
            刷新
          </Button>,
          <Button key="close" onClick={() => setChartVisible(false)}>
            关闭
          </Button>
        ]}
        width={1200}
      >
        <div style={{ height: 500 }}>
          {chartLoading ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text>正在加载分时数据...</Text>
              </div>
            </div>
          ) : chartData ? (
            <IntradayChart data={chartData} />
          ) : (
            <Empty description="暂无分时数据" />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default StrategyManage;