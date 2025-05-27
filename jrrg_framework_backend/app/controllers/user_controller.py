import logging

from flask import Blueprint, current_app
from flask import request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import re

from app.models import db, User
import app.utils as utils

# flask提供Blueprint用于将一个项目按照功能模块拆分，这样一来路由就不需要全部写在app.py中了
# NOTE 项目开发规范：妥善将项目功能进行拆分，便于分工，常用的做法是根据功能对象，例如所有与user相关的接口都放在user_controller.py文件中
# 如下则是创建了一个名为user_controller的蓝图（固定写法），并返回一个名为user_controller的蓝图对象（将来在app.py中使用它）
user_controller = Blueprint('user_controller', __name__)


# 统一为每个请求打印日志，通过"蓝图.before_request"和"蓝图.after_request"
@user_controller.before_request
def log_request_info():
    current_app.logger.info(f"收到请求: {request.method} {request.url}")
@user_controller.after_request
def log_response_info(response):
    current_app.logger.info(f"响应状态码: {response.status_code}")
    return response


# 使用蓝图之后，定义路由的方式稍微有些变化（仅在于从app变成了对应的Blueprint而已）
# NOTE RESTful风格规范：在定义接口时要根据接口功能选择合适请求方式：GET用于查询、POST用于操作或新增、PUT用于更新、DELETE用于删除等
@user_controller.post('/login')
def user_login():
    """
    处理用户登录
    """
    # 获取用户数据并校验参数
    login_data = request.get_json()
    username, password = login_data['username'], login_data['password']
    if not username or not password:
        return utils.error("参数不合法")

    # 根据username查询出对应记录，由于我们知道username一定是唯一的，所以直接取第一个即可
    db_user = db.session.query(User).filter_by(username=username).first()
    # 验证username是否存在，并且验证传入的密码是否与数据库中的密码"一致"
    if not db_user or not utils.check(password, db_user.password):
        return utils.error(message="用户名或密码不正确", code=401)

    # 到此验证成功
    # 创建jwt，这里需要使用强转（因为identity要求传入的参数必须为str），额外的信息可以通过additional_claims来获得，切记不要传入password
    token = create_access_token(identity=str(db_user.id), additional_claims={"user_info": {
        "id": db_user.id,
        "username": db_user.username,
        "nickname": db_user.nickname,
        "email": db_user.email,
        "phone": db_user.phone,
    }})
    # 只需要返回code=200即可
    return utils.success(data=token)


@user_controller.post('/logout')
# jwt_required装饰器，添加了该装饰器的controller要求必须携带jwt令牌，并且在controller内部可以通过get_jwt_identity()获取之前存储在其中的用户信息（本例中是id）
@jwt_required()
def user_logout():
    """
    处理用户登出，如果后端实现需要用到Redis，所以这里实际上只返回一个200，具体由前端实现
    """
    # Flask框架提供了current_app变量在其他蓝图中输出日志
    current_app.logger.info("用户id=%s", get_jwt_identity())
    return utils.success()


def validate_register_data(register_data):
    """
    校验注册数据的工具函数
    :param register_data: Dict 前端提交的用户注册的数据
    :return: 数据是否满足校验标准
    """
    # 定义校验邮箱和中国大陆手机号的正则表达式
    email_pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    phone_pattern = r'^1[3-9]\d{9}$'
    # 主要是校验各个字段不能为空，并且长度介于1~255之间
    if not "username" in register_data or not "password" in register_data or not "phone" in register_data or not "email" in register_data or not "phone" in register_data:
        return False
    if not register_data["username"] or len(register_data["username"]) > 255 or not register_data["password"] or len(register_data["password"]) > 255 or not register_data["nickname"] or len(register_data["nickname"]) > 255 or not register_data["email"] or re.match(email_pattern, register_data["email"]) is None or not register_data["phone"] or re.match(phone_pattern, register_data["phone"]) is None:
        return False
    return True

@user_controller.post('/register')
def user_register():
    """
    处理用户注册
    """
    # 获取数据
    register_data = request.get_json(force=True)
    # NOTE 更规范的做法是使用类似于marshmallow的参数校验库，但为了方便上手这里采用手动校验
    if not validate_register_data(register_data):
        # 校验失败则返回
        return utils.error("参数不合法")
    user = User(username=register_data['username'], password=register_data['password'], email=register_data['email'], nickname=register_data['nickname'], phone=register_data['phone'])
    # 为password加密
    user.password = utils.encrypt(user.password)
    # 操作数据库
    db.session.add(user)
    db.session.commit() # 别忘了commit
    # 返回操作成功
    return utils.success()

@user_controller.get('/info')
@jwt_required()
def get_user_info():
    """
    获取当前登录用户的信息
    """
    # 从jwt中获取当前用户的ID
    current_user_id = get_jwt_identity()
    try:
        # 根据用户ID查询用户信息
        user = db.session.query(User).filter_by(id=current_user_id).first()
        
        # 如果找不到用户，返回404错误
        if not user:
            return utils.error(message="用户不存在", code=404, status=404)
        
        # 组装用户信息并返回
        user_info = {
            "id": user.id,
            "username": user.username,
            "nickname": user.nickname,
            "email": user.email,
            "phone": user.phone
        }
        
        return utils.success(data=user_info)
    except Exception as e:
        current_app.logger.error(f"获取用户信息失败: {str(e)}")
        return utils.error(message="获取用户信息失败", code=500, status=500)

@user_controller.get('/info/<int:user_id>')
@jwt_required()
def get_user_info_by_id(user_id):
    """
    根据用户ID获取用户的信息
    """
    try:
        # 查询指定ID的用户信息
        user = db.session.query(User).filter_by(id=user_id).first()
        
        # 如果找不到用户，返回404错误
        if not user:
            return utils.error(message="用户不存在", code=404, status=404)
        
        # 组装用户信息并返回(注意不包含敏感信息)
        user_info = {
            "id": user.id,
            "username": user.username,
            "nickname": user.nickname,
            "email": user.email,
            "phone": user.phone
        }
        
        return utils.success(data=user_info)
    except Exception as e:
        current_app.logger.error(f"获取用户信息失败: {str(e)}")
        return utils.error(message="获取用户信息失败", code=500, status=500)
