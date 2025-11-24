import { Entity } from './entity.base';
import { DomainEvent } from './domain-event.base';

/**
 * 聚合根基类
 * 
 * 职责：
 * - 继承实体的所有能力
 * - 管理领域事件的发布
 * - 保证聚合边界的完整性
 */
export abstract class AggregateRoot<T = string> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  /**
   * 应用领域事件（添加到待发布队列）
   */
  protected apply(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * 清空领域事件
   * 通常在事件发布后调用
   */
  clearEvents(): void {
    this._domainEvents = [];
  }

  /**
   * 提交事件（触发发布）
   * 这个方法会被 EventBus 调用
   */
  commit(): void {
    // 事件发布由基础设施层的 EventBus 处理
    // 这里只是标记可以发布
  }
}

