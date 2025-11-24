import { DomainEvent } from '../../../../shared-kernel';

/**
 * 拼团创建事件
 * 
 * 触发时机：团长创建拼团组时
 * 
 * 触发操作：
 * - 发送通知给团长
 * - 启动定时任务监控过期
 * - 记录操作日志
 */
export class GroupBuySessionCreatedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly activityId: string,
    public readonly leaderId: string,
    public readonly requiredCount: number,
    public readonly expireTime: Date,
  ) {
    super(sessionId);
  }

  getEventName(): string {
    return 'GroupBuySessionCreated';
  }

  toJSON() {
    return {
      eventName: this.getEventName(),
      sessionId: this.sessionId,
      activityId: this.activityId,
      leaderId: this.leaderId,
      requiredCount: this.requiredCount,
      expireTime: this.expireTime.toISOString(),
      occurredOn: this.occurredOn.toISOString(),
    };
  }
}

