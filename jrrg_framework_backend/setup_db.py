"""
数据库初始化脚本，执行SQL文件创建表格
"""
import mysql.connector
import os
import sys

def execute_sql_file(host, user, password, database, port, sql_file):
    """
    执行SQL文件
    :param host: 数据库主机
    :param user: 数据库用户
    :param password: 数据库密码
    :param database: 数据库名称
    :param port: 数据库端口
    :param sql_file: SQL文件路径
    """
    try:
        # 连接数据库
        connection = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            port=port
        )
        
        cursor = connection.cursor()
        
        # 读取SQL文件
        with open(sql_file, 'r', encoding='utf-8') as file:
            sql_commands = file.read()
        
        # 执行SQL命令
        for command in sql_commands.split(';'):
            command = command.strip()
            if command:
                cursor.execute(command)
        
        connection.commit()
        print(f"SQL文件 {sql_file} 执行成功")
    
    except Exception as e:
        print(f"执行SQL文件时出错: {e}")
    
    finally:
        if 'connection' in locals():
            cursor.close()
            connection.close()

def main():
    """主函数"""
    # 数据库连接信息
    host = "localhost"  # 或者使用环境变量
    user = "root"       # 使用实际的用户名
    password = "lwb778899"       # 使用实际的密码
    database = "jrrg_framework_db"
    port = 3306
    
    # 执行用户画像相关的SQL文件
    sql_file = "user_profile_tables.sql"
    
    if os.path.exists(sql_file):
        execute_sql_file(host, user, password, database, port, sql_file)
    else:
        print(f"SQL文件 {sql_file} 不存在")

if __name__ == "__main__":
    main() 