import { Entity, Money } from '../../../../shared-kernel';

interface OrderItemProps {
  productId: string;
  productName: string;
  skuId: string;
  skuAttributes: string; // JSON string, e.g., "颜色:红色;尺寸:L"
  quantity: number;
  unitPrice: Money;
  subtotal: Money;
}

/**
 * 订单明细实体
 * 
 * 为什么是实体：
 * - 有唯一标识（id）
 * - 属于 Order 聚合的一部分
 * - 生命周期由 Order 管理
 */
export class OrderItem extends Entity {
  private _productId: string;
  private _productName: string;
  private _skuId: string;
  private _skuAttributes: string;
  private _quantity: number;
  private _unitPrice: Money;
  private _subtotal: Money;

  private constructor(
    id: string,
    props: OrderItemProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._productId = props.productId;
    this._productName = props.productName;
    this._skuId = props.skuId;
    this._skuAttributes = props.skuAttributes;
    this._quantity = props.quantity;
    this._unitPrice = props.unitPrice;
    this._subtotal = props.subtotal;

    this.validate();
  }

  static create(id: string, props: OrderItemProps): OrderItem {
    return new OrderItem(id, props);
  }

  static reconstitute(
    id: string,
    props: OrderItemProps,
    createdAt: Date,
    updatedAt: Date,
  ): OrderItem {
    return new OrderItem(id, props, createdAt, updatedAt);
  }

  // Getters
  get productId(): string {
    return this._productId;
  }

  get productName(): string {
    return this._productName;
  }

  get skuId(): string {
    return this._skuId;
  }

  get skuAttributes(): string {
    return this._skuAttributes;
  }

  get quantity(): number {
    return this._quantity;
  }

  get unitPrice(): Money {
    return this._unitPrice;
  }

  get subtotal(): Money {
    return this._subtotal;
  }

  /**
   * 业务规则验证
   */
  private validate(): void {
    if (this._quantity <= 0) {
      throw new Error('商品数量必须大于0');
    }

    if (this._unitPrice.amount <= 0) {
      throw new Error('商品单价必须大于0');
    }

    // 验证小计 = 单价 × 数量
    const calculatedSubtotal = this._unitPrice.multiply(this._quantity);
    if (!calculatedSubtotal.equals(this._subtotal)) {
      throw new Error(
        `订单明细小计计算错误: 期望 ${calculatedSubtotal.amount}, 实际 ${this._subtotal.amount}`,
      );
    }
  }

  toJSON() {
    return {
      id: this.id,
      productId: this._productId,
      productName: this._productName,
      skuId: this._skuId,
      skuAttributes: this._skuAttributes,
      quantity: this._quantity,
      unitPrice: this._unitPrice.toJSON(),
      subtotal: this._subtotal.toJSON(),
    };
  }
}

