# 参团功能实现文档

## 🎯 概述

参团（加入拼团）是拼团系统中**最复杂、最具挑战性**的功能，涉及：

- ⭐⭐⭐⭐⭐ **并发控制**：分布式锁防止超员
- ⭐⭐⭐⭐⭐ **乐观锁**：版本号机制保证一致性
- ⭐⭐⭐⭐ **自动成团判断**：达到人数自动触发
- ⭐⭐⭐⭐ **事件驱动**：解耦成团后的副作用处理

## 📍 API 端点

```
POST /v3/api/order/group-buy/join
```

## 🏗️ 核心实现

### 1️⃣ **分布式锁保护**

```typescript
// 关键：使用分布式锁执行参团逻辑
const lockKey = `group_buy:join:${sessionId}`;
const lockTTL = 5000; // 5秒超时

return await this.distributedLock.executeWithLock(
  lockKey,
  lockTTL,
  async () => {
    return await this.executeJoinLogic(command);
  },
);
```

**为什么需要分布式锁？**

假设一个拼团还差1个名额：

```
时间线：
T1: 用户A查询 → 还有1个名额 → 准备参团
T2: 用户B查询 → 还有1个名额 → 准备参团
T3: 用户A参团成功 → 满员
T4: 用户B参团成功 → 超员！❌
```

使用分布式锁后：

```
T1: 用户A获取锁 → 查询 → 参团 → 释放锁 ✓
T2: 用户B等待锁
T3: 用户B获取锁 → 查询 → 已满员 → 拒绝 ✓
```

### 2️⃣ **乐观锁机制**

```typescript
// 聚合根中维护版本号
private _version: number;

// 参团时版本号+1
addParticipant(userId: string, orderId: string): void {
  // ... 业务逻辑
  this._version += 1;  // 版本号递增
}

// Repository 使用乐观锁更新
async update(session: GroupBuySession): Promise<boolean> {
  const sql = `
    UPDATE group_buy_session
    SET current_count = ?, version = ?
    WHERE id = ? AND version = ?  -- 检查版本号
  `;
  
  if (affectedRows === 0) {
    return false; // 版本冲突
  }
  return true;
}
```

**乐观锁 vs 悲观锁：**

| 特性 | 乐观锁 | 悲观锁 |
|------|--------|--------|
| 实现方式 | 版本号 | 数据库行锁 |
| 冲突处理 | 检测后重试 | 阻塞等待 |
| 性能 | 高（无锁等待） | 低（锁等待） |
| 适用场景 | 冲突少 | 冲突多 |

我们使用**分布式锁 + 乐观锁**的组合：

- **分布式锁**：防止高并发下的超员（粗粒度）
- **乐观锁**：保证数据一致性（细粒度）

### 3️⃣ **聚合根业务逻辑**

```typescript
// GroupBuySession.addParticipant()
addParticipant(userId: string, orderId: string): void {
  // 业务规则验证（聚合根保证不变量）
  if (!this._status.canJoin()) {
    throw new ValidationException('不允许参团');
  }
  
  if (this.isFull()) {
    throw new ValidationException('拼团人数已满');
  }
  
  if (this.hasParticipant(userId)) {
    throw new ValidationException('用户已在该拼团组中');
  }
  
  // 添加参与者
  const participant = GroupBuyParticipant.createMember(userId, orderId);
  this._participants.push(participant);
  this._version += 1;
  
  // 发布领域事件
  this.apply(new UserJoinedGroupBuyEvent(...));
  
  // ⭐ 检查是否成团（自动触发）
  if (this.isCompleted()) {
    this.markAsSucceeded();
  }
}
```

### 4️⃣ **自动成团判断**

```typescript
private markAsSucceeded(): void {
  this._status = SessionStatus.success();
  this._succeededAt = new Date();
  this._version += 1;
  
  // 发布拼团成功事件
  this.apply(new GroupBuySessionSucceededEvent(...));
}
```

当最后一个用户参团时，自动触发成团逻辑！

## 🔄 完整业务流程

