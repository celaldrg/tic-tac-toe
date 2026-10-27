/**
 * Pure geometry for the SVG drawings. The board overlay uses a
 * 300x300 viewBox where every cell is a 100x100 square.
 */

/** Width of one cell in board units. */
const CELL_UNITS = 100;

/** Outline of each mark inside a 100x100 viewBox (paths, so pathLength works everywhere). */
export const MARK_PATHS = Object.freeze({
  X: Object.freeze(['M27 27 L73 73', 'M73 27 L27 73']),
  O: Object.freeze(['M50 23 A27 27 0 1 1 50 77 A27 27 0 1 1 50 23']),
});

/**
 * Centre of a cell in board units.
 * @param {number} cell 0-8, row by row.
 * @returns {{ x: number, y: number }}
 */
export function cellCenter(cell) {
  return {
    x: (cell % 3) * CELL_UNITS + CELL_UNITS / 2,
    y: Math.floor(cell / 3) * CELL_UNITS + CELL_UNITS / 2,
  };
}

/**
 * SVG path data for the strike-through of a winning line, running from the
 * first to the last cell centre and extended a little past both ends.
 * @param {readonly number[]} line Three cell indexes in board order.
 * @param {number} [overshoot] Extra length on each end, in board units.
 * @returns {string} For example "M20 50 L280 50".
 */
export function winLinePath(line, overshoot = 30) {
  const start = cellCenter(line[0]);
  const end = cellCenter(line[line.length - 1]);
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  const ux = (end.x - start.x) / length;
  const uy = (end.y - start.y) / length;
  const round = (value) => Math.round(value * 100) / 100;
  return `M${round(start.x - ux * overshoot)} ${round(start.y - uy * overshoot)} `
    + `L${round(end.x + ux * overshoot)} ${round(end.y + uy * overshoot)}`;
}
