# 复杂业务场景：电商拼团购买

## 需求描述

**功能：多人拼团购买商品**

用户可以发起或参与拼团活动，达到指定人数后订单生效，享受拼团价格。如果拼团失败（超时未成团），自动退款。

---

## 完整业务流程

### 1. 开团流程（发起拼团）

**请求路径：** `POST /v3/api/order/group-buy/create`

**业务步骤：**

1. **接收开团请求**
   - 用户信息
   - 拼团活动ID（包含商品、价格、成团人数等信息）
   - 购买数量
   - 收货地址
   - 支付方式

2. **业务验证**
   - 验证用户状态（是否被封禁）
   - 验证拼团活动是否有效（未过期、未下架、库存充足）
   - 验证用户是否已在其他同商品的拼团中（防止重复参团）
   - 验证收货地址是否属于该用户
   - 验证活动参与次数限制（每人每天限制N次）

3. **创建拼团订单（事务）**
   - 创建拼团组（GroupBuySession）
     - 生成拼团组ID
     - 设置团长
     - 设置成团人数要求
     - 设置过期时间（24小时）
     - 状态：进行中（IN_PROGRESS）
   - 创建团长的订单（Order）
     - 订单类型：GROUP_BUY（拼团）
     - 关联拼团组ID
     - 状态：待成团（PENDING_GROUP）
   - 预留库存（按成团人数 * 商品数量）
   - 创建支付记录

4. **发起支付**
   - 调用第三方支付接口
   - 用户支付拼团价格
   - 支付成功后订单状态更新为：已支付待成团

5. **后续处理**
   - 发布"拼团创建"事件（GroupBuySessionCreated）
   - 发送通知给团长（短信/推送）
   - 生成分享链接和二维码
   - 启动定时任务监控过期时间

6. **返回响应**
   ```typescript
   {
     sessionId: "group_buy_123",
     orderId: "order_456",
     groupBuyUrl: "https://app.com/group-buy/group_buy_123",
     qrCodeUrl: "https://...",
     requiredCount: 5,
     currentCount: 1,
     expireTime: "2024-01-16T12:00:00Z",
     paymentInfo: { ... }
   }
   ```

---

### 2. 参团流程（加入拼团）

**请求路径：** `POST /v3/api/order/group-buy/join`

**业务步骤：**

1. **接收参团请求**
   - 用户信息
   - 拼团组ID
   - 收货地址
   - 支付方式

2. **业务验证**
   - 验证用户状态
   - 验证拼团组是否存在且有效（未过期、未满员、状态为进行中）
   - 验证用户是否已在该拼团组中（防止重复参团）
   - 验证用户是否已在其他同商品的拼团中
   - 验证库存是否充足
   - **并发控制：使用分布式锁防止超卖和超员**

3. **加入拼团（事务）**
   - 更新拼团组参与人数（原子操作）
     - 使用乐观锁或悲观锁防止并发问题
     - 检查是否达到成团人数
   - 创建参团者的订单
     - 订单类型：GROUP_BUY
     - 关联拼团组ID
     - 状态：待成团（PENDING_GROUP）
   - 追加预留库存

4. **发起支付**
   - 调用第三方支付接口
   - 用户支付拼团价格
   - 支付成功后订单状态更新为：已支付待成团

5. **检查是否成团**
   - 如果参与人数达到要求：
     - **触发成团流程（见下文）**
   - 如果未成团：
     - 发布"有新人参团"事件（UserJoinedGroupBuy）
     - 通知团长和已参团用户（还差X人成团）

6. **返回响应**
   ```typescript
   {
     sessionId: "group_buy_123",
     orderId: "order_789",
     requiredCount: 5,
     currentCount: 3,
     remainingCount: 2,
     expireTime: "2024-01-16T12:00:00Z",
     participants: [
       { userId: "user_001", nickname: "张三", avatar: "...", joinedAt: "..." },
       { userId: "user_002", nickname: "李四", avatar: "...", joinedAt: "..." },
       { userId: "user_003", nickname: "王五", avatar: "...", joinedAt: "..." }
     ]
   }
   ```

---

### 3. 成团流程（自动触发）

**触发时机：** 参团人数达到要求时自动触发

**业务步骤：**

1. **更新拼团组状态**
   - 拼团组状态：进行中 → 成功（SUCCESS）
   - 记录成团时间

2. **更新所有订单状态（事务）**
   - 将该拼团组下所有订单状态更新为：待发货（PENDING_SHIPMENT）
   - 从预留库存转为实际扣减库存
   - 记录库存变动日志

