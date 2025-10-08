# 项目命名规范

## 两种模式的命名

本项目有两种使用模式，使用不同的命名前缀：

### 🛠️ 开发模式（Dev Mode）
- **前缀**: `sds-local`
- **用途**: 实际开发、团队协作、生产准备
- **命令**: `docker-compose up -d`

### 🎭 演示模式（Demo Mode）
- **前缀**: `sds-demo`
- **用途**: 快速演示、产品展示、非开发用途
- **命令**: `docker-compose -f docker-compose.demo.yml up -d`

---

## 开发模式命名规范（sds-local）

本项目开发环境的所有 Docker 相关资源统一使用 **`sds-local`** 作为标识前缀。

## 命名规则

### 1. Docker Compose 项目名
- **配置文件**：`docker-compose.yml`
- **项目名**：`sds-local`
- **设置方式**：在 `.env` 文件中 `COMPOSE_PROJECT_NAME=sds-local`

### 2. 容器名称
- **Postgres**: `sds-local-postgres-1`
- **Redis**: `sds-local-redis-1`
- **Backend**: `sds-local-backend-1`
- **Frontend**: `sds-local-frontend-1`
- **PgBouncer**: `sds-local-pgbouncer`
- **DB-Init**: `sds-local-db-init-1`

### 3. Docker 网络
- **网络名**: `sds-local`

### 4. Docker 卷
- **Postgres 数据**: `sds-local-postgres_data`
- **Redis 数据**: `sds-local-redis_data`

## 命令示例

### 查看所有容器
\`\`\`bash
docker-compose ps
\`\`\`

### 查看特定容器日志
\`\`\`bash
docker-compose logs postgres
docker-compose logs redis
docker-compose logs backend
\`\`\`

### 进入容器
\`\`\`bash
docker-compose exec postgres bash
docker-compose exec redis sh
\`\`\`

### 查看网络
\`\`\`bash
docker network ls | grep sds-local
\`\`\`

### 查看卷
\`\`\`bash
docker volume ls | grep sds-local
\`\`\`

## 为什么使用 sds-local？

1. **统一性** - 所有资源使用相同前缀，易于识别
2. **避免冲突** - 不会与其他项目冲突
3. **简化操作** - 无需使用 `-p` 参数指定项目名
4. **清晰管理** - 快速识别哪些资源属于本项目

## 注意事项

⚠️ **重要**：
- 不要修改 `docker-compose.yml` 中的 `name: sds-local`
- 不要在 `.env` 文件中修改 `COMPOSE_PROJECT_NAME`
- 所有 docker-compose 命令会自动使用 `sds-local` 项目名

## 清理资源

如需完全删除项目所有资源：

\`\`\`bash
# 停止并删除容器、网络、卷
docker-compose down -v

# 或手动清理
docker rm -f $(docker ps -a | grep sds-local | awk '{print $1}')
docker network rm sds-local 2>/dev/null || true
docker volume rm sds-local-postgres_data sds-local-redis_data 2>/dev/null || true
\`\`\`
