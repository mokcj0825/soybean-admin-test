# lib/ 结构对比

## 🔍 当前项目 vs V3 纯粹 DDD

### 当前项目结构 (base-system)

```
apps/base-system/src/
├── api/              # HTTP 层
├── lib/
│   └── bounded-contexts/    # ⚠️ 只有这一个文件夹
│       ├── order/
│       ├── iam/
│       └── ...
└── infra/            # 基础设施层
```

**问题**：
1. ❌ 没有 `shared-kernel/` - 共享代码放在哪里？
2. ❌ 领域基类在哪里？每个上下文都自己定义？
3. ❌ 通用值对象（Money、Email）放在哪里？

**当前解决方案**：
- 共享代码被提升到 `backend/libs/`（Monorepo 的共享库）
- 混合了领域逻辑和基础设施代码

---

### V3 纯粹 DDD 结构

```
apps/v3-structure/src/
├── api/              # HTTP 层
├── lib/
│   ├── shared-kernel/          # ✅ 领域共享内核
│   │   ├── base/              # 领域基类
│   │   ├── value-objects/     # 通用值对象
│   │   └── exceptions/        # 领域异常
│   │
│   ├── bounded-contexts/       # ✅ 限界上下文
│   │   ├── order/
│   │   └── ...
│   │
│   └── integration/            # ✅ 上下文集成
└── infra/            # 基础设施层
```

**优势**：
1. ✅ 清晰的职责划分
2. ✅ 领域逻辑和基础设施完全分离
3. ✅ 自文档化的架构

---

## 📊 详细对比

### 1. 共享代码的位置

| 类型 | 当前项目 | V3 纯粹 DDD | 说明 |
|------|---------|------------|------|
| 领域基类 | `backend/libs/` 混合 | `lib/shared-kernel/base/` | V3 更清晰 |
| 通用值对象 | 分散或重复 | `lib/shared-kernel/value-objects/` | V3 统一管理 |
| 领域异常 | 分散 | `lib/shared-kernel/exceptions/` | V3 统一处理 |
| 基础设施工具 | `backend/libs/infra/` | `infra/shared/` | 两者类似 |

### 2. Money 值对象的位置

#### 当前项目
```typescript
// 可能的位置1：在 order 上下文中
apps/base-system/src/lib/bounded-contexts/order/domain/money.vo.ts

// 可能的位置2：在 monorepo 共享库中
backend/libs/shared/domain/money.vo.ts  // ⚠️ 混合了领域和基础设施

// 问题：如果在 order 中，payment 上下文怎么用？
// 问题：如果在 libs/shared 中，领域逻辑和基础设施混在一起
```

#### V3 纯粹 DDD
```typescript
// 清晰的位置：shared-kernel
apps/v3-structure/src/lib/shared-kernel/value-objects/money.vo.ts

// 所有上下文直接引用
import { Money } from '../../../shared-kernel';

// ✅ 清晰：这是领域逻辑
// ✅ 共享：所有上下文都能用
// ✅ 独立：不依赖基础设施
```

### 3. Entity 基类的位置

#### 当前项目
```typescript
// 可能的位置：在某个上下文中？或在 libs/ 中？
// 不清晰，开发者需要猜测
```

#### V3 纯粹 DDD
```typescript
// 明确的位置
apps/v3-structure/src/lib/shared-kernel/base/entity.base.ts

// 所有实体继承
import { Entity } from '../../../shared-kernel';

export class Order extends Entity { ... }
```

---

## 🎯 Monorepo 共享库 vs Shared Kernel

### backend/libs/ (Monorepo 共享库)

```
backend/libs/
├── shared/              # ⚠️ 混合了各种东西
│   ├── errors/         # 领域异常？
│   ├── prisma/         # 基础设施
│   ├── redis/          # 基础设施
│   └── oss/            # 基础设施
├── infra/              # 基础设施
│   ├── decorators/
│   ├── filters/
│   └── interceptors/
└── utils/              # 工具函数
```

