import { Injectable } from '@nestjs/common';
import { IDistributedLock } from '../../../../../lib/bounded-contexts/order/ports/distributed-lock.port';

/**
 * 分布式锁适配器（模拟实现）
 * 
 * 职责：提供分布式锁能力
 * 
 * 注意：这是模拟实现，实际项目中应该使用 Redis (ioredis + redlock)
 */
@Injectable()
export class DistributedLockAdapter implements IDistributedLock {
  // 内存存储（模拟 Redis）
  private readonly locks: Map<string, { expireAt: number }> = new Map();

  async acquire(key: string, ttl: number): Promise<boolean> {
    console.log(`   🔒 [Lock] 尝试获取锁: ${key} (TTL: ${ttl}ms)`);

    const now = Date.now();
    const existing = this.locks.get(key);

    // 检查锁是否存在且未过期
    if (existing && existing.expireAt > now) {
      console.log('   ❌ 锁已被占用');
      return false;
    }

    // 获取锁
    this.locks.set(key, { expireAt: now + ttl });
    console.log('   ✅ 成功获取锁');
    return true;
  }

  async release(key: string): Promise<void> {
    console.log(`   🔓 [Lock] 释放锁: ${key}`);
    this.locks.delete(key);
    console.log('   ✅ 锁已释放');
  }

  async executeWithLock<T>(
    key: string,
    ttl: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    console.log(`   🔒 [Lock] 使用锁执行操作: ${key}`);

    const acquired = await this.acquire(key, ttl);

    if (!acquired) {
      throw new Error(`无法获取锁: ${key}`);
    }

    try {
      const result = await fn();
      return result;
    } finally {
      await this.release(key);
    }
  }
}

