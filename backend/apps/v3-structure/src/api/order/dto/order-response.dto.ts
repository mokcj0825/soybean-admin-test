/**
 * 订单响应 DTO
 * 
 * 职责：
 * - 定义 HTTP 响应的数据结构
 * - 控制返回给前端的字段
 * - 数据格式化
 */

export class PaymentInfoDto {
  paymentId!: string;
  qrCodeUrl?: string;
  h5Url?: string;
  expireTime!: Date;
}

export class OrderResponseDto {
  orderId!: string;
  orderNumber!: string;
  finalAmount!: number;
  paymentInfo!: PaymentInfoDto;
  estimatedDelivery?: Date;
}

/**
 * 为什么不直接返回领域对象：
 * - 领域对象包含内部状态，不应该暴露给外部
 * - 响应格式可能与领域模型不同
 * - 避免领域模型变化影响 API 契约
 */

