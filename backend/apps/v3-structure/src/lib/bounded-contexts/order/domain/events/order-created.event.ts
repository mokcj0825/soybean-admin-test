import { DomainEvent } from '../../../../shared-kernel';

interface OrderItemSnapshot {
  productId: string;
  quantity: number;
  price: number;
}

/**
 * 订单创建事件
 * 
 * 触发时机：订单成功创建后
 * 
 * 会触发：
 * - 发送订单确认邮件
 * - 发送订单通知短信
 * - 记录操作日志
 * - 库存预警检查
 */
export class OrderCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly orderNumber: string,
    public readonly userId: string,
    public readonly finalAmount: number,
    public readonly items: OrderItemSnapshot[],
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'order.created';
  }
}

