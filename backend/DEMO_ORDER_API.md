# 订单创建API演示文档

## 概述

这是一个完整的"创建订单并发起支付"功能演示，采用 **CQRS + DDD + Event-Driven** 架构。

## 架构亮点

### 1. 分层清晰

```
📁 api/order/                      ← HTTP 适配层
  ├── dto/                         ← 数据传输对象
  └── rest/order.controller.ts     ← 轻量级控制器（仅5行核心代码）

📁 lib/bounded-contexts/order/     ← 业务逻辑层
  ├── commands/                    ← 命令定义
  ├── domain/                      ← 领域模型（业务规则）
  │   ├── order.ts                 ← 订单聚合根
  │   ├── order-item.ts            ← 订单明细
  │   ├── money.value-object.ts    ← 金额值对象
  │   └── events/                  ← 领域事件
  └── application/                 ← 应用层
      ├── command-handlers/        ← 命令处理器（核心业务编排）
      ├── event-handlers/          ← 事件处理器（异步任务）
      └── service/                 ← 应用服务
```

### 2. 关注点分离

| 组件 | 职责 | 代码行数 |
|------|------|---------|
| **Controller** | 接收HTTP请求，返回响应 | ~30行 |
| **Command Handler** | 业务逻辑编排 | ~200行 |
| **Domain Model** | 业务规则验证 | ~150行 |
| **Event Handlers** | 异步任务处理 | ~100行 |
| **Services** | 具体操作执行 | ~400行 |

### 3. 业务流程

```
用户请求
  ↓
Controller (接收请求)
  ↓
创建 Command
  ↓
CommandBus.execute()
  ↓
CreateOrderWithPaymentHandler (核心编排)
  ├─→ 验证用户
  ├─→ 验证库存并预留
  ├─→ 验证优惠券并锁定
  ├─→ 计算价格
  ├─→ 创建订单领域对象
  ├─→ 持久化（事务）
  ├─→ 发起支付
  └─→ 发布领域事件
       ↓
  ┌────┴────┬────────┬────────┐
  ↓         ↓        ↓        ↓
发送邮件  发送短信  记录日志  库存预警
(异步)    (异步)   (异步)   (异步)
```

## 核心概念演示

### 1. 值对象 (Value Object)

`Money` 类封装了金额相关的业务规则：

```typescript
// ❌ 不使用值对象
order.totalAmount = -100;  // 没有验证，可能出现负数

// ✅ 使用值对象
const amount = Money.from(-100);  // 抛出异常："金额不能为负数"
```

### 2. 聚合根 (Aggregate Root)

`Order` 类是订单的聚合根，保证业务规则：

```typescript
// 业务规则自动验证
Order.create({
  totalAmount: Money.from(100),
  discountAmount: Money.from(150),  // 折扣大于总额
  ...
});
// 抛出异常："折扣金额不能大于商品总额"
```

### 3. 领域事件 (Domain Events)

订单创建后自动发布事件，触发后续操作：

```typescript
// 订单创建时
order.apply(new OrderCreatedEvent(...));

// 自动触发
→ OrderCreatedHandler: 发送邮件、短信
→ StockWarningHandler: 检查库存预警
```

### 4. CQRS (命令查询职责分离)

```typescript
// 写操作：通过 Command
const command = new CreateOrderWithPaymentCommand(...);
await commandBus.execute(command);

// 读操作：通过 Query（未在此demo中实现）
const query = new GetOrderByIdQuery(orderId);
await queryBus.execute(query);
```

## 测试方法

### 1. 启动后端服务

```bash
cd backend
pnpm start:dev
```

### 2. 发送测试请求

使用 `backend/.http/order-test.http` 文件测试，或使用 curl：

```bash
curl -X POST http://localhost:9528/v1/order/create-with-payment \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_test_001",
    "items": [
      {
        "productId": "prod_001",
        "skuId": "sku_001",
        "quantity": 2
      }
    ],
    "shippingAddressId": "addr_456",
    "couponCode": "SUMMER2024",
    "paymentMethod": "wechat_pay",
    "remark": "请在下午送达"
  }'
```

### 3. 观察控制台输出

你会看到详细的执行日志，包括：

- ✅ 各阶段的执行过程
- 💾 模拟的 SQL 语句
- 📧 异步任务的触发
- 💳 第三方API调用

## 日志输出示例

