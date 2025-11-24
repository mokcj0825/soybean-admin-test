import { ValueObject } from '../../../../shared-kernel';

interface ParticipantProps {
  userId: string;
  orderId: string;
  isLeader: boolean;
  joinedAt: Date;
}

/**
 * 拼团参与者值对象
 * 
 * 职责：
 * - 记录参与者信息
 * - 区分团长和普通成员
 */
export class GroupBuyParticipant extends ValueObject<ParticipantProps> {
  private constructor(props: ParticipantProps) {
    super(props);
  }

  static createLeader(userId: string, orderId: string): GroupBuyParticipant {
    return new GroupBuyParticipant({
      userId,
      orderId,
      isLeader: true,
      joinedAt: new Date(),
    });
  }

  static createMember(userId: string, orderId: string): GroupBuyParticipant {
    return new GroupBuyParticipant({
      userId,
      orderId,
      isLeader: false,
      joinedAt: new Date(),
    });
  }

  get userId(): string {
    return this.props.userId;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get isLeader(): boolean {
    return this.props.isLeader;
  }

  get joinedAt(): Date {
    return this.props.joinedAt;
  }

  toJSON() {
    return {
      userId: this.props.userId,
      orderId: this.props.orderId,
      isLeader: this.props.isLeader,
      joinedAt: this.props.joinedAt.toISOString(),
    };
  }
}

