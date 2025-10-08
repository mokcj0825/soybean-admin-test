# Clean vs Purge - 清理方式对比

## 🎯 核心区别

| 操作 | Clean State | Purge |
|------|------------|-------|
| **定义** | 回到初始状态 | 完全清除 |
| **删除容器** | ✅ | ✅ |
| **删除网络** | ✅ | ✅ |
| **删除数据卷** | ✅ | ✅ |
| **删除镜像** | ❌ 保留 | ✅ 删除 |
| **下次启动速度** | ⚡ 快（5-10秒） | 🐢 慢（需重新构建） |
| **适用场景** | 日常使用 | 彻底清理 |

---

## 📋 演示模式（Demo Mode）

### Clean State（推荐）

**命令**：
```bash
# 使用脚本（推荐）
./demo-clean.sh        # Linux/macOS
demo-clean.bat         # Windows

# 或手动
docker-compose -f docker-compose.demo.yml down -v
```

**效果**：
```
删除：
  ✅ sds-demo-postgres 容器
  ✅ sds-demo-redis 容器
  ✅ sds-demo-backend 容器
  ✅ sds-demo-frontend 容器
  ✅ sds-demo 网络
  ✅ PostgreSQL 数据（匿名卷）
  ✅ Redis 数据（匿名卷）

保留：
  ✅ backend 镜像（可复用）
  ✅ frontend 镜像（可复用）
  ✅ postgres:16.3 镜像
  ✅ redis/redis-stack:7.2.0-v11 镜像

下次启动：
  ⚡ 5-10秒（使用缓存的镜像）
  📦 全新数据
```

### Purge（完全清除）

**命令**：
```bash
docker-compose -f docker-compose.demo.yml down -v --rmi all
```

**效果**：
```
删除：
  ✅ 所有容器
  ✅ 所有网络
  ✅ 所有数据卷
  ✅ 所有构建的镜像（backend, frontend）

保留：
  ✅ 基础镜像（postgres:16.3, redis, node）

下次启动：
  🐢 60-120秒（需要重新构建 backend 和 frontend）
  📦 全新数据
```

**何时使用**：
- 🔧 修改了 Dockerfile，需要重新构建
- 💾 磁盘空间不足
- 🧹 长期不使用，彻底清理

---

## 🛠️ 开发模式（Dev Mode）

### Clean State

**命令**：
```bash
docker-compose down -v
```

**效果**：
```
删除：
  ✅ 所有开发环境容器
  ✅ sds-local 网络
  ✅ sds-local-postgres_data 卷
  ✅ sds-local-redis_data 卷
  ⚠️ 数据库所有数据丢失！

保留：
  ✅ 所有镜像

下次启动：
  ⚡ 快速（使用缓存的镜像）
  ⚠️ 需要重新运行迁移和 seed
```

**注意**：开发模式的 Clean 会**删除开发数据**！

**更安全的方式**：
```bash
# 只停止，不删除数据
docker-compose down

# 下次启动，数据还在
docker-compose up -d
```

### Purge

**命令**：
```bash
docker-compose down -v --rmi all
```

**效果**：删除所有（同演示模式）

---

## 🎨 实际使用场景

### 场景 1：演示完毕，清理环境

```bash
# ✅ 使用 Clean State
./demo-clean.sh

# 为什么？
# - 快速清理数据
# - 保留镜像，下次演示可以快速启动
# - 不浪费磁盘空间（镜像可复用）
```

### 场景 2：修改了 Dockerfile

```bash
# ✅ 使用 Purge
docker-compose -f docker-compose.demo.yml down -v --rmi all

# 为什么？
# - 强制重新构建镜像
# - 应用 Dockerfile 的修改
```

### 场景 3：开发环境想重置数据库

```bash
# ✅ 使用 Clean State
docker-compose down -v
docker-compose up -d

# 然后重新运行迁移
cd backend
pnpm prisma migrate deploy
pnpm prisma db seed
```

### 场景 4：每天开发结束

```bash
# ✅ 只停止，不删除
docker-compose down

# 为什么？
# - 保留数据，明天继续开发
# - 不需要重新运行迁移
```

### 场景 5：长期不用，清理磁盘

```bash
# ✅ 使用 Purge
docker-compose down -v --rmi all
docker-compose -f docker-compose.demo.yml down -v --rmi all

# 甚至清理基础镜像
docker system prune -a
```

---

## 📊 命令速查

| 需求 | 命令 | 耗时 |
|------|------|------|
| 演示模式 Clean | `./demo-clean.sh` | 5秒 |
| 演示模式 Purge | `docker-compose -f docker-compose.demo.yml down -v --rmi all` | 5秒 |
| 开发模式 Clean | `docker-compose down -v` | 5秒 |
| 开发模式停止 | `docker-compose down` | 5秒 |
| 开发模式 Purge | `docker-compose down -v --rmi all` | 5秒 |
| 完全清理系统 | `docker system prune -a --volumes` | 10秒 |

---

## 💡 最佳实践

### ✅ 推荐做法

```bash
# 演示模式：每次演示后清理
./demo-clean.sh

# 开发模式：只在需要时清理数据
docker-compose down -v  # 仅当需要重置数据库时

# 平时开发：只停止容器
docker-compose down
```

### ❌ 不推荐

```bash
# 不要每次都 Purge（浪费时间）
docker-compose down --rmi all  # ❌ 太慢

# 不要随意清理开发数据
docker-compose down -v  # ⚠️ 数据丢失
```

---

## 🔍 检查清理结果

```bash
# 查看残留容器
docker ps -a | grep -E "(sds-local|sds-demo)"

# 查看残留网络
docker network ls | grep -E "(sds-local|sds-demo)"

# 查看残留卷
docker volume ls | grep -E "(sds-local|sds-demo)"

# 查看镜像
docker images | grep -E "(sds-|soybean)"

# 查看磁盘使用
docker system df
```

---

## 📚 相关文档

- [README_V2.md](README_V2.md) - 主文档
- [QUICK_START.md](QUICK_START.md) - 快速开始
- [demo-clean.sh](demo-clean.sh) - Clean 脚本源码

---

**记住**：
- 🎭 **演示模式** - 总是用 Clean（`./demo-clean.sh`）
- 🛠️ **开发模式** - 平时只停止（`down`），需要时才 Clean（`down -v`）
- 🧹 **Purge** - 只在必要时使用（修改 Dockerfile、清理磁盘）

