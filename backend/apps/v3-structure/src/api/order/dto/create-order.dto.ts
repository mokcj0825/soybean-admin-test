/**
 * 创建订单请求 DTO
 * 
 * 职责：
 * - 定义 HTTP 请求的数据结构
 * - 数据验证（通过 class-validator 装饰器）
 * 
 * 为什么需要 DTO：
 * - 隔离 HTTP 层和领域层
 * - 提供清晰的 API 契约
 * - 便于 Swagger 文档生成
 */

export class CreateOrderItemDto {
  productId!: string;
  
  skuId!: string;
  
  quantity!: number;
}

export class CreateOrderDto {
  userId!: string;
  
  items!: CreateOrderItemDto[];
  
  shippingAddressId!: string;
  
  paymentMethod!: string;
  
  couponCode?: string;
  
  remark?: string;
}

/**
 * 注意：在实际项目中，应该使用 class-validator 装饰器：
 * 
 * import { IsString, IsArray, IsNumber, Min, IsOptional } from 'class-validator';
 * 
 * export class CreateOrderItemDto {
 *   @IsString()
 *   productId!: string;
 *   
 *   @IsString()
 *   skuId!: string;
 *   
 *   @IsNumber()
 *   @Min(1)
 *   quantity!: number;
 * }
 */

