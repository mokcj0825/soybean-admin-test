/**
 * 示例测试：演示如何使用这个架构
 * 
 * 这不是真正的单元测试，而是一个可执行的示例
 * 用于演示整个流程
 */

import { CreateOrderWithPaymentCommand } from './lib/bounded-contexts/order/commands';
import { CreateOrderWithPaymentHandler } from './lib/bounded-contexts/order/application';
import { PriceCalculatorService } from './lib/bounded-contexts/order/application/domain-services';
import {
  OrderRepositoryImpl,
  WeChatPaymentGatewayAdapter,
  NotificationServiceAdapter,
} from './infra/bounded-contexts/order/adapters';
import { OrderCreatedHandler, PaymentInitiatedHandler } from './lib/bounded-contexts/order/application/event-handlers';

/**
 * 演示完整的订单创建流程
 */
async function demonstrateOrderCreation() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          V3 DDD Architecture - Order Demo                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // ============================================
  // 1. 组装依赖（依赖注入）
  // ============================================
  console.log('【初始化】组装依赖...\n');
  
  const orderRepository = new OrderRepositoryImpl();
  const paymentGateway = new WeChatPaymentGatewayAdapter();
  const priceCalculator = new PriceCalculatorService();
  const notificationService = new NotificationServiceAdapter();

  const createOrderHandler = new CreateOrderWithPaymentHandler(
    orderRepository,
    paymentGateway,
    priceCalculator,
  );

  const orderCreatedHandler = new OrderCreatedHandler(notificationService);
  const paymentInitiatedHandler = new PaymentInitiatedHandler();

  // ============================================
  // 2. 构建命令
  // ============================================
  const command = new CreateOrderWithPaymentCommand(
    'user_001',
    [
      { productId: 'prod_001', skuId: 'sku_001', quantity: 2 },
      { productId: 'prod_002', skuId: 'sku_002', quantity: 1 },
    ],
    'addr_456',
    'wechat_pay',
    'SUMMER2024',
    '请在下午送达',
  );

  // ============================================
  // 3. 执行命令
  // ============================================
  try {
    const result = await createOrderHandler.execute(command);

    // ============================================
    // 4. 模拟事件处理
    // ============================================
    console.log('【事件处理】异步处理领域事件...\n');
    
    // 在实际项目中，这些事件处理器会被 EventBus 自动触发
    // 这里手动调用以演示效果
    
    // await orderCreatedHandler.handle(orderCreatedEvent);
    // await paymentInitiatedHandler.handle(paymentInitiatedEvent);

    // ============================================
    // 5. 返回结果
    // ============================================
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    执行结果                                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n✅ 订单创建流程完成！\n');

  } catch (error) {
    console.error('❌ 订单创建失败:', error);
  }
}

// 运行示例
// demonstrateOrderCreation();

/**
 * 如何运行这个示例：
 * 
 * 1. 在项目根目录执行：
 *    ts-node backend/apps/v3-structure/src/example.test.ts
 * 
 * 2. 或者添加到 package.json：
 *    "scripts": {
 *      "demo:v3": "ts-node backend/apps/v3-structure/src/example.test.ts"
 *    }
 *    然后运行：npm run demo:v3
 */

export { demonstrateOrderCreation };

