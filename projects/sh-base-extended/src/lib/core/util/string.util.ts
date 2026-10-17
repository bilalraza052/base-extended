// ─── String Utilities ────────────────────────────────────────────────────────

/** Returns true if the value is null, undefined, or an empty string. */
export function isEmpty(str: string | null | undefined): boolean {
  return str == null || str.length === 0;
}

/** Returns true if the value is null, undefined, empty, or whitespace only. */
export function isBlank(str: string | null | undefined): boolean {
  return str == null || str.trim().length === 0;
}

/** Capitalizes the first letter; lowercases the rest. */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/** Converts each word's first letter to uppercase. */
export function titleCase(str: string): string {
  return str.replace(/\w\S*/g, word => capitalize(word));
}

/** Converts a string to camelCase. */
export function camelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char: string) => char.toUpperCase())
    .replace(/^[A-Z]/, c => c.toLowerCase());
}

/** Converts a string to PascalCase. */
export function pascalCase(str: string): string {
  const cc = camelCase(str);
  return cc.charAt(0).toUpperCase() + cc.slice(1);
}

/** Converts a string to snake_case. */
export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s\-]+/g, '_')
    .toLowerCase();
}

/** Converts a string to kebab-case. */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/** Truncates a string to the given length, appending a suffix if cut. */
export function truncate(str: string, length: number, suffix = '...'): string {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

/** Removes all HTML tags from a string. */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/** Escapes HTML special characters. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Unescapes HTML entities back to characters. */
export function unescapeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

/** Converts a string to a URL-friendly slug. */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Counts the number of words in a string. */
export function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

/** Extracts initials from a name (up to `maxLetters`). */
export function initials(name: string, maxLetters = 2): string {
  return name
    .split(/\s+/)
    .slice(0, maxLetters)
    .map(w => w.charAt(0).toUpperCase())
    .join('');
}

/** Case-insensitive containment check. */
export function contains(str: string, search: string): boolean {
  return str.toLowerCase().includes(search.toLowerCase());
}

/**
 * Replaces `{{key}}` placeholders in a template with values from the map.
 * @example format('Hello {{name}}', { name: 'World' }) → 'Hello World'
 */
export function format(template: string, values: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    key in values ? String(values[key]) : `{{${key}}}`
  );
}

/** Repeats a string `times` times. */
export function repeat(str: string, times: number): string {
  return str.repeat(Math.max(0, times));
}

/** Reverses the characters of a string. */
export function reverseString(str: string): string {
  return [...str].reverse().join('');
}

/** Counts non-overlapping occurrences of `search` in `str`. */
export function countOccurrences(str: string, search: string): number {
  if (!search) return 0;
  return str.split(search).length - 1;
}

/** Removes characters not in `[a-zA-Z0-9]` plus anything in `preserve`. */
export function removeSpecialChars(str: string, preserve = ''): string {
  const escaped = preserve.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  return str.replace(new RegExp(`[^a-zA-Z0-9${escaped}]`, 'g'), '');
}

/**
 * Masks part of a string, keeping `visibleChars` visible at the end.
 * @example mask('4111111111111234', 4) → '************1234'
 */
export function mask(str: string, visibleChars = 4, maskChar = '*'): string {
  if (str.length <= visibleChars) return str;
  return maskChar.repeat(str.length - visibleChars) + str.slice(-visibleChars);
}

/** Parses common truthy strings ("true", "yes", "1", "on") to boolean. */
export function toBoolean(str: string): boolean {
  return ['true', 'yes', '1', 'on'].includes(str.trim().toLowerCase());
}

/** Pads the start of a string. */
export function padStart(str: string, length: number, padChar = ' '): string {
  return str.padStart(length, padChar);
}

/** Pads the end of a string. */
export function padEnd(str: string, length: number, padChar = ' '): string {
  return str.padEnd(length, padChar);
}

/** Generates a random alphanumeric string of the given length. */
export function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

/** Removes all whitespace from a string. */
export function removeWhitespace(str: string): string {
  return str.replace(/\s+/g, '');
}

/** Checks if a string is a palindrome (case- and space-insensitive). */
export function isPalindrome(str: string): boolean {
  const normalized = str.toLowerCase().replace(/\s+/g, '');
  return normalized === [...normalized].reverse().join('');
}

/** Wraps a string at `width` characters, splitting on spaces where possible. */
export function wordWrap(str: string, width: number): string {
  const words = str.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + (current ? ' ' : '') + word).length <= width) {
      current += (current ? ' ' : '') + word;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.join('\n');
}
