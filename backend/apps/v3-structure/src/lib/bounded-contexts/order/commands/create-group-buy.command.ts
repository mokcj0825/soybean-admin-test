/**
 * 创建拼团命令（开团）
 * 
 * 职责：传递创建拼团所需的参数
 */
export class CreateGroupBuyCommand {
  constructor(
    public readonly userId: string,
    public readonly activityId: string,
    public readonly quantity: number,
    public readonly shippingAddressId: string,
    public readonly paymentMethod: string,
    public readonly remark?: string,
  ) {}
}

