import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { OrderCreatedEvent } from '../../domain/events/order-created.event';

/**
 * 订单创建事件处理器
 * 处理订单创建后的异步任务
 */
@EventsHandler(OrderCreatedEvent)
@Injectable()
export class OrderCreatedHandler implements IEventHandler<OrderCreatedEvent> {
  async handle(event: OrderCreatedEvent) {
    console.log('');
    console.log('🎯 [Event Handler] OrderCreatedHandler 被触发');
    console.log('─────────────────────────────────────');
    console.log(`   订单ID: ${event.orderId}`);
    console.log(`   订单号: ${event.orderNumber}`);
    console.log(`   用户ID: ${event.userId}`);
    console.log(`   总金额: ¥${event.totalAmount}`);

    // 这些操作是异步的，不会阻塞主流程
    await Promise.all([
      this.sendEmailNotification(event),
      this.sendSmsNotification(event),
      this.recordOperationLog(event),
      this.checkStockWarning(event),
    ]);

    console.log('   ✅ OrderCreatedHandler 处理完成');
  }

  /**
   * 发送邮件通知
   */
  private async sendEmailNotification(event: OrderCreatedEvent): Promise<void> {
    console.log('   📧 发送邮件通知...');
    console.log('      调用邮件服务 API...');
    console.log('      POST https://api.email-service.com/send');
    console.log('      Body:', {
      to: 'user@example.com',
      template: 'order_confirmation',
      data: {
        orderNumber: event.orderNumber,
        totalAmount: event.totalAmount,
      },
    });

    // 模拟异步操作
    await new Promise((resolve) => setTimeout(resolve, 50));
    console.log('      ✅ 邮件发送成功');
  }

  /**
   * 发送短信通知
   */
  private async sendSmsNotification(event: OrderCreatedEvent): Promise<void> {
    console.log('   📱 发送短信通知...');
    console.log('      调用短信服务 API...');
    console.log('      POST https://api.sms-service.com/send');
    console.log('      Body:', {
      phone: '13800138000',
      template: 'order_created',
      params: {
        orderNumber: event.orderNumber,
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    console.log('      ✅ 短信发送成功');
  }

  /**
   * 记录操作日志
   */
  private async recordOperationLog(event: OrderCreatedEvent): Promise<void> {
    console.log('   📝 记录操作日志...');
    console.log(
      `      SQL: INSERT INTO operation_log (user_id, action, resource_type, resource_id, details)`,
    );
    console.log(
      `           VALUES ('${event.userId}', 'CREATE_ORDER', 'ORDER', '${event.orderId}', ...)`,
    );
    console.log('      ✅ 日志记录成功');
  }

  /**
   * 检查库存预警
   */
  private async checkStockWarning(event: OrderCreatedEvent): Promise<void> {
    console.log('   ⚠️  检查库存预警...');

    for (const item of event.items) {
      // 模拟查询库存
      console.log(`      查询商品 ${item.productId} 的剩余库存...`);
      console.log(
        `      SQL: SELECT stock FROM product_sku WHERE sku_id = '${item.skuId}'`,
      );

      const remainingStock = 15; // 模拟数据
      const threshold = 20;

      if (remainingStock < threshold) {
        console.log(
          `      ⚠️  库存预警！商品 ${item.productId} 库存不足: ${remainingStock} < ${threshold}`,
        );
        console.log('      发送预警通知给管理员...');
      }
    }

    console.log('      ✅ 库存检查完成');
  }
}

