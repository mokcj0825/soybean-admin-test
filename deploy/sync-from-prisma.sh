#!/bin/bash

# ==============================================================================
# 同步 Prisma Migrations 到演示 SQL 脚本
# ==============================================================================
# 
# 用途：从 backend/prisma/migrations/ 生成 deploy/postgres/*.sql
# 原理：创建临时数据库 → 应用 Prisma migrations → 导出 SQL
# 
# 使用方法：
#   ./deploy/sync-from-prisma.sh          # 正常同步
#   ./deploy/sync-from-prisma.sh --check  # 仅检查是否同步（CI 用）
# 
# ==============================================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查模式
CHECK_ONLY=false
if [ "$1" == "--check" ] || [ "$1" == "--check-only" ]; then
    CHECK_ONLY=true
fi

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}同步 Prisma Migrations 到演示 SQL${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# 检查依赖
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ 错误: 未安装 Docker${NC}"
    exit 1
fi

cd "$(dirname "$0")/.."  # 切换到项目根目录

# 检查 Prisma migrations 是否存在
if [ ! -d "backend/prisma/migrations" ]; then
    echo -e "${RED}❌ 错误: backend/prisma/migrations 目录不存在${NC}"
    exit 1
fi

# 生成临时名称
TIMESTAMP=$(date +%s)
TEMP_DB="temp_prisma_sync_${TIMESTAMP}"
TEMP_CONTAINER="temp_postgres_${TIMESTAMP}"
TEMP_PORT=$((15432 + RANDOM % 1000))

echo -e "${YELLOW}📋 配置信息:${NC}"
echo "   临时数据库: ${TEMP_DB}"
echo "   临时容器: ${TEMP_CONTAINER}"
echo "   临时端口: ${TEMP_PORT}"
echo ""

# 清理函数
cleanup() {
    echo -e "${YELLOW}🧹 清理临时资源...${NC}"
    docker rm -f ${TEMP_CONTAINER} 2>/dev/null || true
    echo -e "${GREEN}✓ 清理完成${NC}"
}

# 设置退出时自动清理
trap cleanup EXIT

# 1. 启动临时 PostgreSQL 容器
echo -e "${YELLOW}🚀 启动临时 PostgreSQL 容器...${NC}"
docker run -d \
    --name ${TEMP_CONTAINER} \
    -e POSTGRES_PASSWORD=temp_password \
    -e POSTGRES_USER=temp_user \
    -e POSTGRES_DB=${TEMP_DB} \
    -p ${TEMP_PORT}:5432 \
    postgres:16.3 > /dev/null

# 等待数据库就绪
echo -e "${YELLOW}⏳ 等待数据库启动...${NC}"
sleep 5

for i in {1..30}; do
    if docker exec ${TEMP_CONTAINER} pg_isready -U temp_user -d ${TEMP_DB} > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 数据库已就绪${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ 错误: 数据库启动超时${NC}"
        exit 1
    fi
    sleep 1
done
echo ""

# 2. 应用 Prisma migrations
echo -e "${YELLOW}🔄 应用 Prisma migrations...${NC}"
cd backend

DATABASE_URL="postgresql://temp_user:temp_password@localhost:${TEMP_PORT}/${TEMP_DB}?schema=public" \
    pnpm prisma migrate deploy

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 错误: Prisma migrate deploy 失败${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Migrations 应用成功${NC}"
echo ""

cd ..

# 3. 导出 SQL
echo -e "${YELLOW}📤 导出 SQL 脚本...${NC}"

# 创建临时目录
TEMP_DIR=$(mktemp -d)

# 导出 schema（表结构）
docker exec ${TEMP_CONTAINER} \
    pg_dump -U temp_user \
    --schema-only \
    --no-owner \
    --no-privileges \
    ${TEMP_DB} \
    > ${TEMP_DIR}/01_schema.sql

# 导出 data（数据）- 如果运行了 seed
docker exec ${TEMP_CONTAINER} \
    pg_dump -U temp_user \
    --data-only \
    --no-owner \
    --no-privileges \
    ${TEMP_DB} \
    > ${TEMP_DIR}/02_data.sql

echo -e "${GREEN}✓ SQL 导出成功${NC}"
echo ""

# 4. 添加元数据注释
cat > ${TEMP_DIR}/00_metadata.sql << EOF
-- ==============================================================================
-- 自动生成的演示 SQL 脚本
-- ==============================================================================
-- 
-- ⚠️ 警告：不要手动编辑此文件！
-- 
-- 生成时间: $(date '+%Y-%m-%d %H:%M:%S')
-- 生成工具: deploy/sync-from-prisma.sh
-- 数据来源: backend/prisma/migrations/
-- 
-- 如需更新，请运行：
--   ./deploy/sync-from-prisma.sh
-- 
-- ==============================================================================

EOF

# 5. 检查模式
if [ "$CHECK_ONLY" = true ]; then
    echo -e "${YELLOW}🔍 检查同步状态（CI 模式）...${NC}"
    
    # 比较新旧文件
    DIFF_COUNT=0
    
    for file in ${TEMP_DIR}/*.sql; do
        filename=$(basename $file)
        if [ ! -f "deploy/postgres/$filename" ]; then
            echo -e "${RED}❌ 缺失文件: deploy/postgres/$filename${NC}"
            DIFF_COUNT=$((DIFF_COUNT + 1))
        elif ! diff -q "$file" "deploy/postgres/$filename" > /dev/null 2>&1; then
            echo -e "${RED}❌ 文件不同步: deploy/postgres/$filename${NC}"
            DIFF_COUNT=$((DIFF_COUNT + 1))
        fi
    done
    
    rm -rf ${TEMP_DIR}
    
    if [ $DIFF_COUNT -gt 0 ]; then
        echo ""
        echo -e "${RED}❌ 检查失败: deploy/postgres/*.sql 与 Prisma migrations 不同步！${NC}"
        echo ""
        echo -e "${YELLOW}请运行以下命令更新:${NC}"
        echo "   ./deploy/sync-from-prisma.sh"
        echo ""
        exit 1
    else
        echo -e "${GREEN}✓ 检查通过: deploy/postgres/*.sql 与 Prisma migrations 同步${NC}"
        exit 0
    fi
fi

# 6. 复制文件到目标目录
echo -e "${YELLOW}📋 更新 deploy/postgres/ 目录...${NC}"

# 备份旧文件
if [ -d "deploy/postgres" ] && [ "$(ls -A deploy/postgres/*.sql 2>/dev/null)" ]; then
    BACKUP_DIR="deploy/postgres.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}   备份旧文件到: ${BACKUP_DIR}${NC}"
    mkdir -p ${BACKUP_DIR}
    cp deploy/postgres/*.sql ${BACKUP_DIR}/ 2>/dev/null || true
fi

# 创建目录（如果不存在）
mkdir -p deploy/postgres

# 删除旧的 SQL 文件
rm -f deploy/postgres/*.sql

# 复制新文件
cp ${TEMP_DIR}/*.sql deploy/postgres/

rm -rf ${TEMP_DIR}

echo -e "${GREEN}✓ 文件更新完成${NC}"
echo ""

# 7. 显示摘要
echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}✅ 同步完成！${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""
echo -e "${YELLOW}📁 已更新文件:${NC}"
ls -lh deploy/postgres/*.sql | awk '{print "   " $9 " (" $5 ")"}'
echo ""
echo -e "${YELLOW}📝 后续步骤:${NC}"
echo "   1. 检查生成的 SQL 文件"
echo "   2. 测试演示模式: docker-compose -f docker-compose.demo.yml up -d"
echo "   3. 提交更改:"
echo "      git add deploy/postgres/"
echo "      git commit -m 'Sync demo SQL from Prisma migrations'"
echo ""
echo -e "${YELLOW}💡 提示:${NC}"
echo "   - 演示 SQL 应该随 Prisma migrations 一起提交"
echo "   - CI 会自动检查两者是否同步"
echo ""

