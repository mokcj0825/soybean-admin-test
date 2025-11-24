import { Inject, Injectable } from '@nestjs/common';
import { CreateOrderWithPaymentCommand } from '../../commands';
import { Order, OrderItem } from '../../domain';
import { OrderStatus } from '../../domain/value-objects/order-status.vo';
import { ShippingAddress } from '../../domain/value-objects/shipping-address.vo';
import { PaymentInitiatedEvent } from '../../domain/events';
import {
  IOrderRepository,
  IPaymentGateway,
} from '../../ports';
import { PriceCalculatorService } from '../domain-services';
import { Money, PhoneNumber, ValidationException } from '../../../../shared-kernel';

// Token 常量
const ORDER_REPOSITORY = 'ORDER_REPOSITORY';
const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';

/**
 * 创建订单并发起支付命令处理器
 * 
 * 职责：
 * - 编排整个业务流程
 * - 协调多个领域对象和领域服务
 * - 调用基础设施服务（通过端口）
 * - 保证事务一致性
 */
@Injectable()
export class CreateOrderWithPaymentHandler {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: IPaymentGateway,
    private readonly priceCalculator: PriceCalculatorService,
  ) {}

  async execute(command: CreateOrderWithPaymentCommand): Promise<{
    orderId: string;
    orderNumber: string;
    finalAmount: number;
    paymentInfo: {
      paymentId: string;
      qrCodeUrl?: string;
      expireTime: Date;
    };
  }> {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║        开始处理订单创建命令 (Command Handler)             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // ============================================
    // 阶段1：验证用户
    // ============================================
    console.log('【阶段1】验证用户');
    console.log('─────────────────────────────────────');
    const user = await this.validateUser(command.userId);
    console.log(`✅ 用户验证通过: ${user.username} (${user.memberLevel})\n`);

    // ============================================
    // 阶段2：验证商品并获取商品信息
    // ============================================
    console.log('【阶段2】验证商品并获取商品信息');
    console.log('─────────────────────────────────────');
    const productsInfo = await this.validateAndGetProducts(command.items);
    console.log(`✅ 商品验证通过，共 ${productsInfo.length} 个商品\n`);

    // ============================================
    // 阶段3：验证并预留库存
    // ============================================
    console.log('【阶段3】验证并预留库存');
    console.log('─────────────────────────────────────');
    await this.reserveStock(command.items);
    console.log('✅ 库存预留成功\n');

    // ============================================
    // 阶段4：验证并锁定优惠券
    // ============================================
    console.log('【阶段4】验证并锁定优惠券');
    console.log('─────────────────────────────────────');
    let couponDiscountAmount: Money | undefined;
    if (command.couponCode) {
      couponDiscountAmount = await this.validateAndLockCoupon(
        command.couponCode,
        command.userId,
      );
      console.log(`✅ 优惠券验证成功，折扣金额: ¥${couponDiscountAmount.amount}\n`);
    } else {
      console.log('⏭️  未使用优惠券\n');
    }

    // ============================================
    // 阶段5：获取收货地址
    // ============================================
    console.log('【阶段5】获取收货地址');
    console.log('─────────────────────────────────────');
    const shippingAddress = await this.getShippingAddress(
      command.shippingAddressId,
      command.userId,
    );
    console.log(`✅ 收货地址: ${shippingAddress.fullAddress}\n`);

    // ============================================
    // 阶段6：计算订单金额
    // ============================================
    console.log('【阶段6】计算订单金额');
    console.log('─────────────────────────────────────');
    const itemsSubtotal = this.calculateItemsSubtotal(productsInfo);
    const priceResult = this.priceCalculator.calculate({
      itemsSubtotal,
      memberLevel: user.memberLevel,
      couponDiscountAmount,
      shippingAddress: {
        province: shippingAddress['props'].province,
        city: shippingAddress['props'].city,
      },
    });

    console.log(`💰 商品总额: ¥${priceResult.totalAmount.amount}`);
    console.log(`🎖️  折扣金额: -¥${priceResult.discountAmount.amount}`);
    console.log(`🚚 运费: ¥${priceResult.shippingFee.amount}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ 最终金额: ¥${priceResult.finalAmount.amount}\n`);

    // ============================================
    // 阶段7：创建订单领域对象
    // ============================================
    console.log('【阶段7】创建订单领域对象');
    console.log('─────────────────────────────────────');
    const orderId = this.generateId();
    const orderNumber = await this.orderRepository.generateOrderNumber();

    const orderItems = productsInfo.map((product) => {
      const item = command.items.find((i) => i.productId === product.id)!;
      return OrderItem.create(this.generateId(), {
        productId: product.id,
        productName: product.name,
        skuId: item.skuId,
        skuAttributes: 'mock-attributes',
        quantity: item.quantity,
        unitPrice: Money.from(product.price),
        subtotal: Money.from(product.price * item.quantity),
      });
    });

    const order = Order.create(orderId, {
      orderNumber,
      userId: command.userId,
      items: orderItems,
      totalAmount: priceResult.totalAmount,
      discountAmount: priceResult.discountAmount,
      shippingFee: priceResult.shippingFee,
      finalAmount: priceResult.finalAmount,
      status: OrderStatus.pendingPayment(),
      shippingAddress,
      remark: command.remark,
      couponCode: command.couponCode,
    });

    console.log(`🎉 订单聚合根已创建: ${orderNumber}\n`);

    // ============================================
    // 阶段8：持久化订单（事务）
    // ============================================
    console.log('【阶段8】持久化订单（事务）');
    console.log('─────────────────────────────────────');
    await this.orderRepository.save(order);
    console.log('✅ 订单保存成功\n');

    // ============================================
    // 阶段9：发起第三方支付
    // ============================================
    console.log('【阶段9】发起第三方支付');
    console.log('─────────────────────────────────────');
    const paymentResult = await this.paymentGateway.initiatePayment(
      orderId,
      priceResult.finalAmount.amount,
      command.paymentMethod,
    );
    console.log(`✅ 支付发起成功`);
    console.log(`   支付ID: ${paymentResult.paymentId}\n`);

    // ============================================
    // 阶段10：发布领域事件
    // ============================================
    console.log('【阶段10】发布领域事件');
    console.log('─────────────────────────────────────');
    
    // 发布支付发起事件
    const paymentEvent = new PaymentInitiatedEvent(
      orderId,
      orderNumber,
      paymentResult.paymentId,
      priceResult.finalAmount.amount,
      command.paymentMethod,
    );

    // 在实际项目中，这里应该通过 EventBus 发布事件
    // await this.eventBus.publish(order.domainEvents);
    // await this.eventBus.publish([paymentEvent]);
    
    console.log('✅ 事件已发布:');
    console.log('   - OrderCreatedEvent');
    console.log('   - PaymentInitiatedEvent\n');

    // 清空已发布的事件
    order.clearEvents();

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ 订单创建成功！                        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      finalAmount: priceResult.finalAmount.amount,
      paymentInfo: {
        paymentId: paymentResult.paymentId,
        qrCodeUrl: paymentResult.qrCodeUrl,
        expireTime: paymentResult.expireTime,
      },
    };
  }

  // ============================================
  // 私有辅助方法（模拟外部服务调用）
  // ============================================

  private async validateUser(userId: string): Promise<{
    id: string;
    username: string;
    memberLevel: string;
  }> {
    // 在实际项目中，这里应该调用 UserRepository
    return {
      id: userId,
      username: 'test_user',
      memberLevel: 'vip',
    };
  }

  private async validateAndGetProducts(
    items: Array<{ productId: string; skuId: string; quantity: number }>,
  ): Promise<Array<{ id: string; name: string; price: number }>> {
    // 在实际项目中，这里应该调用 ProductRepository
    return items.map((item, index) => ({
      id: item.productId,
      name: `商品${index + 1}`,
      price: 99,
    }));
  }

  private async reserveStock(
    items: Array<{ productId: string; skuId: string; quantity: number }>,
  ): Promise<void> {
    // 在实际项目中，这里应该调用 StockService
    // 使用数据库行锁或 Redis 分布式锁
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async validateAndLockCoupon(
    couponCode: string,
    userId: string,
  ): Promise<Money> {
    // 在实际项目中，这里应该调用 CouponRepository
    return Money.from(50);
  }

  private async getShippingAddress(
    addressId: string,
    userId: string,
  ): Promise<ShippingAddress> {
    // 在实际项目中，这里应该调用 AddressRepository
    return ShippingAddress.create({
      recipientName: '张三',
      phone: PhoneNumber.create('13800138000'),
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      detailAddress: '科技园南区xx大厦',
    });
  }

  private calculateItemsSubtotal(
    products: Array<{ id: string; price: number }>,
  ): Money {
    const total = products.reduce((sum, product) => sum + product.price, 0);
    return Money.from(total);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

