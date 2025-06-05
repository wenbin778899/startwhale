import os
from app import create_app

if __name__ == '__main__':
    # 创建应用
    app = create_app()
    # 运行，使用环境变量PORT（Railway会自动设置）
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)