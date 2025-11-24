# Architecture Deep Dive

## 🎯 为什么需要 lib/shared-kernel/?

这是你问题的核心！让我通过实际例子来解释。

### 场景：多个上下文都需要处理金额

#### ❌ 没有 Shared Kernel 的问题

```typescript
// bounded-contexts/order/domain/money.ts
class Money {
  constructor(private amount: number) {}
  add(other: Money) { return new Money(this.amount + other.amount); }
}

// bounded-contexts/payment/domain/money.ts
class Money {  // 重复定义！
  constructor(private amount: number) {}
  add(other: Money) { return new Money(this.amount + other.amount); }
}

// bounded-contexts/refund/domain/money.ts
class Money {  // 又重复了！
  constructor(private amount: number) {}
  add(other: Money) { return new Money(this.amount + other.amount); }
}
```

**问题**：
1. 代码重复
2. 如果修改金额计算规则，需要改 3 个地方
3. 可能出现不一致（A 上下文改了，B 上下文忘记改）
4. Order 上下文的 Money 和 Payment 上下文的 Money 无法互操作

#### ✅ 有 Shared Kernel 的解决方案

```typescript
// shared-kernel/value-objects/money.vo.ts
class Money {  // 只定义一次！
  constructor(private amount: number) {}
  add(other: Money) { return new Money(this.amount + other.amount); }
}

// bounded-contexts/order/ 使用
import { Money } from '../../shared-kernel';

// bounded-contexts/payment/ 使用
import { Money } from '../../shared-kernel';

// bounded-contexts/refund/ 使用
import { Money } from '../../shared-kernel';
```

**好处**：
1. ✅ 代码复用
2. ✅ 统一维护
3. ✅ 保证一致性
4. ✅ 跨上下文互操作

---

## 📦 Shared Kernel 应该包含什么？

### ✅ 应该放在 Shared Kernel

#### 1. 领域层基类
```typescript
shared-kernel/base/
├── entity.base.ts          // 所有实体的基类
├── aggregate-root.base.ts  // 所有聚合根的基类
├── value-object.base.ts    // 所有值对象的基类
└── domain-event.base.ts    // 所有领域事件的基类
```

**原因**：每个上下文都需要这些基础能力

#### 2. 通用值对象
```typescript
shared-kernel/value-objects/
├── money.vo.ts          // 金额（Order, Payment, Refund 都需要）
├── email.vo.ts          // 邮箱（User, Notification 都需要）
├── phone-number.vo.ts   // 电话（User, Order 都需要）
└── address.vo.ts        // 地址（User, Order, Shipping 都需要）
```

**判断标准**：如果 **2个或更多上下文** 都需要，就放在 Shared Kernel

#### 3. 领域异常
```typescript
shared-kernel/exceptions/
└── domain.exception.ts
    ├── DomainException
    ├── ValidationException
    ├── NotFoundException
    └── ConcurrencyException
```

**原因**：统一的异常处理机制

### ❌ 不应该放在 Shared Kernel

#### 1. 业务专属的值对象
```typescript
// ❌ 不要放在 shared-kernel
order/domain/order-status.vo.ts  // 只有 Order 上下文用

// ✅ 应该放在对应上下文
bounded-contexts/order/domain/value-objects/order-status.vo.ts
```

#### 2. 业务专属的实体
```typescript
// ❌ 不要放在 shared-kernel
order/domain/order.aggregate.ts  // 只有 Order 上下文用

// ✅ 应该放在对应上下文
bounded-contexts/order/domain/entities/order.aggregate.ts
```

---

## 🔄 lib/ 下的完整结构

```typescript
lib/
│
├── shared-kernel/              // ⭐ 共享内核（与 bounded-contexts 同级）
│   ├── base/                  // 所有上下文共享的基类
│   ├── value-objects/         // 跨上下文的值对象
│   ├── exceptions/            // 统一的异常体系
│   └── specifications/        // 通用的业务规约（可选）
│
├── bounded-contexts/           // ⭐ 限界上下文（业务领域）
│   ├── order/                 // 订单上下文
│   ├── user/                  // 用户上下文
│   ├── payment/               // 支付上下文
│   └── ...
│
└── integration/                // ⭐ 上下文集成（可选）
    ├── events/                // 跨上下文的集成事件
    └── anti-corruption-layer/ // 防腐层
```

---

## 🎨 依赖关系图

