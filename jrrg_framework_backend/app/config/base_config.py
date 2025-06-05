import os
from dotenv import load_dotenv

# 尝试加载.env文件，如果存在的话
if os.path.exists('app.env'):
    load_dotenv('app.env')
else:
    # 在部署环境中，可能不需要显式加载.env文件，因为环境变量已经通过平台设置
    pass

class BaseConfig:
    # 服务配置
    DEBUG = os.getenv('DEBUG', 'False') == 'True'
    TESTING = os.getenv('TESTING', 'False') == 'True'

    # 数据库相关配置，NOTE 由于使用Flask-SQLAlchemy，所以下面两个配置名称不能自定义
    # 优先使用环境变量中的数据库URI，如果没有则使用MySQL_URL
    SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI') or os.getenv('MYSQL_URL') or 'mysql://root:SecurePass123!@mysql.railway.internal:3306/jrrg_framework_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False # 关闭追踪
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 5,  # 连接池大小
        'max_overflow': 10,  # 最大溢出连接数
        'pool_pre_ping': True,  # 检查连接是否有效
        'pool_recycle': 3600  # 连接回收时间（秒）
    }

    # jwt
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default_secret_key')
    JWT_TOKEN_LOCATION = os.getenv('JWT_TOKEN_LOCATION', 'headers')
