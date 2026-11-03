import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString() @IsNotEmpty() @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'budi@mail.com' })
  @IsEmail() @MaxLength(150)
  email: string;

  @ApiProperty({ example: '081234567890' })
  @IsString() @IsNotEmpty() @MaxLength(20)
  phone: string;
}
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

export class CreateAddressDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString() @IsNotEmpty() @MaxLength(150)
  recipientName: string;

  @ApiProperty({ example: '081234567890' })
  @IsString() @IsNotEmpty() @MaxLength(20)
  phone: string;

  @ApiProperty({ example: 'Jl. Merdeka No. 10' })
  @IsString() @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Pekalongan' })
  @IsString() @IsNotEmpty() @MaxLength(100)
  city: string;

  @ApiProperty({ example: '51111' })
  @IsString() @IsNotEmpty() @MaxLength(10)
  postalCode: string;
}
export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
