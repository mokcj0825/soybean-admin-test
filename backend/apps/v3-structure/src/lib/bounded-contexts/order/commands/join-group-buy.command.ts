/**
 * 参加拼团命令（参团）
 * 
 * 职责：传递参团所需的参数
 * 
 * 注意：
 * - 这是系统中最复杂的命令之一
 * - 需要处理并发控制（多人同时参团）
 * - 需要乐观锁防止超员
 */
export class JoinGroupBuyCommand {
  constructor(
    public readonly userId: string,
    public readonly sessionId: string,
    public readonly shippingAddressId: string,
    public readonly paymentMethod: string,
    public readonly remark?: string,
  ) {}
}

