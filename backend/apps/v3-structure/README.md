# V3 Structure - Pure DDD Architecture

这是一个**纯粹的 DDD 分层架构**示例，展示了 `lib/` 下的完整结构。

## 📁 完整目录结构

```
v3-structure/
├── src/
│   ├── api/                              # 🌐 表现层（Presentation Layer）
│   │   └── order/
│   │       ├── dto/                     # 数据传输对象
│   │       │   ├── create-order.dto.ts
│   │       │   └── order-response.dto.ts
│   │       └── rest/                    # REST 控制器
│   │           └── order.controller.ts  # ⭐ 只有15行核心代码
│   │
│   ├── lib/                              # 📚 领域层（Domain Layer）
│   │   ├── shared-kernel/               # ⭐⭐⭐ 共享内核（与 bounded-contexts 同级）
│   │   │   ├── base/                    # 领域层基类
│   │   │   │   ├── entity.base.ts
│   │   │   │   ├── aggregate-root.base.ts
│   │   │   │   ├── value-object.base.ts
│   │   │   │   └── domain-event.base.ts
│   │   │   ├── value-objects/           # 通用值对象
│   │   │   │   ├── money.vo.ts
│   │   │   │   ├── email.vo.ts
│   │   │   │   └── phone-number.vo.ts
│   │   │   └── exceptions/              # 领域异常
│   │   │       └── domain.exception.ts
│   │   │
│   │   ├── bounded-contexts/            # ⭐⭐⭐ 限界上下文
│   │   │   └── order/                   # 订单上下文
│   │   │       ├── domain/              # 领域模型
│   │   │       │   ├── entities/
│   │   │       │   │   ├── order.aggregate.ts    # 订单聚合根
│   │   │       │   │   └── order-item.entity.ts
│   │   │       │   ├── value-objects/
│   │   │       │   │   ├── order-status.vo.ts
│   │   │       │   │   └── shipping-address.vo.ts
│   │   │       │   └── events/
│   │   │       │       ├── order-created.event.ts
│   │   │       │       ├── order-paid.event.ts
│   │   │       │       ├── order-cancelled.event.ts
│   │   │       │       └── payment-initiated.event.ts
│   │   │       │
│   │   │       ├── application/         # 应用服务层
│   │   │       │   ├── command-handlers/
│   │   │       │   │   └── create-order-with-payment.handler.ts
│   │   │       │   ├── event-handlers/
│   │   │       │   │   ├── order-created.handler.ts
│   │   │       │   │   └── payment-initiated.handler.ts
│   │   │       │   └── domain-services/
│   │   │       │       └── price-calculator.service.ts
│   │   │       │
│   │   │       ├── commands/            # 命令定义
│   │   │       │   └── create-order-with-payment.command.ts
│   │   │       │
│   │   │       └── ports/               # 端口定义（接口）
│   │   │           ├── order.repository.port.ts
│   │   │           ├── payment-gateway.port.ts
│   │   │           └── notification.port.ts
│   │   │
│   │   └── integration/                 # ⭐ 上下文集成层（可选）
│   │       └── events/                  # 集成事件
│   │
│   └── infra/                            # 🔧 基础设施层（Infrastructure Layer）
│       └── bounded-contexts/
│           └── order/
│               └── adapters/            # 适配器（端口的实现）
│                   ├── repositories/
│                   │   └── order.repository.impl.ts
│                   ├── payment-gateway/
│                   │   └── payment-gateway.adapter.ts
│                   └── notification/
│                       └── notification.adapter.ts
│
├── example.test.ts                       # 示例测试
└── README.md                             # 本文档
```

---

## 🎯 核心问题的答案

### 问：`lib/` 下与 `bounded-contexts` 同级的应该是什么？

**答：**

1. ✅ **`shared-kernel/`** - 共享内核
   - 跨限界上下文共享的领域逻辑
   - 领域层基类（Entity, AggregateRoot, ValueObject）
   - 通用值对象（Money, Email, PhoneNumber）
   - 领域异常

2. ✅ **`integration/`** - 上下文集成层（可选）
   - 跨上下文的集成事件
   - 防腐层（Anti-Corruption Layer）

---

## 🏗️ 架构分层

### 1. 表现层 (api/)
- **职责**：HTTP 适配、请求验证、响应格式化
- **依赖方向**：依赖 → Application Layer
- **示例**：`OrderController` 只有 15 行核心代码

### 2. 领域层 (lib/)

#### 2.1 Shared Kernel (lib/shared-kernel/)
- **职责**：提供所有上下文共享的领域基础设施
- **包含**：
  - `base/` - Entity, AggregateRoot, ValueObject, DomainEvent
  - `value-objects/` - Money, Email, PhoneNumber
  - `exceptions/` - DomainException, ValidationException

