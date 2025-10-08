# 环境变量配置改动汇总

## 概述

本次更新实现了 Docker Compose 的完全参数化配置，允许用户通过 `.env` 文件自定义所有配置参数，而无需直接修改 `docker-compose.yml`。

## 文件改动

### 新增文件

1. **`env.docker.example`** - 环境变量示例文件
   - 包含所有可配置参数及其默认值
   - 作为创建 `.env` 文件的模板

2. **`DOCKER_ENV_CONFIG.md`** - 详细配置文档
   - 配置原理和语法说明
   - 完整参数列表和说明
   - 常见使用场景示例
   - 验证配置的方法
   - 故障排查指南

3. **`generate-env.sh`** - Linux/macOS 配置生成脚本
   - 提供三种配置模式（默认/交互/复制）
   - 自动备份现有配置
   - 交互式输入配置参数

4. **`generate-env.bat`** - Windows 配置生成脚本
   - 与 Linux/macOS 版本功能相同
   - 适配 Windows 批处理语法

5. **`ENV_CONFIG_SUMMARY.md`** - 本文档
   - 改动汇总和使用说明

### 修改文件

1. **`docker-compose.yml`**
   - 所有硬编码的配置值改为使用环境变量
   - 使用 `${变量名:-默认值}` 语法
   - 保持向后兼容（未提供 .env 时使用默认值）

2. **`README.md`**
   - 添加环境变量配置章节
   - 更新快速开始指南
   - 添加配置说明和示例
   - 更新端口冲突的解决方案
   - 添加技术文档链接

## 可配置参数清单

### 数据库相关
- `DATABASE_PORT` - PostgreSQL 对外端口（默认：25432）
- `DATABASE_INTERNAL_PORT` - PostgreSQL 内部端口（默认：5432）
- `DATABASE_USER` - 数据库用户名（默认：soybean）
- `DATABASE_PASSWORD` - 数据库密码（默认：soybean@123.）
- `DATABASE_NAME` - 数据库名称（默认：soybean-admin-nest-backend）

### Redis 相关
- `REDIS_PORT` - Redis 对外端口（默认：26379）
- `REDIS_INTERNAL_PORT` - Redis 内部端口（默认：6379）
- `REDIS_PASSWORD` - Redis 密码（默认：123456）
- `REDIS_DB` - Redis 数据库索引（默认：1）

### 应用相关
- `APP_PORT` - 后端服务端口（默认：9528）
- `FRONTEND_PORT` - 前端服务端口（默认：9527）
- `NODE_ENV` - Node.js 环境（默认：production）
- `TZ` - 时区设置（默认：Asia/Shanghai）
- `CASBIN_MODEL` - Casbin 模型文件（默认：model.conf）

### JWT 相关
- `JWT_SECRET` - JWT 密钥
- `JWT_EXPIRE_IN` - JWT 过期时间（默认：3600秒）
- `REFRESH_TOKEN_SECRET` - 刷新令牌密钥
- `REFRESH_TOKEN_EXPIRE_IN` - 刷新令牌过期时间（默认：7200秒）

### Swagger 相关
- `DOC_SWAGGER_ENABLE` - 是否启用文档（默认：true）
- `DOC_SWAGGER_PATH` - 文档路径（默认：api-docs）

### 其他
- `PGBOUNCER_PORT` - PgBouncer 端口（默认：6432）

## 使用方法

### 方法 1：使用生成脚本（推荐）

**Linux/macOS:**
```bash
./generate-env.sh
# 选择配置模式：
# 1 - 使用默认配置
# 2 - 交互式配置
# 3 - 复制示例文件
```

**Windows:**
```cmd
generate-env.bat
REM 选择配置模式（同上）
```

### 方法 2：手动创建

```bash
# 复制示例文件
cp env.docker.example .env

# 编辑配置
# Linux/macOS
vim .env
# Windows
notepad .env
```

### 方法 3：只修改特定参数

如果只需要修改个别参数（如数据库端口），创建 `.env` 文件并只写入需要修改的参数：

```env
# .env
DATABASE_PORT=15432
```

其他参数会自动使用 `docker-compose.yml` 中定义的默认值。

## 应用配置

### 首次启动

