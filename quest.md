好！我给你一个足够复杂的真实业务场景。

## 复杂业务场景：电商下单并支付

### 需求描述

**功能：用户创建订单并完成支付**

**完整业务流程：**

1. **接收订单请求**
  - 用户信息
  - 商品列表（可能多个商品，每个商品有数量）
  - 收货地址
  - 优惠券代码（可选）
  - 支付方式

2. **业务验证**
  - 验证用户状态（是否被封禁）
  - 验证商品是否存在且上架
  - 验证库存是否充足
  - 验证优惠券是否有效（未过期、未使用、满足使用条件）
  - 验证收货地址是否属于该用户

3. **价格计算**
  - 计算商品原价
  - 应用会员折扣
  - 应用优惠券
  - 计算运费
  - 计算最终应付金额

4. **创建订单（事务）**
  - 创建订单记录
  - 创建订单明细（每个商品一条）
  - 扣减库存（原子操作）
  - 锁定优惠券
  - 生成订单号

5. **发起支付**
  - 调用第三方支付接口（微信支付/支付宝）
  - 获取支付凭证
  - 更新订单支付状态为"待支付"

6. **后续处理**
  - 记录操作日志
  - 发送订单创建通知（邮件/短信）
  - 触发库存预警（如果库存低于阈值）
  - 发布"订单创建"事件（可能触发其他服务，如推荐系统更新）

7. **异常处理**
  - 库存不足 → 回滚，返回错误
  - 支付接口失败 → 回滚库存，释放优惠券
  - 优惠券无效 → 允许继续但不应用优惠
  - 并发问题处理（两个用户同时购买最后一件商品）

### 数据结构

**请求数据：**
```typescript
{
  userId: "user_123",
  items: [
    { productId: "prod_001", quantity: 2, skuId: "sku_001" },
    { productId: "prod_002", quantity: 1, skuId: "sku_002" }
  ],
  shippingAddressId: "addr_456",
  couponCode: "SUMMER2024",
  paymentMethod: "wechat_pay",
  remark: "请在下午送达"
}
```

**响应数据：**
```typescript
{
  orderId: "order_789",
  orderNumber: "202401150001",
  totalAmount: 299.00,
  discountAmount: 50.00,
  shippingFee: 10.00,
  finalAmount: 259.00,
  paymentInfo: {
    paymentId: "pay_xyz",
    qrCodeUrl: "https://...",  // 支付二维码
    expireTime: "2024-01-15T12:30:00Z"
  },
  estimatedDelivery: "2024-01-17"
}
```

### 涉及的数据模型

1. **User（用户）**
  - id, username, email, status, memberLevel

2. **Product（商品）**
  - id, name, price, status, categoryId

3. **ProductSku（商品SKU）**
  - id, productId, attributes, price, stock

4. **Order（订单）**
  - id, orderNumber, userId, totalAmount, status, createdAt

5. **OrderItem（订单明细）**
  - id, orderId, productId, skuId, quantity, price

6. **Coupon（优惠券）**
  - id, code, discountType, discountValue, minAmount, expireDate, usedBy, usedAt

7. **ShippingAddress（收货地址）**
  - id, userId, province, city, district, detail, phone

8. **Payment（支付记录）**
  - id, orderId, amount, method, status, transactionId

9. **OperationLog（操作日志）**
  - id, userId, action, details, createdAt

10. **StockChangeLog（库存变动日志）**
  - id, productId, skuId, changeAmount, reason, orderId

### 涉及的外部依赖

1. **数据库服务**（PostgreSQL）
2. **Redis缓存**（库存锁、分布式锁）
3. **第三方支付API**（微信支付/支付宝）
4. **邮件服务**（发送订单确认邮件）
5. **短信服务**（发送订单通知短信）
6. **库存服务**（可能是独立微服务）
7. **事件总线**（发布订单事件）

---

## 现在轮到你了！

**请用你的方案设计这个功能的文件结构：**

展示出：
1. 文件夹组织结构
2. 每个文件的职责
3. 文件之间如何调用
4. 如何处理共享逻辑（比如多个功能都需要发送邮件）

**我会等你提供你的方案，然后我展示现有脚手架的方案，再详细对比！**

提示：你可以这样组织：
```
api/
  order/
    create-and-pay/
      ???

service/
  order/
    ???

model/
  ???
```

请详细展示你的设计！
