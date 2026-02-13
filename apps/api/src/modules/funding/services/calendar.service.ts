import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCalendarEventDto } from '../dto/create-calendar-event.dto';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async findAll(from?: Date, to?: Date) {
    return this.prisma.calendarEvent.findMany({
      where: {
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'asc' },
    });
  }

  async create(dto: CreateCalendarEventDto) {
    return this.prisma.calendarEvent.create({
      data: {
        date: new Date(dto.date),
        type: dto.type,
        label: dto.label,
        blocksTrading: dto.blocksTrading ?? true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.calendarEvent.delete({ where: { id } });
  }

  /** Check if a given date is blocked by any calendar event. */
  async isDateBlocked(date: Date): Promise<boolean> {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { date, blocksTrading: true },
    });
    return !!event;
  }
}
