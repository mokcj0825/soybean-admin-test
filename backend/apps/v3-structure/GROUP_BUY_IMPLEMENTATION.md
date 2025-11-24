# 拼团功能实现文档

## 📋 概述

本文档描述了基于 DDD（领域驱动设计）+ CQRS（命令查询职责分离）+ Event Sourcing 架构实现的**拼团购买**功能。

## 🎯 已实现功能

✅ **创建拼团（开团）** - `POST /v3/api/order/group-buy/create`

### 功能特性

1. **领域驱动设计**：明确的聚合根边界和业务规则封装
2. **命令查询分离**：使用 CommandBus 处理写操作
3. **事件驱动架构**：通过领域事件解耦业务逻辑
4. **端口适配器模式**：清晰的依赖倒置和基础设施抽象
5. **并发控制**：支持分布式锁（模拟实现）
6. **乐观锁**：版本号机制防止并发冲突

## 📁 文件结构

```
backend/apps/v3-structure/src/
│
├── api/                                      # API 层
│   └── order/
│       ├── dto/
│       │   ├── create-group-buy.dto.ts      # 请求 DTO
│       │   └── group-buy-response.dto.ts    # 响应 DTO
│       └── rest/
│           └── group-buy.controller.ts       # HTTP 控制器 ⭐
│
├── lib/                                      # 应用层 + 领域层
│   └── bounded-contexts/
│       └── order/
│           ├── domain/                       # 领域层
│           │   ├── entities/
│           │   │   ├── group-buy-session.aggregate.ts    # 拼团组聚合根 ⭐⭐⭐
│           │   │   └── group-buy-activity.entity.ts      # 拼团活动实体
│           │   ├── value-objects/
│           │   │   ├── session-status.vo.ts              # 拼团状态值对象
│           │   │   └── group-buy-participant.vo.ts       # 参与者值对象
│           │   └── events/                               # 领域事件
│           │       ├── group-buy-session-created.event.ts
│           │       ├── user-joined-group-buy.event.ts
│           │       ├── group-buy-session-succeeded.event.ts
│           │       └── group-buy-session-failed.event.ts
│           │
│           ├── application/                  # 应用层
│           │   ├── command-handlers/
│           │   │   └── create-group-buy.handler.ts      # 开团命令处理器 ⭐⭐
│           │   ├── event-handlers/                      # 事件处理器
│           │   │   ├── group-buy-session-created.handler.ts
│           │   │   ├── user-joined-group-buy.handler.ts
│           │   │   └── group-buy-session-succeeded.handler.ts
│           │   └── domain-services/
│           │       └── group-buy-validator.service.ts   # 拼团验证服务
│           │
│           ├── commands/
│           │   └── create-group-buy.command.ts          # 开团命令
│           │
│           └── ports/                        # 端口（接口定义）
│               ├── group-buy-session.repository.port.ts
│               ├── group-buy-activity.repository.port.ts
│               └── distributed-lock.port.ts
│
├── infra/                                    # 基础设施层
│   └── bounded-contexts/
│       └── order/
│           └── adapters/                     # 适配器（接口实现）
│               ├── repositories/
│               │   ├── group-buy-session.repository.impl.ts  ⭐
│               │   └── group-buy-activity.repository.impl.ts
│               └── lock/
│                   └── distributed-lock.adapter.ts
│
├── group-buy.module.ts                       # 拼团模块 ⭐
├── app.module.ts                             # 主模块
└── group-buy.test.ts                         # 集成测试

```

## 🏗️ 架构分层

### 1️⃣ API 层（Presentation Layer）

**职责：** HTTP 接口暴露、参数验证、DTO 转换

```typescript
@Controller('v3/api/order/group-buy')
export class GroupBuyController {
  @Post('create')
  async createGroupBuy(@Body() dto: CreateGroupBuyDto) {
    const command = new CreateGroupBuyCommand(...);
    return await this.commandBus.execute(command);
  }
}
```

### 2️⃣ 应用层（Application Layer）

**职责：** 编排业务流程、命令处理、事件处理

#### Command Handler（命令处理器）

```typescript
@CommandHandler(CreateGroupBuyCommand)
export class CreateGroupBuyHandler {
  async execute(command: CreateGroupBuyCommand) {
    // 1. 验证用户
    // 2. 加载活动
    // 3. 验证库存
    // 4. 创建拼团组（聚合根）
    // 5. 持久化
    // 6. 发起支付
    // 7. 发布领域事件
  }
}
```

