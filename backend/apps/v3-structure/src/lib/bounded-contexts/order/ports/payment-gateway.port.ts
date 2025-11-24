/**
 * 支付结果
 */
export interface PaymentResult {
  paymentId: string;
  qrCodeUrl?: string;
  h5Url?: string;
  expireTime: Date;
}

/**
 * 支付网关端口（接口）
 * 
 * 为什么定义端口：
 * - 第三方支付是外部依赖，应该通过端口隔离
 * - 业务逻辑不应该依赖具体的支付平台（微信、支付宝等）
 * - 易于切换支付提供商
 * - 易于测试（Mock 支付）
 */
export interface IPaymentGateway {
  /**
   * 发起支付
   * 
   * @param orderId 订单ID
   * @param amount 支付金额（分）
   * @param method 支付方式（wechat_pay, alipay等）
   * @returns 支付凭证
   */
  initiatePayment(
    orderId: string,
    amount: number,
    method: string,
  ): Promise<PaymentResult>;

  /**
   * 查询支付状态
   */
  queryPaymentStatus(paymentId: string): Promise<'pending' | 'paid' | 'failed'>;

  /**
   * 取消支付
   */
  cancelPayment(paymentId: string): Promise<void>;

  /**
   * 退款
   */
  refund(paymentId: string, amount: number, reason: string): Promise<void>;
}

