import { Injectable } from '@nestjs/common';
import { IGroupBuySessionRepository } from '../../../../../lib/bounded-contexts/order/ports/group-buy-session.repository.port';
import { GroupBuySession } from '../../../../../lib/bounded-contexts/order/domain/entities/group-buy-session.aggregate';
import { Money } from '../../../../../lib/shared-kernel';
import { SessionStatus } from '../../../../../lib/bounded-contexts/order/domain/value-objects/session-status.vo';
import { GroupBuyParticipant } from '../../../../../lib/bounded-contexts/order/domain/value-objects/group-buy-participant.vo';

/**
 * 拼团组仓储实现（内存模拟）
 * 
 * 职责：实现拼团组的持久化操作
 * 
 * 注意：这是内存模拟实现，实际项目中应该使用数据库（TypeORM/Prisma）
 */
@Injectable()
export class GroupBuySessionRepositoryImpl implements IGroupBuySessionRepository {
  // 内存存储（模拟数据库）
  private readonly sessions: Map<string, any> = new Map();

  async save(session: GroupBuySession): Promise<void> {
    console.log('   💾 [Repository] 保存拼团组到数据库...');

    // 转换为持久化对象
    const persistenceData = {
      id: session.id,
      activityId: session.activityId,
      productId: session.productId,
      productName: session.productName,
      skuId: session.skuId,
      originalPrice: session.originalPrice.amount,
      groupBuyPrice: session.groupBuyPrice.amount,
      currency: session.groupBuyPrice.currency,
      requiredCount: session.requiredCount,
      leaderId: session.leaderId,
      participants: session.participants.map((p) => ({
        userId: p.userId,
        orderId: p.orderId,
        isLeader: p.isLeader,
        joinedAt: p.joinedAt,
      })),
      status: session.status.value,
      expireTime: session.expireTime,
      version: session.version,
      succeededAt: session.succeededAt,
      failedAt: session.failedAt,
      failureReason: session.failureReason,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };

    this.sessions.set(session.id, persistenceData);

    console.log(`   SQL: INSERT INTO group_buy_session (...) VALUES (...)`);
    console.log(`   ✅ 拼团组已保存: ${session.id}`);
  }

  async findById(sessionId: string): Promise<GroupBuySession | null> {
    console.log(`   🔍 [Repository] 查询拼团组: ${sessionId}`);

    const data = this.sessions.get(sessionId);

    if (!data) {
      console.log('   ❌ 未找到拼团组');
      return null;
    }

    console.log('   ✅ 找到拼团组');

    // 重建聚合根
    return this.reconstitute(data);
  }

  async findInProgressByActivityId(
    activityId: string,
  ): Promise<GroupBuySession[]> {
    console.log(`   🔍 [Repository] 查询活动的进行中拼团组: ${activityId}`);

    const sessions = Array.from(this.sessions.values())
      .filter(
        (data) =>
          data.activityId === activityId && data.status === 'IN_PROGRESS',
      )
      .map((data) => this.reconstitute(data));

    console.log(`   ✅ 找到 ${sessions.length} 个拼团组`);
    return sessions;
  }

  async findByUserId(userId: string): Promise<GroupBuySession[]> {
    console.log(`   🔍 [Repository] 查询用户的拼团组: ${userId}`);

    const sessions = Array.from(this.sessions.values())
      .filter((data) =>
        data.participants.some((p: any) => p.userId === userId),
      )
      .map((data) => this.reconstitute(data));

    console.log(`   ✅ 找到 ${sessions.length} 个拼团组`);
    return sessions;
  }

  async findExpiredSessions(limit: number): Promise<GroupBuySession[]> {
    console.log(`   🔍 [Repository] 查询过期的拼团组（限制 ${limit} 条）`);

    const now = new Date();
    const sessions = Array.from(this.sessions.values())
      .filter(
        (data) =>
          data.status === 'IN_PROGRESS' && new Date(data.expireTime) < now,
      )
      .slice(0, limit)
      .map((data) => this.reconstitute(data));

    console.log(`   ✅ 找到 ${sessions.length} 个过期拼团组`);
    return sessions;
  }

  async update(session: GroupBuySession): Promise<boolean> {
    console.log('   💾 [Repository] 更新拼团组（乐观锁）...');

    const existing = this.sessions.get(session.id);

    if (!existing) {
      console.log('   ❌ 拼团组不存在');
      return false;
    }

    // 乐观锁：检查版本号
    if (existing.version !== session.version - 1) {
      console.log(
        `   ❌ 版本冲突: 期望 ${existing.version}, 实际 ${session.version - 1}`,
      );
      return false;
    }

    // 保存更新
    await this.save(session);
    console.log('   ✅ 更新成功');
    return true;
  }

  /**
   * 重建聚合根（从持久化数据）
   */
  private reconstitute(data: any): GroupBuySession {
    const participants = data.participants.map((p: any) =>
      p.isLeader
        ? GroupBuyParticipant.createLeader(p.userId, p.orderId)
        : GroupBuyParticipant.createMember(p.userId, p.orderId),
    );

    return GroupBuySession.reconstitute(
      data.id,
      {
        activityId: data.activityId,
        productId: data.productId,
        productName: data.productName,
        skuId: data.skuId,
        originalPrice: Money.from(data.originalPrice, data.currency),
        groupBuyPrice: Money.from(data.groupBuyPrice, data.currency),
        requiredCount: data.requiredCount,
        leaderId: data.leaderId,
        participants,
        status: SessionStatus.create(data.status),
        expireTime: new Date(data.expireTime),
        version: data.version,
        succeededAt: data.succeededAt ? new Date(data.succeededAt) : undefined,
        failedAt: data.failedAt ? new Date(data.failedAt) : undefined,
        failureReason: data.failureReason,
      },
      new Date(data.createdAt),
      new Date(data.updatedAt),
    );
  }
}