**问题**：
1. ⚠️ 领域逻辑 (errors) 和基础设施 (prisma) 混在一起
2. ⚠️ 不清楚哪些是领域共享，哪些是技术共享
3. ⚠️ 违反了分层架构原则

### lib/shared-kernel/ (纯领域共享)

```
lib/shared-kernel/
├── base/              # ✅ 纯领域基类
├── value-objects/     # ✅ 纯领域值对象
└── exceptions/        # ✅ 纯领域异常

// 基础设施共享依然在 infra/
infra/shared/
├── database/
├── cache/
└── ...
```

**优势**：
1. ✅ 领域层完全独立
2. ✅ 清晰的职责划分
3. ✅ 符合依赖倒置原则

---

## 🔄 迁移建议

### 选项 1：保持现状（Monorepo 共享）

**适用场景**：
- 简单的 CRUD 应用
- 团队不熟悉 DDD
- 快速开发优先

**建议**：
- 在 `backend/libs/` 下明确分类
- 创建 `backend/libs/domain/` 存放领域共享代码
- 创建 `backend/libs/infra/` 存放基础设施共享代码

```
backend/libs/
├── domain/              # 新增：领域共享
│   ├── base/
│   ├── value-objects/
│   └── exceptions/
├── infra/               # 已有：基础设施共享
└── shared/              # 逐步迁移
```

### 选项 2：采用 V3 纯粹 DDD

**适用场景**：
- 复杂业务逻辑
- 长期维护项目
- 团队愿意学习 DDD

**建议**：
- 新功能使用 V3 结构
- 旧功能逐步重构
- 提供培训和文档

---

## 📈 复杂度对比

### 学习曲线

```
简单 ←──────────────────────────────────────→ 复杂
│                                              │
传统 MVC    当前 Monorepo     V3 纯粹 DDD     │
(base-demo)  (base-system)    (v3-structure)  │
                                               │
快速开发 ←──────────────────────────────────→ 长期维护
```

### 适用项目规模

| 架构模式 | 适用接口数 | 团队规模 | 维护周期 |
|---------|-----------|---------|---------|
| 传统 MVC | < 20 | 1-3 人 | < 6 月 |
| 当前 Monorepo | 20-100 | 3-10 人 | 6-24 月 |
| V3 纯粹 DDD | 100+ | 10+ 人 | 2+ 年 |

---

## 🎓 总结

### 当前项目的优缺点

**优点**：
- ✅ 已经有 bounded-contexts 概念
- ✅ 使用了 CQRS 模式
- ✅ 有基本的分层

**可改进**：
- ⚠️ 缺少明确的 shared-kernel
- ⚠️ 领域逻辑和基础设施混合在 `backend/libs/`
- ⚠️ 新开发者不清楚共享代码应该放在哪里

### V3 纯粹 DDD 的价值

**核心价值**：
1. ✅ **清晰的职责划分** - 一眼看出什么是领域，什么是基础设施
2. ✅ **自文档化** - 目录结构就是架构文档
3. ✅ **易于理解** - 新开发者快速上手
4. ✅ **长期可维护** - 适合复杂业务和大型项目

**代价**：
1. ⚠️ 更多的文件夹层级
2. ⚠️ 更陡峭的学习曲线
3. ⚠️ 需要团队统一认知

---

## 💡 最终建议

**根据项目复杂度选择：**

1. **简单项目（< 20 接口）**
   - 使用 `base-demo` 传统 MVC
   - 不需要 DDD

2. **中等项目（20-100 接口）**
   - 使用当前 `base-system` 结构
   - 在 `backend/libs/` 下明确分类

3. **复杂项目（100+ 接口）**
   - 采用 `v3-structure` 纯粹 DDD
   - 投资学习时间，长期收益

**记住**：架构没有银弹，选择最适合的！ 🎯

