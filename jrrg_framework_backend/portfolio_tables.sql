-- 创建用户持仓表
CREATE TABLE IF NOT EXISTS user_portfolio (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '持仓ID',
    user_id INT NOT NULL COMMENT '用户ID',
    portfolio_name VARCHAR(100) NOT NULL COMMENT '持仓组合名称',
    description VARCHAR(500) COMMENT '持仓组合描述',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    total_investment DECIMAL(14,2) DEFAULT 0 COMMENT '总投资金额',
    current_value DECIMAL(14,2) DEFAULT 0 COMMENT '当前市值',
    profit_loss DECIMAL(14,2) DEFAULT 0 COMMENT '盈亏金额',
    profit_loss_rate DECIMAL(8,4) DEFAULT 0 COMMENT '盈亏率',
    
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户持仓组合表';

-- 创建持仓股票明细表
CREATE TABLE IF NOT EXISTS portfolio_stock (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '持仓股票ID',
    portfolio_id INT NOT NULL COMMENT '持仓组合ID',
    stock_code VARCHAR(10) NOT NULL COMMENT '股票代码',
    stock_name VARCHAR(100) NOT NULL COMMENT '股票名称',
    total_shares DECIMAL(14,2) NOT NULL COMMENT '持有股数',
    avg_cost_price DECIMAL(10,4) NOT NULL COMMENT '平均成本价',
    current_price DECIMAL(10,4) DEFAULT 0 COMMENT '当前价格',
    position_value DECIMAL(14,2) DEFAULT 0 COMMENT '持仓市值',
    profit_loss DECIMAL(14,2) DEFAULT 0 COMMENT '盈亏金额',
    profit_loss_rate DECIMAL(8,4) DEFAULT 0 COMMENT '盈亏率',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_stock_code (stock_code),
    UNIQUE KEY unique_portfolio_stock (portfolio_id, stock_code),
    FOREIGN KEY (portfolio_id) REFERENCES user_portfolio(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='持仓股票明细表';

-- 创建交易记录表
CREATE TABLE IF NOT EXISTS trade_record (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '交易记录ID',
    portfolio_id INT NOT NULL COMMENT '持仓组合ID',
    stock_code VARCHAR(10) NOT NULL COMMENT '股票代码',
    stock_name VARCHAR(100) NOT NULL COMMENT '股票名称',
    trade_type ENUM('buy', 'sell') NOT NULL COMMENT '交易类型：买入/卖出',
    trade_price DECIMAL(10,4) NOT NULL COMMENT '交易价格',
    trade_shares DECIMAL(14,2) NOT NULL COMMENT '交易股数',
    trade_amount DECIMAL(14,2) NOT NULL COMMENT '交易金额',
    trade_fee DECIMAL(10,2) DEFAULT 0 COMMENT '交易费用',
    trade_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '交易时间',
    trade_note VARCHAR(500) COMMENT '交易备注',
    
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_stock_code (stock_code),
    INDEX idx_trade_time (trade_time),
    FOREIGN KEY (portfolio_id) REFERENCES user_portfolio(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易记录表';

-- 创建持仓统计表
CREATE TABLE IF NOT EXISTS portfolio_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '统计ID',
    portfolio_id INT NOT NULL COMMENT '持仓组合ID',
    statistics_date DATE NOT NULL COMMENT '统计日期',
    total_value DECIMAL(14,2) NOT NULL COMMENT '总市值',
    daily_profit_loss DECIMAL(14,2) DEFAULT 0 COMMENT '日盈亏',
    daily_profit_loss_rate DECIMAL(8,4) DEFAULT 0 COMMENT '日盈亏率',
    total_profit_loss DECIMAL(14,2) DEFAULT 0 COMMENT '总盈亏',
    total_profit_loss_rate DECIMAL(8,4) DEFAULT 0 COMMENT '总盈亏率',
    
    INDEX idx_portfolio_id (portfolio_id),
    INDEX idx_statistics_date (statistics_date),
    UNIQUE KEY unique_portfolio_date (portfolio_id, statistics_date),
    FOREIGN KEY (portfolio_id) REFERENCES user_portfolio(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='持仓统计表';

-- 创建关注组合表（用于存储关注的组合）
CREATE TABLE IF NOT EXISTS favorite_portfolio (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    user_id INT NOT NULL COMMENT '用户ID',
    target_portfolio_id INT NOT NULL COMMENT '关注的组合ID',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
    
    INDEX idx_user_id (user_id),
    UNIQUE KEY unique_user_portfolio (user_id, target_portfolio_id),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (target_portfolio_id) REFERENCES user_portfolio(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关注组合表';

-- 示例数据
INSERT INTO user_portfolio (user_id, portfolio_name, description, total_investment, current_value, profit_loss, profit_loss_rate)
VALUES 
(1, '主要投资组合', '我的主要A股投资组合，以蓝筹股为主', 100000.00, 108500.00, 8500.00, 0.085),
(1, '科技股组合', '主要投资科技相关股票', 50000.00, 58200.00, 8200.00, 0.164);

-- 示例持仓数据
INSERT INTO portfolio_stock (portfolio_id, stock_code, stock_name, total_shares, avg_cost_price, current_price, position_value, profit_loss, profit_loss_rate)
VALUES 
(1, '601318', '中国平安', 1000, 40.50, 43.20, 43200.00, 2700.00, 0.0667),
(1, '600519', '贵州茅台', 50, 1800.00, 1850.00, 92500.00, 2500.00, 0.0139),
(1, '000001', '平安银行', 3000, 18.20, 17.80, 53400.00, -1200.00, -0.0220),
(2, '000625', '长安汽车', 2000, 12.80, 13.50, 27000.00, 1400.00, 0.0547),
(2, '002415', '海康威视', 1500, 30.40, 32.20, 48300.00, 2700.00, 0.0592),
(2, '300059', '东方财富', 2000, 18.60, 19.35, 38700.00, 1500.00, 0.0403);

-- 示例交易记录
INSERT INTO trade_record (portfolio_id, stock_code, stock_name, trade_type, trade_price, trade_shares, trade_amount, trade_fee, trade_time)
VALUES 
(1, '601318', '中国平安', 'buy', 40.50, 1000, 40500.00, 40.50, '2023-07-15 10:30:00'),
(1, '600519', '贵州茅台', 'buy', 1800.00, 50, 90000.00, 90.00, '2023-08-12 14:20:00'),
(1, '000001', '平安银行', 'buy', 18.20, 3000, 54600.00, 54.60, '2023-09-05 09:45:00'),
(2, '000625', '长安汽车', 'buy', 12.80, 2000, 25600.00, 25.60, '2023-06-20 11:15:00'),
(2, '002415', '海康威视', 'buy', 30.40, 1500, 45600.00, 45.60, '2023-07-08 13:40:00'),
(2, '300059', '东方财富', 'buy', 18.60, 2000, 37200.00, 37.20, '2023-08-23 10:05:00'),
(1, '600519', '贵州茅台', 'sell', 1820.00, 10, 18200.00, 18.20, '2023-10-18 14:30:00');

-- 示例持仓统计数据
INSERT INTO portfolio_statistics (portfolio_id, statistics_date, total_value, daily_profit_loss, daily_profit_loss_rate, total_profit_loss, total_profit_loss_rate)
VALUES 
(1, '2023-11-01', 187200.00, 1500.00, 0.0081, 7500.00, 0.0418),
(1, '2023-11-02', 189100.00, 1900.00, 0.0101, 9400.00, 0.0523),
(1, '2023-11-03', 188500.00, -600.00, -0.0032, 8800.00, 0.0489),
(2, '2023-11-01', 112000.00, 800.00, 0.0072, 3600.00, 0.0332),
(2, '2023-11-02', 113500.00, 1500.00, 0.0134, 5100.00, 0.0470),
(2, '2023-11-03', 114000.00, 500.00, 0.0044, 5600.00, 0.0516); 