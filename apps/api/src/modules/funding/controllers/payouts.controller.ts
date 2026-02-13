import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PayoutService } from '../services/payout.service';
import { CreatePayoutDto } from '../dto/create-payout.dto';
import { UpdatePayoutDto } from '../dto/update-payout.dto';
import { PayoutQueryDto } from '../dto/query-filters.dto';

@Controller('funding/payouts')
@UseGuards(JwtAuthGuard)
export class PayoutsController {
  constructor(private payoutService: PayoutService) {}

  /** GET /funding/payouts?accountId=...&status=... */
  @Get()
  async findAll(@Req() req: any, @Query() query: PayoutQueryDto) {
    return this.payoutService.findAll(req.user.id, query);
  }

  /** POST /funding/payouts */
  @Post()
  async create(@Req() req: any, @Body() dto: CreatePayoutDto) {
    return this.payoutService.create(req.user.id, dto);
  }

  /** PATCH /funding/payouts/:id */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePayoutDto) {
    return this.payoutService.update(id, dto);
  }
}
