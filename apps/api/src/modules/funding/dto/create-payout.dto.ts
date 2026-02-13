import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreatePayoutDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsNotEmpty()
  cycleId: string;

  @IsDateString()
  eligibleDate: string;
}
