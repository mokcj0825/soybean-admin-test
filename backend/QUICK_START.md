# 🚀 订单API - 5分钟快速体验

## 第1步：启动服务（1分钟）

```bash
cd backend
pnpm start:dev
```

等待看到：
```
✅ Application is running on: http://0.0.0.0:9528
```

---

## 第2步：发送测试请求（30秒）

**复制并执行：**

```bash
curl -X POST http://localhost:9528/v1/order/create-with-payment \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_001",
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
    "remark": "测试订单"
  }'
```

---

## 第3步：观察控制台（3分钟）

你会看到完整的执行流程：

```
╔═══════════════════════════════════════════════════════════╗
║        开始处理订单创建命令 (Command Handler)             ║
╚═══════════════════════════════════════════════════════════╝

【阶段1】验证用户
─────────────────────────────────────
👤 [验证用户] 用户ID: user_001
   SQL: SELECT * FROM sys_user WHERE id = 'user_001'
   ✅ 用户验证通过: test_user (VIP)

【阶段2】验证库存并预留
─────────────────────────────────────
📦 [StockValidator] 开始验证库存...
   检查商品 prod_001 (SKU: sku_001), 需要数量: 2
   ✅ 库存充足，当前库存: 100
   🔒 预留库存: UPDATE product_sku SET reserved_stock = ...

【阶段3】验证优惠券并锁定
─────────────────────────────────────
🎫 [CouponValidator] 验证优惠券: SUMMER2024
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
🎉 [Order Domain] 订单聚合根已创建: ORD1736940123001

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
   支付ID: pay_wechat_1736940123456
   二维码URL: weixin://wxpay/bizpayurl?pr=mock...

【阶段8】发布领域事件
─────────────────────────────────────
   📢 准备发布事件...
   ✅ 事件已发布

🎯 [Event Handler] OrderCreatedHandler 被触发
   📧 发送邮件通知...  ✅
   📱 发送短信通知...  ✅
   📝 记录操作日志...  ✅
   ⚠️  检查库存预警...  ✅

🎯 [Event Handler] PaymentInitiatedHandler 被触发
   ⏰ 启动支付监控任务...  ✅
   🎯 通知推荐系统...  ✅

╔═══════════════════════════════════════════════════════════╗
║                  ✅ 订单创建成功！                        ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 第4步：查看响应（30秒）

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
      "qrCodeUrl": "weixin://wxpay/bizpayurl?pr=mockORD...",
      "expireTime": "2024-01-15T12:30:00.000Z"
    },
    "estimatedDelivery": "2024-01-17T10:00:00.000Z"
  }
}
```

---

## 🎯 你刚才体验了什么？

### ✅ 8 个完整的业务阶段
1. 用户验证
2. 库存验证并预留
3. 优惠券验证并锁定
4. 价格计算（商品+折扣+运费）
5. 创建订单领域对象
6. 数据库事务提交
7. 发起第三方支付
8. 发布领域事件（触发异步任务）

### ✅ CQRS + DDD + Event-Driven 架构
- **Controller**：只负责接收请求（5行代码）
- **Command Handler**：编排业务逻辑（200行代码）
- **Domain Model**：封装业务规则（150行代码）
- **Event Handlers**：处理异步任务（100行代码）

### ✅ 关键特性
- 🔒 **并发安全**：库存预留机制
- 🔄 **自动回滚**：数据库事务保证
- 📬 **异步处理**：邮件/短信不阻塞主流程
- ✅ **业务规则**：领域对象自动验证
- 📊 **可观察性**：详细的执行日志

---

## 📚 深入学习

### 1. 架构设计
阅读 [DEMO_ORDER_API.md](./DEMO_ORDER_API.md)
- CQRS 是什么？
- DDD 是什么？
- Event-Driven 是什么？

### 2. 对比分析
阅读 [ARCHITECTURE_COMPARISON.md](./ARCHITECTURE_COMPARISON.md)
- 你的方案 vs 现有方案
- 优劣势对比
- 适用场景

