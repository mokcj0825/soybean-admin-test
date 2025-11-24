/**
 * 通知服务端口（接口）
 * 
 * 为什么定义端口：
 * - 通知是外部依赖（邮件、短信服务商）
 * - 业务逻辑不应该耦合具体的通知实现
 * - 易于切换通知提供商
 */
export interface INotificationService {
  /**
   * 发送邮件
   */
  sendEmail(to: string, subject: string, body: string): Promise<void>;

  /**
   * 发送短信
   */
  sendSMS(phone: string, message: string): Promise<void>;
}

