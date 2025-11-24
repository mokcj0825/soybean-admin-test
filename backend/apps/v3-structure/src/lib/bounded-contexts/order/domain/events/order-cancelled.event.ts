import { DomainEvent } from '../../../../shared-kernel';

/**
 * 订单取消事件
 * 
 * 触发时机：订单被取消
 * 
 * 会触发：
 * - 释放库存
 * - 退还优惠券
 * - 退款处理（如果已支付）
 * - 发送取消通知
 */
export class OrderCancelledEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly orderNumber: string,
    public readonly reason: string,
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'order.cancelled';
  }
}

