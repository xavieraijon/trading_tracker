import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CycleStatus } from '@prisma/client';

@Injectable()
export class CycleService {
  constructor(private prisma: PrismaService) {}

  /** Get all cycles for an account (most recent first). */
  async findByAccount(accountId: string) {
    return this.prisma.accountCycle.findMany({
      where: { accountId },
      orderBy: { startDate: 'desc' },
    });
  }

  /** Get the currently active cycle for an account. */
  async getActiveCycle(accountId: string) {
    return this.prisma.accountCycle.findFirst({
      where: { accountId, status: CycleStatus.ACTIVE },
      orderBy: { startDate: 'desc' },
    });
  }

  /** Create a new cycle (used after payout or initial setup). */
  async createCycle(data: {
    accountId: string;
    startDate: Date;
    cycleStartBalance: number;
    profitTargetPct?: number;
  }) {
    return this.prisma.accountCycle.create({
      data: {
        accountId: data.accountId,
        startDate: data.startDate,
        cycleStartBalance: data.cycleStartBalance,
        profitTargetPct: data.profitTargetPct ?? 2,
        status: CycleStatus.ACTIVE,
      },
    });
  }

  /** Close a cycle (set endDate and status CLOSED). */
  async closeCycle(cycleId: string, endDate: Date) {
    const cycle = await this.prisma.accountCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw new NotFoundException('Cycle not found');

    return this.prisma.accountCycle.update({
      where: { id: cycleId },
      data: { endDate, status: CycleStatus.CLOSED },
    });
  }
}
