import { ValueObject } from '../../../../shared-kernel';

/**
 * 拼团组状态枚举
 */
export enum SessionStatusEnum {
  IN_PROGRESS = 'IN_PROGRESS',   // 进行中
  SUCCESS = 'SUCCESS',             // 成功
  FAILED = 'FAILED',               // 失败
  CANCELLED = 'CANCELLED',         // 已取消
}

interface SessionStatusProps {
  value: SessionStatusEnum;
}

/**
 * 拼团组状态值对象
 * 
 * 职责：
 * - 封装拼团组状态
 * - 提供状态转换规则
 */
export class SessionStatus extends ValueObject<SessionStatusProps> {
  private constructor(props: SessionStatusProps) {
    super(props);
  }

  static create(status: SessionStatusEnum): SessionStatus {
    return new SessionStatus({ value: status });
  }

  static inProgress(): SessionStatus {
    return new SessionStatus({ value: SessionStatusEnum.IN_PROGRESS });
  }

  static success(): SessionStatus {
    return new SessionStatus({ value: SessionStatusEnum.SUCCESS });
  }

  static failed(): SessionStatus {
    return new SessionStatus({ value: SessionStatusEnum.FAILED });
  }

  get value(): SessionStatusEnum {
    return this.props.value;
  }

  /**
   * 是否可以参团
   */
  canJoin(): boolean {
    return this.value === SessionStatusEnum.IN_PROGRESS;
  }

  /**
   * 是否可以取消
   */
  canCancel(): boolean {
    return this.value === SessionStatusEnum.IN_PROGRESS;
  }

  /**
   * 是否已完成（成功或失败）
   */
  isFinished(): boolean {
    return this.value === SessionStatusEnum.SUCCESS || 
           this.value === SessionStatusEnum.FAILED ||
           this.value === SessionStatusEnum.CANCELLED;
  }

  toString(): string {
    const statusNames: Record<SessionStatusEnum, string> = {
      [SessionStatusEnum.IN_PROGRESS]: '进行中',
      [SessionStatusEnum.SUCCESS]: '成功',
      [SessionStatusEnum.FAILED]: '失败',
      [SessionStatusEnum.CANCELLED]: '已取消',
    };
    return statusNames[this.value];
  }

  toJSON() {
    return this.value;
  }
}

