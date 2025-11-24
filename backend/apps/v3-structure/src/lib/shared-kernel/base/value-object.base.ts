/**
 * 值对象基类
 * 
 * 职责：
 * - 不可变性
 * - 相等性比较（基于值而不是引用）
 * - 没有标识符
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  /**
   * 值对象相等性：基于属性值比较
   */
  equals(vo?: ValueObject<T>): boolean {
    if (!vo) {
      return false;
    }

    if (this === vo) {
      return true;
    }

    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}

