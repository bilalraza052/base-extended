// ─── Array Utilities ────────────────────────────────────────────────────────

/** Splits an array into chunks of the given size. */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) return [];
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/** Removes duplicate primitive values. */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/** Removes duplicates by object key. */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set<unknown>();
  return array.filter(item => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

/** Flattens one level of nesting. */
export function flatten<T>(array: (T | T[])[]): T[] {
  return (array as T[][]).flat();
}

/** Deeply flattens a nested array. */
export function flattenDeep<T>(array: unknown[]): T[] {
  return array.reduce<T[]>((acc, val) =>
    Array.isArray(val) ? acc.concat(flattenDeep<T>(val)) : [...acc, val as T], []);
}

/** Groups array elements by a key. */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce<Record<string, T[]>>((acc, item) => {
    const group = String(item[key]);
    acc[group] = acc[group] ?? [];
    acc[group].push(item);
    return acc;
  }, {});
}

/** Sorts array by key ascending or descending. */
export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/** Filters array where key matches value (strict equality). */
export function filterBy<T>(array: T[], key: keyof T, value: unknown): T[] {
  return array.filter(item => item[key] === value);
}

/** Sums values at the given numeric key. */
export function sumBy<T>(array: T[], key: keyof T): number {
  return array.reduce((acc, item) => acc + Number(item[key]), 0);
}

/** Returns the item with the minimum value at key. */
export function minBy<T>(array: T[], key: keyof T): T | undefined {
  if (!array.length) return undefined;
  return array.reduce((min, item) => (item[key] < min[key] ? item : min));
}

/** Returns the item with the maximum value at key. */
export function maxBy<T>(array: T[], key: keyof T): T | undefined {
  if (!array.length) return undefined;
  return array.reduce((max, item) => (item[key] > max[key] ? item : max));
}

/** Computes the average of an array of numbers. */
export function average(numbers: number[]): number {
  if (!numbers.length) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

/** Returns true if the array is null, undefined, or has no elements. */
export function isEmpty<T>(array: T[] | null | undefined): boolean {
  return !array || array.length === 0;
}

/** Returns the last element. */
export function last<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

/** Returns the first element. */
export function first<T>(array: T[]): T | undefined {
  return array[0];
}

/** Returns a slice of the array for the given page (1-based). */
export function paginate<T>(array: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return array.slice(start, start + pageSize);
}

/** Moves an element from one index to another (immutable). */
export function move<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array];
  const [item] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, item);
  return result;
}

/** Adds the item if absent, removes it if present. */
export function toggle<T>(array: T[], item: T): T[] {
  return array.includes(item) ? array.filter(i => i !== item) : [...array, item];
}

/** Returns elements present in both arrays. */
export function intersection<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter(item => setB.has(item));
}

/** Returns elements in `a` not present in `b`. */
export function difference<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter(item => !setB.has(item));
}

/** Converts an array to a lookup map keyed by the given property. */
export function toMap<T>(array: T[], key: keyof T): Record<string, T> {
  return array.reduce<Record<string, T>>((acc, item) => {
    acc[String(item[key])] = item;
    return acc;
  }, {});
}

/** Removes falsy values (null, undefined, 0, '', false). */
export function compact<T>(array: (T | null | undefined | false | 0 | '')[]): T[] {
  return array.filter(Boolean) as T[];
}

/** Returns a new randomly shuffled copy. */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Returns a random element, or multiple elements if count is given. */
export function sample<T>(array: T[]): T | undefined;
export function sample<T>(array: T[], count: number): T[];
export function sample<T>(array: T[], count?: number): T | T[] | undefined {
  if (count === undefined) return array[Math.floor(Math.random() * array.length)];
  return shuffle(array).slice(0, count);
}

/** Counts occurrences of each value at the given key. */
export function countBy<T>(array: T[], key: keyof T): Record<string, number> {
  return array.reduce<Record<string, number>>((acc, item) => {
    const group = String(item[key]);
    acc[group] = (acc[group] ?? 0) + 1;
    return acc;
  }, {});
}

/** Returns the union of two arrays (unique values from both). */
export function union<T>(a: T[], b: T[]): T[] {
  return unique([...a, ...b]);
}

/** Zips multiple arrays into an array of tuples. */
export function zip<T>(...arrays: T[][]): T[][] {
  const length = Math.max(...arrays.map(a => a.length));
  return Array.from({ length }, (_, i) => arrays.map(a => a[i]));
}

/** Returns true if predicate holds for all elements. */
export function every<T>(array: T[], predicate: (item: T) => boolean): boolean {
  return array.every(predicate);
}

/** Returns true if predicate holds for at least one element. */
export function some<T>(array: T[], predicate: (item: T) => boolean): boolean {
  return array.some(predicate);
}

/** Partitions an array into two groups based on predicate. */
export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];
  for (const item of array) {
    (predicate(item) ? pass : fail).push(item);
  }
  return [pass, fail];
}
