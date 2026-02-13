import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CycleService } from './cycle.service';
import { DailyStatusService } from './daily-status.service';
import { SnapshotService } from './snapshot.service';
import { StateMachineService } from './state-machine.service';
import { OperationalState, CycleStatus } from '@prisma/client';

/**
 * Backfill service: rebuilds derived data (cycles, daily statuses, snapshots)
 * purely from the trades table — without ever modifying trades.
 */
@Injectable()
export class BackfillService {
  private readonly logger = new Logger(BackfillService.name);

  constructor(
    private prisma: PrismaService,
    private cycleService: CycleService,
    private dailyStatusService: DailyStatusService,
    private snapshotService: SnapshotService,
    private stateMachine: StateMachineService,
  ) {}

  /**
   * Full rebuild of derived data for one funded account.
   * 1. Collects all PAID payout dates to determine cycle boundaries.
   * 2. Creates/updates AccountCycle records.
   * 3. Iterates trades by day, computes PnL and state per day.
   * 4. Upserts DailyAccountStatus rows.
   * 5. Updates AccountStateSnapshot.
   *
   * @param accountId - the funded account
   * @param fromDate  - optional: only rebuild from this date forward
   */
  async rebuildAccountDerivedData(accountId: string, fromDate?: Date) {
    this.logger.log(`Rebuilding derived data for account ${accountId} from ${fromDate ?? 'beginning'}`);

    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new Error(`Account ${accountId} not found`);

    // --- 1. Determine cycle boundaries from existing PAID payouts ---
    const paidPayouts = await this.prisma.payoutRequest.findMany({
      where: { accountId, status: 'PAID' },
      orderBy: { paidAt: 'asc' },
    });

    // Build ordered list of cycle start dates.
    // First cycle starts on account.startedAt or first trade date.
    const firstTrade = await this.prisma.trade.findFirst({
      where: { accountId, closeAt: { not: null } },
      orderBy: { closeAt: 'asc' },
      select: { closeAt: true },
    });

    const initialStartDate =
      account.startedAt ?? firstTrade?.closeAt ?? new Date();

    interface CycleBoundary {
      startDate: Date;
      endDate: Date | null;
      startBalance: number;
    }

    const boundaries: CycleBoundary[] = [];
    const initialBalance = Number(account.initialBalance);

    if (paidPayouts.length === 0) {
      // Single cycle from start to now
      boundaries.push({
        startDate: initialStartDate,
        endDate: null,
        startBalance: initialBalance,
      });
    } else {
      // First cycle: from initial start to first payout
      boundaries.push({
        startDate: initialStartDate,
        endDate: paidPayouts[0].paidAt!,
        startBalance: initialBalance,
      });
      // Subsequent cycles between payouts
      for (let i = 0; i < paidPayouts.length; i++) {
        const paidDate = paidPayouts[i].paidAt!;
        const nextPaid = paidPayouts[i + 1]?.paidAt ?? null;
        boundaries.push({
          startDate: paidDate,
          endDate: nextPaid,
          startBalance: initialBalance, // post-payout reset
        });
      }
    }

    // --- 2. Upsert AccountCycle records ---
    const cycles: Array<{ id: string; startDate: Date; endDate: Date | null; startBalance: number }> = [];

    for (const b of boundaries) {
      const startDateOnly = toDateOnly(b.startDate);
      const endDateOnly = b.endDate ? toDateOnly(b.endDate) : null;

      // Check if we already have a cycle with this startDate
      let existing = await this.prisma.accountCycle.findFirst({
        where: { accountId, startDate: startDateOnly },
      });

      if (!existing) {
        existing = await this.prisma.accountCycle.create({
          data: {
            accountId,
            startDate: startDateOnly,
            endDate: endDateOnly,
            cycleStartBalance: b.startBalance,
            status: b.endDate ? CycleStatus.CLOSED : CycleStatus.ACTIVE,
          },
        });
      } else {
        existing = await this.prisma.accountCycle.update({
          where: { id: existing.id },
          data: {
            endDate: endDateOnly,
            status: b.endDate ? CycleStatus.CLOSED : CycleStatus.ACTIVE,
          },
        });
      }

      cycles.push({
        id: existing.id,
        startDate: startDateOnly,
        endDate: endDateOnly,
        startBalance: b.startBalance,
      });
    }

    // --- 3. Fetch closed trades for this account, optionally from a date ---
    const trades = await this.prisma.trade.findMany({
      where: {
        accountId,
        closeAt: { not: null, ...(fromDate ? { gte: fromDate } : {}) },
      },
      orderBy: { closeAt: 'asc' },
    });

    // --- 4. Group trades by day and compute daily PnL ---
    const dailyMap = new Map<string, { pnl: number; count: number; date: Date }>();

    for (const trade of trades) {
      const dayKey = trade.closeAt!.toISOString().split('T')[0];
      const entry = dailyMap.get(dayKey) ?? { pnl: 0, count: 0, date: toDateOnly(trade.closeAt!) };
      entry.pnl += Number(trade.pnlNet);
      entry.count += 1;
      dailyMap.set(dayKey, entry);
    }

    // --- 5. Iterate days, assign to cycles, compute state, upsert DailyAccountStatus ---
    const sortedDays = Array.from(dailyMap.entries()).sort(
      ([a], [b]) => a.localeCompare(b),
    );

    // Running balance per cycle (keyed by cycle id)
    const cycleRunningPnl = new Map<string, number>();
    for (const c of cycles) {
      cycleRunningPnl.set(c.id, 0);
    }

    // If rebuilding from a date, we need the previous cumulative PnL
    // for the cycle that contains fromDate.
    if (fromDate) {
      for (const c of cycles) {
        const previousStatuses = await this.prisma.dailyAccountStatus.findMany({
          where: { cycleId: c.id, date: { lt: fromDate } },
          orderBy: { date: 'desc' },
          take: 1,
        });
        if (previousStatuses.length > 0) {
          const lastBal = Number(previousStatuses[0].balanceEod);
          cycleRunningPnl.set(c.id, lastBal - c.startBalance);
        }
      }
    }

    let lastState: OperationalState = OperationalState.BREAK_EVEN;
    let lastBalance = 0;
    let lastCycleId: string | null = null;
    let lastCycleStartBalance = 0;

    for (const [, dayData] of sortedDays) {
      // Find which cycle this day belongs to
      const cycle = cycles.find(
        (c) => dayData.date >= c.startDate && (c.endDate === null || dayData.date <= c.endDate),
      );
      if (!cycle) continue;

      const runningPnl = (cycleRunningPnl.get(cycle.id) ?? 0) + dayData.pnl;
      cycleRunningPnl.set(cycle.id, runningPnl);

      const balanceEod = cycle.startBalance + runningPnl;

      // Determine target pct from the cycle record
      const cycleRecord = await this.prisma.accountCycle.findUnique({
        where: { id: cycle.id },
        select: { profitTargetPct: true },
      });
      const profitTargetPct = Number(cycleRecord?.profitTargetPct ?? 2);

      const state = this.stateMachine.deriveStateFromPnl({
        pnlCycle: runningPnl,
        cycleStartBalance: cycle.startBalance,
        profitTargetPct,
      });

      await this.dailyStatusService.upsertDailyStatus({
        accountId,
        cycleId: cycle.id,
        date: dayData.date,
        operationalState: state,
        balanceEod,
        pnlDay: dayData.pnl,
        tradesCount: dayData.count,
      });

      lastState = state;
      lastBalance = balanceEod;
      lastCycleId = cycle.id;
      lastCycleStartBalance = cycle.startBalance;
    }

    // --- 6. Update AccountStateSnapshot ---
    // If no trades were processed, derive from existing data
    if (sortedDays.length === 0) {
      const activeCycle = cycles.find((c) => c.endDate === null) ?? cycles[cycles.length - 1];
      if (activeCycle) {
        lastCycleId = activeCycle.id;
        lastCycleStartBalance = activeCycle.startBalance;
        lastBalance = activeCycle.startBalance;
        lastState = OperationalState.BREAK_EVEN;
      }
    }

    if (lastCycleId) {
      await this.snapshotService.upsertSnapshot({
        accountId,
        currentCycleId: lastCycleId,
        operationalState: lastState,
        balance: lastBalance,
        cycleStartBalance: lastCycleStartBalance,
      });
    }

    this.logger.log(`Rebuild complete for account ${accountId}: ${sortedDays.length} days processed`);
    return { daysProcessed: sortedDays.length, cycles: cycles.length };
  }

  /**
   * Called after trades are imported for an account.
   * Only rebuilds the affected date range for efficiency.
   */
  async onTradesImported(accountId: string, fromDate: Date, toDate: Date) {
    this.logger.log(
      `onTradesImported: ${accountId} range ${fromDate.toISOString()} – ${toDate.toISOString()}`,
    );
    return this.rebuildAccountDerivedData(accountId, fromDate);
  }
}

/** Strip time part and return a Date at midnight UTC. */
function toDateOnly(d: Date): Date {
  const iso = d.toISOString().split('T')[0];
  return new Date(iso + 'T00:00:00.000Z');
}
