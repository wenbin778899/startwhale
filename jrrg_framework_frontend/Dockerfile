# 使用单阶段构建
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install
RUN npm install -g serve

# 复制所有文件
COPY . .

# 设置环境变量，忽略ESLint警告
ENV CI=false
ENV ESLINT_NO_DEV_ERRORS=true
ENV DISABLE_ESLINT_PLUGIN=true
ENV REACT_APP_API_URL=https://startwhale-production.up.railway.app

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 80

# 启动服务
CMD ["serve", "-s", "build", "-l", "80"]