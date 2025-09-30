import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNotEmpty, IsString } from 'class-validator';

export class PagelessExampleDto {
  @ApiProperty({description: 'Optional String'})
  @IsOptional()
  @IsString({message: 'This parameter must be a string'})
  @IsNotEmpty({message: 'This parameter cannot be empty'})
  optionalString?: string;

  @ApiProperty({description: 'Compulsory String'})
  @IsString({message: 'This parameter must be a string'})
  @IsNotEmpty({message: 'This parameter cannot be empty'})
  compulsoryString?: string;
}
