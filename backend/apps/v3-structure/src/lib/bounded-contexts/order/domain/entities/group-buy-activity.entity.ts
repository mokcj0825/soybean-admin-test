import { Entity, Money } from '../../../../shared-kernel';

interface ActivityProps {
  productId: string;
  productName: string;
  productImage: string;
  skuId: string;
  originalPrice: Money;
  groupBuyPrice: Money;
  requiredCount: number;
  startTime: Date;
  endTime: Date;
  totalStock: number;
  soldCount: number;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}

/**
 * 拼团活动实体
 * 
 * 职责：
 * - 管理拼团活动的配置
 * - 验证活动是否有效
 * - 记录活动的销售统计
 */
export class GroupBuyActivity extends Entity {
  private _productId: string;
  private _productName: string;
  private _productImage: string;
  private _skuId: string;
  private _originalPrice: Money;
  private _groupBuyPrice: Money;
  private _requiredCount: number;
  private _startTime: Date;
  private _endTime: Date;
  private _totalStock: number;
  private _soldCount: number;
  private _status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

  private constructor(
    id: string,
    props: ActivityProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._productId = props.productId;
    this._productName = props.productName;
    this._productImage = props.productImage;
    this._skuId = props.skuId;
    this._originalPrice = props.originalPrice;
    this._groupBuyPrice = props.groupBuyPrice;
    this._requiredCount = props.requiredCount;
    this._startTime = props.startTime;
    this._endTime = props.endTime;
    this._totalStock = props.totalStock;
    this._soldCount = props.soldCount;
    this._status = props.status;
  }

  static create(id: string, props: ActivityProps): GroupBuyActivity {
    return new GroupBuyActivity(id, props);
  }

  static reconstitute(
    id: string,
    props: ActivityProps,
    createdAt: Date,
    updatedAt: Date,
  ): GroupBuyActivity {
    return new GroupBuyActivity(id, props, createdAt, updatedAt);
  }

  // Getters
  get productId(): string {
    return this._productId;
  }

  get productName(): string {
    return this._productName;
  }

  get productImage(): string {
    return this._productImage;
  }

  get skuId(): string {
    return this._skuId;
  }

  get originalPrice(): Money {
    return this._originalPrice;
  }

  get groupBuyPrice(): Money {
    return this._groupBuyPrice;
  }

  get requiredCount(): number {
    return this._requiredCount;
  }

  get startTime(): Date {
    return this._startTime;
  }

  get endTime(): Date {
    return this._endTime;
  }

  get totalStock(): number {
    return this._totalStock;
  }

  get soldCount(): number {
    return this._soldCount;
  }

  get status(): string {
    return this._status;
  }

  get remainingStock(): number {
    return this._totalStock - this._soldCount;
  }

  /**
   * 活动是否有效
   */
  isActive(): boolean {
    const now = new Date();
    return (
      this._status === 'ACTIVE' &&
      now >= this._startTime &&
      now <= this._endTime &&
      this.remainingStock > 0
    );
  }

  /**
   * 是否已过期
   */
  isExpired(): boolean {
    return new Date() > this._endTime;
  }

  toJSON() {
    return {
      id: this.id,
      productId: this._productId,
      productName: this._productName,
      productImage: this._productImage,
      skuId: this._skuId,
      originalPrice: this._originalPrice.toJSON(),
      groupBuyPrice: this._groupBuyPrice.toJSON(),
      requiredCount: this._requiredCount,
      startTime: this._startTime.toISOString(),
      endTime: this._endTime.toISOString(),
      totalStock: this._totalStock,
      soldCount: this._soldCount,
      remainingStock: this.remainingStock,
      status: this._status,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

