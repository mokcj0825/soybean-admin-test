import { Injectable } from '@nestjs/common';

export interface ProductWithStock {
  id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
}

/**
 * 库存验证服务
 * 验证商品库存并预留
 */
@Injectable()
export class StockValidatorService {
  /**
   * 验证库存并预留
   */
  async validateAndReserve(
    items: Array<{ productId: string; skuId: string; quantity: number }>,
  ): Promise<ProductWithStock[]> {
    console.log('📦 [StockValidator] 开始验证库存...');
    console.log(`   商品数量: ${items.length}`);

    // 模拟数据库查询和库存检查
    const products: ProductWithStock[] = items.map((item, index) => {
      console.log(
        `   检查商品 ${item.productId} (SKU: ${item.skuId}), 需要数量: ${item.quantity}`,
      );

      // 模拟库存数据
      const mockStock = 100;
      const mockPrice = 99 + index * 10;

      if (item.quantity > mockStock) {
        throw new Error(
          `商品 ${item.productId} 库存不足，当前库存: ${mockStock}, 需要: ${item.quantity}`,
        );
      }

      console.log(`   ✅ 库存充足，当前库存: ${mockStock}`);

      // 模拟库存预留（真实环境会执行 SQL UPDATE）
      console.log(
        `   🔒 预留库存: UPDATE product_sku SET reserved_stock = reserved_stock + ${item.quantity} WHERE sku_id = '${item.skuId}'`,
      );

      return {
        id: item.productId,
        name: `商品${index + 1}`,
        price: mockPrice,
        stock: mockStock - item.quantity,
        image: `https://example.com/product${index + 1}.jpg`,
      };
    });

    console.log('✅ [StockValidator] 库存验证完成，库存已预留');
    return products;
  }

  /**
   * 释放预留的库存（回滚时使用）
   */
  async releaseReservation(
    items: Array<{ productId: string; skuId: string; quantity: number }>,
  ): Promise<void> {
    console.log('🔓 [StockValidator] 释放预留库存...');

    for (const item of items) {
      console.log(
        `   释放 SKU ${item.skuId} 的库存: ${item.quantity}`,
      );
      // 模拟 SQL: UPDATE product_sku SET reserved_stock = reserved_stock - ${quantity}
    }

    console.log('✅ [StockValidator] 库存已释放');
  }

  /**
   * 检查库存预警
   */
  async checkLowStock(
    items: Array<{ productId: string; skuId: string; quantity: number }>,
  ): Promise<string[]> {
    console.log('⚠️  [StockValidator] 检查库存预警...');

    const lowStockProducts: string[] = [];
    const threshold = 20; // 预警阈值

    for (const item of items) {
      // 模拟查询剩余库存
      const remainingStock = 15; // 模拟数据

      if (remainingStock < threshold) {
        console.log(
          `   ⚠️  商品 ${item.productId} 库存低于阈值: ${remainingStock} < ${threshold}`,
        );
        lowStockProducts.push(item.productId);
      }
    }

    if (lowStockProducts.length > 0) {
      console.log(`⚠️  [StockValidator] 发现 ${lowStockProducts.length} 个商品库存不足`);
    } else {
      console.log('✅ [StockValidator] 所有商品库存正常');
    }

    return lowStockProducts;
  }
}

