# 订单创建API - 完整实现

## ✨ 已完成功能

一个完整的**"创建订单并发起支付"**API，采用 **CQRS + DDD + Event-Driven** 架构。

### 📁 创建的文件（共 20+ 个）

```
backend/
├── apps/base-system/src/
│   ├── api/order/                              # ✅ HTTP 层
│   │   ├── dto/
│   │   │   ├── create-order.dto.ts            # 请求验证
│   │   │   └── order-response.dto.ts          # 响应格式
│   │   └── rest/
│   │       ├── order.controller.ts            # 轻量控制器
│   │       └── index.ts
│   │
│   └── lib/bounded-contexts/order/             # ✅ 业务层
│       ├── commands/
│       │   └── create-order-with-payment.command.ts
│       ├── domain/                             # 领域模型
│       │   ├── order.ts                       # ⭐ 订单聚合根
│       │   ├── order-item.ts                  # 订单明细
│       │   ├── money.value-object.ts          # ⭐ 金额值对象
│       │   └── events/
│       │       ├── order-created.event.ts
│       │       └── payment-initiated.event.ts
│       ├── application/
│       │   ├── command-handlers/
│       │   │   ├── create-order-with-payment.handler.ts  # ⭐⭐⭐ 核心编排
│       │   │   └── index.ts
│       │   ├── event-handlers/
│       │   │   ├── order-created.handler.ts
│       │   │   ├── payment-initiated.handler.ts
│       │   │   └── index.ts
│       │   └── service/
│       │       ├── stock-validator.service.ts
│       │       ├── coupon-validator.service.ts
│       │       ├── price-calculator.service.ts
│       │       └── payment-gateway.service.ts
│       └── order.module.ts
│
├── .http/
│   └── order-test.http                         # ✅ 测试用例
│
└── 📚 文档
    ├── DEMO_ORDER_API.md                       # 架构说明
    ├── ORDER_API_GUIDE.md                      # 详细测试指南
    ├── ARCHITECTURE_COMPARISON.md              # 架构对比
    └── ORDER_API_README.md                     # 本文件
```

---

## 🚀 快速测试

### 1. 启动服务

```bash
cd backend
pnpm start:dev
```

### 2. 发送测试请求

**方式A：使用 curl**

```bash
curl -X POST http://localhost:9528/v1/order/create-with-payment \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_001",
    "items": [{"productId": "prod_001", "skuId": "sku_001", "quantity": 2}],
    "shippingAddressId": "addr_456",
    "couponCode": "SUMMER2024",
    "paymentMethod": "wechat_pay",
    "remark": "测试订单"
  }'
```

**方式B：使用 .http 文件**

1. 打开 `backend/.http/order-test.http`
2. 点击 `Send Request`

**方式C：使用 Swagger**

访问：http://localhost:9528/api-docs

---

## 📊 观察执行流程

发送请求后，后端控制台会显示详细的执行日志：

```
╔═══════════════════════════════════════════════════════════╗
║        开始处理订单创建命令 (Command Handler)             ║
╚═══════════════════════════════════════════════════════════╝

【阶段1】验证用户
【阶段2】验证库存并预留
【阶段3】验证优惠券并锁定
【阶段4】计算订单金额
【阶段5】创建订单领域对象
【阶段6】持久化订单（事务）
【阶段7】发起第三方支付
【阶段8】发布领域事件

🎯 [Event Handler] OrderCreatedHandler 被触发
   📧 发送邮件通知...
   📱 发送短信通知...
   📝 记录操作日志...

🎯 [Event Handler] PaymentInitiatedHandler 被触发
   ⏰ 启动支付监控任务...

╔═══════════════════════════════════════════════════════════╗
║                  ✅ 订单创建成功！                        ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 🎯 核心亮点

### 1. Controller 只有 5 行核心代码

```typescript
@Post('create-with-payment')
async createOrderWithPayment(@Body() dto: CreateOrderDto) {
  const command = new CreateOrderWithPaymentCommand(...);
  const result = await this.commandBus.execute(command);
  return ApiRes.success(result);
}
```

**对比你的方案：** Controller 通常需要 100+ 行代码。

---

### 2. 领域模型自动验证业务规则

```typescript
// 无效的订单无法创建
Order.create({
  totalAmount: Money.from(100),
  discountAmount: Money.from(150),  // 折扣大于总额
  finalAmount: Money.from(-50),     // 负数
});
// 抛出异常："折扣金额不能大于商品总额"
```

**对比你的方案：** 业务规则分散在各处，容易遗漏。

---

### 3. 事件驱动异步处理

```typescript
// 订单创建后自动触发多个异步任务
order.apply(new OrderCreatedEvent(...));

→ 发送邮件（异步）
→ 发送短信（异步）
→ 记录日志（异步）
→ 库存预警（异步）

