export enum OperationalState {
  BREAK_EVEN = 'BREAK_EVEN',
  DRAWDOWN = 'DRAWDOWN',
  PROFIT = 'PROFIT',
  PAYOUT_REQUESTED = 'PAYOUT_REQUESTED',
  PAYOUT_PROCESSING = 'PAYOUT_PROCESSING',
  CHALLENGE = 'CHALLENGE',
}

export const STATE_LABELS: Record<OperationalState, string> = {
  [OperationalState.BREAK_EVEN]: 'Break Even',
  [OperationalState.DRAWDOWN]: 'Drawdown',
  [OperationalState.PROFIT]: 'Profit',
  [OperationalState.PAYOUT_REQUESTED]: 'Payout Requested',
  [OperationalState.PAYOUT_PROCESSING]: 'Payout Processing',
  [OperationalState.CHALLENGE]: 'Challenge / Rest',
};

/**
 * Color mapping for the "Excel" dashboard cells.
 * verde claro → profit | verde oscuro → payout
 * azul → no operada  | rojo → loss
 * naranja → weekend  | gris → challenge/descanso
 */
export const STATE_COLORS: Record<OperationalState, string> = {
  [OperationalState.BREAK_EVEN]: '#3B82F6',      // blue  (not traded yet)
  [OperationalState.DRAWDOWN]: '#EF4444',         // red   (loss)
  [OperationalState.PROFIT]: '#4ADE80',           // light green
  [OperationalState.PAYOUT_REQUESTED]: '#166534', // dark green
  [OperationalState.PAYOUT_PROCESSING]: '#166534',// dark green
  [OperationalState.CHALLENGE]: '#9CA3AF',        // gray
};

export const WEEKEND_COLOR = '#F97316'; // orange
