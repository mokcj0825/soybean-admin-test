import { DomainEvent } from '../../../../shared-kernel';

/**
 * 用户参团事件
 * 
 * 触发时机：用户成功参加拼团时
 * 
 * 触发操作：
 * - 发送通知给团长和已参团用户
 * - 更新拼团组缓存
 */
export class UserJoinedGroupBuyEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly orderId: string,
    public readonly currentCount: number,
    public readonly requiredCount: number,
  ) {
    super(sessionId);
  }

  getEventName(): string {
    return 'UserJoinedGroupBuy';
  }

  get remainingCount(): number {
    return this.requiredCount - this.currentCount;
  }

  toJSON() {
    return {
      eventName: this.getEventName(),
      sessionId: this.sessionId,
      userId: this.userId,
      orderId: this.orderId,
      currentCount: this.currentCount,
      requiredCount: this.requiredCount,
      remainingCount: this.remainingCount,
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}