#### 2.2 Bounded Contexts (lib/bounded-contexts/)
- **职责**：业务上下文隔离
- **每个上下文包含**：
  - `domain/` - 聚合根、实体、值对象、领域事件
  - `application/` - 命令处理器、事件处理器、领域服务
  - `commands/` - 命令定义
  - `ports/` - 端口定义（仓储接口、外部服务接口）

#### 2.3 Integration (lib/integration/)
- **职责**：上下文间的集成
- **包含**：集成事件、防腐层

### 3. 基础设施层 (infra/)
- **职责**：技术实现细节
- **包含**：
  - Repository 实现（Prisma/TypeORM）
  - 外部服务适配器（支付网关、通知服务）
- **依赖方向**：实现 ← Ports

---

## 🔑 关键设计原则

### 1. 依赖倒置（Dependency Inversion）
```
api/ → lib/bounded-contexts/order/application/
                ↓
         lib/bounded-contexts/order/ports/
                ↑
              infra/
```

### 2. 单一职责（Single Responsibility）
- **Controller**：HTTP 适配
- **Command Handler**：业务流程编排
- **Domain Model**：业务规则封装
- **Repository**：数据持久化

### 3. 开闭原则（Open-Closed）
- 新增功能：添加新的 Command Handler
- 新增通知方式：添加新的 Event Handler
- 更换数据库：实现新的 Repository Adapter

---

## 💡 核心亮点

### 1. Shared Kernel 的价值

**问题**：如果没有 Shared Kernel 会怎样？

```typescript
// ❌ 不好的做法：每个上下文都定义自己的 Entity 基类
bounded-contexts/order/base/entity.ts
bounded-contexts/user/base/entity.ts
bounded-contexts/payment/base/entity.ts
// 代码重复，不一致

// ✅ 好的做法：统一的基类
shared-kernel/base/entity.base.ts
// 所有上下文共享，保证一致性
```

**Shared Kernel 包含什么**：
- ✅ 领域层基类（所有上下文都需要）
- ✅ 通用值对象（多个上下文使用）
- ✅ 领域异常（统一的异常处理）
- ❌ 不包含业务逻辑（业务逻辑属于特定上下文）

### 2. Bounded Context 的隔离

每个上下文是**独立**的：
- 有自己的领域模型
- 有自己的应用服务
- 有自己的端口定义
- 通过事件进行通信

### 3. 端口与适配器

```typescript
// 端口（Port）- 定义在 lib/bounded-contexts/order/ports/
interface IOrderRepository {
  save(order: Order): Promise<void>;
}

// 适配器（Adapter）- 实现在 infra/
class OrderRepositoryImpl implements IOrderRepository {
  // 使用 Prisma 实现
}
```

**好处**：
- 领域层不依赖具体技术
- 易于测试（Mock 实现）
- 易于更换技术栈

---

## 📊 与传统架构对比

| 维度 | 传统 MVC | V3 DDD Architecture |
|------|---------|---------------------|
| Controller 代码行数 | 190+ | 15 |
| 业务逻辑位置 | Controller | Command Handler |
| 业务规则验证 | 分散各处 | 集中在 Domain Model |
| 共享代码组织 | utils/ helpers/ | shared-kernel/ |
| 可测试性 | 困难 | 简单（依赖注入 + Mock） |
| 可扩展性 | 修改现有代码 | 添加新代码 |
| 学习曲线 | 低 | 高 |
| 适用场景 | 简单CRUD | 复杂业务逻辑 |

---

## 🚀 如何运行

### 1. 查看示例
```bash
# 查看 example.test.ts 了解完整流程
cat backend/apps/v3-structure/src/example.test.ts
```

### 2. 运行测试（需要先配置）
```bash
# 添加到 package.json
"scripts": {
  "demo:v3": "ts-node backend/apps/v3-structure/src/example.test.ts"
}

# 运行
npm run demo:v3
```

---

## 📚 学习路径

### 1. 理解基础概念
- 阅读 `shared-kernel/base/` 下的基类
- 理解 Entity vs ValueObject vs AggregateRoot

### 2. 理解领域模型
- 阅读 `bounded-contexts/order/domain/`
- 看 Order 聚合根如何封装业务规则

### 3. 理解应用层编排
- 阅读 `application/command-handlers/create-order-with-payment.handler.ts`
- 看如何编排 10 个步骤

### 4. 理解依赖倒置
- 看 `ports/` 定义接口
- 看 `infra/` 实现接口

---

## 🎓 总结

**这个架构回答了你的问题：**

> `lib/bounded-contexts/` 同级应该有什么？

**答案：**
1. ✅ **`lib/shared-kernel/`** - 共享内核（领域基础设施）
2. ✅ **`lib/integration/`** - 上下文集成（可选）

**为什么需要这样的结构：**
- 避免代码重复
- 保证核心概念的一致性
- 清晰的职责划分
- 易于维护和扩展

**适用场景：**
- ✅ 复杂业务逻辑
- ✅ 长期维护的项目
- ✅ 团队协作开发
- ❌ 简单 CRUD（用 MVC 就够了）

Happy Coding! 🎉

