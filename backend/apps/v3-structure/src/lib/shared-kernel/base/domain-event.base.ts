/**
 * 领域事件基类
 * 
 * 职责：
 * - 记录领域中发生的重要业务事件
 * - 提供事件的基本属性（时间戳、聚合ID等）
 */
export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.occurredOn = new Date();
    this.aggregateId = aggregateId;
  }

  /**
   * 事件名称（用于事件路由）
   */
  abstract getEventName(): string;
}

