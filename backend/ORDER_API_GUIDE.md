# 订单API完整测试指南

## 🎯 快速开始

### 1. 启动后端服务

```bash
cd backend
pnpm start:dev
```

等待服务启动完成，看到以下输出：

```
[Nest] INFO  Application is running on: http://0.0.0.0:9528
```

### 2. 测试API

**方式一：使用 .http 文件（推荐）**

打开 `backend/.http/order-test.http`，点击 "Send Request" 按钮。

**方式二：使用 curl**

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

**方式三：使用 Swagger UI**

访问：http://localhost:9528/api-docs

找到 "Order - 订单管理" 标签，测试接口。

---

## 📊 预期响应

### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "orderId": "01JQWXYZ123ABC",
    "orderNumber": "ORD1736940123001",
    "totalAmount": 198,
    "discountAmount": 59.9,
    "shippingFee": 0,
    "finalAmount": 138.1,
    "paymentInfo": {
      "paymentId": "pay_wechat_1736940123456",
      "qrCodeUrl": "weixin://wxpay/bizpayurl?pr=mockORD1736940123001",
      "expireTime": "2024-01-15T12:30:00.000Z"
    },
    "estimatedDelivery": "2024-01-17T10:00:00.000Z"
  }
}
```

---

## 🔍 控制台日志解析

### 完整执行流程日志

当你发送请求后，后端控制台会显示详细的执行日志。让我们逐步解析：

#### 1️⃣ Controller 层（HTTP 适配层）

```
📥 [Controller] 接收到创建订单请求:
{
  "userId": "user_test_001",
  "items": [...],
  ...
}
```

**说明：** Controller 只负责接收请求，然后创建 Command 发送给 CommandBus。

---

#### 2️⃣ Command Handler（业务编排层）

```
╔═══════════════════════════════════════════════════════════╗
║        开始处理订单创建命令 (Command Handler)             ║
╚═══════════════════════════════════════════════════════════╝
```

**说明：** 进入核心业务逻辑处理器。

---

#### 3️⃣ 阶段1：验证用户

```
【阶段1】验证用户
─────────────────────────────────────
👤 [验证用户] 用户ID: user_test_001
   SQL: SELECT * FROM sys_user WHERE id = 'user_test_001'
   ✅ 用户验证通过: test_user (VIP)
```

**说明：** 
- 验证用户是否存在
- 验证用户是否被禁用
- 获取用户等级（影响折扣）

**真实场景：** 会查询数据库 `sys_user` 表。

---

#### 4️⃣ 阶段2：验证库存并预留

```
【阶段2】验证库存并预留
─────────────────────────────────────
📦 [StockValidator] 开始验证库存...
   商品数量: 1
   检查商品 prod_001 (SKU: sku_001), 需要数量: 2
   ✅ 库存充足，当前库存: 100
   🔒 预留库存: UPDATE product_sku SET reserved_stock = reserved_stock + 2 WHERE sku_id = 'sku_001'
✅ [StockValidator] 库存验证完成，库存已预留
```

**说明：**
- 检查每个商品的库存是否充足
- 如果充足，预留库存（防止超卖）
- 使用 `reserved_stock` 字段暂时锁定库存

**为什么要预留？**
- 防止并发问题：两个用户同时购买最后一件商品
- 订单创建失败时可以释放

**真实场景：** 使用数据库行锁 + 原子操作。

---

#### 5️⃣ 阶段3：验证优惠券并锁定

```
【阶段3】验证优惠券并锁定
─────────────────────────────────────
🎫 [CouponValidator] 验证优惠券: SUMMER2024
   用户ID: user_test_001
   SQL: SELECT * FROM coupon WHERE code = 'SUMMER2024' AND used_by IS NULL
   ✅ 优惠券有效，未被使用
   🔒 锁定优惠券: UPDATE coupon SET locked_by = 'user_test_001', locked_at = NOW() WHERE id = 'coupon_123'
