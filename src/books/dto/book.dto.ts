import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayUnique, IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString,
  IsUUID, MaxLength, Min,
} from 'class-validator';

export class CreateBookDto {
  @ApiProperty({ example: 'Clean Code' })
  @IsString() @IsNotEmpty() @MaxLength(255)
  title: string;

  @ApiProperty({ example: '9780132350884' })
  @IsString() @IsNotEmpty() @MaxLength(45)
  isbn: string;

  @ApiPropertyOptional({ example: 2008, default: 0 })
  @IsOptional() @IsInt() @Min(0)
  publishedYear?: number;

  @ApiPropertyOptional({ default: true, description: 'Otomatis false jika stock = 0' })
  @IsOptional() @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: 150000, default: 0 })
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 25, default: 0 })
  @IsOptional() @IsInt() @Min(0)
  stock?: number;

  @ApiPropertyOptional({ description: 'ID kategori' })
  @IsOptional() @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'ID penerbit' })
  @IsOptional() @IsUUID()
  publisherId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Daftar ID penulis (many-to-many)' })
  @IsOptional() @IsArray() @ArrayUnique() @IsUUID('all', { each: true })
  authorIds?: string[];
}

export class UpdateBookDto extends PartialType(CreateBookDto) {}
