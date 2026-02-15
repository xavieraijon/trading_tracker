import { AccountType, MarketType, PropFirmStatus } from '@prisma/client';

export interface AccountSeed {
  name: string;
  broker: string;
  currency: string;
  initialBalance: number;
  type: AccountType;
  market: MarketType;
  propFirmStatus: PropFirmStatus | null;
  externalId: string | null;
  dailyLossLimit: number | null;
  maxLossLimit: number | null;
  profitTarget: number | null;
  defaultRisk: number | null;
  startedAt: Date;
  /** Desired operational scenario for the seed generator */
  scenario: 'challenge_in_progress' | 'funded_profit' | 'funded_drawdown' | 'challenge_early' | 'funded_payout_requested' | 'personal_mixed' | 'personal_crypto';
  /** Approximate number of trades to generate */
  tradesTarget: number;
  /** How many months back trades should span */
  monthsSpan: number;
}

/**
 * 7 realistic accounts across 5 different prop firms + 2 personal.
 * startedAt dates are relative to "now" so the seed always produces
 * recent-looking data.
 */
export function getAccountDefinitions(): AccountSeed[] {
  const now = new Date();

  return [
    {
      name: 'FTMO 100k Phase 1',
      broker: 'FTMO',
      currency: 'USD',
      initialBalance: 100_000,
      type: AccountType.PROP_FIRM,
      market: MarketType.CFD,
      propFirmStatus: PropFirmStatus.CHALLENGE,
      externalId: '51084723',
      dailyLossLimit: 5_000,
      maxLossLimit: 10_000,
      profitTarget: 10_000,
      defaultRisk: 500,
      startedAt: daysAgo(now, 18),
      scenario: 'challenge_in_progress',
      tradesTarget: 35,
      monthsSpan: 0.6,
    },
    {
      name: 'FTMO 200k Funded',
      broker: 'FTMO',
      currency: 'USD',
      initialBalance: 200_000,
      type: AccountType.PROP_FIRM,
      market: MarketType.CFD,
      propFirmStatus: PropFirmStatus.FUNDED,
      externalId: '51092156',
      dailyLossLimit: 10_000,
      maxLossLimit: 20_000,
      profitTarget: 40_000,
      defaultRisk: 1_000,
      startedAt: daysAgo(now, 90),
      scenario: 'funded_profit',
      tradesTarget: 90,
      monthsSpan: 3,
    },
    {
      name: 'TFT 50k Funded',
      broker: 'The Funded Trader',
      currency: 'USD',
      initialBalance: 50_000,
      type: AccountType.PROP_FIRM,
      market: MarketType.FUTURES,
      propFirmStatus: PropFirmStatus.FUNDED,
      externalId: 'TFT-78432',
      dailyLossLimit: 2_500,
      maxLossLimit: 5_000,
      profitTarget: 5_000,
      defaultRisk: 250,
      startedAt: daysAgo(now, 45),
      scenario: 'funded_drawdown',
      tradesTarget: 45,
      monthsSpan: 1.5,
    },
    {
      name: 'MFF 25k Challenge',
      broker: 'MyFundedFX',
      currency: 'USD',
      initialBalance: 25_000,
      type: AccountType.PROP_FIRM,
      market: MarketType.CFD,
      propFirmStatus: PropFirmStatus.CHALLENGE,
      externalId: 'MFF-11204',
      dailyLossLimit: 1_250,
      maxLossLimit: 2_500,
      profitTarget: 2_000,
      defaultRisk: 125,
      startedAt: daysAgo(now, 10),
      scenario: 'challenge_early',
      tradesTarget: 20,
      monthsSpan: 0.3,
    },
    {
      name: 'TopStep 150k',
      broker: 'TopStep',
      currency: 'USD',
      initialBalance: 150_000,
      type: AccountType.PROP_FIRM,
      market: MarketType.FUTURES,
      propFirmStatus: PropFirmStatus.FUNDED,
      externalId: 'TS-992847',
      dailyLossLimit: 7_500,
      maxLossLimit: 15_000,
      profitTarget: 30_000,
      defaultRisk: 750,
      startedAt: daysAgo(now, 60),
      scenario: 'funded_payout_requested',
      tradesTarget: 65,
      monthsSpan: 2,
    },
    {
      name: 'IC Markets Personal',
      broker: 'IC Markets',
      currency: 'USD',
      initialBalance: 10_000,
      type: AccountType.PERSONAL,
      market: MarketType.CFD,
      propFirmStatus: null,
      externalId: '2089431',
      dailyLossLimit: null,
      maxLossLimit: null,
      profitTarget: null,
      defaultRisk: 100,
      startedAt: daysAgo(now, 120),
      scenario: 'personal_mixed',
      tradesTarget: 55,
      monthsSpan: 4,
    },
    {
      name: 'Binance Crypto',
      broker: 'Binance',
      currency: 'USD',
      initialBalance: 5_000,
      type: AccountType.PERSONAL,
      market: MarketType.CRYPTO,
      propFirmStatus: null,
      externalId: null,
      dailyLossLimit: null,
      maxLossLimit: null,
      profitTarget: null,
      defaultRisk: 50,
      startedAt: daysAgo(now, 75),
      scenario: 'personal_crypto',
      tradesTarget: 35,
      monthsSpan: 2.5,
    },
  ];
}

function daysAgo(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}
