import { DomainEvent } from '../../../../shared-kernel';

/**
 * 拼团成功事件
 * 
 * 触发时机：拼团人数达到要求时
 * 
 * 触发操作：
 * - 发送成团通知（短信/推送）
 * - 通知仓库发货
 * - 扣减库存
 * - 更新用户积分
 * - 更新商品销量
 */
export class GroupBuySessionSucceededEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly activityId: string,
    public readonly participantIds: string[],
    public readonly orderIds: string[],
    public readonly succeededAt: Date,
  ) {
    super(sessionId);
  }

  getEventName(): string {
    return 'GroupBuySessionSucceeded';
  }

  toJSON() {
    return {
      eventName: this.getEventName(),
      sessionId: this.sessionId,
      activityId: this.activityId,
      participantIds: this.participantIds,
      orderIds: this.orderIds,
      succeededAt: this.succeededAt.toISOString(),
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}

