/**
 * Small seeded pseudo-random number generator (mulberry32).
 * Every random choice in the game goes through a function returned by
 * createRng so tests can replay exact sequences.
 */

/**
 * @typedef {() => number} Rng A function returning a float in [0, 1).
 */

/**
 * Creates a deterministic random number generator.
 * @param {number} seed Any integer; the same seed always yields the same sequence.
 * @returns {Rng}
 */
export function createRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Picks one element of a non-empty array.
 * @template T
 * @param {Rng} rng
 * @param {readonly T[]} items
 * @returns {T}
 */
export function pick(rng, items) {
  if (items.length === 0) throw new RangeError('pick() needs at least one item');
  return items[Math.floor(rng() * items.length)];
}