### 3. 详细指南
阅读 [ORDER_API_GUIDE.md](./ORDER_API_GUIDE.md)
- 日志详细解析
- 错误场景演示
- 扩展示例

### 4. 代码阅读顺序

**第1步：理解数据流**
```
1. api/order/rest/order.controller.ts         (接收请求)
2. commands/create-order-with-payment.command.ts  (命令定义)
3. command-handlers/create-order-with-payment.handler.ts  (核心逻辑)
```

**第2步：理解领域模型**
```
4. domain/money.value-object.ts    (金额值对象)
5. domain/order-item.ts            (订单明细)
6. domain/order.ts                 (订单聚合根)
```

**第3步：理解事件驱动**
```
7. domain/events/order-created.event.ts
8. event-handlers/order-created.handler.ts
9. event-handlers/payment-initiated.handler.ts
```

---

## 🎓 关键代码片段

### Controller（5行核心代码）

```typescript
@Post('create-with-payment')
async createOrderWithPayment(@Body() dto: CreateOrderDto) {
  const command = new CreateOrderWithPaymentCommand(...);
  const result = await this.commandBus.execute(command);
  return ApiRes.success(result);
}
```

**对比：你的方案需要 100+ 行**

---

### 领域模型（自动验证业务规则）

```typescript
class Order extends AggregateRoot {
  static create(props) {
    const order = new Order();
    // ... 赋值
    
    order.validate();  // ← 自动验证所有业务规则
    
    // 发布领域事件
    order.apply(new OrderCreatedEvent(...));
    
    return order;
  }
  
  private validate() {
    // 规则1：订单必须有商品
    if (!this.items || this.items.length === 0) {
      throw new Error('订单必须包含至少一个商品');
    }
    
    // 规则2：最终金额不能为负
    if (this.finalAmount.isLessThan(Money.zero())) {
      throw new Error('订单最终金额不能为负数');
    }
    
    // 规则3：折扣不能大于总额
    if (this.discountAmount.isGreaterThan(this.totalAmount)) {
      throw new Error('折扣金额不能大于商品总额');
    }
  }
}
```

**对比：你的方案业务规则分散在各处**

---

### 事件驱动（解耦异步任务）

```typescript
// 发布事件
order.apply(new OrderCreatedEvent(...));
order.commit();

// 自动触发多个 Handler（并行执行）
@EventsHandler(OrderCreatedEvent)
class OrderCreatedHandler {
  async handle(event) {
    await Promise.all([
      this.sendEmail(event),      // 异步
      this.sendSMS(event),         // 异步
      this.recordLog(event),       // 异步
      this.checkStock(event),      // 异步
    ]);
  }
}
```

**对比：你的方案所有操作串行，邮件失败导致订单失败**

---

## 💡 核心价值

**这个 demo 教会你：**

1. ✅ 如何设计清晰的分层架构
2. ✅ 如何通过领域模型封装业务规则
3. ✅ 如何使用事件解耦业务逻辑
4. ✅ 如何处理复杂的事务和回滚
5. ✅ 如何保证并发安全
6. ✅ 如何提升代码可测试性
7. ✅ 如何提高系统可扩展性

**从"写代码"到"架构设计"的重要一步！** 🚀

---

## 🎯 下一步行动

1. ✅ **测试完成** - 你已经体验了完整流程
2. 📖 **阅读代码** - 按照上面的顺序理解每个文件
3. 📚 **学习文档** - 深入理解架构概念
4. 🔧 **尝试扩展** - 添加订单查询、取消等功能

---

## 📞 帮助

如有问题，查看以下文档：

- [ORDER_API_README.md](./ORDER_API_README.md) - 总览
- [DEMO_ORDER_API.md](./DEMO_ORDER_API.md) - 架构说明
- [ORDER_API_GUIDE.md](./ORDER_API_GUIDE.md) - 详细指南
- [ARCHITECTURE_COMPARISON.md](./ARCHITECTURE_COMPARISON.md) - 方案对比

**Happy Coding! 🎉**

