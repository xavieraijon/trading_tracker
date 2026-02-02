import { IsString, IsNotEmpty, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import { AccountType, MarketType } from '@prisma/client';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  initialBalance: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsEnum(AccountType)
  @IsOptional()
  type?: AccountType;

  @IsEnum(MarketType)
  @IsOptional()
  market?: MarketType;
}
