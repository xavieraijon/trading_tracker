import { IsEnum, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';
import { PayoutRequestStatus } from '@prisma/client';

export class UpdatePayoutDto {
  @IsEnum(PayoutRequestStatus)
  status: PayoutRequestStatus;

  @IsDateString()
  @IsOptional()
  paidAt?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;
}
