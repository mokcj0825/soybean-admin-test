import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';

import { CreateGroupBuyCommand } from '../../commands/create-group-buy.command';
import { GroupBuySession } from '../../domain/entities/group-buy-session.aggregate';
import { 
  IGroupBuyActivityRepository, 
  GROUP_BUY_ACTIVITY_REPOSITORY 
} from '../../ports/group-buy-activity.repository.port';
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
 * 创建拼团命令处理器（开团）
 * 
 * 职责：
 * - 编排创建拼团的业务流程
 * - 验证用户和活动
 * - 创建拼团组和订单
 * - 发起支付
 */
@CommandHandler(CreateGroupBuyCommand)
@Injectable()
export class CreateGroupBuyHandler
  implements ICommandHandler<CreateGroupBuyCommand>
{
  constructor(
    private readonly publisher: EventPublisher,
    @Inject(GROUP_BUY_ACTIVITY_REPOSITORY)
    private readonly activityRepository: IGroupBuyActivityRepository,
    @Inject(GROUP_BUY_SESSION_REPOSITORY)
    private readonly sessionRepository: IGroupBuySessionRepository,
    @Inject(DISTRIBUTED_LOCK)
    private readonly distributedLock: IDistributedLock,
    private readonly validator: GroupBuyValidatorService,
  ) {}

  async execute(command: CreateGroupBuyCommand) {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         开始处理创建拼团命令 (Command Handler)            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    try {
      // ============ 阶段1: 验证用户 ============
      console.log('【阶段1】验证用户');
      console.log('─────────────────────────────────────');
      await this.validateUser(command.userId);

      // ============ 阶段2: 加载并验证拼团活动 ============
      console.log('');
      console.log('【阶段2】加载并验证拼团活动');
      console.log('─────────────────────────────────────');
      const activity = await this.activityRepository.findById(
        command.activityId,
      );

      if (!activity) {
        throw new BadRequestException('拼团活动不存在');
      }

      console.log(`   ✅ 找到活动: ${activity.productName}`);
      console.log(`   原价: ¥${activity.originalPrice.amount}`);
      console.log(`   拼团价: ¥${activity.groupBuyPrice.amount}`);
      console.log(`   成团人数: ${activity.requiredCount}人`);

      // 验证活动状态
      if (!activity.isActive()) {
        throw new BadRequestException('拼团活动未开始或已结束');
      }

      // ============ 阶段3: 验证用户参团限制 ============
      console.log('');
      console.log('【阶段3】验证用户参团限制');
      console.log('─────────────────────────────────────');
      await this.validator.validateUserLimit(command.userId, command.activityId);

      // ============ 阶段4: 验证库存 ============
      console.log('');
      console.log('【阶段4】验证库存');
      console.log('─────────────────────────────────────');
      const requiredStock = activity.requiredCount * command.quantity;
      console.log(`   需要预留库存: ${requiredStock} 件`);

      await this.validator.validateStock(
        activity.productId,
        activity.skuId,
        requiredStock,
      );

      // ============ 阶段5: 创建拼团组（聚合根） ============
      console.log('');
      console.log('【阶段5】创建拼团组聚合根');
      console.log('─────────────────────────────────────');

      const sessionId = randomUUID();
      const leaderOrderId = randomUUID();

      const session = GroupBuySession.create({
        id: sessionId,
        activityId: activity.id,
        productId: activity.productId,
        productName: activity.productName,
        skuId: activity.skuId,
        originalPrice: activity.originalPrice,
        groupBuyPrice: activity.groupBuyPrice,
        requiredCount: activity.requiredCount,
        leaderId: command.userId,
        leaderOrderId,
        expireHours: 24,
      });

      console.log(`   ✅ 拼团组创建成功`);
      console.log(`   拼团组ID: ${session.id}`);
      console.log(`   成团人数: ${session.requiredCount}人`);
      console.log(`   过期时间: ${session.expireTime.toISOString()}`);

      // ============ 阶段6: 持久化拼团组 ============
      console.log('');
      console.log('【阶段6】持久化拼团组');
      console.log('─────────────────────────────────────');
      await this.sessionRepository.save(session);
      console.log('   ✅ 拼团组已保存到数据库');

      // ============ 阶段7: 创建订单（模拟） ============
      console.log('');
      console.log('【阶段7】创建团长订单');
      console.log('─────────────────────────────────────');
      console.log(`   订单ID: ${leaderOrderId}`);
      console.log(`   订单类型: GROUP_BUY`);
      console.log(`   关联拼团组: ${sessionId}`);
      console.log(`   订单金额: ¥${activity.groupBuyPrice.amount}`);
      console.log('   订单状态: PENDING_GROUP (待成团)');

      // TODO: 创建真实的订单实体
      // const order = Order.createGroupBuyOrder(...)

      // ============ 阶段8: 预留库存 ============
      console.log('');
      console.log('【阶段8】预留库存');
      console.log('─────────────────────────────────────');
      console.log(`   产品: ${activity.productName}`);
      console.log(`   SKU: ${activity.skuId}`);
      console.log(`   预留数量: ${requiredStock}`);
      console.log('   ✅ 库存预留成功（模拟）');

      // ============ 阶段9: 发起支付（模拟） ============
      console.log('');
      console.log('【阶段9】发起支付');
      console.log('─────────────────────────────────────');
      const paymentInfo = {
        paymentId: randomUUID(),
        qrCodeUrl: `https://pay.example.com/qr/${leaderOrderId}`,
        expireTime: new Date(Date.now() + 15 * 60 * 1000), // 15分钟
      };

      console.log(`   支付ID: ${paymentInfo.paymentId}`);
      console.log(`   支付方式: ${command.paymentMethod}`);
      console.log(`   支付金额: ¥${activity.groupBuyPrice.amount}`);
      console.log(`   二维码: ${paymentInfo.qrCodeUrl}`);
      console.log('   ✅ 支付链接已生成');

      // ============ 阶段10: 发布领域事件 ============
      console.log('');
      console.log('【阶段10】发布领域事件');
      console.log('─────────────────────────────────────');
      console.log('   📢 准备发布事件...');

      // 合并聚合根到事件发布器
      this.publisher.mergeObjectContext(session);

      // 提交所有领域事件（触发 Event Handlers）
      session.commit();

      console.log('   ✅ 事件已发布：GroupBuySessionCreated');
      console.log('   ✅ Event Handlers 将异步处理（发送通知、启动定时任务等）');

      // ============ 返回结果 ============
      console.log('');
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║                  ✅ 拼团创建成功！                         ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('');

      return {
        sessionId: session.id,
        orderId: leaderOrderId,
        groupBuyUrl: `https://app.example.com/group-buy/${session.id}`,
        qrCodeUrl: paymentInfo.qrCodeUrl,
        activity: {
          activityId: activity.id,
          productName: activity.productName,
          originalPrice: activity.originalPrice.amount,
          groupBuyPrice: activity.groupBuyPrice.amount,
        },
        requiredCount: session.requiredCount,
        currentCount: session.currentCount,
        remainingCount: session.remainingCount,
        expireTime: session.expireTime.toISOString(),
        paymentInfo: {
          paymentId: paymentInfo.paymentId,
          qrCodeUrl: paymentInfo.qrCodeUrl,
          expireTime: paymentInfo.expireTime.toISOString(),
        },
      };
    } catch (error) {
      // ============ 错误处理 ============
      console.log('');
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║                  ❌ 拼团创建失败！                         ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('');
      console.error('   错误信息:', error.message);

      // TODO: 实现回滚逻辑（释放库存等）

      throw error;
    }
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

