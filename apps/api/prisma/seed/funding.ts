import {
  PrismaClient,
  OperationalState,
  CycleStatus,
  PayoutRequestStatus,
  AccountType,
  Account,
  Trade,
} from '@prisma/client';

type AccountWithTrades = Account & { trades: Trade[] };

/**
 * Generate all funding-derived data (cycles, daily statuses, snapshots, payouts)
 * for PROP_FIRM accounts. This mirrors BackfillService but runs inside the seed
 * with direct Prisma access — no API needed.
 */
export async function seedFundingData(prisma: PrismaClient): Promise<void> {
  const propAccounts: AccountWithTrades[] = await prisma.account.findMany({
    where: { type: AccountType.PROP_FIRM, deletedAt: null },
    include: { trades: { where: { closeAt: { not: null } }, orderBy: { closeAt: 'asc' } } },
  });

  console.log(`  Generating funding data for ${propAccounts.length} prop firm accounts...`);

  for (const account of propAccounts) {
    const initialBalance = Number(account.initialBalance);
    const profitTarget = account.profitTarget ? Number(account.profitTarget) : initialBalance * 0.02;
    const profitTargetPct = (profitTarget / initialBalance) * 100;
    const scenario = detectScenario(account.name);

    if (account.trades.length === 0) {
      console.log(`    ${account.name}: no closed trades, skipping.`);
      continue;
    }

    if (scenario === 'funded_profit') {
      await seedFundedProfitAccount(prisma, account, initialBalance, profitTargetPct);
    } else if (scenario === 'funded_payout_requested') {
      await seedFundedPayoutRequestedAccount(prisma, account, initialBalance, profitTargetPct);
    } else if (scenario === 'funded_drawdown') {
      await seedFundedDrawdownAccount(prisma, account, initialBalance, profitTargetPct);
    } else {
      await seedSingleCycleAccount(prisma, account, initialBalance, profitTargetPct);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Scenario: funded_profit (FTMO 200k) — 1 CLOSED + 1 ACTIVE cycle   */
/* ------------------------------------------------------------------ */

async function seedFundedProfitAccount(
  prisma: PrismaClient,
  account: AccountWithTrades,
  initialBalance: number,
  profitTargetPct: number,
): Promise<void> {
  const trades = account.trades;
  const splitIdx = Math.floor(trades.length * 0.45);
  const firstCycleTrades = trades.slice(0, splitIdx);
  const secondCycleTrades = trades.slice(splitIdx);

  if (firstCycleTrades.length === 0 || secondCycleTrades.length === 0) {
    await seedSingleCycleAccount(prisma, account, initialBalance, profitTargetPct);
    return;
  }

  const firstStart = toDateOnly(firstCycleTrades[0].closeAt!);
  const payoutDate = toDateOnly(secondCycleTrades[0].closeAt!);

  // --- Cycle 1: CLOSED ---
  const cycle1 = await prisma.accountCycle.create({
    data: {
      accountId: account.id,
      startDate: firstStart,
      endDate: payoutDate,
      cycleStartBalance: initialBalance,
      profitTargetPct,
      status: CycleStatus.CLOSED,
    },
  });

  const cycle1Result = await createDailyStatuses(prisma, account.id, cycle1.id, firstCycleTrades, initialBalance, profitTargetPct);

  // Payout for cycle 1 — PAID
  const payoutAmount = Math.max(cycle1Result.cumulativePnl * 0.8, 0);
  await prisma.payoutRequest.create({
    data: {
      accountId: account.id,
      cycleId: cycle1.id,
      eligibleDate: payoutDate,
      paidAt: addDays(payoutDate, 5),
      amount: round2(payoutAmount),
      status: PayoutRequestStatus.PAID,
    },
  });

  // --- Cycle 2: ACTIVE ---
  const cycle2 = await prisma.accountCycle.create({
    data: {
      accountId: account.id,
      startDate: payoutDate,
      endDate: null,
      cycleStartBalance: initialBalance,
      profitTargetPct,
      status: CycleStatus.ACTIVE,
    },
  });

  const cycle2Result = await createDailyStatuses(prisma, account.id, cycle2.id, secondCycleTrades, initialBalance, profitTargetPct);

  await upsertSnapshot(prisma, account.id, cycle2.id, cycle2Result.lastState, cycle2Result.lastBalance, initialBalance);

  console.log(`    ${account.name}: 2 cycles, 1 PAID payout ($${payoutAmount.toFixed(0)}), current: ${cycle2Result.lastState}`);
}

/* ------------------------------------------------------------------ */
/*  Scenario: funded_payout_requested (TopStep 150k)                   */
/* ------------------------------------------------------------------ */

async function seedFundedPayoutRequestedAccount(
  prisma: PrismaClient,
  account: AccountWithTrades,
  initialBalance: number,
  profitTargetPct: number,
): Promise<void> {
  const trades = account.trades;
  const startDate = toDateOnly(trades[0].closeAt!);

  const cycle = await prisma.accountCycle.create({
    data: {
      accountId: account.id,
      startDate,
      endDate: null,
      cycleStartBalance: initialBalance,
      profitTargetPct,
      status: CycleStatus.ACTIVE,
    },
  });

  const result = await createDailyStatuses(prisma, account.id, cycle.id, trades, initialBalance, profitTargetPct);

  const lastDate = toDateOnly(trades[trades.length - 1].closeAt!);
  await prisma.payoutRequest.create({
    data: {
      accountId: account.id,
      cycleId: cycle.id,
      eligibleDate: addDays(lastDate, 14),
      amount: round2(Math.max(result.cumulativePnl * 0.8, 0)),
      status: PayoutRequestStatus.REQUESTED,
    },
  });

  await upsertSnapshot(prisma, account.id, cycle.id, OperationalState.PAYOUT_REQUESTED, result.lastBalance, initialBalance);

  console.log(`    ${account.name}: 1 cycle, PAYOUT_REQUESTED, balance: $${result.lastBalance.toFixed(0)}`);
}

/* ------------------------------------------------------------------ */
/*  Scenario: funded_drawdown (TFT 50k)                                */
/* ------------------------------------------------------------------ */

async function seedFundedDrawdownAccount(
  prisma: PrismaClient,
  account: AccountWithTrades,
  initialBalance: number,
  profitTargetPct: number,
): Promise<void> {
  // A drawdown account cannot have a payout — just create the single cycle
  await seedSingleCycleAccount(prisma, account, initialBalance, profitTargetPct);
}

/* ------------------------------------------------------------------ */
/*  Generic: single cycle account (challenges + fallback)              */
/* ------------------------------------------------------------------ */

async function seedSingleCycleAccount(
  prisma: PrismaClient,
  account: AccountWithTrades,
  initialBalance: number,
  profitTargetPct: number,
): Promise<{ cycleId: string; lastState: OperationalState; lastBalance: number; cumulativePnl: number } | null> {
  const trades = account.trades;
  if (trades.length === 0) return null;

  const startDate = toDateOnly(trades[0].closeAt!);

  const cycle = await prisma.accountCycle.create({
    data: {
      accountId: account.id,
      startDate,
      endDate: null,
      cycleStartBalance: initialBalance,
      profitTargetPct,
      status: CycleStatus.ACTIVE,
    },
  });

  const result = await createDailyStatuses(prisma, account.id, cycle.id, trades, initialBalance, profitTargetPct);

  await upsertSnapshot(prisma, account.id, cycle.id, result.lastState, result.lastBalance, initialBalance);

  console.log(`    ${account.name}: 1 cycle, state: ${result.lastState}, balance: $${result.lastBalance.toFixed(0)}`);

  return { cycleId: cycle.id, ...result };
}

/* ------------------------------------------------------------------ */
/*  Create daily statuses from trades                                  */
/* ------------------------------------------------------------------ */

interface DailyResult {
  lastState: OperationalState;
  lastBalance: number;
  cumulativePnl: number;
}

async function createDailyStatuses(
  prisma: PrismaClient,
  accountId: string,
  cycleId: string,
  trades: Trade[],
  cycleStartBalance: number,
  profitTargetPct: number,
): Promise<DailyResult> {
  const dailyMap = new Map<string, { pnl: number; count: number; date: Date }>();

  for (const trade of trades) {
    if (!trade.closeAt) continue;
    const dayKey = trade.closeAt.toISOString().split('T')[0];
    const entry = dailyMap.get(dayKey) ?? { pnl: 0, count: 0, date: toDateOnly(trade.closeAt) };
    entry.pnl += Number(trade.pnlNet);
    entry.count += 1;
    dailyMap.set(dayKey, entry);
  }

  const sortedDays = Array.from(dailyMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  let cumulativePnl = 0;
  let lastState: OperationalState = OperationalState.BREAK_EVEN;
  let lastBalance = cycleStartBalance;

  for (const [, dayData] of sortedDays) {
    cumulativePnl += dayData.pnl;
    lastBalance = cycleStartBalance + cumulativePnl;

    lastState = deriveState(cumulativePnl, cycleStartBalance, profitTargetPct);

    await prisma.dailyAccountStatus.upsert({
      where: { accountId_date: { accountId, date: dayData.date } },
      update: {
        cycleId,
        operationalState: lastState,
        balanceEod: round2(lastBalance),
        pnlDay: round2(dayData.pnl),
        tradesCount: dayData.count,
      },
      create: {
        accountId,
        cycleId,
        date: dayData.date,
        operationalState: lastState,
        balanceEod: round2(lastBalance),
        pnlDay: round2(dayData.pnl),
        tradesCount: dayData.count,
        tags: [],
      },
    });
  }

  return { lastState, lastBalance, cumulativePnl };
}

/* ------------------------------------------------------------------ */
/*  Snapshot upsert                                                    */
/* ------------------------------------------------------------------ */

async function upsertSnapshot(
  prisma: PrismaClient,
  accountId: string,
  cycleId: string,
  state: OperationalState,
  balance: number,
  cycleStartBalance: number,
): Promise<void> {
  const drawdownPct = balance < cycleStartBalance
    ? round4(((cycleStartBalance - balance) / cycleStartBalance) * 100)
    : 0;
  const profitPct = balance > cycleStartBalance
    ? round4(((balance - cycleStartBalance) / cycleStartBalance) * 100)
    : 0;

  const daysToPayoutEligible =
    state === OperationalState.PROFIT ? 0
    : state === OperationalState.BREAK_EVEN ? 14
    : null;

  await prisma.accountStateSnapshot.upsert({
    where: { accountId },
    update: {
      currentCycleId: cycleId,
      operationalState: state,
      balance: round2(balance),
      cycleStartBalance: round2(cycleStartBalance),
      drawdownPct,
      profitPct,
      daysToPayoutEligible,
    },
    create: {
      accountId,
      currentCycleId: cycleId,
      operationalState: state,
      balance: round2(balance),
      cycleStartBalance: round2(cycleStartBalance),
      drawdownPct,
      profitPct,
      daysToPayoutEligible,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  State machine (mirrors StateMachineService.deriveStateFromPnl)     */
/* ------------------------------------------------------------------ */

function deriveState(pnlCycle: number, cycleStartBalance: number, profitTargetPct: number): OperationalState {
  const profitPct = (pnlCycle / cycleStartBalance) * 100;
  if (profitPct >= profitTargetPct) return OperationalState.PROFIT;
  if (pnlCycle < 0) return OperationalState.DRAWDOWN;
  return OperationalState.BREAK_EVEN;
}

/* ------------------------------------------------------------------ */
/*  Scenario detection from account name                               */
/* ------------------------------------------------------------------ */

function detectScenario(name: string): string {
  if (name.includes('200k')) return 'funded_profit';
  if (name.includes('TopStep')) return 'funded_payout_requested';
  if (name.includes('TFT')) return 'funded_drawdown';
  if (name.includes('Phase') || name.includes('Challenge')) return 'challenge';
  return 'default';
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toDateOnly(d: Date): Date {
  const iso = d.toISOString().split('T')[0];
  return new Date(iso + 'T00:00:00.000Z');
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
