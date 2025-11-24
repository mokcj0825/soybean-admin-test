import { Module } from '@nestjs/common';
import { OrderModule } from './order.module';
import { GroupBuyModule } from './group-buy.module';

@Module({
  imports: [
    OrderModule,
    GroupBuyModule,
  ],
})
export class V3AppModule {}