```
╔═══════════════════════════════════════════════════════════╗
║        开始处理订单创建命令 (Command Handler)             ║
╚═══════════════════════════════════════════════════════════╝

【阶段1】验证用户
─────────────────────────────────────
👤 [验证用户] 用户ID: user_test_001
   SQL: SELECT * FROM sys_user WHERE id = 'user_test_001'
   ✅ 用户验证通过: test_user (VIP)

【阶段2】验证库存并预留
─────────────────────────────────────
📦 [StockValidator] 开始验证库存...
   商品数量: 1
   检查商品 prod_001 (SKU: sku_001), 需要数量: 2
   ✅ 库存充足，当前库存: 100
   🔒 预留库存: UPDATE product_sku SET reserved_stock = ...

【阶段3】验证优惠券并锁定
─────────────────────────────────────
🎫 [CouponValidator] 验证优惠券: SUMMER2024
   SQL: SELECT * FROM coupon WHERE code = 'SUMMER2024'
   ✅ 优惠券有效，未被使用
   🔒 锁定优惠券

【阶段4】计算订单金额
─────────────────────────────────────
💰 [PriceCalculator] 开始计算订单金额...
   商品 商品1: 99 × 2 = 198
   📊 商品总额: ¥198.00
   🎖️  会员折扣 (VIP 5%): -¥9.90
   🎫 优惠券折扣 (SUMMER2024): -¥50.00
   🚚 运费: ¥0.00

   ━━━━━━━━━━━━━━━━━━━━
   商品总额:   ¥198.00
   优惠金额:  -¥59.90
   运费:      +¥0.00
   ━━━━━━━━━━━━━━━━━━━━
   应付金额:   ¥138.10

【阶段5】创建订单领域对象
─────────────────────────────────────
   创建了 1 个订单明细
🎉 [Order Domain] 订单聚合根已创建: ORD1234567890001

【阶段6】持久化订单（事务）
─────────────────────────────────────
💾 [事务] 开始数据库事务...
   BEGIN TRANSACTION;
   1️⃣  插入订单主表...
   2️⃣  插入订单明细...
   3️⃣  扣减库存...
   4️⃣  标记优惠券为已使用...
   5️⃣  记录操作日志...
   COMMIT;
   ✅ 事务提交成功

【阶段7】发起第三方支付
─────────────────────────────────────
💳 [PaymentGateway] 发起支付...
   📱 调用微信支付API...
   POST https://api.mch.weixin.qq.com/v3/pay/transactions/native
   ✅ 支付发起成功

【阶段8】发布领域事件
─────────────────────────────────────
   📢 准备发布事件...
   ✅ 事件已发布，Event Handlers 将异步处理

🎯 [Event Handler] OrderCreatedHandler 被触发
   📧 发送邮件通知...
   📱 发送短信通知...
   📝 记录操作日志...
   ⚠️  检查库存预警...

🎯 [Event Handler] PaymentInitiatedHandler 被触发
   ⏰ 启动支付监控任务...
   🎯 通知推荐系统...

╔═══════════════════════════════════════════════════════════╗
║                  ✅ 订单创建成功！                        ║
╚═══════════════════════════════════════════════════════════╝
```

## 对比传统方案

### 传统方案（过程式）

```typescript
@Post('/create-order')
async createOrder() {
  // 所有逻辑都在 Controller 中
  await validateUser();
  await validateStock();
  await createOrder();
  await sendEmail();
  await sendSms();
  // 100+ 行代码
}
```

**问题：**
- Controller 太重
- 难以测试
- 难以复用
- 业务规则分散

### 现有方案（CQRS + DDD）

```typescript
// Controller（5行）
@Post('/create-order')
async createOrder(@Body() dto) {
  const command = new CreateOrderCommand(...);
  return await commandBus.execute(command);
}

// Handler（业务编排）
class CreateOrderHandler {
  async execute(command) {
    // 清晰的业务流程
  }
}

// Domain（业务规则）
class Order {
  // 封装业务规则
}

// EventHandler（异步任务）
class OrderCreatedHandler {
  // 处理后续任务
}
```

**优势：**
- ✅ 职责清晰
- ✅ 易于测试
- ✅ 易于扩展
- ✅ 业务规则集中

## 扩展示例

### 添加新功能：订单取消

只需添加：

1. 新的 Command: `CancelOrderCommand`
2. 新的 Handler: `CancelOrderHandler`
3. 新的 Event: `OrderCancelledEvent`

**不需要修改现有代码！**

### 添加新的通知方式：微信推送

只需添加：

1. 新的 EventHandler: `WeChatNotificationHandler`

监听现有的 `OrderCreatedEvent` 即可。

## 总结

这个 demo 展示了：

1. **分层架构** - Controller / Handler / Domain / Service 各司其职
2. **领域驱动** - 通过 Domain Model 封装业务规则
3. **事件驱动** - 通过 Event 解耦业务逻辑
4. **CQRS** - 命令和查询分离
5. **可测试性** - 每个组件都可以独立测试
6. **可扩展性** - 添加新功能不修改现有代码

**这就是企业级后端架构的最佳实践！**

