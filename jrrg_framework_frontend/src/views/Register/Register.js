import React from "react";
import { Form, Input, Button, message } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, SmileOutlined } from "@ant-design/icons";
import { $userRegister } from "../../api/userApi";
import { useNavigate } from "react-router-dom";
import './Register.scss';

const Register = () => {
    // 创建一个Form实例
    const [registerForm] = Form.useForm();

    // 定义路由函数
    const navigate = useNavigate();

    // 表单提交成功的回调事件，values就存储了该表单中所有组件的值，如username、password等，所以可以直接传递values
    const onFinish = async (values) => {
        try {
            await $userRegister(values);
            message.success("注册成功");
            // 路由到login
            navigate("/login");
        } catch (error) {
            // 如果抛出异常，说明注册失败，可以不做处理
            message.error("注册失败");
        }
    };

    // 表单提交但数据校验失败的回调事件
    const onFinishFailed = (errorInfo) => {
        console.log("Failed:", errorInfo);
        message.error("数据不合法，请检查后重新提交！");
    }

    return (
        <div className="register-container">
            <div className="register-card">
                <h2 className="register-title">用户注册</h2>
                <Form
                    form={registerForm}
                    name="user"
                    onFinish={onFinish} // 提交表单且数据验证成功后回调事件
                    onFinishFailed={onFinishFailed} // 提交表单且数据验证失败后回调事件
                    layout="vertical"
                    initialValues={{ remember: true }}
                >
                    {/* 用户名 */}
                    <Form.Item
                        name="username"
                        label="用户名"
                        // 在AntDesign中，可以通过向Form的rules属性传递一个数组来设置校验规则，这样以来就不需要手动进行参数校验了
                        rules={[
                            { required: true, message: "请输入用户名！" },
                            { max: 255, message: "用户名不能超过255个字符！" },
                        ]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="输入用户名" />
                    </Form.Item>

                    {/* 密码 */}
                    <Form.Item
                        name="password"
                        label="密码"
                        rules={[
                            { required: true, message: "请输入密码！" },
                            { max: 255, message: "密码不能超过255个字符！" },
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="输入密码" />
                    </Form.Item>

                    {/* 昵称 */}
                    <Form.Item
                        name="nickname"
                        label="昵称"
                        rules={[
                            { required: true, message: "请输入昵称！" },
                            { max: 255, message: "昵称不能超过255个字符！" },
                        ]}
                    >
                        <Input prefix={<SmileOutlined />} placeholder="输入昵称" />
                    </Form.Item>

                    {/* 邮箱 */}
                    <Form.Item
                        name="email"
                        label="邮箱"
                        rules={[
                            { required: true, message: "请输入邮箱！" },
                            { type: "email", message: "请输入有效的邮箱地址！" },
                        ]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="输入邮箱" />
                    </Form.Item>

                    {/* 手机号 */}
                    <Form.Item
                        name="phone"
                        label="手机号"
                        rules={[
                            { required: true, message: "请输入手机号！" },
                            {
                                pattern: /^1[3-9]\d{9}$/,
                                message: "请输入有效的中国大陆手机号码！",
                            },
                        ]}
                    >
                        <Input prefix={<PhoneOutlined />} placeholder="输入手机号" />
                    </Form.Item>

                    {/* 提交按钮 */}
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            注册
                        </Button>
                        {/* Form实例有一个resetFields方法，在页面上表现为清空表单数据，用法相对固定，如下 */}
                        <Button type="default" block onClick={() => registerForm.resetFields()}>
                            重置
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default Register;