✅ [CouponValidator] 优惠券验证完成并已锁定
```

**说明：**
- 验证优惠券是否存在
- 验证优惠券是否过期
- 验证优惠券是否已被使用
- 临时锁定优惠券（防止被其他订单使用）

**真实场景：** 高并发下，多人可能同时使用同一优惠券。

---

#### 6️⃣ 阶段4：计算订单金额

```
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
```

**说明：**
- 计算商品总额
- 应用会员折扣（根据用户等级）
- 应用优惠券折扣
- 计算运费（满200免运费）
- 计算最终应付金额

**业务规则：**
- VIP 用户享受 5% 折扣
- SVIP 用户享受 10% 折扣
- 订单满 200 元免运费

---

#### 7️⃣ 阶段5：创建订单领域对象

```
【阶段5】创建订单领域对象
─────────────────────────────────────
   创建了 1 个订单明细
🎉 [Order Domain] 订单聚合根已创建: ORD1736940123001
```

**说明：**
- 创建订单明细（OrderItem）
- 创建订单聚合根（Order）
- **自动验证业务规则**：
  - 订单必须有商品
  - 最终金额不能为负
  - 折扣不能大于总额
  - 金额计算必须正确

**DDD 核心概念：**
- `OrderItem` 和 `Order` 是领域对象
- 它们封装了业务规则
- 无效的订单无法创建（会抛出异常）

---

#### 8️⃣ 阶段6：持久化订单（事务）

```
【阶段6】持久化订单（事务）
─────────────────────────────────────
💾 [事务] 开始数据库事务...
   BEGIN TRANSACTION;

   1️⃣  插入订单主表...
   SQL: INSERT INTO orders (id, order_number, user_id, total_amount, ...)
        VALUES ('01JQWXYZ123ABC', 'ORD1736940123001', ...)

   2️⃣  插入订单明细...
   SQL: INSERT INTO order_items (order_id, product_id, sku_id, quantity, price)
        VALUES ('01JQWXYZ123ABC', 'prod_001', 'sku_001', 2, 99)

   3️⃣  扣减库存...
   SQL: UPDATE product_sku SET stock = stock - 2, reserved_stock = reserved_stock - 2
        WHERE sku_id = 'sku_001'

   4️⃣  标记优惠券为已使用...
   SQL: UPDATE coupon SET used_by = 'user_test_001', used_at = NOW(), order_id = '01JQWXYZ123ABC'
        WHERE id = 'coupon_123'

   5️⃣  记录操作日志...
   SQL: INSERT INTO operation_log (user_id, action, details) VALUES (...)

   COMMIT;
   ✅ 事务提交成功
```

**说明：**
- 使用**数据库事务**保证数据一致性
- 5个操作要么全成功，要么全失败
- 如果任何一步失败，自动回滚

**为什么用事务？**
- 防止部分成功：订单创建了但库存没扣
- 防止数据不一致：优惠券被使用了但订单失败

---

#### 9️⃣ 阶段7：发起第三方支付

```
【阶段7】发起第三方支付
─────────────────────────────────────
💳 [PaymentGateway] 发起支付...
   订单ID: 01JQWXYZ123ABC
   金额: ¥138.10
   支付方式: wechat_pay
   用户ID: user_test_001
   
   📱 调用微信支付API...
   POST https://api.mch.weixin.qq.com/v3/pay/transactions/native
   Body: {
     "appid": "wx***",
     "mchid": "mch***",
     "description": "订单支付-01JQWXYZ123ABC",
     "out_trade_no": "01JQWXYZ123ABC",
     "amount": { "total": 13810, "currency": "CNY" }
   }
   
✅ [PaymentGateway] 支付发起成功
   支付ID: pay_wechat_1736940123456
   二维码URL: weixin://wxpay/bizpayurl?pr=mockORD1736940123001
   过期时间: 2024-01-15T12:30:00.000Z
```

**说明：**
- 调用第三方支付API（微信支付/支付宝）
- 获取支付二维码
- 保存支付记录

**真实场景：** 
- 需要配置支付商户号
- 需要签名验证
- 需要处理回调

---

#### 🔟 阶段8：发布领域事件

```
【阶段8】发布领域事件
─────────────────────────────────────
   📢 准备发布事件...
   ✅ 事件已发布，Event Handlers 将异步处理
