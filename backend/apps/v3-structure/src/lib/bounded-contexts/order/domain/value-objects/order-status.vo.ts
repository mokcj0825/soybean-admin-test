import { ValueObject } from '../../../../shared-kernel';

/**
 * 订单状态值对象
 * 
 * 为什么是值对象：
 * - 订单状态有明确的业务规则（状态流转）
 * - 封装状态转换逻辑，避免非法状态变更
 */

export enum OrderStatusEnum {
  PENDING_PAYMENT = 'pending_payment',   // 待支付
  PAID = 'paid',                         // 已支付
  PROCESSING = 'processing',             // 处理中
  SHIPPED = 'shipped',                   // 已发货
  DELIVERED = 'delivered',               // 已送达
  CANCELLED = 'cancelled',               // 已取消
  REFUNDED = 'refunded',                 // 已退款
}

interface OrderStatusProps {
  value: OrderStatusEnum;
}

export class OrderStatus extends ValueObject<OrderStatusProps> {
  private constructor(props: OrderStatusProps) {
    super(props);
  }

  static create(status: OrderStatusEnum): OrderStatus {
    return new OrderStatus({ value: status });
  }

  static pendingPayment(): OrderStatus {
    return new OrderStatus({ value: OrderStatusEnum.PENDING_PAYMENT });
  }

  get value(): OrderStatusEnum {
    return this.props.value;
  }

  /**
   * 业务规则：判断是否可以取消
   */
  canBeCancelled(): boolean {
    return [
      OrderStatusEnum.PENDING_PAYMENT,
      OrderStatusEnum.PAID,
    ].includes(this.value);
  }

  /**
   * 业务规则：判断是否可以退款
   */
  canBeRefunded(): boolean {
    return [OrderStatusEnum.PAID, OrderStatusEnum.PROCESSING].includes(
      this.value,
    );
  }

  /**
   * 业务规则：状态流转验证
   */
  canTransitionTo(newStatus: OrderStatusEnum): boolean {
    const transitions: Record<OrderStatusEnum, OrderStatusEnum[]> = {
      [OrderStatusEnum.PENDING_PAYMENT]: [
        OrderStatusEnum.PAID,
        OrderStatusEnum.CANCELLED,
      ],
      [OrderStatusEnum.PAID]: [
        OrderStatusEnum.PROCESSING,
        OrderStatusEnum.CANCELLED,
        OrderStatusEnum.REFUNDED,
      ],
      [OrderStatusEnum.PROCESSING]: [
        OrderStatusEnum.SHIPPED,
        OrderStatusEnum.REFUNDED,
      ],
      [OrderStatusEnum.SHIPPED]: [OrderStatusEnum.DELIVERED],
      [OrderStatusEnum.DELIVERED]: [OrderStatusEnum.REFUNDED],
      [OrderStatusEnum.CANCELLED]: [],
      [OrderStatusEnum.REFUNDED]: [],
    };

    return transitions[this.value]?.includes(newStatus) ?? false;
  }

  toString(): string {
    return this.value;
  }
}

