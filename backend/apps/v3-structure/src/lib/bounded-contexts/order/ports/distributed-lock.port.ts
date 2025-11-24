/**
 * 分布式锁接口（端口）
 * 
 * 职责：提供分布式锁能力，用于并发控制
 */
export interface IDistributedLock {
  /**
   * 获取锁
   * @param key 锁的键
   * @param ttl 锁的超时时间（毫秒）
   * @returns 是否成功获取锁
   */
  acquire(key: string, ttl: number): Promise<boolean>;

  /**
   * 释放锁
   * @param key 锁的键
   */
  release(key: string): Promise<void>;

  /**
   * 使用锁执行操作
   * @param key 锁的键
   * @param ttl 锁的超时时间（毫秒）
   * @param fn 需要执行的操作
   */
  executeWithLock<T>(
    key: string,
    ttl: number,
    fn: () => Promise<T>,
  ): Promise<T>;
}

export const DISTRIBUTED_LOCK = Symbol('DISTRIBUTED_LOCK');

