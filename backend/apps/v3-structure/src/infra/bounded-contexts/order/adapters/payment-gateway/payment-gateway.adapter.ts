import { Injectable } from '@nestjs/common';
import {
  IPaymentGateway,
  PaymentResult,
} from '../../../../../lib/bounded-contexts/order/ports';

/**
 * 支付网关适配器（微信支付实现）
 * 
 * 职责：
 * - 实现 IPaymentGateway 端口
 * - 封装第三方支付 API 的调用
 * - 处理签名、加密等技术细节
 */
@Injectable()
export class WeChatPaymentGatewayAdapter implements IPaymentGateway {
  constructor(
    // private readonly wechatPayConfig: WechatPayConfig,
    // private readonly httpClient: HttpClient,
  ) {}

  async initiatePayment(
    orderId: string,
    amount: number,
    method: string,
  ): Promise<PaymentResult> {
    console.log(`💳 [Payment Gateway] 发起支付...`);
    console.log(`   订单ID: ${orderId}`);
    console.log(`   金额: ¥${amount}`);
    console.log(`   支付方式: ${method}`);

    // 在实际项目中：
    /*
    // 1. 构建支付参数
    const params = {
      appid: this.wechatPayConfig.appid,
      mchid: this.wechatPayConfig.mchid,
      description: `订单${orderId}`,
      out_trade_no: orderId,
      amount: {
        total: Math.round(amount * 100), // 转换为分
        currency: 'CNY',
      },
      // ... 其他参数
    };

    // 2. 签名
    const signature = this.sign(params);

    // 3. 调用微信支付 API
    const response = await this.httpClient.post(
      'https://api.mch.weixin.qq.com/v3/pay/transactions/native',
      params,
      { headers: { Authorization: signature } },
    );

    return {
      paymentId: response.data.prepay_id,
      qrCodeUrl: response.data.code_url,
      expireTime: new Date(Date.now() + 30 * 60 * 1000),
    };
    */

    // Mock 实现
    await new Promise((resolve) => setTimeout(resolve, 200));

    const paymentId = `pay_${Date.now()}`;
    console.log(`   ✅ 支付发起成功`);
    console.log(`   支付ID: ${paymentId}`);

    return {
      paymentId,
      qrCodeUrl: `weixin://wxpay/bizpayurl?pr=mock_${orderId}`,
      expireTime: new Date(Date.now() + 30 * 60 * 1000), // 30分钟后过期
    };
  }

  async queryPaymentStatus(
    paymentId: string,
  ): Promise<'pending' | 'paid' | 'failed'> {
    console.log(`🔍 [Payment Gateway] 查询支付状态: ${paymentId}`);
    
    // 在实际项目中调用微信支付查询接口
    return 'pending';
  }

  async cancelPayment(paymentId: string): Promise<void> {
    console.log(`❌ [Payment Gateway] 取消支付: ${paymentId}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  async refund(
    paymentId: string,
    amount: number,
    reason: string,
  ): Promise<void> {
    console.log(`💸 [Payment Gateway] 发起退款: ${paymentId}`);
    console.log(`   退款金额: ¥${amount}`);
    console.log(`   退款原因: ${reason}`);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

