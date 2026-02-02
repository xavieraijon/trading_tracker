import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, IsEnum } from 'class-validator';

export enum TradeSide {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

export class CreateTradeDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsNotEmpty()
  instrument: string;

  @IsEnum(TradeSide)
  side: TradeSide;

  @IsDateString()
  openAt: string;

  @IsNumber()
  @IsOptional()
  entryPrice?: number;

  @IsNumber()
  quantity: number;

  @IsNumber()
  @IsOptional()
  fees?: number;

  @IsNumber()
  @IsOptional()
  riskAmount?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
