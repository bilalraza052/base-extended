// ─── Storage Utilities ───────────────────────────────────────────────────────
// Values are JSON-serialized before storage and deserialized on retrieval.

// ── Local Storage ────────────────────────────────────────────────────────────

/** Serializes `value` and writes it to localStorage. */
export function setLocal(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded or private browsing — silently ignore */
  }
}

/** Reads and deserializes a value from localStorage. Returns null if absent or invalid. */
export function getLocal<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item !== null ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
}

/** Removes a key from localStorage. */
export function removeLocal(key: string): void {
  localStorage.removeItem(key);
}

/** Clears all entries from localStorage. */
export function clearLocal(): void {
  localStorage.clear();
}

/** Returns true if the key exists in localStorage. */
export function hasLocal(key: string): boolean {
  return localStorage.getItem(key) !== null;
}

/** Returns all keys currently in localStorage. */
export function localKeys(): string[] {
  return Object.keys(localStorage);
}

// ── Session Storage ───────────────────────────────────────────────────────────

/** Serializes `value` and writes it to sessionStorage. */
export function setSession(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

/** Reads and deserializes a value from sessionStorage. Returns null if absent or invalid. */
export function getSession<T>(key: string): T | null {
  try {
    const item = sessionStorage.getItem(key);
    return item !== null ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
}

/** Removes a key from sessionStorage. */
export function removeSession(key: string): void {
  sessionStorage.removeItem(key);
}

/** Clears all entries from sessionStorage. */
export function clearSession(): void {
  sessionStorage.clear();
}

/** Returns true if the key exists in sessionStorage. */
export function hasSession(key: string): boolean {
  return sessionStorage.getItem(key) !== null;
}

/** Returns all keys currently in sessionStorage. */
export function sessionKeys(): string[] {
  return Object.keys(sessionStorage);
}

// ── Cookies ──────────────────────────────────────────────────────────────────

/**
 * Sets a cookie.
 * @param days - Expiry in days. Omit or pass 0 for a session cookie.
 * @param path - Cookie path (default '/').
 */
export function setCookie(name: string, value: string, days?: number, path = '/'): void {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 86_400_000);
    expires = `; expires=${date.toUTCString()}`;
  }
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; path=${path}; SameSite=Lax`;
}

/** Returns the decoded cookie value, or null if not found. */
export function getCookie(name: string): string | null {
  const key = `${encodeURIComponent(name)}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trimStart();
    if (trimmed.startsWith(key)) {
      return decodeURIComponent(trimmed.slice(key.length));
    }
  }
  return null;
}

/** Removes a cookie by setting its expiry to the past. */
export function removeCookie(name: string, path = '/'): void {
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
}

/** Returns all current cookies as a key-value map (both decoded). */
export function getAllCookies(): Record<string, string> {
  return document.cookie
    .split(';')
    .reduce<Record<string, string>>((acc, part) => {
      const [k, ...rest] = part.trim().split('=');
      if (k) acc[decodeURIComponent(k)] = decodeURIComponent(rest.join('='));
      return acc;
    }, {});
}

/** Returns true if the cookie exists. */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}
