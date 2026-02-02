import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

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
}
