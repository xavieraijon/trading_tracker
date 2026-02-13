import { IsOptional, IsDateString, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class DateRangeQueryDto {
  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;
}

export class DailyStatusQueryDto extends DateRangeQueryDto {
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsString({ each: true })
  accountIds?: string[];
}

export class PayoutQueryDto {
  @IsString()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

export class PlanDayQueryDto {
  @IsDateString()
  @IsOptional()
  date?: string;
}
