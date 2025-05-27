from app import create_app

if __name__ == '__main__':
    # 创建应用
    app = create_app()
    # 运行
    app.run(host='localhost', port=8080)