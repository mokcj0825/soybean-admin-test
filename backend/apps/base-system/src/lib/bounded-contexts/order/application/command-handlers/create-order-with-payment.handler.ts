import { BadRequestException, Injectable } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { CreateOrderWithPaymentCommand } from '../../commands/create-order-with-payment.command';
import { Money } from '../../domain/money.value-object';
import { Order } from '../../domain/order';
import { OrderItem } from '../../domain/order-item';
import { CouponValidatorService } from '../service/coupon-validator.service';
import { PaymentGatewayService } from '../service/payment-gateway.service';
import { PriceCalculatorService } from '../service/price-calculator.service';
import { StockValidatorService } from '../service/stock-validator.service';

/**
 * 创建订单并发起支付 - 命令处理器
 * 这是核心业务逻辑的编排中心
 */
@CommandHandler(CreateOrderWithPaymentCommand)
@Injectable()
export class CreateOrderWithPaymentHandler
  implements ICommandHandler<CreateOrderWithPaymentCommand>
{
  constructor(
    private readonly publisher: EventPublisher,
    private readonly stockValidator: StockValidatorService,
    private readonly couponValidator: CouponValidatorService,
    private readonly priceCalculator: PriceCalculatorService,
    private readonly paymentGateway: PaymentGatewayService,
  ) {}

  async execute(command: CreateOrderWithPaymentCommand) {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║        开始处理订单创建命令 (Command Handler)             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');

    try {
      // ============ 阶段1: 验证用户 ============
      console.log('【阶段1】验证用户');
      console.log('─────────────────────────────────────');
      await this.validateUser(command.userId);

      // ============ 阶段2: 验证库存并预留 ============
      console.log('');
      console.log('【阶段2】验证库存并预留');
      console.log('─────────────────────────────────────');
      const validatedProducts = await this.stockValidator.validateAndReserve(
        command.items,
      );

      // ============ 阶段3: 验证优惠券并锁定 ============
      console.log('');
      console.log('【阶段3】验证优惠券并锁定');
      console.log('─────────────────────────────────────');
      const coupon = command.couponCode
        ? await this.couponValidator.validateAndLock(
            command.couponCode,
            command.userId,
          )
        : null;

      // ============ 阶段4: 计算价格 ============
      console.log('');
      console.log('【阶段4】计算订单金额');
      console.log('─────────────────────────────────────');
      const priceBreakdown = await this.priceCalculator.calculate({
        products: validatedProducts,
        items: command.items,
        userLevel: 'VIP', // 模拟用户等级
        coupon: coupon,
        shippingAddressId: command.shippingAddressId,
      });

      // ============ 阶段5: 创建订单领域对象 ============
      console.log('');
      console.log('【阶段5】创建订单领域对象');
      console.log('─────────────────────────────────────');

      // 创建订单项
      const orderItems = command.items.map((item) => {
        const product = validatedProducts.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(`商品 ${item.productId} 未找到`);
        }

        return OrderItem.create({
          productId: item.productId,
          skuId: item.skuId,
          quantity: item.quantity,
          price: Money.from(product.price),
          productName: product.name,
          productImage: product.image,
        });
      });

      console.log(`   创建了 ${orderItems.length} 个订单明细`);

      // 创建订单聚合根
      const order = Order.create({
        userId: command.userId,
        items: orderItems,
        totalAmount: Money.from(priceBreakdown.totalAmount),
        discountAmount: Money.from(priceBreakdown.discountAmount),
        shippingFee: Money.from(priceBreakdown.shippingFee),
        finalAmount: Money.from(priceBreakdown.finalAmount),
        shippingAddressId: command.shippingAddressId,
        couponCode: command.couponCode,
        remark: command.remark,
      });

      // ============ 阶段6: 持久化订单（模拟事务） ============
      console.log('');
      console.log('【阶段6】持久化订单（事务）');
      console.log('─────────────────────────────────────');
      await this.saveOrderWithTransaction(order, command.items, coupon?.id);

      // ============ 阶段7: 发起支付 ============
      console.log('');
      console.log('【阶段7】发起第三方支付');
      console.log('─────────────────────────────────────');
      const paymentInfo = await this.paymentGateway.initiatePayment({
        orderId: order.id,
        amount: order.finalAmount.getValue(),
        method: command.paymentMethod,
        userId: command.userId,
      });

      // 更新订单支付信息
      order.setPaymentInfo(paymentInfo);

      // 模拟更新订单
      console.log('');
      console.log('   💾 更新订单支付信息...');
      console.log(
        `   SQL: UPDATE orders SET payment_id = '${paymentInfo.id}' WHERE id = '${order.id}'`,
      );

      // ============ 阶段8: 发布领域事件 ============
      console.log('');
      console.log('【阶段8】发布领域事件');
      console.log('─────────────────────────────────────');
      console.log('   📢 准备发布事件...');

      // 将订单聚合根与事件发布器合并
      this.publisher.mergeObjectContext(order);

      // 提交所有领域事件（会触发所有注册的 Event Handlers）
      order.commit();

      console.log('   ✅ 事件已发布，Event Handlers 将异步处理');

      // ============ 返回结果 ============
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║                  ✅ 订单创建成功！                        ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount.getValue(),
        discountAmount: order.discountAmount.getValue(),
        shippingFee: order.shippingFee.getValue(),
        finalAmount: order.finalAmount.getValue(),
        paymentInfo: {
          paymentId: paymentInfo.id,
          qrCodeUrl: paymentInfo.qrCodeUrl,
          expireTime: paymentInfo.expireTime.toISOString(),
        },
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2天后
      };
    } catch (error) {
      // ============ 错误处理和回滚 ============
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║                  ❌ 订单创建失败！                        ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');
      console.error('   错误信息:', error.message);

      console.log('');
      console.log('🔄 开始回滚操作...');
      console.log('─────────────────────────────────────');

      // 释放库存
      try {
        await this.stockValidator.releaseReservation(command.items);
      } catch (rollbackError) {
        console.error('   ⚠️  释放库存失败:', rollbackError.message);
      }

      // 解锁优惠券
      if (command.couponCode) {
        try {
          // 这里简化处理，实际需要获取 coupon.id
          console.log(`   🔓 解锁优惠券: ${command.couponCode}`);
        } catch (rollbackError) {
          console.error('   ⚠️  解锁优惠券失败:', rollbackError.message);
        }
      }

      console.log('✅ 回滚完成');
      console.log('');

      throw error;
    }
  }

  /**
   * 验证用户
   */
  private async validateUser(userId: string): Promise<void> {
    console.log(`👤 [验证用户] 用户ID: ${userId}`);

    // 模拟数据库查询
    console.log(`   SQL: SELECT * FROM sys_user WHERE id = '${userId}'`);

    // 模拟用户数据
    const user = {
      id: userId,
      username: 'test_user',
      status: 'ENABLED',
      memberLevel: 'VIP',
    };

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    if (user.status !== 'ENABLED') {
      throw new BadRequestException('用户已被禁用');
    }

    console.log(`   ✅ 用户验证通过: ${user.username} (${user.memberLevel})`);
  }

  /**
   * 保存订单（模拟数据库事务）
   */
  private async saveOrderWithTransaction(
    order: Order,
    items: Array<{ productId: string; skuId: string; quantity: number }>,
    couponId?: string,
  ): Promise<void> {
    console.log('💾 [事务] 开始数据库事务...');
    console.log('   BEGIN TRANSACTION;');
    console.log('');

    try {
      // 1. 插入订单主表
      console.log('   1️⃣  插入订单主表...');
      console.log(`   SQL: INSERT INTO orders (id, order_number, user_id, total_amount, ...)`);
      console.log(`        VALUES ('${order.id}', '${order.orderNumber}', ...)`);

      // 2. 插入订单明细
      console.log('');
      console.log('   2️⃣  插入订单明细...');
      for (const item of order.items) {
        console.log(
          `   SQL: INSERT INTO order_items (order_id, product_id, sku_id, quantity, price)`,
        );
        console.log(
          `        VALUES ('${order.id}', '${item.productId}', '${item.skuId}', ${item.quantity}, ${item.price.getValue()})`,
        );
      }

      // 3. 扣减库存（从预留转为实际扣减）
      console.log('');
      console.log('   3️⃣  扣减库存...');
      for (const item of items) {
        console.log(
          `   SQL: UPDATE product_sku SET stock = stock - ${item.quantity}, reserved_stock = reserved_stock - ${item.quantity}`,
        );
        console.log(`        WHERE sku_id = '${item.skuId}'`);
      }

      // 4. 标记优惠券为已使用
      if (couponId) {
        console.log('');
        console.log('   4️⃣  标记优惠券为已使用...');
        console.log(
          `   SQL: UPDATE coupon SET used_by = '${order.userId}', used_at = NOW(), order_id = '${order.id}'`,
        );
        console.log(`        WHERE id = '${couponId}'`);
      }

      // 5. 记录操作日志
      console.log('');
      console.log('   5️⃣  记录操作日志...');
      console.log(
        `   SQL: INSERT INTO operation_log (user_id, action, details) VALUES ('${order.userId}', 'CREATE_ORDER', ...)`,
      );

      console.log('');
      console.log('   COMMIT;');
      console.log('   ✅ 事务提交成功');
    } catch (error) {
      console.log('');
      console.log('   ROLLBACK;');
      console.log('   ❌ 事务回滚');
      throw error;
    }
  }
}

