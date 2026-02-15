import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { SnapshotService } from '../services/snapshot.service';
import { PayoutRequestStatus, OperationalState } from '@prisma/client';

/**
 * Daily check on pending payout requests.
 * Transitions REQUESTED → PROCESSING when today >= eligibleDate.
 */
@Injectable()
export class PayoutWatcherJob {
  private readonly logger = new Logger(PayoutWatcherJob.name);

  constructor(
    private prisma: PrismaService,
    private snapshotService: SnapshotService,
  ) {}

  /** Runs every day at 08:00 UTC. */
  @Cron('0 8 * * *', { name: 'payout-watcher' })
  async handlePayoutWatch() {
    this.logger.log('Running payout-watcher job...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all REQUESTED payouts where eligibleDate <= today
    const eligiblePayouts = await this.prisma.payoutRequest.findMany({
      where: {
        status: PayoutRequestStatus.REQUESTED,
        eligibleDate: { lte: today },
      },
      include: { account: { select: { name: true } } },
    });

    for (const payout of eligiblePayouts) {
      try {
        // Update payout status
        await this.prisma.payoutRequest.update({
          where: { id: payout.id },
          data: { status: PayoutRequestStatus.PROCESSING },
        });

        // Update snapshot via service (recalculates drawdownPct, profitPct)
        const snapshot = await this.snapshotService.findByAccount(payout.accountId);
        if (snapshot) {
          await this.snapshotService.upsertSnapshot({
            accountId: payout.accountId,
            currentCycleId: snapshot.currentCycleId,
            operationalState: OperationalState.PAYOUT_PROCESSING,
            balance: Number(snapshot.balance),
            cycleStartBalance: Number(snapshot.cycleStartBalance),
            daysToPayoutEligible: snapshot.daysToPayoutEligible,
          });
        }

        this.logger.log(
          `Payout ${payout.id} for ${payout.account.name} moved to PROCESSING`,
        );
      } catch (error) {
        this.logger.error(`Failed to update payout ${payout.id}: ${error.message}`);
      }
    }

    this.logger.log(
      `Payout-watcher finished. ${eligiblePayouts.length} payouts transitioned.`,
    );
  }
}
