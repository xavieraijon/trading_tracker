import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { getAccountDefinitions, type AccountSeed } from './seed/accounts';
import { generateTrades } from './seed/trades';
import { getCalendarEvents } from './seed/calendar';
import { seedFundingData } from './seed/funding';

// Fixed seed for reproducible results
faker.seed(42);

const prisma = new PrismaClient();

const DEMO_USER = {
  email: 'demo@trading.com',
  password: 'demo1234',
};

async function main() {
  console.log('=== Trading Tracker Demo Seed ===\n');

  // ------------------------------------------------------------------
  // 1. Create demo user
  // ------------------------------------------------------------------
  console.log('1. Creating demo user...');
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: { passwordHash },
    create: {
      email: DEMO_USER.email,
      passwordHash,
    },
  });
  console.log(`   User: ${user.email} (${user.id})`);

  // Create default preferences
  await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      theme: 'dark',
    },
  });
  console.log('   Preferences: theme=dark');

  // ------------------------------------------------------------------
  // 1b. Clean up previous seed data (prevents duplicates on re-run)
  // ------------------------------------------------------------------
  console.log('   Cleaning previous data...');
  await prisma.payoutRequest.deleteMany({ where: { account: { userId: user.id } } });
  await prisma.dailyAccountStatus.deleteMany({ where: { account: { userId: user.id } } });
  await prisma.accountStateSnapshot.deleteMany({ where: { account: { userId: user.id } } });
  await prisma.accountCycle.deleteMany({ where: { account: { userId: user.id } } });
  await prisma.trade.deleteMany({ where: { userId: user.id } });
  await prisma.calendarEvent.deleteMany({});
  await prisma.account.deleteMany({ where: { userId: user.id } });
  console.log('   Done.');

  // ------------------------------------------------------------------
  // 2. Create accounts
  // ------------------------------------------------------------------
  console.log('\n2. Creating accounts...');
  const accountDefs = getAccountDefinitions();
  const accountMap = new Map<string, string>(); // name -> id

  for (const def of accountDefs) {
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: def.name,
        broker: def.broker,
        currency: def.currency,
        initialBalance: def.initialBalance,
        type: def.type,
        market: def.market,
        propFirmStatus: def.propFirmStatus,
        externalId: def.externalId,
        dailyLossLimit: def.dailyLossLimit,
        maxLossLimit: def.maxLossLimit,
        profitTarget: def.profitTarget,
        defaultRisk: def.defaultRisk,
        startedAt: def.startedAt,
        status: 'ACTIVE',
      },
    });
    accountMap.set(def.name, account.id);
    console.log(`   [${def.type}/${def.propFirmStatus ?? 'N/A'}] ${def.name} — $${def.initialBalance.toLocaleString()} (${def.market})`);
  }

  // ------------------------------------------------------------------
  // 3. Generate and insert trades
  // ------------------------------------------------------------------
  console.log('\n3. Generating trades...');
  let totalTrades = 0;

  for (const def of accountDefs) {
    const accountId = accountMap.get(def.name)!;
    const trades = generateTrades(def);

    if (trades.length === 0) continue;

    // Batch insert with createMany for performance
    await prisma.trade.createMany({
      data: trades.map((t) => ({
        userId: user.id,
        accountId,
        instrument: t.instrument,
        side: t.side,
        openAt: t.openAt,
        closeAt: t.closeAt,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        quantity: t.quantity,
        fees: t.fees,
        swap: t.swap,
        commission: t.commission,
        pnlGross: t.pnlGross,
        pnlNet: t.pnlNet,
        riskAmount: t.riskAmount,
        resultR: t.resultR,
        externalId: t.externalId,
        notes: t.notes,
        tags: t.tags,
      })),
    });

    const closedCount = trades.filter((t) => t.closeAt).length;
    const openCount = trades.length - closedCount;
    const totalPnl = trades.reduce((sum, t) => sum + t.pnlNet, 0);

    console.log(`   ${def.name}: ${trades.length} trades (${closedCount} closed, ${openCount} open) — Net PnL: $${totalPnl.toFixed(2)}`);
    totalTrades += trades.length;
  }
  console.log(`   Total: ${totalTrades} trades generated.`);

  // ------------------------------------------------------------------
  // 4. Calendar events
  // ------------------------------------------------------------------
  console.log('\n4. Creating calendar events...');
  const events = getCalendarEvents();

  await prisma.calendarEvent.createMany({
    data: events.map((e) => ({
      date: e.date,
      type: e.type,
      label: e.label,
      blocksTrading: e.blocksTrading,
    })),
  });

  const byType = events.reduce(
    (acc, e) => { acc[e.type] = (acc[e.type] ?? 0) + 1; return acc; },
    {} as Record<string, number>,
  );
  console.log(`   ${events.length} events: ${Object.entries(byType).map(([k, v]) => `${k}=${v}`).join(', ')}`);

  // ------------------------------------------------------------------
  // 5. Funding derived data (cycles, daily status, snapshots, payouts)
  // ------------------------------------------------------------------
  console.log('\n5. Generating funding derived data...');
  await seedFundingData(prisma);

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log('\n=== Seed complete! ===');
  console.log(`  Login: ${DEMO_USER.email} / ${DEMO_USER.password}`);
  console.log(`  Accounts: ${accountDefs.length}`);
  console.log(`  Trades: ${totalTrades}`);
  console.log(`  Calendar events: ${events.length}`);

  const cycleCount = await prisma.accountCycle.count();
  const dailyCount = await prisma.dailyAccountStatus.count();
  const snapshotCount = await prisma.accountStateSnapshot.count();
  const payoutCount = await prisma.payoutRequest.count();
  console.log(`  Cycles: ${cycleCount}`);
  console.log(`  Daily statuses: ${dailyCount}`);
  console.log(`  Snapshots: ${snapshotCount}`);
  console.log(`  Payouts: ${payoutCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
