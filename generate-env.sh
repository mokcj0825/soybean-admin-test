#!/bin/bash

# Docker Compose 环境变量生成脚本
# 用法: ./generate-env.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Docker Compose 环境变量生成器${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# 检查 .env 文件是否已存在
if [ -f ".env" ]; then
    echo -e "${YELLOW}警告: .env 文件已存在${NC}"
    echo -e "当前配置："
    echo "----------------------------------------"
    cat .env
    echo "----------------------------------------"
    echo ""
    read -p "是否覆盖现有配置? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}操作已取消${NC}"
        exit 0
    fi
    # 备份现有文件
    cp .env .env.backup
    echo -e "${GREEN}已备份现有配置到 .env.backup${NC}"
fi

# 检查示例文件是否存在
if [ ! -f "env.docker.example" ]; then
    echo -e "${RED}错误: 找不到 env.docker.example 文件${NC}"
    echo "请确保在项目根目录下运行此脚本"
    exit 1
fi

echo "请选择配置模式："
echo "  1) 使用默认配置（推荐，快速开始）"
echo "  2) 交互式配置（自定义端口和密码）"
echo "  3) 直接复制示例文件"
read -p "请输入选项 (1-3): " -n 1 -r choice
echo ""
echo ""

case $choice in
    1)
        echo -e "${GREEN}使用默认配置...${NC}"
        cp env.docker.example .env
        echo -e "${GREEN}✓ .env 文件已创建（使用默认配置）${NC}"
        ;;
    2)
        echo -e "${GREEN}交互式配置${NC}"
        echo "请输入配置值（直接按回车使用默认值）"
        echo ""
        
        # 数据库配置
        echo -e "${YELLOW}数据库配置${NC}"
        read -p "PostgreSQL 端口 (默认: 25432): " db_port
        db_port=${db_port:-25432}
        
        read -p "数据库用户名 (默认: soybean): " db_user
        db_user=${db_user:-soybean}
        
        read -p "数据库密码 (默认: soybean@123.): " db_pass
        db_pass=${db_pass:-"soybean@123."}
        
        read -p "数据库名称 (默认: soybean-admin-nest-backend): " db_name
        db_name=${db_name:-"soybean-admin-nest-backend"}
        
        echo ""
        # Redis 配置
        echo -e "${YELLOW}Redis 配置${NC}"
        read -p "Redis 端口 (默认: 26379): " redis_port
        redis_port=${redis_port:-26379}
        
        read -p "Redis 密码 (默认: 123456): " redis_pass
        redis_pass=${redis_pass:-123456}
        
        echo ""
        # 应用配置
        echo -e "${YELLOW}应用配置${NC}"
        read -p "后端端口 (默认: 9528): " app_port
        app_port=${app_port:-9528}
        
        read -p "前端端口 (默认: 9527): " frontend_port
        frontend_port=${frontend_port:-9527}
        
        echo ""
        # JWT 配置
        echo -e "${YELLOW}JWT 配置（生产环境建议自定义）${NC}"
        read -p "JWT 密钥 (默认: 使用示例密钥): " jwt_secret
        jwt_secret=${jwt_secret:-"JWT_SECRET-soybean-admin-nest@123456!@#."}
        
    # 生成配置文件
    cat > .env << EOF
# ===========================================
# Docker Compose 环境变量配置
# ===========================================
# 由 generate-env.sh 生成

# ===========================================
# Docker Compose 项目配置
# ===========================================
COMPOSE_PROJECT_NAME=sds-local

# ===========================================
# 数据库配置 (PostgreSQL)
# ===========================================
POSTGRES_USER=${db_user}
POSTGRES_PASSWORD=${db_pass}
POSTGRES_DB=${db_name}
DATABASE_PORT=${db_port}
DATABASE_INTERNAL_PORT=5432

# ===========================================
# Redis 配置
# ===========================================
REDIS_PASSWORD=${redis_pass}
REDIS_PORT=${redis_port}
REDIS_INTERNAL_PORT=6379
REDIS_DB=1

# ===========================================
# 后端配置 (Backend)
# ===========================================
BACKEND_PORT=${app_port}
NODE_ENV=production
DOC_SWAGGER_ENABLE=true
DOC_SWAGGER_PATH=api-docs
CASBIN_MODEL=model.conf

# ===========================================
# JWT 配置
# ===========================================
JWT_SECRET=${jwt_secret}
JWT_EXPIRE_IN=3600
REFRESH_TOKEN_SECRET=REFRESH_TOKEN_EXPIRE_IN-soybean-admin-nest@123456!@#.
REFRESH_TOKEN_EXPIRE_IN=7200

# ===========================================
# 前端配置 (Frontend)
# ===========================================
FRONTEND_PORT=${frontend_port}

# ===========================================
# PgBouncer 配置
# ===========================================
PGBOUNCER_PORT=6432

# ===========================================
# 时区配置
# ===========================================
TZ=Asia/Shanghai
EOF
        echo -e "${GREEN}✓ .env 文件已创建（自定义配置）${NC}"
        ;;
    3)
        cp env.docker.example .env
        echo -e "${GREEN}✓ .env 文件已创建（复制自示例文件）${NC}"
        echo -e "${YELLOW}请手动编辑 .env 文件进行自定义${NC}"
        ;;
    *)
        echo -e "${RED}无效的选项${NC}"
        exit 1
        ;;
esac

# ================================================
# 自动同步 backend/.env 文件
# ================================================
echo ""
echo -e "${YELLOW}正在同步 backend/.env 配置...${NC}"

# 从 .env 文件读取配置
if [ -f ".env" ]; then
    # 读取变量
    export $(cat .env | grep -E "^(POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB|DATABASE_PORT)=" | xargs)
    
    # 生成 backend/.env
    cat > backend/.env << EOF
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${DATABASE_PORT}/${POSTGRES_DB}?schema=public"
#使用pgbouncer请打开以下注释
#DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:6432/${POSTGRES_DB}?schema=public&pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${DATABASE_PORT}/${POSTGRES_DB}?schema=public"
EOF
    
    echo -e "${GREEN}✓ backend/.env 文件已自动同步${NC}"
else
    echo -e "${RED}✗ 无法找到 .env 文件，跳过 backend/.env 同步${NC}"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}配置完成！${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "当前配置："
echo "----------------------------------------"
cat .env
echo "----------------------------------------"
echo ""
echo "接下来的步骤："
echo "  1. 检查 .env 文件配置是否正确"
echo "  2. 运行: docker-compose -p soybean-admin-nest up -d"
echo "  3. 访问: http://localhost:${frontend_port:-9527}"
echo ""
echo -e "${YELLOW}提示:${NC}"
echo "  - 如需修改配置，请编辑 .env 文件后运行: docker-compose down && docker-compose up -d"
echo "  - 理解端口配置: 查看 DOCKER_NETWORKING_PORTS.md"
echo ""

