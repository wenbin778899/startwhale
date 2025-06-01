# 股票信息查询与分析系统安装指南

本文档提供了股票信息查询与分析系统的详细安装步骤，包括环境准备、依赖安装、配置说明等。

## 系统要求

### 硬件要求
- CPU: 双核处理器或更高
- 内存: 4GB RAM 或更多
- 硬盘空间: 至少 1GB 可用空间

### 软件要求
- 操作系统: Windows 10/11, macOS 10.15+, 或 Linux (Ubuntu 20.04+)
- Node.js: 14.0.0 或更高版本
- Python: 3.8 或更高版本
- npm: 6.0.0 或更高版本
- pip: 20.0.0 或更高版本

## 前端安装

### 步骤 1: 克隆代码库
```bash
git clone [仓库地址]
cd [项目目录]
```

### 步骤 2: 安装前端依赖
```bash
cd jrrg_framework_frontend
npm install
```

主要依赖项包括：
- react: ^17.0.2
- react-dom: ^17.0.2
- react-router-dom: ^6.0.0
- antd: ^4.16.13
- axios: ^0.24.0
- echarts: ^5.2.2
- echarts-for-react: ^3.0.2
- moment: ^2.30.1
- decimal.js: ^10.5.0

### 步骤 3: 配置前端环境变量
创建 `.env` 文件在前端项目根目录下：
```
REACT_APP_API_URL=http://localhost:8080
```

### 步骤 4: 安装Moment.js
Moment.js 是项目中用于日期和时间处理的重要依赖，确保正确安装：
```bash
# 在前端目录下运行
npm install moment --save
```
如果需要特定版本的Moment.js（项目默认使用2.30.1版本）：
```bash
npm install moment@2.30.1 --save
```

### 步骤 5: 安装Decimal.js
Decimal.js 是用于高精度数值计算的重要依赖，特别是在金融数据处理中：
```bash
# 在前端目录下运行
npm install decimal.js --save
```
如果需要特定版本的Decimal.js（项目默认使用10.5.0版本）：
```bash
npm install decimal.js@10.5.0 --save
```

### 步骤 6: 启动前端开发服务器
```bash
npm start
```
前端将在 http://localhost:3000 运行。

## 后端安装

### 步骤 1: 准备 Python 环境
```bash
cd jrrg_framework_backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

### 步骤 2: 安装后端依赖
```bash
pip install -r requirements.txt
```

主要依赖项包括：
- Flask==2.0.1
- Flask-SQLAlchemy==2.5.1
- Flask-JWT-Extended==4.3.1
- akshare==1.0.0
- pandas==1.3.3
- numpy==1.21.2

如果 `requirements.txt` 不存在，可以手动创建并包含上述依赖。

### 步骤 3: 配置后端环境
创建 `instance/config.py` 文件：
```python
SECRET_KEY = 'your-secret-key'
SQLALCHEMY_DATABASE_URI = 'sqlite:///app.db'
JWT_SECRET_KEY = 'your-jwt-secret-key'
```

### 步骤 4: 初始化数据库
```bash
flask init-db
```

### 步骤 5: 启动后端服务器
```bash
flask run
```
后端将在 http://localhost:8080 运行。

## 常见问题解决

### 问题 1: 安装 akshare 失败
尝试使用以下命令：
```bash
pip install akshare --upgrade -i https://pypi.tuna.tsinghua.edu.cn/simple/
```

### 问题 2: 前端连接后端失败
检查 `.env` 文件中的 API URL 配置是否正确，确保后端服务器正在运行。

### 问题 3: 数据库初始化错误
确保已创建 `instance` 目录，并且有足够的权限创建数据库文件。

## 生产环境部署

### 前端部署
```bash
cd jrrg_framework_frontend
npm run build
```
将生成的 `build` 目录部署到 Web 服务器（如 Nginx, Apache）。

### 后端部署
推荐使用 Gunicorn 和 Nginx 部署 Flask 应用：

1. 安装 Gunicorn:
```bash
pip install gunicorn
```

2. 启动 Gunicorn:
```bash
gunicorn -w 4 -b 127.0.0.1:8080 "app:create_app()"
```

3. 配置 Nginx 反向代理到 Gunicorn。

## 系统更新

### 前端更新
```bash
cd jrrg_framework_frontend
git pull
npm install
npm run build  # 如果是生产环境
```

### 后端更新
```bash
cd jrrg_framework_backend
git pull
source venv/bin/activate  # 激活虚拟环境
pip install -r requirements.txt
flask db upgrade  # 如果有数据库变更
```

## 支持与帮助

如有任何安装问题，请联系项目维护者或提交 Issue。 