/**
 * Pure board helpers for a 3x3 grid. A board is an array of 9 cells,
 * indexed row by row (0 = top-left, 8 = bottom-right), each 'X', 'O' or null.
 */

/** @typedef {'X'|'O'} Mark */
/** @typedef {ReadonlyArray<Mark|null>} Board */
/** @typedef {{ winner: Mark, line: number[] }} Win */

/** Every winning line: three rows, three columns, two diagonals. */
export const LINES = Object.freeze([
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
].map((line) => Object.freeze(line)));

/**
 * Returns a new empty board.
 * @returns {(Mark|null)[]}
 */
export function emptyBoard() {
  return Array(9).fill(null);
}

/**
 * Returns the opposing mark.
 * @param {Mark} mark
 * @returns {Mark}
 */
export function otherMark(mark) {
  return mark === 'X' ? 'O' : 'X';
}

/**
 * Lists the indexes of all empty cells in ascending order.
 * @param {Board} board
 * @returns {number[]}
 */
export function emptyCells(board) {
  const cells = [];
  board.forEach((cell, index) => {
    if (cell === null) cells.push(index);
  });
  return cells;
}

/**
 * Whose turn it is, assuming X always moves first.
 * @param {Board} board
 * @returns {Mark}
 */
export function turnOf(board) {
  const xs = board.filter((cell) => cell === 'X').length;
  const os = board.filter((cell) => cell === 'O').length;
  return xs === os ? 'X' : 'O';
}

/**
 * Returns a copy of the board with `mark` placed on `cell`.
 * @param {Board} board
 * @param {number} cell
 * @param {Mark} mark
 * @returns {(Mark|null)[]}
 */
export function placeMark(board, cell, mark) {
  if (!Number.isInteger(cell) || cell < 0 || cell > 8) throw new RangeError(`Invalid cell ${cell}`);
  if (board[cell] !== null) throw new Error(`Cell ${cell} is already taken`);
  const next = board.slice();
  next[cell] = mark;
  return next;
}

/**
 * Finds a completed line, if any.
 * @param {Board} board
 * @returns {Win|null} The winning mark and the three cells of its line.
 */
export function findWinner(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] !== null && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return null;
}

/**
 * True when the board is full and nobody has won.
 * @param {Board} board
 * @returns {boolean}
 */
export function isDraw(board) {
  return board.every((cell) => cell !== null) && findWinner(board) === null;
}

/**
 * Cells where `mark` would complete a line with its next move.
 * @param {Board} board
 * @param {Mark} mark
 * @returns {number[]} Ascending, without duplicates.
 */
export function winningCells(board, mark) {
  const cells = new Set();
  for (const line of LINES) {
    const marks = line.filter((cell) => board[cell] === mark).length;
    const empty = line.filter((cell) => board[cell] === null);
    if (marks === 2 && empty.length === 1) cells.add(empty[0]);
  }
  return [...cells].sort((a, b) => a - b);
}
