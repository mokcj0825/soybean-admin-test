import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateOrderWithPaymentCommand } from '@app/base-system/lib/bounded-contexts/order/commands/create-order-with-payment.command';

import { Public } from '@lib/infra/decorators/public.decorator';
import { ApiRes } from '@lib/infra/rest/res.response';

import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderResponseDto } from '../dto/order-response.dto';

@ApiTags('Order - 订单管理')
@Controller('order')
export class OrderController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('create-with-payment')
  @Public() // 为了方便测试，设为公开接口
  @ApiOperation({ summary: '创建订单并发起支付' })
  @ApiResponse({
    status: 201,
    description: '订单创建成功，返回支付信息',
    type: OrderResponseDto,
  })
  async createOrderWithPayment(
    @Body() dto: CreateOrderDto,
  ): Promise<ApiRes<OrderResponseDto>> {
    console.log('📥 [Controller] 接收到创建订单请求:', JSON.stringify(dto, null, 2));

    // Controller 职责：
    // 1. 接收 HTTP 请求
    // 2. 验证数据格式（已通过 DTO 验证）
    // 3. 创建 Command
    // 4. 发送给 CommandBus
    // 5. 返回响应
    const command = new CreateOrderWithPaymentCommand(
      dto.userId,
      dto.items,
      dto.shippingAddressId,
      dto.couponCode,
      dto.paymentMethod,
      dto.remark,
    );

    const result = await this.commandBus.execute<
      CreateOrderWithPaymentCommand,
      OrderResponseDto
    >(command);

    console.log('✅ [Controller] 订单创建成功，返回结果');

    return ApiRes.success(result);
  }
}

