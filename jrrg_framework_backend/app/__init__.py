from flask import Flask
from flask_jwt_extended import JWTManager
from sqlalchemy import text

from app.config import BaseConfig
from app.config import register_logger
# 导入定义的蓝图
from app.controllers import user_controller
from app.controllers import stock_controller
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
            "/stock/search"
        ]}

    # 注册Blueprint，并分别指定前缀
    # NOTE 接口定义规范：同属于一个功能模块的接口应当有相似的前缀，以便于管理和维护
    app.register_blueprint(user_controller, url_prefix='/user')
    app.register_blueprint(stock_controller, url_prefix='/stock')

    # 配置日志
    app = register_logger(app)

    return app
