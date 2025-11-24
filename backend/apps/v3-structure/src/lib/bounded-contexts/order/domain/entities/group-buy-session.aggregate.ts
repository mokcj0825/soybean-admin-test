import { AggregateRoot, Money, ValidationException } from '../../../../shared-kernel';
import { SessionStatus } from '../value-objects/session-status.vo';
import { GroupBuyParticipant } from '../value-objects/group-buy-participant.vo';
import { GroupBuySessionCreatedEvent } from '../events/group-buy-session-created.event';
import { UserJoinedGroupBuyEvent } from '../events/user-joined-group-buy.event';
import { GroupBuySessionSucceededEvent } from '../events/group-buy-session-succeeded.event';

interface GroupBuySessionProps {
  activityId: string;
  productId: string;
  productName: string;
  skuId: string;
  originalPrice: Money;
  groupBuyPrice: Money;
  requiredCount: number;
  leaderId: string;
  participants: GroupBuyParticipant[];
  status: SessionStatus;
  expireTime: Date;
  version: number;
  succeededAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}

/**
 * 拼团组聚合根
 * 
 * 职责：
 * - 管理拼团组的生命周期
 * - 控制参团逻辑
 * - 判断成团条件
 * - 发布拼团相关事件
 * 
 * 为什么是聚合根：
 * - 拼团组是一个完整的业务概念
 * - 参与者必须通过拼团组管理
 * - 拼团状态的变更需要保证一致性
 * - 需要并发控制（乐观锁）
 */
export class GroupBuySession extends AggregateRoot {
  private _activityId: string;
  private _productId: string;
  private _productName: string;
  private _skuId: string;
  private _originalPrice: Money;
  private _groupBuyPrice: Money;
  private _requiredCount: number;
  private _leaderId: string;
  private _participants: GroupBuyParticipant[];
  private _status: SessionStatus;
  private _expireTime: Date;
  private _version: number;
  private _succeededAt?: Date;
  private _failedAt?: Date;
  private _failureReason?: string;

  private constructor(
    id: string,
    props: GroupBuySessionProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._activityId = props.activityId;
    this._productId = props.productId;
    this._productName = props.productName;
    this._skuId = props.skuId;
    this._originalPrice = props.originalPrice;
    this._groupBuyPrice = props.groupBuyPrice;
    this._requiredCount = props.requiredCount;
    this._leaderId = props.leaderId;
    this._participants = props.participants;
    this._status = props.status;
    this._expireTime = props.expireTime;
    this._version = props.version;
    this._succeededAt = props.succeededAt;
    this._failedAt = props.failedAt;
    this._failureReason = props.failureReason;
  }

  /**
   * 创建新拼团组（工厂方法 - 开团）
   */
  static create(params: {
    id: string;
    activityId: string;
    productId: string;
    productName: string;
    skuId: string;
    originalPrice: Money;
    groupBuyPrice: Money;
    requiredCount: number;
    leaderId: string;
    leaderOrderId: string;
    expireHours?: number;
  }): GroupBuySession {
    const {
      id,
      activityId,
      productId,
      productName,
      skuId,
      originalPrice,
      groupBuyPrice,
      requiredCount,
      leaderId,
      leaderOrderId,
      expireHours = 24,
    } = params;

    // 创建团长参与者
    const leaderParticipant = GroupBuyParticipant.createLeader(
      leaderId,
      leaderOrderId,
    );

    // 计算过期时间
    const expireTime = new Date();
    expireTime.setHours(expireTime.getHours() + expireHours);

    const session = new GroupBuySession(id, {
      activityId,
      productId,
      productName,
      skuId,
      originalPrice,
      groupBuyPrice,
      requiredCount,
      leaderId,
      participants: [leaderParticipant],
      status: SessionStatus.inProgress(),
      expireTime,
      version: 1,
    });

    // 验证业务规则
    session.validate();

    // 发布领域事件：拼团创建
    session.apply(
      new GroupBuySessionCreatedEvent(
        session.id,
        session._activityId,
        session._leaderId,
        session._requiredCount,
        session._expireTime,
      ),
    );

    return session;
  }

  /**
   * 重建聚合（从数据库加载）
   */
  static reconstitute(
    id: string,
    props: GroupBuySessionProps,
    createdAt: Date,
    updatedAt: Date,
  ): GroupBuySession {
    return new GroupBuySession(id, props, createdAt, updatedAt);
  }

  // === Getters ===

  get activityId(): string {
    return this._activityId;
  }

  get productId(): string {
    return this._productId;
  }

