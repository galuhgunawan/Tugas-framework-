import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePublisherDto {
  @ApiProperty({ example: 'Informatika Bandung' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;
}

export class UpdatePublisherDto extends PartialType(CreatePublisherDto) {}
