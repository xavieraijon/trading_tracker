import { IsDateString, IsEnum, IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { CalendarEventType } from '@prisma/client';

export class CreateCalendarEventDto {
  @IsDateString()
  date: string;

  @IsEnum(CalendarEventType)
  type: CalendarEventType;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsBoolean()
  @IsOptional()
  blocksTrading?: boolean;
}
