# 环境变量配置功能更新说明

## 更新概述

已成功将 `docker-compose.yml` 的所有配置参数化，现在可以通过 `.env` 文件自定义配置，无需直接修改 `docker-compose.yml`。

## 完成的工作

### 1. 修改的文件

#### `docker-compose.yml`
- ✅ 添加 `name` 字段支持项目名称配置（简化命令）
- ✅ 所有服务的配置参数改为使用环境变量
- ✅ 使用 `${变量名:-默认值}` 语法，保持向后兼容
- ✅ 支持现有 `.env` 文件的变量名规范
- ✅ 包括以下服务：
  - `postgres` - 数据库配置
  - `redis` - 缓存配置
  - `backend` - 后端服务配置
  - `frontend` - 前端服务配置
  - `pgbouncer` - 连接池配置
  - `db-init` - 数据库初始化服务

#### `README.md`
- ✅ 添加"配置环境变量"章节
- ✅ 添加 Docker Compose 环境变量配置说明
- ✅ 更新所有 docker-compose 命令（移除 `-p soybean-admin-nest` 参数）
- ✅ 更新"端口冲突"问题的解决方案
- ✅ 添加配置示例和使用场景
- ✅ 添加技术文档链接

### 2. 新增的文件

#### `env.docker.example`
- ✅ 环境变量配置模板文件
- ✅ 包含所有可配置参数及详细注释
- ✅ 与现有 `.env` 文件格式保持一致

#### `generate-env.sh` (Linux/macOS)
- ✅ 交互式环境变量生成脚本
- ✅ 提供三种配置模式：
  - 默认配置（快速开始）
  - 交互式配置（自定义参数）
  - 复制示例文件
- ✅ 自动备份现有配置

#### `generate-env.bat` (Windows)
- ✅ Windows 版本的生成脚本
- ✅ 功能与 Linux/macOS 版本完全相同

#### `DOCKER_ENV_CONFIG.md`
- ✅ 详细的配置指南文档
- ✅ 包含：
  - 配置原理和语法说明
  - 完整参数列表
  - 常见使用场景
  - 验证配置的方法
  - 故障排查指南

#### `ENV_CONFIG_SUMMARY.md`
- ✅ 配置更新汇总文档
- ✅ 包含所有可配置参数清单

#### `test-env-config.sh`
- ✅ 自动化测试脚本
- ✅ 验证配置功能是否正常工作

#### `SIMPLIFIED_COMMANDS.md`
- ✅ 命令简化说明文档
- ✅ 对比旧命令和新命令
- ✅ 说明工作原理和注意事项

#### `CHANGES.md`
- ✅ 本文档，更新说明

## 环境变量说明

### 支持的变量名称

项目使用以下环境变量命名规范（与现有 `.env` 文件兼容）：

| 配置项 | 变量名 | 默认值 |
|-------|--------|--------|
| **项目名称** | `COMPOSE_PROJECT_NAME` | soybean-admin-nest |
| 数据库用户名 | `POSTGRES_USER` | soybean |
| 数据库密码 | `POSTGRES_PASSWORD` | soybean@123. |
| 数据库名称 | `POSTGRES_DB` | soybean-admin-nest-backend |
| 数据库端口 | `DATABASE_PORT` | 25432 |
| Redis 端口 | `REDIS_PORT` | 26379 |
| Redis 密码 | `REDIS_PASSWORD` | 123456 |
| 后端端口 | `BACKEND_PORT` | 9528 |
| 前端端口 | `FRONTEND_PORT` | 9527 |
| JWT 密钥 | `JWT_SECRET` | JWT_SECRET-soybean-admin-nest@123456!@#. |

完整的变量列表请参考 `env.docker.example`。

### 💡 命令简化

配置 `COMPOSE_PROJECT_NAME` 后，无需再手动指定 `-p soybean-admin-nest` 参数：

**之前：**
```bash
docker-compose -p soybean-admin-nest up -d
docker-compose -p soybean-admin-nest down
```

**现在：**
```bash
docker-compose up -d
docker-compose down
```

