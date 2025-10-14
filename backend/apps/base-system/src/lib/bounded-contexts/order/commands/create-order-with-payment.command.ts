export class CreateOrderWithPaymentCommand {
  constructor(
    public readonly userId: string,
    public readonly items: Array<{
      productId: string;
      skuId: string;
      quantity: number;
    }>,
    public readonly shippingAddressId: string,
    public readonly couponCode: string | undefined,
    public readonly paymentMethod: string,
    public readonly remark: string | undefined,
  ) {}
}

