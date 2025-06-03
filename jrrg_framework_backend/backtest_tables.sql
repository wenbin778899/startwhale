-- 创建回测记录表
CREATE TABLE IF NOT EXISTS backtest_records (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    user_id INT NOT NULL COMMENT '用户ID',
    strategy_name VARCHAR(100) NOT NULL COMMENT '策略名称',
    stock_code VARCHAR(10) NOT NULL COMMENT '股票代码',
    stock_name VARCHAR(50) NOT NULL COMMENT '股票名称',
    start_date DATE NOT NULL COMMENT '回测开始日期',
    end_date DATE NOT NULL COMMENT '回测结束日期',
    initial_cash DECIMAL(12, 2) NOT NULL COMMENT '初始资金',
    final_value DECIMAL(12, 2) NOT NULL COMMENT '最终价值',
    total_return DECIMAL(10, 4) NOT NULL COMMENT '总收益率',
    annual_return DECIMAL(10, 4) COMMENT '年化收益率',
    max_drawdown DECIMAL(10, 4) COMMENT '最大回撤',
    sharpe_ratio DECIMAL(10, 4) COMMENT '夏普比率',
    trade_count INT COMMENT '交易次数',
    win_rate DECIMAL(10, 4) COMMENT '胜率',
    strategy_params TEXT COMMENT '策略参数(JSON格式)',
    result_data MEDIUMTEXT COMMENT '回测结果数据(JSON格式)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    -- 创建索引提高查询性能
    INDEX idx_user_id (user_id),
    INDEX idx_stock_code (stock_code),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回测记录表';

-- 创建回测交易详情表
CREATE TABLE IF NOT EXISTS backtest_trades (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    backtest_id INT NOT NULL COMMENT '关联的回测记录ID',
    trade_type ENUM('BUY', 'SELL') NOT NULL COMMENT '交易类型',
    trade_date DATE NOT NULL COMMENT '交易日期',
    price DECIMAL(12, 4) NOT NULL COMMENT '交易价格',
    size INT NOT NULL COMMENT '交易数量',
    commission DECIMAL(12, 4) NOT NULL COMMENT '手续费',
    pnl DECIMAL(12, 4) COMMENT '收益(仅对SELL有效)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    -- 外键约束
    FOREIGN KEY (backtest_id) REFERENCES backtest_records(id) ON DELETE CASCADE,
    
    -- 创建索引提高查询性能
    INDEX idx_backtest_id (backtest_id),
    INDEX idx_trade_date (trade_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回测交易明细表'; 