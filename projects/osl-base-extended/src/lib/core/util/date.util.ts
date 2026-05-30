// ─── Date Utilities ───────────────────────────────────────────────────────────

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_FULL  = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES_SHORT   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL    = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Returns the current date and time. */
export function now(): Date {
  return new Date();
}

/** Returns today's date with time set to midnight. */
export function today(): Date {
  return startOfDay(new Date());
}

/** Returns true if the value is a valid Date object. */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Formats a Date using a pattern string.
 * Tokens: YYYY, YY, MM, M, DD, D, HH, H, mm, m, ss, s,
 *         MMM (short month), MMMM (full month),
 *         ddd (short day), dddd (full day).
 */
export function formatDate(date: Date | string | number, pattern: string): string {
  const d = new Date(date);
  if (!isValidDate(d)) return '';

  const year   = d.getFullYear();
  const month  = d.getMonth();
  const day    = d.getDate();
  const hours  = d.getHours();
  const mins   = d.getMinutes();
  const secs   = d.getSeconds();
  const dayOfWeek = d.getDay();

  return pattern
    .replace('YYYY', String(year))
    .replace('YY',   String(year).slice(-2))
    .replace('MMMM', MONTH_NAMES_FULL[month])
    .replace('MMM',  MONTH_NAMES_SHORT[month])
    .replace('MM',   pad(month + 1))
    .replace('M',    String(month + 1))
    .replace('dddd', DAY_NAMES_FULL[dayOfWeek])
    .replace('ddd',  DAY_NAMES_SHORT[dayOfWeek])
    .replace('DD',   pad(day))
    .replace('D',    String(day))
    .replace('HH',   pad(hours))
    .replace('H',    String(hours))
    .replace('mm',   pad(mins))
    .replace('m',    String(mins))
    .replace('ss',   pad(secs))
    .replace('s',    String(secs));
}

/** Returns date as `YYYY-MM-DD`. */
export function toDateOnly(date: Date): string {
  return formatDate(date, 'YYYY-MM-DD');
}

/** Returns the ISO 8601 string for a date. */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/** Returns a new date with `days` added. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Returns a new date with `months` added. */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/** Returns a new date with `years` added. */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/** Returns a new date with `hours` added. */
export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3_600_000);
}

/** Returns a new date with `minutes` added. */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** Returns a new date with `days` subtracted. */
export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

/** Returns a new date with `months` subtracted. */
export function subtractMonths(date: Date, months: number): Date {
  return addMonths(date, -months);
}

/** Returns a new date with `years` subtracted. */
export function subtractYears(date: Date, years: number): Date {
  return addYears(date, -years);
}

/** Returns the absolute difference in whole days between two dates. */
export function diffInDays(date1: Date, date2: Date): number {
  return Math.abs(Math.floor((date1.getTime() - date2.getTime()) / 86_400_000));
}

/** Returns the absolute difference in whole months between two dates. */
export function diffInMonths(date1: Date, date2: Date): number {
  return Math.abs(
    (date1.getFullYear() - date2.getFullYear()) * 12 +
    (date1.getMonth()  - date2.getMonth())
  );
}

/** Returns the absolute difference in whole years between two dates. */
export function diffInYears(date1: Date, date2: Date): number {
  return Math.abs(date1.getFullYear() - date2.getFullYear());
}

/** Returns the difference in minutes between two dates (date1 - date2). */
export function diffInMinutes(date1: Date, date2: Date): number {
  return Math.floor((date1.getTime() - date2.getTime()) / 60_000);
}

/** Returns true if date1 is strictly before date2. */
export function isBefore(date1: Date, date2: Date): boolean {
  return date1.getTime() < date2.getTime();
}

/** Returns true if date1 is strictly after date2. */
export function isAfter(date1: Date, date2: Date): boolean {
  return date1.getTime() > date2.getTime();
}

/** Returns true if both dates fall on the same calendar day. */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth()    === date2.getMonth()    &&
    date1.getDate()     === date2.getDate()
  );
}

/** Returns true if the date falls on a Saturday or Sunday. */
export function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}

/** Returns true if the date is today. */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/** Returns true if the date falls in the past (before now). */
export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/** Returns true if the date falls in the future (after now). */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/** Returns the date with time set to 00:00:00.000. */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/** Returns the date with time set to 23:59:59.999. */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/** Returns the first day of the month (time 00:00:00.000). */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Returns the last day of the month (time 23:59:59.999). */
export function endOfMonth(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
}

/** Returns the first day of the year (Jan 1, 00:00:00.000). */
export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

/** Returns the last day of the year (Dec 31, 23:59:59.999). */
export function endOfYear(date: Date): Date {
  const result = new Date(date.getFullYear(), 11, 31);
  result.setHours(23, 59, 59, 999);
  return result;
}

/** Calculates the age in years from a birth date. */
export function getAge(birthDate: Date): number {
  const n = new Date();
  let age = n.getFullYear() - birthDate.getFullYear();
  const monthDiff = n.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && n.getDate() < birthDate.getDate())) age--;
  return age;
}

/** Returns the number of days in a given month (0-based month). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns true if the given year is a leap year. */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Returns a human-friendly relative time string.
 * @example timeAgo(new Date(Date.now() - 3600_000)) → '1 hour ago'
 */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const abs = Math.abs(seconds);
  const future = seconds < 0;

  const intervals: [number, string][] = [
    [31_536_000, 'year'],
    [2_592_000,  'month'],
    [604_800,    'week'],
    [86_400,     'day'],
    [3_600,      'hour'],
    [60,         'minute'],
    [1,          'second'],
  ];

  for (const [secs, label] of intervals) {
    const count = Math.floor(abs / secs);
    if (count >= 1) {
      const unit = count === 1 ? label : `${label}s`;
      return future ? `in ${count} ${unit}` : `${count} ${unit} ago`;
    }
  }
  return 'just now';
}

/** Returns the ISO week number (1–53) for the given date. */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
}

/** Returns the next weekday (Mon–Fri) after the given date. */
export function nextWorkday(date: Date): Date {
  const result = addDays(date, 1);
  while (isWeekend(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

/** Returns true if a date falls within the range [start, end] (inclusive). */
export function inRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

/** Parses a `YYYY-MM-DD` string and returns a local-midnight Date or null. */
export function parseDate(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const [, y, mo, d] = match.map(Number);
  const result = new Date(y, mo - 1, d);
  return isValidDate(result) ? result : null;
}


export function localeDate(dateStr: string){
  const date = new Date(dateStr);
  date.toLocaleString('en-US')

}