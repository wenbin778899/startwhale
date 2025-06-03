import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  message,
  Spin,
  Empty,
  Result,
  Button
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
  const [activeTab, setActiveTab] = useState('form');
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
    setActiveTab('result');
  };

  // 处理回测历史记录查看
  const handleViewHistoryDetail = (backtestId) => {
    // 这里会设置当前的回测记录，并切换到结果页面
    setCurrentBacktestResult({ id: backtestId, loadFromHistory: true });
    setShowBacktestResult(true);
    setActiveTab('result');
  };

  // 返回回测表单
  const handleBackToForm = () => {
    setShowBacktestResult(false);
    setActiveTab('form');
  };

  // 切换标签页
  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'form') {
      setShowBacktestResult(false);
    }
  };

  return (
    <div className="backtest-container">
      <Card
        title={
          <div className="backtest-header">
            <ExperimentOutlined style={{ marginRight: '8px' }} />
            策略回测
          </div>
        }
        className="backtest-card"
      >
        <Spin spinning={loading}>
          {favoriteStocks.length === 0 ? (
            <Result
              status="warning"
              title="暂无自选股票"
              subTitle="请先在策略管理页面添加自选股票，再进行回测分析"
              extra={
                <Button
                  type="primary"
                  href="/strategy"
                >
                  去添加自选股票
                </Button>
              }
            />
          ) : (
            <Tabs activeKey={activeTab} onChange={handleTabChange}>
              <TabPane
                tab={
                  <span>
                    <ExperimentOutlined />
                    回测设置
                  </span>
                }
                key="form"
              >
                {!showBacktestResult && (
                  <BacktestForm
                    favoriteStocks={favoriteStocks}
                    onBacktestComplete={handleBacktestComplete}
                  />
                )}
              </TabPane>
              
              <TabPane
                tab={
                  <span>
                    <HistoryOutlined />
                    回测历史
                  </span>
                }
                key="history"
              >
                <BacktestHistory
                  onViewDetail={handleViewHistoryDetail}
                  onDelete={() => loadFavoriteStocks()}
                />
              </TabPane>
              
              {showBacktestResult && (
                <TabPane
                  tab={
                    <span>
                      <ExperimentOutlined />
                      回测结果
                    </span>
                  }
                  key="result"
                >
                  <BacktestResult
                    backtestResult={currentBacktestResult}
                    onBack={handleBackToForm}
                  />
                </TabPane>
              )}
            </Tabs>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default BacktestView; 