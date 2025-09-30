import { Injectable } from '@nestjs/common';

import { FirstActionDTO } from '@app/base-system/api/_example/dto/first-action.dto';
import { FirstOutputDTO } from '@app/base-system/api/_example/dto/first-output.dto';

@Injectable()
export class PagelessExampleService {
  constructor() {}

  async necessaryAction(dto: FirstActionDTO): Promise<FirstOutputDTO> {
    console.log(dto);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return FirstOutputDTO.generateInstance();
  }
}