#### Event Handler（事件处理器）

```typescript
@EventsHandler(GroupBuySessionCreatedEvent)
export class GroupBuySessionCreatedHandler {
  async handle(event: GroupBuySessionCreatedEvent) {
    // 副作用：发送通知、启动定时任务、记录日志
  }
}
```

### 3️⃣ 领域层（Domain Layer）

**职责：** 核心业务逻辑、业务规则验证、领域事件发布

#### 聚合根（Aggregate Root）

```typescript
export class GroupBuySession extends AggregateRoot {
  // 创建新拼团
  static create(params: { ... }): GroupBuySession {
    const session = new GroupBuySession(...);
    session.validate(); // 业务规则验证
    session.apply(new GroupBuySessionCreatedEvent(...)); // 发布事件
    return session;
  }

  // 添加参与者
  addParticipant(userId: string, orderId: string): void {
    // 业务规则验证
    if (!this._status.canJoin()) {
      throw new ValidationException('不允许参团');
    }
    
    // 业务逻辑
    const participant = GroupBuyParticipant.createMember(userId, orderId);
    this._participants.push(participant);
    
    // 发布事件
    this.apply(new UserJoinedGroupBuyEvent(...));
    
    // 检查成团
    if (this.isCompleted()) {
      this.markAsSucceeded();
    }
  }
}
```

#### 值对象（Value Object）

```typescript
export class SessionStatus extends ValueObject<SessionStatusProps> {
  canJoin(): boolean {
    return this.value === SessionStatusEnum.IN_PROGRESS;
  }
}
```

### 4️⃣ 基础设施层（Infrastructure Layer）

**职责：** 技术实现、数据持久化、外部服务适配

#### Repository 实现（适配器）

```typescript
@Injectable()
export class GroupBuySessionRepositoryImpl 
  implements IGroupBuySessionRepository {
  
  async save(session: GroupBuySession): Promise<void> {
    // 持久化到数据库
  }
  
  async findById(sessionId: string): Promise<GroupBuySession | null> {
    // 从数据库加载并重建聚合根
    return GroupBuySession.reconstitute(...);
  }
}
```

## 🔄 业务流程

### 创建拼团流程（已实现）

```
HTTP Request
    ↓
Controller (API Layer)
    ↓ CreateGroupBuyCommand
CommandBus
    ↓
CreateGroupBuyHandler (Application Layer)
    ↓
1. validateUser()
2. activityRepository.findById()
3. validator.validateUserLimit()
4. validator.validateStock()
5. GroupBuySession.create() ← Aggregate Root (Domain Layer)
    ↓ apply(GroupBuySessionCreatedEvent)
6. sessionRepository.save() ← Repository (Infrastructure Layer)
7. paymentGateway.initiatePayment()
8. session.commit() ← 发布领域事件
    ↓
EventBus
    ↓
GroupBuySessionCreatedHandler (Application Layer)
    ↓ Side Effects
- 发送通知
- 注册过期监控
- 记录日志
```

## 🎯 核心概念

### 1. 聚合根（Aggregate Root）

**GroupBuySession** 是拼团的聚合根：

- **职责：** 保证拼团组的一致性边界
- **特点：**
  - 唯一入口：所有操作通过聚合根进行
  - 业务规则：封装拼团相关的所有业务逻辑
  - 事件发布：发布领域事件通知其他部分

### 2. 领域事件（Domain Event）

事件驱动架构的核心：

| 事件 | 触发时机 | 处理副作用 |
|------|---------|-----------|
| `GroupBuySessionCreated` | 创建拼团 | 发送通知、启动定时任务 |
| `UserJoinedGroupBuy` | 用户参团 | 通知团长、更新缓存 |
| `GroupBuySessionSucceeded` | 拼团成功 | 通知发货、扣减库存、发放积分 |
| `GroupBuySessionFailed` | 拼团失败 | 退款、释放库存、发放补偿 |

### 3. 端口适配器（Ports & Adapters）

**端口（Port）：** 接口定义

```typescript
export interface IGroupBuySessionRepository {
  save(session: GroupBuySession): Promise<void>;
  findById(sessionId: string): Promise<GroupBuySession | null>;
}

export const GROUP_BUY_SESSION_REPOSITORY = Symbol('...');
```

**适配器（Adapter）：** 接口实现

