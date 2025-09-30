import { Body, Controller, Post } from '@nestjs/common';

import { RequestDto } from '@app/base-system/api/task/dto/RequestDto';
import { ResponseDto } from '@app/base-system/api/task/dto/ResponseDto';
import { CreateTaskService } from '@app/base-system/lib/bounded-contexts/task/application/service/CreateTaskService';

import { Public } from '@lib/infra/decorators/public.decorator';
import { ApiRes } from '@lib/infra/rest/res.response';


@Controller('task')
export class TaskController {
  constructor(private readonly createTaskService: CreateTaskService) {}

  @Public()
  @Post('create')
  async create(@Body() requestDto: RequestDto): Promise<ApiRes<ResponseDto>> {
    console.log('request', requestDto);
    const outcome = await this.createTaskService.createTask(requestDto);
    return ApiRes.success(outcome);
  }
}
