import { Body, Controller, Post, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';

import { FirstActionDTO } from '@app/base-system/api/_example/dto/first-action.dto';
import { FirstOutputDTO } from '@app/base-system/api/_example/dto/first-output.dto';
import { PagelessExampleDto } from '@app/base-system/api/_example/dto/pageless-example.dto';
import { PagelessExampleService } from '@app/base-system/lib/bounded-contexts/pageless-example-service/application/service/pageless-example.service';

import { Public } from '@lib/infra/decorators/public.decorator';
import { ApiRes } from '@lib/infra/rest/res.response';


@ApiTags('This is example for a pageless API')
@Controller('pageless-example')
export class PagelessExampleController {
  constructor(private readonly exampleService: PagelessExampleService) {}

  @Public()
  @Post('exampleAction')
  async exampleAction(
    @Body() inputParams: PagelessExampleDto,
    @Request() request: FastifyRequest,
  ): Promise<ApiRes<FirstOutputDTO>> {
    console.log('inputParams', inputParams);
    const randomActionInput = FirstActionDTO.generateInstance();
    const result = await this.exampleService.necessaryAction(randomActionInput);
    console.log('result', result);
    return ApiRes.success(result);
  }
}
