import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { BackfillService } from '../services/backfill.service';

/**
 * Runs daily after market close to refresh derived data
 * for all funded accounts with active cycles.
 */
@Injectable()
export class DayCloseJob {
  private readonly logger = new Logger(DayCloseJob.name);

  constructor(
    private prisma: PrismaService,
    private backfillService: BackfillService,
  ) {}

  /** Runs every weekday at 23:00 UTC (post-market). */
  @Cron('0 23 * * 1-5', { name: 'day-close' })
  async handleDayClose() {
    this.logger.log('Running day-close job...');

    const fundedAccounts = await this.prisma.account.findMany({
      where: {
        type: 'PROP_FIRM',
        status: 'ACTIVE',
      },
      select: { id: true, name: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const account of fundedAccounts) {
      try {
        await this.backfillService.rebuildAccountDerivedData(account.id, today);
        this.logger.log(`Day-close completed for ${account.name} (${account.id})`);
      } catch (error) {
        this.logger.error(`Day-close failed for ${account.name}: ${error.message}`);
      }
    }

    this.logger.log(`Day-close job finished. Processed ${fundedAccounts.length} accounts.`);
  }
}