```
HTTP Request (POST /v3/api/order/group-buy/join)
    ↓
Controller 验证参数
    ↓
JoinGroupBuyCommand 创建命令
    ↓
JoinGroupBuyHandler 处理命令
    ↓
┌─────────────────────────────────────┐
│  分布式锁保护区域                    │
│                                     │
│  1. validateUser()                 │
│  2. sessionRepository.findById()   │
│  3. 业务规则验证                     │
│     - 拼团状态                       │
│     - 是否过期                       │
│     - 是否满员                       │
│     - 是否重复参团                   │
│  4. 创建订单                         │
│  5. session.addParticipant()       │ ← 聚合根
│     ├─ apply(UserJoinedGroupBuyEvent)
│     └─ 如果成团：markAsSucceeded()
│         └─ apply(GroupBuySessionSucceededEvent)
│  6. sessionRepository.update()      │ ← 乐观锁
│  7. 发起支付                         │
│  8. session.commit()                │ ← 发布事件
│                                     │
└─────────────────────────────────────┘
    ↓
EventBus 分发事件
    ↓
├─ UserJoinedGroupBuyHandler
│  ├─ 发送通知
│  └─ 更新缓存
│
└─ GroupBuySessionSucceededHandler (如果成团)
   ├─ 发送成团通知
   ├─ 更新订单状态
   ├─ 扣减库存
   ├─ 通知仓库发货
   └─ 发放积分
```

## 🧪 测试场景

### 测试 1：基本参团

```bash
npm test -- join-group-buy.test.ts
```

**场景：**
1. 创建一个3人成团的拼团
2. 第1个用户参团 → 当前2/3人
3. 第2个用户参团 → 当前3/3人，**自动成团** 🎉

**验证点：**
- ✅ 参团成功返回正确信息
- ✅ 人数正确递增
- ✅ 最后一人参团时自动成团
- ✅ 状态从 `IN_PROGRESS` 变为 `SUCCESS`

### 测试 2：并发控制

**场景：** 模拟多人同时参团

```typescript
// 3个用户同时参团
const promises = [
  commandBus.execute(new JoinGroupBuyCommand('user_1', sessionId, ...)),
  commandBus.execute(new JoinGroupBuyCommand('user_2', sessionId, ...)),
  commandBus.execute(new JoinGroupBuyCommand('user_3', sessionId, ...)),
];

await Promise.all(promises);
```

**验证点：**
- ✅ 分布式锁保证串行执行
- ✅ 不会出现超员
- ✅ 版本号正确递增

### 测试 3：错误场景

| 场景 | 错误信息 |
|------|---------|
| 不存在的拼团 | 拼团组不存在 |
| 重复参团 | 您已在该拼团组中 |
| 已成团的拼团 | 不允许参团 |
| 已过期的拼团 | 拼团已过期 |

## 🎨 架构亮点

### 1. 双重保护机制

```
┌─────────────────────────────────────┐
│     分布式锁（防止并发超员）          │
│  ┌───────────────────────────────┐  │
│  │  乐观锁（保证数据一致性）      │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   聚合根（业务规则验证） │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 2. 聚合根保证不变量

```typescript
// 所有业务规则都在聚合根内部验证
addParticipant() {
  // ✅ 不变量1：只能在进行中的拼团参团
  if (!this._status.canJoin()) { ... }
  
  // ✅ 不变量2：不能超员
  if (this.isFull()) { ... }
  
  // ✅ 不变量3：不能重复参团
  if (this.hasParticipant(userId)) { ... }
  
  // ✅ 业务逻辑
  this._participants.push(participant);
  
  // ✅ 自动触发成团
  if (this.isCompleted()) {
    this.markAsSucceeded();
  }
}
```

### 3. 事件驱动解耦

```typescript
// 主流程：只负责核心业务
session.addParticipant(userId, orderId);
await repository.update(session);
session.commit(); // 发布事件

// 副作用：通过事件处理器异步处理
@EventsHandler(GroupBuySessionSucceededEvent)
class GroupBuySessionSucceededHandler {
  async handle(event) {
    // 发送通知
    // 更新订单
    // 扣减库存
    // 通知仓库
    // ...
  }
}
```

## 💡 关键代码片段

### 分布式锁实现

```typescript
async executeWithLock<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
): Promise<T> {
  const acquired = await this.acquire(key, ttl);
  
  if (!acquired) {
    throw new Error(`无法获取锁: ${key}`);
  }
  
  try {
    return await fn(); // 执行业务逻辑
  } finally {
    await this.release(key); // 确保释放锁
  }
}
```

### 乐观锁更新

```typescript
async update(session: GroupBuySession): Promise<boolean> {
  const existing = this.sessions.get(session.id);
  
  // 检查版本号
  if (existing.version !== session.version - 1) {
    console.log('版本冲突！');
    return false;
  }
  
  // 保存更新
  await this.save(session);
  return true;
}
```

### 自动成团判断

```typescript
// 在聚合根的 addParticipant 方法中
this._participants.push(participant);
this.apply(new UserJoinedGroupBuyEvent(...));

