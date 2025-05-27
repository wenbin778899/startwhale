# NJU《金融软工》课程项目框架后端部分

该项目是南京大学《金融软工》课程的项目框架的后端项目，前端见：[codingwang/jrrg_framework_frontend](https://gitee.com/coding-wang/jrrg_framework_frontend)

## 项目简介
本项目模板以`Python3.10`作为主语言，采用`Flask`框架进行核心开发，通过`Flask-SQLalchemy`操作数据库，通过
`Flask-JWT-Extended`进行jwt校验与令牌分发，通过`bcrypt`进行密码加密，通过`python-dotenv`进行服务配置。
## 环境准备

本项目使用python3.10开发，所需要的环境在根目录下的`requirements.txt`文件中，你需要通过如下的方式创建并配置好环境：

1. 安装Anaconda或Miniconda，注意如果要在WSL中安装，最好不要使用PyCharm2024，否则会出现进程无法终止的情况（教程见：https://blog.csdn.net/Natsuago/article/details/143081283）

2. 通过如下命令创建一个虚拟环境（名称可自拟）

   ```shell
   conda create -n jrrg python==3.10
   ```

3. 进入到项目根目录（也即确保能直接访问`requirements.txt`），并执行如下命令

   ```shell
   pip install -r requirements.txt
   ```

   如果出现网络问题，通常是代理的问题，可以关闭或开启代理重试。（也可以换源，但是不能保证所有的数据源都有对应版本的库）。

## 运行与部署

### 数据库配置

由于本项目使用的是MySQL数据库，并针对用户业务进行了相关演示，所以对用户表字段进行了一些硬编码操作（详见`app/models/user.py`）这意味着你需要进行一些前置准备工作：

1. 安装MySQL，可以直接在本地进行安装，也可以使用docker进行安装（不建议），设置好用户名以及密码，尤其要记住root用户的密码。

2. 创建一个对应的数据库以及对应的一张用户表，其命令如下：

   ```mysql
   create database jrrg_framework_db;
   use jrrg_framework_db;
   create table user
   (
       id       int auto_increment
           primary key,
       username varchar(255) not null,
       password varchar(60)  not null,
       nickname varchar(255) null,
       email    varchar(255) null,
       phone    varchar(11)  null,
       constraint user_pk
           unique (username)
   );
   ```

3. 修改`/app.env`文件，主要修改如下的一行：

   ```
   SQLALCHEMY_DATABASE_URI=mysql+mysqlconnector://root:root@localhost:3306/jrrg_framework_db
   # SQLALCHEMY_DATABASE_URI=mysql+mysqlconnector://root:root用户的密码@MySQL所在主机的IP地址:MySQL服务的端口（默认3306）/数据库名称
   ```

   如果你自定以了数据库名称以及表名，你需要修改相应的内容。

### 服务配置

由于整个框架是前后端分离的，这意味着前端需要知道后端的IP地址和暴露端口号，在本框架中，后端默认暴露的IP地址和端口分别是`localhost`和`8080`，你可以通过修改`/app/app.py`来进行修改，如下修改为`8081`

```python
from app import create_app

if __name__ == '__main__':
    # 创建应用
    app = create_app()
    # 运行
    app.run(host='localhost', port=8081)
```

**注意1：如果是通过PyCharm提供的Flask项目创建的，app.run()的方式将不起作用，你需要进行额外配置（详见教程：[flask 修改访问的ip及端口号_flask修改端口-CSDN博客](https://blog.csdn.net/jumptigerfu/article/details/123127945)）**

**注意2：如果你修改了后端的IP地址和端口，那么前端应当做同样的修改**



## 接口文档

本框架提供的接口文档示例见https://www.yuque.com/codingwang/fk202b/xw9cf0ad5gdwb7pf?singleDoc# 《接口文档示例》。

你应当如示例所示格式编写接口文档，推荐直接通过“语雀”进行操作（可以多人协作）。



## 提醒

由于本项目只是一个示例，所以在Gitee中将`/app.env`提供了出来，实际该文件可能存储了许多敏感信息，例如你的MySQL数据库可能是暴露在公网环境下的，此时不应当将提供出来，同理像阿里云OSS的秘钥等内容也不应当将其提供出来。