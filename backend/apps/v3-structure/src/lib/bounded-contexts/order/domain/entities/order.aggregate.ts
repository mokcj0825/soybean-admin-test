import { AggregateRoot, Money, ValidationException } from '../../../../shared-kernel';
import { OrderItem } from './order-item.entity';
import { OrderStatus, OrderStatusEnum } from '../value-objects/order-status.vo';
import { ShippingAddress } from '../value-objects/shipping-address.vo';
import { OrderCreatedEvent } from '../events/order-created.event';
import { OrderPaidEvent } from '../events/order-paid.event';
import { OrderCancelledEvent } from '../events/order-cancelled.event';

interface OrderProps {
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  totalAmount: Money;
  discountAmount: Money;
  shippingFee: Money;
  finalAmount: Money;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  remark?: string;
  couponCode?: string;
  paidAt?: Date;
  cancelledAt?: Date;
}

/**
 * 订单聚合根
 * 
 * 职责：
 * - 保证订单的一致性边界
 * - 封装订单的业务规则
 * - 管理订单明细的生命周期
 * - 发布领域事件
 * 
 * 为什么是聚合根：
 * - 订单是一个完整的业务概念
 * - 订单明细必须通过订单访问和修改
 * - 订单状态的变更需要保证一致性
 */
export class Order extends AggregateRoot {
  private _orderNumber: string;
  private _userId: string;
  private _items: OrderItem[];
  private _totalAmount: Money;
  private _discountAmount: Money;
  private _shippingFee: Money;
  private _finalAmount: Money;
  private _status: OrderStatus;
  private _shippingAddress: ShippingAddress;
  private _remark?: string;
  private _couponCode?: string;
  private _paidAt?: Date;
  private _cancelledAt?: Date;

  private constructor(
    id: string,
    props: OrderProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._orderNumber = props.orderNumber;
    this._userId = props.userId;
    this._items = props.items;
    this._totalAmount = props.totalAmount;
    this._discountAmount = props.discountAmount;
    this._shippingFee = props.shippingFee;
    this._finalAmount = props.finalAmount;
    this._status = props.status;
    this._shippingAddress = props.shippingAddress;
    this._remark = props.remark;
    this._couponCode = props.couponCode;
    this._paidAt = props.paidAt;
    this._cancelledAt = props.cancelledAt;
  }

  /**
   * 创建新订单（工厂方法）
   */
  static create(id: string, props: OrderProps): Order {
    const order = new Order(id, props);
    
    // 验证业务规则
    order.validate();
    
    // 发布领域事件
    order.apply(
      new OrderCreatedEvent(
        order.id,
        order._orderNumber,
        order._userId,
        order._finalAmount.amount,
        order._items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.unitPrice.amount,
        })),
      ),
    );
    
    return order;
  }

  /**
   * 重建聚合（从数据库加载）
   */
  static reconstitute(
    id: string,
    props: OrderProps,
    createdAt: Date,
    updatedAt: Date,
  ): Order {
    return new Order(id, props, createdAt, updatedAt);
  }

  // Getters
  get orderNumber(): string {
    return this._orderNumber;
  }

  get userId(): string {
    return this._userId;
  }

  get items(): ReadonlyArray<OrderItem> {
    return this._items;
  }

  get totalAmount(): Money {
    return this._totalAmount;
  }

  get discountAmount(): Money {
    return this._discountAmount;
  }

  get shippingFee(): Money {
    return this._shippingFee;
  }

  get finalAmount(): Money {
    return this._finalAmount;
  }

  get status(): OrderStatus {
    return this._status;
  }

  get shippingAddress(): ShippingAddress {
    return this._shippingAddress;
  }

  get remark(): string | undefined {
    return this._remark;
  }

  get couponCode(): string | undefined {
    return this._couponCode;
  }

  get paidAt(): Date | undefined {
    return this._paidAt;
  }

  get cancelledAt(): Date | undefined {
    return this._cancelledAt;
  }

  /**
   * 业务行为：标记订单已支付
   */
  markAsPaid(transactionId: string): void {
    if (this._status.value !== OrderStatusEnum.PENDING_PAYMENT) {
      throw new ValidationException('只有待支付的订单才能标记为已支付');
    }

    this._status = OrderStatus.create(OrderStatusEnum.PAID);
    this._paidAt = new Date();
    this.touch();

    // 发布领域事件
    this.apply(
      new OrderPaidEvent(
        this.id,
        this._orderNumber,
        transactionId,
        this._finalAmount.amount,
      ),
    );
  }

  /**
   * 业务行为：取消订单
   */
  cancel(reason: string): void {
    if (!this._status.canBeCancelled()) {
      throw new ValidationException('当前订单状态不允许取消');
    }

    this._status = OrderStatus.create(OrderStatusEnum.CANCELLED);
    this._cancelledAt = new Date();
    this.touch();

    // 发布领域事件
    this.apply(
      new OrderCancelledEvent(this.id, this._orderNumber, reason),
    );
  }

  /**
   * 业务规则验证
   */
  private validate(): void {
    // 规则1：订单必须有商品
    if (!this._items || this._items.length === 0) {
      throw new ValidationException('订单必须包含至少一个商品');
    }

    // 规则2：最终金额不能为负
    if (this._finalAmount.isLessThan(Money.zero())) {
      throw new ValidationException('订单最终金额不能为负数');
    }

    // 规则3：折扣金额不能大于商品总额
    if (this._discountAmount.isGreaterThan(this._totalAmount)) {
      throw new ValidationException('折扣金额不能大于商品总额');
    }

    // 规则4：验证金额计算：总额 - 折扣 + 运费 = 最终金额
    const calculatedFinalAmount = this._totalAmount
      .subtract(this._discountAmount)
      .add(this._shippingFee);

    if (!calculatedFinalAmount.equals(this._finalAmount)) {
      throw new ValidationException(
        `订单金额计算错误: 期望 ${calculatedFinalAmount.amount}, 实际 ${this._finalAmount.amount}`,
      );
    }

    // 规则5：验证商品总额 = 所有明细的小计之和
    const itemsTotal = this._items.reduce(
      (sum, item) => sum.add(item.subtotal),
      Money.zero(),
    );

    if (!itemsTotal.equals(this._totalAmount)) {
      throw new ValidationException(
        `订单总额与明细不符: 明细合计 ${itemsTotal.amount}, 订单总额 ${this._totalAmount.amount}`,
      );
    }
  }

  toJSON() {
    return {
      id: this.id,
      orderNumber: this._orderNumber,
      userId: this._userId,
      items: this._items.map((item) => item.toJSON()),
      totalAmount: this._totalAmount.toJSON(),
      discountAmount: this._discountAmount.toJSON(),
      shippingFee: this._shippingFee.toJSON(),
      finalAmount: this._finalAmount.toJSON(),
      status: this._status.value,
      shippingAddress: this._shippingAddress.toJSON(),
      remark: this._remark,
      couponCode: this._couponCode,
      paidAt: this._paidAt,
      cancelledAt: this._cancelledAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

