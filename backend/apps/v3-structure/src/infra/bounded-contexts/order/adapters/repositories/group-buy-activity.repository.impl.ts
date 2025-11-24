import { Injectable } from '@nestjs/common';
import { IGroupBuyActivityRepository } from '../../../../../lib/bounded-contexts/order/ports/group-buy-activity.repository.port';
import { GroupBuyActivity } from '../../../../../lib/bounded-contexts/order/domain/entities/group-buy-activity.entity';
import { Money } from '../../../../../lib/shared-kernel';

/**
 * 拼团活动仓储实现（内存模拟）
 * 
 * 职责：实现拼团活动的持久化操作
 * 
 * 注意：这是内存模拟实现，包含模拟数据
 */
@Injectable()
export class GroupBuyActivityRepositoryImpl
  implements IGroupBuyActivityRepository
{
  // 模拟数据库中的拼团活动
  private readonly activities: Map<string, any> = new Map([
    [
      'activity_001',
      {
        id: 'activity_001',
        productId: 'prod_iphone15',
        productName: 'iPhone 15 Pro 256GB',
        productImage: 'https://example.com/iphone15.jpg',
        skuId: 'sku_iphone15_256',
        originalPrice: 7999.0,
        groupBuyPrice: 6999.0,
        requiredCount: 5,
        startTime: new Date('2024-01-01'),
        endTime: new Date('2025-12-31'),
        totalStock: 1000,
        soldCount: 50,
        status: 'ACTIVE',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ],
    [
      'activity_002',
      {
        id: 'activity_002',
        productId: 'prod_airpods',
        productName: 'AirPods Pro 2',
        productImage: 'https://example.com/airpods.jpg',
        skuId: 'sku_airpods_pro2',
        originalPrice: 1999.0,
        groupBuyPrice: 1699.0,
        requiredCount: 3,
        startTime: new Date('2024-01-01'),
        endTime: new Date('2025-12-31'),
        totalStock: 500,
        soldCount: 20,
        status: 'ACTIVE',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ],
  ]);

  async findById(activityId: string): Promise<GroupBuyActivity | null> {
    console.log(`   🔍 [Repository] 查询拼团活动: ${activityId}`);
    console.log(`   SQL: SELECT * FROM group_buy_activity WHERE id = '${activityId}'`);

    const data = this.activities.get(activityId);

    if (!data) {
      console.log('   ❌ 未找到活动');
      return null;
    }

    console.log('   ✅ 找到活动');

    return this.reconstitute(data);
  }

  async findActiveActivities(): Promise<GroupBuyActivity[]> {
    console.log('   🔍 [Repository] 查询所有有效活动');

    const now = new Date();
    const activities = Array.from(this.activities.values())
      .filter(
        (data) =>
          data.status === 'ACTIVE' &&
          new Date(data.startTime) <= now &&
          new Date(data.endTime) >= now,
      )
      .map((data) => this.reconstitute(data));

    console.log(`   ✅ 找到 ${activities.length} 个有效活动`);
    return activities;
  }

  /**
   * 重建实体（从持久化数据）
   */
  private reconstitute(data: any): GroupBuyActivity {
    return GroupBuyActivity.reconstitute(
      data.id,
      {
        productId: data.productId,
        productName: data.productName,
        productImage: data.productImage,
        skuId: data.skuId,
        originalPrice: Money.from(data.originalPrice),
        groupBuyPrice: Money.from(data.groupBuyPrice),
        requiredCount: data.requiredCount,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        totalStock: data.totalStock,
        soldCount: data.soldCount,
        status: data.status,
      },
      new Date(data.createdAt),
      new Date(data.updatedAt),
    );
  }
}

