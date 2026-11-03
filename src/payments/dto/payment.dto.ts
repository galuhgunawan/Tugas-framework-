import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaymentStatus } from '../../common/enums';

export class CreatePaymentDto {
  @ApiProperty() @IsUUID()
  orderId: string;

  @ApiProperty({ example: 'bank_transfer' })
  @IsString() @IsNotEmpty() @MaxLength(50)
  paymentMethod: string;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;
}
