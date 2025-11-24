/**
 * 拼团响应 DTO
 */
export class GroupBuyResponseDto {
  sessionId: string;
  orderId: string;
  groupBuyUrl: string;
  qrCodeUrl: string;
  activity: {
    activityId: string;
    productName: string;
    originalPrice: number;
    groupBuyPrice: number;
  };
  requiredCount: number;
  currentCount: number;
  remainingCount: number;
  expireTime: string;
  paymentInfo: {
    paymentId: string;
    qrCodeUrl: string;
    expireTime: string;
  };
}

