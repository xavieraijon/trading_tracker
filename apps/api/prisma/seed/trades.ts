import { faker } from '@faker-js/faker';
import { MarketType } from '@prisma/client';
import type { AccountSeed } from './accounts';

/* ------------------------------------------------------------------ */
/*  Instrument configuration per market                                */
/* ------------------------------------------------------------------ */

interface InstrumentConfig {
  symbol: string;
  /** Typical price level (mid-2025) */
  basePrice: number;
  /** Typical pip/tick size for realistic moves */
  tickSize: number;
  /** Typical lot/contract size */
  typicalQty: number;
  /** Fee per round-trip in USD */
  typicalFee: number;
  /** Avg daily range in price units */
  avgDailyRange: number;
}

const INSTRUMENTS: Record<string, InstrumentConfig[]> = {
  [MarketType.CFD]: [
    { symbol: 'EURUSD', basePrice: 1.085, tickSize: 0.0001, typicalQty: 1, typicalFee: 7, avgDailyRange: 0.008 },
    { symbol: 'GBPUSD', basePrice: 1.272, tickSize: 0.0001, typicalQty: 1, typicalFee: 7, avgDailyRange: 0.010 },
    { symbol: 'USDJPY', basePrice: 154.5, tickSize: 0.01, typicalQty: 1, typicalFee: 7, avgDailyRange: 1.2 },
    { symbol: 'AUDUSD', basePrice: 0.655, tickSize: 0.0001, typicalQty: 1, typicalFee: 7, avgDailyRange: 0.006 },
    { symbol: 'NAS100', basePrice: 21500, tickSize: 0.01, typicalQty: 0.5, typicalFee: 3.5, avgDailyRange: 350 },
    { symbol: 'US30', basePrice: 42800, tickSize: 0.01, typicalQty: 0.2, typicalFee: 3, avgDailyRange: 450 },
    { symbol: 'XAUUSD', basePrice: 2950, tickSize: 0.01, typicalQty: 0.5, typicalFee: 5, avgDailyRange: 35 },
    { symbol: 'USOIL', basePrice: 68.5, tickSize: 0.01, typicalQty: 1, typicalFee: 5, avgDailyRange: 2.5 },
  ],
  [MarketType.FUTURES]: [
    { symbol: 'ES', basePrice: 5950, tickSize: 0.25, typicalQty: 2, typicalFee: 4.5, avgDailyRange: 55 },
    { symbol: 'NQ', basePrice: 21300, tickSize: 0.25, typicalQty: 1, typicalFee: 4.5, avgDailyRange: 350 },
    { symbol: 'YM', basePrice: 42800, tickSize: 1, typicalQty: 1, typicalFee: 4.5, avgDailyRange: 400 },
    { symbol: 'CL', basePrice: 68.5, tickSize: 0.01, typicalQty: 1, typicalFee: 4.5, avgDailyRange: 2.5 },
    { symbol: 'GC', basePrice: 2950, tickSize: 0.1, typicalQty: 1, typicalFee: 4.5, avgDailyRange: 35 },
    { symbol: 'RTY', basePrice: 2100, tickSize: 0.1, typicalQty: 2, typicalFee: 4.5, avgDailyRange: 30 },
  ],
  [MarketType.CRYPTO]: [
    { symbol: 'BTCUSD', basePrice: 98500, tickSize: 0.01, typicalQty: 0.05, typicalFee: 2, avgDailyRange: 3000 },
    { symbol: 'ETHUSD', basePrice: 2650, tickSize: 0.01, typicalQty: 1, typicalFee: 1.5, avgDailyRange: 120 },
    { symbol: 'SOLUSD', basePrice: 195, tickSize: 0.01, typicalQty: 10, typicalFee: 1, avgDailyRange: 15 },
    { symbol: 'BNBUSD', basePrice: 680, tickSize: 0.01, typicalQty: 2, typicalFee: 1, avgDailyRange: 30 },
  ],
};

/* ------------------------------------------------------------------ */
/*  Trade tags and notes                                               */
/* ------------------------------------------------------------------ */

const TRADE_TAGS = [
  ['breakout'], ['trend'], ['scalp'], ['reversal'], ['news'],
  ['support', 'bounce'], ['resistance', 'rejection'], ['pullback'],
  ['range'], ['momentum'], ['continuation'], ['gap-fill'],
  ['london-session'], ['ny-session'], ['asian-session'],
];

const WIN_NOTES = [
  'Clean breakout above resistance, held well.',
  'Trend continuation after pullback to 20 EMA.',
  'Good entry on support bounce, trailed stop.',
  'Momentum trade, exited at target 2R.',
  'Textbook flag pattern breakout.',
  'Supply zone rejection, quick scalp.',
  null, null, null, null, // Many trades have no notes
];