```

**说明：**
- 发布 `OrderCreatedEvent`
- 发布 `PaymentInitiatedEvent`
- 触发所有注册的 Event Handlers（异步执行）

---

#### 1️⃣1️⃣ Event Handlers（异步任务）

```
🎯 [Event Handler] OrderCreatedHandler 被触发
─────────────────────────────────────
   订单ID: 01JQWXYZ123ABC
   订单号: ORD1736940123001
   用户ID: user_test_001
   总金额: ¥198

   📧 发送邮件通知...
      调用邮件服务 API...
      POST https://api.email-service.com/send
      ✅ 邮件发送成功

   📱 发送短信通知...
      调用短信服务 API...
      POST https://api.sms-service.com/send
      ✅ 短信发送成功

   📝 记录操作日志...
      SQL: INSERT INTO operation_log ...
      ✅ 日志记录成功

   ⚠️  检查库存预警...
      查询商品 prod_001 的剩余库存...
      ✅ 库存检查完成

   ✅ OrderCreatedHandler 处理完成

🎯 [Event Handler] PaymentInitiatedHandler 被触发
─────────────────────────────────────
   订单ID: 01JQWXYZ123ABC
   支付ID: pay_wechat_1736940123456
   金额: ¥138.10
   
   ⏰ 启动支付监控任务...
      设置定时任务: 30分钟后检查支付状态
      如果未支付，将自动取消订单并释放库存
      ✅ 监控任务已设置
   
   🎯 通知推荐系统...
      POST https://api.recommendation.com/update
      ✅ 推荐系统已更新
   
   ✅ PaymentInitiatedHandler 处理完成
```

**说明：**
- Event Handlers **异步执行**，不阻塞主流程
- 订单创建成功后立即返回，后台继续处理
- 即使邮件/短信发送失败，也不影响订单创建

**为什么异步？**
- 提升响应速度：用户不需要等待邮件发送
- 降低耦合：邮件服务故障不影响订单创建
- 提高可靠性：可以重试失败的任务

---

#### 🎊 最终结果

```
╔═══════════════════════════════════════════════════════════╗
║                  ✅ 订单创建成功！                        ║
╚═══════════════════════════════════════════════════════════╝

✅ [Controller] 订单创建成功，返回结果
```

---

## 🔄 错误场景演示

### 场景1：库存不足

修改请求，增加购买数量：

```json
{
  "items": [
    {
      "productId": "prod_001",
      "skuId": "sku_001",
      "quantity": 999  // 超过库存
    }
  ]
}
```

**控制台输出：**

```
【阶段2】验证库存并预留
─────────────────────────────────────
📦 [StockValidator] 开始验证库存...
   检查商品 prod_001, 需要数量: 999
   ❌ 错误: 商品库存不足，当前库存: 100, 需要: 999

╔═══════════════════════════════════════════════════════════╗
║                  ❌ 订单创建失败！                        ║
╚═══════════════════════════════════════════════════════════╝

   错误信息: 商品 prod_001 库存不足...

🔄 开始回滚操作...
─────────────────────────────────────
   (无需回滚，因为还未执行任何写操作)
✅ 回滚完成
```

**响应：**

```json
{
  "code": 400,
  "message": "商品 prod_001 库存不足，当前库存: 100, 需要: 999"
}
```

---

### 场景2：支付接口失败（模拟）

如果在阶段7支付接口调用失败：

```
【阶段7】发起第三方支付
─────────────────────────────────────
💳 [PaymentGateway] 发起支付...
   ❌ 第三方支付API调用失败

╔═══════════════════════════════════════════════════════════╗
║                  ❌ 订单创建失败！                        ║
╚═══════════════════════════════════════════════════════════╝

🔄 开始回滚操作...
─────────────────────────────────────
🔓 [StockValidator] 释放预留库存...
   释放 SKU sku_001 的库存: 2
   ✅ 库存已释放

🔓 [CouponValidator] 解锁优惠券: SUMMER2024
   ✅ 优惠券已解锁