```typescript
@Injectable()
export class GroupBuySessionRepositoryImpl 
  implements IGroupBuySessionRepository {
  // 具体实现（内存/数据库/文件等）
}
```

**依赖注入：**

```typescript
@Module({
  providers: [
    {
      provide: GROUP_BUY_SESSION_REPOSITORY,
      useClass: GroupBuySessionRepositoryImpl,
    },
  ],
})
```

### 4. CQRS（命令查询职责分离）

**命令（Command）：** 改变系统状态

```typescript
export class CreateGroupBuyCommand {
  constructor(
    public readonly userId: string,
    public readonly activityId: string,
    // ...
  ) {}
}
```

**命令处理器（Command Handler）：**

```typescript
@CommandHandler(CreateGroupBuyCommand)
export class CreateGroupBuyHandler 
  implements ICommandHandler<CreateGroupBuyCommand> {
  async execute(command: CreateGroupBuyCommand) {
    // 编排业务流程
  }
}
```

## 🧪 测试

运行测试：

```bash
cd backend
npm test -- apps/v3-structure/src/group-buy.test.ts
```

测试覆盖：

- ✅ 创建拼团成功场景
- ✅ 无效活动ID的错误处理
- ✅ 架构组件注册验证

## 🚀 API 使用示例

### 请求示例

```bash
curl -X POST http://localhost:3000/v3/api/order/group-buy/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_001",
    "activityId": "activity_001",
    "quantity": 1,
    "shippingAddressId": "addr_001",
    "paymentMethod": "wechat_pay",
    "remark": "请在下午送达"
  }'
```

### 响应示例

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "orderId": "650e8400-e29b-41d4-a716-446655440001",
  "groupBuyUrl": "https://app.example.com/group-buy/550e8400-e29b-41d4-a716-446655440000",
  "qrCodeUrl": "https://pay.example.com/qr/650e8400-e29b-41d4-a716-446655440001",
  "activity": {
    "activityId": "activity_001",
    "productName": "iPhone 15 Pro 256GB",
    "originalPrice": 7999.0,
    "groupBuyPrice": 6999.0
  },
  "requiredCount": 5,
  "currentCount": 1,
  "remainingCount": 4,
  "expireTime": "2024-01-16T12:00:00.000Z",
  "paymentInfo": {
    "paymentId": "750e8400-e29b-41d4-a716-446655440002",
    "qrCodeUrl": "https://pay.example.com/qr/650e8400-e29b-41d4-a716-446655440001",
    "expireTime": "2024-01-15T12:15:00.000Z"
  }
}
```

## 🎨 架构亮点

### 1. 清晰的分层架构

```
API Layer ──────► 接收 HTTP 请求，参数验证
    ↓
Application Layer ──► 编排业务流程，命令/事件处理
    ↓
Domain Layer ────► 核心业务逻辑，业务规则验证
    ↓
Infrastructure Layer ► 技术实现，数据持久化
```

### 2. 依赖倒置原则

- 应用层依赖**端口（接口）**而非具体实现
- 基础设施层实现端口，提供**适配器**
- 通过 DI 容器注入具体实现

### 3. 单一职责原则

- **Controller：** 只负责 HTTP 请求处理
- **Command Handler：** 只负责业务流程编排
- **Aggregate Root：** 只负责领域逻辑和不变量维护
- **Event Handler：** 只负责副作用处理

### 4. 开闭原则

- 新增功能：添加新的 Command Handler 和 Event Handler
- 修改基础设施：替换 Repository 实现（内存 → 数据库）
- 不影响核心业务逻辑

## 📚 后续待实现功能

- [ ] 参团功能 - `POST /v3/api/order/group-buy/join`
- [ ] 查询拼团详情 - `GET /v3/api/order/group-buy/:sessionId`
- [ ] 我的拼团列表 - `GET /v3/api/order/group-buy/my-sessions`
- [ ] 取消拼团 - `POST /v3/api/order/group-buy/:sessionId/cancel`
- [ ] 定时任务：扫描过期拼团
- [ ] 拼团失败退款流程

## 🔗 相关文档

- [quest2.md](../../../quest2.md) - 完整的需求文档
- [NestJS CQRS](https://docs.nestjs.com/recipes/cqrs)
- [DDD 战术模式](https://www.dddcommunity.org/library/tactical-patterns/)

---

**实现时间：** 2024
**架构模式：** DDD + CQRS + Event Sourcing
**框架：** NestJS + TypeScript