// ⭐ 关键：自动检查成团
if (this.isCompleted()) {
  this.markAsSucceeded();
}

private markAsSucceeded(): void {
  this._status = SessionStatus.success();
  this._succeededAt = new Date();
  this.apply(new GroupBuySessionSucceededEvent(...));
}
```

## 📊 性能考量

### 1. 锁的粒度

✅ **拼团组级别**：`group_buy:join:{sessionId}`

每个拼团组独立加锁，不影响其他拼团。

❌ **全局锁**：`group_buy:join:global`

所有拼团共享一把锁，性能差。

### 2. 锁的超时时间

```typescript
const lockTTL = 5000; // 5秒
```

- 太短：业务未完成就释放 → 数据不一致
- 太长：锁持有时间长 → 性能差

**最佳实践：** 根据业务处理时间设置，通常 3-10 秒。

### 3. 数据库查询优化

```sql
-- 索引优化
CREATE INDEX idx_session_status ON group_buy_session(status);
CREATE INDEX idx_session_expire ON group_buy_session(expire_time);

-- 使用索引查询
SELECT * FROM group_buy_session
WHERE id = ? AND status = 'IN_PROGRESS';
```

## 🚀 API 使用示例

### 请求示例

```bash
curl -X POST http://localhost:3000/v3/api/order/group-buy/join \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_002",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "shippingAddressId": "addr_002",
    "paymentMethod": "wechat_pay"
  }'
```

### 响应示例（未成团）

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "orderId": "660e8400-e29b-41d4-a716-446655440001",
  "activity": {
    "activityId": "activity_001",
    "productName": "iPhone 15 Pro 256GB",
    "originalPrice": 7999.0,
    "groupBuyPrice": 6999.0
  },
  "requiredCount": 5,
  "currentCount": 3,
  "remainingCount": 2,
  "isCompleted": false,
  "status": "IN_PROGRESS",
  "participants": [
    {
      "userId": "user_001",
      "orderId": "order_001",
      "isLeader": true,
      "joinedAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "userId": "user_002",
      "orderId": "order_002",
      "isLeader": false,
      "joinedAt": "2024-01-15T10:05:00.000Z"
    },
    {
      "userId": "user_003",
      "orderId": "order_003",
      "isLeader": false,
      "joinedAt": "2024-01-15T10:10:00.000Z"
    }
  ],
  "expireTime": "2024-01-16T10:00:00.000Z",
  "paymentInfo": { ... }
}
```

### 响应示例（成团）

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "orderId": "670e8400-e29b-41d4-a716-446655440002",
  "activity": { ... },
  "requiredCount": 5,
  "currentCount": 5,
  "remainingCount": 0,
  "isCompleted": true,  // ⭐ 成团了！
  "status": "SUCCESS",
  "participants": [ ... ],
  "expireTime": "2024-01-16T10:00:00.000Z",
  "paymentInfo": { ... }
}
```

## 🎓 学习要点

### 1. DDD 战术模式

- ✅ **聚合根**：`GroupBuySession` 保证一致性边界
- ✅ **值对象**：`SessionStatus`, `GroupBuyParticipant` 封装业务概念
- ✅ **领域事件**：`UserJoinedGroupBuyEvent`, `GroupBuySessionSucceededEvent`

### 2. CQRS 模式

- ✅ **命令**：`JoinGroupBuyCommand` 表达意图
- ✅ **命令处理器**：`JoinGroupBuyHandler` 编排流程
- ✅ **事件处理器**：处理副作用

### 3. 并发控制

- ✅ **分布式锁**：防止并发超员
- ✅ **乐观锁**：版本号机制
- ✅ **双重保护**：组合使用两种锁

### 4. 事件驱动

- ✅ **领域事件**：记录业务变化
- ✅ **事件处理器**：解耦副作用
- ✅ **异步处理**：提高性能

## 🔗 相关文档

- [quest2.md](../../../quest2.md) - 完整需求文档
- [GROUP_BUY_IMPLEMENTATION.md](./GROUP_BUY_IMPLEMENTATION.md) - 开团功能
- [QUICK_START.md](./QUICK_START.md) - 快速开始

---

**实现时间：** 2024
**复杂度：** ⭐⭐⭐⭐⭐
**核心技术：** 分布式锁 + 乐观锁 + 聚合根 + 事件驱动
**架构模式：** DDD + CQRS + Event Sourcing

