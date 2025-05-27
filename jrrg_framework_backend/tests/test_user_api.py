import pytest
import json
from flask import Flask
from app import create_app
from app.models import db, User
import app.utils as utils

@pytest.fixture
def app():
    """创建并配置一个Flask应用实例用于测试"""
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",  # 使用内存数据库进行测试
    })

    # 创建数据库表
    with app.app_context():
        db.create_all()
    
    yield app

    # 测试结束后清理
    with app.app_context():
        db.drop_all()

@pytest.fixture
def client(app):
    """创建测试客户端"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """创建测试命令行运行器"""
    return app.test_cli_runner()

@pytest.fixture
def test_user(app):
    """创建测试用户并返回用户信息"""
    with app.app_context():
        user = User(
            username="testuser",
            password=utils.encrypt("password123"),
            nickname="测试用户",
            email="test@example.com",
            phone="13800138000"
        )
        db.session.add(user)
        db.session.commit()
        return {
            "id": user.id,
            "username": user.username,
            "nickname": user.nickname,
            "email": user.email,
            "phone": user.phone,
            "password": "password123"  # 明文密码，仅用于测试
        }

def test_index_route(client):
    """测试首页路由"""
    response = client.get('/')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["status"] == "ok"
    assert "message" in data
    assert "endpoints" in data

def test_register_success(client):
    """测试用户注册成功"""
    user_data = {
        "username": "newuser",
        "password": "newpassword",
        "nickname": "新用户",
        "email": "new@example.com",
        "phone": "13900139000"
    }
    
    response = client.post('/user/register', 
                          data=json.dumps(user_data),
                          content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["code"] == 0
    
    # 验证用户是否真的被创建
    with client.application.app_context():
        user = User.query.filter_by(username="newuser").first()
        assert user is not None
        assert user.nickname == "新用户"
        assert user.email == "new@example.com"
        assert user.phone == "13900139000"
        # 验证密码是否被正确加密
        assert utils.check("newpassword", user.password)

def test_register_invalid_data(client):
    """测试用户注册失败 - 无效数据"""
    # 缺少必要字段
    invalid_data = {
        "username": "invaliduser",
        "password": "password123"
        # 缺少其他必要字段
    }
    
    response = client.post('/user/register', 
                          data=json.dumps(invalid_data),
                          content_type='application/json')
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data["code"] != 0  # 非零表示错误

def test_login_success(client, test_user):
    """测试用户登录成功"""
    login_data = {
        "username": test_user["username"],
        "password": test_user["password"]
    }
    
    response = client.post('/user/login', 
                          data=json.dumps(login_data),
                          content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["code"] == 0
    assert "data" in data  # 应该包含JWT令牌
    assert data["data"] is not None

def test_login_failure(client, test_user):
    """测试用户登录失败 - 错误密码"""
    login_data = {
        "username": test_user["username"],
        "password": "wrongpassword"
    }
    
    response = client.post('/user/login', 
                          data=json.dumps(login_data),
                          content_type='application/json')
    
    assert response.status_code == 401
    data = json.loads(response.data)
    assert data["code"] != 0

def test_get_user_info(client, test_user):
    """测试获取用户信息 - 需要先登录获取JWT令牌"""
    # 先登录获取令牌
    login_data = {
        "username": test_user["username"],
        "password": test_user["password"]
    }
    
    login_response = client.post('/user/login', 
                               data=json.dumps(login_data),
                               content_type='application/json')
    
    token = json.loads(login_response.data)["data"]
    
    # 使用令牌获取用户信息
    response = client.get('/user/info', 
                         headers={"Authorization": f"Bearer {token}"})
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["code"] == 0
    assert data["data"]["username"] == test_user["username"]
    assert data["data"]["nickname"] == test_user["nickname"]
    assert data["data"]["email"] == test_user["email"]
    assert data["data"]["phone"] == test_user["phone"]

def test_get_user_info_by_id(client, test_user):
    """测试通过ID获取用户信息"""
    # 先登录获取令牌
    login_data = {
        "username": test_user["username"],
        "password": test_user["password"]
    }
    
    login_response = client.post('/user/login', 
                               data=json.dumps(login_data),
                               content_type='application/json')
    
    token = json.loads(login_response.data)["data"]
    
    # 使用令牌获取指定ID的用户信息
    response = client.get(f'/user/info/{test_user["id"]}', 
                         headers={"Authorization": f"Bearer {token}"})
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["code"] == 0
    assert data["data"]["id"] == test_user["id"]
    assert data["data"]["username"] == test_user["username"]

def test_get_user_info_unauthorized(client):
    """测试未授权获取用户信息"""
    response = client.get('/user/info')
    # 应该返回401未授权错误
    assert response.status_code == 401

def test_logout(client, test_user):
    """测试用户登出"""
    # 先登录获取令牌
    login_data = {
        "username": test_user["username"],
        "password": test_user["password"]
    }
    
    login_response = client.post('/user/login', 
                               data=json.dumps(login_data),
                               content_type='application/json')
    
    token = json.loads(login_response.data)["data"]
    
    # 使用令牌登出
    response = client.post('/user/logout', 
                          headers={"Authorization": f"Bearer {token}"})
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["code"] == 0 