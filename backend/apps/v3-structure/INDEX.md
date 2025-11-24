# V3 Structure - 快速导航

## 🚀 5分钟快速理解

### 核心问题的答案

> **问：`lib/bounded-contexts/` 同级应该有什么？**

**答：**

```
lib/
├── shared-kernel/      ⭐⭐⭐ 共享内核（与 bounded-contexts 同级）
│   ├── base/          → 领域层基类（Entity, AggregateRoot, ValueObject）
│   ├── value-objects/ → 通用值对象（Money, Email, PhoneNumber）
│   └── exceptions/    → 领域异常
│
├── bounded-contexts/   ⭐⭐⭐ 限界上下文（业务领域）
│   └── order/
│       ├── domain/          → 领域模型（聚合根、实体、值对象）
│       ├── application/     → 应用服务（Command Handler）
│       ├── commands/        → 命令定义
│       └── ports/           → 端口定义（接口）
│
└── integration/        ⭐ 上下文集成（可选）
    └── events/        → 集成事件
```

---

## 📚 文档导航

### 1. 快速开始
- **[README.md](./README.md)** - 完整目录结构和概述
- **[STRUCTURE.txt](./STRUCTURE.txt)** - 目录树

### 2. 深入理解
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 架构深度解析
  - 为什么需要 shared-kernel？
  - 应该放什么，不应该放什么？
  - 实际案例和最佳实践

### 3. 对比分析
- **[COMPARISON.md](./COMPARISON.md)** - 与当前项目对比
  - 当前 base-system vs V3 纯粹 DDD
  - Monorepo 共享库 vs Shared Kernel
  - 适用场景建议

---

## 🎯 核心文件清单

### Shared Kernel（共享内核）

| 文件 | 职责 | 关键点 |
|-----|------|--------|
| `shared-kernel/base/entity.base.ts` | 实体基类 | 所有实体继承 |
| `shared-kernel/base/aggregate-root.base.ts` | 聚合根基类 | 管理领域事件 |
| `shared-kernel/base/value-object.base.ts` | 值对象基类 | 不可变性 |
| `shared-kernel/value-objects/money.vo.ts` | 金额值对象 | ⭐ 跨上下文共享 |
| `shared-kernel/exceptions/domain.exception.ts` | 领域异常 | 统一异常体系 |

### Bounded Context - Order（订单上下文）

| 文件 | 职责 | 代码行数 |
|-----|------|---------|
| **Domain 层** |
| `domain/entities/order.aggregate.ts` | 订单聚合根 | ~200 行 |
| `domain/entities/order-item.entity.ts` | 订单明细实体 | ~100 行 |
| `domain/value-objects/order-status.vo.ts` | 订单状态 | ~80 行 |
| `domain/events/order-created.event.ts` | 订单创建事件 | ~30 行 |
| **Application 层** |
| `application/command-handlers/create-order-with-payment.handler.ts` | ⭐ 核心编排 | ~300 行 |
| `application/domain-services/price-calculator.service.ts` | 价格计算服务 | ~100 行 |
| `application/event-handlers/order-created.handler.ts` | 事件处理器 | ~60 行 |
| **Ports 层** |
| `ports/order.repository.port.ts` | 仓储接口 | ~40 行 |
| `ports/payment-gateway.port.ts` | 支付网关接口 | ~30 行 |

### Infrastructure（基础设施）

| 文件 | 职责 | 说明 |
|-----|------|------|
| `infra/.../order.repository.impl.ts` | 仓储实现 | 实现端口接口 |
| `infra/.../payment-gateway.adapter.ts` | 支付适配器 | 封装第三方API |

### Presentation（表现层）

| 文件 | 职责 | 代码行数 |
|-----|------|---------|
| `api/order/rest/order.controller.ts` | HTTP 控制器 | ⭐ 只有15行 |
| `api/order/dto/create-order.dto.ts` | 请求 DTO | ~30 行 |

---

## 🔍 关键概念速查

### Shared Kernel vs Bounded Context

| 类型 | 放在 Shared Kernel | 放在 Bounded Context |
|-----|-------------------|---------------------|
| **基类** | ✅ Entity, AggregateRoot | ❌ |
| **值对象** | ✅ Money, Email（多个上下文用） | ✅ OrderStatus（单个上下文） |
| **异常** | ✅ DomainException | ❌ |
| **实体** | ❌ | ✅ Order, OrderItem |
| **服务** | ❌ | ✅ PriceCalculator |

### 依赖方向

```
api/ 
  ↓ depends on
lib/bounded-contexts/application/
  ↓ depends on
lib/bounded-contexts/domain/
  ↓ depends on
lib/shared-kernel/
  ↑ implemented by
infra/
```

---

## 💡 使用指南

### 新增一个功能

**场景**：添加"取消订单"功能

