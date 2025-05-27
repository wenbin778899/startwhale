# NJU《金融软工》课程项目框架前端部分

该项目是南京大学《金融软工》课程的项目框架的前端项目，后端见：[jrrg_framework_backend: NJU《金融软工》课程项目模板后端代码](https://gitee.com/coding-wang/jrrg_framework_backend)。

## 项目简介

本项目模板采用`React18`+`Ant-Design5`作为核心实现，通过`react-router-dom`来实现路由功能，使用`axios`进行网络请求。

## 环境准备

为了运行本项目，你需要进行如下的环境准备工作：

1. 安装`Node.js`，推荐安装LTS版本，教程见：[2024最新版Node.js下载安装及环境配置教程【保姆级】_nodejs下载-CSDN博客](https://blog.csdn.net/WHF__/article/details/129362462)

2. 安装依赖，由于项目模板已经在`/package.json`中列出了本项目所依赖的扩展库，所以你只需要通过如下命令进行依赖安装：

   ```shell
   npm install
   ```

## 运行与部署

### 服务配置

由于本项目采用前后端分离的方式进行开发，所以本前端部分需要依赖于后端提供的服务地址，模板默认设置的后端服务地址为`http://localhost:8080`，如果你对后端的服务配置进行了修改，那么应当修改`/src/setupProxy.js`中的如下内容：

```javascript
// NOTE 此文件需要创建在src/setupProxy.js文件中，用于解决跨域问题，需要先通过npm install http-proxy-middleware --save安装依赖（此项目已经安装完毕）

const { createProxyMiddleware } = require('http-proxy-middleware')    //解构出createProxyMiddleware

module.exports = function (app) {
    app.use(
        '/api', // 这段逻辑的意思是说拦截所有以“/api”开头的http请求，并且转发到设置的target地址对应的主机中，并且将“/api”替换为空（即删除），所以设置完这段逻辑之后所有的请求都必须以/api开头
        createProxyMiddleware({        //使用createProxyMiddleware
            target: /*你自定义的后端服务地址*/
            changeOrigin: true,
            pathRewrite: { '/api': '' }
        })
    )
}
```

### 运行

进入到项目根目录，并通过如下命令运行前端项目：

```shell
npm run start
```



## 提醒

本项目在运行时可能会报错，这极有可能是因为版本不兼容的问题，可以参照网络上相关的教程进行配置。

