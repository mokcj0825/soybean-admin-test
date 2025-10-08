# Docker Compose 环境变量配置指南

本文档详细介绍如何使用环境变量配置 Docker Compose，以及如何验证配置是否生效。

## 目录

- [快速开始](#快速开始)
- [配置原理](#配置原理)
- [完整配置参数](#完整配置参数)
- [常见使用场景](#常见使用场景)
- [验证配置](#验证配置)
- [故障排查](#故障排查)

## 快速开始

### 1. 创建配置文件

```bash
# 在项目根目录下复制示例文件
cp env.docker.example .env
```

### 2. 修改配置

编辑 `.env` 文件，例如修改数据库端口：

```env
# .env
DATABASE_PORT=25432
```

### 3. 启动服务

```bash
docker-compose -p soybean-admin-nest up -d
```

就这么简单！Docker Compose 会自动读取 `.env` 文件中的配置。

## 配置原理

### 环境变量语法

在 `docker-compose.yml` 中，我们使用以下语法引用环境变量：

```yaml
${变量名:-默认值}
```

- `变量名`：从 `.env` 文件或系统环境变量中读取
- `默认值`：如果变量未设置，使用此默认值

**示例**：
```yaml
ports:
  - "${DATABASE_PORT:-25432}:5432"
```

- 如果 `.env` 中有 `DATABASE_PORT=15432`，则映射为 `15432:5432`
- 如果 `.env` 中没有此变量，则使用默认值 `25432:5432`

### 配置优先级

配置的读取优先级（从高到低）：

1. **系统环境变量**：`export DATABASE_PORT=15432`
2. **.env 文件**：项目根目录的 `.env` 文件
3. **默认值**：`docker-compose.yml` 中定义的默认值

## 完整配置参数

### 数据库配置

| 参数名称 | 默认值 | 说明 | 使用位置 |
|---------|-------|------|---------|
| `DATABASE_PORT` | 25432 | PostgreSQL 对外映射端口 | postgres.ports |
| `DATABASE_INTERNAL_PORT` | 5432 | PostgreSQL 容器内部端口 | postgres.ports |
| `DATABASE_USER` | soybean | 数据库用户名 | postgres.environment, backend.environment |
| `DATABASE_PASSWORD` | soybean@123. | 数据库密码 | postgres.environment, backend.environment |
| `DATABASE_NAME` | soybean-admin-nest-backend | 数据库名称 | postgres.environment, backend.environment |

### Redis 配置

| 参数名称 | 默认值 | 说明 | 使用位置 |
|---------|-------|------|---------|
| `REDIS_PORT` | 26379 | Redis 对外映射端口 | redis.ports |
| `REDIS_INTERNAL_PORT` | 6379 | Redis 容器内部端口 | redis.ports |
| `REDIS_PASSWORD` | 123456 | Redis 密码 | redis.command, backend.environment |
| `REDIS_DB` | 1 | Redis 数据库索引 | backend.environment |

### 应用配置

| 参数名称 | 默认值 | 说明 | 使用位置 |
|---------|-------|------|---------|
| `APP_PORT` | 9528 | 后端服务端口 | backend.ports, backend.environment |
| `FRONTEND_PORT` | 9527 | 前端服务端口 | frontend.ports |
| `NODE_ENV` | production | Node.js 运行环境 | backend.environment |
| `TZ` | Asia/Shanghai | 时区设置 | 所有服务 |

### JWT 配置

| 参数名称 | 默认值 | 说明 |
|---------|-------|------|
| `JWT_SECRET` | JWT_SECRET-soybean-admin-nest@123456!@#. | JWT 密钥 |
| `JWT_EXPIRE_IN` | 3600 | JWT 过期时间（秒） |
| `REFRESH_TOKEN_SECRET` | REFRESH_TOKEN_EXPIRE_IN-soybean-admin-nest@123456!@#. | 刷新令牌密钥 |
| `REFRESH_TOKEN_EXPIRE_IN` | 7200 | 刷新令牌过期时间（秒） |

### Swagger 配置

| 参数名称 | 默认值 | 说明 |
|---------|-------|------|
| `DOC_SWAGGER_ENABLE` | true | 是否启用 Swagger 文档 |
| `DOC_SWAGGER_PATH` | api-docs | Swagger 文档路径 |

### 其他配置

| 参数名称 | 默认值 | 说明 |
|---------|-------|------|
| `CASBIN_MODEL` | model.conf | Casbin 权限模型配置文件 |
| `PGBOUNCER_PORT` | 6432 | PgBouncer 对外映射端口 |

## 常见使用场景

### 场景 1：修改单个端口（避免冲突）

如果只有数据库端口冲突：

```env
# .env
DATABASE_PORT=15432
```

### 场景 2：修改所有端口（避免多项目冲突）

当运行多个项目时，修改所有端口：

```env
# .env
DATABASE_PORT=15432
REDIS_PORT=16379
APP_PORT=8528
FRONTEND_PORT=8527
PGBOUNCER_PORT=7432
```

### 场景 3：生产环境部署（强化安全）

修改所有密码和密钥：

```env
# .env
DATABASE_PASSWORD=your_strong_database_password_here
REDIS_PASSWORD=your_strong_redis_password_here
JWT_SECRET=your_random_jwt_secret_key_at_least_32_chars
REFRESH_TOKEN_SECRET=your_random_refresh_token_secret_key
```

### 场景 4：开发环境（启用调试）

```env
# .env
NODE_ENV=development
DOC_SWAGGER_ENABLE=true
JWT_EXPIRE_IN=86400
```

### 场景 5：关闭 Swagger（生产环境）

```env
# .env
DOC_SWAGGER_ENABLE=false
```

## 验证配置

### 方法 1：查看实际使用的配置

```bash
# 查看 docker-compose 解析后的完整配置
docker-compose -p soybean-admin-nest config
```

这会显示所有环境变量替换后的完整 `docker-compose.yml` 内容。

### 方法 2：查看运行中容器的环境变量

```bash
# 查看 backend 容器的环境变量
docker-compose -p soybean-admin-nest exec backend env | grep DATABASE

# 查看 postgres 容器的环境变量
docker-compose -p soybean-admin-nest exec postgres env | grep POSTGRES
```

### 方法 3：查看端口映射

```bash
# 查看所有服务的端口映射
docker-compose -p soybean-admin-nest ps

# 或使用 docker ps
docker ps --filter "name=soybean-admin-nest"
```

### 方法 4：测试连接

```bash
# 测试数据库连接（使用自定义端口）
psql -h localhost -p 25432 -U soybean -d soybean-admin-nest-backend

# 测试 Redis 连接（使用自定义端口）
redis-cli -h localhost -p 26379 -a 123456

# 测试后端 API
curl http://localhost:9528/v1/route/getConstantRoutes

# 测试前端
curl http://localhost:9527
```

## 故障排查

### 问题 1：修改了 .env 但配置未生效

**原因**：容器已经在运行，需要重新创建。

**解决方案**：
```bash
# 停止并删除容器
docker-compose -p soybean-admin-nest down

# 重新启动（会读取新的环境变量）
docker-compose -p soybean-admin-nest up -d
```

**注意**：使用 `down` 而不是 `stop`，因为需要重新创建容器。数据卷不会被删除，除非使用 `-v` 参数。

### 问题 2：端口仍然冲突

**检查步骤**：
```bash
# 1. 确认 .env 文件已创建且在项目根目录
ls -la .env

# 2. 查看 .env 文件内容
cat .env

# 3. 验证 docker-compose 读取的配置
docker-compose -p soybean-admin-nest config | grep ports

# 4. 检查端口是否被占用
# macOS/Linux
lsof -i :25432
# Windows
netstat -ano | findstr :25432
```

### 问题 3：数据库连接失败

**可能原因**：
1. 数据库密码修改后，backend 中的连接字符串未同步
2. 端口映射配置不正确

**解决方案**：
```bash
# 1. 检查 backend 的 DATABASE_URL
docker-compose -p soybean-admin-nest exec backend env | grep DATABASE_URL

# 2. 确保 DATABASE_URL 中的用户名、密码与 postgres 容器一致
# DATABASE_URL 应该是：
# postgresql://[DATABASE_USER]:[DATABASE_PASSWORD]@postgres:[DATABASE_INTERNAL_PORT]/[DATABASE_NAME]?schema=public
```

### 问题 4：JWT 配置未生效

**检查步骤**：
```bash
# 查看 backend 容器中的 JWT 配置
docker-compose -p soybean-admin-nest exec backend env | grep JWT
```

如果显示的不是你设置的值，确保：
1. `.env` 文件中的参数名拼写正确
2. 已经重新创建容器（`docker-compose down && up -d`）

### 问题 5：.env 文件被 Git 追踪

**.env 应该被忽略**，检查：
```bash
# 查看 .gitignore
cat .gitignore | grep .env

# 如果 .env 已经被追踪，移除它
git rm --cached .env
git commit -m "Remove .env from tracking"
```

## 最佳实践

### 1. 使用 .env.example 作为模板

始终保持 `env.docker.example` 文件更新，包含所有可配置参数和说明。

### 2. 不要提交 .env 到 Git

`.env` 文件可能包含敏感信息（密码、密钥），应该被 `.gitignore` 忽略。

### 3. 生产环境使用强密码

默认密码仅用于开发环境，生产环境必须修改：
- `DATABASE_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`

### 4. 文档化自定义配置

如果团队成员需要特定配置，在项目文档中说明：
```markdown
## 本地开发配置

请复制 `env.docker.example` 为 `.env` 并修改以下配置：
- DATABASE_PORT=15432（避免与其他项目冲突）
```

### 5. 验证配置后再部署

在生产环境部署前，先用 `docker-compose config` 验证配置：
```bash
docker-compose config > resolved-config.yml
# 检查 resolved-config.yml 确保所有变量都正确替换
```

## 参考资料

- [Docker Compose 环境变量文档](https://docs.docker.com/compose/environment-variables/)
- [Docker Compose 变量替换](https://docs.docker.com/compose/compose-file/compose-file-v3/#variable-substitution)

