# 策略管理功能设置与使用说明

## 功能概述

本项目为股票信息查询与分析系统新增了策略管理功能，主要包括：

1. **自选股票管理** - 用户可以添加、删除、查看自选股票列表
2. **AI智能分析** - 集成外部大模型服务，为用户提供专业的股票投资分析

## 新增功能特点

### 🌟 自选股票功能
- ✅ 添加/删除自选股票
- ✅ 实时股价显示
- ✅ 涨跌幅提醒
- ✅ 成交量统计
- ✅ 个人备注管理
- ✅ 搜索股票自动完成

### 🤖 AI智能分析
- ✅ 集成GPT-4o-mini模型
- ✅ 针对特定股票的分析
- ✅ 通用投资策略咨询
- ✅ 分析历史记录
- ✅ 专业投资建议

## 技术实现

### 前端技术栈
- **React 18** - 组件化开发
- **Ant Design** - 现代化UI组件
- **CSS3** - 美观的渐变样式和动画效果
- **响应式设计** - 适配多种屏幕尺寸

### 后端技术栈
- **Flask** - RESTful API服务
- **SQLAlchemy** - 数据库ORM
- **MySQL** - 数据持久化
- **Requests** - HTTP客户端
- **JWT** - 用户认证

### AI服务集成
- **服务地址**: http://114.212.96.222:8080/
- **API Key**: jrrglwldgroup
- **模型**: GPT-4o-mini
- **接口标准**: OpenAI Compatible API

## 安装与配置

### 1. 数据库配置

执行SQL脚本创建新表：

```bash
# 在MySQL中执行
mysql -u root -p jrrg_framework_db < strategy_tables.sql
```

或手动执行SQL语句：
```sql
-- 自选股票表
CREATE TABLE IF NOT EXISTS favorite_stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    stock_code VARCHAR(10) NOT NULL,
    stock_name VARCHAR(50) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_stock (user_id, stock_code)
);

-- AI分析历史表
CREATE TABLE IF NOT EXISTS analysis_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    stock_code VARCHAR(10),
    stock_name VARCHAR(50),
    model_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. 后端依赖安装

```bash
cd jrrg_framework_backend
pip install -r requirements.txt
```

### 3. 前端依赖安装

```bash
cd jrrg_framework_frontend
npm install
```

### 4. 启动服务

后端服务：
```bash
cd jrrg_framework_backend
python run.py
```

前端服务：
```bash
cd jrrg_framework_frontend
npm start
```

## API接口文档

### 自选股票管理

#### 获取自选股票列表
```http
GET /api/strategy/favorites
Authorization: Bearer <JWT_TOKEN>
```

#### 添加自选股票
```http
POST /api/strategy/favorites
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
    "stock_code": "000001",
    "stock_name": "平安银行",
    "note": "银行股龙头"
}
```

#### 删除自选股票
```http
DELETE /api/strategy/favorites/{stock_code}
Authorization: Bearer <JWT_TOKEN>
```

### AI分析功能

#### 获取AI分析
```http
POST /api/strategy/ai-analysis
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
    "prompt": "请分析一下银行股的投资前景",
    "stock_code": "000001"  // 可选
}
```

#### 获取分析历史
```http
GET /api/strategy/analysis-history?limit=10
Authorization: Bearer <JWT_TOKEN>
```

## 使用指南

### 访问策略管理页面

1. 登录系统后，在左侧导航栏点击"交易策略" → "策略管理"
2. 页面地址：`/strategy/manage`

### 管理自选股票

1. **添加股票**：
   - 点击"添加自选"按钮
   - 在搜索框中输入股票代码或名称
   - 从搜索结果中选择要添加的股票
   - 点击"添加"按钮

2. **查看股票信息**：
   - 自选股票列表显示实时价格、涨跌幅、成交量等信息
   - 支持表格排序和分页

3. **删除股票**：
   - 在操作列点击"删除"按钮

### 使用AI分析

1. **选择分析股票**（可选）：
   - 在右侧AI分析面板中选择要分析的股票
   - 或直接在股票列表中点击"AI分析"按钮

2. **输入分析问题**：
   - 在文本框中输入您的问题
   - 例如："这只股票的技术指标如何？"
   - 例如："近期大盘走势分析"

3. **获取分析结果**：
   - 点击"获取AI分析"按钮
   - 等待AI生成专业分析报告
   - 查看分析历史记录

## 界面展示

### 主界面特点
- 🎨 **现代化设计** - 渐变色彩搭配，视觉效果佳
- 📱 **响应式布局** - 适配桌面端和移动端
- ⚡ **流畅交互** - 悬停动效，按钮阴影
- 📊 **数据可视化** - 涨跌用颜色区分，数据一目了然

### 功能亮点
- 🔄 **实时刷新** - 股票数据自动更新
- 🔍 **智能搜索** - 股票搜索自动补全
- 📝 **历史记录** - AI分析历史可追溯
- 🏷️ **个性标签** - 支持自定义备注

## 故障排除

### 常见问题

1. **AI分析失败**
   - 检查网络连接
   - 确认AI服务地址可访问
   - 查看后端日志错误信息

2. **自选股票数据不显示**
   - 确认股票代码格式正确
   - 检查AKShare数据源是否正常
   - 查看数据库连接状态

3. **页面样式异常**
   - 清除浏览器缓存
   - 确认CSS文件加载正常
   - 检查Ant Design版本兼容性

### 日志查看

后端日志：
```bash
# 查看Flask应用日志
tail -f logs/app.log
```

前端开发：
```bash
# 浏览器控制台查看JavaScript错误
F12 → Console
```

## 扩展功能建议

### 未来可以添加的功能
1. **策略回测** - 基于历史数据测试投资策略
2. **预警系统** - 股价达到设定值时推送通知
3. **投资组合** - 管理多个股票组合
4. **社交功能** - 分享分析结果和投资心得
5. **更多AI模型** - 集成更多AI分析服务

## 联系支持

如遇到技术问题，请：
1. 查看项目README文档
2. 检查控制台错误日志
3. 联系开发团队：NJU-jrrg-lwld小组

---

**注意**：本系统仅供学习和研究使用，投资有风险，决策需谨慎。AI分析结果仅供参考，不构成投资建议。 