import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OrderController } from './api/order/rest/order.controller';
import { CreateOrderWithPaymentHandler } from './lib/bounded-contexts/order/application/command-handlers/create-order-with-payment.handler';
import { OrderCreatedHandler } from './lib/bounded-contexts/order/application/event-handlers/order-created.handler';
import { PaymentInitiatedHandler } from './lib/bounded-contexts/order/application/event-handlers/payment-initiated.handler';
import { PriceCalculatorService } from './lib/bounded-contexts/order/application/domain-services/price-calculator.service';
import { OrderRepositoryImpl } from './infra/bounded-contexts/order/adapters/repositories/order.repository.impl';
import { WeChatPaymentGatewayAdapter } from './infra/bounded-contexts/order/adapters/payment-gateway/payment-gateway.adapter';
import { NotificationServiceAdapter } from './infra/bounded-contexts/order/adapters/notification/notification.adapter';

// Token 常量
export const ORDER_REPOSITORY = 'ORDER_REPOSITORY';
export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';
export const NOTIFICATION_SERVICE = 'NOTIFICATION_SERVICE';

@Module({
  imports: [CqrsModule],
  controllers: [OrderController],
  providers: [
    // Command Handlers
    CreateOrderWithPaymentHandler,
    
    // Event Handlers
    OrderCreatedHandler,
    PaymentInitiatedHandler,
    
    // Domain Services
    PriceCalculatorService,
    
    // Infrastructure - 使用 useClass 注入
    {
      provide: ORDER_REPOSITORY,
      useClass: OrderRepositoryImpl,
    },
    {
      provide: PAYMENT_GATEWAY,
      useClass: WeChatPaymentGatewayAdapter,
    },
    {
      provide: NOTIFICATION_SERVICE,
      useClass: NotificationServiceAdapter,
    },
  ],
})
export class OrderModule {}