3. **发布领域事件**
   - 发布"拼团成功"事件（GroupBuySessionSucceeded）
   - 事件包含：拼团组ID、所有订单ID、参与用户列表

4. **后续处理（Event Handler）**
   - 发送成团通知给所有参与者（短信/推送）
   - 通知仓库准备发货
   - 记录操作日志
   - 更新用户积分/成长值
   - 更新商品销量统计

---

### 4. 拼团失败流程（定时任务 + 手动触发）

**触发时机：** 
- 定时任务扫描过期的拼团组
- 团长主动取消拼团

**业务步骤：**

1. **查询待处理的拼团组**
   - 查询状态为"进行中"且已过期的拼团组
   - 或团长主动取消的拼团组

2. **更新拼团组状态**
   - 拼团组状态：进行中 → 失败（FAILED）
   - 记录失败原因（超时/主动取消）

3. **处理订单和退款（事务）**
   - 将该拼团组下所有订单状态更新为：已取消（CANCELLED）
   - 释放预留库存
   - 对已支付的订单发起退款
     - 调用支付网关退款接口
     - 创建退款记录（RefundRecord）
     - 退款金额 = 订单实付金额

4. **发布领域事件**
   - 发布"拼团失败"事件（GroupBuySessionFailed）
   - 事件包含：拼团组ID、失败原因、参与用户列表

5. **后续处理（Event Handler）**
   - 发送拼团失败通知（短信/推送）
   - 可选：发放优惠券作为补偿
   - 记录操作日志

---

### 5. 查询拼团详情

**请求路径：** `GET /v3/api/order/group-buy/:sessionId`

**返回数据：**
```typescript
{
  sessionId: "group_buy_123",
  status: "IN_PROGRESS" | "SUCCESS" | "FAILED" | "CANCELLED",
  activity: {
    activityId: "activity_001",
    productId: "prod_001",
    productName: "iPhone 15 Pro",
    productImage: "...",
    originalPrice: 7999.00,
    groupBuyPrice: 6999.00,
    requiredCount: 5
  },
  leader: {
    userId: "user_001",
    nickname: "张三",
    avatar: "..."
  },
  participants: [
    {
      userId: "user_001",
      nickname: "张三",
      avatar: "...",
      joinedAt: "2024-01-15T10:00:00Z",
      isLeader: true
    },
    // ... 其他参与者
  ],
  currentCount: 3,
  requiredCount: 5,
  remainingCount: 2,
  createdAt: "2024-01-15T10:00:00Z",
  expireTime: "2024-01-16T10:00:00Z",
  succeededAt: null  // 成团时间，未成团则为null
}
```

---

### 6. 查询我的拼团列表

**请求路径：** `GET /v3/api/order/group-buy/my-sessions`

**查询参数：**
- status: 可选，筛选状态（进行中/成功/失败）
- page: 分页页码
- pageSize: 每页数量

**返回数据：**
```typescript
{
  items: [
    {
      sessionId: "group_buy_123",
      status: "IN_PROGRESS",
      productName: "iPhone 15 Pro",
      productImage: "...",
      groupBuyPrice: 6999.00,
      currentCount: 3,
      requiredCount: 5,
      isLeader: true,
      createdAt: "2024-01-15T10:00:00Z",
      expireTime: "2024-01-16T10:00:00Z"
    },
    // ... 更多拼团
  ],
  total: 10,
  page: 1,
  pageSize: 20
}
```

---

## 核心业务规则

### 1. 拼团活动配置
```typescript
interface GroupBuyActivity {
  id: string;
  productId: string;
  skuId: string;
  originalPrice: number;
  groupBuyPrice: number;
  requiredCount: number;        // 成团人数
  maxSessionsPerUser: number;   // 每人每天可发起的拼团次数
  maxJoinsPerUser: number;      // 每人每天可参与的拼团次数
  startTime: Date;
  endTime: Date;
  totalStock: number;           // 活动总库存
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}
```

### 2. 拼团组状态机
```
IN_PROGRESS (进行中)
  ↓ [人数达到要求]
SUCCESS (成功)

IN_PROGRESS (进行中)
  ↓ [超时 或 团长取消]
FAILED (失败)
  ↓
REFUNDING (退款中)
  ↓
REFUNDED (已退款)
```

### 3. 订单状态机（拼团场景）
```
PENDING_GROUP (待成团，未支付)
  ↓ [支付成功]
PAID_PENDING_GROUP (已支付待成团)
  ↓ [拼团成功]
PENDING_SHIPMENT (待发货)
  ↓
SHIPPED (已发货)
  ↓
COMPLETED (已完成)

PAID_PENDING_GROUP (已支付待成团)
  ↓ [拼团失败]
CANCELLED (已取消)
  ↓
REFUNDED (已退款)
```

