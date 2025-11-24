import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { GroupBuySessionCreatedEvent } from '../../domain/events/group-buy-session-created.event';

/**
 * 拼团创建事件处理器
 * 
 * 职责：处理拼团创建后的副作用
 * - 发送通知给团长
 * - 启动定时任务监控过期
 * - 记录操作日志
 */
@EventsHandler(GroupBuySessionCreatedEvent)
export class GroupBuySessionCreatedHandler
  implements IEventHandler<GroupBuySessionCreatedEvent>
{
  async handle(event: GroupBuySessionCreatedEvent): Promise<void> {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         处理事件: GroupBuySessionCreated                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    console.log('【副作用1】发送通知给团长');
    console.log('─────────────────────────────────────');
    console.log(`   📧 发送短信/推送给用户: ${event.leaderId}`);
    console.log('   内容: "您已成功开团，快邀请好友参加吧！"');
    console.log(`   分享链接: https://app.example.com/group-buy/${event.sessionId}`);
    console.log('   ✅ 通知已发送（模拟）');

    console.log('');
    console.log('【副作用2】注册到过期监控');
    console.log('─────────────────────────────────────');
    console.log(`   ⏰ Redis ZADD group_buy:expiring ${event.expireTime.getTime()} ${event.sessionId}`);
    console.log(`   过期时间: ${event.expireTime.toISOString()}`);
    console.log('   ✅ 已注册到定时任务（模拟）');

    console.log('');
    console.log('【副作用3】记录操作日志');
    console.log('─────────────────────────────────────');
    console.log(`   📝 INSERT INTO operation_log (user_id, action, details)`);
    console.log(`   用户: ${event.leaderId}`);
    console.log(`   操作: CREATE_GROUP_BUY`);
    console.log(`   详情: 创建拼团组 ${event.sessionId}`);
    console.log('   ✅ 日志已记录（模拟）');

    console.log('');
    console.log('✅ GroupBuySessionCreated 事件处理完成');
    console.log('');
  }
}

