# 拼团功能快速开始

## 🎉 已完成功能

✅ **创建拼团（开团）** API 已完全实现！  
✅ **参加拼团（参团）** API 已完全实现！⭐⭐⭐⭐⭐

## 📍 API 端点

```
POST /v3/api/order/group-buy/create  # 创建拼团
POST /v3/api/order/group-buy/join    # 参加拼团
```

## 🚀 快速测试

### 方式1：使用 Jest 测试

**测试开团功能：**
```bash
cd backend
npm test -- apps/v3-structure/src/group-buy.test.ts
```

**测试参团功能（包含并发控制和自动成团）：**
```bash
cd backend
npm test -- apps/v3-structure/src/join-group-buy.test.ts
```

### 方式2：使用 HTTP 客户端

如果你的 NestJS 应用已启动，可以直接调用：

**步骤1：创建拼团**
```bash
curl -X POST http://localhost:3000/v3/api/order/group-buy/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_001",
    "activityId": "activity_001",
    "quantity": 1,
    "shippingAddressId": "addr_001",
    "paymentMethod": "wechat_pay"
  }'
```

**步骤2：参加拼团（使用上面返回的 sessionId）**
```bash
curl -X POST http://localhost:3000/v3/api/order/group-buy/join \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_002",
    "sessionId": "你的拼团组ID",
    "shippingAddressId": "addr_002",
    "paymentMethod": "alipay"
  }'
```

### 方式3：查看已有的模拟数据

系统已预置了两个拼团活动：

#### 活动 1：iPhone 15 Pro
```json
{
  "activityId": "activity_001",
  "productName": "iPhone 15 Pro 256GB",
  "originalPrice": 7999.0,
  "groupBuyPrice": 6999.0,
  "requiredCount": 5
}
```

#### 活动 2：AirPods Pro 2
```json
{
  "activityId": "activity_002",
  "productName": "AirPods Pro 2",
  "originalPrice": 1999.0,
  "groupBuyPrice": 1699.0,
  "requiredCount": 3
}
```

## 📊 执行流程可视化

当你调用 API 时，控制台会输出详细的执行日志：

```
═══════════════════════════════════════════════════════════
🚀 收到 HTTP 请求: POST /v3/api/order/group-buy/create
═══════════════════════════════════════════════════════════

╔════════════════════════════════════════════════════════════╗
║         开始处理创建拼团命令 (Command Handler)            ║
╚════════════════════════════════════════════════════════════╝

【阶段1】验证用户
─────────────────────────────────────
   ✅ 用户验证通过

【阶段2】加载并验证拼团活动
─────────────────────────────────────
   ✅ 找到活动: iPhone 15 Pro 256GB

【阶段3】验证用户参团限制
─────────────────────────────────────
   ✅ 用户参团限制验证通过

【阶段4】验证库存
─────────────────────────────────────
   ✅ 库存充足

【阶段5】创建拼团组聚合根
─────────────────────────────────────
   ✅ 拼团组创建成功

【阶段6】持久化拼团组
─────────────────────────────────────
   ✅ 拼团组已保存到数据库

【阶段7】创建团长订单
─────────────────────────────────────
   ✅ 订单创建成功

【阶段8】预留库存
─────────────────────────────────────
   ✅ 库存预留成功

【阶段9】发起支付
─────────────────────────────────────
   ✅ 支付链接已生成

【阶段10】发布领域事件
─────────────────────────────────────
   ✅ 事件已发布：GroupBuySessionCreated

╔════════════════════════════════════════════════════════════╗
║         处理事件: GroupBuySessionCreated                  ║
╚════════════════════════════════════════════════════════════╝

【副作用1】发送通知给团长
【副作用2】注册到过期监控
【副作用3】记录操作日志

╔════════════════════════════════════════════════════════════╗
║                  ✅ 拼团创建成功！                         ║
╚════════════════════════════════════════════════════════════╝
```

## 🏗️ 架构特点

### DDD（领域驱动设计）
- ✅ 聚合根：`GroupBuySession`
- ✅ 实体：`GroupBuyActivity`
- ✅ 值对象：`SessionStatus`, `GroupBuyParticipant`
- ✅ 领域事件：4 个核心事件

### CQRS（命令查询职责分离）
- ✅ 命令：`CreateGroupBuyCommand`
- ✅ 命令处理器：`CreateGroupBuyHandler`
- ✅ 事件处理器：3 个 Event Handlers

### 端口适配器模式
- ✅ 端口（接口）：`IGroupBuySessionRepository`, `IDistributedLock`
- ✅ 适配器（实现）：内存模拟实现
- ✅ 依赖注入：通过 NestJS DI 容器

## 📁 文件位置

```
backend/apps/v3-structure/src/
├── api/order/rest/group-buy.controller.ts          # API 入口
├── lib/bounded-contexts/order/
│   ├── domain/entities/group-buy-session.aggregate.ts  # 核心聚合根
│   └── application/command-handlers/create-group-buy.handler.ts
├── infra/bounded-contexts/order/adapters/
│   └── repositories/group-buy-session.repository.impl.ts
├── group-buy.module.ts                             # 模块定义
└── group-buy.test.ts                               # 测试文件
```

## 📖 详细文档

查看 [GROUP_BUY_IMPLEMENTATION.md](./GROUP_BUY_IMPLEMENTATION.md) 获取完整的实现文档。

## 🎯 已实现功能清单

| 功能 | 状态 | 复杂度 | 说明 |
|------|------|--------|------|
| 创建拼团（开团） | ✅ | ⭐⭐⭐⭐ | POST /v3/api/order/group-buy/create |
| 参加拼团（参团） | ✅ | ⭐⭐⭐⭐⭐ | POST /v3/api/order/group-buy/join<br>包含分布式锁、乐观锁、自动成团 |
| 自动成团判断 | ✅ | ⭐⭐⭐⭐ | 最后一人参团时自动触发 |
| 并发控制 | ✅ | ⭐⭐⭐⭐⭐ | 分布式锁 + 乐观锁 |
| 领域事件驱动 | ✅ | ⭐⭐⭐⭐ | 4个核心事件和处理器 |

## 🎯 下一步

参考 [quest2.md](../../../quest2.md) 实现更多功能：

1. ~~**参团功能**~~ ✅ 已完成！
2. **查询功能** - 查看拼团详情和列表
3. ~~**成团流程**~~ ✅ 已完成（自动触发）！
4. **失败处理** - 定时任务扫描过期拼团并退款

---

**享受 DDD + CQRS 带来的清晰架构！** 🚀

