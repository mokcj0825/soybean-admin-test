import { Injectable } from '@nestjs/common';

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minAmount: number;
  maxDiscount?: number;
  expireDate: Date;
}

/**
 * 优惠券验证服务
 */
@Injectable()
export class CouponValidatorService {
  /**
   * 验证优惠券并锁定
   */
  async validateAndLock(
    couponCode: string,
    userId: string,
  ): Promise<Coupon | null> {
    if (!couponCode) {
      return null;
    }

    console.log(`🎫 [CouponValidator] 验证优惠券: ${couponCode}`);
    console.log(`   用户ID: ${userId}`);

    // 模拟数据库查询优惠券
    console.log(
      `   SQL: SELECT * FROM coupon WHERE code = '${couponCode}' AND used_by IS NULL`,
    );

    // 模拟优惠券数据
    const mockCoupon: Coupon = {
      id: 'coupon_123',
      code: couponCode,
      discountType: 'FIXED_AMOUNT',
      discountValue: 50,
      minAmount: 200,
      maxDiscount: 100,
      expireDate: new Date('2024-12-31'),
    };

    // 验证优惠券是否过期
    if (mockCoupon.expireDate < new Date()) {
      console.log('   ❌ 优惠券已过期');
      throw new Error('优惠券已过期');
    }

    // 验证优惠券是否已使用
    console.log('   ✅ 优惠券有效，未被使用');

    // 锁定优惠券（防止并发使用）
    console.log(
      `   🔒 锁定优惠券: UPDATE coupon SET locked_by = '${userId}', locked_at = NOW() WHERE id = '${mockCoupon.id}'`,
    );

    console.log('✅ [CouponValidator] 优惠券验证完成并已锁定');

    return mockCoupon;
  }

  /**
   * 解锁优惠券（回滚时使用）
   */
  async unlock(couponId: string): Promise<void> {
    console.log(`🔓 [CouponValidator] 解锁优惠券: ${couponId}`);
    console.log(
      `   SQL: UPDATE coupon SET locked_by = NULL, locked_at = NULL WHERE id = '${couponId}'`,
    );
    console.log('✅ [CouponValidator] 优惠券已解锁');
  }

  /**
   * 标记优惠券为已使用
   */
  async markAsUsed(couponId: string, userId: string, orderId: string): Promise<void> {
    console.log(`✅ [CouponValidator] 标记优惠券为已使用: ${couponId}`);
    console.log(
      `   SQL: UPDATE coupon SET used_by = '${userId}', used_at = NOW(), order_id = '${orderId}' WHERE id = '${couponId}'`,
    );
  }
}

