-- 自选基金表
CREATE TABLE IF NOT EXISTS favorite_funds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    fund_code VARCHAR(10) NOT NULL,
    fund_name VARCHAR(50) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_fund (user_id, fund_code),
    INDEX idx_user_id (user_id),
    INDEX idx_fund_code (fund_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户自选基金表';

-- 基金AI分析历史表
CREATE TABLE IF NOT EXISTS fund_analysis_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    fund_code VARCHAR(10),
    fund_name VARCHAR(50),
    model_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_fund_code (fund_code),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='基金AI分析历史表';

-- 创建持仓基金明细表
CREATE TABLE IF NOT EXISTS portfolio_fund (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '持仓基金ID',
    portfolio_id INT NOT NULL COMMENT '持仓组合ID',
    fund_code VARCHAR(10) NOT NULL COMMENT '基金代码',
    fund_name VARCHAR(100) NOT NULL COMMENT '基金名称',
    fund_type VARCHAR(20) NOT NULL COMMENT '基金类型(stock/bond/mixed/index/money/qdii/etf/lof)',
    total_shares DECIMAL(14,4) NOT NULL COMMENT '持有份额',
    avg_cost_nav DECIMAL(10,6) NOT NULL COMMENT '平均成本净值',
    current_nav DECIMAL(10,6) DEFAULT 0 COMMENT '当前净值',
    position_value DECIMAL(14,2) DEFAULT 0 COMMENT '持仓市值',
    profit_loss DECIMAL(14,2) DEFAULT 0 COMMENT '盈亏金额',
    profit_loss_rate DECIMAL(8,4) DEFAULT 0 COMMENT '盈亏率',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_fund_code (fund_code),
    UNIQUE KEY unique_portfolio_fund (portfolio_id, fund_code),
    FOREIGN KEY (portfolio_id) REFERENCES user_portfolio(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='持仓基金明细表';

-- 创建基金净值历史数据表(用于缓存基金净值数据)
CREATE TABLE IF NOT EXISTS fund_nav_history (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    fund_code VARCHAR(10) NOT NULL COMMENT '基金代码',
    nav_date DATE NOT NULL COMMENT '净值日期',
    unit_nav DECIMAL(10,6) NOT NULL COMMENT '单位净值',
    cumulative_nav DECIMAL(10,6) NOT NULL COMMENT '累计净值',
    daily_growth_rate DECIMAL(8,4) DEFAULT NULL COMMENT '日增长率(%)',
    purchase_status VARCHAR(20) DEFAULT NULL COMMENT '申购状态',
    redeem_status VARCHAR(20) DEFAULT NULL COMMENT '赎回状态',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_fund_code (fund_code),
    INDEX idx_nav_date (nav_date),
    UNIQUE KEY unique_fund_nav_date (fund_code, nav_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='基金净值历史数据表';

-- 创建基金交易记录表
CREATE TABLE IF NOT EXISTS fund_trade_record (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '交易记录ID',
    portfolio_id INT NOT NULL COMMENT '持仓组合ID',
    fund_code VARCHAR(10) NOT NULL COMMENT '基金代码',
    fund_name VARCHAR(100) NOT NULL COMMENT '基金名称',
    trade_type ENUM('buy', 'sell') NOT NULL COMMENT '交易类型: buy申购, sell赎回',
    trade_nav DECIMAL(10,6) NOT NULL COMMENT '交易净值',
    trade_shares DECIMAL(14,4) NOT NULL COMMENT '交易份额',
    trade_amount DECIMAL(14,2) NOT NULL COMMENT '交易金额',
    trade_fee DECIMAL(10,2) DEFAULT 0 COMMENT '交易费用',
    trade_note VARCHAR(500) DEFAULT NULL COMMENT '交易备注',
    trade_date DATE NOT NULL COMMENT '交易日期',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_fund_code (fund_code),
    INDEX idx_trade_date (trade_date),
    FOREIGN KEY (portfolio_id) REFERENCES user_portfolio(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='基金交易记录表';
