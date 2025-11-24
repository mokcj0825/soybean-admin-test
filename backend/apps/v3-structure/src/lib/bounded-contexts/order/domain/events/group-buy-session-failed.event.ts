import { DomainEvent } from '../../../../shared-kernel';

/**
 * 拼团失败事件
 * 
 * 触发时机：拼团超时或被取消时
 * 
 * 触发操作：
 * - 发送拼团失败通知
 * - 发起退款
 * - 释放库存
 * - 发放补偿优惠券
 */
export class GroupBuySessionFailedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly activityId: string,
    public readonly participantIds: string[],
    public readonly orderIds: string[],
    public readonly failureReason: string,
    public readonly failedAt: Date,
  ) {
    super(sessionId);
  }

  getEventName(): string {
    return 'GroupBuySessionFailed';
  }

  toJSON() {
    return {
      eventName: this.getEventName(),
      sessionId: this.sessionId,
      activityId: this.activityId,
      participantIds: this.participantIds,
      orderIds: this.orderIds,
      failureReason: this.failureReason,
      failedAt: this.failedAt.toISOString(),
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}

