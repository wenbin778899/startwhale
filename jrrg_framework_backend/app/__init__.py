from flask import Flask
from flask_jwt_extended import JWTManager
from sqlalchemy import text

from app.config import BaseConfig
from app.config import register_logger
# 导入定义的蓝图
from app.controllers import user_controller
from app.controllers import stock_controller
from app.controllers import strategy_controller
from app.controllers.user_profile_controller import user_profile_controller
from app.controllers.news_controller import news_controller  # 导入新闻控制器
# 导入定义的数据库句柄
from app.models import db

def create_app():
    app = Flask(__name__)

    # 导入配置
    app.config.from_object(BaseConfig)
    print(app.config['SQLALCHEMY_DATABASE_URI'])

    # 将db与flask应用程序关联
    db.init_app(app)

    # 数据库预热
    with app.app_context():
        db.session.execute(text('SELECT 1'))
        db.session.close()

    # 配置jwt
    jwt = JWTManager(app)

    # 添加根路由，用于API状态检查
    @app.route('/')
    def index():
        return {"message": "API服务正常运行", "status": "ok", "endpoints": [
            "/user/login", 
            "/user/logout", 
            "/user/register", 
            "/user/info", 
            "/user/info/<user_id>",
            "/stock/info",
            "/stock/search",
            "/strategy/favorites",
            "/strategy/ai-analysis",
            "/strategy/save-analysis-history",
            "/user-profile/questionnaire",
            "/user-profile/profile",
            "/news/market",  # 新增的新闻接口
            "/news/topic"    # 新增的新闻接口
        ]}

    # 添加/api前缀的路由重定向，以兼容前端调用
    @app.route('/api/<path:subpath>', methods=['GET', 'POST', 'PUT', 'DELETE'])
    def api_redirect(subpath):
        # 重定向到正确的路由，保留请求方法和参数
        from flask import request, current_app, make_response, jsonify
        import requests
        
        # 构建目标URL
        target_url = f"{request.host_url}{subpath}"
        if request.query_string:
            target_url = f"{target_url}?{request.query_string.decode('utf-8')}"
        
        current_app.logger.info(f"API代理: {request.method} /api/{subpath} -> {target_url}")
        
        # 获取请求头，但排除某些特殊头部
        headers = {key: value for key, value in request.headers.items()
                  if key.lower() not in ['host', 'content-length']}
        
        # 使用requests转发请求
        try:
            if request.method == 'GET':
                response = requests.get(target_url, headers=headers)
            elif request.method == 'POST':
                response = requests.post(target_url, json=request.get_json(), headers=headers)
            elif request.method == 'PUT':
                response = requests.put(target_url, json=request.get_json(), headers=headers)
            elif request.method == 'DELETE':
                response = requests.delete(target_url, headers=headers)
            else:
                return jsonify({"error": "不支持的请求方法"}), 405
            
            # 返回从内部服务器获取的响应
            return make_response(response.content, response.status_code)
        except Exception as e:
            current_app.logger.error(f"API代理错误: {str(e)}")
            return jsonify({"error": "API代理错误", "message": str(e)}), 500

    # 注册Blueprint，并分别指定前缀
    # NOTE 接口定义规范：同属于一个功能模块的接口应当有相似的前缀，以便于管理和维护
    app.register_blueprint(user_controller, url_prefix='/user')
    app.register_blueprint(stock_controller, url_prefix='/stock')
    app.register_blueprint(strategy_controller, url_prefix='/strategy')
    app.register_blueprint(user_profile_controller, url_prefix='/user-profile')
    app.register_blueprint(news_controller, url_prefix='/news')  # 注册新闻蓝图

    # 配置日志
    app = register_logger(app)

    return app
