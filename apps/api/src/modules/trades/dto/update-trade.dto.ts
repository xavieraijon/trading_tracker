import { PartialType } from '@nestjs/mapped-types';
import { CreateTradeDto } from './create-trade.dto';
import { IsNumber, IsOptional, IsDateString } from 'class-validator';

export class UpdateTradeDto extends PartialType(CreateTradeDto) {
  @IsNumber()
  @IsOptional()
  exitPrice?: number;

  @IsDateString()
  @IsOptional()
  closeAt?: string;

  @IsNumber()
  @IsOptional()
  pnlGross?: number;

  @IsNumber()
  @IsOptional()
  pnlNet?: number;

  @IsNumber()
  @IsOptional()
  resultR?: number;
}