```
┌─────────────────────────────────────────────────┐
│              api/ (表现层)                      │
│              HTTP Controllers                   │
└────────────────────┬────────────────────────────┘
                     │ depends on
                     ↓
┌─────────────────────────────────────────────────┐
│      bounded-contexts/ (限界上下文)             │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  order/                                 │   │
│  │  ├── domain/                            │   │
│  │  ├── application/                       │   │
│  │  └── ports/ ←──────────────┐            │   │
│  └─────────────────────────────┼───────────┘   │
│                                │               │
│  ┌─────────────────────────────┼───────────┐   │
│  │  payment/                   │           │   │
│  │  ├── domain/                │           │   │
│  │  └── ports/ ←───────────────┼───────┐   │   │
│  └─────────────────────────────┼───────┼───┘   │
└────────────────────────────────┼───────┼───────┘
                                 │       │
                     depends on  │       │
                                 ↓       ↓
┌─────────────────────────────────────────────────┐
│         shared-kernel/ (共享内核)               │
│                                                 │
│  ├── base/           ← 所有上下文都依赖         │
│  ├── value-objects/  ← 跨上下文共享             │
│  └── exceptions/     ← 统一异常处理             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│           infra/ (基础设施层)                   │
│                                                 │
│  实现 ports/ 定义的接口                         │
│  ├── repositories/                              │
│  ├── adapters/                                  │
│  └── external-services/                         │
└─────────────────────────────────────────────────┘
```

---

## 💡 实际案例

### 案例 1：Order 和 Payment 都需要处理金额

```typescript
// shared-kernel/value-objects/money.vo.ts
export class Money {
  static from(amount: number): Money { ... }
  add(other: Money): Money { ... }
  subtract(other: Money): Money { ... }
}

// bounded-contexts/order/domain/order.aggregate.ts
import { Money } from '../../../shared-kernel';

class Order {
  private finalAmount: Money;  // 使用共享的 Money
}

// bounded-contexts/payment/domain/payment.aggregate.ts
import { Money } from '../../../shared-kernel';

class Payment {
  private amount: Money;  // 使用相同的 Money
}
```

**好处**：Order 和 Payment 的金额可以直接比较和计算

### 案例 2：每个上下文都需要 Entity 基类

```typescript
// shared-kernel/base/entity.base.ts
export abstract class Entity<T = string> {
  protected readonly _id: T;
  equals(other: Entity<T>): boolean { ... }
}

// bounded-contexts/order/domain/order.aggregate.ts
import { Entity } from '../../../shared-kernel';

class Order extends Entity { ... }  // 继承共享基类

// bounded-contexts/user/domain/user.aggregate.ts
import { Entity } from '../../../shared-kernel';

class User extends Entity { ... }  // 继承相同基类
```

**好处**：所有实体都有统一的行为

---

## 🚫 常见错误

### 错误 1：把业务逻辑放在 Shared Kernel

```typescript
// ❌ 错误：订单状态是 Order 上下文专属的
shared-kernel/value-objects/order-status.vo.ts

// ✅ 正确：放在对应上下文
bounded-contexts/order/domain/value-objects/order-status.vo.ts
```

### 错误 2：过度共享

```typescript
// ❌ 错误：虽然多个上下文都有 "地址"，但可能含义不同
shared-kernel/value-objects/address.vo.ts  // 太泛了

// ✅ 正确：如果含义不同，各自定义
bounded-contexts/order/domain/shipping-address.vo.ts      // 收货地址
bounded-contexts/user/domain/residential-address.vo.ts    // 居住地址
bounded-contexts/billing/domain/billing-address.vo.ts     // 账单地址
```

### 错误 3：Shared Kernel 太大

```typescript
// ❌ 错误：把所有工具函数都放进去
shared-kernel/
├── utils/
│   ├── string-utils.ts   // 这不是领域逻辑
│   ├── date-utils.ts     // 这不是领域逻辑
│   └── array-utils.ts    // 这不是领域逻辑

// ✅ 正确：只放领域相关的
shared-kernel/
├── base/           // 领域层基类
├── value-objects/  // 领域值对象
└── exceptions/     // 领域异常
```

---

## 🎯 总结

### lib/ 下与 bounded-contexts 同级的应该是：

1. ✅ **shared-kernel/** - 共享内核
   - 放什么：领域基类、通用值对象、领域异常
   - 不放什么：业务逻辑、工具函数、基础设施代码

2. ✅ **integration/** - 上下文集成（可选）
   - 放什么：集成事件、防腐层
   - 使用场景：上下文间通信

### 判断标准

**问自己 3 个问题：**
1. 这个概念是否属于领域层？（不是工具函数）
2. 是否有 2+ 个上下文需要？（不是单个上下文专属）
3. 各上下文的理解是否一致？（不是表面相同实则不同）

如果都是 YES → 放在 **shared-kernel**  
如果有 NO → 放在对应的 **bounded-context**

---

## 📚 延伸阅读

- **DDD Blue Book**: Eric Evans 的《领域驱动设计》
- **DDD Red Book**: Vaughn Vernon 的《实现领域驱动设计》
- **Shared Kernel Pattern**: DDD 中的共享内核模式
- **Bounded Context**: 限界上下文的划分原则


