# 后端单元测试

本目录包含了jrrg项目后端的单元测试文件。

## 测试内容

- `test_user_api.py`: 测试用户相关的API接口，包括登录、注册、获取用户信息等

## 安装依赖

在项目根目录下运行以下命令安装测试所需的依赖：

```bash
pip install -r tests/requirements_test.txt
```

## 运行测试

在项目根目录下运行以下命令执行所有测试：

```bash
pytest tests/
```

运行特定的测试文件：

```bash
pytest tests/test_user_api.py
```

运行特定的测试函数：

```bash
pytest tests/test_user_api.py::test_login_success
```

## 生成测试覆盖率报告

```bash
pytest --cov=app tests/
```

生成HTML格式的覆盖率报告：

```bash
pytest --cov=app --cov-report=html tests/
```

覆盖率报告将生成在`htmlcov`目录下，可以通过浏览器打开`htmlcov/index.html`查看。 