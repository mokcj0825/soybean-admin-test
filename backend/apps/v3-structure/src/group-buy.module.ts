import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// API Layer
import { GroupBuyController } from './api/order/rest/group-buy.controller';

// Application Layer - Command Handlers
import { CreateGroupBuyHandler } from './lib/bounded-contexts/order/application/command-handlers/create-group-buy.handler';
import { JoinGroupBuyHandler } from './lib/bounded-contexts/order/application/command-handlers/join-group-buy.handler';

// Application Layer - Event Handlers
import { GroupBuySessionCreatedHandler } from './lib/bounded-contexts/order/application/event-handlers/group-buy-session-created.handler';
import { UserJoinedGroupBuyHandler } from './lib/bounded-contexts/order/application/event-handlers/user-joined-group-buy.handler';
import { GroupBuySessionSucceededHandler } from './lib/bounded-contexts/order/application/event-handlers/group-buy-session-succeeded.handler';

// Application Layer - Domain Services
import { GroupBuyValidatorService } from './lib/bounded-contexts/order/application/domain-services/group-buy-validator.service';

// Infrastructure Layer - Repositories
import { GroupBuySessionRepositoryImpl } from './infra/bounded-contexts/order/adapters/repositories/group-buy-session.repository.impl';
import { GroupBuyActivityRepositoryImpl } from './infra/bounded-contexts/order/adapters/repositories/group-buy-activity.repository.impl';

// Infrastructure Layer - Adapters
import { DistributedLockAdapter } from './infra/bounded-contexts/order/adapters/lock/distributed-lock.adapter';

// Ports (DI Tokens)
import { GROUP_BUY_SESSION_REPOSITORY } from './lib/bounded-contexts/order/ports/group-buy-session.repository.port';
import { GROUP_BUY_ACTIVITY_REPOSITORY } from './lib/bounded-contexts/order/ports/group-buy-activity.repository.port';
import { DISTRIBUTED_LOCK } from './lib/bounded-contexts/order/ports/distributed-lock.port';

/**
 * 拼团模块
 * 
 * 职责：
 * - 注册拼团相关的所有组件
 * - 配置依赖注入
 * - 导出必要的服务供其他模块使用
 * 
 * 架构层次：
 * 1. API Layer: Controllers
 * 2. Application Layer: Command/Event Handlers, Domain Services
 * 3. Domain Layer: Aggregates, Entities, Value Objects, Events
 * 4. Infrastructure Layer: Repositories, Adapters
 */
@Module({
  imports: [
    CqrsModule, // 导入 CQRS 支持
  ],
  controllers: [
    GroupBuyController, // HTTP API
  ],
  providers: [
    // ============ Command Handlers ============
    CreateGroupBuyHandler,
    JoinGroupBuyHandler,

    // ============ Event Handlers ============
    GroupBuySessionCreatedHandler,
    UserJoinedGroupBuyHandler,
    GroupBuySessionSucceededHandler,

    // ============ Domain Services ============
    GroupBuyValidatorService,

    // ============ Infrastructure - Repositories ============
    {
      provide: GROUP_BUY_SESSION_REPOSITORY,
      useClass: GroupBuySessionRepositoryImpl,
    },
    {
      provide: GROUP_BUY_ACTIVITY_REPOSITORY,
      useClass: GroupBuyActivityRepositoryImpl,
    },

    // ============ Infrastructure - Adapters ============
    {
      provide: DISTRIBUTED_LOCK,
      useClass: DistributedLockAdapter,
    },
  ],
  exports: [
    // 导出供其他模块使用
    GROUP_BUY_SESSION_REPOSITORY,
    GROUP_BUY_ACTIVITY_REPOSITORY,
    GroupBuyValidatorService,
  ],
})
export class GroupBuyModule {}

