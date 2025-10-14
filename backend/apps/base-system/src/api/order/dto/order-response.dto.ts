import { ApiProperty } from '@nestjs/swagger';

export class PaymentInfoDto {
  @ApiProperty({ description: '支付ID' })
  paymentId: string;

  @ApiProperty({ description: '支付二维码URL' })
  qrCodeUrl: string;

  @ApiProperty({ description: '过期时间' })
  expireTime: string;
}

export class OrderResponseDto {
  @ApiProperty({ description: '订单ID' })
  orderId: string;

  @ApiProperty({ description: '订单号' })
  orderNumber: string;

  @ApiProperty({ description: '商品总额' })
  totalAmount: number;

  @ApiProperty({ description: '优惠金额' })
  discountAmount: number;

  @ApiProperty({ description: '运费' })
  shippingFee: number;

  @ApiProperty({ description: '最终应付金额' })
  finalAmount: number;

  @ApiProperty({ description: '支付信息' })
  paymentInfo: PaymentInfoDto;

  @ApiProperty({ description: '预计送达时间', required: false })
  estimatedDelivery?: string;
}