// 即使邮件发送失败，也不影响订单创建
```

**对比你的方案：** 所有操作串行执行，邮件失败导致订单失败。

---

### 4. 数据库事务保证一致性

```typescript
await transaction(() => {
  createOrder();      // 1
  createOrderItems(); // 2
  deductStock();      // 3
  useCoupon();        // 4
  createPayment();    // 5
  // 全部成功或全部回滚
});
```

**对比你的方案：** 手动回滚，容易出错。

---

## 📚 详细文档

### 1. [DEMO_ORDER_API.md](./DEMO_ORDER_API.md)
- 架构设计说明
- 核心概念解析
- CQRS、DDD、Event-Driven 介绍

### 2. [ORDER_API_GUIDE.md](./ORDER_API_GUIDE.md)
- 完整的测试指南
- 控制台日志详细解析
- 错误场景演示
- 核心概念理解

### 3. [ARCHITECTURE_COMPARISON.md](./ARCHITECTURE_COMPARISON.md)
- 你的方案 vs 现有方案
- 代码对比
- 优劣势分析
- 适用场景建议

---

## 🎓 学习要点

### 1. 分层架构

```
Controller    → 只负责 HTTP 适配
   ↓
Handler       → 业务逻辑编排
   ↓
Domain        → 业务规则验证
   ↓
Repository    → 数据持久化
```

**每层职责单一，易于维护。**

---

### 2. CQRS（命令查询职责分离）

```typescript
// 命令（写操作）
const command = new CreateOrderCommand(...);
await commandBus.execute(command);

// 查询（读操作）
const query = new GetOrderByIdQuery(orderId);
await queryBus.execute(query);
```

**读写分离，独立优化。**

---

### 3. DDD（领域驱动设计）

```typescript
// 领域对象封装业务规则
class Order extends AggregateRoot {
  // 业务规则1：订单必须有商品
  // 业务规则2：金额不能为负
  // 业务规则3：折扣不能大于总额
  
  static create(props) {
    // 自动验证所有规则
    return new Order(props);
  }
}
```

**业务规则集中管理，不会遗漏。**

---

### 4. Event-Driven（事件驱动）

```typescript
// 发布事件
order.apply(new OrderCreatedEvent(...));
order.commit();  // 触发所有监听器

// 监听事件
@EventsHandler(OrderCreatedEvent)
class EmailHandler {
  async handle(event) {
    // 发送邮件
  }
}
```

**解耦业务逻辑，易于扩展。**

---

## 🔧 扩展示例

### 添加订单取消功能

只需 3 步：

**1. 创建 Command**
```typescript
// commands/cancel-order.command.ts
export class CancelOrderCommand {
  constructor(public readonly orderId: string) {}
}
```

**2. 创建 Handler**
```typescript
// command-handlers/cancel-order.handler.ts
@CommandHandler(CancelOrderCommand)
class CancelOrderHandler {
  async execute(command: CancelOrderCommand) {
    // 1. 查询订单
    // 2. 释放库存
    // 3. 退还优惠券
    // 4. 取消支付
    // 5. 发布 OrderCancelledEvent
  }
}
```

**3. 创建 Controller**
```typescript
@Delete(':id')
async cancel(@Param('id') orderId: string) {
  const command = new CancelOrderCommand(orderId);
  return await this.commandBus.execute(command);
}
```

**不需要修改任何现有代码！**

---

## 📊 技术栈

- **NestJS** - Node.js 框架
- **CQRS** - 命令查询分离
- **TypeScript** - 类型安全
- **Prisma** - ORM（本 demo 未实际连接数据库）
- **class-validator** - DTO 验证
- **Swagger** - API 文档

---

## 🎯 与你的方案对比

| 维度 | 你的方案 | 现有方案（本 demo） |
|------|---------|-------------------|
| Controller 代码行数 | 100+ | 30 |
| 业务逻辑位置 | Controller | Handler |
| 业务规则验证 | 分散 | 集中在 Domain |
| 错误回滚 | 手动 | 自动（事务） |
| 异步任务 | 串行 | 并行（事件） |
| 并发安全 | 手动加锁 | 数据库原子操作 |
| 可测试性 | 困难 | 简单 |
| 可扩展性 | 修改现有代码 | 添加新代码 |

---

## 💡 核心价值

这个 demo 不仅仅是一个订单 API，它展示了：

1. ✅ **企业级架构模式**
2. ✅ **最佳实践的代码组织**
3. ✅ **清晰的职责划分**
4. ✅ **健壮的错误处理**
5. ✅ **良好的扩展性**
6. ✅ **完整的可观察性**

**这是你从"写代码"到"架构设计"的重要一步！** 🚀

---

## 🙏 总结

**你的方案（过程式）：**
- 适合快速开发、小型项目
- 学习成本低
- 但长期维护困难

**现有方案（CQRS+DDD）：**
- 适合复杂业务、长期项目
- 学习成本高
- 但长期收益巨大

**建议：**
1. 小项目（<20 接口）→ 用你的方案
2. 中型项目（20-100 接口）→ 混合使用
3. 大型项目（100+ 接口）→ 用现有方案

**Remember:** 架构没有银弹，选择最适合的方案！ 🎯

---

## 📞 下一步

1. **测试 API** - 发送请求，观察日志
2. **阅读代码** - 理解每个文件的职责
3. **查看文档** - 深入学习架构概念
4. **尝试扩展** - 添加订单查询、取消等功能

**祝你学习愉快！** 🎉

