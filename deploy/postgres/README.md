# ⚠️ 警告：仅用于演示环境

**本目录的 SQL 脚本仅用于快速演示，不用于实际开发！**

---

## 📋 用途

### ✅ 适用场景
- 🎭 产品演示
- 👀 快速预览
- 🎪 向非技术人员展示
- 🚀 5秒启动体验

### ❌ 不适用场景
- 🛠️ **实际开发** - 请使用 Prisma migrations
- 👥 **团队协作** - 请使用 Prisma migrations
- 🏭 **生产部署** - 请使用 Prisma migrations
- 🔧 **修改数据库结构** - 请使用 Prisma migrations

---

## 🎯 真相来源 (Single Source of Truth)

**实际的数据库结构由以下目录管理：**

```
backend/prisma/migrations/  ← 这是唯一真相来源！
```

**本目录的 SQL 脚本是从 Prisma migrations 自动生成的快照。**

---

## 🔄 如何更新

### ❌ 错误做法
```bash
# 不要手动编辑 SQL 文件！
vim deploy/postgres/01_create_table.sql  # ← 错误！
```

### ✅ 正确做法

**步骤 1：修改 Prisma schema**
```bash
cd backend
vim prisma/schema.prisma  # 修改你的数据库模型
```

**步骤 2：生成 Prisma migration**
```bash
pnpm prisma migrate dev --name your_change_name
```

**步骤 3：运行同步脚本**
```bash
cd ..
./deploy/sync-from-prisma.sh
```

**步骤 4：提交两处更改**
```bash
git add backend/prisma/migrations/ deploy/postgres/
git commit -m "Add your_change_name to schema"
```

---

## 📁 文件说明

| 文件 | 说明 | 来源 |
|------|------|------|
| `00_metadata.sql` | 元数据注释 | 自动生成 |
| `01_schema.sql` | 表结构定义 | 从 Prisma migrations 导出 |
| `02_data.sql` | 初始数据 | 从 Prisma seed 导出 |

---

## 🔍 验证同步状态

**本地检查**：
```bash
./deploy/sync-from-prisma.sh --check
```

**CI 会自动检查**：
- 每次 PR 都会验证 deploy/postgres/*.sql 与 Prisma migrations 是否同步
- 如果不同步，CI 会失败并提示运行同步脚本

---

## 🚀 使用演示模式

启动演示环境：
```bash
docker-compose -f docker-compose.demo.yml up -d
```

访问：
- 前端：http://localhost:9527
- 后端：http://localhost:9528/api-docs
- 默认账号：`demo` / `demo123`

清理演示环境（Clean State）：
```bash
./demo-clean.sh        # Linux/macOS
demo-clean.bat         # Windows

# 或手动：
docker-compose -f docker-compose.demo.yml down -v
```

> 💡 **重要**：使用 `-v` 参数删除数据卷，确保下次启动是全新环境

---

## 🤔 常见问题

### Q1: 为什么需要两套系统？

**A:** 两套系统有不同用途：

- **Prisma migrations** - 用于实际开发
  - ✅ 版本控制
  - ✅ 团队协作
  - ✅ 可演进
  - ✅ 可回滚

- **deploy/postgres/*.sql** - 用于快速演示
  - ✅ 5秒启动
  - ✅ 无需构建
  - ✅ 简单直观
  - ✅ 适合展示

### Q2: 我应该修改哪个？

**A:** 永远修改 Prisma schema，然后同步到 SQL：

```
修改 prisma/schema.prisma
  ↓
pnpm prisma migrate dev
  ↓
./deploy/sync-from-prisma.sh
  ↓
提交两处更改
```

### Q3: 如果忘记同步会怎样？

**A:** CI 会检查并失败：

```
❌ CI Failed: deploy/postgres/*.sql out of sync!

Run: ./deploy/sync-from-prisma.sh
```

### Q4: 生产环境用哪个？

**A:** 生产环境**必须**使用 Prisma migrations！

```bash
# 生产部署
docker-compose up -d  # ← 使用 Prisma migrations
# 不要用 docker-compose.demo.yml
```

---

## 📚 相关文档

- [README_V2.md](../../README_V2.md) - 主文档，两种模式说明
- [Prisma Migrations 指南](../../backend/prisma/README.md)
- [同步脚本源码](../sync-from-prisma.sh)

---

## 📅 元数据

- **最后同步时间**: 运行 `./deploy/sync-from-prisma.sh` 查看
- **同步脚本版本**: v1.0.0
- **维护负责人**: 开发团队

---

## ⚡ 快速参考

```bash
# 查看当前 SQL 文件
ls -lh deploy/postgres/*.sql

# 查看元数据（同步时间等）
head -20 deploy/postgres/00_metadata.sql

# 同步脚本
./deploy/sync-from-prisma.sh

# 检查是否同步
./deploy/sync-from-prisma.sh --check

# 启动演示
docker-compose -f docker-compose.demo.yml up -d

# 启动开发
docker-compose up -d
```

---

**记住：deploy/postgres/*.sql 是只读的！修改 Prisma schema，然后同步。** ✨

