#!/bin/bash

# ==============================================================================
# 清理演示环境（Clean State）
# ==============================================================================
# 
# 用途：停止演示环境并删除所有数据，回到干净状态
# 注意：不删除 Docker 镜像（保留以便快速重启）
# 
# 使用方法：
#   ./demo-clean.sh
# 
# ==============================================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}清理演示环境（Clean State）${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# 检查演示环境是否在运行
if docker-compose -f docker-compose.demo.yml ps | grep -q "Up"; then
    echo -e "${YELLOW}📋 演示环境正在运行，准备停止...${NC}"
    echo ""
else
    echo -e "${YELLOW}📋 演示环境未运行${NC}"
    echo ""
fi

# 停止并删除容器、网络、卷
echo -e "${YELLOW}🧹 停止容器并删除数据...${NC}"
docker-compose -f docker-compose.demo.yml down -v

echo -e "${GREEN}✓ 容器已停止${NC}"
echo -e "${GREEN}✓ 网络已删除${NC}"
echo -e "${GREEN}✓ 数据卷已删除${NC}"
echo ""

# 验证清理
echo -e "${YELLOW}🔍 验证清理结果...${NC}"

# 检查容器
CONTAINERS=$(docker ps -a | grep sds-demo | wc -l)
if [ "$CONTAINERS" -eq 0 ]; then
    echo -e "${GREEN}✓ 无残留容器${NC}"
else
    echo -e "${YELLOW}⚠ 发现 ${CONTAINERS} 个容器残留${NC}"
    docker ps -a | grep sds-demo
fi

# 检查网络
NETWORKS=$(docker network ls | grep sds-demo | wc -l)
if [ "$NETWORKS" -eq 0 ]; then
    echo -e "${GREEN}✓ 无残留网络${NC}"
else
    echo -e "${YELLOW}⚠ 发现 ${NETWORKS} 个网络残留${NC}"
    docker network ls | grep sds-demo
fi

# 检查卷
VOLUMES=$(docker volume ls | grep sds-demo | wc -l)
if [ "$VOLUMES" -eq 0 ]; then
    echo -e "${GREEN}✓ 无残留数据卷${NC}"
else
    echo -e "${YELLOW}⚠ 发现 ${VOLUMES} 个数据卷残留${NC}"
    docker volume ls | grep sds-demo
fi

echo ""
echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}✅ 清理完成！${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""
echo -e "${YELLOW}📝 状态：${NC}"
echo "   - 容器：已删除"
echo "   - 网络：已删除"
echo "   - 数据卷：已删除"
echo "   - 镜像：已保留（用于快速重启）"
echo ""
echo -e "${YELLOW}🚀 下次启动：${NC}"
echo "   docker-compose -f docker-compose.demo.yml up -d"
echo "   （将使用全新的数据）"
echo ""