详见 [SIMPLIFIED_COMMANDS.md](SIMPLIFIED_COMMANDS.md)

## 使用方法

### 快速开始

**方式 1：使用生成脚本（推荐）**

```bash
# Linux/macOS
./generate-env.sh

# Windows
generate-env.bat
```

**方式 2：手动创建**

```bash
# 如果需要自定义配置
cp env.docker.example .env
# 编辑 .env 文件

# 启动服务（无需 -p 参数）
docker-compose up -d
```

**方式 3：仅修改特定参数**

如果只需要修改个别参数（如数据库端口），可以只在 `.env` 中写入需要修改的变量：

```env
# .env
DATABASE_PORT=15432
```

其他参数会自动使用默认值。

### 修改配置后重启服务

```bash
# 1. 编辑 .env 文件
vim .env

# 2. 停止并删除容器（保留数据）
docker-compose down

# 3. 重新启动
docker-compose up -d
```

⚠️ **重要**：必须使用 `down` 然后 `up -d`，而不是 `restart`，因为环境变量只在容器创建时设置。

## 验证配置

### 查看解析后的配置

```bash
docker-compose config
```

### 查看运行中的环境变量

```bash
# 查看 backend 容器的环境变量
docker-compose exec backend env | grep DATABASE

# 查看 postgres 容器的环境变量
docker-compose exec postgres env | grep POSTGRES
```

### 运行自动化测试

```bash
./test-env-config.sh
```

## 向后兼容性

✅ **完全向后兼容**

- 如果不创建 `.env` 文件，所有配置使用默认值
- 现有用户无需任何操作即可继续使用
- 只有需要自定义配置时才需要创建 `.env` 文件

## 常见使用场景

### 场景 1：避免端口冲突

```env
# .env
DATABASE_PORT=15432
REDIS_PORT=16379
BACKEND_PORT=8528
FRONTEND_PORT=8527
```

### 场景 2：生产环境部署

```env
# .env
POSTGRES_PASSWORD=your_strong_password
REDIS_PASSWORD=your_redis_password
JWT_SECRET=your_random_secret_key
DOC_SWAGGER_ENABLE=false
```

### 场景 3：用户需求（修改数据库端口）

用户提到他在 `/backend/.env` 添加了 `DATABASE_PORT="25432"`。

**正确做法**：在项目根目录的 `.env` 文件中添加：

```env
# 项目根目录的 .env
DATABASE_PORT=25432
```

注意：
- Docker Compose 读取的是**项目根目录**的 `.env` 文件
- `/backend/.env` 是后端应用运行时读取的配置（用于本地开发）
- 两者用途不同，不要混淆

## 文档资源

- 📖 [README.md](README.md) - 项目主文档
- 📖 [DOCKER_ENV_CONFIG.md](DOCKER_ENV_CONFIG.md) - 详细配置指南
- 📖 [ENV_CONFIG_SUMMARY.md](ENV_CONFIG_SUMMARY.md) - 配置汇总文档
- 📖 [env.docker.example](env.docker.example) - 配置模板文件

## 测试结果

✅ 所有测试通过：
- `docker-compose.yml` 语法正确
- 默认值配置正确
- 环境变量替换功能正常
- 端口映射配置正确
- 数据库连接字符串正确

## 下一步

1. **用户操作**：
   - 如需自定义配置，运行 `./generate-env.sh` 或手动创建 `.env` 文件
   - 编辑配置参数
   - 重启 Docker Compose 服务

2. **团队协作**：
   - `.env` 文件已在 `.gitignore` 中，不会提交到 Git
   - 团队成员各自维护自己的 `.env` 文件
   - `env.docker.example` 作为配置模板提交到仓库

3. **生产部署**：
   - 创建生产环境的 `.env` 文件
   - 修改敏感信息（密码、密钥）
   - 关闭 Swagger 文档（设置 `DOC_SWAGGER_ENABLE=false`）

## 更新时间

2024-XX-XX

## 贡献者

- [您的名字]

