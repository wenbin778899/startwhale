import React from "react";
import { Link } from "react-router-dom";

// 404页面，当用户访问不存在的路由时，显示该页面
const NotFound = () => {
    return (
        <div style={styles.container}>
            <h1 style={styles.title}>404 - 页面未找到</h1>
            <p style={styles.text}>抱歉，您访问的页面不存在。</p>
            {/* 你可以将如下的内容替换为你们自己的项目名称 */}
            <p style={styles.projectName}>StratWhale智能量化平台</p>
            <Link to="/" style={styles.link}>返回首页</Link>
        </div>
    );
};

// 对于简单的样式，也可以直接在JSX中使用style属性进行设置
const styles = {
    container: {
        textAlign: "center",
        marginTop: "10%",
    },
    title: {
        fontSize: "36px",
        color: "#ff0000",
    },
    text: {
        fontSize: "18px",
        color: "#333",
    },
    projectName: {
        fontSize: "20px",
        fontWeight: "bold",
        marginTop: "10px",
    },
    link: {
        marginTop: "20px",
        display: "inline-block",
        fontSize: "16px",
        color: "#007bff",
        textDecoration: "none",
        padding: "10px 20px",
        border: "1px solid #007bff",
        borderRadius: "5px",
    },
};

export default NotFound;