### 4. 并发控制要点

- **参团时的并发问题：**
  - 使用分布式锁（Redis）锁定拼团组
  - 使用数据库行锁防止超员
  - 乐观锁：在更新参与人数时检查版本号

- **库存扣减：**
  - 开团时预留库存：`reserved_stock += required_count * quantity`
  - 成团时扣减库存：`stock -= reserved_stock`
  - 拼团失败释放库存：`reserved_stock -= required_count * quantity`

- **支付幂等性：**
  - 支付回调需要防止重复处理
  - 使用支付流水号作为幂等键

---

## 涉及的数据模型

### 1. GroupBuyActivity（拼团活动）
```typescript
{
  id: string;
  productId: string;
  skuId: string;
  originalPrice: number;
  groupBuyPrice: number;
  requiredCount: number;
  maxSessionsPerUser: number;
  maxJoinsPerUser: number;
  startTime: Date;
  endTime: Date;
  totalStock: number;
  soldCount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. GroupBuySession（拼团组）- 聚合根
```typescript
{
  id: string;
  activityId: string;
  leaderId: string;                 // 团长
  status: 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  requiredCount: number;
  currentCount: number;
  createdAt: Date;
  expireTime: Date;
  succeededAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  version: number;                  // 乐观锁版本号
}
```

### 3. GroupBuyParticipant（拼团参与者）
```typescript
{
  id: string;
  sessionId: string;
  userId: string;
  orderId: string;
  isLeader: boolean;
  joinedAt: Date;
}
```

### 4. Order（订单）- 扩展字段
```typescript
{
  // ... 原有订单字段
  orderType: 'NORMAL' | 'GROUP_BUY' | 'PRESALE' | ...;
  groupBuySessionId?: string;       // 关联拼团组
  groupBuyStatus?: 'PENDING' | 'SUCCESS' | 'FAILED';
}
```

### 5. RefundRecord（退款记录）
```typescript
{
  id: string;
  orderId: string;
  userId: string;
  refundAmount: number;
  refundReason: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  refundMethod: string;             // 原路退回
  transactionId: string;            // 第三方退款流水号
  createdAt: Date;
  processedAt?: Date;
}
```

### 6. UserGroupBuyLimit（用户拼团限制记录）
```typescript
{
  userId: string;
  date: string;                     // YYYY-MM-DD
  createdSessionCount: number;      // 今日发起拼团次数
  joinedSessionCount: number;       // 今日参与拼团次数
}
```

---

## 涉及的领域事件

### 1. GroupBuySessionCreated（拼团创建）
```typescript
{
  sessionId: string;
  activityId: string;
  leaderId: string;
  requiredCount: number;
  expireTime: Date;
  createdAt: Date;
}
```
**触发操作：**
- 发送通知给团长
- 启动定时任务监控过期
- 记录操作日志

---

### 2. UserJoinedGroupBuy（用户参团）
```typescript
{
  sessionId: string;
  userId: string;
  orderId: string;
  currentCount: number;
  requiredCount: number;
  joinedAt: Date;
}
```
**触发操作：**
- 发送通知给团长和已参团用户
- 更新拼团组缓存

---

### 3. GroupBuySessionSucceeded（拼团成功）
```typescript
{
  sessionId: string;
  activityId: string;
  participantIds: string[];
  orderIds: string[];
  succeededAt: Date;
}
```
**触发操作：**
- 发送成团通知（短信/推送）
- 通知仓库发货
- 扣减库存
- 更新用户积分
- 更新商品销量

---

### 4. GroupBuySessionFailed（拼团失败）
```typescript
{
  sessionId: string;
  activityId: string;
  participantIds: string[];
  orderIds: string[];
  failureReason: 'TIMEOUT' | 'CANCELLED_BY_LEADER' | 'INSUFFICIENT_STOCK';
  failedAt: Date;
}
```
**触发操作：**
- 发送拼团失败通知
- 发起退款
- 释放库存
- 发放补偿优惠券

---

### 5. GroupBuyRefundCompleted（拼团退款完成）
```typescript
{
  sessionId: string;
  refundRecords: Array<{
    orderId: string;
    userId: string;
    refundAmount: number;
    transactionId: string;
  }>;
  completedAt: Date;
}
```
**触发操作：**
- 发送退款成功通知
- 更新订单状态
- 记录财务流水

---

## 技术挑战和解决方案

### 1. 并发控制
**问题：** 多人同时参团，可能导致超员或库存超卖

**解决方案：**
- Redis 分布式锁：锁定拼团组
  ```typescript
  const lock = await redis.lock(`group_buy:${sessionId}`, 5000);
  try {
    // 执行参团逻辑
  } finally {
    await lock.unlock();
  }
  ```
- 数据库乐观锁：更新拼团组时检查版本号
  ```sql
  UPDATE group_buy_session 
  SET current_count = current_count + 1, version = version + 1
  WHERE id = ? AND version = ? AND current_count < required_count
  ```

---

### 2. 定时任务扫描过期拼团
**问题：** 如何高效扫描和处理过期拼团组

**解决方案：**
- 使用 Redis Sorted Set 存储过期时间
  ```typescript
  // 创建拼团时
  redis.zadd('group_buy:expiring', expireTime.getTime(), sessionId);
  
  // 定时任务扫描
  const expiredSessions = await redis.zrangebyscore(
    'group_buy:expiring',
    0,
    Date.now()
  );
  ```
- 备选方案：数据库定时查询 + 索引优化
  ```sql
  SELECT id FROM group_buy_session
  WHERE status = 'IN_PROGRESS' 
    AND expire_time < NOW()
  LIMIT 100;
  ```

---

### 3. 高并发查询优化
**问题：** 拼团详情页面高频访问，数据库压力大

**解决方案：**
- Redis 缓存拼团组详情
  ```typescript
  const cacheKey = `group_buy:session:${sessionId}`;
  let session = await redis.get(cacheKey);
  if (!session) {
    session = await db.getSession(sessionId);
    await redis.setex(cacheKey, 300, JSON.stringify(session));
  }
  ```
- 读写分离：读操作走从库
- CDN 缓存分享页面

---

### 4. 事务一致性
**问题：** 成团/失败时需要更新多个订单和库存，如何保证一致性

**解决方案：**
- 数据库事务 + Saga 模式
  ```typescript
  // 使用事务更新订单和库存
  await db.transaction(async (tx) => {
    await tx.updateOrders(orderIds, { status: 'PENDING_SHIPMENT' });
    await tx.updateStock(productId, -reservedStock);
    await tx.updateSession(sessionId, { status: 'SUCCESS' });
  });
  
  // 发布事件触发后续补偿操作（发通知、发优惠券等）
  await eventBus.publish(new GroupBuySessionSucceeded(...));
  ```
- 退款失败补偿：记录失败日志，人工/定时重试

---

### 5. 分布式事务
**问题：** 退款涉及订单服务和支付服务，如何保证最终一致性

**解决方案：**
- 可靠事件模式（本地事件表 + 消息队列）
  ```typescript
  // 1. 在事务中更新订单状态并插入事件表
  await db.transaction(async (tx) => {
    await tx.updateOrder(orderId, { status: 'CANCELLED' });
    await tx.insertEvent({
      type: 'REFUND_REQUESTED',
      payload: { orderId, amount }
    });
  });
  
  // 2. 定时任务扫描事件表，发送到消息队列
  // 3. 支付服务消费消息，执行退款
  // 4. 退款完成后发布事件，订单服务更新状态
  ```

---

## API 列表汇总

| 方法 | 路径 | 功能 | 复杂度 |
|-----|------|------|--------|
| POST | `/v3/api/order/group-buy/create` | 创建拼团（开团） | ⭐⭐⭐⭐ |
| POST | `/v3/api/order/group-buy/join` | 参加拼团 | ⭐⭐⭐⭐⭐ |
| GET | `/v3/api/order/group-buy/:sessionId` | 查询拼团详情 | ⭐⭐ |
| GET | `/v3/api/order/group-buy/my-sessions` | 我的拼团列表 | ⭐⭐ |
| POST | `/v3/api/order/group-buy/:sessionId/cancel` | 团长取消拼团 | ⭐⭐⭐ |
| GET | `/v3/api/order/group-buy/available-sessions` | 查询可参与的拼团列表 | ⭐⭐⭐ |

---

## 为什么这个场景复杂？

### 1. **多实体协作**
- 拼团活动（Activity）
- 拼团组（Session）- 聚合根
- 订单（Order）
- 支付记录（Payment）
- 退款记录（Refund）
- 用户限制（UserLimit）

### 2. **复杂的状态机**
- 拼团组：进行中 → 成功/失败
- 订单：待成团 → 已支付待成团 → 待发货/已取消
- 退款：待退款 → 退款中 → 已退款

### 3. **高并发场景**
- 多人同时参团（需要分布式锁）
- 库存扣减（需要原子操作）
- 支付回调（需要幂等性）

### 4. **异步处理**
- 定时任务扫描过期拼团
- 消息队列处理退款
- 事件驱动的通知和补偿

### 5. **分布式事务**
- 退款涉及订单服务和支付服务
- 需要保证最终一致性

### 6. **性能优化**
- Redis 缓存拼团详情
- 数据库查询优化（索引、分页）
- 读写分离

### 7. **领域事件驱动**
- 拼团创建、用户参团、拼团成功、拼团失败
- 事件触发后续操作（通知、退款、发货等）

---

## 期望的文件结构

基于 v3-structure 现有架构，期望的文件组织如下：

```
backend/apps/v3-structure/src/
├── api/
│   └── order/
│       └── rest/
│           └── group-buy.controller.ts              # 拼团 HTTP 接口
│
├── lib/
│   └── bounded-contexts/
│       └── order/
│           ├── domain/
│           │   ├── group-buy-session.aggregate.ts   # 拼团组聚合根 ⭐
│           │   ├── group-buy-activity.entity.ts     # 拼团活动实体
│           │   ├── group-buy-participant.entity.ts  # 参与者实体
│           │   └── refund-record.entity.ts          # 退款记录
│           │
│           ├── application/
│           │   ├── commands/
│           │   │   ├── create-group-buy.command.ts
│           │   │   ├── join-group-buy.command.ts
│           │   │   └── cancel-group-buy.command.ts
│           │   │
│           │   ├── command-handlers/
│           │   │   ├── create-group-buy.handler.ts  # 开团处理器 ⭐
│           │   │   ├── join-group-buy.handler.ts    # 参团处理器 ⭐⭐
│           │   │   └── process-expired-sessions.handler.ts  # 处理过期拼团 ⭐
│           │   │
│           │   ├── queries/
│           │   │   ├── get-session-detail.query.ts
│           │   │   └── get-my-sessions.query.ts
│           │   │
│           │   ├── query-handlers/
│           │   │   ├── get-session-detail.handler.ts
│           │   │   └── get-my-sessions.handler.ts
│           │   │
│           │   ├── event-handlers/
│           │   │   ├── session-created.handler.ts   # 拼团创建事件
│           │   │   ├── user-joined.handler.ts       # 用户参团事件
│           │   │   ├── session-succeeded.handler.ts # 拼团成功事件 ⭐
│           │   │   ├── session-failed.handler.ts    # 拼团失败事件 ⭐
│           │   │   └── refund-completed.handler.ts  # 退款完成事件
│           │   │
│           │   └── domain-services/
│           │       ├── group-buy-validator.service.ts  # 拼团验证服务
│           │       ├── refund-processor.service.ts     # 退款处理服务
│           │       └── stock-manager.service.ts        # 库存管理服务
│           │
│           └── domain-events/
│               ├── session-created.event.ts
│               ├── user-joined.event.ts
│               ├── session-succeeded.event.ts
│               ├── session-failed.event.ts
│               └── refund-completed.event.ts
│
├── infra/
│   └── bounded-contexts/
│       └── order/
│           ├── adapters/
│           │   ├── repositories/
│           │   │   ├── group-buy-session.repository.impl.ts
│           │   │   └── refund-record.repository.impl.ts
│           │   │
│           │   ├── payment-gateway/
│           │   │   └── refund-gateway.adapter.ts     # 退款网关适配器
│           │   │
│           │   ├── cache/
│           │   │   └── redis-cache.adapter.ts        # Redis 缓存适配器
│           │   │
│           │   └── lock/
│           │       └── distributed-lock.adapter.ts   # 分布式锁适配器
│           │
│           └── scheduled-tasks/
│               └── expire-session-scanner.task.ts    # 定时扫描过期拼团
│
└── group-buy.module.ts                               # 拼团模块定义
```

---

## 现在轮到你了！

请用你的架构方案实现以下核心功能：

1. **开团（创建拼团）** - `POST /v3/api/order/group-buy/create`
2. **参团（加入拼团）** - `POST /v3/api/order/group-buy/join` ⭐ 重点：并发控制
3. **拼团成功处理** - 自动触发（通过领域事件）
4. **拼团失败处理** - 定时任务 + 退款

展示出你的设计如何：
- 处理并发问题（分布式锁、乐观锁）
- 保证事务一致性（数据库事务、Saga）
- 使用领域事件驱动后续操作
- 优化性能（缓存、索引）

期待你的实现！🚀

