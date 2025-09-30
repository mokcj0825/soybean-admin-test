import { DynamicModule, Module, Provider } from '@nestjs/common';

import { PagelessExampleService } from '@app/base-system/lib/bounded-contexts/pageless-example-service/application/service/pageless-example.service';

@Module({})
export class PagelessModule {
  static register(options: {
    inject: Provider[];
    imports: any[];
  }): DynamicModule {
    return {
      module: PagelessModule,
      imports: [...options.imports],
      providers: [PagelessExampleService, ...options.inject],
      exports: [PagelessExampleService]
    }
  }
}
