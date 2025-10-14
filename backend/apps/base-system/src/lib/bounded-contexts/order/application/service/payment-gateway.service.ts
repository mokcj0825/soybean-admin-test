import { Injectable } from '@nestjs/common';

export interface PaymentInfo {
  id: string;
  qrCodeUrl: string;
  expireTime: Date;
  transactionId: string;
}

/**
 * 支付网关服务
 * 对接第三方支付平台
 */
@Injectable()
export class PaymentGatewayService {
  /**
   * 发起支付
   */
  async initiatePayment(params: {
    orderId: string;
    amount: number;
    method: string;
    userId: string;
  }): Promise<PaymentInfo> {
    console.log('💳 [PaymentGateway] 发起支付...');
    console.log(`   订单ID: ${params.orderId}`);
    console.log(`   金额: ¥${params.amount.toFixed(2)}`);
    console.log(`   支付方式: ${params.method}`);
    console.log(`   用户ID: ${params.userId}`);

    // 根据支付方式选择支付渠道
    let paymentInfo: PaymentInfo;

    if (params.method === 'wechat_pay') {
      paymentInfo = await this.wechatPay(params);
    } else if (params.method === 'alipay') {
      paymentInfo = await this.alipay(params);
    } else {
      throw new Error(`不支持的支付方式: ${params.method}`);
    }

    console.log('✅ [PaymentGateway] 支付发起成功');
    console.log(`   支付ID: ${paymentInfo.id}`);
    console.log(`   二维码URL: ${paymentInfo.qrCodeUrl}`);
    console.log(`   过期时间: ${paymentInfo.expireTime.toISOString()}`);

    // 模拟保存支付记录
    console.log('   💾 保存支付记录到数据库...');
    console.log(
      `   SQL: INSERT INTO payment (id, order_id, amount, method, status, transaction_id) VALUES (...)`,
    );

    return paymentInfo;
  }

  /**
   * 微信支付
   */
  private async wechatPay(params: {
    orderId: string;
    amount: number;
  }): Promise<PaymentInfo> {
    console.log('   📱 调用微信支付API...');
    console.log('   POST https://api.mch.weixin.qq.com/v3/pay/transactions/native');
    console.log('   Body:', {
      appid: 'wx***',
      mchid: 'mch***',
      description: `订单支付-${params.orderId}`,
      out_trade_no: params.orderId,
      amount: {
        total: Math.round(params.amount * 100), // 转换为分
        currency: 'CNY',
      },
    });

    // 模拟微信API响应
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      id: `pay_wechat_${Date.now()}`,
      qrCodeUrl: `weixin://wxpay/bizpayurl?pr=mock${params.orderId}`,
      expireTime: new Date(Date.now() + 30 * 60 * 1000), // 30分钟后过期
      transactionId: `wx_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    };
  }

  /**
   * 支付宝
   */
  private async alipay(params: {
    orderId: string;
    amount: number;
  }): Promise<PaymentInfo> {
    console.log('   💙 调用支付宝API...');
    console.log('   POST https://openapi.alipay.com/gateway.do');
    console.log('   Body:', {
      method: 'alipay.trade.precreate',
      out_trade_no: params.orderId,
      total_amount: params.amount.toFixed(2),
      subject: `订单支付-${params.orderId}`,
    });

    // 模拟支付宝API响应
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      id: `pay_alipay_${Date.now()}`,
      qrCodeUrl: `https://qr.alipay.com/mock${params.orderId}`,
      expireTime: new Date(Date.now() + 30 * 60 * 1000),
      transactionId: `ali_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    };
  }
}

