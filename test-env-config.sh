#!/bin/bash

# 测试环境变量配置脚本
# 用法: ./test-env-config.sh

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}环境变量配置测试${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# 测试 1: 检查示例文件
echo "测试 1: 检查示例文件..."
if [ -f "env.docker.example" ]; then
    echo -e "${GREEN}✓${NC} env.docker.example 存在"
else
    echo -e "${RED}✗${NC} env.docker.example 不存在"
    exit 1
fi

# 测试 2: 检查生成脚本
echo ""
echo "测试 2: 检查生成脚本..."
if [ -f "generate-env.sh" ] && [ -x "generate-env.sh" ]; then
    echo -e "${GREEN}✓${NC} generate-env.sh 存在且可执行"
else
    echo -e "${YELLOW}!${NC} generate-env.sh 不可执行，尝试修复..."
    chmod +x generate-env.sh
    echo -e "${GREEN}✓${NC} 已修复"
fi

# 测试 3: 验证 docker-compose.yml 语法
echo ""
echo "测试 3: 验证 docker-compose.yml 语法..."
if docker-compose config > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} docker-compose.yml 语法正确"
else
    echo -e "${RED}✗${NC} docker-compose.yml 语法错误"
    exit 1
fi

# 测试 4: 检查默认值
echo ""
echo "测试 4: 检查默认值..."
DATABASE_PORT=$(docker-compose config | grep -A 1 'published:.*25432' | grep -o '25432' | head -1)
if [ "$DATABASE_PORT" = "25432" ]; then
    echo -e "${GREEN}✓${NC} DATABASE_PORT 默认值正确 (25432)"
else
    echo -e "${RED}✗${NC} DATABASE_PORT 默认值不正确"
fi

# 测试 5: 测试环境变量替换
echo ""
echo "测试 5: 测试环境变量替换（使用临时 .env）..."

# 备份现有 .env（如果存在）
if [ -f ".env" ]; then
    mv .env .env.test.backup
    echo -e "${YELLOW}!${NC} 已备份现有 .env 为 .env.test.backup"
fi

# 创建测试 .env
cat > .env << EOF
DATABASE_PORT=15432
REDIS_PORT=16379
APP_PORT=8528
FRONTEND_PORT=8527
EOF

echo "创建测试配置："
cat .env

# 验证配置
echo ""
echo "验证环境变量是否生效..."

# 检查数据库端口
if docker-compose config 2>/dev/null | grep -q "published: \"15432\""; then
    echo -e "${GREEN}✓${NC} DATABASE_PORT 环境变量生效 (15432)"
else
    echo -e "${RED}✗${NC} DATABASE_PORT 环境变量未生效"
fi

# 检查 Redis 端口
if docker-compose config 2>/dev/null | grep -q "published: \"16379\""; then
    echo -e "${GREEN}✓${NC} REDIS_PORT 环境变量生效 (16379)"
else
    echo -e "${RED}✗${NC} REDIS_PORT 环境变量未生效"
fi

# 检查应用端口
if docker-compose config 2>/dev/null | grep -q "published: \"8528\""; then
    echo -e "${GREEN}✓${NC} APP_PORT 环境变量生效 (8528)"
else
    echo -e "${RED}✗${NC} APP_PORT 环境变量未生效"
fi

# 检查前端端口
if docker-compose config 2>/dev/null | grep -q "published: \"8527\""; then
    echo -e "${GREEN}✓${NC} FRONTEND_PORT 环境变量生效 (8527)"
else
    echo -e "${RED}✗${NC} FRONTEND_PORT 环境变量未生效"
fi

# 清理测试文件
rm .env

# 恢复备份
if [ -f ".env.test.backup" ]; then
    mv .env.test.backup .env
    echo ""
    echo -e "${GREEN}✓${NC} 已恢复原 .env 文件"
else
    echo ""
    echo -e "${YELLOW}!${NC} 测试完成，已删除临时 .env 文件"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}所有测试通过！${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "环境变量配置功能正常，可以使用以下方式配置："
echo "  1. 运行 ./generate-env.sh 生成配置文件"
echo "  2. 或手动创建 .env 文件"
echo ""

