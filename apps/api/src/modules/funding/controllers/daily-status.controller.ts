import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { DailyStatusService } from '../services/daily-status.service';
import { SnapshotService } from '../services/snapshot.service';
import { DateRangeQueryDto, DailyStatusQueryDto } from '../dto/query-filters.dto';

@Controller('funding')
@UseGuards(JwtAuthGuard)
export class DailyStatusController {
  constructor(
    private dailyStatusService: DailyStatusService,
    private snapshotService: SnapshotService,
  ) {}

  /** GET /funding/accounts/:id/daily-status?from=...&to=... */
  @Get('accounts/:id/daily-status')
  async getAccountDailyStatus(
    @Param('id') accountId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    return this.dailyStatusService.findByAccountAndRange(
      accountId,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
    );
  }

  /** GET /funding/daily-status?accountIds[]=...&from=...&to=... — "Excel" matrix view */
  @Get('daily-status')
  async getDailyStatusMatrix(
    @Req() req: any,
    @Query() query: DailyStatusQueryDto,
  ) {
    let accountIds = query.accountIds;

    // If no accounts specified, get all user's funded accounts
    if (!accountIds || accountIds.length === 0) {
      const snapshots = await this.snapshotService.findAllForUser(req.user.userId);
      accountIds = snapshots.map(s => s.accountId);
      if (accountIds.length === 0) return [];
    }

    return this.dailyStatusService.getMatrix(
      accountIds,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
    );
  }
}
