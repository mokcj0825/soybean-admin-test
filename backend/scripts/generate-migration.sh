#!/bin/sh
# 自动生成 Prisma 迁移 SQL 的脚本

set -e

SCHEMA_PATH="${1:-prisma/schema.prisma}"
MIGRATION_NAME="${2:-migration}"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_DIR="prisma/migrations/${TIMESTAMP}_${MIGRATION_NAME}"
MIGRATION_FILE="${MIGRATION_DIR}/migration.sql"

echo "========================================"
echo "生成迁移文件..."
echo "========================================"

# 创建迁移目录
mkdir -p "$MIGRATION_DIR"

# 创建临时文件（使用 prisma 目录，确保有写权限）
TEMP_SCHEMA="prisma/.temp_schema_${TIMESTAMP}.prisma"

echo "拉取当前数据库结构..."
if ! npx prisma db pull --schema "$SCHEMA_PATH" --print > "$TEMP_SCHEMA" 2>&1; then
    echo "========================================"
    echo "错误：无法连接到数据库或拉取 schema"
    echo "========================================"
    rm -f "$TEMP_SCHEMA"
    rm -rf "$MIGRATION_DIR"
    exit 1
fi

# 检查临时 schema 是否生成成功
if [ ! -s "$TEMP_SCHEMA" ]; then
    echo "========================================"
    echo "错误：无法生成临时 schema 文件"
    echo "========================================"
    rm -f "$TEMP_SCHEMA"
    rm -rf "$MIGRATION_DIR"
    exit 1
fi

echo "生成增量迁移 SQL..."
if ! npx prisma migrate diff \
    --from-schema-datamodel "$TEMP_SCHEMA" \
    --to-schema-datamodel "$SCHEMA_PATH" \
    --script > "$MIGRATION_FILE" 2>&1; then
    echo "========================================"
    echo "错误：生成迁移 SQL 失败"
    echo "========================================"
    cat "$MIGRATION_FILE"
    rm -f "$TEMP_SCHEMA"
    rm -rf "$MIGRATION_DIR"
    exit 1
fi

# 清理临时文件
rm -f "$TEMP_SCHEMA"

# 检查迁移文件是否为空
if [ ! -s "$MIGRATION_FILE" ]; then
    echo "========================================"
    echo "警告：未检测到 schema 变更（迁移文件为空）"
    echo "========================================"
    rm -rf "$MIGRATION_DIR"
    exit 1
fi

# 检查是否只有空白字符
if ! grep -q '[^[:space:]]' "$MIGRATION_FILE"; then
    echo "========================================"
    echo "警告：未检测到 schema 变更（迁移文件只有空白）"
    echo "========================================"
    rm -rf "$MIGRATION_DIR"
    exit 1
fi

echo "========================================"
echo "迁移文件已生成: $MIGRATION_FILE"
echo "========================================"
echo "文件内容预览："
echo "--------"
head -20 "$MIGRATION_FILE"
echo "--------"
echo ""
echo "完整路径: $MIGRATION_FILE"
echo "确认无误后执行: make deploy_migration"

