import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { PayoutRequestStatus } from '@prisma/client';

/**
 * Daily check on pending payout requests.
 * Transitions REQUESTED → PROCESSING when today >= eligibleDate.
 */
@Injectable()
export class PayoutWatcherJob {
  private readonly logger = new Logger(PayoutWatcherJob.name);

  constructor(private prisma: PrismaService) {}

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
        await this.prisma.payoutRequest.update({
          where: { id: payout.id },
          data: { status: PayoutRequestStatus.PROCESSING },
        });
        this.logger.log(
          `Payout ${payout.id} for ${payout.account.name} moved to PROCESSING`,
        );
      } catch (error) {
        this.logger.error(`Failed to update payout ${payout.id}: ${error.message}`);
      }
    }

    // Also update snapshots for these accounts
    for (const payout of eligiblePayouts) {
      await this.prisma.accountStateSnapshot.updateMany({
        where: { accountId: payout.accountId },
        data: { operationalState: 'PAYOUT_PROCESSING' },
      });
    }

    this.logger.log(
      `Payout-watcher finished. ${eligiblePayouts.length} payouts transitioned.`,
    );
  }
}
