export interface PayoutRequest {
  id: string;
  accountId: string;
  cycleId: string;
  requestedAt: string;
  eligibleDate: string;
  paidAt: string | null;
  amount: number | null;
  status: 'REQUESTED' | 'PROCESSING' | 'PAID';
  account?: { name: string; broker: string };
  cycle?: { startDate: string; cycleStartBalance: number };
}