  get productName(): string {
    return this._productName;
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

  get leaderId(): string {
    return this._leaderId;
  }

  get participants(): ReadonlyArray<GroupBuyParticipant> {
    return this._participants;
  }

  get currentCount(): number {
    return this._participants.length;
  }

  get remainingCount(): number {
    return Math.max(0, this._requiredCount - this.currentCount);
  }

  get status(): SessionStatus {
    return this._status;
  }

  get expireTime(): Date {
    return this._expireTime;
  }

  get version(): number {
    return this._version;
  }

  get succeededAt(): Date | undefined {
    return this._succeededAt;
  }

  get failedAt(): Date | undefined {
    return this._failedAt;
  }

  get failureReason(): string | undefined {
    return this._failureReason;
  }

  // === 业务行为 ===

  /**
   * 添加参与者（参团）
   */
  addParticipant(userId: string, orderId: string): void {
    // 业务规则验证
    if (!this._status.canJoin()) {
      throw new ValidationException(
        `拼团组状态为 ${this._status.toString()}，不允许参团`,
      );
    }

    if (this.isExpired()) {
      throw new ValidationException('拼团已过期，不允许参团');
    }

    if (this.isFull()) {
      throw new ValidationException('拼团人数已满，不允许参团');
    }

    if (this.hasParticipant(userId)) {
      throw new ValidationException('用户已在该拼团组中');
    }

    // 添加参与者
    const participant = GroupBuyParticipant.createMember(userId, orderId);
    this._participants.push(participant);
    this._version += 1;
    this.touch();

    // 发布领域事件：用户参团
    this.apply(
      new UserJoinedGroupBuyEvent(
        this.id,
        userId,
        orderId,
        this.currentCount,
        this._requiredCount,
      ),
    );

    // 检查是否成团
    if (this.isCompleted()) {
      this.markAsSucceeded();
    }
  }

  /**
   * 标记为成功（成团）
   */
  private markAsSucceeded(): void {
    this._status = SessionStatus.success();
    this._succeededAt = new Date();
    this._version += 1;
    this.touch();

    // 发布领域事件：拼团成功
    const participantUserIds = this._participants.map((p) => p.userId);
    const orderIds = this._participants.map((p) => p.orderId);

    this.apply(
      new GroupBuySessionSucceededEvent(
        this.id,
        this._activityId,
        participantUserIds,
        orderIds,
        this._succeededAt,
      ),
    );
  }

  /**
   * 标记为失败
   */
  markAsFailed(reason: string): void {
    if (this._status.isFinished()) {
      throw new ValidationException('拼团已结束，不能标记为失败');
    }

    this._status = SessionStatus.failed();
    this._failedAt = new Date();
    this._failureReason = reason;
    this._version += 1;
    this.touch();

    // 发布领域事件：拼团失败
    // TODO: 创建 GroupBuySessionFailedEvent
  }

  /**
   * 取消拼团（团长操作）
   */
  cancel(): void {
    if (!this._status.canCancel()) {
      throw new ValidationException('当前状态不允许取消拼团');
    }

    this.markAsFailed('团长主动取消');
  }

  // === 查询方法 ===

  /**
   * 是否已满员
   */
  isFull(): boolean {
    return this.currentCount >= this._requiredCount;
  }

  /**
   * 是否已成团
   */
  isCompleted(): boolean {
    return this.currentCount >= this._requiredCount;
  }

  /**
   * 是否已过期
   */
  isExpired(): boolean {
    return new Date() > this._expireTime;
  }

  /**
   * 用户是否已参团
   */
  hasParticipant(userId: string): boolean {
    return this._participants.some((p) => p.userId === userId);
  }

  /**
   * 获取参与者信息
   */
  getParticipant(userId: string): GroupBuyParticipant | undefined {
    return this._participants.find((p) => p.userId === userId);
  }

  // === 验证 ===

  private validate(): void {
    // 规则1：成团人数必须大于1
    if (this._requiredCount <= 1) {
      throw new ValidationException('成团人数必须大于1');
    }

    // 规则2：拼团价格必须低于原价
    if (this._groupBuyPrice.isGreaterThan(this._originalPrice)) {
      throw new ValidationException('拼团价格不能高于原价');
    }

    // 规则3：过期时间必须在未来
    if (this._expireTime <= new Date()) {
      throw new ValidationException('过期时间必须在未来');
    }
  }

  toJSON() {
    return {
      id: this.id,
      activityId: this._activityId,
      productId: this._productId,
      productName: this._productName,
      skuId: this._skuId,
      originalPrice: this._originalPrice.toJSON(),
      groupBuyPrice: this._groupBuyPrice.toJSON(),
      requiredCount: this._requiredCount,
      currentCount: this.currentCount,
      remainingCount: this.remainingCount,
      leaderId: this._leaderId,
      participants: this._participants.map((p) => p.toJSON()),
      status: this._status.toJSON(),
      expireTime: this._expireTime.toISOString(),
      version: this._version,
      succeededAt: this._succeededAt?.toISOString(),
      failedAt: this._failedAt?.toISOString(),
      failureReason: this._failureReason,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

