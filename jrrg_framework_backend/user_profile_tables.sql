-- 创建问卷表
CREATE TABLE IF NOT EXISTS user_questionnaire (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '问卷ID',
    user_id INT NOT NULL COMMENT '用户ID',
    risk_tolerance INT NOT NULL COMMENT '风险承受能力(1-5)',
    investment_horizon VARCHAR(20) NOT NULL COMMENT '投资期限(短期/中期/长期)',
    investment_style VARCHAR(20) NOT NULL COMMENT '投资风格(价值/成长/混合)',
    income_requirement VARCHAR(20) NOT NULL COMMENT '收入需求(低/中/高)',
    liquidity_need VARCHAR(20) NOT NULL COMMENT '流动性需求(低/中/高)',
    avg_investment_amount DECIMAL(12,2) COMMENT '平均投资金额',
    market_experience INT COMMENT '股市经验年数',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
    
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户问卷表';

-- 创建行业偏好表
CREATE TABLE IF NOT EXISTS user_industry_preference (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    user_id INT NOT NULL COMMENT '用户ID',
    industry_name VARCHAR(50) NOT NULL COMMENT '行业名称',
    preference_level INT NOT NULL COMMENT '偏好程度(1-5)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    INDEX idx_user_id (user_id),
    UNIQUE KEY unique_user_industry (user_id, industry_name),
    FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户行业偏好表';

-- 创建交易习惯表
CREATE TABLE IF NOT EXISTS user_trading_habit (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    user_id INT NOT NULL COMMENT '用户ID',
    avg_holding_period INT COMMENT '平均持股周期(天)',
    preferred_trading_time VARCHAR(20) COMMENT '偏好交易时段',
    stop_loss_percentage DECIMAL(5,2) COMMENT '止损设置百分比',
    profit_taking_percentage DECIMAL(5,2) COMMENT '止盈设置百分比',
    technical_analysis_reliance INT COMMENT '技术分析依赖度(1-5)',
    fundamental_analysis_reliance INT COMMENT '基本面分析依赖度(1-5)',
    news_sensitivity INT COMMENT '新闻敏感度(1-5)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户交易习惯表'; 