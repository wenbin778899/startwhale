// NOTE 此文件需要创建在src/setupProxy.js文件中，用于解决跨域问题，需要先通过npm install http-proxy-middleware --save安装依赖（此项目已经安装完毕）

const { createProxyMiddleware } = require('http-proxy-middleware')    //解构出createProxyMiddleware

module.exports = function (app) {
    app.use(
        '/api', // 这段逻辑的意思是说拦截所有以“/api”开头的http请求，并且转发到设置的target地址对应的主机中，并且将“/api”替换为空（即删除），所以设置完这段逻辑之后所有的请求都必须以/api开头
        createProxyMiddleware({        //使用createProxyMiddleware
            target: 'http://localhost:8080/',
            changeOrigin: true,
            pathRewrite: { '/api': '' }
        })
    )
}