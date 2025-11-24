import { Injectable } from '@nestjs/common';
import { INotificationService } from '../../../../../lib/bounded-contexts/order/ports';

/**
 * 通知服务适配器
 * 
 * 职责：
 * - 实现 INotificationService 端口
 * - 封装邮件和短信服务商的 API
 */
@Injectable()
export class NotificationServiceAdapter implements INotificationService {
  constructor(
    // private readonly emailService: EmailService,
    // private readonly smsService: SMSService,
  ) {}

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    console.log(`📧 [Notification] 发送邮件`);
    console.log(`   收件人: ${to}`);
    console.log(`   主题: ${subject}`);

    // 在实际项目中调用邮件服务 API
    /*
    await this.emailService.send({
      to,
      subject,
      html: body,
    });
    */

    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log(`   ✅ 邮件发送成功`);
  }

  async sendSMS(phone: string, message: string): Promise<void> {
    console.log(`📱 [Notification] 发送短信`);
    console.log(`   手机号: ${phone}`);
    console.log(`   内容: ${message}`);

    // 在实际项目中调用短信服务 API
    /*
    await this.smsService.send({
      phone,
      template: 'order_created',
      params: { message },
    });
    */

    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log(`   ✅ 短信发送成功`);
  }
}

