# SoybeanAdmin NestJS

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
  <a href="https://github.com/honghuangdc/soybean-admin-nestjs/issues">
    <img src="https://img.shields.io/github/issues/honghuangdc/soybean-admin-nestjs.svg" alt="issues"/>
  </a>
</p>

## 目录

<p align="center">
  <a href="#简介">简介</a> •
  <a href="#特性">特性</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#项目结构">项目结构</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#数据库变更流程">数据库变更流程</a> •
  <a href="#常见问题">常见问题</a> •
  <a href="#贡献指南">贡献指南</a>
</p>

## 在线预览

- 预览地址：[https://soybean-nest.bytebytebrew.com](https://soybean-nest.bytebytebrew.com)

> **注意**：由于数据库(PostgreSQL)和缓存(Redis)部署在Vercel上，访问可能需要科学上网工具。如果遇到访问缓慢或无法访问问题，建议使用本地部署方式进行体验。

## 简介

SoybeanAdmin NestJS 是一个基于 NestJS 的后台管理系统脚手架，采用 monorepo 结构设计。它为开发者提供了一个灵活、模块化的起点，内置基础的权限管理功能，旨在帮助快速构建高质量的企业级管理系统。

### 架构特点

- **后端**：基于 NestJS 框架，提供多种架构模式
  - **base-demo**：传统 MVC 模式，适合快速开发
  - **base-system**：CQRS + DDD 设计模式，适合复杂业务
  - 集成 Prisma ORM，提供类型安全的数据库操作

- **前端**：采用最新技术栈
  - Vue3 + Vite5 + TypeScript
  - Pinia 状态管理 + UnoCSS 样式
  - 丰富的主题配置和组件

### 灵活性

虽然项目中包含了 CQRS 和 DDD 设计的示例，但这并不是强制性的。您可以完全按照自己的业务规范来使用这个脚手架，根据项目复杂度选择合适的架构模式。这种灵活性使得 SoybeanAdmin NestJS 能够适应各种不同的开发风格和项目需求。

## 特性

### 核心功能

- ✨ **模块化设计** - 采用 NestJS 模块系统，高内聚、低耦合
- 🏗️ **多种架构模式** - 支持 MVC、CQRS、DDD，满足不同需求
- 📦 **Monorepo 结构** - 便于管理多个相关项目和共享代码
- 🔐 **权限管理** - 内置基于角色的访问控制（RBAC）系统
- 🔑 **JWT 认证** - 安全的用户认证和授权机制

### 开发体验

- 🚀 **类型安全** - Prisma ORM 提供完整的 TypeScript 类型支持
- 📝 **API 文档** - 自动生成 Swagger 文档
- 🔄 **自动化路由** - 简化 API 端点管理
- 🌍 **国际化支持** - 轻松实现多语言
- 🎨 **主题定制** - 丰富的主题配置选项

### 部署运维

- 🐳 **Docker 支持** - 一键启动完整开发/生产环境
- 🔧 **环境配置** - 支持多环境配置切换
- 📊 **数据迁移** - 自动化数据库变更流程

## 技术栈

### 后端

| 技术 | 说明 | 版本 |
|------|------|------|
| NestJS | Node.js 框架 | ^11.x |
| Prisma | ORM 框架 | ^6.x |
| PostgreSQL | 关系型数据库 | 16.x |
| Redis | 缓存数据库 | 7.x |
| TypeScript | 编程语言 | ^5.x |
| Fastify | HTTP 服务器 | ^5.x |
| JWT | 身份认证 | - |
| Casbin | 权限管理 | ^5.x |

### 前端

| 技术 | 说明 | 版本 |
|------|------|------|
| Vue | JavaScript 框架 | ^3.x |
| Vite | 构建工具 | ^5.x |
| TypeScript | 编程语言 | ^5.x |
| Pinia | 状态管理 | ^2.x |
| UnoCSS | 原子化 CSS | ^0.x |
| NaiveUI | UI 组件库 | ^2.x |

## 项目结构

```
soybean-admin-nestjs/
├── backend/                      # 后端代码
│   ├── apps/                     # 应用模块
│   │   ├── base-demo/            # 基础演示（MVC）
│   │   └── base-system/          # 基础系统（CQRS/DDD）
│   ├── libs/                     # 共享库
│   │   ├── bootstrap/            # 启动模块
│   │   ├── config/               # 配置模块
│   │   ├── infra/                # 基础设施
│   │   └── shared/               # 共享模块
│   ├── prisma/                   # Prisma 配置
│   │   ├── migrations/           # 数据库迁移文件
│   │   ├── schema.prisma         # 数据库模型
│   │   └── seeds/                # 初始数据
│   ├── scripts/                  # 脚本工具
│   │   └── generate-migration.sh # 迁移生成脚本
│   ├── Dockerfile                # Docker 配置
│   └── Makefile                  # Make 命令
├── frontend/                     # 前端代码
├── docker-compose.yml            # Docker Compose 配置
└── README.md                     # 项目文档
```

## 快速开始

### 环境要求

- **Node.js**: >= 18.20.0
- **pnpm**: >= 8.0.0
- **Docker**: >= 20.x（推荐）
- **PostgreSQL**: >= 13.x（手动安装时需要）
- **Redis**: >= 6.x（手动安装时需要）

### Docker 方式（推荐）

#### 1. 启动项目

```bash
# 一键启动所有服务（前端、后端、数据库、Redis）
docker-compose -p soybean-admin-nest up -d
```

首次启动会自动完成：
- ✅ 构建 Docker 镜像
- ✅ 创建 PostgreSQL 数据库
- ✅ 创建 Redis 实例
- ✅ 执行数据库迁移
- ✅ 填充初始数据
- ✅ 启动后端服务
- ✅ 启动前端服务

#### 2. 访问应用

启动完成后（约 1-2 分钟），访问：

- **前端页面**：http://localhost:9527
- **后端 API**：http://localhost:9528/v1
- **API 文档**：http://localhost:9528/api-docs

#### 3. 默认账号

- 用户名：`admin`
- 密码：（请查看初始化日志或种子文件）

#### 4. 停止项目

```bash
# 停止所有服务（保留数据）
docker-compose -p soybean-admin-nest stop

# 停止并删除容器（保留数据）
docker-compose -p soybean-admin-nest down

# 停止并删除所有数据（包括数据库）
docker-compose -p soybean-admin-nest down -v
```

### 手动安装方式

如果不使用 Docker，可以按以下步骤手动安装。

#### 1. 安装依赖

```bash
# 安装后端依赖
cd backend
pnpm install

# 安装前端依赖
cd ../frontend
pnpm install
```

#### 2. 配置数据库

创建 PostgreSQL 数据库：

```sql
CREATE DATABASE "soybean-admin-nest-backend";
CREATE USER soybean WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE "soybean-admin-nest-backend" TO soybean;
```

#### 3. 配置环境变量

在 `backend` 目录创建 `.env` 文件：

```env
DATABASE_URL="postgresql://soybean:your_password@localhost:5432/soybean-admin-nest-backend?schema=public"
DIRECT_DATABASE_URL="postgresql://soybean:your_password@localhost:5432/soybean-admin-nest-backend?schema=public"
```

在 `backend/libs/config/src/redis.config.ts` 配置 Redis 连接。

#### 4. 初始化数据库

```bash
cd backend

# 执行迁移
npx prisma migrate deploy --schema prisma/schema.prisma

# 填充初始数据
npx prisma db seed

# 生成 Prisma 客户端
pnpm prisma:generate
```

#### 5. 启动服务

```bash
# 启动后端（在 backend 目录）
pnpm start:dev

# 启动前端（在 frontend 目录）
pnpm dev
```

## 数据库变更流程

当您需要修改数据库结构时（添加表、添加字段等），请按照以下流程操作。

### Docker 环境（推荐）

#### 完整流程

```bash
# 步骤 1：修改 backend/prisma/schema.prisma
# 例如：在 SysUser 模型中添加 department 字段

# 步骤 2：生成迁移文件（脚本自动生成增量 SQL）
docker-compose -p soybean-admin-nest exec backend make generate_migration

# 步骤 3：应用迁移到数据库
docker-compose -p soybean-admin-nest exec backend make deploy_migration

# 步骤 4：重新构建 backend（生成新的 Prisma 客户端）
docker-compose -p soybean-admin-nest build backend

# 步骤 5：重启 backend 服务
docker-compose -p soybean-admin-nest up -d backend
```

#### 流程说明

- **步骤 1**：修改 Prisma schema 文件，定义新的数据库结构
- **步骤 2**：脚本自动比对数据库当前状态和新 schema，生成增量 SQL
- **步骤 3**：将增量 SQL 应用到数据库，所有现有数据完全保留
- **步骤 4**：重新生成 Prisma 客户端代码，让 TypeScript 识别新字段
- **步骤 5**：重启服务加载新代码

> **重要**：整个过程是增量式的，不会删除或重置任何现有数据。

#### 完整示例

假设要在 `SysUser` 表中添加 `department` 字段：

```bash
# 1. 编辑 backend/prisma/schema.prisma
# 在 SysUser 模型中添加：department String?

# 2. 生成迁移
docker-compose -p soybean-admin-nest exec backend make generate_migration
# 输出：迁移文件已生成: prisma/migrations/20240315123456_migration/migration.sql
# 文件内容预览：
# ALTER TABLE "sys_user" ADD COLUMN "department" TEXT;

# 3. 应用迁移
docker-compose -p soybean-admin-nest exec backend make deploy_migration
# 输出：迁移已成功应用到数据库

# 4. 重新构建
docker-compose -p soybean-admin-nest build backend

# 5. 重启服务
docker-compose -p soybean-admin-nest up -d backend

# 完成！新字段已添加，现有数据完全保留
```

### 手动安装环境

```bash
cd backend

# 步骤 1：修改 prisma/schema.prisma

# 步骤 2：生成迁移文件
make generate_migration

# 步骤 3：应用迁移
make deploy_migration

# 步骤 4：生成 Prisma 客户端
pnpm prisma:generate

# 步骤 5：重启开发服务器（自动重载）
```

### 迁移工作原理

项目使用自定义脚本（`backend/scripts/generate-migration.sh`）来生成迁移：

1. 使用 `prisma db pull` 拉取数据库当前结构到临时文件
2. 使用 `prisma migrate diff` 比对临时文件和新 schema
3. 生成精确的增量 SQL（只包含变更部分）

这种方式确保：
- ✅ 只生成必要的增量 SQL
- ✅ 不会 DROP 任何现有表或数据
- ✅ 适合生产环境使用
- ✅ 无需影子数据库

## 配置说明

### 后端配置

所有配置文件位于 `backend/libs/config/src/`：

| 配置文件 | 说明 |
|---------|------|
| `database.config.ts` | 数据库连接配置 |
| `redis.config.ts` | Redis 连接配置 |
| `jwt.config.ts` | JWT 密钥和过期时间 |
| `app.config.ts` | 应用基础配置 |
| `swagger.config.ts` | API 文档配置 |

### 环境变量

支持多环境配置：

- `.env` - 开发环境（Git 忽略）
- `.env.production` - 生产环境（需自行创建）
- `.env.test` - 测试环境（需自行创建）

主要环境变量：

```env
# 数据库
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
DIRECT_DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
REDIS_DB=0

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRE_IN=3600

# 应用
NODE_ENV="development"
APP_PORT=9528
```

## 常见问题

### 1. 首次启动失败

**问题**：Docker 服务启动失败或数据库初始化失败

**解决方案**：
```bash
# 完全清理并重新启动
docker-compose -p soybean-admin-nest down -v
docker-compose -p soybean-admin-nest up -d
```

### 2. 数据库迁移错误

**问题**：执行迁移时出现错误

**检查步骤**：
1. 确认数据库连接正常
2. 检查 `backend/prisma/migrations/` 是否有空文件夹或错误的迁移文件
3. 查看迁移记录：
```bash
docker-compose -p soybean-admin-nest exec postgres psql -U soybean -d soybean-admin-nest-backend -c "SELECT * FROM _prisma_migrations;"
```

**解决方案**：
- 如果是测试环境，可以使用 `docker-compose down -v` 完全重置
- 如果是生产环境，请查看 `backend/docs/MIGRATION_ISSUES.md` 了解详细的问题排查和解决方案

### 3. 前端无法连接后端

**问题**：前端页面显示网络错误

**检查步骤**：
1. 确认后端服务正常运行：`docker-compose -p soybean-admin-nest ps`
2. 检查后端健康状态：`curl http://localhost:9528/v1/route/getConstantRoutes`
3. 查看后端日志：`docker-compose -p soybean-admin-nest logs backend`

### 4. 端口冲突

**问题**：启动时提示端口被占用

**解决方案**：
修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "9527:80"      # 前端：改为其他端口，如 "8080:80"
  - "9528:9528"    # 后端：改为其他端口，如 "8081:9528"
```

### 5. 数据持久化

**问题**：容器重启后数据丢失

**说明**：
- 使用 `docker-compose stop` 或 `docker-compose down`：数据会保留
- 使用 `docker-compose down -v`：数据会被删除（包含 `-v` 参数）

### 6. Schema 变更未生效

**问题**：修改了 schema.prisma 但数据库没有变化

**解决方案**：
确保完整执行了变更流程：
1. ✅ 生成迁移文件
2. ✅ 应用迁移到数据库
3. ✅ 重新构建镜像
4. ✅ 重启服务

**验证数据库变更**：
```bash
# 查看表结构
docker-compose -p soybean-admin-nest exec postgres psql -U soybean -d soybean-admin-nest-backend -c "\d+ sys_user"
```

## 进阶主题

### 自定义数据库初始化

编辑 `backend/prisma/seeds/` 目录中的文件来自定义初始数据。

### 添加新的 API 模块

参考 `backend/apps/base-demo/` 或 `backend/apps/base-system/` 的结构。

### 前端路由配置

前端路由配置位于 `frontend/src/router/`。

### 权限配置

权限配置基于 Casbin，配置文件位于 `backend/resources/model.conf`。

## 技术文档

- [Prisma 迁移问题分析](backend/docs/MIGRATION_ISSUES.md) - 数据库迁移的常见问题和解决方案
- [NestJS 官方文档](https://nestjs.com/)
- [Prisma 官方文档](https://www.prisma.io/docs/)
- [Vue 3 官方文档](https://vuejs.org/)

## 贡献指南

我们非常欢迎您的贡献！

### 如何贡献

1. Fork 本仓库
2. 创建您的特性分支：`git checkout -b feature/AmazingFeature`
3. 提交您的改动：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 开启一个 Pull Request

### 贡献者

感谢所有贡献者的付出：

<a href="https://github.com/honghuangdc/soybean-admin-nestjs/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=honghuangdc/soybean-admin-nestjs" />
</a>

### 代码规范

- 遵循 ESLint 配置
- 使用 TypeScript 严格模式
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)

## 许可证

本项目基于 [MIT](LICENSE) 许可证开源。

## 致谢

- [NestJS](https://nestjs.com/) - 渐进式 Node.js 框架
- [Prisma](https://www.prisma.io/) - 下一代 ORM
- [Vue](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Naive UI](https://www.naiveui.com/) - Vue 3 组件库

## 联系我们

如果您有任何问题或建议，欢迎通过以下方式联系我们：

- 提交 [Issue](https://github.com/honghuangdc/soybean-admin-nestjs/issues)
- 发起 [Discussion](https://github.com/honghuangdc/soybean-admin-nestjs/discussions)

---

如果这个项目对您有帮助，请给我们一个 ⭐️！您的支持是我们持续改进的动力。
