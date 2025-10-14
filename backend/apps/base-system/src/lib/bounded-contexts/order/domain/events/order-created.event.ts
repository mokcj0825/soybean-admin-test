/**
 * 订单创建事件
 * 当订单成功创建后发布
 */
export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly orderNumber: string,
    public readonly totalAmount: number,
    public readonly items: Array<{
      productId: string;
      skuId: string;
      quantity: number;
    }>,
  ) {}
}

