import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class RebuildDerivedDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsDateString()
  @IsOptional()
  fromDate?: string;
}
