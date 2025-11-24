import { Injectable } from '@nestjs/common';
import { Money } from '../../../../shared-kernel';

/**
 * 价格计算结果
 */
export interface PriceCalculationResult {
  totalAmount: Money;        // 商品总额
  discountAmount: Money;     // 折扣金额
  shippingFee: Money;        // 运费
  finalAmount: Money;        // 最终应付金额
}

/**
 * 价格计算领域服务
 * 
 * 为什么是领域服务：
 * - 价格计算逻辑不属于某个特定实体
 * - 涉及多个值对象的协作
 * - 封装复杂的计算规则
 * 
 * 为什么放在 application/domain-services：
 * - 虽然是领域逻辑，但属于应用层编排
 * - 依赖外部数据（用户会员等级、优惠券信息）
 */
@Injectable()
export class PriceCalculatorService {
  /**
   * 计算订单价格
   */
  calculate(params: {
    itemsSubtotal: Money;
    memberLevel: string;
    couponDiscountAmount?: Money;
    shippingAddress: { province: string; city: string };
  }): PriceCalculationResult {
    const { itemsSubtotal, memberLevel, couponDiscountAmount, shippingAddress } = params;

    // 1. 商品总额
    const totalAmount = itemsSubtotal;

    // 2. 会员折扣
    const memberDiscount = this.calculateMemberDiscount(totalAmount, memberLevel);

    // 3. 优惠券折扣
    const couponDiscount = couponDiscountAmount || Money.zero();

    // 4. 总折扣金额
    const discountAmount = memberDiscount.add(couponDiscount);

    // 5. 运费计算
    const shippingFee = this.calculateShippingFee(totalAmount, shippingAddress);

    // 6. 最终金额 = 商品总额 - 折扣 + 运费
    const finalAmount = totalAmount.subtract(discountAmount).add(shippingFee);

    return {
      totalAmount,
      discountAmount,
      shippingFee,
      finalAmount,
    };
  }

  /**
   * 计算会员折扣
   */
  private calculateMemberDiscount(totalAmount: Money, memberLevel: string): Money {
    const discountRates: Record<string, number> = {
      vip: 0.05,      // VIP 5% 折扣
      svip: 0.1,      // SVIP 10% 折扣
      normal: 0,      // 普通会员无折扣
    };

    const rate = discountRates[memberLevel] || 0;
    return totalAmount.multiply(rate);
  }

  /**
   * 计算运费
   */
  private calculateShippingFee(
    totalAmount: Money,
    shippingAddress: { province: string; city: string },
  ): Money {
    // 业务规则：满99元包邮
    if (totalAmount.amount >= 99) {
      return Money.zero();
    }

    // 业务规则：偏远地区运费更高
    const remoteProvinces = ['西藏', '新疆', '内蒙古'];
    if (remoteProvinces.includes(shippingAddress.province)) {
      return Money.from(20);
    }

    return Money.from(10);
  }
}

