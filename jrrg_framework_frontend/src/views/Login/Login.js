// 简单的登录页面，包含用户名和密码输入框，以及登录按钮，用户输入用户名和密码后点击登录按钮即可完成登录操作
// 该页面使用了Ant Design的Input、Button、message组件，分别用于输入框、按钮和消息提示
// 该页面使用了React的useState、useEffect、useHistory等Hook，分别用于定义组件状态、处理副作用、导航等
// 注意import a from 'xxx' 与 import { a } from 'xxx' 的区别，前者是导入默认导出，后者是导入命名导出
import React, { useState } from "react";
import { Input, Button, message } from "antd";
import { UserOutlined, LockOutlined, EyeTwoTone, EyeInvisibleOutlined } from "@ant-design/icons";
import "./Login.scss";
import { $userLogin } from "../../api/userApi";
import { Link, useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode";


// 在React中，每个组件都是一个函数，函数的名称通常以大写字母开头，这是React的规范，用于区分普通的函数和组件函数，如下是一个名为Login的组件函数，同时也代表了一个登录页面。定义函数可以使用function关键字，也可以使用箭头函数，这里使用了箭头函数以简化，当然你也可以使用function关键字来定义函数，但是要注意箭头函数和function函数的this指向问题（不过在函数组件中，this指向并不重要，因为函数组件中没有this；但是在可能涉及this指向问题的场景中，要慎重选择，建议GPT）。
const Login = () => {
    // 利用useState定义组件状态loginData，它存储了username和password
    // NOTE 标识符命名规范：（1）见名知意，loginData存储关于登录信息的数据，setLoginData是专用于修改loginData的函数；（2）在JavaScript、Java等语言中，变量通常使用小驼峰命名法，即第一个单词首字母小写，后续单词首字母大写，如loginData（还有一种大驼峰命名法，也即首字母大写，在OOP中用于定义类名，但在Go和C#中用于定义方法）；而在Python、C++、Rust等语言中，使用下划线命名法，即单词之间使用下划线连接，如login_data
    const [loginData, setLoginData] = useState({ username: "", password: "" });


    // 用户在密码输入框进行输入操作时触发的事件由该函数处理，它负责将用户输入的内容同步到loginData中
    // 这里的事件参数e是一个对象，提供的参数中target.name存储了绑定在该事件所关联的组件上的值，例如本例中的username和password，target.value则存储了更新后的值。
    // 这里的逻辑把username和password的逻辑合并起来了，使得只需要使用一个handler就能完成
    // NOTE 事件处理函数命名规范：在JavaScript中事件处理函数的常用命名规范为：handle(+监听对象+)事件类型，另一种方式是：(监听对象+)事件类型+Handler，如loginDataChangeHandler，无论使用哪种方式，尽量保证风格统一
    const handleLoginDataChange = (e) => {
        // console.log(e.target.name, e.target.value);
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    // 导航函数
    const navigate = useNavigate();

    // 当用户点击登录按钮时触发的提交事件
    const handleLoginFormClick = async (e) => {
        // 通过控制台输出进行简单debug
        console.log("Logging in with:", loginData);

        // 对于像这种提交表单数据的（登录、注册、输入信息等），需要进行数据校验的逻辑，这是为了将提交不合法数据的请求过滤掉，防止这些请求被后端接收，从而保证系统的鲁棒性，如下是一种简单的数据校验的逻辑
        if (loginData.username.length === 0 || loginData.username.length > 255 || loginData.password === 0 || loginData.password.length > 255) {
            message.error("用户名和密码不满足要求");
            return;
        }

        // 调用API
        try {
            // 阻塞等待网络请求
            const res = await $userLogin(loginData);
            // 利用jwt工具从jwt中解析出用户信息，由于后端使用的jwt编码方式，使得真实的信息被存储在user_info字段中，所以可以通过user_info字段获得真实的用户信息
            // console.log(res);
            console.log(jwtDecode(res.data));
            const user_info = jwtDecode(res.data).user_info;
            console.log(user_info);
            // 利用localStorage存储用户信息，注意要将其转化为json格式（localStorage只能存储字符串）
            localStorage.setItem("user_info", JSON.stringify(user_info));
            // 同时将jwt也保存起来
            localStorage.setItem("jwt_token", res.data);
            // 提示用户登录成功
            message.success("登录成功");
            // 跳转到主页
            navigate("/home");
        } catch (error) {
            // 说明登录失败，简单提示即可，也可以提供详细的信息
            message.error("登录失败:" + error.response?.data.message);
        }

    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>登录</h2>
                <div>
                    <div className="input-group">
                        <label htmlFor="username">用户名</label>
                        <Input
                            size="large"
                            id="username"
                            name="username"
                            placeholder="请输入用户名"
                            prefix={<UserOutlined />}
                            value={loginData.username}
                            onChange={handleLoginDataChange}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">密码</label>
                        <Input.Password
                            size="large"
                            id="password"
                            name="password"
                            placeholder="请输入密码"
                            prefix={<LockOutlined />}
                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            value={loginData.password}
                            onChange={handleLoginDataChange}
                            required
                        />
                    </div>
                    <Button type="primary" htmlType="submit" className="login-btn" block onClick={handleLoginFormClick}>
                        登录
                    </Button>
                </div>
                <div className="register-link">
                    还没有账号？ <Link to="/register">立即注册</Link>
                </div>
            </div>
        </div>
    );
};

// 导出Login组件，只有导出的组件才能被其他组件引用（App.js中需要引入它来完成路由的配置）
export default Login;
