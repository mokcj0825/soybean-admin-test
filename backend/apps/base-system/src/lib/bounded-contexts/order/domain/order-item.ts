import { Money } from './money.value-object';

export interface OrderItemProperties {
  productId: string;
  skuId: string;
  quantity: number;
  price: Money;
  productName: string;
  productImage?: string;
}

/**
 * 订单明细领域对象
 */
export class OrderItem {
  readonly productId: string;
  readonly skuId: string;
  readonly quantity: number;
  readonly price: Money;
  readonly productName: string;
  readonly productImage?: string;

  private constructor(props: OrderItemProperties) {
    this.productId = props.productId;
    this.skuId = props.skuId;
    this.quantity = props.quantity;
    this.price = props.price;
    this.productName = props.productName;
    this.productImage = props.productImage;

    this.validate();
  }

  static create(props: OrderItemProperties): OrderItem {
    return new OrderItem(props);
  }

  private validate(): void {
    if (this.quantity <= 0) {
      throw new Error('订单明细数量必须大于0');
    }
    if (this.price.isLessThan(Money.zero())) {
      throw new Error('订单明细价格不能为负数');
    }
  }

  /**
   * 计算该明细的小计
   */
  getSubtotal(): Money {
    return this.price.multiply(this.quantity);
  }

  toJSON() {
    return {
      productId: this.productId,
      skuId: this.skuId,
      quantity: this.quantity,
      price: this.price.getValue(),
      productName: this.productName,
      productImage: this.productImage,
      subtotal: this.getSubtotal().getValue(),
    };
  }
}

