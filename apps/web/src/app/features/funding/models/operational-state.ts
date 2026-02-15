export enum OperationalState {
  BREAK_EVEN = 'BREAK_EVEN',
  DRAWDOWN = 'DRAWDOWN',
  PROFIT = 'PROFIT',
  PAYOUT_REQUESTED = 'PAYOUT_REQUESTED',
  PAYOUT_PROCESSING = 'PAYOUT_PROCESSING',
  REST_DAY = 'REST_DAY',
}

export const STATE_LABELS: Record<OperationalState, string> = {
  [OperationalState.BREAK_EVEN]: 'Break Even',
  [OperationalState.DRAWDOWN]: 'Drawdown',
  [OperationalState.PROFIT]: 'Profit',
  [OperationalState.PAYOUT_REQUESTED]: 'Payout Requested',
  [OperationalState.PAYOUT_PROCESSING]: 'Payout Processing',
  [OperationalState.REST_DAY]: 'Rest Day',
};

/**
 * Color mapping for the "Excel" dashboard cells.
 * Colores con buen contraste para que azul y verde destaquen (rojo ya se ve bien).
 */
export const STATE_COLORS: Record<OperationalState, string> = {
  [OperationalState.BREAK_EVEN]: '#2563EB',       // blue-600, más saturado
  [OperationalState.DRAWDOWN]: '#EF4444',         // red (loss)
  [OperationalState.PROFIT]: '#16A34A',            // green-600, verde más vivo
  [OperationalState.PAYOUT_REQUESTED]: '#15803D', // green-700
  [OperationalState.PAYOUT_PROCESSING]: '#15803D', // green-700
  [OperationalState.REST_DAY]: '#9CA3AF',          // gray
};

export const WEEKEND_COLOR = '#F97316'; // orange
