import { BadRequestException, Injectable } from '@nestjs/common';

/**
 * 拼团验证领域服务
 * 
 * 职责：
 * - 验证用户参团限制
 * - 验证库存
 * - 验证用户是否重复参团
 * 
 * 为什么是领域服务：
 * - 这些验证逻辑不属于任何单一聚合根
 * - 需要跨多个聚合或外部服务查询
 */
@Injectable()
export class GroupBuyValidatorService {
  /**
   * 验证用户参团限制
   */
  async validateUserLimit(
    userId: string,
    activityId: string,
  ): Promise<void> {
    console.log('   🔍 验证用户参团限制...');

    // 模拟查询用户今日参团次数
    const todaySessionCount = 0;
    const maxSessionsPerDay = 5;

    console.log(`   今日已发起拼团: ${todaySessionCount}次`);
    console.log(`   每日限制: ${maxSessionsPerDay}次`);

    if (todaySessionCount >= maxSessionsPerDay) {
      throw new BadRequestException(
        `您今日已发起 ${todaySessionCount} 次拼团，超过每日限制`,
      );
    }

    console.log('   ✅ 用户参团限制验证通过');
  }

  /**
   * 验证库存是否充足
   */
  async validateStock(
    productId: string,
    skuId: string,
    requiredStock: number,
  ): Promise<void> {
    console.log('   🔍 验证库存...');
    console.log(`   产品ID: ${productId}`);
    console.log(`   SKU ID: ${skuId}`);
    console.log(`   需要库存: ${requiredStock}`);

    // 模拟查询库存
    const availableStock = 1000;
    const reservedStock = 50;
    const actualAvailable = availableStock - reservedStock;

    console.log(`   可用库存: ${actualAvailable}`);

    if (actualAvailable < requiredStock) {
      throw new BadRequestException(
        `库存不足，需要 ${requiredStock}，可用 ${actualAvailable}`,
      );
    }

    console.log('   ✅ 库存充足');
  }

  /**
   * 验证用户是否已在同商品的其他拼团中
   */
  async validateUserNotInOtherSession(
    userId: string,
    productId: string,
    excludeSessionId?: string,
  ): Promise<void> {
    console.log('   🔍 验证用户是否已参与其他拼团...');

    // 模拟查询用户在该商品的进行中拼团
    const existingSessions: string[] = [];

    if (excludeSessionId) {
      const filtered = existingSessions.filter(
        (id) => id !== excludeSessionId,
      );
      if (filtered.length > 0) {
        throw new BadRequestException('您已在该商品的其他拼团中');
      }
    } else if (existingSessions.length > 0) {
      throw new BadRequestException('您已在该商品的其他拼团中');
    }

    console.log('   ✅ 用户未参与其他拼团');
  }
}

