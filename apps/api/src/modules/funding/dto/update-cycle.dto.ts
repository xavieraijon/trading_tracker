import { IsNumber, Min, Max } from 'class-validator';

export class UpdateCycleDto {
  @IsNumber()
  @Min(0.1)
  @Max(100)
  profitTargetPct: number;
}
