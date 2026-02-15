import { CalendarEventType } from '@prisma/client';

export interface CalendarEventSeed {
  date: Date;
  type: CalendarEventType;
  label: string;
  blocksTrading: boolean;
}

/**
 * Generate economic calendar events for the last 6 months and next 2 months.
 * Includes NFP dates, major holidays, and custom events.
 */
export function getCalendarEvents(): CalendarEventSeed[] {
  const events: CalendarEventSeed[] = [];
  const now = new Date();
  const year = now.getFullYear();

  // --- NFP: First Friday of each month (past 6 months + next 2) ---
  for (let monthOffset = -6; monthOffset <= 2; monthOffset++) {
    const targetMonth = new Date(year, now.getMonth() + monthOffset, 1);
    const firstFriday = getFirstFriday(targetMonth.getFullYear(), targetMonth.getMonth());
    events.push({
      date: firstFriday,
      type: CalendarEventType.NFP,
      label: `Non-Farm Payrolls - ${formatMonth(firstFriday)}`,
      blocksTrading: true,
    });
  }

  // --- Major US Holidays (current year and previous) ---
  const holidayYears = [year - 1, year];
  for (const y of holidayYears) {
    events.push(
      { date: utcDate(y, 0, 1), type: CalendarEventType.HOLIDAY, label: "New Year's Day", blocksTrading: true },
      { date: getMlkDay(y), type: CalendarEventType.HOLIDAY, label: 'Martin Luther King Jr. Day', blocksTrading: true },
      { date: getPresidentsDay(y), type: CalendarEventType.HOLIDAY, label: "Presidents' Day", blocksTrading: true },
      { date: getGoodFriday(y), type: CalendarEventType.HOLIDAY, label: 'Good Friday', blocksTrading: true },
      { date: getMemorialDay(y), type: CalendarEventType.HOLIDAY, label: 'Memorial Day', blocksTrading: true },
      { date: utcDate(y, 6, 4), type: CalendarEventType.HOLIDAY, label: 'Independence Day', blocksTrading: true },
      { date: getLaborDay(y), type: CalendarEventType.HOLIDAY, label: 'Labor Day', blocksTrading: true },
      { date: getThanksgiving(y), type: CalendarEventType.HOLIDAY, label: 'Thanksgiving Day', blocksTrading: true },
      { date: utcDate(y, 11, 25), type: CalendarEventType.HOLIDAY, label: 'Christmas Day', blocksTrading: true },
    );
  }

  // --- Custom events (recent and upcoming) ---
  const customEvents: Array<{ monthOffset: number; day: number; label: string }> = [
    { monthOffset: -2, day: 12, label: 'CPI Release' },
    { monthOffset: -2, day: 19, label: 'Fed FOMC Meeting' },
    { monthOffset: -1, day: 10, label: 'CPI Release' },
    { monthOffset: -1, day: 17, label: 'ECB Rate Decision' },
    { monthOffset: -1, day: 29, label: 'Fed FOMC Meeting' },
    { monthOffset: 0, day: 12, label: 'CPI Release' },
    { monthOffset: 0, day: 18, label: 'Fed FOMC Meeting' },
    { monthOffset: 1, day: 10, label: 'CPI Release' },
    { monthOffset: 1, day: 15, label: 'ECB Rate Decision' },
  ];

  for (const ce of customEvents) {
    const d = new Date(year, now.getMonth() + ce.monthOffset, ce.day);
    // Skip if it falls on weekend
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6) continue;
    events.push({
      date: toUTCDateOnly(d),
      type: CalendarEventType.CUSTOM,
      label: ce.label,
      blocksTrading: true,
    });
  }

  // Deduplicate by date (keep first occurrence)
  const seen = new Set<string>();
  return events.filter((e) => {
    const key = e.date.toISOString().split('T')[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ------------------------------------------------------------------ */
/*  Date helpers                                                       */
/* ------------------------------------------------------------------ */

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

function toUTCDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function getFirstFriday(year: number, month: number): Date {
  const d = new Date(Date.UTC(year, month, 1));
  while (d.getUTCDay() !== 5) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

function formatMonth(d: Date): string {
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Third Monday of January */
function getMlkDay(year: number): Date {
  return getNthWeekday(year, 0, 1, 3); // January, Monday, 3rd
}

/** Third Monday of February */
function getPresidentsDay(year: number): Date {
  return getNthWeekday(year, 1, 1, 3);
}

/** Last Monday of May */
function getMemorialDay(year: number): Date {
  return getLastWeekday(year, 4, 1);
}

/** First Monday of September */
function getLaborDay(year: number): Date {
  return getNthWeekday(year, 8, 1, 1);
}

/** Fourth Thursday of November */
function getThanksgiving(year: number): Date {
  return getNthWeekday(year, 10, 4, 4); // November, Thursday, 4th
}

/** Good Friday: Easter Sunday - 2 */
function getGoodFriday(year: number): Date {
  const easter = getEasterSunday(year);
  easter.setUTCDate(easter.getUTCDate() - 2);
  return easter;
}

/**
 * Nth weekday of a month. weekday: 0=Sun..6=Sat
 */
function getNthWeekday(year: number, month: number, weekday: number, nth: number): Date {
  const d = new Date(Date.UTC(year, month, 1));
  let count = 0;
  while (count < nth) {
    if (d.getUTCDay() === weekday) count++;
    if (count < nth) d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

function getLastWeekday(year: number, month: number, weekday: number): Date {
  const d = new Date(Date.UTC(year, month + 1, 0)); // Last day of month
  while (d.getUTCDay() !== weekday) {
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return d;
}

/** Anonymous Gregorian Easter algorithm */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month, day));
}
