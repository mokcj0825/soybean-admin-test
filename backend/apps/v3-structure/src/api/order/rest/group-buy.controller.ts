import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateGroupBuyDto } from '../dto/create-group-buy.dto';
import { JoinGroupBuyDto } from '../dto/join-group-buy.dto';
import { GroupBuyResponseDto } from '../dto/group-buy-response.dto';
import { CreateGroupBuyCommand } from '../../../lib/bounded-contexts/order/commands/create-group-buy.command';
import { JoinGroupBuyCommand } from '../../../lib/bounded-contexts/order/commands/join-group-buy.command';

/**
 * 拼团 API 控制器
 * 
 * 职责：
 * - 接收 HTTP 请求
 * - 验证请求参数（通过 DTO）
 * - 转换为命令（Command）
 * - 调用命令总线（CommandBus）
 * - 返回响应
 */
@Controller('v3/api/order/group-buy')
export class GroupBuyController {
  constructor(private readonly commandBus: CommandBus) {}

  /**
   * 创建拼团（开团）
   * 
   * POST /v3/api/order/group-buy/create
   */
  @Post('create')
  @HttpCode(HttpStatus.OK)
  async createGroupBuy(
    @Body() dto: CreateGroupBuyDto,
  ): Promise<GroupBuyResponseDto> {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 收到 HTTP 请求: POST /v3/api/order/group-buy/create');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📥 请求参数:');
    console.log(JSON.stringify(dto, null, 2));
    console.log('');

    // 转换 DTO 为 Command
    const command = new CreateGroupBuyCommand(
      dto.userId,
      dto.activityId,
      dto.quantity,
      dto.shippingAddressId,
      dto.paymentMethod,
      dto.remark,
    );

    // 执行命令
    const result = await this.commandBus.execute<
      CreateGroupBuyCommand,
      GroupBuyResponseDto
    >(command);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ HTTP 响应成功');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    return result;
  }

  /**
   * 参加拼团（参团）
   * 
   * POST /v3/api/order/group-buy/join
   * 
   * 特点：
   * - 使用分布式锁防止并发超员
   * - 使用乐观锁保证数据一致性
   * - 自动判断是否成团
   */
  @Post('join')
  @HttpCode(HttpStatus.OK)
  async joinGroupBuy(@Body() dto: JoinGroupBuyDto) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 收到 HTTP 请求: POST /v3/api/order/group-buy/join');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📥 请求参数:');
    console.log(JSON.stringify(dto, null, 2));
    console.log('');

    // 转换 DTO 为 Command
    const command = new JoinGroupBuyCommand(
      dto.userId,
      dto.sessionId,
      dto.shippingAddressId,
      dto.paymentMethod,
      dto.remark,
    );

    // 执行命令
    const result = await this.commandBus.execute(command);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ HTTP 响应成功');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    return result;
  }
}

