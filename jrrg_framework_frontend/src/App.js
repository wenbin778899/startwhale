import { BrowserRouter, Routes, Route } from 'react-router-dom'

// 导入页面组件
import Login from './views/Login/Login';
import Index from './views/Index/Index';
import NotFound from './views/NotFound/NotFound';
import Register from './views/Register/Register';
import UserProfile from './views/UserProfile/UserProfile';
import StockQuery from './views/Stock/StockQuery';
import StrategyManage from './views/Strategy/StrategyManage';
import { useNavigate } from 'react-router-dom';
import { setNavigate } from './utils/http';
import RequierAuth from './components/RequireAuth/RequireAuth';


// NOTE 由于使用了useNavigate，所以必须单独定义一个页面（AppRoutes），你可以理解为固定写法
function AppRoutes() {
  // 为请求拦截器设置navigate
  const navigate = useNavigate();
  setNavigate(navigate);
  // 使用Routes定义多个不同的路由
  return (
    <Routes>

      {/* 使用Route定义某一个路由，如下是定义了当访问/login路径时，路由到Login页面 */}
      <Route path='/login' element={<Login />} />
      <Route path='/register' element={<Register />} />

      {/* 选择在App.js中统一设置路由，这样一来当其他页面想要使用该路由时，只要在相应位置使用<Outlet />代替即可 */}
      <Route path='/' element={<RequierAuth><Index /></RequierAuth>} >
        <Route path="/home" element={<div>Home</div>} />
        <Route path="/strategy" element={<div>Strategy</div>} />
        <Route path="/strategy/manage" element={<StrategyManage />} />
        <Route path="/strategy/backtest" element={<div>Strategy Backtest</div>} />
        <Route path="/stock" element={<StockQuery />} />
        <Route path="/trade" element={<div>Trade</div>} />
        <Route path="/user/profile" element={<UserProfile />} />
      </Route>

      {/* 通常还需要统一设置一个404页面，在react-router-dom中，设置path="*"表示匹配所有未被定义的路由 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}


// 主程序
function App() {
  return (
    <div>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </div>
  );
}

export default App;
