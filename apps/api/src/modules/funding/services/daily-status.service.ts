import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { OperationalState } from '@prisma/client';

@Injectable()
export class DailyStatusService {
  constructor(private prisma: PrismaService) {}

  /**
   * Upsert the daily status for an account on a specific date.
   * Enforces: one status per (accountId, date).
   */
  async upsertDailyStatus(data: {
    accountId: string;
    cycleId: string;
    date: Date;
    operationalState: OperationalState;
    balanceEod: number;
    pnlDay: number;
    tradesCount: number;
    tags?: string[];
  }) {
    return this.prisma.dailyAccountStatus.upsert({
      where: {
        accountId_date: {
          accountId: data.accountId,
          date: data.date,
        },
      },
      create: {
        accountId: data.accountId,
        cycleId: data.cycleId,
        date: data.date,
        operationalState: data.operationalState,
        balanceEod: data.balanceEod,
        pnlDay: data.pnlDay,
        tradesCount: data.tradesCount,
        tags: data.tags ?? [],
      },
      update: {
        cycleId: data.cycleId,
        operationalState: data.operationalState,
        balanceEod: data.balanceEod,
        pnlDay: data.pnlDay,
        tradesCount: data.tradesCount,
        tags: data.tags ?? [],
      },
    });
  }

  /** Get daily statuses for a single account within a date range. */
  async findByAccountAndRange(accountId: string, from?: Date, to?: Date) {
    return this.prisma.dailyAccountStatus.findMany({
      where: {
        accountId,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Get the "Excel matrix" view: daily statuses for multiple accounts
   * within a date range.
   */
  async getMatrix(accountIds: string[], from?: Date, to?: Date) {
    return this.prisma.dailyAccountStatus.findMany({
      where: {
        accountId: { in: accountIds },
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      include: {
        account: { select: { name: true } },
      },
      orderBy: [{ accountId: 'asc' }, { date: 'asc' }],
    });
  }
}
