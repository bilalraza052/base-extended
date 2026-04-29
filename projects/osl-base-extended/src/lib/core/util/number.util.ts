// ─── Number Utilities ────────────────────────────────────────────────────────

/** Rounds to the given number of decimal places (default 0). */
export function round(num: number, decimals = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

/** Floors to the given number of decimal places (default 0). */
export function floor(num: number, decimals = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.floor(num * factor) / factor;
}

/** Ceils to the given number of decimal places (default 0). */
export function ceil(num: number, decimals = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.ceil(num * factor) / factor;
}

/** Clamps a number within [min, max]. */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Formats a number as currency using Intl.NumberFormat.
 * @example formatCurrency(1234.5, 'USD', 'en-US') → '$1,234.50'
 */
export function formatCurrency(num: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(num);
}

/**
 * Formats a number with grouping separators and fixed decimal places.
 * @example formatNumber(1234567.89, 2, 'en-US') → '1,234,567.89'
 */
export function formatNumber(num: number, decimals = 2, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Calculates what percentage `value` is of `total`.
 * @example percentage(25, 200) → 12.5
 */
export function percentage(value: number, total: number, decimals = 2): number {
  if (total === 0) return 0;
  return round((value / total) * 100, decimals);
}

/** Returns true if `num` is a prime number. */
export function isPrime(num: number): boolean {
  if (num < 2) return false;
  if (num === 2) return true;
  if (num % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    if (num % i === 0) return false;
  }
  return true;
}

/** Returns true if the number is even. */
export function isEven(num: number): boolean {
  return num % 2 === 0;
}

/** Returns true if the number is odd. */
export function isOdd(num: number): boolean {
  return num % 2 !== 0;
}

/** Returns a random floating-point number in [min, max). */
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Returns a random integer in [min, max] (inclusive). */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Returns the sum of an array of numbers. */
export function sum(numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}

/** Returns the average of an array of numbers. */
export function average(numbers: number[]): number {
  if (!numbers.length) return 0;
  return sum(numbers) / numbers.length;
}

/** Returns the minimum value in an array. */
export function min(numbers: number[]): number {
  return Math.min(...numbers);
}

/** Returns the maximum value in an array. */
export function max(numbers: number[]): number {
  return Math.max(...numbers);
}

/**
 * Returns the ordinal string for a number.
 * @example toOrdinal(3) → '3rd'
 */
export function toOrdinal(num: number): string {
  const abs = Math.abs(num);
  const suffix =
    abs % 100 >= 11 && abs % 100 <= 13 ? 'th' :
    abs % 10 === 1 ? 'st' :
    abs % 10 === 2 ? 'nd' :
    abs % 10 === 3 ? 'rd' : 'th';
  return `${num}${suffix}`;
}

/**
 * Abbreviates large numbers with K / M / B / T suffixes.
 * @example abbreviate(1500000) → '1.5M'
 */
export function abbreviate(num: number, decimals = 1): string {
  const tiers: [number, string][] = [
    [1e12, 'T'],
    [1e9,  'B'],
    [1e6,  'M'],
    [1e3,  'K'],
  ];
  const abs = Math.abs(num);
  for (const [threshold, suffix] of tiers) {
    if (abs >= threshold) {
      return `${round(num / threshold, decimals)}${suffix}`;
    }
  }
  return String(num);
}

/** Returns true if `num` is within [min, max] (inclusive). */
export function inRange(num: number, min: number, max: number): boolean {
  return num >= min && num <= max;
}

/** Parses a string to float; returns null if not a valid number. */
export function safeParseFloat(str: string): number | null {
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

/** Parses a string to integer; returns null if not a valid number. */
export function safeParseInt(str: string, radix = 10): number | null {
  const n = parseInt(str, radix);
  return isNaN(n) ? null : n;
}

/** Returns the greatest common divisor of two integers. */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/** Returns the least common multiple of two integers. */
export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

/** Returns the Nth Fibonacci number (0-indexed). */
export function fibonacci(n: number): number {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

/** Returns true if the value is a finite number (not NaN, not ±Infinity). */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value);
}

/** Returns true if the value is NaN. */
export function isNaNValue(value: unknown): boolean {
  return typeof value === 'number' && isNaN(value);
}

/** Returns true if the number is positive (> 0). */
export function isPositive(num: number): boolean {
  return num > 0;
}

/** Returns true if the number is negative (< 0). */
export function isNegative(num: number): boolean {
  return num < 0;
}

/** Converts degrees to radians. */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** Converts radians to degrees. */
export function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/** Linearly interpolates between `start` and `end` by factor `t` (0–1). */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}
