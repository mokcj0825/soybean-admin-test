import { GroupBuySession } from '../domain/entities/group-buy-session.aggregate';

/**
 * 拼团组仓储接口（端口）
 * 
 * 职责：定义拼团组的持久化操作
 */
export interface IGroupBuySessionRepository {
  /**
   * 保存拼团组
   */
  save(session: GroupBuySession): Promise<void>;

  /**
   * 根据ID查询拼团组
   */
  findById(sessionId: string): Promise<GroupBuySession | null>;

  /**
   * 根据活动ID查询进行中的拼团组列表
   */
  findInProgressByActivityId(activityId: string): Promise<GroupBuySession[]>;

  /**
   * 查询用户参与的拼团组
   */
  findByUserId(userId: string): Promise<GroupBuySession[]>;

  /**
   * 查询过期的拼团组（用于定时任务扫描）
   */
  findExpiredSessions(limit: number): Promise<GroupBuySession[]>;

  /**
   * 更新拼团组（用于乐观锁）
   */
  update(session: GroupBuySession): Promise<boolean>;
}

export const GROUP_BUY_SESSION_REPOSITORY = Symbol('GROUP_BUY_SESSION_REPOSITORY');

