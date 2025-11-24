import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { GroupBuySessionSucceededEvent } from '../../domain/events/group-buy-session-succeeded.event';

/**
 * 拼团成功事件处理器
 * 
 * 职责：处理拼团成功后的副作用
 * - 发送成团通知
 * - 通知仓库发货
 * - 扣减库存
 * - 更新用户积分
 */
@EventsHandler(GroupBuySessionSucceededEvent)
export class GroupBuySessionSucceededHandler
  implements IEventHandler<GroupBuySessionSucceededEvent>
{
  async handle(event: GroupBuySessionSucceededEvent): Promise<void> {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         处理事件: GroupBuySessionSucceeded               ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    console.log('🎉 拼团成功！');
    console.log(`   参与人数: ${event.participantIds.length}人`);
    console.log(`   订单数量: ${event.orderIds.length}个`);
    console.log('');

    console.log('【副作用1】发送成团通知');
    console.log('─────────────────────────────────────');
    console.log(`   📧 发送通知给所有参与者 (${event.participantIds.length}人)`);
    console.log('   内容: "恭喜！拼团成功，商品将尽快发货"');
    console.log('   ✅ 通知已发送（模拟）');

    console.log('');
    console.log('【副作用2】更新订单状态');
    console.log('─────────────────────────────────────');
    for (const orderId of event.orderIds) {
      console.log(`   📦 UPDATE orders SET status = 'PENDING_SHIPMENT' WHERE id = '${orderId}'`);
    }
    console.log('   ✅ 所有订单已更新为待发货');

    console.log('');
    console.log('【副作用3】扣减库存');
    console.log('─────────────────────────────────────');
    console.log('   📉 UPDATE product_sku SET');
    console.log('      stock = stock - reserved_stock,');
    console.log('      reserved_stock = 0');
    console.log('   ✅ 库存已扣减（模拟）');

    console.log('');
    console.log('【副作用4】通知仓库发货');
    console.log('─────────────────────────────────────');
    console.log('   📮 发送消息到仓库系统');
    console.log(`   订单列表: ${event.orderIds.join(', ')}`);
    console.log('   ✅ 仓库通知已发送（模拟）');

    console.log('');
    console.log('【副作用5】更新用户积分');
    console.log('─────────────────────────────────────');
    for (const userId of event.participantIds) {
      console.log(`   ⭐ 用户 ${userId} +10 积分（参与拼团奖励）`);
    }
    console.log('   ✅ 积分已发放（模拟）');

    console.log('');
    console.log('✅ GroupBuySessionSucceeded 事件处理完成');
    console.log('');
  }
}

