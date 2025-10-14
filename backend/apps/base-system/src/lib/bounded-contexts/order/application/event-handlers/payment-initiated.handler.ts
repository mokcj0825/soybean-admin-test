import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { PaymentInitiatedEvent } from '../../domain/events/payment-initiated.event';

/**
 * 支付发起事件处理器
 * 处理支付发起后的异步任务
 */
@EventsHandler(PaymentInitiatedEvent)
@Injectable()
export class PaymentInitiatedHandler implements IEventHandler<PaymentInitiatedEvent> {
  async handle(event: PaymentInitiatedEvent) {
    console.log('');
    console.log('🎯 [Event Handler] PaymentInitiatedHandler 被触发');
    console.log('─────────────────────────────────────');
    console.log(`   订单ID: ${event.orderId}`);
    console.log(`   支付ID: ${event.paymentId}`);
    console.log(`   金额: ¥${event.amount}`);
    console.log(`   支付方式: ${event.paymentMethod}`);

    await Promise.all([
      this.startPaymentMonitor(event),
      this.updateRecommendationSystem(event),
    ]);

    console.log('   ✅ PaymentInitiatedHandler 处理完成');
  }

  /**
   * 启动支付监控
   * 监控支付状态，超时后取消订单
   */
  private async startPaymentMonitor(event: PaymentInitiatedEvent): Promise<void> {
    console.log('   ⏰ 启动支付监控任务...');
    console.log('      设置定时任务: 30分钟后检查支付状态');
    console.log(`      任务ID: payment_monitor_${event.paymentId}`);
    console.log('      如果未支付，将自动取消订单并释放库存');
    console.log('      ✅ 监控任务已设置');
  }

  /**
   * 更新推荐系统
   * 基于用户购买行为更新推荐
   */
  private async updateRecommendationSystem(event: PaymentInitiatedEvent): Promise<void> {
    console.log('   🎯 通知推荐系统...');
    console.log('      POST https://api.recommendation.com/update');
    console.log('      Body:', {
      orderId: event.orderId,
      paymentId: event.paymentId,
      event: 'payment_initiated',
    });
    console.log('      ✅ 推荐系统已更新');
  }
}

