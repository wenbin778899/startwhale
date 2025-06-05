"""
数据库迁移脚本，用于在Railway上初始化MySQL数据库
"""
import os
import sys
import sqlalchemy
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

def init_db():
    """初始化数据库结构"""
    try:
        # 获取数据库连接URL，优先使用MYSQL_URL环境变量
        db_url = os.getenv('MYSQL_URL') or os.getenv('SQLALCHEMY_DATABASE_URI')
        if not db_url:
            print("错误: 未设置MYSQL_URL或SQLALCHEMY_DATABASE_URI环境变量")
            sys.exit(1)
            
        print(f"连接到数据库: {db_url}")
        
        # 创建引擎
        engine = create_engine(db_url)
        
        # 测试连接
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print("数据库连接成功")
        
        # 执行SQL脚本
        execute_sql_files(engine)
        
        print("数据库初始化完成")
        return True
    except SQLAlchemyError as e:
        print(f"数据库错误: {str(e)}")
        return False
    except Exception as e:
        print(f"未知错误: {str(e)}")
        return False

def execute_sql_files(engine):
    """执行所有SQL文件"""
    # 需要执行的SQL文件列表，按照依赖顺序排序
    sql_files = [
        'user.sql',
        'user_profile_tables.sql',
        'strategy_tables.sql',
        'fund_tables.sql', 
        'portfolio_tables.sql',
        'backtest_tables.sql'
    ]
    
    # 由于使用的是MySQL数据库，不需要进行语法转换
    
    for sql_file in sql_files:
        try:
            print(f"执行SQL文件: {sql_file}")
            
            # 读取SQL文件内容
            with open(sql_file, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            
            # 将SQL拆分为单独的语句
            statements = sql_content.split(';')
            
            # 执行每个语句
            with engine.begin() as conn:  # 开始事务
                for statement in statements:
                    if statement.strip():
                        try:
                            conn.execute(text(statement))
                        except SQLAlchemyError as e:
                            # 如果表已存在等错误，打印警告但继续执行
                            print(f"警告: {str(e)}")
            
            print(f"成功执行SQL文件: {sql_file}")
        except Exception as e:
            print(f"执行SQL文件 {sql_file} 时出错: {str(e)}")
            raise

if __name__ == "__main__":
    success = init_db()
    if success:
        # 如果需要可以添加初始数据
        print("数据库初始化成功")
    else:
        print("数据库初始化失败")
        sys.exit(1) 