import os
from dotenv import load_dotenv

# 加载env
load_dotenv('app.env')

class BaseConfig:
    # 服务配置
    DEBUG = os.getenv('DEBUG') == 'True'
    TESTING = os.getenv('TESTING') == 'True'

    # 数据库相关配置，NOTE 由于使用Flask-SQLAlchemy，所以下面两个配置名称不能自定义
    SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI') # 配置url
    SQLALCHEMY_TRACK_MODIFICATIONS = False # 关闭追踪
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 5,  # 连接池大小
        'max_overflow': 10,  # 最大溢出连接数
        'pool_pre_ping': True,  # 检查连接是否有效
        'pool_recycle': 3600  # 连接回收时间（秒）
    }

    # jwt
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_TOKEN_LOCATION = os.getenv('JWT_TOKEN_LOCATION')
