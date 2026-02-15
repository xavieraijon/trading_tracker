import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { AccountStatus } from '@prisma/client';
import { CreateAccountDto } from './create-account.dto';

export class UpdateAccountDto extends PartialType(CreateAccountDto) {
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;
}
