# Prisma 迁移问题分析与解决方案

## 问题背景

在 Docker 生产环境中实现数据库 schema 变更流程时，遇到了 Prisma 迁移工具无法正确生成增量迁移的问题。

## 用户测试标准

1. 严格按照 README 文档完成项目初始化
2. 在新设备上测试，禁止任何隐藏或预先操作
3. 手动修改 `schema.prisma` 后，改动必须正确反映到数据库
4. 数据视为生产数据，禁止任何 reset、重启、重置方案
5. 只允许通过脚本自动生成迁移 SQL（不接受手写 SQL）

## 核心问题

### 问题现象

使用 `prisma migrate diff` 命令生成迁移时，始终生成**完全重建数据库**的 SQL：
- DROP 所有现有表
- DROP 所有 ENUM 类型
- 重新 CREATE 所有表和类型

这与预期的**增量迁移**（如 `ALTER TABLE ADD COLUMN`）完全不同。

### 尝试的方案

#### 方案 1：使用 `--from-schema-datasource`

```bash
prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

**问题**：
- 参数使用错误，`--from-schema-datasource` 需要的是 schema 文件，但它会连接数据库
- Prisma 认为数据库是空的，生成完整的 CREATE 语句

#### 方案 2：使用 `--from-migrations`

```bash
prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

**问题**：
- 需要 `--shadow-database-url` 参数（影子数据库）
- 生产环境通常没有配置影子数据库
- 不适合生产环境使用

#### 方案 3：使用 `--from-url`

```bash
prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

**问题**：
- 仍然生成 DROP + CREATE 所有表的 SQL
- Prisma 无法正确读取数据库当前状态

#### 方案 4：使用 `prisma migrate dev`

```bash
prisma migrate dev --name migration --create-only --skip-generate
```

**问题**：
- `migrate dev` 设计用于开发环境，不适合生产环境
- 会尝试重建整个数据库
- 提示警告将 DROP 所有表（不为空的表）

### 根本原因分析

1. **Prisma 工具的设计假设**：
   - `prisma migrate diff` 主要用于开发环境或特定场景
   - 生产环境应该应用**预先在开发环境生成好的迁移文件**
   - 不支持在生产环境直接生成迁移

2. **数据库状态不一致**：
   - Docker 容器重启导致迁移记录表（`_prisma_migrations`）状态异常
   - 存在失败的迁移记录（`finished_at` 为空）
   - Prisma 无法判断数据库的真实状态

3. **Volume 挂载问题**：
   - 初期 Dockerfile 在构建时打包了旧版本的 `schema.prisma`
   - 即使使用 volume 挂载，容器内部仍使用镜像中的旧文件
   - 导致生成的迁移基于错误的 schema 版本

## 最终解决方案

### 方案：使用脚本自动生成增量迁移

**核心思路**：
1. 使用 `prisma db pull --print` 拉取当前数据库的实际结构到临时文件
2. 使用 `prisma migrate diff` 比对**临时文件（当前数据库）** 和 **新的 schema.prisma**
3. 生成的就是真正的增量 SQL

### 实现脚本：`backend/scripts/generate-migration.sh`

```bash
#!/bin/sh
# 自动生成 Prisma 迁移 SQL 的脚本

# 1. 拉取当前数据库结构到临时文件
TEMP_SCHEMA="prisma/.temp_schema_${TIMESTAMP}.prisma"
npx prisma db pull --schema "$SCHEMA_PATH" --print > "$TEMP_SCHEMA"

# 2. 比对临时文件（当前数据库）和新 schema，生成增量 SQL
npx prisma migrate diff \
    --from-schema-datamodel "$TEMP_SCHEMA" \
    --to-schema-datamodel "$SCHEMA_PATH" \
    --script > "$MIGRATION_FILE"

# 3. 清理临时文件
rm -f "$TEMP_SCHEMA"
```

### 为什么这个方案可行

1. **准确的数据库状态**：
   - `prisma db pull` 直接从数据库读取实际表结构
   - 不依赖迁移记录表的状态
   - 不受历史迁移记录影响

2. **正确的比对对象**：
   - **FROM**：临时文件（反映数据库当前真实状态）
   - **TO**：新的 schema.prisma（包含用户的修改）
   - 生成的 SQL = TO - FROM = 增量变更

3. **生产环境友好**：
   - 不需要影子数据库
   - 不会尝试重建数据库
   - 完全增量式操作

## 其他修复

### 1. Dockerfile 优化

**问题**：镜像构建时打包了旧版本的 prisma 目录

**解决**：
```dockerfile
# 在 final 阶段不复制 prisma 目录，完全依赖 volume 挂载
# COPY --from=build /usr/src/app/soybean/backend/prisma ./prisma  # 删除
```

### 2. Docker Compose Volume 挂载

**添加**：
```yaml
volumes:
  - ./backend/prisma:/usr/src/app/soybean/backend/prisma
  - ./backend/Makefile:/usr/src/app/soybean/backend/Makefile
  - ./backend/scripts:/usr/src/app/soybean/backend/scripts
```

确保容器使用宿主机的最新文件。

### 3. 环境变量补充

**问题**：缺少 `DIRECT_DATABASE_URL` 环境变量

**解决**：在 docker-compose.yml 中添加：
```yaml
environment:
  DATABASE_URL: "postgresql://..."
  DIRECT_DATABASE_URL: "postgresql://..."  # 添加
```

### 4. Makefile 权限问题

**问题**：容器中 node 用户对根目录没有写权限，无法创建 `timestamp.txt`

**解决**：将临时文件放到 volume 挂载的目录：
```makefile
TIMESTAMP_FILE = prisma/.timestamp.txt  # 从 timestamp.txt 改为 prisma/.timestamp.txt
```

## 完整的迁移流程

### Docker 环境（生产环境）

```bash
# 1. 修改 backend/prisma/schema.prisma

# 2. 生成迁移文件（脚本自动生成增量 SQL）
docker-compose -p soybean-admin-nest exec backend make generate_migration

# 3. 应用迁移到数据库
docker-compose -p soybean-admin-nest exec backend make deploy_migration

# 4. 重新构建 backend（生成新的 Prisma 客户端）
docker-compose -p soybean-admin-nest build backend

# 5. 重启 backend 服务
docker-compose -p soybean-admin-nest up -d backend
```

### 为什么需要步骤 4 和 5

- **步骤 1-3**：只修改了数据库表结构
- **步骤 4**：重新生成 Prisma 客户端代码（TypeScript 类型定义），让代码能识别新字段
- **步骤 5**：重启服务加载新代码

如果跳过步骤 4-5，数据库虽然有新字段，但 backend 代码无法使用。

## 经验教训

1. **Prisma 迁移工具的局限性**：
   - 设计主要面向开发环境
   - 生产环境应该使用预先生成好的迁移文件
   - 直接在生产环境生成迁移需要特殊处理

2. **Docker 环境的复杂性**：
   - 镜像构建、容器运行、volume 挂载三者的交互需要仔细设计
   - 文件优先级：镜像 < volume 挂载（但需要容器重建才生效）

3. **数据库状态管理**：
   - 迁移记录表（`_prisma_migrations`）的状态很重要
   - 失败的迁移会导致后续迁移无法正常工作
   - 必须确保每次迁移要么成功，要么完全回滚

4. **脚本化是关键**：
   - 复杂的流程必须通过脚本自动化
   - 手动操作容易出错且不可重复
   - 脚本提供了一致性和可维护性

## 参考资料

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Migrate Diff](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-diff)
- [Production troubleshooting](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)