1. **创建 Command**
```typescript
// lib/bounded-contexts/order/commands/cancel-order.command.ts
export class CancelOrderCommand {
  constructor(
    public readonly orderId: string,
    public readonly reason: string,
  ) {}
}
```

2. **创建 Command Handler**
```typescript
// lib/bounded-contexts/order/application/command-handlers/cancel-order.handler.ts
export class CancelOrderHandler {
  async execute(command: CancelOrderCommand) {
    // 1. 查询订单
    // 2. 调用领域方法 order.cancel()
    // 3. 保存
  }
}
```

3. **添加领域方法**
```typescript
// lib/bounded-contexts/order/domain/entities/order.aggregate.ts
class Order extends AggregateRoot {
  cancel(reason: string): void {
    // 业务规则验证
    // 状态变更
    // 发布事件
  }
}
```

4. **添加 Controller 端点**
```typescript
// api/order/rest/order.controller.ts
@Delete(':id')
async cancel(@Param('id') id: string) {
  const command = new CancelOrderCommand(id, 'user_cancelled');
  return await this.cancelOrderHandler.execute(command);
}
```

**注意**：不需要修改任何现有代码！

---

## 🎓 学习路径

### 第一步：理解基础概念（30分钟）
1. 阅读 `shared-kernel/base/entity.base.ts`
2. 阅读 `shared-kernel/value-objects/money.vo.ts`
3. 理解：Entity vs ValueObject

### 第二步：理解领域模型（1小时）
1. 阅读 `domain/entities/order.aggregate.ts`
2. 理解：聚合根如何封装业务规则
3. 理解：领域事件的作用

### 第三步：理解应用层编排（1小时）
1. 阅读 `application/command-handlers/create-order-with-payment.handler.ts`
2. 理解：10个业务阶段的编排
3. 理解：依赖注入和端口

### 第四步：理解依赖倒置（30分钟）
1. 阅读 `ports/order.repository.port.ts`
2. 阅读 `infra/.../order.repository.impl.ts`
3. 理解：接口和实现分离

### 第五步：动手实践（2小时）
1. 运行 `example.test.ts`
2. 添加"取消订单"功能
3. 添加单元测试

**总计：5小时入门**

---

## 📊 与传统架构对比

| 维度 | 传统 MVC | V3 DDD |
|------|---------|--------|
| Controller 代码量 | 190+ 行 | 15 行 |
| 测试难度 | 困难 | 简单 |
| 扩展新功能 | 修改现有代码 | 添加新代码 |
| 学习曲线 | 低 | 高 |
| 长期可维护性 | 低 | 高 |

---

## ⚡ 快速命令

```bash
# 查看完整目录结构
cat backend/apps/v3-structure/STRUCTURE.txt

# 查看某个关键文件
cat backend/apps/v3-structure/src/lib/shared-kernel/value-objects/money.vo.ts

# 运行示例（需要先配置）
npm run demo:v3
```

---

## 🤝 贡献指南

### 添加新的通用值对象

**检查清单**：
- [ ] 是领域概念（不是工具函数）
- [ ] 至少2个上下文需要
- [ ] 各上下文理解一致
- [ ] 不依赖基础设施

如果都满足 → 放在 `shared-kernel/value-objects/`

### 添加新的限界上下文

1. 在 `lib/bounded-contexts/` 下创建新文件夹
2. 复制 `order/` 的结构
3. 实现自己的领域模型
4. 定义自己的端口
5. 在 `infra/` 实现适配器

---

## 📞 FAQ

### Q: shared-kernel 和 monorepo 的 libs 有什么区别？
A: 
- **shared-kernel** - 只包含领域逻辑（Entity、Money、DomainException）
- **backend/libs** - 包含基础设施代码（Prisma、Redis、Decorators）

### Q: 什么时候应该用 V3 架构？
A:
- ✅ 复杂业务逻辑（100+ 接口）
- ✅ 长期维护项目（2+ 年）
- ✅ 大型团队（10+ 人）
- ❌ 简单 CRUD
- ❌ 快速原型

### Q: 如何从现有项目迁移？
A:
1. 新功能使用 V3 结构
2. 旧功能逐步重构
3. 两种架构可以共存

---

## 🎯 总结

**V3 架构的核心价值：**

1. ✅ **回答了你的问题** - `lib/` 下与 `bounded-contexts` 同级的是 `shared-kernel/`
2. ✅ **清晰的职责** - 一眼看出什么是领域，什么是基础设施
3. ✅ **自文档化** - 目录结构就是架构图
4. ✅ **长期可维护** - 适合复杂业务和大型团队

**记住三个关键点：**
- 📦 **Shared Kernel** - 跨上下文的领域共享
- 🎯 **Bounded Context** - 业务上下文隔离
- 🔌 **Ports & Adapters** - 依赖倒置

Happy Coding! 🚀

