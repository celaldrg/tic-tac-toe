/**
 * Pure keyboard mapping for the 3x3 grid (no DOM access).
 * Digits follow the numeric keypad: 7 8 9 is the top row, 1 2 3 the bottom.
 */

/** @typedef {'up'|'down'|'left'|'right'} Direction */

/** Numpad digit -> cell index (row by row from the top-left). */
const NUMPAD_TO_CELL = Object.freeze({ 7: 0, 8: 1, 9: 2, 4: 3, 5: 4, 6: 5, 1: 6, 2: 7, 3: 8 });

/** Arrow key name -> direction. */
const ARROW_KEYS = Object.freeze({ ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' });

/**
 * Maps a pressed digit key to a cell using the numeric keypad layout.
 * @param {string} key A KeyboardEvent.key value such as "7".
 * @returns {number|null} Cell index, or null when the key is not 1-9.
 */
export function digitToCell(key) {
  return /^[1-9]$/.test(key) ? NUMPAD_TO_CELL[key] : null;
}

/**
 * Maps an arrow key name to a direction.
 * @param {string} key A KeyboardEvent.key value.
 * @returns {Direction|null}
 */
export function arrowDirection(key) {
  return Object.hasOwn(ARROW_KEYS, key) ? ARROW_KEYS[key] : null;
}

/**
 * Moves the keyboard cursor one cell, stopping at the board edges.
 * @param {number} cell Current cell 0-8.
 * @param {Direction} direction
 * @returns {number} The new cell (unchanged at an edge).
 */
export function moveCursor(cell, direction) {
  const row = Math.floor(cell / 3);
  const col = cell % 3;
  switch (direction) {
    case 'up': return row > 0 ? cell - 3 : cell;
    case 'down': return row < 2 ? cell + 3 : cell;
    case 'left': return col > 0 ? cell - 1 : cell;
    case 'right': return col < 2 ? cell + 1 : cell;
    default: return cell;
  }
}
