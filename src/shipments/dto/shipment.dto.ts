import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ShipmentStatus } from '../../common/enums';

export class CreateShipmentDto {
  @ApiProperty() @IsUUID()
  orderId: string;

  @ApiProperty({ example: 'JNE' })
  @IsString() @IsNotEmpty() @MaxLength(100)
  courier: string;

  @ApiPropertyOptional({ example: 'JNE1234567890' })
  @IsOptional() @IsString() @MaxLength(100)
  trackingNumber?: string;
}

export class UpdateShipmentStatusDto {
  @ApiProperty({ enum: ShipmentStatus })
  @IsEnum(ShipmentStatus)
  status: ShipmentStatus;

  @ApiPropertyOptional({ description: 'Nomor resi (opsional, bisa diisi saat status shipped)' })
  @IsOptional() @IsString() @MaxLength(100)
  trackingNumber?: string;
}
