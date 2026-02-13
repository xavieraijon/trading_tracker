import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { OperationalState } from '@prisma/client';
import { CalendarService } from './calendar.service';

interface PlanDayResult {
  date: string;
  operate: Array<{ accountId: string; accountName: string; state: OperationalState; reason: string }>;
  block: Array<{ accountId: string; accountName: string; state: OperationalState; reason: string }>;
  calendarBlocked: boolean;
}

@Injectable()
export class PlanDayService {
  private readonly MAX_ACCOUNTS_PER_DAY = 2;
  private readonly DAYS_BEFORE_PAYOUT_BLOCK = 2;

  constructor(
    private prisma: PrismaService,
    private calendarService: CalendarService,
  ) {}

  /**
   * Compute the "Plan del Día" for a user.
   *
   * Priority:
   *   1. Accounts in BREAK_EVEN
   *   2. Accounts in DRAWDOWN
   *   3. All others are blocked
   *
   * Blocks:
   *   - PROFIT / PAYOUT_REQUESTED / PAYOUT_PROCESSING → no trade
   *   - Within N days of eligible payout date → no trade
   *   - Calendar blocked day → no trade at all
   */
  async computePlan(userId: string, date?: Date): Promise<PlanDayResult> {
    const targetDate = date ?? new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    // Check calendar block
    const calendarBlocked = await this.calendarService.isDateBlocked(targetDate);

    // Get all funded account snapshots for user
    const snapshots = await this.prisma.accountStateSnapshot.findMany({
      where: {
        account: { userId, type: 'PROP_FIRM', propFirmStatus: 'FUNDED' },
      },
      include: {
        account: { select: { id: true, name: true } },
      },
    });

    const operate: PlanDayResult['operate'] = [];
    const block: PlanDayResult['block'] = [];

    if (calendarBlocked) {
      for (const s of snapshots) {
        block.push({
          accountId: s.accountId,
          accountName: s.account.name,
          state: s.operationalState,
          reason: 'Calendar blocked day',
        });
      }
      return { date: dateStr, operate, block, calendarBlocked: true };
    }

    const candidates: Array<{
      accountId: string;
      accountName: string;
      state: OperationalState;
      priority: number;
    }> = [];

    for (const s of snapshots) {
      const state = s.operationalState;

      // Block accounts in profit / payout states
      if (
        state === OperationalState.PROFIT ||
        state === OperationalState.PAYOUT_REQUESTED ||
        state === OperationalState.PAYOUT_PROCESSING
      ) {
        block.push({
          accountId: s.accountId,
          accountName: s.account.name,
          state,
          reason: `In ${state} – do not trade`,
        });
        continue;
      }

      // Block accounts in CHALLENGE
      if (state === OperationalState.CHALLENGE) {
        block.push({
          accountId: s.accountId,
          accountName: s.account.name,
          state,
          reason: 'Challenge / rest day',
        });
        continue;
      }

      // Block if close to payout eligible date
      if (
        s.daysToPayoutEligible !== null &&
        s.daysToPayoutEligible >= 0 &&
        s.daysToPayoutEligible <= this.DAYS_BEFORE_PAYOUT_BLOCK
      ) {
        block.push({
          accountId: s.accountId,
          accountName: s.account.name,
          state,
          reason: `${s.daysToPayoutEligible} day(s) to payout window – blocked`,
        });
        continue;
      }

      // Candidate: BREAK_EVEN (priority 1) or DRAWDOWN (priority 2)
      candidates.push({
        accountId: s.accountId,
        accountName: s.account.name,
        state,
        priority: state === OperationalState.BREAK_EVEN ? 1 : 2,
      });
    }

    // Sort by priority (BREAK_EVEN first)
    candidates.sort((a, b) => a.priority - b.priority);

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (i < this.MAX_ACCOUNTS_PER_DAY) {
        operate.push({
          accountId: c.accountId,
          accountName: c.accountName,
          state: c.state,
          reason: `Priority ${i + 1} – ${c.state}`,
        });
      } else {
        block.push({
          accountId: c.accountId,
          accountName: c.accountName,
          state: c.state,
          reason: 'Daily account limit reached',
        });
      }
    }

    return { date: dateStr, operate, block, calendarBlocked: false };
  }
}
