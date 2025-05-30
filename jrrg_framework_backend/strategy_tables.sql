-- 创建自选股票表
CREATE TABLE IF NOT EXISTS favorite_stocks (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    user_id INT NOT NULL COMMENT '用户ID',
    stock_code VARCHAR(10) NOT NULL COMMENT '股票代码',
    stock_name VARCHAR(50) NOT NULL COMMENT '股票名称',
    note TEXT COMMENT '用户备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 创建唯一索引，同一用户不能重复添加同一股票
    UNIQUE KEY unique_user_stock (user_id, stock_code),
    
    -- 创建索引提高查询性能
    INDEX idx_user_id (user_id),
    INDEX idx_stock_code (stock_code),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户自选股票表';

-- 创建AI分析历史表
CREATE TABLE IF NOT EXISTS analysis_history (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    user_id INT NOT NULL COMMENT '用户ID',
    question TEXT NOT NULL COMMENT '用户提问',
    answer TEXT NOT NULL COMMENT 'AI回答',
    stock_code VARCHAR(10) COMMENT '相关股票代码',
    stock_name VARCHAR(50) COMMENT '相关股票名称',
    model_name VARCHAR(50) COMMENT '使用的AI模型名称',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    -- 创建索引提高查询性能
    INDEX idx_user_id (user_id),
    INDEX idx_stock_code (stock_code),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI分析历史表';

-- 插入一些示例数据（可选）
-- INSERT INTO favorite_stocks (user_id, stock_code, stock_name, note) VALUES
-- (1, '000001', '平安银行', '金融股龙头，关注业绩表现'),
-- (1, '600036', '招商银行', '优质银行股，长期持有'),
-- (1, '000002', '万科A', '房地产龙头，关注政策影响'); 