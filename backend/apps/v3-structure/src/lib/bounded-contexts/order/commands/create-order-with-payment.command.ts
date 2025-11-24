/**
 * 创建订单并发起支付命令
 * 
 * 为什么使用命令：
 * - 表达用户的意图（Intent）
 * - 命令是不可变的（Immutable）
 * - 命令可以被序列化、持久化、重放
 * - 符合CQRS模式
 */

export interface CreateOrderItemDto {
  productId: string;
  skuId: string;
  quantity: number;
}

export class CreateOrderWithPaymentCommand {
  constructor(
    public readonly userId: string,
    public readonly items: CreateOrderItemDto[],
    public readonly shippingAddressId: string,
    public readonly paymentMethod: string,
    public readonly couponCode?: string,
    public readonly remark?: string,
  ) {}
}

