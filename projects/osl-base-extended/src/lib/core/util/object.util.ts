// ─── Object Utilities ────────────────────────────────────────────────────────

/** Returns a deep clone of the value using structured clone. */
export function deepClone<T>(obj: T): T {
  return structuredClone(obj);
}

/** Deep-merges one or more source objects into target (immutable). */
export function deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
  const result = deepClone(target);
  for (const source of sources) {
    for (const key in source) {
      const srcVal = source[key as keyof typeof source];
      const tgtVal = result[key as keyof T];
      if (isPlainObject(srcVal) && isPlainObject(tgtVal)) {
        (result as Record<string, unknown>)[key] = deepMerge(
          tgtVal as object,
          srcVal as object
        );
      } else if (srcVal !== undefined) {
        (result as Record<string, unknown>)[key] = deepClone(srcVal);
      }
    }
  }
  return result;
}

/** Returns true if `value` is a plain (non-null) object literal. */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

/** Creates a new object containing only the specified keys. */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {} as Pick<T, K>);
}

/** Creates a new object excluding the specified keys. */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const keySet = new Set<PropertyKey>(keys);
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keySet.has(k))
  ) as Omit<T, K>;
}

/** Returns true if the object has no own enumerable properties. */
export function isEmpty(obj: object | null | undefined): boolean {
  if (obj == null) return true;
  return Object.keys(obj).length === 0;
}

/** Deep equality check. */
export function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => isEqual(v, b[i]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(k => isEqual(a[k], (b as Record<string, unknown>)[k]));
  }
  return false;
}

/**
 * Flattens a nested object to a single depth using `delimiter` as key separator.
 * @example flattenObject({ a: { b: 1 } }) → { 'a.b': 1 }
 */
export function flattenObject(
  obj: Record<string, unknown>,
  delimiter = '.',
  prefix = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}${delimiter}${key}` : key;
    const value = obj[key];
    if (isPlainObject(value)) {
      Object.assign(result, flattenObject(value, delimiter, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

/**
 * Converts a flat object with delimiter-separated keys back to a nested object.
 * @example unflattenObject({ 'a.b': 1 }) → { a: { b: 1 } }
 */
export function unflattenObject(
  obj: Record<string, unknown>,
  delimiter = '.'
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const flatKey in obj) {
    const parts = flatKey.split(delimiter);
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!isPlainObject(current[part])) current[part] = {};
      current = current[part] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = obj[flatKey];
  }
  return result;
}

/** Serializes an object to a URL query string (excludes null/undefined values). */
export function toQueryString(obj: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value != null) params.append(key, String(value));
  }
  return params.toString();
}

/** Parses a URL query string into a key-value map. */
export function fromQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString);
  const result: Record<string, string> = {};
  params.forEach((value, key) => { result[key] = value; });
  return result;
}

/**
 * Gets a deeply nested value by dot-path string.
 * @example getPath({ a: { b: 2 } }, 'a.b') → 2
 */
export function getPath<T = unknown>(
  obj: Record<string, unknown>,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return defaultValue;
    current = (current as Record<string, unknown>)[key];
  }
  return (current as T) ?? defaultValue;
}

/**
 * Sets a deeply nested value by dot-path string (mutates the object).
 * @example setPath(obj, 'a.b', 42)
 */
export function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!isPlainObject(current[key])) current[key] = {};
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

/** Returns true if a dot-path resolves to a defined value. */
export function hasPath(obj: Record<string, unknown>, path: string): boolean {
  return getPath(obj, path) !== undefined;
}

/** Applies a mapping function to every value in an object. */
export function mapValues<T, R>(
  obj: Record<string, T>,
  fn: (value: T, key: string) => R
): Record<string, R> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v, k)]));
}

/** Returns a new object containing only entries where the predicate returns true. */
export function filterValues<T>(
  obj: Record<string, T>,
  fn: (value: T, key: string) => boolean
): Record<string, T> {
  return Object.fromEntries(Object.entries(obj).filter(([k, v]) => fn(v, k)));
}

/** Swaps keys and values in an object (both must be strings). */
export function invertObject(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));
}

/** Returns a new object with keys sorted alphabetically. */
export function sortByKey<T>(obj: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Returns the keys of obj2 whose values differ from obj1 (shallow comparison).
 * Useful for detecting changed form fields.
 */
export function diff<T extends Record<string, unknown>>(obj1: T, obj2: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj2) {
    if (obj1[key] !== obj2[key]) {
      result[key] = obj2[key];
    }
  }
  return result;
}

/** Returns the number of own enumerable keys. */
export function size(obj: object): number {
  return Object.keys(obj).length;
}

/** Returns true if `obj` has the given own enumerable key. */
export function hasKey<T extends object>(obj: T, key: PropertyKey): key is keyof T {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
