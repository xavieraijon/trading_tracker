import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { BackfillService } from '../services/backfill.service';
import { RebuildDerivedDto } from '../dto/rebuild-derived.dto';

@Controller('funding')
@UseGuards(JwtAuthGuard)
export class RebuildController {
  constructor(private backfillService: BackfillService) {}

  /** POST /funding/rebuild — trigger full or partial rebuild */
  @Post('rebuild')
  async rebuild(@Body() dto: RebuildDerivedDto) {
    const fromDate = dto.fromDate ? new Date(dto.fromDate) : undefined;
    return this.backfillService.rebuildAccountDerivedData(dto.accountId, fromDate);
  }

  /** POST /funding/on-trades-imported — called after trade import */
  @Post('on-trades-imported')
  async onTradesImported(
    @Body() body: { accountId: string; fromDate: string; toDate: string },
  ) {
    return this.backfillService.onTradesImported(
      body.accountId,
      new Date(body.fromDate),
      new Date(body.toDate),
    );
  }
}
