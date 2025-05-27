import bcrypt


def encrypt(plaintext: str) -> str:
    """
    通过bcrypt加密算法对传入的文本进行加密（默认加盐12轮）
    :param plaintext: 明文
    :return: 密文
    """
    # 生成盐
    salt = bcrypt.gensalt()
    # 加密并返回
    encrypted_password =  bcrypt.hashpw(plaintext.encode(), salt).decode()
    return encrypted_password

def check(plaintext: str, ciphertext: str) -> bool:
    """
    使用bcrypt算法校验传入的密文对应的明文是否与传入的明文一致
    :param plaintext: 参考明文
    :param ciphertext: 密文
    :return: 是否一致
    """
    return bcrypt.checkpw(plaintext.encode(), ciphertext.encode())