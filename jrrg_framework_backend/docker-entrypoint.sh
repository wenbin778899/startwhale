#!/bin/bash
set -eo pipefail
shopt -s nullglob

# 日志函数
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "启动MySQL容器入口点脚本"

# 如果命令以`mysql`开头，则认为是要启动MySQL服务
if [ "$1" = 'mysqld' ]; then
  log "准备启动MySQL服务"

  # 检查数据目录
  DATADIR="/var/lib/mysql"
  if [ ! -d "$DATADIR/mysql" ]; then
    log "MySQL数据目录不存在，初始化数据库..."

    # 确保数据目录存在
    mkdir -p "$DATADIR"
    chown -R mysql:mysql "$DATADIR"

    # 初始化MySQL数据目录
    mysqld --initialize-insecure --datadir="$DATADIR"
    
    log "MySQL数据目录初始化完成"

    # 创建临时服务器
    log "启动临时MySQL服务器以执行初始化SQL"
    mysqld --datadir="$DATADIR" --skip-networking &
    pid="$!"

    # 等待MySQL启动
    for i in {30..0}; do
      if mysqladmin ping &>/dev/null; then
        break
      fi
      log "等待MySQL启动... $i"
      sleep 1
    done

    if [ "$i" = 0 ]; then
      log "MySQL启动超时"
      exit 1
    fi

    # 设置root密码
    log "设置root用户密码"
    mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';"
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "GRANT ALL ON *.* TO 'root'@'%' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';"
    
    # 创建数据库
    if [ -n "$MYSQL_DATABASE" ]; then
      log "创建数据库: $MYSQL_DATABASE"
      mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DATABASE\`;"
    fi

    # 执行初始化SQL脚本
    if [ -d "/docker-entrypoint-initdb.d" ]; then
      log "执行初始化SQL脚本..."
      for f in /docker-entrypoint-initdb.d/*; do
        case "$f" in
          *.sql)
            log "执行SQL脚本: $f"
            mysql -u root -p"${MYSQL_ROOT_PASSWORD}" "$MYSQL_DATABASE" < "$f"
            ;;
          *.sh)
            log "执行Shell脚本: $f"
            bash "$f"
            ;;
          *)
            log "忽略文件: $f"
            ;;
        esac
      done
    fi

    # 关闭临时服务器
    log "关闭临时MySQL服务器"
    mysqladmin -u root -p"${MYSQL_ROOT_PASSWORD}" shutdown
    wait "$pid"
  fi

  log "准备启动MySQL服务器"
  exec mysqld
else
  # 如果不是启动MySQL服务，则执行传入的命令
  log "执行命令: $@"
  exec "$@"
fi