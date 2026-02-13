import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CalendarService } from '../services/calendar.service';
import { CreateCalendarEventDto } from '../dto/create-calendar-event.dto';
import { DateRangeQueryDto } from '../dto/query-filters.dto';

@Controller('funding/calendar-events')
@UseGuards(JwtAuthGuard)
export class CalendarEventsController {
  constructor(private calendarService: CalendarService) {}

  /** GET /funding/calendar-events?from=...&to=... */
  @Get()
  async findAll(@Query() query: DateRangeQueryDto) {
    return this.calendarService.findAll(
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
    );
  }

  /** POST /funding/calendar-events */
  @Post()
  async create(@Body() dto: CreateCalendarEventDto) {
    return this.calendarService.create(dto);
  }

  /** DELETE /funding/calendar-events/:id */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.calendarService.remove(id);
  }
}
