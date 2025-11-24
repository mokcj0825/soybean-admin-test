import { ValueObject } from '../base/value-object.base';

interface MoneyProps {
  amount: number;
  currency: string;
}

/**
 * 金额值对象（通用）
 * 
 * 职责：
 * - 封装金额计算逻辑
 * - 保证金额的不可变性
 * - 提供金额运算方法
 * 
 * 为什么放在 shared-kernel：
 * - 多个限界上下文都需要处理金额（订单、支付、退款等）
 * - 金额计算规则应该全系统统一
 */
export class Money extends ValueObject<MoneyProps> {
  private constructor(props: MoneyProps) {
    super(props);
  }

  static from(amount: number, currency = 'CNY'): Money {
    if (amount < 0) {
      throw new Error('金额不能为负数');
    }
    
    // 处理浮点数精度问题
    const roundedAmount = Math.round(amount * 100) / 100;
    
    return new Money({ amount: roundedAmount, currency });
  }

  static zero(currency = 'CNY'): Money {
    return new Money({ amount: 0, currency });
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  /**
   * 加法
   */
  add(money: Money): Money {
    this.ensureSameCurrency(money);
    return Money.from(this.amount + money.amount, this.currency);
  }

  /**
   * 减法
   */
  subtract(money: Money): Money {
    this.ensureSameCurrency(money);
    const result = this.amount - money.amount;
    if (result < 0) {
      throw new Error('计算结果不能为负数');
    }
    return Money.from(result, this.currency);
  }

  /**
   * 乘法（用于折扣等场景）
   */
  multiply(multiplier: number): Money {
    return Money.from(this.amount * multiplier, this.currency);
  }

  /**
   * 比较
   */
  isGreaterThan(money: Money): boolean {
    this.ensureSameCurrency(money);
    return this.amount > money.amount;
  }

  isLessThan(money: Money): boolean {
    this.ensureSameCurrency(money);
    return this.amount < money.amount;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  /**
   * 格式化显示
   */
  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  toJSON() {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }

  private ensureSameCurrency(money: Money): void {
    if (this.currency !== money.currency) {
      throw new Error(`货币类型不匹配: ${this.currency} vs ${money.currency}`);
    }
  }
}

