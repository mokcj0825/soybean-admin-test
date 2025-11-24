import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserJoinedGroupBuyEvent } from '../../domain/events/user-joined-group-buy.event';

/**
 * 用户参团事件处理器
 * 
 * 职责：处理用户参团后的副作用
 * - 发送通知给团长和已参团用户
 * - 更新拼团组缓存
 */
@EventsHandler(UserJoinedGroupBuyEvent)
export class UserJoinedGroupBuyHandler
  implements IEventHandler<UserJoinedGroupBuyEvent>
{
  async handle(event: UserJoinedGroupBuyEvent): Promise<void> {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         处理事件: UserJoinedGroupBuy                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    console.log('【副作用1】发送通知');
    console.log('─────────────────────────────────────');
    console.log(`   📧 发送通知给拼团组所有成员`);
    console.log(`   当前人数: ${event.currentCount}/${event.requiredCount}`);
    console.log(`   还差: ${event.remainingCount}人`);
    console.log('   内容: "有新成员加入拼团！"');
    console.log('   ✅ 通知已发送（模拟）');

    console.log('');
    console.log('【副作用2】更新缓存');
    console.log('─────────────────────────────────────');
    console.log(`   🔄 Redis DEL group_buy:session:${event.sessionId}`);
    console.log('   清除缓存，下次查询时重新加载');
    console.log('   ✅ 缓存已清除（模拟）');

    console.log('');
    console.log('✅ UserJoinedGroupBuy 事件处理完成');
    console.log('');
  }
}

