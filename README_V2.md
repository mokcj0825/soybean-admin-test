# SoybeanAdmin NestJS - 开发指南

<p align="center">
  <a href="https://github.com/honghuangdc/soybean-admin-nestjs/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license"/>
  </a>
  <a href="https://github.com/honghuangdc/soybean-admin-nestjs/stargazers">
    <img src="https://img.shields.io/github/stars/honghuangdc/soybean-admin-nestjs.svg" alt="stars"/>
  </a>
  <a href="https://github.com/honghuangdc/soybean-admin-nestjs/network/members">
    <img src="https://img.shields.io/github/forks/honghuangdc/soybean-admin-nestjs.svg" alt="forks"/>
  </a>
</p>

## 目录

- [简介](#简介)
- [环境要求](#环境要求)
- [🎭 两种使用模式](#两种使用模式)
  - [模式 A：快速演示](#模式-a快速演示demo-mode)
  - [模式 B：开发模式](#模式-b开发模式dev-mode)
  - [保持同步](#保持同步重要)
  - [如何选择模式](#如何选择模式)
  - [为什么需要两种模式](#为什么需要两种模式)
  - [常见误区](#常见误区)
- [第一步：数据库设置](#第一步数据库设置)
  - [场景 1：本地搭建数据库（Docker）](#场景-1本地搭建数据库docker推荐)
  - [场景 2：连接远程/现有数据库](#场景-2连接远程现有数据库)
  - [场景 3：后续开发](#场景-3后续开发)
- [第二步：后端开发](#第二步后端开发)
- [第三步：前端开发](#第三步前端开发)
- [数据库变更流程](#数据库变更流程)
- [常见问题](#常见问题)

---

## 简介

SoybeanAdmin NestJS 是一个基于 NestJS 的后台管理系统脚手架，采用 monorepo 结构设计。

### 核心技术栈

- **后端**: NestJS + Prisma + PostgreSQL + Redis
- **前端**: Vue3 + Vite5 + TypeScript + Pinia + UnoCSS

### 架构特点

- **base-demo**：传统 MVC 模式，适合快速开发
- **base-system**：CQRS + DDD 设计模式，适合复杂业务

---

## 环境要求

在开始之前，请确保安装以下工具：

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| **Node.js** | >= 18.20.0 | JavaScript 运行环境 |
| **pnpm** | >= 8.0.0 | 包管理器 |
| **Docker** | >= 20.x | 容器化工具（推荐） |
| **PostgreSQL** | >= 13.x | 数据库（如不使用 Docker） |
| **Redis** | >= 6.x | 缓存（如不使用 Docker） |

### 快速检查

```bash
# 检查版本
node --version      # 应该 >= v18.20.0
pnpm --version      # 应该 >= 8.0.0
docker --version    # 应该 >= 20.x
```

---

## 🎭 两种使用模式

**重要！** 本项目支持两种使用模式，请根据你的目的选择：

> 🚀 **快速跳转**：
> - 想快速体验？→ [直接启动演示模式](#模式-a快速演示demo-mode)
> - 要开始开发？→ [跳转到开发流程](#第一步数据库设置)
> - 不确定选哪个？→ [查看决策指南](#如何选择模式)
> - 了解背后原理？→ [为什么需要两种模式？](#为什么需要两种模式)

---

### 模式 A：快速演示（Demo Mode）

**适用于**：
- 🎭 产品演示、向客户/领导展示
- 👀 快速预览功能
- 🎪 非技术人员体验
- 📹 录制演示视频

**特点**：
- ⚡ **5-10秒启动** - 使用预设 SQL 脚本
- 📦 **预设数据** - 自带示例用户、角色、菜单
- 💨 **临时环境** - 不持久化数据，重启后恢复初始状态
- 🔒 **固定结构** - 不可修改数据库结构

**启动命令**：
```bash
# 启动演示环境
docker-compose -f docker-compose.demo.yml up -d

# 访问地址
# 前端: http://localhost:9527
# 后端: http://localhost:9528/api-docs
# 账号: demo / demo123

# 清理演示环境（Clean State - 推荐）
./demo-clean.sh        # Linux/macOS
demo-clean.bat         # Windows
# 或手动执行：
docker-compose -f docker-compose.demo.yml down -v
```

> 💡 **Clean State vs Purge**：
> - `down -v`：删除容器和数据，保留镜像（快速重启）✅ 推荐
> - `down -v --rmi all`：删除一切包括镜像（完全清理）⚠️ 慢

> ⚠️ **注意**：演示模式使用 `deploy/postgres/*.sql` 脚本初始化数据库。
> 这些 SQL 脚本是从 Prisma migrations 自动生成的快照，**不要手动编辑**！

---

### 模式 B：开发模式（Dev Mode）

**适用于**：
- 🛠️ 实际开发新功能
- 🔧 修改数据库结构
- 👥 团队协作开发
- 🏭 准备生产部署

**特点**：
- 🔧 **完整开发环境** - 支持所有开发工具
- 📊 **数据持久化** - 数据保存在 Docker 卷中
- 🔄 **支持 Schema 演进** - 可以修改数据库结构
- 👥 **团队协作友好** - 使用 Prisma migrations 版本控制

**启动命令**：
```bash
# 启动开发环境
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止开发环境
docker-compose down
```

> ✅ **推荐**：开发模式使用 **Prisma migrations** 管理数据库，这是**唯一真相来源 (Single Source of Truth)**。

---

### 🔄 保持同步（重要）

**如果你修改了数据库结构**，必须同步两套系统：

```bash
# 步骤 1: 修改 Prisma schema
cd backend
vim prisma/schema.prisma

# 步骤 2: 生成 Prisma migration
pnpm prisma migrate dev --name your_change

# 步骤 3: 同步到演示 SQL
cd ..
./deploy/sync-from-prisma.sh

# 步骤 4: 提交两处更改
git add backend/prisma/migrations/ deploy/postgres/
git commit -m "Add your_change to schema"
```

**我们的 CI 会自动检查两者是否同步**，如果不同步会失败并提示。

---

### 🤔 如何选择模式？

#### 快速决策表

| 你的情况 | 推荐模式 | 原因 |
|---------|--------|------|
| 我想快速看看项目长什么样 | 🎭 演示模式 | 5秒启动，立即体验 |
| 我要向老板/客户展示功能 | 🎭 演示模式 | 干净环境，演示完立即清理 |
| 我只想玩玩看，不做开发 | 🎭 演示模式 | 不需要配置，不影响本地环境 |
| 我要实际开发新功能 | 🛠️ 开发模式 | 支持代码修改和数据持久化 |
| 我要修改数据库结构 | 🛠️ 开发模式 | 使用 Prisma migrations 管理 |
| 我要与团队协作 | 🛠️ 开发模式 | Git + migrations 同步 |
| 我要准备生产部署 | 🛠️ 开发模式 | 与生产环境一致的流程 |

#### 决策流程图

```
开始
  ↓
你会修改代码或数据库结构吗？
  ├─ 是 → 🛠️ 开发模式
  │       ↓
  │       [继续阅读：第一步 数据库设置]
  │
  └─ 否 → 你需要保存数据吗？
          ├─ 是 → 🛠️ 开发模式
          │       （虽然不改代码，但需要持久化）
          │
          └─ 否 → 🎭 演示模式
                  ↓
                  [快速启动命令]
```

---

### 🎯 为什么需要两种模式？

#### 问题背景

在软件项目中，经常遇到两种完全不同的使用场景：

**场景 1：展示给非技术人员**
```
老板: "这个系统能做什么？演示一下。"
你: 好的！（需要快速启动，演示完立即清理）
```

**场景 2：实际开发工作**
```
开发: 我要添加新功能，修改数据库...
你: 好的！（需要完整环境，数据要保存，支持迭代）
```

**如果只有一种模式会怎样？**

❌ **只有开发模式（慢启动）**：
```
老板: "演示一下。"
你: "等一下，需要1分钟启动..."
你: "还要运行迁移..."
你: "Prisma client 正在生成..."
老板: 😴（已经失去兴趣）
```

❌ **只有演示模式（SQL 快照）**：
```
你: "我要添加 email 字段"
你: 修改 Prisma schema → 生成 migration
你: "咦，为什么数据库还是旧结构？"
你: 发现需要手动同步 SQL 脚本
你: 忘记同步 → drift → 💥 生产事故
```

#### 解决方案：双轨制

```
🎭 演示模式 (5秒启动)
  ├─ 使用预设 SQL 脚本
  ├─ 快速初始化
  ├─ 固定结构
  └─ 演示完清理
  → 适合：展示、预览、体验

🛠️ 开发模式 (完整环境)
  ├─ 使用 Prisma migrations
  ├─ 支持结构演进
  ├─ 数据持久化
  └─ 版本控制
  → 适合：开发、协作、生产
```

#### 架构设计原则

1. **关注点分离（Separation of Concerns）**
   - 演示关注：速度、简单
   - 开发关注：灵活、可维护

2. **单一真相来源（Single Source of Truth）**
   - Prisma migrations 是唯一真相
   - 演示 SQL 是自动生成的快照

3. **DRY 原则不适用所有场景**
   - 两套系统看似重复
   - 但服务不同目的
   - 通过自动同步工具桥接

#### 实际收益

**对于演示者**：
```
启动时间：60秒 → 5秒 ⚡
准备工作：配置、迁移、种子 → 一键启动 ✨
清理工作：手动删数据 → 自动 clean state 🧹
```

**对于开发者**：
```
数据管理：手动 SQL 脚本 → Git + Prisma migrations ✅
团队协作：沟通同步 → pull + migrate ✅
生产部署：担心不一致 → 自动化流程 ✅
```

**对于项目**：
```
架构清晰度：混乱 → 明确分离 📐
维护成本：手动同步 → 自动化 + CI 检查 🤖
新人上手：困惑 → 清晰指南 📖
```

---

### 💡 常见误区

#### 误区 1："两套系统太复杂"

**真相**：复杂度是客观存在的，只是放在哪里的问题。

```
单一系统（看似简单）：
  ├─ 演示启动慢 → 损失演示效果
  ├─ 或者开发受限 → 损失灵活性
  └─ 最终：总有一方妥协

双轨系统（表面复杂）：
  ├─ 各取所需 → 都是最优解
  ├─ 自动同步 → 减少人工
  └─ CI 检查 → 不会出错
```

#### 误区 2："演示模式会导致 drift"

**真相**：我们有防护措施。

```
防护机制：
  ├─ Prisma migrations 是唯一真相来源
  ├─ 自动同步工具（sync-from-prisma.sh）
  ├─ CI 自动检查同步状态
  └─ 不同步 → PR 无法合并
```

---

### 📚 深入理解

想了解更多？阅读：
- [CLEAN_VS_PURGE.md](CLEAN_VS_PURGE.md) - 清理机制详解
- [deploy/postgres/README.md](deploy/postgres/README.md) - 演示 SQL 原理
- [DOCKER_NETWORKING_PORTS.md](DOCKER_NETWORKING_PORTS.md) - Docker 网络说明

---

**后续文档默认使用开发模式。** 如果你已确定使用演示模式，请直接执行启动命令。

---

## 第一步：数据库设置

**重要提示**：在开始开发之前，首先需要设置数据库。根据你的情况选择以下场景之一。

> ⚠️ **项目命名规范 - 必读！**
>
> 本项目统一使用 **`sds-local`** 作为项目标识前缀，包括：
> - Docker Compose 项目名：`sds-local`
> - 容器名称：`sds-local-postgres-1`, `sds-local-redis-1`, `sds-local-pgbouncer` 等
> - Docker 网络：`sds-local`
> - Docker 卷：`sds-local-postgres_data`, `sds-local-redis_data`
>
> **为什么这样设计？**
> - ✅ 统一的命名规范，易于识别和管理
> - ✅ 避免与其他项目冲突
> - ✅ 简化命令操作（无需 `-p` 参数）
>
> **注意**：
> - 所有 `docker-compose` 命令**无需**添加 `-p sds-local` 参数
> - 容器会自动以 `sds-local-` 为前缀命名
> - 如需查看容器：`docker-compose ps`（自动使用 `sds-local` 项目）

---

### 场景 1：本地搭建数据库（Docker）【推荐】

适用于：**首次开发，没有现成数据库，想要快速开始**

#### 1.0 前置检查（必读）

在开始之前，检查是否有旧的容器在运行：

```bash
# 检查所有 PostgreSQL 和 Redis 容器
docker ps -a | grep -E "(postgres|redis)"

# 检查本项目的容器
docker ps -a | grep sds-local
```

**如果看到输出**，说明已有容器存在。你需要决定：

**情况 A：旧容器是本项目的（容器名包含 `sds-local`）**

```bash
# 查看容器状态
docker-compose ps

# 如果容器正在运行且是你想要的配置，可以跳过启动步骤
# 直接跳到 1.3 验证数据库连接
```

**情况 B：旧容器不是本项目的（其他项目的容器）**

```bash
# 查看端口占用
docker ps | grep -E "0.0.0.0:(5432|6379|25432|26379)"

# 如果端口被占用，你有两个选择：
# 选择 1：停止旧容器
docker stop <旧容器名或ID>

# 选择 2：修改本项目的端口（在 .env 中配置）
# DATABASE_PORT=15432  # 改成未被占用的端口
# REDIS_PORT=16379
```

**情况 C：完全清空，重新开始**

```bash
# 停止并删除本项目所有容器和数据（⚠️ 数据会丢失）
docker-compose down -v

# 或者只删除容器，保留数据
docker-compose down
```

> 💡 **为什么需要这一步？**
> - 避免端口冲突（多个 PostgreSQL 不能使用相同端口）
> - 避免数据混乱（连接到错误的数据库）
> - 清晰了解当前环境状态

**确认无冲突后，继续下一步。**

---

#### 1.1 配置 Docker 环境变量（可选）

如果需要自定义端口或密码，可以创建配置文件：

```bash
# 使用脚本生成配置（推荐）
./generate-env.sh    # Linux/macOS
# 或
generate-env.bat     # Windows

# 或者手动复制
cp env.docker.example .env
# 然后编辑 .env 文件
```

**主要配置项**：

```env
# .env
DATABASE_PORT=25432              # PostgreSQL 外部访问端口
POSTGRES_USER=soybean           # 数据库用户名
POSTGRES_PASSWORD=soybean@123.  # 数据库密码
POSTGRES_DB=soybean-admin-nest-backend  # 数据库名称
REDIS_PORT=26379                # Redis 外部访问端口
REDIS_PASSWORD=123456           # Redis 密码
```

> 💡 **端口说明**：默认使用 25432 而非 5432，避免与本地已安装的 PostgreSQL 冲突。详见 [DOCKER_NETWORKING_PORTS.md](DOCKER_NETWORKING_PORTS.md)

#### 1.2 启动数据库和 Redis

```bash
# 只启动数据库和 Redis（不启动后端和前端）
docker-compose up postgres redis -d
```

**等待启动**：初次启动可能需要 10-30 秒，请耐心等待。

#### 1.3 验证数据库连接

**方法 1：使用 docker-compose 检查**

```bash
# 查看服务状态
docker-compose ps

# 应该看到：
# NAME                    STATUS          PORTS
# sds-local-postgres-1    Up (healthy)    0.0.0.0:25432->5432/tcp
# sds-local-redis-1       Up (healthy)    0.0.0.0:26379->6379/tcp
```

**方法 2：使用 psql 测试连接**

```bash
# 测试 PostgreSQL 连接
psql -h localhost -p 25432 -U soybean -d soybean-admin-nest-backend

# 输入密码：soybean@123.
# 如果连接成功，你会看到：
# soybean-admin-nest-backend=#

# 退出：输入 \q
```

**方法 3：使用 redis-cli 测试连接**

```bash
# 测试 Redis 连接
redis-cli -h localhost -p 26379 -a 123456

# 如果连接成功，你会看到：
# 127.0.0.1:26379>

# 测试命令：
127.0.0.1:26379> PING
# 应该返回：PONG

# 退出：输入 quit
```

**方法 4：使用数据库管理工具**

使用 DBeaver、pgAdmin、TablePlus 等工具：

| 配置项 | 值 |
|--------|---|
| Host | `localhost` |
| Port | `25432`（或你在 .env 中设置的端口） |
| User | `soybean` |
| Password | `soybean@123.` |
| Database | `soybean-admin-nest-backend` |

#### 1.4 运行数据库迁移

> 💡 **什么是数据库迁移？**
>
> 数据库迁移是将数据库 schema（表结构）从一个状态转换到另一个状态的过程。简单说就是：
> - 📋 创建表（users, roles, permissions 等）
> - 🔧 修改表结构（添加/删除字段）
> - 🔗 创建关系（外键、索引）
> - 📊 管理版本（记录哪些变更已应用）
>
> **为什么需要迁移？**
> - ✅ 版本控制：像代码一样管理数据库变更
> - ✅ 可重复性：在任何环境都能重现相同的数据库结构
> - ✅ 团队协作：确保所有人的数据库结构一致
> - ✅ 安全性：避免手动执行 SQL 导致的错误
>
> 简单地说，我要改数据库的结构，我要加table，我要改column，但是我直接改可能会导致其他人的数据库炸了。我就弄个迁移sql，让所有人都跟我一起改。

##### 步骤 1：进入 backend 目录

```bash
cd backend
```

##### 步骤 2：安装依赖（如果还没安装）

```bash
# 检查是否已安装
ls node_modules/.bin/prisma

# 如果没有，安装依赖
pnpm install
```

##### 步骤 3：运行迁移

```bash
# 运行所有待应用的迁移
pnpm prisma migrate deploy
```

**这一步做了什么？**

1. 📂 读取 `prisma/migrations/` 目录下的所有迁移文件
2. 🔍 检查数据库中的 `_prisma_migrations` 表，查看哪些迁移已应用
3. ▶️ 按顺序执行未应用的迁移（创建表、添加字段等）
4. ✅ 记录迁移状态到 `_prisma_migrations` 表

**预期输出**：

```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "sds-local-db", schema "public" at "localhost:12000"

3 migrations found in prisma/migrations

Applying migration `0_init_migration`
Applying migration `1_migration`
Applying migration `20240902161339_migration`

The following migration(s) have been applied:

migrations/
  └─ 0_init_migration/
      └─ migration.sql
  └─ 1_migration/
      └─ migration.sql
  └─ 20240902161339_migration/
      └─ migration.sql

All migrations have been successfully applied.
```

**如果看到错误**：

```bash
# 错误：连接被拒绝
Error: P1001: Can't reach database server at `localhost:12000`

# 解决：检查数据库是否运行
docker-compose ps postgres

# 错误：数据库不存在
Error: P1003: Database `sds-local-db` does not exist

# 解决：检查 backend/.env 中的数据库名是否正确
cat backend/.env | grep DATABASE_URL

# 错误：迁移冲突
Error: P3005: The database schema is not empty

# 解决：参考 backend/docs/MIGRATION_ISSUES.md
```

##### 步骤 4：填充初始数据（Seed）

```bash
# 填充测试数据和管理员账号
pnpm prisma db seed
```

**这一步做了什么？**

1. 👤 创建默认管理员账号（`admin` / `admin123`）
2. 👥 创建示例角色（管理员、编辑、访客）
3. 📋 创建示例菜单和权限
4. 🔐 设置权限规则（Casbin）

**预期输出**：

```
Running seed command `tsx prisma/seeds/index.ts` ...

🌱 开始填充数据...
✅ 系统域数据填充完成
✅ 用户数据填充完成
✅ 角色数据填充完成
✅ 菜单数据填充完成
✅ Casbin 规则填充完成

🌱 数据填充完成！

默认管理员账号：
  用户名: admin
  密码: admin123
```

> ⚠️ **重要提示**：
> - `pnpm prisma db seed` 可以多次运行（会跳过已存在的数据）
> - 生产环境建议修改默认密码
> - 初始数据定义在 `backend/prisma/seeds/` 目录

##### 步骤 5：验证迁移成功

**方法 1：使用 Prisma Studio（图形界面）**

```bash
# 在 backend 目录
pnpm prisma studio
```

浏览器会自动打开 `http://localhost:5555`，你可以：
- 查看所有表
- 查看数据
- 编辑数据（开发环境）

**方法 2：使用 psql 命令行**

```bash
# 进入数据库（注意使用你配置的端口）
psql -h localhost -p 12000 -U cjmok -d sds-local-db

# 查看所有表
\dt

# 应该看到：
#  Schema |         Name          | Type  | Owner
# --------+-----------------------+-------+-------
#  public | _prisma_migrations    | table | cjmok
#  public | casbin_rule           | table | cjmok
#  public | sys_domain            | table | cjmok
#  public | sys_menu              | table | cjmok
#  public | sys_role              | table | cjmok
#  public | sys_role_menu         | table | cjmok
#  public | sys_user              | table | cjmok
#  public | sys_user_role         | table | cjmok

# 查看有多少用户
SELECT COUNT(*) FROM sys_user;
#  count
# -------
#      1

# 查看管理员用户
SELECT id, username, nickname FROM sys_user;
#  id | username | nickname
# ----+----------+----------
#   1 | admin    | Admin

# 退出
\q
```

**方法 3：使用数据库管理工具**

打开 DBeaver / TablePlus / pgAdmin：
1. 连接到数据库（localhost:12000）
2. 展开 `public` schema
3. 应该看到 8-10 个表

##### 常见问题

**Q1: 迁移失败，如何重试？**

```bash
# 查看迁移状态
pnpm prisma migrate status

# 如果显示有问题，可以尝试
pnpm prisma migrate resolve --applied <migration-name>

# 然后重新运行
pnpm prisma migrate deploy
```

**Q2: 我想重置数据库，重新开始**

```bash
# ⚠️ 这会删除所有数据！
pnpm prisma migrate reset

# 这个命令会：
# 1. 删除数据库中的所有表
# 2. 重新运行所有迁移
# 3. 重新填充种子数据
```

**Q3: `_prisma_migrations` 表是什么？**

这是 Prisma 用来跟踪迁移状态的特殊表，记录：
- 哪些迁移已经应用
- 应用时间
- 迁移是否成功

不要手动修改这个表！

**Q4: 为什么需要 `pnpm install`？**

迁移命令需要：
- `prisma` CLI 工具
- `@prisma/client` 库
- TypeScript 运行环境（tsx）

##### 下一步

✅ **完成！** 数据库已准备就绪，包括：
- ✅ 所有表已创建
- ✅ 初始数据已填充
- ✅ 管理员账号可用
- ✅ 权限系统已配置

继续到 [第二步：后端开发](#第二步后端开发)

---

### 场景 2：连接远程/现有数据库

适用于：**连接到团队共享数据库、云数据库、或已有的 PostgreSQL 实例**

#### 2.1 获取数据库连接信息

从团队或云服务商获取以下信息：

| 信息 | 示例 | 说明 |
|------|------|------|
| Host | `db.example.com` | 数据库服务器地址 |
| Port | `5432` | 数据库端口 |
| User | `myuser` | 数据库用户名 |
| Password | `mypassword` | 数据库密码 |
| Database | `mydatabase` | 数据库名称 |

#### 2.2 配置 backend/.env 文件

```bash
cd backend

# 如果没有 .env 文件，创建一个
touch .env
```

编辑 `backend/.env`：

```env
# backend/.env

# 数据库连接（根据实际情况修改）
DATABASE_URL="postgresql://myuser:mypassword@db.example.com:5432/mydatabase?schema=public"
DIRECT_DATABASE_URL="postgresql://myuser:mypassword@db.example.com:5432/mydatabase?schema=public"

# 如果使用 SSL 连接
# DATABASE_URL="postgresql://myuser:mypassword@db.example.com:5432/mydatabase?schema=public&sslmode=require"

# Redis 配置（根据实际情况修改）
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=1
```

**连接字符串格式**：
```
postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]?schema=public
```

#### 2.3 测试数据库连接

**方法 1：使用 Prisma CLI 测试**

```bash
cd backend

# 测试连接并查看数据库信息
pnpm prisma db pull --schema prisma/schema.prisma
```

如果连接成功，会显示现有的数据库结构。

**方法 2：使用 psql 测试**

```bash
# 使用你的连接信息
psql -h db.example.com -p 5432 -U myuser -d mydatabase

# 输入密码后，如果成功会显示：
# mydatabase=#

# 测试查询
SELECT version();

# 退出
\q
```

**方法 3：使用 Node.js 脚本测试**

创建测试文件 `backend/test-connection.js`：

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功！');

    // 测试查询
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('PostgreSQL 版本:', result[0].version);

  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

运行测试：

```bash
cd backend
node test-connection.js
```

#### 2.4 运行数据库迁移（如需要）

**情况 A：数据库是空的（需要初始化）**

```bash
cd backend

# 运行迁移
pnpm prisma migrate deploy

# 填充初始数据
pnpm prisma db seed
```

**情况 B：数据库已有数据（同步开发）**

```bash
cd backend

# 仅生成 Prisma Client（不修改数据库）
pnpm prisma generate
```

#### 2.5 配置 Redis 连接（如需要）

如果使用远程 Redis：

```env
# backend/.env
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=1
```

测试 Redis 连接：

```bash
redis-cli -h redis.example.com -p 6379 -a your_redis_password

# 测试
PING
# 应该返回：PONG

quit
```

✅ **完成！** 数据库连接已配置，继续到 [第二步：后端开发](#第二步后端开发)

---

### 场景 3：后续开发

适用于：**数据库已经设置好，你是继续开发或加入现有项目**

#### 3.1 确认数据库是否运行

**如果使用 Docker：**

```bash
# 检查容器状态
docker-compose ps

# 如果没有运行，启动它们
docker-compose up postgres redis -d
```

**如果使用远程数据库：**

联系团队获取最新的数据库连接信息。

#### 3.2 测试连接

使用 [场景 1 的验证方法](#13-验证数据库连接) 或 [场景 2 的测试方法](#23-测试数据库连接)

#### 3.3 同步数据库结构

```bash
cd backend

# 拉取最新代码后，同步数据库
pnpm prisma migrate deploy

# 重新生成 Prisma Client
pnpm prisma generate
```

#### 3.4 检查数据库状态

```bash
cd backend

# 查看迁移状态
pnpm prisma migrate status

# 应该看到：
# Database schema is up to date!
```

✅ **完成！** 继续到 [第二步：后端开发](#第二步后端开发)

---

## 连接配置速查表

### 本地 Docker 数据库（场景 1）

```env
# backend/.env
DATABASE_URL="postgresql://soybean:soybean@123.@localhost:25432/soybean-admin-nest-backend?schema=public"
DIRECT_DATABASE_URL="postgresql://soybean:soybean@123.@localhost:25432/soybean-admin-nest-backend?schema=public"
REDIS_HOST=localhost
REDIS_PORT=26379
REDIS_PASSWORD=123456
REDIS_DB=1
```

### 远程数据库（场景 2）

```env
# backend/.env
DATABASE_URL="postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]?schema=public"
DIRECT_DATABASE_URL="postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]?schema=public"
REDIS_HOST=[Redis主机]
REDIS_PORT=[Redis端口]
REDIS_PASSWORD=[Redis密码]
REDIS_DB=1
```

### 端口参考

| 服务 | Docker 内部端口 | Docker 外部端口 | 说明 |
|------|----------------|----------------|------|
| PostgreSQL | 5432 | 25432（默认） | 外部端口可在 .env 中修改 |
| Redis | 6379 | 26379（默认） | 外部端口可在 .env 中修改 |
| Backend API | 9528 | 9528 | 后端服务端口 |
| Frontend | 80 | 9527 | 前端服务端口 |

> 📖 **详细说明**：阅读 [DOCKER_NETWORKING_PORTS.md](DOCKER_NETWORKING_PORTS.md) 了解 Docker 网络和端口配置

---

## 第二步：后端开发

数据库设置完成后，现在可以启动后端服务。

### 2.1 安装依赖

```bash
cd backend

# 安装依赖
pnpm install
```

### 2.2 配置环境变量

确认 `backend/.env` 文件已正确配置（参考上一步）。

### 2.3 启动后端服务

**开发模式（带热重载）：**

```bash
cd backend

# 启动开发服务器
pnpm run start:dev

# 应该看到：
# [Nest] INFO [NestApplication] Nest application successfully started
# [Nest] INFO Application is running on: http://[::]:9528
```

**生产模式：**

```bash
cd backend

# 构建
pnpm run build

# 启动
pnpm run start:prod
```

### 2.4 验证后端服务

**方法 1：访问 API 端点**

```bash
# 测试基础路由
curl http://localhost:9528/v1/route/getConstantRoutes

# 应该返回 JSON 数据
```

**方法 2：访问 Swagger 文档**

打开浏览器访问：

```
http://localhost:9528/api-docs
```

你应该看到 Swagger API 文档界面。

**方法 3：检查健康状态**

```bash
# 如果有健康检查端点
curl http://localhost:9528/health
```

### 2.5 测试登录

```bash
# 使用默认管理员账号测试登录
curl -X POST http://localhost:9528/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# 应该返回包含 token 的 JSON
```

> 💡 **默认账号**：
> - 用户名：`admin`
> - 密码：`admin123`

✅ **完成！** 后端服务运行成功，继续到 [第三步：前端开发](#第三步前端开发)

---

## 第三步：前端开发

### 3.1 安装依赖

```bash
cd frontend

# 安装依赖
pnpm install
```

### 3.2 配置环境变量（可选）

前端通常使用默认配置即可，如需自定义：

```bash
# 查看前端配置
cat frontend/vite.config.ts
```

### 3.3 启动前端服务

```bash
cd frontend

# 启动开发服务器
pnpm run dev

# 应该看到：
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:9527/
```

### 3.4 访问应用

打开浏览器访问：

```
http://localhost:9527
```

使用默认账号登录：
- 用户名：`admin`
- 密码：`admin123`

✅ **完成！** 恭喜，整个系统已经运行起来了！

---

## 数据库变更流程

当你需要修改数据库结构时，遵循以下流程。

### 修改 Schema

编辑 `backend/prisma/schema.prisma`：

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String?  // 新增字段
  createdAt DateTime @default(now())
}
```

### 生成迁移

```bash
cd backend

# 生成迁移文件
./scripts/generate-migration.sh

# 或者使用 Makefile
make migrate
```

### 应用迁移

```bash
# 应用到数据库
pnpm prisma migrate deploy

# 重新生成 Prisma Client
pnpm prisma generate
```

### 验证变更

```bash
# 查看迁移状态
pnpm prisma migrate status

# 进入数据库查看
psql -h localhost -p 25432 -U soybean -d soybean-admin-nest-backend

# 查看表结构
\d sys_user

# 退出
\q
```

> 📖 **详细文档**：查看 [backend/docs/MIGRATION_ISSUES.md](backend/docs/MIGRATION_ISSUES.md) 了解更多

---

## 常见问题

### 数据库连接相关

#### Q1: 连接被拒绝 (Connection refused)

```
Error: connect ECONNREFUSED 127.0.0.1:25432
```

**检查清单**：

1. 确认数据库正在运行：
```bash
docker-compose ps postgres
# 状态应该是 Up (healthy)
```

2. 检查端口是否正确：
```bash
# 查看端口映射
docker-compose ps postgres
# 应该显示：0.0.0.0:25432->5432/tcp
```

3. 测试端口连通性：
```bash
nc -zv localhost 25432
# 或
telnet localhost 25432
```

#### Q2: 密码认证失败

```
Error: password authentication failed for user "soybean"
```

**解决方案**：

1. 检查密码是否正确（注意特殊字符）：
```bash
# 查看配置
cat .env | grep POSTGRES_PASSWORD

# 查看 backend/.env
cat backend/.env | grep DATABASE_URL
```

2. 确保密码中的特殊字符被正确转义

3. 重置数据库：
```bash
docker-compose down -v
docker-compose up postgres redis -d
```

#### Q3: 端口已被占用

```
Error: bind: address already in use
```

**解决方案**：

1. 查找占用端口的进程：
```bash
# macOS/Linux
lsof -i :25432

# Windows
netstat -ano | findstr :25432
```

2. 修改外部端口：
```env
# .env
DATABASE_PORT=15432  # 改成其他端口
```

3. 重启服务：
```bash
docker-compose down
docker-compose up postgres redis -d
```

4. 同步 backend/.env：
```env
# backend/.env
DATABASE_URL="postgresql://soybean:soybean@123.@localhost:15432/..."
```

### 迁移相关

#### Q4: 迁移冲突

参考 [backend/docs/MIGRATION_ISSUES.md](backend/docs/MIGRATION_ISSUES.md)

#### Q5: 如何重置数据库？

```bash
# 警告：这会删除所有数据！
docker-compose down -v
docker-compose up postgres redis -d

# 重新运行迁移
cd backend
pnpm prisma migrate deploy
pnpm prisma db seed
```

### 配置相关

#### Q6: 修改 .env 后不生效

记住：**必须重新创建容器**，而不是重启！

```bash
# ❌ 错误
docker-compose restart

# ✅ 正确
docker-compose down
docker-compose up -d
```

原因：环境变量只在容器**创建时**读取。

#### Q7: backend/.env 和根目录 .env 的区别？

| 文件 | 作用范围 | 使用者 |
|------|---------|--------|
| `.env`（根目录） | Docker Compose 配置 | 容器创建时 |
| `backend/.env` | 后端应用配置 | 本地开发时的 NestJS 应用 |

详见 [DOCKER_NETWORKING_PORTS.md](DOCKER_NETWORKING_PORTS.md)

---

## Docker Compose 完整启动

如果你想使用 Docker 运行所有服务（包括后端和前端）：

### 1. 配置环境变量

```bash
./generate-env.sh  # 或 generate-env.bat
```

### 2. 启动所有服务

```bash
docker-compose up -d
```

### 3. 查看状态

```bash
docker-compose ps
```

### 4. 查看日志

```bash
# 查看所有日志
docker-compose logs -f

# 只查看后端日志
docker-compose logs -f backend
```

### 5. 停止服务

```bash
# 停止（保留数据）
docker-compose down

# 停止并删除数据
docker-compose down -v
```

---

## 相关文档

- [DOCKER_NETWORKING_PORTS.md](DOCKER_NETWORKING_PORTS.md) - Docker 网络和端口配置详解
- [DOCKER_ENV_CONFIG.md](DOCKER_ENV_CONFIG.md) - Docker 环境变量配置指南
- [ENV_CONFIG_SUMMARY.md](ENV_CONFIG_SUMMARY.md) - 环境变量配置汇总
- [backend/docs/MIGRATION_ISSUES.md](backend/docs/MIGRATION_ISSUES.md) - 数据库迁移问题处理

---

## 贡献指南

欢迎贡献代码！请确保：

1. 遵循项目的代码风格
2. 添加适当的测试
3. 更新相关文档
4. 提交前运行 lint 检查

---

## 许可证

[MIT License](LICENSE)

---

## 测试记录

> 📝 **注意**：以下部分由实际测试人员填写，作为 SSOT (Single Source of Truth)

### 测试环境

- 操作系统：
- Node.js 版本：
- Docker 版本：
- 测试日期：

### 场景 1 测试结果

- [ ] Docker 容器启动成功
- [ ] PostgreSQL 连接测试通过
- [ ] Redis 连接测试通过
- [ ] 数据库迁移成功
- [ ] 数据填充成功
- [ ] 后端服务启动成功
- [ ] 前端服务启动成功
- [ ] 登录功能正常

**备注**：


### 场景 2 测试结果

- [ ] 远程数据库连接成功
- [ ] Prisma 连接测试通过
- [ ] 迁移/生成成功
- [ ] 后端服务启动成功

**备注**：


### 场景 3 测试结果

- [ ] 数据库状态检查正常
- [ ] 迁移同步成功
- [ ] 服务启动正常

**备注**：


### 问题和修正

| 发现日期 | 问题描述 | 解决方案 | 状态 |
|---------|---------|---------|------|
|         |         |         |      |


