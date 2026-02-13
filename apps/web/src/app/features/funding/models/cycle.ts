export interface AccountCycle {
  id: string;
  accountId: string;
  startDate: string;
  endDate: string | null;
  cycleStartBalance: number;
  profitTargetPct: number;
  status: 'ACTIVE' | 'CLOSED';
}
