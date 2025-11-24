/**
 * 实体基类
 * 
 * 职责：提供所有实体通用的属性和行为
 * - 唯一标识 (id)
 * - 相等性比较（基于id）
 * - 创建/更新时间
 */
export abstract class Entity<T = string> {
  protected readonly _id: T;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: T, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  get id(): T {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * 实体相等性：基于ID比较
   */
  equals(entity?: Entity<T>): boolean {
    if (!entity) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    return this._id === entity._id;
  }

  /**
   * 标记实体已被修改
   */
  protected touch(): void {
    this._updatedAt = new Date();
  }
}

