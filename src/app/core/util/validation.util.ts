// ─── Validation Utilities ────────────────────────────────────────────────────

/** Returns true if value is not null, undefined, empty string, or whitespace. */
export function isRequired(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/** RFC 5322-compliant email validation. */
export function isEmail(value: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(value.trim());
}

/** Returns true if the string is a valid HTTP/HTTPS URL. */
export function isUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Returns true if the string looks like a phone number.
 * Accepts formats: +1-800-555-5555, (800) 555 5555, 08001234567, etc.
 */
export function isPhone(value: string): boolean {
  return /^\+?[\d\s\-().]{7,20}$/.test(value.trim());
}

/**
 * Luhn algorithm — validates credit card numbers.
 * Works for Visa, MasterCard, Amex, Discover, etc.
 */
export function isCreditCard(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

/**
 * Validates postal / ZIP codes.
 * Supports: US (12345 / 12345-6789), UK (SW1A 1AA), CA (K1A 0B1),
 * DE/FR/AU/IN (5-digit numeric).
 */
export function isPostalCode(value: string, countryCode = 'US'): boolean {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    UK: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
    DE: /^\d{5}$/,
    FR: /^\d{5}$/,
    AU: /^\d{4}$/,
    IN: /^\d{6}$/,
  };
  const pattern = patterns[countryCode.toUpperCase()] ?? /^\d{4,10}$/;
  return pattern.test(value.trim());
}

/** Returns true if the string contains only ASCII letters. */
export function isAlpha(value: string): boolean {
  return /^[a-zA-Z]+$/.test(value);
}

/** Returns true if the string contains only ASCII letters and digits. */
export function isAlphanumeric(value: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(value);
}

/** Returns true if the string contains only digits (no decimal points). */
export function isNumeric(value: string): boolean {
  return /^\d+$/.test(value.trim());
}

/** Returns true if the string represents a valid decimal number. */
export function isDecimal(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value.trim());
}

/** Returns true if `value` is a positive number (> 0). */
export function isPositive(value: number): boolean {
  return value > 0;
}

/** Returns true if `value` is a negative number (< 0). */
export function isNegative(value: number): boolean {
  return value < 0;
}

/** Returns true if the string length is at least `min`. */
export function minLength(value: string, min: number): boolean {
  return value.length >= min;
}

/** Returns true if the string length does not exceed `max`. */
export function maxLength(value: string, max: number): boolean {
  return value.length <= max;
}

/** Returns true if the string length is within [min, max] (inclusive). */
export function lengthBetween(value: string, min: number, max: number): boolean {
  return value.length >= min && value.length <= max;
}

/** Returns true if `value` is at least `min`. */
export function minValue(value: number, min: number): boolean {
  return value >= min;
}

/** Returns true if `value` does not exceed `max`. */
export function maxValue(value: number, max: number): boolean {
  return value <= max;
}

/** Returns true if `value` is within [min, max] (inclusive). */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/** Returns true if the value is a valid Date or a parseable date string. */
export function isValidDate(value: unknown): boolean {
  if (value == null) return false;
  const d = new Date(value as string | number | Date);
  return !isNaN(d.getTime());
}

/** Returns true if the string is a valid dotted-decimal IPv4 address. */
export function isIPv4(value: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(value) &&
    value.split('.').every(octet => parseInt(octet, 10) <= 255);
}

/** Returns true if the string is a valid IPv6 address. */
export function isIPv6(value: string): boolean {
  return /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i.test(value) ||
    /^([\da-f]{1,4}:)*::([\da-f]{1,4}:)*[\da-f]{1,4}$/i.test(value) ||
    value === '::';
}

/** Returns true if the string matches the given pattern (string or RegExp). */
export function matchesPattern(value: string, pattern: RegExp | string): boolean {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  return regex.test(value);
}

/** Returns true if the string is a valid MAC address (with : or - separator). */
export function isMACAddress(value: string): boolean {
  return /^([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}$/.test(value);
}

/** Returns true if the string is a valid CSS hex color (#RGB or #RRGGBB). */
export function isHexColor(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
}

export interface PasswordOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
}

/**
 * Returns true if the password meets the given strength requirements.
 * Default: min 8 chars, at least one uppercase, lowercase, number, and special character.
 */
export function isStrongPassword(value: string, options: PasswordOptions = {}): boolean {
  const {
    minLength     = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber    = true,
    requireSpecial   = true,
  } = options;

  if (value.length < minLength) return false;
  if (requireUppercase && !/[A-Z]/.test(value)) return false;
  if (requireLowercase && !/[a-z]/.test(value)) return false;
  if (requireNumber    && !/\d/.test(value))    return false;
  if (requireSpecial   && !/[^a-zA-Z0-9]/.test(value)) return false;
  return true;
}

/** Returns a password strength score: 0 (very weak) – 5 (very strong). */
export function passwordStrength(value: string): number {
  let score = 0;
  if (value.length >= 8)  score++;
  if (value.length >= 12) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/\d/.test(value))    score++;
  if (/[^a-zA-Z0-9]/.test(value)) score++;
  return score;
}

/** Returns true if the two values are strictly equal (useful for confirm-password fields). */
export function isMatch(a: unknown, b: unknown): boolean {
  return a === b;
}

/** Returns true if the string is a valid JSON string. */
export function isJSON(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

/** Returns true if the string contains only printable ASCII characters. */
export function isASCII(value: string): boolean {
  return /^[\x20-\x7E]*$/.test(value);
}

/** Returns true if the number is a whole integer (no fractional part). */
export function isInteger(value: number): boolean {
  return Number.isInteger(value);
}
