import { ValueObject } from '../base/value-object.base';

interface EmailProps {
  value: string;
}

/**
 * 邮箱值对象（通用）
 * 
 * 为什么放在 shared-kernel：
 * - 多个上下文都需要处理邮箱（用户、订单通知、营销等）
 * - 邮箱验证规则应该全系统统一
 */
export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  static create(email: string): Email {
    if (!email) {
      throw new Error('邮箱不能为空');
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!this.EMAIL_REGEX.test(trimmedEmail)) {
      throw new Error('邮箱格式不正确');
    }

    return new Email({ value: trimmedEmail });
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.value;
  }
}

