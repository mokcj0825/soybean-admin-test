import { Injectable } from '@nestjs/common';

import { Coupon } from './coupon-validator.service';
import { ProductWithStock } from './stock-validator.service';

export interface PriceBreakdown {
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
}

/**
 * 价格计算服务
 * 负责计算订单各项金额
 */
@Injectable()
export class PriceCalculatorService {
  /**
   * 计算订单金额
   */
  async calculate(params: {
    products: ProductWithStock[];
    items: Array<{ productId: string; quantity: number }>;
    userLevel: string;
    coupon: Coupon | null;
    shippingAddressId: string;
  }): Promise<PriceBreakdown> {
    console.log('💰 [PriceCalculator] 开始计算订单金额...');

    // 1. 计算商品总额
    let totalAmount = 0;
    for (const item of params.items) {
      const product = params.products.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`商品 ${item.productId} 未找到`);
      }
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      console.log(
        `   商品 ${product.name}: ${product.price} × ${item.quantity} = ${itemTotal}`,
      );
    }
    console.log(`   📊 商品总额: ¥${totalAmount.toFixed(2)}`);

    // 2. 计算会员折扣
    let memberDiscount = 0;
    if (params.userLevel === 'VIP') {
      memberDiscount = totalAmount * 0.05; // VIP 享受 5% 折扣
      console.log(`   🎖️  会员折扣 (VIP 5%): -¥${memberDiscount.toFixed(2)}`);
    } else if (params.userLevel === 'SVIP') {
      memberDiscount = totalAmount * 0.1; // SVIP 享受 10% 折扣
      console.log(`   👑 会员折扣 (SVIP 10%): -¥${memberDiscount.toFixed(2)}`);
    }

    // 3. 计算优惠券折扣
    let couponDiscount = 0;
    if (params.coupon) {
      if (totalAmount < params.coupon.minAmount) {
        console.log(
          `   ⚠️  订单金额 ¥${totalAmount} 未达到优惠券最低使用金额 ¥${params.coupon.minAmount}，优惠券不生效`,
        );
      } else {
        if (params.coupon.discountType === 'FIXED_AMOUNT') {
          couponDiscount = params.coupon.discountValue;
        } else if (params.coupon.discountType === 'PERCENTAGE') {
          couponDiscount = totalAmount * (params.coupon.discountValue / 100);
          if (params.coupon.maxDiscount && couponDiscount > params.coupon.maxDiscount) {
            couponDiscount = params.coupon.maxDiscount;
          }
        }
        console.log(
          `   🎫 优惠券折扣 (${params.coupon.code}): -¥${couponDiscount.toFixed(2)}`,
        );
      }
    }

    const discountAmount = memberDiscount + couponDiscount;

    // 4. 计算运费
    const shippingFee = await this.calculateShippingFee(
      params.shippingAddressId,
      totalAmount - discountAmount,
    );
    console.log(`   🚚 运费: ¥${shippingFee.toFixed(2)}`);

    // 5. 计算最终金额
    const finalAmount = totalAmount - discountAmount + shippingFee;

    console.log('');
    console.log('   ━━━━━━━━━━━━━━━━━━━━');
    console.log(`   商品总额:   ¥${totalAmount.toFixed(2)}`);
    console.log(`   优惠金额:  -¥${discountAmount.toFixed(2)}`);
    console.log(`   运费:      +¥${shippingFee.toFixed(2)}`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━');
    console.log(`   应付金额:   ¥${finalAmount.toFixed(2)}`);
    console.log('');

    return {
      totalAmount,
      discountAmount,
      shippingFee,
      finalAmount,
    };
  }

  /**
   * 计算运费
   */
  private async calculateShippingFee(
    addressId: string,
    orderAmount: number,
  ): Promise<number> {
    console.log(`   🚚 计算运费 (地址ID: ${addressId})...`);

    // 模拟查询地址
    console.log(`   SQL: SELECT * FROM shipping_address WHERE id = '${addressId}'`);

    // 运费规则：
    // - 订单满 200 元免运费
    // - 偏远地区 +5 元
    // - 其他地区基础运费 10 元
    if (orderAmount >= 200) {
      console.log('   ✅ 订单满200元，免运费');
      return 0;
    }

    const isRemoteArea = false; // 模拟判断
    const baseFee = 10;
    const remoteFee = isRemoteArea ? 5 : 0;

    return baseFee + remoteFee;
  }
}

