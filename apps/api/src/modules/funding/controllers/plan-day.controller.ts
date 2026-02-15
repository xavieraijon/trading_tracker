import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PlanDayService } from '../services/plan-day.service';
import { PlanDayQueryDto } from '../dto/query-filters.dto';

@Controller('funding')
@UseGuards(JwtAuthGuard)
export class PlanDayController {
  constructor(private planDayService: PlanDayService) {}

  /** GET /funding/plan-day?date=2026-02-13 */
  @Get('plan-day')
  async getPlanDay(@Req() req: any, @Query() query: PlanDayQueryDto) {
    const date = query.date ? new Date(query.date) : undefined;
    return this.planDayService.computePlan(req.user.userId, date);
  }
}
