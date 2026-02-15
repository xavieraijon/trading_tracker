import { Controller, Get, Patch, Param, Query, Body, UseGuards, Req, Header } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CycleService } from '../services/cycle.service';
import { SnapshotService } from '../services/snapshot.service';
import { DateRangeQueryDto } from '../dto/query-filters.dto';
import { UpdateCycleDto } from '../dto/update-cycle.dto';

@Controller('funding')
@UseGuards(JwtAuthGuard)
export class FundingCyclesController {
  constructor(
    private cycleService: CycleService,
    private snapshotService: SnapshotService,
  ) {}

  /** GET /funding/cycles?accountId=... */
  @Get('cycles')
  async getCycles(@Req() req: any, @Query('accountId') accountId?: string) {
    if (accountId) {
      return this.cycleService.findByAccount(accountId);
    }
    // Return all cycles for user's funded accounts
    return []; // Extended in future if needed
  }

  /** GET /funding/accounts/:id/cycles */
  @Get('accounts/:id/cycles')
  async getAccountCycles(@Param('id') accountId: string) {
    return this.cycleService.findByAccount(accountId);
  }

  /** GET /funding/accounts/:id/snapshot */
  @Get('accounts/:id/snapshot')
  async getAccountSnapshot(@Param('id') accountId: string) {
    return this.snapshotService.findByAccount(accountId);
  }

  /** GET /funding/snapshots — all funded account snapshots for the user */
  @Get('snapshots')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  async getAllSnapshots(@Req() req: any) {
    return this.snapshotService.findAllForUser(req.user.userId);
  }

  /** PATCH /funding/cycles/:id — update active cycle configuration */
  @Patch('cycles/:id')
  async updateCycle(@Param('id') cycleId: string, @Body() dto: UpdateCycleDto) {
    return this.cycleService.updateProfitTarget(cycleId, dto.profitTargetPct);
  }
}
