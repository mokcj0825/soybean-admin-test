import { IsString, IsOptional } from 'class-validator';

/**
 * 参加拼团请求 DTO
 */
export class JoinGroupBuyDto {
  @IsString()
  userId: string;

  @IsString()
  sessionId: string;

  @IsString()
  shippingAddressId: string;

  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  remark?: string;
}

