import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CreateOrderWithPaymentHandler } from './application/command-handlers/create-order-with-payment.handler';
import { OrderCreatedHandler } from './application/event-handlers/order-created.handler';
import { PaymentInitiatedHandler } from './application/event-handlers/payment-initiated.handler';
import { CouponValidatorService } from './application/service/coupon-validator.service';
import { PaymentGatewayService } from './application/service/payment-gateway.service';
import { PriceCalculatorService } from './application/service/price-calculator.service';
import { StockValidatorService } from './application/service/stock-validator.service';

// Command Handlers
const CommandHandlers = [CreateOrderWithPaymentHandler];

// Event Handlers
const EventHandlers = [OrderCreatedHandler, PaymentInitiatedHandler];

// Services
const Services = [
  StockValidatorService,
  CouponValidatorService,
  PriceCalculatorService,
  PaymentGatewayService,
];

@Module({
  imports: [CqrsModule],
  providers: [...CommandHandlers, ...EventHandlers, ...Services],
  exports: [...Services],
})
export class OrderModule {}

