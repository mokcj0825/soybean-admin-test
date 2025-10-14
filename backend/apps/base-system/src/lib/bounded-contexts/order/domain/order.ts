import { AggregateRoot } from '@nestjs/cqrs';

import { UlidGenerator } from '@lib/utils/id.util';

import { OrderCreatedEvent } from './events/order-created.event';
import { PaymentInitiatedEvent } from './events/payment-initiated.event';
import { Money } from './money.value-object';
import { OrderItem } from './order-item';

export interface OrderCreateProperties {
  userId: string;
  items: OrderItem[];
  totalAmount: Money;
  discountAmount: Money;
  shippingFee: Money;
  finalAmount: Money;
  shippingAddressId: string;
  couponCode?: string;
  remark?: string;
}

export interface PaymentInfo {
  id: string;
  qrCodeUrl: string;
  expireTime: Date;
}

/**
 * 订单聚合根
 * 包含订单的核心业务逻辑和规则
 */
export class Order extends AggregateRoot {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  totalAmount: Money;
  discountAmount: Money;
  shippingFee: Money;
  finalAmount: Money;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'COMPLETED';
  shippingAddressId: string;
  couponCode?: string;
  remark?: string;
  paymentId?: string;
  createdAt: Date;

  /**
   * 工厂方法：创建订单
   */
  static create(props: OrderCreateProperties): Order {
    const order = new Order();

    order.id = UlidGenerator.generate();
    order.orderNumber = Order.generateOrderNumber();
    order.userId = props.userId;
    order.items = props.items;
    order.totalAmount = props.totalAmount;
    order.discountAmount = props.discountAmount;
    order.shippingFee = props.shippingFee;
    order.finalAmount = props.finalAmount;
    order.status = 'PENDING';
    order.shippingAddressId = props.shippingAddressId;
    order.couponCode = props.couponCode;
    order.remark = props.remark;
    order.createdAt = new Date();

    // 业务规则验证
    order.validate();

    console.log(`🎉 [Order Domain] 订单聚合根已创建: ${order.orderNumber}`);

    // 发布领域事件
    order.apply(
      new OrderCreatedEvent(
        order.id,
        order.userId,
        order.orderNumber,
        order.totalAmount.getValue(),
        order.items.map((item) => ({
          productId: item.productId,
          skuId: item.skuId,
          quantity: item.quantity,
        })),
      ),
    );

    return order;
  }

  /**
   * 设置支付信息
   */
  setPaymentInfo(paymentInfo: PaymentInfo): void {
    this.paymentId = paymentInfo.id;

    console.log(`💳 [Order Domain] 订单 ${this.orderNumber} 关联支付 ${paymentInfo.id}`);

    // 发布支付发起事件
    this.apply(
      new PaymentInitiatedEvent(
        this.id,
        paymentInfo.id,
        this.finalAmount.getValue(),
        'wechat_pay', // 这里简化处理
      ),
    );
  }

  /**
   * 验证订单业务规则
   */
  private validate(): void {
    // 规则1: 订单必须有商品
    if (!this.items || this.items.length === 0) {
      throw new Error('订单必须包含至少一个商品');
    }

    // 规则2: 最终金额不能为负
    if (this.finalAmount.isLessThan(Money.zero())) {
      throw new Error('订单最终金额不能为负数');
    }

    // 规则3: 折扣金额不能大于总金额
    if (this.discountAmount.isGreaterThan(this.totalAmount)) {
      throw new Error('折扣金额不能大于商品总额');
    }

    // 规则4: 最终金额 = 总额 - 折扣 + 运费
    const calculatedFinal = this.totalAmount
      .subtract(this.discountAmount)
      .add(this.shippingFee);

    if (!this.finalAmount.equals(calculatedFinal)) {
      throw new Error(
        `订单金额计算错误: 期望 ${calculatedFinal.toString()}, 实际 ${this.finalAmount.toString()}`,
      );
    }
  }

  /**
   * 生成订单号
   * 格式: ORD + 时间戳 + 随机数
   */
  private static generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD${timestamp}${random}`;
  }

  /**
   * 转换为JSON（用于响应）
   */
  toJSON() {
    return {
      id: this.id,
      orderNumber: this.orderNumber,
      userId: this.userId,
      items: this.items.map((item) => item.toJSON()),
      totalAmount: this.totalAmount.getValue(),
      discountAmount: this.discountAmount.getValue(),
      shippingFee: this.shippingFee.getValue(),
      finalAmount: this.finalAmount.getValue(),
      status: this.status,
      shippingAddressId: this.shippingAddressId,
      couponCode: this.couponCode,
      remark: this.remark,
      paymentId: this.paymentId,
      createdAt: this.createdAt,
    };
  }
}

