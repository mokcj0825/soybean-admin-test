import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';

import { JoinGroupBuyCommand } from '../../commands/join-group-buy.command';
import {
  IGroupBuySessionRepository,
  GROUP_BUY_SESSION_REPOSITORY,
} from '../../ports/group-buy-session.repository.port';
import {
  IDistributedLock,
  DISTRIBUTED_LOCK,
} from '../../ports/distributed-lock.port';
import { GroupBuyValidatorService } from '../domain-services/group-buy-validator.service';

/**
 * 参加拼团命令处理器（参团）
 * 
 * 职责：
 * - 编排参团的业务流程
 * - 处理并发控制（分布式锁）
 * - 使用乐观锁更新拼团组
 * - 判断是否成团
 * 
 * 复杂度：⭐⭐⭐⭐⭐
 * - 并发控制：多人同时参团
 * - 乐观锁：防止超员
 * - 自动成团：达到人数后自动触发
 */
@CommandHandler(JoinGroupBuyCommand)
@Injectable()
export class JoinGroupBuyHandler
  implements ICommandHandler<JoinGroupBuyCommand>
{
  constructor(
    private readonly publisher: EventPublisher,
    @Inject(GROUP_BUY_SESSION_REPOSITORY)
    private readonly sessionRepository: IGroupBuySessionRepository,
    @Inject(DISTRIBUTED_LOCK)
    private readonly distributedLock: IDistributedLock,
    private readonly validator: GroupBuyValidatorService,
  ) {}

  async execute(command: JoinGroupBuyCommand) {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         开始处理参团命令 (Command Handler)               ║');
    console.log('║         ⚡ 高并发场景 - 使用分布式锁                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    const lockKey = `group_buy:join:${command.sessionId}`;
    const lockTTL = 5000; // 5秒锁超时

    try {
      // ============ 关键：使用分布式锁执行参团逻辑 ============
      return await this.distributedLock.executeWithLock(
        lockKey,
        lockTTL,
        async () => {
          return await this.executeJoinLogic(command);
        },
      );
    } catch (error) {
      // ============ 错误处理 ============
      console.log('');
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║                  ❌ 参团失败！                            ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('');
      console.error('   错误信息:', error.message);

      throw error;
    }
  }

  /**
   * 执行参团核心逻辑（在分布式锁保护下）
   */
  private async executeJoinLogic(command: JoinGroupBuyCommand) {
    // ============ 阶段1: 验证用户 ============
    console.log('【阶段1】验证用户');
    console.log('─────────────────────────────────────');
    await this.validateUser(command.userId);

    // ============ 阶段2: 加载拼团组 ============
    console.log('');
    console.log('【阶段2】加载拼团组（使用分布式锁保护）');
    console.log('─────────────────────────────────────');
    const session = await this.sessionRepository.findById(command.sessionId);

    if (!session) {
      throw new BadRequestException('拼团组不存在');
    }

    console.log(`   ✅ 找到拼团组: ${session.id}`);
    console.log(`   商品: ${session.productName}`);
    console.log(`   当前人数: ${session.currentCount}/${session.requiredCount}`);
    console.log(`   状态: ${session.status.toString()}`);
    console.log(`   版本号: ${session.version}`);

    // ============ 阶段3: 业务规则验证 ============
    console.log('');
    console.log('【阶段3】业务规则验证');
    console.log('─────────────────────────────────────');

    // 3.1 验证拼团组状态
    if (!session.status.canJoin()) {
      throw new BadRequestException(
        `拼团组状态为 ${session.status.toString()}，不允许参团`,
      );
    }
    console.log('   ✅ 拼团组状态允许参团');

    // 3.2 验证是否过期
    if (session.isExpired()) {
      throw new BadRequestException('拼团已过期，不允许参团');
    }
    console.log('   ✅ 拼团未过期');

    // 3.3 验证是否已满员
    if (session.isFull()) {
      throw new BadRequestException('拼团人数已满，不允许参团');
    }
    console.log('   ✅ 拼团未满员');

    // 3.4 验证用户是否已在该拼团中
    if (session.hasParticipant(command.userId)) {
      throw new BadRequestException('您已在该拼团组中');
    }
    console.log('   ✅ 用户未参与该拼团');

    // 3.5 验证用户是否在其他同商品的拼团中
    await this.validator.validateUserNotInOtherSession(
      command.userId,
      session.productId,
      session.id,
    );

    // ============ 阶段4: 创建订单 ============
    console.log('');
    console.log('【阶段4】创建参团订单');
    console.log('─────────────────────────────────────');
    const orderId = randomUUID();
    console.log(`   订单ID: ${orderId}`);
    console.log(`   订单类型: GROUP_BUY`);
    console.log(`   关联拼团组: ${session.id}`);
    console.log(`   订单金额: ¥${session.groupBuyPrice.amount}`);
    console.log('   订单状态: PENDING_GROUP (待成团)');
    console.log('   ✅ 订单创建成功（模拟）');

    // ============ 阶段5: 添加参与者到聚合根 ============
    console.log('');
    console.log('【阶段5】添加参与者到拼团组（聚合根）');
    console.log('─────────────────────────────────────');
    console.log(`   当前版本号: ${session.version}`);
    console.log(`   参团前人数: ${session.currentCount}`);

    // 调用聚合根的业务方法（会发布领域事件）
    session.addParticipant(command.userId, orderId);

    console.log(`   参团后人数: ${session.currentCount}`);
    console.log(`   新版本号: ${session.version}`);
    console.log('   ✅ 参与者已添加到聚合根');

    // ============ 阶段6: 使用乐观锁更新拼团组 ============
    console.log('');
    console.log('【阶段6】持久化拼团组（乐观锁）');
    console.log('─────────────────────────────────────');
    console.log('   💡 使用乐观锁机制：');
    console.log('      UPDATE group_buy_session');
    console.log(`      SET current_count = ${session.currentCount},`);
    console.log(`          version = ${session.version}`);
    console.log(`      WHERE id = '${session.id}'`);
    console.log(`        AND version = ${session.version - 1}`);
    console.log('');

    const updateSuccess = await this.sessionRepository.update(session);

    if (!updateSuccess) {
      throw new BadRequestException(
        '参团失败：版本冲突（可能有其他人同时参团），请重试',
      );
    }

    console.log('   ✅ 乐观锁更新成功');

    // ============ 阶段7: 发起支付 ============
    console.log('');
    console.log('【阶段7】发起支付');
    console.log('─────────────────────────────────────');
    const paymentInfo = {
      paymentId: randomUUID(),
      qrCodeUrl: `https://pay.example.com/qr/${orderId}`,
      expireTime: new Date(Date.now() + 15 * 60 * 1000), // 15分钟
    };

    console.log(`   支付ID: ${paymentInfo.paymentId}`);
    console.log(`   支付方式: ${command.paymentMethod}`);
    console.log(`   支付金额: ¥${session.groupBuyPrice.amount}`);
    console.log(`   二维码: ${paymentInfo.qrCodeUrl}`);
    console.log('   ✅ 支付链接已生成');

    // ============ 阶段8: 发布领域事件 ============
    console.log('');
    console.log('【阶段8】发布领域事件');
    console.log('─────────────────────────────────────');
    console.log('   📢 准备发布事件...');

    // 检查是否成团
    const isCompleted = session.status.value === 'SUCCESS';
    if (isCompleted) {
      console.log('   🎉 拼团已成功！将发布 2 个事件：');
      console.log('      1. UserJoinedGroupBuy (用户参团)');
      console.log('      2. GroupBuySessionSucceeded (拼团成功) ⭐');
    } else {
      console.log('   📢 将发布事件：UserJoinedGroupBuy');
      console.log(`   还差 ${session.remainingCount} 人成团`);
    }

    // 合并聚合根到事件发布器
    this.publisher.mergeObjectContext(session);

    // 提交所有领域事件（触发 Event Handlers）
    session.commit();

    console.log('   ✅ 事件已发布');

    // ============ 返回结果 ============
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    if (isCompleted) {
      console.log('║              🎉 参团成功 & 拼团成功！                     ║');
    } else {
      console.log('║                  ✅ 参团成功！                            ║');
    }
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    return {
      sessionId: session.id,
      orderId,
      activity: {
        activityId: session.activityId,
        productName: session.productName,
        originalPrice: session.originalPrice.amount,
        groupBuyPrice: session.groupBuyPrice.amount,
      },
      requiredCount: session.requiredCount,
      currentCount: session.currentCount,
      remainingCount: session.remainingCount,
      isCompleted,
      status: session.status.value,
      participants: session.participants.map((p) => ({
        userId: p.userId,
        orderId: p.orderId,
        isLeader: p.isLeader,
        joinedAt: p.joinedAt.toISOString(),
      })),
      expireTime: session.expireTime.toISOString(),
      paymentInfo: {
        paymentId: paymentInfo.paymentId,
        qrCodeUrl: paymentInfo.qrCodeUrl,
        expireTime: paymentInfo.expireTime.toISOString(),
      },
    };
  }

  /**
   * 验证用户
   */
  private async validateUser(userId: string): Promise<void> {
    console.log(`👤 [验证用户] 用户ID: ${userId}`);

    // 模拟数据库查询
    console.log(`   SQL: SELECT * FROM sys_user WHERE id = '${userId}'`);

    // 模拟用户数据
    const user = {
      id: userId,
      username: 'test_user',
      status: 'ENABLED',
      memberLevel: 'VIP',
    };

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    if (user.status !== 'ENABLED') {
      throw new BadRequestException('用户已被禁用');
    }

    console.log(`   ✅ 用户验证通过: ${user.username} (${user.memberLevel})`);
  }
}

