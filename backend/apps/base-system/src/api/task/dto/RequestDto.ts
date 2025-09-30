import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { MaxLength, MinLength } from 'class-validator';

export class RequestDto {
  @ApiProperty({required: false})
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @MaxLength(500)
  @Optional()
  description: string;

  @Optional()
  priority?: 'low' | 'medium' | 'high';

  @Optional()
  dueDate?: string;

}
