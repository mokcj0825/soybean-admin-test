import { Injectable } from '@nestjs/common';
import { OrderCreatedEvent } from '../../domain/events';
import { INotificationService } from '../../ports';

/**
 * 订单创建事件处理器
 * 
 * 职责：
 * - 监听 OrderCreatedEvent
 * - 执行异步任务（发送通知、记录日志等）
 */
@Injectable()
export class OrderCreatedHandler {
  constructor(private readonly notificationService: INotificationService) {}

  async handle(event: OrderCreatedEvent): Promise<void> {
    console.log('\n🎯 [Event Handler] OrderCreatedHandler 被触发');
    console.log('─────────────────────────────────────');

    // 并行执行多个异步任务
    await Promise.all([
      this.sendEmailNotification(event),
      this.sendSMSNotification(event),
      this.recordOperationLog(event),
      this.checkStockAlert(event),
    ]);

    console.log('✅ OrderCreatedHandler 处理完成\n');
  }

  private async sendEmailNotification(event: OrderCreatedEvent): Promise<void> {
    console.log('   📧 发送邮件通知...');
    // await this.notificationService.sendEmail(...)
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log('   ✅ 邮件发送成功');
  }

  private async sendSMSNotification(event: OrderCreatedEvent): Promise<void> {
    console.log('   📱 发送短信通知...');
    // await this.notificationService.sendSMS(...)
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log('   ✅ 短信发送成功');
  }

  private async recordOperationLog(event: OrderCreatedEvent): Promise<void> {
    console.log('   📝 记录操作日志...');
    await new Promise((resolve) => setTimeout(resolve, 50));
    console.log('   ✅ 日志记录成功');
  }

  private async checkStockAlert(event: OrderCreatedEvent): Promise<void> {
    console.log('   ⚠️  检查库存预警...');
    await new Promise((resolve) => setTimeout(resolve, 50));
    console.log('   ✅ 库存检查完成');
  }
}

