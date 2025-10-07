# Docker Compose 命令简化说明

## 改进内容

✅ **无需再手动指定 `-p soybean-admin-nest` 参数了！**

通过在 `.env` 文件中添加 `COMPOSE_PROJECT_NAME` 环境变量，Docker Compose 会自动使用配置的项目名称。

## 对比

### 之前（需要手动指定项目名）

```bash
# 启动
docker-compose -p soybean-admin-nest up -d

# 停止
docker-compose -p soybean-admin-nest down

# 查看状态
docker-compose -p soybean-admin-nest ps

# 查看日志
docker-compose -p soybean-admin-nest logs backend

# 执行命令
docker-compose -p soybean-admin-nest exec backend make generate_migration
```

### 现在（自动使用配置的项目名）

```bash
# 启动
docker-compose up -d

# 停止
docker-compose down

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs backend

# 执行命令
docker-compose exec backend make generate_migration
```

## 工作原理

### 1. docker-compose.yml 配置

```yaml
name: ${COMPOSE_PROJECT_NAME:-soybean-admin-nest}
```

这行配置告诉 Docker Compose：
- 从环境变量 `COMPOSE_PROJECT_NAME` 读取项目名称
- 如果未设置，默认使用 `soybean-admin-nest`

### 2. .env 文件配置

```env
# Docker Compose 项目配置
COMPOSE_PROJECT_NAME=soybean-admin-nest
```

Docker Compose 会自动读取项目根目录的 `.env` 文件。

### 3. 验证配置

```bash
# 查看解析后的配置
docker-compose config | head -1

# 输出：
# name: soybean-admin-nest
```

## 自定义项目名称

如果需要运行多个实例或使用不同的项目名称，只需修改 `.env` 文件：

```env
# 例如：开发环境和测试环境使用不同的项目名
COMPOSE_PROJECT_NAME=soybean-admin-dev
```

或者临时覆盖（不修改 .env 文件）：

```bash
COMPOSE_PROJECT_NAME=my-project docker-compose up -d
```

## 影响范围

项目名称会影响以下内容的命名：

1. **容器名称**
   - 格式：`{项目名}-{服务名}-{序号}`
   - 例如：`soybean-admin-nest-backend-1`

2. **网络名称**
   - 格式：`{项目名}_{网络名}`
   - 例如：`soybean-admin-nest_soybean-admin`

3. **卷名称**
   - 格式：`{项目名}_{卷名}`
   - 例如：`soybean-admin-nest_soybean-admin-postgres_data`

## 好处

✅ **更简洁的命令** - 减少重复输入  
✅ **减少错误** - 避免忘记指定项目名  
✅ **更灵活** - 易于切换不同环境  
✅ **更标准** - 符合 Docker Compose 最佳实践  

## 注意事项

### 迁移现有项目

如果你之前一直使用 `-p soybean-admin-nest`，现在改用 `.env` 配置后，Docker Compose 会识别为同一个项目（因为项目名相同）。

### 数据持久化

项目名称更改会导致：
- 创建新的容器（旧容器不会自动删除）
- 创建新的网络
- **创建新的数据卷（旧数据不会自动迁移）**

⚠️ **重要**：如果需要更改项目名称，请先备份数据！

```bash
# 导出数据库
docker-compose exec postgres pg_dump -U soybean soybean-admin-nest-backend > backup.sql

# 更改项目名称
vim .env  # 修改 COMPOSE_PROJECT_NAME

# 启动新项目
docker-compose up -d

# 导入数据
cat backup.sql | docker-compose exec -T postgres psql -U soybean soybean-admin-nest-backend
```

## 兼容性

✅ **完全向后兼容**

如果你想继续使用 `-p` 参数（例如在 CI/CD 中），仍然可以：

```bash
# 显式指定会覆盖 .env 中的配置
docker-compose -p my-custom-name up -d
```

但对于日常开发，推荐使用 `.env` 配置以保持一致性。

## 更新的文件

所有文档中的命令示例都已更新：

- ✅ README.md - 所有 docker-compose 命令
- ✅ docker-compose.yml - 添加 `name` 字段
- ✅ env.docker.example - 添加 `COMPOSE_PROJECT_NAME` 配置
- ✅ generate-env.sh - 生成脚本包含此配置
- ✅ generate-env.bat - Windows 脚本包含此配置

## 总结

现在你只需：

```bash
# 1. 确保 .env 文件存在（包含 COMPOSE_PROJECT_NAME）
cat .env | grep COMPOSE_PROJECT_NAME

# 2. 使用简化的命令
docker-compose up -d
docker-compose ps
docker-compose logs
docker-compose down
```

就这么简单！🎉

