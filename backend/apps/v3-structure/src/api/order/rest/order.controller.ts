import { Controller, Post, Body } from '@nestjs/common';
import { CreateOrderDto, OrderResponseDto } from '../dto';
import { CreateOrderWithPaymentCommand } from '../../../lib/bounded-contexts/order/commands';
import { CreateOrderWithPaymentHandler } from '../../../lib/bounded-contexts/order/application';

/**
 * 订单控制器
 * 
 * 职责：
 * - 处理 HTTP 请求
 * - DTO 验证和转换
 * - 调用应用层服务
 * - 返回 HTTP 响应
 */
@Controller('order')
export class OrderController {
  constructor(
    private readonly createOrderHandler: CreateOrderWithPaymentHandler,
  ) {}

  /**
   * 创建订单并发起支付
   * 
   * POST /v3/api/order/create-with-payment
   */
  @Post('create-with-payment')
  async createOrderWithPayment(@Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
    // 1. DTO 转换为 Command
    const command = new CreateOrderWithPaymentCommand(
      dto.userId,
      dto.items,
      dto.shippingAddressId,
      dto.paymentMethod,
      dto.couponCode,
      dto.remark,
    );

    // 2. 执行命令
    const result = await this.createOrderHandler.execute(command);

    // 3. 转换为响应 DTO
    return {
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      finalAmount: result.finalAmount,
      paymentInfo: {
        paymentId: result.paymentInfo.paymentId,
        qrCodeUrl: result.paymentInfo.qrCodeUrl,
        expireTime: result.paymentInfo.expireTime,
      },
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天后
    };
  }
}