const LOSS_NOTES = [
  'Stopped out, false breakout.',
  'News spike hit stop loss.',
  'Overtraded, poor entry timing.',
  'Should have waited for confirmation.',
  'Choppy market, hit SL quickly.',
  null, null, null, null, null,
];

/* ------------------------------------------------------------------ */
/*  Scenario-based PnL distributions                                   */
/* ------------------------------------------------------------------ */

interface ScenarioConfig {
  /** Win rate 0..1 */
  winRate: number;
  /** Net PnL skew: > 0 means positive net result for the account */
  pnlBias: 'positive' | 'negative' | 'neutral';
}

const SCENARIO_CONFIGS: Record<AccountSeed['scenario'], ScenarioConfig> = {
  challenge_in_progress: { winRate: 0.52, pnlBias: 'positive' },
  funded_profit:         { winRate: 0.55, pnlBias: 'positive' },
  funded_drawdown:       { winRate: 0.34, pnlBias: 'negative' },
  challenge_early:       { winRate: 0.50, pnlBias: 'neutral' },
  funded_payout_requested: { winRate: 0.54, pnlBias: 'positive' },
  personal_mixed:        { winRate: 0.48, pnlBias: 'neutral' },
  personal_crypto:       { winRate: 0.46, pnlBias: 'neutral' },
};

/* ------------------------------------------------------------------ */
/*  Trade generation                                                   */
/* ------------------------------------------------------------------ */

export interface GeneratedTrade {
  instrument: string;
  side: 'LONG' | 'SHORT';
  openAt: Date;
  closeAt: Date | null;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  fees: number;
  swap: number;
  commission: number;
  pnlGross: number | null;
  pnlNet: number;
  riskAmount: number;
  resultR: number | null;
  externalId: string | null;
  notes: string | null;
  tags: string[];
}

/**
 * Generate a realistic set of trades for a given account seed.
 * Trades are distributed across the account's time span, with
 * realistic pricing, PnL, and instrument selection.
 */
export function generateTrades(account: AccountSeed): GeneratedTrade[] {
  const instruments = INSTRUMENTS[account.market];
  if (!instruments) return [];

  const config = SCENARIO_CONFIGS[account.scenario];
  const trades: GeneratedTrade[] = [];
  const totalTrades = account.tradesTarget;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date(account.startedAt);

  // Calculate how many open trades (2-3 per account)
  const openTradesCount = faker.number.int({ min: 2, max: 3 });
  const closedTradesCount = totalTrades - openTradesCount;

  // Generate trading days (skip weekends)
  const tradingDays = getTradingDays(startDate, endDate);
  if (tradingDays.length === 0) return [];

  // Distribute trades across days (1-4 trades per active day)
  const daySchedule = distributeTradesToDays(tradingDays, closedTradesCount);

  let tradeIndex = 0;

  for (const [dayDate, tradesOnDay] of daySchedule) {
    for (let t = 0; t < tradesOnDay; t++) {
      const inst = faker.helpers.arrayElement(instruments);
      const isWin = Math.random() < config.winRate;

      const trade = generateSingleTrade(inst, dayDate, isWin, account, config, false);
      trades.push(trade);
      tradeIndex++;
    }
  }

  // Generate open trades (recent, no closeAt)
  for (let i = 0; i < openTradesCount; i++) {
    const inst = faker.helpers.arrayElement(instruments);
    const recentDay = tradingDays[tradingDays.length - 1] ?? endDate;
    const trade = generateSingleTrade(inst, recentDay, true, account, config, true);
    trades.push(trade);
  }

  return trades;
}

