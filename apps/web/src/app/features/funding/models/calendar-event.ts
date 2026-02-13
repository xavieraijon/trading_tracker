export interface CalendarEvent {
  id: string;
  date: string;
  type: 'NFP' | 'HOLIDAY' | 'WEEKEND' | 'CUSTOM';
  label: string;
  blocksTrading: boolean;
}
