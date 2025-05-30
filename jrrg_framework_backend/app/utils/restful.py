from flask import jsonify

# NOTE 通常除了status之外，还需要增加一个code字段，用于细粒度的返回状态，尤其是当错误时，可以提供不同的错误种类（针对无法由status区分的错误种类），约定成功时code==0，失败时code>=1，具体由业务决定，代表了不同的错误种类

def success(data=None, message="", code=0, status=200, meta=None):
    """封装成功的 JSON 响应，支持元数据"""
    response = {
        "code": code,
        "message": message,
        "data": data or {} # 不要直接返回None（NullPointerDereferenceException），而是返回一个空对象
    }
    
    # 添加元数据，用于分页等信息
    if meta:
        response["meta"] = meta
        
    return jsonify(response), status

def error(message="error", code=1, status=400, data=None):
    """封装错误的 JSON 响应"""
    response = {
        "code": code,
        "message": message,
        "data": data or {}
    }
    return jsonify(response), status