function generateSingleTrade(
  inst: InstrumentConfig,
  dayDate: Date,
  isWin: boolean,
  account: AccountSeed,
  config: ScenarioConfig,
  isOpen: boolean,
): GeneratedTrade {
  const side: 'LONG' | 'SHORT' = faker.helpers.arrayElement(['LONG', 'SHORT']);

  // Random time during trading hours (7:00 - 20:00 UTC)
  const openHour = faker.number.int({ min: 7, max: 19 });
  const openMinute = faker.number.int({ min: 0, max: 59 });
  const openAt = new Date(dayDate);
  openAt.setUTCHours(openHour, openMinute, faker.number.int({ min: 0, max: 59 }));

  // Entry price with realistic variation around base
  const priceVariation = inst.avgDailyRange * faker.number.float({ min: -2, max: 2 });
  const entryPrice = roundTo(inst.basePrice + priceVariation, getPriceDecimals(inst));

  // Risk amount based on account's defaultRisk (with some variation)
  const baseRisk = account.defaultRisk ?? account.initialBalance * 0.01;
  const riskAmount = roundTo(baseRisk * faker.number.float({ min: 0.5, max: 1.5 }), 2);

  // Quantity - vary around typical
  const quantity = roundTo(
    inst.typicalQty * faker.number.float({ min: 0.5, max: 2 }),
    getQtyDecimals(inst),
  );

  // Calculate PnL
  let pnlMultiplier: number;
  if (isWin) {
    // Winners: 0.5R to 3R (capped at 1.5R for negative bias scenarios)
    const maxWinR = config.pnlBias === 'negative' ? 1.2 : 3.0;
    pnlMultiplier = faker.number.float({ min: 0.5, max: maxWinR });
    if (config.pnlBias === 'positive') {
      pnlMultiplier *= faker.number.float({ min: 1.0, max: 1.3 });
    }
  } else {
    // Losers: -1R to -0.3R
    pnlMultiplier = -faker.number.float({ min: 0.3, max: 1.0 });
    if (config.pnlBias === 'negative') {
      pnlMultiplier *= faker.number.float({ min: 1.2, max: 1.6 });
    }
  }

  const pnlGross = isOpen ? null : roundTo(riskAmount * pnlMultiplier, 2);

  // Fees, swap, commission
  const fees = roundTo(inst.typicalFee * faker.number.float({ min: 0.8, max: 1.2 }), 2);
  const swap = isOpen ? 0 : roundTo(faker.number.float({ min: -3, max: 1 }), 2);
  const commission = roundTo(fees * faker.number.float({ min: 0.3, max: 0.7 }), 2);

  const totalCosts = fees + Math.abs(swap) + commission;
  const pnlNet = isOpen ? 0 : roundTo((pnlGross ?? 0) - totalCosts, 2);

  // Exit price derived from PnL
  let exitPrice: number | null = null;
  let closeAt: Date | null = null;

  if (!isOpen && pnlGross !== null) {
    // Duration: 5 min to 6 hours
    const durationMinutes = faker.number.int({ min: 5, max: 360 });
    closeAt = new Date(openAt.getTime() + durationMinutes * 60_000);

    // Derive exit price from gross PnL
    const pointValue = quantity > 0 ? pnlGross / quantity : 0;
    if (side === 'LONG') {
      exitPrice = roundTo(entryPrice + pointValue, getPriceDecimals(inst));
    } else {
      exitPrice = roundTo(entryPrice - pointValue, getPriceDecimals(inst));
    }
  }

  // ResultR
  const resultR = (!isOpen && riskAmount > 0) ? roundTo(pnlNet / riskAmount, 4) : null;

  // Tags and notes
  const tags = Math.random() < 0.6 ? faker.helpers.arrayElement(TRADE_TAGS) : [];
  const notePool = isWin ? WIN_NOTES : LOSS_NOTES;
  const notes = Math.random() < 0.35 ? faker.helpers.arrayElement(notePool) : null;

  // External ID (some trades have MT5-like ticket)
  const externalId = Math.random() < 0.7 ? String(faker.number.int({ min: 10000000, max: 99999999 })) : null;

  return {
    instrument: inst.symbol,
    side,
    openAt,
    closeAt,
    entryPrice,
    exitPrice,
    quantity,
    fees,
    swap,
    commission,
    pnlGross,
    pnlNet,
    riskAmount,
    resultR,
    externalId,
    notes,
    tags,
  };
}

/* ------------------------------------------------------------------ */
/*  Helper utilities                                                   */
/* ------------------------------------------------------------------ */

function getTradingDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(start);
  current.setUTCHours(0, 0, 0, 0);

  while (current <= end) {
    const dow = current.getUTCDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dow !== 0 && dow !== 6) {
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function distributeTradesToDays(
  tradingDays: Date[],
  totalTrades: number,
): [Date, number][] {
  if (tradingDays.length === 0) return [];

  // Not every day is traded; pick ~60-80% of available days
  const activeDayCount = Math.min(
    tradingDays.length,
    Math.max(1, Math.ceil(totalTrades / 2.5)),
  );

  // Pick random subset of days
  const shuffled = faker.helpers.shuffle([...tradingDays]);
  const activeDays = shuffled.slice(0, activeDayCount).sort((a, b) => a.getTime() - b.getTime());

  // Distribute trades across active days
  const schedule: [Date, number][] = [];
  let remaining = totalTrades;

  for (let i = 0; i < activeDays.length; i++) {
    const isLast = i === activeDays.length - 1;
    const tradesThisDay = isLast
      ? remaining
      : Math.min(remaining, faker.number.int({ min: 1, max: 4 }));
    if (tradesThisDay > 0) {
      schedule.push([activeDays[i], tradesThisDay]);
      remaining -= tradesThisDay;
    }
    if (remaining <= 0) break;
  }

  return schedule;
}

function getPriceDecimals(inst: InstrumentConfig): number {
  const s = inst.tickSize.toString();
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}

function getQtyDecimals(inst: InstrumentConfig): number {
  const s = inst.typicalQty.toString();
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : Math.min(s.length - dot - 1, 6);
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
