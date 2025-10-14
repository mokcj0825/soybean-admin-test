/**
 * 支付发起事件
 * 当支付流程启动后发布
 */
export class PaymentInitiatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly paymentId: string,
    public readonly amount: number,
    public readonly paymentMethod: string,
  ) {}
}

