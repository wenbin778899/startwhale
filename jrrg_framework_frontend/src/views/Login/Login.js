// 简单的登录页面，包含用户名和密码输入框，以及登录按钮，用户输入用户名和密码后点击登录按钮即可完成登录操作
// 该页面使用了Ant Design的Input、Button、message组件，分别用于输入框、按钮和消息提示
// 该页面使用了React的useState、useEffect、useHistory等Hook，分别用于定义组件状态、处理副作用、导航等
// 注意import a from 'xxx' 与 import { a } from 'xxx' 的区别，前者是导入默认导出，后者是导入命名导出
import React, { useState, useEffect } from "react";
import { Input, Button, message, Form, Checkbox, Typography } from "antd";
import { 
    UserOutlined, 
    LockOutlined, 
    EyeTwoTone, 
    EyeInvisibleOutlined, 
    LoginOutlined,
    StarOutlined,
    LineChartOutlined,
    SafetyOutlined
} from "@ant-design/icons";
import "./Login.scss";
import { $userLogin } from "../../api/userApi";
import { Link, useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode";
import { motion } from "framer-motion";

const { Title, Text } = Typography;

// 粒子效果配置
const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 2 + 2
}));

// 在React中，每个组件都是一个函数，函数的名称通常以大写字母开头，这是React的规范，用于区分普通的函数和组件函数，如下是一个名为Login的组件函数，同时也代表了一个登录页面。定义函数可以使用function关键字，也可以使用箭头函数，这里使用了箭头函数以简化，当然你也可以使用function关键字来定义函数，但是要注意箭头函数和function函数的this指向问题（不过在函数组件中，this指向并不重要，因为函数组件中没有this；但是在可能涉及this指向问题的场景中，要慎重选择，建议GPT）。
const Login = () => {
    // 利用useState定义组件状态loginData，它存储了username和password
    // NOTE 标识符命名规范：（1）见名知意，loginData存储关于登录信息的数据，setLoginData是专用于修改loginData的函数；（2）在JavaScript、Java等语言中，变量通常使用小驼峰命名法，即第一个单词首字母小写，后续单词首字母大写，如loginData（还有一种大驼峰命名法，也即首字母大写，在OOP中用于定义类名，但在Go和C#中用于定义方法）；而在Python、C++、Rust等语言中，使用下划线命名法，即单词之间使用下划线连接，如login_data
    const [loginData, setLoginData] = useState({ username: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [form] = Form.useForm();

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

    // 检查本地存储中是否有保存的用户名和密码
    useEffect(() => {
        const savedUser = localStorage.getItem('rememberedUser');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            setLoginData(userData);
            setRememberMe(true);
            form.setFieldsValue(userData);
        }
    }, [form]);

    // 当用户点击登录按钮时触发的提交事件
    const handleLoginFormClick = async () => {
        try {
            // 表单验证
            await form.validateFields();
            
            setLoading(true);
            
            // 通过控制台输出进行简单debug
            console.log("Logging in with:", loginData);

            // 对于像这种提交表单数据的（登录、注册、输入信息等），需要进行数据校验的逻辑，这是为了将提交不合法数据的请求过滤掉，防止这些请求被后端接收，从而保证系统的鲁棒性，如下是一种简单的数据校验的逻辑
            if (loginData.username.length === 0 || loginData.username.length > 255 || loginData.password === 0 || loginData.password.length > 255) {
                message.error("用户名和密码不满足要求");
                setLoading(false);
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
                
                // 如果用户选择了"记住我"，则保存用户名和密码
                if (rememberMe) {
                    localStorage.setItem('rememberedUser', JSON.stringify(loginData));
                } else {
                    localStorage.removeItem('rememberedUser');
                }
                
                // 提示用户登录成功
                message.success("登录成功");
                // 跳转到主页
                navigate("/home");
            } catch (error) {
                // 说明登录失败，简单提示即可，也可以提供详细的信息
                message.error("登录失败:" + error.response?.data.message);
                setLoading(false);
            }
        } catch (error) {
            console.log('表单验证失败:', error);
        }
    };

    // 动画变体配置
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { 
                when: "beforeChildren",
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            transition: { 
                type: "spring", 
                stiffness: 100
            }
        }
    };

    const logoVariants = {
        hidden: { scale: 0.8, opacity: 0 },
        visible: { 
            scale: 1, 
            opacity: 1, 
            transition: { 
                type: "spring", 
                stiffness: 200,
                delay: 0.2
            }
        }
    };

    return (
        <div className="login-container">
            {/* 粒子背景效果 */}
            <div className="particles">
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        className="particle"
                        initial={{ 
                            x: `${particle.x}%`, 
                            y: `${particle.y}%`, 
                            opacity: 0 
                        }}
                        animate={{ 
                            x: [`${particle.x}%`, `${particle.x + (Math.random() * 10 - 5)}%`],
                            y: [`${particle.y}%`, `${particle.y - 10}%`],
                            opacity: [0, 0.8, 0]
                        }}
                        transition={{ 
                            duration: particle.duration,
                            repeat: Infinity,
                            repeatType: "loop",
                            ease: "easeInOut"
                        }}
                        style={{ 
                            width: `${particle.size}px`, 
                            height: `${particle.size}px` 
                        }}
                    />
                ))}
            </div>

            <motion.div 
                className="login-content"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <div className="login-left">
                    <div className="login-branding">
                        <motion.div 
                            className="logo-container"
                            variants={logoVariants}
                        >
                            <span className="logo-text">startWhale</span>
                            <span className="logo-dot"></span>
                        </motion.div>
                        <motion.h1 
                            className="slogan"
                            variants={itemVariants}
                        >
                            智能股票分析<br />为您的投资保驾护航
                        </motion.h1>
                        <div className="features">
                            <motion.div 
                                className="feature-item"
                                variants={itemVariants}
                            >
                                <div className="feature-icon">
                                    <LineChartOutlined />
                                </div>
                                <div className="feature-text">
                                    <h3>实时行情</h3>
                                    <p>掌握市场脉搏，把握投资先机</p>
                                </div>
                            </motion.div>
                            <motion.div 
                                className="feature-item"
                                variants={itemVariants}
                            >
                                <div className="feature-icon">
                                    <StarOutlined />
                                </div>
                                <div className="feature-text">
                                    <h3>AI分析</h3>
                                    <p>智能算法，精准预测市场趋势</p>
                                </div>
                            </motion.div>
                            <motion.div 
                                className="feature-item"
                                variants={itemVariants}
                            >
                                <div className="feature-icon">
                                    <SafetyOutlined />
                                </div>
                                <div className="feature-text">
                                    <h3>风险控制</h3>
                                    <p>科学管理投资组合，降低风险</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                <motion.div 
                    className="login-right"
                    variants={containerVariants}
                >
                    <motion.div 
                        className="login-box"
                        variants={itemVariants}
                    >
                        <Title level={2} className="login-title">欢迎登录</Title>
                        <Text className="login-subtitle">请输入您的账号信息</Text>
                        
                        <Form
                            form={form}
                            name="login_form"
                            initialValues={{ remember: rememberMe }}
                            onFinish={handleLoginFormClick}
                            className="login-form"
                        >
                            <motion.div 
                                className="input-group"
                                variants={itemVariants}
                            >
                                <label htmlFor="username">用户名</label>
                                <Form.Item
                                    name="username"
                                    rules={[{ required: true, message: '请输入用户名!' }]}
                                >
                                    <Input
                                        size="large"
                                        id="username"
                                        name="username"
                                        placeholder="请输入用户名"
                                        prefix={<UserOutlined style={{ color: 'rgba(255, 255, 255, 0.7)', width: '14px', display: 'flex', justifyContent: 'center' }} />}
                                        value={loginData.username}
                                        onChange={handleLoginDataChange}
                                        required
                                        style={{ 
                                            background: 'rgba(255, 255, 255, 0.03)', 
                                            borderColor: 'rgba(255, 255, 255, 0.15)',
                                            color: '#fff'
                                        }}
                                    />
                                </Form.Item>
                            </motion.div>
                            <motion.div 
                                className="input-group"
                                variants={itemVariants}
                            >
                                <label htmlFor="password">密码</label>
                                <Form.Item
                                    name="password"
                                    rules={[{ required: true, message: '请输入密码!' }]}
                                >
                                    <Input.Password
                                        size="large"
                                        id="password"
                                        name="password"
                                        placeholder="请输入密码"
                                        prefix={<LockOutlined style={{ color: 'rgba(255, 255, 255, 0.7)', width: '14px', display: 'flex', justifyContent: 'center' }} />}
                                        iconRender={(visible) => (visible ? 
                                            <EyeTwoTone style={{ color: 'rgba(255, 255, 255, 0.7)' }} /> : 
                                            <EyeInvisibleOutlined style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                                        )}
                                        value={loginData.password}
                                        onChange={handleLoginDataChange}
                                        required
                                        style={{ 
                                            background: 'rgba(255, 255, 255, 0.03)', 
                                            borderColor: 'rgba(255, 255, 255, 0.15)',
                                            color: '#fff'
                                        }}
                                    />
                                </Form.Item>
                            </motion.div>
                            
                            <motion.div variants={itemVariants}>
                                <Form.Item>
                                    <div className="login-options">
                                        <Checkbox 
                                            checked={rememberMe} 
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                        >
                                            记住我
                                        </Checkbox>
                                        <a href="#" className="forgot-password">
                                            忘记密码?
                                        </a>
                                    </div>
                                </Form.Item>
                            </motion.div>
                            
                            <motion.div 
                                variants={itemVariants}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    className="login-btn" 
                                    block 
                                    loading={loading}
                                    icon={<LoginOutlined />}
                                >
                                    登录
                                </Button>
                            </motion.div>
                        </Form>
                        
                        <motion.div 
                            className="register-link"
                            variants={itemVariants}
                        >
                            还没有账号？ <Link to="/register">立即注册</Link>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </div>
    );
};

// 导出Login组件，只有导出的组件才能被其他组件引用（App.js中需要引入它来完成路由的配置）
export default Login;
