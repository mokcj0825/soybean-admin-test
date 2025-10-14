/**
 * 金额值对象
 * 确保金额相关的业务规则
 */
export class Money {
  private readonly amount: number;

  private constructor(amount: number) {
    if (amount < 0) {
      throw new Error('金额不能为负数');
    }
    // 保留两位小数
    this.amount = Math.round(amount * 100) / 100;
  }

  static from(amount: number): Money {
    return new Money(amount);
  }

  static zero(): Money {
    return new Money(0);
  }

  getValue(): number {
    return this.amount;
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    return new Money(this.amount - other.amount);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor);
  }

  isGreaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    return this.amount < other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }

  toString(): string {
    return `¥${this.amount.toFixed(2)}`;
  }
}

