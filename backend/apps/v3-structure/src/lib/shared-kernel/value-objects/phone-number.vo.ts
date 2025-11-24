import { ValueObject } from '../base/value-object.base';

interface PhoneNumberProps {
  value: string;
  countryCode: string;
}

/**
 * 电话号码值对象（通用）
 * 
 * 为什么放在 shared-kernel：
 * - 多个上下文都需要处理电话号码
 * - 电话号码验证规则应该全系统统一
 */
export class PhoneNumber extends ValueObject<PhoneNumberProps> {
  // 简化的中国手机号验证
  private static readonly CN_MOBILE_REGEX = /^1[3-9]\d{9}$/;

  private constructor(props: PhoneNumberProps) {
    super(props);
  }

  static create(phone: string, countryCode = '+86'): PhoneNumber {
    if (!phone) {
      throw new Error('电话号码不能为空');
    }

    const trimmedPhone = phone.trim().replace(/\s/g, '');

    // 这里简化处理，实际项目需要根据国家代码验证
    if (countryCode === '+86' && !this.CN_MOBILE_REGEX.test(trimmedPhone)) {
      throw new Error('手机号格式不正确');
    }

    return new PhoneNumber({ value: trimmedPhone, countryCode });
  }

  get value(): string {
    return this.props.value;
  }

  get countryCode(): string {
    return this.props.countryCode;
  }

  get fullNumber(): string {
    return `${this.countryCode} ${this.value}`;
  }

  toString(): string {
    return this.fullNumber;
  }
}

