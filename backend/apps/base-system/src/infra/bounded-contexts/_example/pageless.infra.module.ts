import { Module } from '@nestjs/common';

import { PagelessModule } from '@app/base-system/lib/bounded-contexts/_example/pageless.module';

@Module({
  imports: [
    PagelessModule.register({
      inject: [],
      imports: [],
    })
  ], exports: [PagelessModule],
})
export class PagelessInfraModule {}