✅ 回滚完成
```

**说明：**
- 数据库事务已回滚（订单记录被删除）
- 库存预留被释放
- 优惠券被解锁
- **数据完全一致，没有遗留问题**

---

## 📁 完整文件结构

```
backend/apps/base-system/src/
├── api/order/                                   # HTTP 适配层
│   ├── dto/
│   │   ├── create-order.dto.ts                 # 请求DTO（带验证规则）
│   │   └── order-response.dto.ts               # 响应DTO
│   └── rest/
│       ├── order.controller.ts                 # 控制器（5行核心代码）
│       └── index.ts
│
└── lib/bounded-contexts/order/                  # 业务逻辑层
    ├── commands/
    │   └── create-order-with-payment.command.ts # 命令定义
    │
    ├── domain/                                  # 领域层（业务规则）
    │   ├── order.ts                            # 订单聚合根 ⭐
    │   ├── order-item.ts                       # 订单明细
    │   ├── money.value-object.ts               # 金额值对象 ⭐
    │   └── events/                             # 领域事件
    │       ├── order-created.event.ts
    │       └── payment-initiated.event.ts
    │
    ├── application/                             # 应用层（编排）
    │   ├── command-handlers/
    │   │   └── create-order-with-payment.handler.ts  # 核心编排器 ⭐⭐⭐
    │   │
    │   ├── event-handlers/                     # 异步任务处理
    │   │   ├── order-created.handler.ts        # 订单创建后
    │   │   └── payment-initiated.handler.ts    # 支付发起后
    │   │
    │   └── service/                            # 应用服务
    │       ├── stock-validator.service.ts      # 库存验证
    │       ├── coupon-validator.service.ts     # 优惠券验证
    │       ├── price-calculator.service.ts     # 价格计算
    │       └── payment-gateway.service.ts      # 支付网关
    │
    └── order.module.ts                          # 模块配置
```

**关键文件：**

- ⭐⭐⭐ `create-order-with-payment.handler.ts` - 核心业务编排
- ⭐ `order.ts` - 订单领域模型，封装业务规则
- ⭐ `money.value-object.ts` - 金额值对象，防止负数等错误

---

## 🎓 核心概念理解

### 1. 为什么 Controller 只有5行代码？

```typescript
@Post('create-with-payment')
async createOrderWithPayment(@Body() dto: CreateOrderDto) {
  const command = new CreateOrderWithPaymentCommand(...);
  const result = await this.commandBus.execute(command);
  return ApiRes.success(result);
}
```

**原因：**
- Controller 只负责 HTTP 适配
- 业务逻辑在 Handler 中
- 便于支持多种协议（HTTP、gRPC、WebSocket）

### 2. 为什么要用值对象（Value Object）？

```typescript
// ❌ 不使用值对象
order.totalAmount = -100;  // 可能出现负数

// ✅ 使用值对象
const amount = Money.from(-100);  // 抛出异常
```

**好处：**
- 封装验证规则
- 防止非法值
- 增强类型安全

### 3. 为什么要发布领域事件？

```typescript
// 订单创建时发布事件
order.apply(new OrderCreatedEvent(...));

// 自动触发多个 Handler（异步）
→ 发送邮件
→ 发送短信
→ 记录日志
→ 库存预警
```

**好处：**
- 解耦业务逻辑
- 异步处理，提升性能
- 易于扩展（新增 Handler 不修改原有代码）

### 4. 为什么要用 CQRS？

**命令（Command）** - 修改数据：
```typescript
const command = new CreateOrderCommand(...);
await commandBus.execute(command);
```

**查询（Query）** - 读取数据：
```typescript
const query = new GetOrderByIdQuery(orderId);
await queryBus.execute(query);
```

**好处：**
- 读写分离，独立优化
- 命令有业务规则，查询注重性能
- 易于扩展（如读写数据库分离）

---

## 🚀 下一步

### 1. 添加查询功能

创建 `GetOrderByIdQuery` 和 `GetOrderByIdHandler`，实现订单查询。

### 2. 添加订单取消功能

创建 `CancelOrderCommand` 和 `CancelOrderHandler`，实现订单取消和库存释放。

### 3. 添加支付回调

创建 `PaymentCallbackController`，处理微信/支付宝的支付回调。

### 4. 添加单元测试

测试领域对象的业务规则：

```typescript
describe('Order Domain', () => {
  it('should not allow negative final amount', () => {
    expect(() => {
      Order.create({
        finalAmount: Money.from(-100),
        ...
      });
    }).toThrow('订单最终金额不能为负数');
  });
});
```

---

## 📝 总结

这个 demo 展示了：

1. ✅ **清晰的分层** - Controller / Handler / Domain / Service
2. ✅ **领域驱动** - 通过 Domain Model 封装业务规则
3. ✅ **事件驱动** - 通过 Event 解耦和异步处理
4. ✅ **CQRS 模式** - 命令和查询分离
5. ✅ **事务保证** - 数据一致性
6. ✅ **错误处理** - 自动回滚机制
7. ✅ **可观察性** - 详细的日志输出

**这就是企业级后端架构的最佳实践！** 🎉

