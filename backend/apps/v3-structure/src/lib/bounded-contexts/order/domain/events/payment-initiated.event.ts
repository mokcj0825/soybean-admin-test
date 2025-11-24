import { DomainEvent } from '../../../../shared-kernel';

/**
 * 支付发起事件
 * 
 * 触发时机：向第三方支付平台发起支付后
 * 
 * 会触发：
 * - 启动支付监控任务（检查支付结果）
 * - 设置支付超时自动取消
 */
export class PaymentInitiatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly orderNumber: string,
    public readonly paymentId: string,
    public readonly amount: number,
    public readonly paymentMethod: string,
  ) {
    super(aggregateId);
  }

  getEventName(): string {
    return 'payment.initiated';
  }
}

