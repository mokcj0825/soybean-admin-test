import { DomainEvent } from '../../../../shared-kernel';

/**
 * 订单支付完成事件
 * 
 * 触发时机：订单支付成功后
 * 
 * 会触发：
 * - 扣减实际库存
 * - 通知仓库发货
 * - 更新推荐系统
 * - 积分奖励
 */
export class OrderPaidEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly orderNumber: string,
    public readonly transactionId: string,
    public readonly amount: number,
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'order.paid';
  }
}

