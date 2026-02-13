import { OperationalState } from './operational-state';

export interface PlanDayAccount {
  accountId: string;
  accountName: string;
  state: OperationalState;
  reason: string;
}

export interface PlanDayResult {
  date: string;
  operate: PlanDayAccount[];
  block: PlanDayAccount[];
  calendarBlocked: boolean;
}
