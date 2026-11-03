import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsEnum, IsInt, IsUUID, Min, ValidateNested,
} from 'class-validator';
import { OrderStatus } from '../../common/enums';

export class OrderItemInputDto {
  @ApiProperty() @IsUUID()
  bookId: string;

  @ApiProperty({ example: 2 }) @IsInt() @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty() @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'ID alamat milik customer (disalin sebagai snapshot ke order)' })
  @IsUUID()
  addressId: string;

  @ApiProperty({ type: [OrderItemInputDto] })
  @ValidateNested({ each: true }) @Type(() => OrderItemInputDto) @ArrayMinSize(1)
  items: OrderItemInputDto[];
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
