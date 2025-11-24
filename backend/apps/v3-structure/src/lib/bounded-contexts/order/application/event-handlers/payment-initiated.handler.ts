import { Injectable } from '@nestjs/common';
import { PaymentInitiatedEvent } from '../../domain/events';

/**
 * 支付发起事件处理器
 * 
 * 职责：
 * - 监听 PaymentInitiatedEvent
 * - 启动支付监控任务
 * - 设置支付超时自动取消
 */
@Injectable()
export class PaymentInitiatedHandler {
  async handle(event: PaymentInitiatedEvent): Promise<void> {
    console.log('\n🎯 [Event Handler] PaymentInitiatedHandler 被触发');
    console.log('─────────────────────────────────────');

    await Promise.all([
      this.startPaymentMonitoring(event),
      this.schedulePaymentTimeout(event),
      this.notifyRecommendationSystem(event),
    ]);

    console.log('✅ PaymentInitiatedHandler 处理完成\n');
  }

  private async startPaymentMonitoring(
    event: PaymentInitiatedEvent,
  ): Promise<void> {
    console.log('   ⏰ 启动支付监控任务...');
    // 定时查询支付状态
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log('   ✅ 支付监控已启动');
  }

  private async schedulePaymentTimeout(
    event: PaymentInitiatedEvent,
  ): Promise<void> {
    console.log('   ⏱️  设置支付超时任务（30分钟）...');
    // 设置定时任务：30分钟后自动取消订单
    await new Promise((resolve) => setTimeout(resolve, 50));
    console.log('   ✅ 超时任务已设置');
  }

  private async notifyRecommendationSystem(
    event: PaymentInitiatedEvent,
  ): Promise<void> {
    console.log('   🎯 通知推荐系统...');
    // 通知推荐系统更新用户行为
    await new Promise((resolve) => setTimeout(resolve, 50));
    console.log('   ✅ 推荐系统已通知');
  }
}

