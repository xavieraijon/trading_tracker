import { OperationalState } from './operational-state';

export interface DailyAccountStatus {
  id: string;
  accountId: string;
  cycleId: string;
  date: string;
  operationalState: OperationalState;
  balanceEod: number;
  pnlDay: number;
  tradesCount: number;
  tags: string[];
  account?: { name: string };
}
