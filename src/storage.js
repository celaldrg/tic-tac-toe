/**
 * The only module that touches localStorage. Every access is wrapped in
 * try/catch so private mode, blocked storage or quota errors never crash
 * the game; reads simply fall back to a default.
 * Keys are prefixed because every project on the same GitHub Pages origin
 * shares one localStorage.
 */

const PREFIX = 'tic-tac-toe:';

/**
 * The browser's localStorage, or null when it is missing or blocked.
 * @returns {Storage|null}
 */
function defaultBackend() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * Reads and parses a stored JSON value.
 * @template T
 * @param {string} key Key without the project prefix.
 * @param {T} fallback Returned when nothing is stored or reading fails.
 * @param {Pick<Storage, 'getItem'>|null} [backend] Defaults to localStorage; tests inject a fake.
 * @returns {unknown|T} The parsed value (callers validate it) or `fallback`.
 */
export function readJSON(key, fallback, backend = defaultBackend()) {
  try {
    const raw = backend ? backend.getItem(PREFIX + key) : null;
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Serialises and stores a value.
 * @param {string} key Key without the project prefix.
 * @param {unknown} value Anything JSON.stringify accepts.
 * @param {Pick<Storage, 'setItem'>|null} [backend] Defaults to localStorage; tests inject a fake.
 * @returns {boolean} True when the value was saved.
 */
export function writeJSON(key, value, backend = defaultBackend()) {
  try {
    if (!backend) return false;
    backend.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
