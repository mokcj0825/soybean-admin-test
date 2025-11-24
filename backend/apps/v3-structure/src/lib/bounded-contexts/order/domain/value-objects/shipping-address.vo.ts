import { ValueObject } from '../../../../shared-kernel';
import { PhoneNumber } from '../../../../shared-kernel';

interface ShippingAddressProps {
  recipientName: string;
  phone: PhoneNumber;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  postalCode?: string;
}

/**
 * 收货地址值对象
 * 
 * 为什么是值对象：
 * - 地址是不可变的
 * - 订单创建后，即使用户修改了地址簿，订单的地址也不应该改变
 * - 封装地址的完整性验证
 */
export class ShippingAddress extends ValueObject<ShippingAddressProps> {
  private constructor(props: ShippingAddressProps) {
    super(props);
  }

  static create(props: ShippingAddressProps): ShippingAddress {
    // 验证
    if (!props.recipientName || !props.recipientName.trim()) {
      throw new Error('收货人姓名不能为空');
    }
    if (!props.province || !props.city || !props.district) {
      throw new Error('省市区信息不完整');
    }
    if (!props.detailAddress || !props.detailAddress.trim()) {
      throw new Error('详细地址不能为空');
    }

    return new ShippingAddress(props);
  }

  get recipientName(): string {
    return this.props.recipientName;
  }

  get phone(): PhoneNumber {
    return this.props.phone;
  }

  get fullAddress(): string {
    return `${this.props.province}${this.props.city}${this.props.district}${this.props.detailAddress}`;
  }

  toString(): string {
    return `${this.recipientName} ${this.phone.value} ${this.fullAddress}`;
  }

  toJSON() {
    return {
      recipientName: this.props.recipientName,
      phone: this.props.phone.value,
      province: this.props.province,
      city: this.props.city,
      district: this.props.district,
      detailAddress: this.props.detailAddress,
      postalCode: this.props.postalCode,
    };
  }
}

