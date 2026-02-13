import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { OperationalState } from '@prisma/client';

@Injectable()
export class SnapshotService {
  constructor(private prisma: PrismaService) {}

  /** Update or create the snapshot for an account. */
  async upsertSnapshot(data: {
    accountId: string;
    currentCycleId: string | null;
    operationalState: OperationalState;
    balance: number;
    cycleStartBalance: number;
    daysToPayoutEligible?: number | null;
  }) {
    const drawdownPct =
      data.balance < data.cycleStartBalance
        ? ((data.cycleStartBalance - data.balance) / data.cycleStartBalance) * 100
        : 0;

    const profitPct =
      data.balance > data.cycleStartBalance
        ? ((data.balance - data.cycleStartBalance) / data.cycleStartBalance) * 100
        : 0;

    return this.prisma.accountStateSnapshot.upsert({
      where: { accountId: data.accountId },
      create: {
        accountId: data.accountId,
        currentCycleId: data.currentCycleId,
        operationalState: data.operationalState,
        balance: data.balance,
        cycleStartBalance: data.cycleStartBalance,
        drawdownPct,
        profitPct,
        daysToPayoutEligible: data.daysToPayoutEligible ?? null,
      },
      update: {
        currentCycleId: data.currentCycleId,
        operationalState: data.operationalState,
        balance: data.balance,
        cycleStartBalance: data.cycleStartBalance,
        drawdownPct,
        profitPct,
        daysToPayoutEligible: data.daysToPayoutEligible ?? null,
      },
    });
  }

  /** Get the snapshot for one account. */
  async findByAccount(accountId: string) {
    return this.prisma.accountStateSnapshot.findUnique({
      where: { accountId },
    });
  }

  /** Get all funded-account snapshots for a user. */
  async findAllForUser(userId: string) {
    return this.prisma.accountStateSnapshot.findMany({
      where: {
        account: { userId, type: 'PROP_FIRM', propFirmStatus: 'FUNDED' },
      },
      include: {
        account: { select: { id: true, name: true, broker: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
