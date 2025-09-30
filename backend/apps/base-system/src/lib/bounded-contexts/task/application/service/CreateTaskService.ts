import { Injectable } from '@nestjs/common';

import { RequestDto } from '@app/base-system/api/task/dto/RequestDto';
import { ResponseDto } from '@app/base-system/api/task/dto/ResponseDto';

@Injectable()
export class CreateTaskService {
  constructor() {}

  async createTask(input: RequestDto): Promise<ResponseDto> {
    console.log(input);
    return new ResponseDto(
      'taskId',
      input.title,
      input.description,
      new Date().toISOString(),
      new Date().toISOString(),
      'ownerId',
      input.priority,
      input.dueDate,
    );
  }
}
