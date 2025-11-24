import { GroupBuyActivity } from '../domain/entities/group-buy-activity.entity';

/**
 * 拼团活动仓储接口（端口）
 * 
 * 职责：定义拼团活动的持久化操作
 */
export interface IGroupBuyActivityRepository {
  /**
   * 根据ID查询拼团活动
   */
  findById(activityId: string): Promise<GroupBuyActivity | null>;

  /**
   * 查询有效的拼团活动列表
   */
  findActiveActivities(): Promise<GroupBuyActivity[]>;
}

export const GROUP_BUY_ACTIVITY_REPOSITORY = Symbol('GROUP_BUY_ACTIVITY_REPOSITORY');

