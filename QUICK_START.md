# 🚀 快速开始

> 🤔 **不确定选哪个？** 
> - 只想快速体验 → [场景 A](#场景-a我想快速看看效果5秒启动)（5秒启动）
> - 要实际开发 → [场景 B](#场景-b我要实际开发)（完整环境）
> - 了解原理 → [README_V2.md - 为什么需要两种模式](README_V2.md#为什么需要两种模式)

---

##  场景 A：我想快速看看效果（5秒启动）

```bash
# 启动演示环境
docker-compose -f docker-compose.demo.yml up -d

# 访问
# 前端: http://localhost:9527
# 后端: http://localhost:9528/api-docs
# 账号: demo / demo123

# 清理（Clean State - 推荐）
./demo-clean.sh        # Linux/macOS
demo-clean.bat         # Windows

# 或手动：
docker-compose -f docker-compose.demo.yml down -v
```

**特点**: ⚡ 快速启动、📦 预设数据、💨 不保存修改

---

##  场景 B：我要实际开发

### 1. 生成配置

```bash
./generate-env.sh  # Linux/macOS
# 或
generate-env.bat   # Windows
```

### 2. 启动服务

```bash
docker-compose up -d
```

### 3. 初始化数据库（首次）

```bash
cd backend
pnpm install
pnpm prisma migrate deploy
pnpm prisma db seed
```

### 4. 访问

- 前端: http://localhost:9527
- 后端: http://localhost:9528/api-docs
- 账号: admin / admin123

---

## 📚 详细文档

- [README_V2.md](README_V2.md) - 完整开发指南
- [DOCKER_NETWORKING_PORTS.md](DOCKER_NETWORKING_PORTS.md) - Docker 网络说明
- [deploy/postgres/README.md](deploy/postgres/README.md) - 演示 SQL 说明

---

## 🔄 修改数据库结构

```bash
# 1. 修改 schema
cd backend
vim prisma/schema.prisma

# 2. 生成迁移
pnpm prisma migrate dev --name your_change

# 3. 同步演示 SQL
cd ..
./deploy/sync-from-prisma.sh

# 4. 提交
git add backend/prisma/ deploy/postgres/
git commit -m "Add your_change"
```

---

## ❓ 常见命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend

# 重启服务
docker-compose restart backend

# 停止所有服务
docker-compose down

# 完全清理（包括数据）
docker-compose down -v
```

---

## 🆘 遇到问题？

1. 检查 [常见问题](README_V2.md#常见问题)
2. 查看 [故障排查](DOCKER_NETWORKING_PORTS.md#故障排查)
3. 提交 [GitHub Issue](https://github.com/your-repo/issues)

