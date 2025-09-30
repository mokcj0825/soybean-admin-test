import { DynamicModule, Module, Provider } from '@nestjs/common';

import { CreateTaskService } from '@app/base-system/lib/bounded-contexts/task/application/service/CreateTaskService';

@Module({})
export class TaskModule {
  static register(options: {
    inject: Provider[];
    imports: any[];
  }): DynamicModule {
    return {
      module: TaskModule,
      imports: [...options.imports],
      providers: [CreateTaskService, ...options.inject],
      exports: [CreateTaskService]
    }
  }
}
