# 股票信息查询与分析系统

## 项目概述

本项目是一个基于Web的股票信息查询与分析系统，提供股票行情查询、K线图表展示、基本面分析、相关新闻获取等功能。系统采用前后端分离架构，前端使用React构建用户界面，后端使用Flask提供API服务，数据来源于AKShare金融数据接口。

## 功能特点

### 用户管理
- 用户注册与登录
- 个人信息管理
- 安全认证与授权

### 股票查询
- 股票代码和名称搜索（支持模糊搜索）
- 自动完成建议功能
- 多维度股票信息展示

### 行情分析
- K线图表展示（支持多种时间范围）
- 成交量分析图表
- 涨跌幅趋势图表
- 历史数据表格展示

### 基本面分析
- 股票基本信息展示
- 行业信息分析
- 资金流向数据
- 相关股票推荐（通过点击股票代码直接查询）

### 新闻资讯
- 股票相关新闻获取
- 新闻数量自定义
- 新闻来源与发布时间展示
- 原文链接快速访问

## 技术栈

### 前端
- React.js：用户界面构建
- Ant Design：UI组件库
- ECharts：数据可视化图表
- Axios：HTTP请求处理
- React Router：前端路由管理

### 后端
- Flask：Web应用框架
- SQLAlchemy：ORM数据库操作
- JWT：用户认证
- AKShare：金融数据接口
- Pandas：数据处理

### 数据库
- SQLite/MySQL：用户数据存储

## 系统架构

```
├── jrrg_framework_frontend     # 前端代码
│   ├── public                  # 静态资源
│   └── src                     # 源代码
│       ├── api                 # API接口
│       ├── assets              # 静态资源
│       ├── components          # 公共组件
│       ├── utils               # 工具函数
│       └── views               # 页面组件
│           ├── Login           # 登录页面
│           ├── Register        # 注册页面
│           ├── Index           # 主页
│           ├── Stock           # 股票查询页面
│           └── UserProfile     # 用户信息页面
│
└── jrrg_framework_backend      # 后端代码
    ├── app                     # 应用代码
    │   ├── config              # 配置文件
    │   ├── controllers         # 控制器
    │   ├── models              # 数据模型
    │   └── utils               # 工具函数
    └── instance                # 实例配置
```

## 安装与使用

### 环境要求
- Node.js 14+
- Python 3.8+
- pip 20+

### 前端安装
```bash
# 进入前端目录
cd jrrg_framework_frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

### 后端安装
```bash
# 进入后端目录
cd jrrg_framework_backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 初始化数据库
flask init-db

# 启动服务器
flask run
```

## 使用说明

### 股票查询
1. 在搜索框中输入股票代码或名称
2. 从下拉建议中选择或点击搜索按钮
3. 查看股票详细信息
4. 选择不同的时间范围查看历史数据

### 图表分析
1. 在股票详情页中，切换不同的选项卡查看不同类型的图表
2. K线图展示股票价格走势
3. 成交量图表展示交易活跃度
4. 涨跌幅图表展示价格变化百分比

### 基本面分析
1. 在"基本资料"选项卡中查看股票的基本信息
2. 查看行业信息和资金流向
3. 点击相关股票代码可直接查询该股票

### 新闻资讯
1. 在"相关新闻"选项卡中查看与股票相关的新闻
2. 调整新闻数量限制以获取更多或更少的新闻
3. 点击"阅读原文"查看完整新闻内容

## 贡献者

- NJU-jrrg-lwld小组

## 许可证

本项目采用 MIT 许可证

## Deepseek API直连配置

本项目支持前端直接调用Deepseek API进行智能分析，省去后端中转，提高响应速度。

### 配置步骤

1. 在项目根目录创建`.env`文件（或复制`.env.example`并重命名）
2. 填入您的Deepseek API密钥:
```
REACT_APP_DEEPSEEK_API_KEY=your_actual_deepseek_api_key_here
```
3. 重启前端服务以加载环境变量

### 注意事项

- 前端直连方式会将API密钥暴露在前端代码中，仅建议在开发环境或内部应用中使用
- 生产环境建议使用更安全的认证方式，如API网关代理或后端中转服务
- 系统会自动将分析结果保存到后端数据库，确保历史记录不会丢失
