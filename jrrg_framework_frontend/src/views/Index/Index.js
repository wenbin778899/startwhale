import { HomeOutlined, LineChartOutlined, MoneyCollectOutlined, BulbOutlined, EditOutlined, RollbackOutlined, CopyrightOutlined, GithubOutlined, UserOutlined, SettingOutlined, LogoutOutlined, IdcardOutlined, ProfileOutlined, StarOutlined, WalletOutlined } from '@ant-design/icons';
import { Breadcrumb, Layout, Menu, Avatar, Tooltip, Dropdown, Button } from 'antd';
import React, { useState, useEffect } from 'react';
import './Index.scss';
// 在create-react-app中，有两种方式引入图片资源：1.对于存放在public目录下的资源，可以直接通过相对路径引入；2.对于存放在src目录下的资源（如assets），需要通过import的方式引入，然后在代码中使用，这里使用的是第2种方式，这种方式可以实现图片资源的模块化管理
import Logo from '../../assets/img/logo.png';
import { Outlet, useNavigate } from 'react-router-dom';
import { $userLogout, $getCurrentUserInfo } from '../../api/userApi';
import { message } from 'antd';


// 定义Index页面组件
const Index = () => {
    // 定义一个状态，用于存储用户信息
    const [userInfo, setUserInfo] = useState({ username: '', nickname: '' });
    // 定义导航对象，用于页面跳转
    const navigate = useNavigate();

    // 初始化用户信息
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const res = await $getCurrentUserInfo();
                if (res.code === 0) {
                    setUserInfo(res.data);
                } else {
                    message.error('获取用户信息失败，请重新登录');
                    navigate('/login');
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
                message.error('网络错误，请重试');
                navigate('/login');
            }
        };
        fetchUserInfo();
    }, [navigate]);

    // 定义一个事件处理函数，用于处理注销菜单项的点击事件
    const handleLogoutMenuItemClick = async (e) => {
        try {
            const res = await $userLogout();
            if (res.code === 0) {
                message.success('注销成功');
                navigate('/login');
            } else {
                message.error('注销失败，请重试');
            }
        } catch (error) {
            console.error('Error logging out:', error);
            message.error('网络错误，请重试');
        }
    }
    // 当鼠标从用户昵称上悬停时，会显示如下的菜单项，下面也只是一个示例，具体可以根据需求进行修改
    // // TODO 演示如何创建一个新页面
    const dropdownMenuItems = [
        {
            key: 'logout',
            label: (
                <Button danger type="text" icon={<LogoutOutlined />} onClick={handleLogoutMenuItemClick}>注销</Button>
            ),
        },
    ];


    // 解析Layout组件，其中包含Header、Content、Sider和Footer四个子组件
    const { Header, Content, Sider, Footer } = Layout;

    // 定义一个函数，用于生成侧边栏菜单项的数据结构，实际上就是将参数封装成一个对象
    const getItem = (label, key, icon, children, type = null) => {
        return {
            key,
            icon,
            children,
            label,
            type,
        };
    };
    // TODO 当然这只是一个示例，可以修改或继续添加其他子菜单甚至子菜单的子菜单
    // 定义侧边栏菜单项，注意这里定义的key既是菜单项的唯一标识，也是路由的一部分，所以要保证唯一性，将来可以通过key来判断当前选中的菜单项，进而通过路由来展示对应的页面
    const siderMenuItems = [
        getItem('首页', '/home', <HomeOutlined />),
        getItem('交易策略', '/strategy', <BulbOutlined />, [
            // 策略管理实际上设计策略的增删改查，但是可以将其设计成一个菜单项，页面用于显示策略列表，通过弹窗的方式来实现对策略的更改
            getItem('AI股市', '/strategy/manage', <EditOutlined />),
            // 回测策略菜单项，用于切换到回测策略页面
            // AI基金菜单项
            getItem('AI基金', '/strategy/fund', <StarOutlined />),
            getItem('回测策略', '/strategy/backtest', <RollbackOutlined />)
        ]),
        getItem('股票行情', '/stock', <LineChartOutlined />),
        getItem('持仓管理', '/portfolio', <WalletOutlined />),
        // 用于进行手工交易
        //getItem('股票交易', '/trade', <MoneyCollectOutlined />),
        getItem('个人中心', '/user', <UserOutlined />, [
            getItem('个人资料', '/user/detail', <ProfileOutlined />),
            getItem('投资者画像', '/user/profile', <IdcardOutlined />)
        ])
    ];


    // 定义一个函数，将菜单项的key与其对应的对象进行映射，方便通过key来获取菜单项的对象，也即返回一个对象：key -> menuItem
    const flattenMenuItems = (items, prefix = '') => {
        let result = {};
        items.forEach(item => {
            result[item.key] = item;
            if (item.children) {
                result = { ...result, ...flattenMenuItems(item.children) };
            }
        });
        return result;
    };
    // 通过调用上面定义的函数，将菜单项的key与其对应的对象进行映射
    const menuItemsMap = flattenMenuItems(siderMenuItems);
    // console.log(menuItemsMap);


    // 使用useState（这样才能被Breadcrumb渲染）定义一个面包屑数组，用于展示当前页面的路径，初始为空
    const [breadcrumbItems, setBreadcrumbItems] = React.useState([{
        title: '首页',
    }]);
    // 定义一个函数，用于处理菜单项的点击事件，通过点击菜单项，修改面包屑的内容，使其与菜单项保持一致
    const handleMenuItemClick = (e) => {
        // 定义一个临时的数组，用于存放面包屑的内容，注意通过let定义的变量可以修改其值，而const定义的变量不可以修改其值
        let updatedItems = [];
        e.keyPath.forEach((key) => {
            updatedItems.push({
                title: menuItemsMap[key].label,
            });
        });
        setBreadcrumbItems(updatedItems);
        
        // 导航到对应的路由
        navigate(e.key);
    };

    return (
        <Layout className="home-layout">
            {/* Layout下有两个同级的子节点：Header、Layout，说明整个页面分成两块：头部和主体 */}
            <Header className="header">
                <img className="logo" src={Logo} alt='logo无法显示' />
                <div className="title" >StratWhale智能量化平台</div>
                {/* 如下的头像是写死的，实际上用户可以通过上传图像来自定义头像，这部分大家可以作为扩展实现 */}
                {/* <Avatar className="avatar" size={48} src={"xxx"}></Avatar> */}
                <Avatar className="avatar" size={48} icon={<UserOutlined />}></Avatar>
                {/* menu属性需要的是一个object，因此这里有两层{{}}，其中"{items: dropdownMenuItems}"代表了一个对象，它有一个属性名为items（必须），对应的值为dropdownMenuItems */}
                <Dropdown menu={{ items: dropdownMenuItems }}>
                    <Tooltip className="nickname" placement="left" title={userInfo.nickname}>
                        {userInfo.nickname}
                    </Tooltip>
                </Dropdown>
            </Header>
            <Layout>
                {/* 主题部分又分左右两个部分：左侧列举一些功能模块；右侧展示实际内容 */}
                <Sider width={200} className="sider">
                    <Menu
                        mode="inline"
                        defaultSelectedKeys={['/home']}
                        defaultOpenKeys={[]}
                        className="sider-menu"
                        items={siderMenuItems}
                        onClick={handleMenuItemClick}
                    />
                </Sider>
                <Layout className="content-layout">
                    {/* 右侧实际展示的内容也分成三部分：顶端为"面包屑"，表示当前的路径；中心区域展示实际内容，底部展示网站基本信息 */}
                    <Breadcrumb
                        className="breadcrumb"
                        items={breadcrumbItems}
                    />
                    <Content className="content">
                        {/* 这里是实际内容展示区域，通过Outlet组件来展示子路由的内容 */}
                        <Outlet />
                    </Content>
                    <Footer className="footer"><GithubOutlined /> Copyright <CopyrightOutlined /> NJU-jrrg-lwld小组</Footer>
                </Layout>
            </Layout>
        </Layout>
    );
};
export default Index;
