// 定义一个通用组件：RequireAuth，用于检查用户是否登录，如果没有登录，则跳转到登录页面
import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";


// RequireAuth组件接收一个children参数，表示该组件的子组件，即需要检查用户登录状态的组件
const RequireAuth = ({ children }) => {
    // 从localStorage中获取jwt_token，注意关键字要与登录时存储的一致
    const token = localStorage.getItem("jwt_token");

    // 如果没有token，说明用户没有登录，直接跳转到登录页面
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 如果有token，解析token，获取token的过期时间
    try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000; // 将毫秒转换为秒

        // Token 过期，清除 JWT与用户信息 并跳转到登录页面
        if (decodedToken.exp < currentTime) {
            localStorage.removeItem("jwt_token");
            localStorage.removeItem("user_info");
            return <Navigate to="/login" replace />;
        }
    } catch (error) {
        // 无效的 token，清除 JWT与用户信息 并跳转到登录页面
        console.error("Invalid token", error);
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("user_info");
        return <Navigate to="/login" replace />;
    }

    // 如果token有效，返回子组件，表现为正常渲染子组件（就好像没有RequireAuth一样）
    return children;
};

// 通过导出RequireAuth组件，其他组件可以通过引入RequireAuth组件来实现对用户登录状态的检查
export default RequireAuth;