```bash
# 1. 生成配置（可选）
./generate-env.sh

# 2. 启动服务
docker-compose -p soybean-admin-nest up -d
```

### 修改配置后重启

```bash
# 1. 编辑 .env 文件
vim .env

# 2. 停止并删除容器（保留数据）
docker-compose -p soybean-admin-nest down

# 3. 重新启动（会读取新配置）
docker-compose -p soybean-admin-nest up -d
```

**注意**：必须使用 `down` 然后 `up -d`，而不是 `restart`，因为环境变量只在容器创建时设置。

## 验证配置

### 查看解析后的配置

```bash
docker-compose -p soybean-admin-nest config
```

这会显示所有环境变量替换后的完整配置。

### 查看运行中的配置

```bash
# 查看容器环境变量
docker-compose -p soybean-admin-nest exec backend env | grep DATABASE

# 查看端口映射
docker-compose -p soybean-admin-nest ps
```

### 测试连接

```bash
# 测试数据库
psql -h localhost -p 25432 -U soybean -d soybean-admin-nest-backend

# 测试 Redis
redis-cli -h localhost -p 26379 -a 123456

# 测试后端
curl http://localhost:9528/v1/route/getConstantRoutes

# 测试前端
curl http://localhost:9527
```

## 常见场景

### 场景 1：避免端口冲突

```env
# .env
DATABASE_PORT=15432
REDIS_PORT=16379
APP_PORT=8528
FRONTEND_PORT=8527
```

### 场景 2：生产环境部署

```env
# .env
DATABASE_PASSWORD=your_strong_password
REDIS_PASSWORD=your_redis_password
JWT_SECRET=your_random_secret_key
NODE_ENV=production
DOC_SWAGGER_ENABLE=false
```

### 场景 3：开发环境

```env
# .env
NODE_ENV=development
DOC_SWAGGER_ENABLE=true
JWT_EXPIRE_IN=86400
```

## 安全注意事项

1. **不要提交 .env 到 Git**
   - `.env` 文件已在 `.gitignore` 中
   - 包含敏感信息（密码、密钥）

2. **生产环境必须修改密码**
   - `DATABASE_PASSWORD`
   - `REDIS_PASSWORD`
   - `JWT_SECRET`
   - `REFRESH_TOKEN_SECRET`

3. **使用强密码**
   - 长度至少 16 个字符
   - 包含大小写字母、数字、特殊字符
   - 避免使用字典词汇

4. **定期更换密钥**
   - JWT 密钥应定期更换
   - 更换后需要重新登录

## 故障排查

### 问题：修改配置不生效

**原因**：容器未重新创建

**解决**：
```bash
docker-compose -p soybean-admin-nest down
docker-compose -p soybean-admin-nest up -d
```

### 问题：端口仍然冲突

**检查**：
```bash
# 验证配置
docker-compose config | grep ports

# 检查 .env 文件
cat .env
```

### 问题：数据库连接失败

**检查**：
```bash
# 查看 backend 的 DATABASE_URL
docker-compose exec backend env | grep DATABASE_URL

# 确保格式正确
# postgresql://[用户名]:[密码]@postgres:[内部端口]/[数据库名]
```

## 向后兼容性

本次更新保持完全向后兼容：

- **无 .env 文件**：使用 `docker-compose.yml` 中的默认值
- **部分配置**：未配置的参数使用默认值
- **完整配置**：覆盖所有默认值

现有用户无需任何操作即可继续使用，只有需要自定义配置时才需要创建 `.env` 文件。

## 相关文档

- [DOCKER_ENV_CONFIG.md](DOCKER_ENV_CONFIG.md) - 详细配置指南
- [DOCKER_NETWORKING_PORTS.md](DOCKER_NETWORKING_PORTS.md) - **Docker 网络和端口配置详解**（必读）
- [README.md](README.md) - 项目主文档
- [env.docker.example](env.docker.example) - 配置示例文件

## 问题反馈

如有问题或建议，请：
1. 查看 [DOCKER_ENV_CONFIG.md](DOCKER_ENV_CONFIG.md) 中的故障排查章节
2. 提交 GitHub Issue
3. 查看现有的 Discussion

## 更新日志

- **2024-XX-XX**: 初始版本
  - 实现 Docker Compose 完全参数化
  - 添加配置生成脚本
  - 完善文档

