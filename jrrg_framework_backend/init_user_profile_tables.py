"""
初始化用户画像相关数据库表的脚本
"""
from flask import Flask
from sqlalchemy import text
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import BaseConfig
from app.models import db
from app.models.user_profile import UserQuestionnaire, UserIndustryPreference, UserTradingHabit

def create_app():
    """创建Flask应用"""
    app = Flask(__name__)
    app.config.from_object(BaseConfig)
    db.init_app(app)
    return app

def init_tables():
    """初始化数据库表"""
    app = create_app()
    with app.app_context():
        # 检查连接是否正常
        try:
            db.session.execute(text('SELECT 1'))
            print("数据库连接正常")
        except Exception as e:
            print(f"数据库连接失败: {e}")
            return

        # 创建或重建表
        try:
            print("开始创建用户画像相关表...")
            # 删除已存在的表（如果需要重建）
            # db.drop_all()
            
            # 创建表
            db.create_all()
            print("表创建成功")
            
            # 检查表是否存在
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            profile_tables = ['user_questionnaire', 'user_industry_preference', 'user_trading_habit']
            
            print("检查表是否创建成功:")
            for table in profile_tables:
                if table in tables:
                    print(f"- {table}: 已创建")
                else:
                    print(f"- {table}: 未创建")
            
        except Exception as e:
            print(f"创建表失败: {e}")

if __name__ == "__main__":
    init_tables() 