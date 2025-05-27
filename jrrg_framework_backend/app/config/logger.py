import logging


def register_logger(app):
    """
    配置日志
    """
    # 清除Flask默认提供的日志输出
    app.logger.handlers = []
    # 控制台输出
    handler = logging.StreamHandler()
    # 设置日志级别
    handler.setLevel(logging.INFO)
    # 日志输出格式
    formatter = logging.Formatter(
        '[%(asctime)s] - [%(levelname)s] - [%(filename)s:%(lineno)d] : %(message)s'
    )
    handler.setFormatter(formatter)

    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)  # 也可以用 DEBUG, WARNING, ERROR

    return app