import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

/**
 * 创建拼团请求 DTO
 */
export class CreateGroupBuyDto {
  @IsString()
  userId: string;

  @IsString()
  activityId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  shippingAddressId: string;

  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

