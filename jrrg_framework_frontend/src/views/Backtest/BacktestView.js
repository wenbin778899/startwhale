import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  message,
  Spin,
  Empty,
  Result,
  Button,
  Row,
  Col
} from 'antd';
import { ExperimentOutlined, HistoryOutlined } from '@ant-design/icons';
import BacktestForm from './components/BacktestForm';
import BacktestHistory from './components/BacktestHistory';
import BacktestResult from './components/BacktestResult';
import { getFavoriteStocks } from '../../api/strategy';
import './BacktestView.css';

const { TabPane } = Tabs;

const BacktestView = () => {
  const [loading, setLoading] = useState(false);
  const [favoriteStocks, setFavoriteStocks] = useState([]);
  const [currentBacktestResult, setCurrentBacktestResult] = useState(null);
  const [showBacktestResult, setShowBacktestResult] = useState(false);

  // 加载自选股票列表
  useEffect(() => {
    loadFavoriteStocks();
  }, []);

  // 加载自选股票
  const loadFavoriteStocks = async () => {
    try {
      setLoading(true);
      const response = await getFavoriteStocks();
      if (response && response.data) {
        setFavoriteStocks(response.data);
      }
    } catch (error) {
      console.error('加载自选股票失败:', error);
      message.error('加载自选股票失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理回测结果
  const handleBacktestComplete = (result) => {
    setCurrentBacktestResult(result);
    setShowBacktestResult(true);
  };

  // 处理回测历史记录查看
  const handleViewHistoryDetail = (backtestId) => {
    setCurrentBacktestResult({ id: backtestId, loadFromHistory: true });
    setShowBacktestResult(true);
  };

  // 返回回测表单
  const handleBackToForm = () => {
    setShowBacktestResult(false);
  };

  return (
    <div className="backtest-container">
      <div className="backtest-header-section">
        <h2 className="backtest-main-title">
          <ExperimentOutlined style={{ marginRight: '8px' }} />
          策略回测系统
        </h2>
      </div>
      
      <Spin spinning={loading}>
        {favoriteStocks.length === 0 ? (
          <Result
            status="warning"
            title="暂无自选股票"
            subTitle="请先在策略管理页面添加自选股票，再进行回测分析"
            extra={
              <Button type="primary" href="/strategy">
                去添加自选股票
              </Button>
            }
          />
        ) : showBacktestResult ? (
          <Card className="backtest-result-card">
            <BacktestResult
              backtestResult={currentBacktestResult}
              onBack={handleBackToForm}
            />
          </Card>
        ) : (
          <Row gutter={[16, 16]} className="backtest-main-content">
            <Col xs={24} lg={12} className="backtest-form-column">
              <Card
                title={
                  <div className="section-title">
                    <ExperimentOutlined style={{ marginRight: '8px' }} />
                    回测设置
                  </div>
                }
                className="backtest-section-card"
                size="small"
              >
                <div className="form-scroll-container">
                  <BacktestForm
                    favoriteStocks={favoriteStocks}
                    onBacktestComplete={handleBacktestComplete}
                  />
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={12} className="backtest-history-column">
              <Card
                title={
                  <div className="section-title">
                    <HistoryOutlined style={{ marginRight: '8px' }} />
                    回测历史
                  </div>
                }
                className="backtest-section-card"
                size="small"
              >
                <div className="history-scroll-container">
                  <BacktestHistory
                    onViewDetail={handleViewHistoryDetail}
                    onDelete={() => loadFavoriteStocks()}
                  />
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default BacktestView; 