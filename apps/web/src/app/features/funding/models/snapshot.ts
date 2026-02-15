import { OperationalState } from './operational-state';

export interface AccountStateSnapshot {
  id: string;
  accountId: string;
  currentCycleId: string | null;
  operationalState: OperationalState;
  balance: number;
  cycleStartBalance: number;
  drawdownPct: number;
  profitPct: number;
  daysToPayoutEligible: number | null;
  updatedAt: string;
  account?: { id: string; name: string; broker: string; propFirmStatus?: 'CHALLENGE' | 'FUNDED' };
}
