import {Module} from '@nestjs/common';

import { TaskModule } from '@app/base-system/lib/bounded-contexts/task/task.module';

@Module({
  imports: [
    TaskModule.register({
      inject: [],
      imports: [],
    })
  ], exports: [TaskModule],
})
export class TaskInfraModule {}
