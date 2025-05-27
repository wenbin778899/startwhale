// 封装axios完成http请求的逻辑

import axios from "axios";

// 创建一个axios实例
const instance = axios.create({ // 也设置基地址，这样一来后续调用后会自动添加基地址而不需要重新输入，但是由于我们配置了代理解决跨域问题，所以这里就不需要设置了
    timeout: 2000, // 设置请求超时时间，如果超过2s，则返回错误
});

// 自定义一个本文件使用的变量
let navigate = null;
// 对外暴露一个函数，用于设置navigate
export const setNavigate = (nav) => {
    navigate = nav;
}


// 添加请求拦截器
instance.interceptors.request.use(function (config) {
    // TODO: 在发送请求之前做些什么（下面的逻辑是通常的用法，可以根据需要增加或修改）

    // 添加jwt令牌的逻辑
    // 获取本地存储的token，这里使用localStorage的方式
    const token = localStorage.getItem("jwt_token")
    // 如果token存在，则添加到请求头中
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}, function (error) {
    // TODO: 对请求错误做些什么（下面的逻辑是通常的用法，可以根据需要增加或修改）
    return Promise.reject(error);
});


// 添加响应拦截器
instance.interceptors.response.use(function (response) {
    // 2xx 范围内的状态码都会触发该函数。
    // TODO: 对响应数据做点什么（下面的逻辑是通常的用法，可以根据需要增加或修改）

    // 通过axios返回的对象是一个AxiosPromise对象，它会对后端的数据进行更进一步的封装，如果要拿到后端真实的响应，需要获取data字段，如下就不考虑其他信息，只考虑后端返回的真实的响应，所以直接获取其data字段的值
    // console.log(response); // 可以打印确认一下
    return response.data;
}, function (error) {
    // 超出 2xx 范围的状态码都会触发该函数。
    // TODO: 对响应错误做点什么（下面的逻辑是通常的用法，可以根据需要增加或修改）

    // 如果状态码时401，则重新跳转到login进行登录，当然这只是粗粒度的操作，也可以配合code字段进行细粒度控制
    if (error.response?.status === 401) {
        console.error("401 Unauthorized - Redirecting to login...");
        // 移除存储在本地的user_info与jwt
        localStorage.removeItem("user_info");
        localStorage.removeItem("jwt_token");

        // 使用 React Router 进行导航到登录界面
        if (navigate) navigate("/login");
    }

    // 默认情况下，超出2xx范围的状态码都会触发该函数，这里只是简单的返回错误，具体的错误处理逻辑可以根据实际情况进行修改
    return Promise.reject(error);
});


// 一定要导出，这样才能被其他文件使用
export default instance