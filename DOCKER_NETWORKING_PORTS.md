# Docker 网络和端口配置详解

## 目录

- [核心概念](#核心概念)
- [Docker 端口映射机制](#docker-端口映射机制)
- [本项目的端口配置](#本项目的端口配置)
- [常见误解](#常见误解)
- [实际应用场景](#实际应用场景)
- [故障排查](#故障排查)

---

## 核心概念

### 什么是 Docker 网络？

Docker 创建了一个**隔离的虚拟网络**，容器之间通过这个网络通信。这个网络与宿主机的网络是分离的。

```
┌─────────────────────────────────────────────────────────────┐
│                      宿主机 (Host Machine)                    │
│                     你的电脑 (localhost)                      │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Docker 虚拟网络 (soybean-admin)              │    │
│  │                                                       │    │
│  │   ┌──────────────┐         ┌──────────────┐        │    │
│  │   │   Backend    │ 内部通信 │  PostgreSQL  │        │    │
│  │   │  Container   │◄────────►│  Container   │        │    │
│  │   │              │  5432    │   (postgres) │        │    │
│  │   └──────────────┘         └──────────────┘        │    │
│  │                                   ▲                  │    │
│  │                                   │                  │    │
│  └───────────────────────────────────┼──────────────────┘    │
│                                      │                       │
│                       端口映射 (Port Mapping)                │
│                          25432 → 5432                        │
│                                      │                       │
└──────────────────────────────────────┼───────────────────────┘
                                       ▼
                          你的应用 (psql, DBeaver, etc.)
                          localhost:25432
```

### 两种端口

#### 1. **外部端口 (External/Host Port)**
- **位置**: 宿主机 (你的电脑)
- **访问方式**: `localhost:端口号`
- **用途**: 从宿主机访问容器服务
- **变量名**: `DATABASE_PORT`, `BACKEND_PORT`, `FRONTEND_PORT`
- **示例**: `DATABASE_PORT=25432`

#### 2. **内部端口 (Internal/Container Port)**
- **位置**: Docker 虚拟网络内部
- **访问方式**: `容器名:端口号` (如 `postgres:5432`)
- **用途**: 容器之间相互通信
- **变量名**: `DATABASE_INTERNAL_PORT`, `REDIS_INTERNAL_PORT`
- **示例**: `DATABASE_INTERNAL_PORT=5432`

---

## Docker 端口映射机制

### 映射语法

在 `docker-compose.yml` 中：

```yaml
ports:
  - "外部端口:内部端口"
  - "${DATABASE_PORT}:${DATABASE_INTERNAL_PORT}"
  - "25432:5432"
```

这表示：**将宿主机的 25432 端口映射到容器的 5432 端口**

### 通信流程

#### 场景 1: 从宿主机连接数据库

```
你的电脑上的应用 (psql)
       ↓
localhost:25432  ← 使用外部端口
       ↓
[Docker 端口映射]
       ↓
postgres:5432    ← 转发到内部端口
       ↓
PostgreSQL 容器
```

**连接命令**:
```bash
psql -h localhost -p 25432 -U soybean -d soybean-admin-nest-backend
```

#### 场景 2: 后端容器连接数据库

```
Backend 容器
       ↓
postgres:5432    ← 直接使用内部端口和容器名
       ↓
PostgreSQL 容器
```

**连接字符串**:
```
postgresql://soybean:password@postgres:5432/soybean-admin-nest-backend
                               ^^^^^^^^ ^^^^
                               容器名   内部端口
```

**注意**: 容器之间通信**不经过**宿主机，因此不使用 `localhost` 或外部端口！

---

## 本项目的端口配置

### PostgreSQL 数据库

| 配置项 | 默认值 | 说明 | 使用场景 |
|--------|--------|------|----------|
| `DATABASE_PORT` | 25432 | 外部端口 | 从宿主机连接数据库 |
| `DATABASE_INTERNAL_PORT` | 5432 | 内部端口 | 后端容器连接数据库 |

#### 配置示例

```yaml
# docker-compose.yml
postgres:
  ports:
    - "${DATABASE_PORT:-25432}:${DATABASE_INTERNAL_PORT:-5432}"
    #   ↑ 外部端口              ↑ 内部端口

backend:
  environment:
    DATABASE_URL: "postgresql://user:pass@postgres:${DATABASE_INTERNAL_PORT:-5432}/db"
    #                                      ↑ 容器名   ↑ 内部端口
```

### Redis 缓存

| 配置项 | 默认值 | 说明 | 使用场景 |
|--------|--------|------|----------|
| `REDIS_PORT` | 26379 | 外部端口 | 从宿主机连接 Redis |
| `REDIS_INTERNAL_PORT` | 6379 | 内部端口 | 后端容器连接 Redis |

### 应用服务

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `BACKEND_PORT` | 9528 | 后端 API 端口（外部+内部相同） |
| `FRONTEND_PORT` | 9527 | 前端页面端口（外部） |

---

## 常见误解

### ❌ 误解 1: "修改 DATABASE_PORT 后，后端连接失败"

**错误理解**:
```
我把 DATABASE_PORT 改为 10021，
但后端的 DATABASE_URL 还是 postgres:5432，
所以后端连不上数据库！
```

**正确理解**:
- `DATABASE_PORT=10021` 只影响**宿主机**到容器的连接
- 后端容器使用的是 `DATABASE_INTERNAL_PORT=5432`（内部端口）
- 这是**正常的、预期的行为**

**图解**:
```
.env 文件:
DATABASE_PORT=10021
DATABASE_INTERNAL_PORT=5432

结果:
┌─────────────────────────────────────────┐
│ 宿主机 (Your Computer)                   │
│                                          │
│ psql -h localhost -p 10021  ✅ 使用外部端口
│              ↓                           │
│    ┌─────────────────────────┐          │
│    │ Docker 网络              │          │
│    │                          │          │
│    │ Backend → postgres:5432  │ ✅ 使用内部端口
│    │              ↓           │          │
│    │         PostgreSQL       │          │
│    └─────────────────────────┘          │
└─────────────────────────────────────────┘
```

### ❌ 误解 2: "后端应该使用 localhost:DATABASE_PORT"

**错误理解**:
```
DATABASE_URL 应该是:
postgresql://soybean:pass@localhost:25432/db
```

**正确理解**:
```
DATABASE_URL 应该是:
postgresql://soybean:pass@postgres:5432/db
                          ^^^^^^^^ ^^^^
                          容器名   内部端口
```

**原因**:
- 在 Docker 网络中，容器通过**容器名**通信，不是通过 `localhost`
- `localhost` 在容器内部指的是**容器自己**，不是宿主机
- 容器之间通信使用**内部端口**，不需要经过端口映射

### ❌ 误解 3: "DATABASE_INTERNAL_PORT 应该和 DATABASE_PORT 一样"

**不推荐**:
```env
DATABASE_PORT=10021
DATABASE_INTERNAL_PORT=10021
```

**推荐**:
```env
DATABASE_PORT=10021              # 改这个避免端口冲突
DATABASE_INTERNAL_PORT=5432      # 保持标准端口
```

**原因**:
- 内部端口使用标准端口（PostgreSQL 5432, Redis 6379）是惯例
- 更改内部端口可能导致其他配置问题
- 只需要改外部端口就能避免端口冲突

---

## 实际应用场景

### 场景 1: 默认配置（无端口冲突）

```env
# .env (或使用默认值)
DATABASE_PORT=25432
DATABASE_INTERNAL_PORT=5432
```

**访问方式**:
```bash
# 从宿主机连接
psql -h localhost -p 25432 -U soybean

# 后端容器自动使用
DATABASE_URL=postgresql://soybean:pass@postgres:5432/db
```

### 场景 2: 避免端口冲突

**问题**: 你的电脑上已经有 PostgreSQL 运行在 25432 端口

**解决方案**:
```env
# .env
DATABASE_PORT=15432              # 只改这个！
DATABASE_INTERNAL_PORT=5432      # 保持不变
```

**结果**:
```bash
# 从宿主机连接 - 使用新端口
psql -h localhost -p 15432 -U soybean

# 后端容器 - 完全不受影响
DATABASE_URL=postgresql://soybean:pass@postgres:5432/db
```

### 场景 3: 使用数据库管理工具

**工具**: DBeaver, pgAdmin, TablePlus 等

**连接配置**:
```
Host: localhost          (不是 postgres)
Port: 25432             (使用 DATABASE_PORT)
User: soybean
Password: soybean@123.
Database: soybean-admin-nest-backend
```

**注意**: 这些工具运行在宿主机上，所以使用 `localhost` 和外部端口。

---

## 故障排查

### 问题 1: 修改 .env 后配置不生效

**症状**:
```bash
# 修改了 DATABASE_PORT=10021
# 但 docker ps 显示还是 25432->5432
```

**原因**: 环境变量只在容器**创建时**读取，`restart` 不会重新读取

**解决**:
```bash
docker-compose -p soybean-admin-nest down
docker-compose -p soybean-admin-nest up -d
```

**验证**:
```bash
docker-compose -p soybean-admin-nest ps
# 应该显示: 0.0.0.0:10021->5432/tcp
```

### 问题 2: 后端连接数据库失败

**检查环境变量**:
```bash
# 查看后端容器的实际 DATABASE_URL
docker-compose -p soybean-admin-nest exec backend env | grep DATABASE_URL
```

**应该看到**:
```
DATABASE_URL=postgresql://soybean:password@postgres:5432/soybean-admin-nest-backend
                                           ^^^^^^^^ ^^^^
                                           容器名   内部端口 (不是外部端口)
```

**如果看到 `localhost` 或外部端口，说明配置错误**:
```
❌ postgresql://...@localhost:25432/...
❌ postgresql://...@postgres:25432/...
✅ postgresql://...@postgres:5432/...
```

### 问题 3: 从宿主机连接失败

**检查端口映射**:
```bash
docker-compose -p soybean-admin-nest ps postgres
```

**应该看到**:
```
PORTS
0.0.0.0:25432->5432/tcp
  ↑ 外部端口  ↑ 内部端口
```

**测试连接**:
```bash
# 使用外部端口
psql -h localhost -p 25432 -U soybean -d soybean-admin-nest-backend

# 不要使用内部端口（从宿主机无法访问）
# ❌ psql -h localhost -p 5432 ...
```

### 问题 4: 端口已被占用

**症状**:
```
Error: bind: address already in use
```

**查找占用端口的进程**:
```bash
# macOS/Linux
lsof -i :25432

# Windows
netstat -ano | findstr :25432
```

**解决方案**:
1. 停止占用端口的程序
2. 或者修改 `.env` 中的 `DATABASE_PORT` 为其他端口

---

## 配置最佳实践

### ✅ 推荐配置

```env
# .env

# 数据库配置
DATABASE_PORT=25432              # 外部端口，按需修改避免冲突
DATABASE_INTERNAL_PORT=5432      # 内部端口，保持标准值

# Redis 配置
REDIS_PORT=26379                 # 外部端口，按需修改
REDIS_INTERNAL_PORT=6379         # 内部端口，保持标准值

# 应用配置
BACKEND_PORT=9528                # 后端端口，按需修改
FRONTEND_PORT=9527               # 前端端口，按需修改
```

### ❌ 不推荐配置

```env
# ❌ 不要修改内部端口，除非你完全理解后果
DATABASE_INTERNAL_PORT=25432

# ❌ 不要在内部使用 localhost
DATABASE_URL=postgresql://...@localhost:5432/...
```

---

## 快速参考

### 端口配置对照表

| 服务 | 外部端口变量 | 默认外部端口 | 内部端口变量 | 默认内部端口 |
|------|-------------|-------------|-------------|-------------|
| PostgreSQL | `DATABASE_PORT` | 25432 | `DATABASE_INTERNAL_PORT` | 5432 |
| Redis | `REDIS_PORT` | 26379 | `REDIS_INTERNAL_PORT` | 6379 |
| Backend | `BACKEND_PORT` | 9528 | `BACKEND_PORT` | 9528 |
| Frontend | `FRONTEND_PORT` | 9527 | - | 80 (Nginx) |

### 连接方式速查

| 从哪里连接 | 使用主机名 | 使用端口 | 示例 |
|-----------|-----------|---------|------|
| 宿主机 → 数据库 | `localhost` | 外部端口 | `localhost:25432` |
| 宿主机 → 后端 | `localhost` | 外部端口 | `localhost:9528` |
| 后端 → 数据库 | `postgres` | 内部端口 | `postgres:5432` |
| 后端 → Redis | `redis` | 内部端口 | `redis:6379` |
| 前端 → 后端 | `localhost` | 外部端口 | `localhost:9528` |

---

## 总结

### 核心要点

1. **两种网络环境**:
   - 宿主机 ↔ 容器: 使用 `localhost` + 外部端口
   - 容器 ↔ 容器: 使用容器名 + 内部端口

2. **端口配置原则**:
   - 外部端口可以随意修改（避免冲突）
   - 内部端口保持标准值（5432, 6379 等）

3. **修改配置后**:
   - 必须 `docker-compose down` 再 `up -d`
   - `restart` 不会重新加载环境变量

4. **后端的 DATABASE_URL**:
   - 使用容器名 (`postgres`)，不是 `localhost`
   - 使用内部端口 (5432)，不是外部端口 (25432)
   - 这是**正常的、正确的配置**

### 记住这个图

```
你的电脑 (宿主机)
  ↓ localhost:外部端口 (25432)
  ↓
[Docker 端口映射]
  ↓
Docker 网络
  ↓ 容器名:内部端口 (postgres:5432)
  ↓
PostgreSQL 容器
```

---

## 相关文档

- [ENV_CONFIG_SUMMARY.md](ENV_CONFIG_SUMMARY.md) - 环境变量配置汇总
- [DOCKER_ENV_CONFIG.md](DOCKER_ENV_CONFIG.md) - Docker 环境配置详解
- [README.md](README.md) - 项目主文档

## 问题反馈

如果这个文档没有解答你的疑问，请：
1. 查看其他相关文档
2. 提交 GitHub Issue
3. 参与 Discussion 讨论

---

**最后更新**: 2024-01-10

