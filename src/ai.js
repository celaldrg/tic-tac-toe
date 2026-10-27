/**
 * Computer opponent. "impossible" is a perfect minimax search with
 * alpha-beta pruning that prefers faster wins and slower losses;
 * "easy" and "medium" deliberately leave room to win.
 */

import { emptyCells, findWinner, otherMark, placeMark, winningCells } from './board.js';
import { pick } from './rng.js';

/** @typedef {import('./board.js').Board} Board */
/** @typedef {import('./board.js').Mark} Mark */
/** @typedef {import('./rng.js').Rng} Rng */
/** @typedef {'easy'|'medium'|'impossible'} Difficulty */

/** Supported difficulty levels, from weakest to strongest. */
export const DIFFICULTIES = Object.freeze(['easy', 'medium', 'impossible']);

/** Chance that "medium" plays the perfect move once nothing is urgent. */
const MEDIUM_PERFECT_CHANCE = 0.5;

/** Base score of a won game; the search depth is subtracted so quicker wins rank higher. */
const WIN_SCORE = 10;

/** Centre first, then corners, then edges: lets alpha-beta cut off sooner. */
const SEARCH_ORDER = [4, 0, 2, 6, 8, 1, 3, 5, 7];

/**
 * Minimax value of `board` from `aiMark`'s point of view.
 * @param {Board} board
 * @param {Mark} toMove
 * @param {Mark} aiMark
 * @param {number} depth Plies played since the root position.
 * @param {number} alpha
 * @param {number} beta
 * @returns {number}
 */
function minimax(board, toMove, aiMark, depth, alpha, beta) {
  const win = findWinner(board);
  if (win) return win.winner === aiMark ? WIN_SCORE - depth : depth - WIN_SCORE;
  if (!board.includes(null)) return 0;
  const maximizing = toMove === aiMark;
  let best = maximizing ? -Infinity : Infinity;
  for (const cell of SEARCH_ORDER) {
    if (board[cell] !== null) continue;
    const score = minimax(placeMark(board, cell, toMove), otherMark(toMove), aiMark, depth + 1, alpha, beta);
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (alpha >= beta) break;
  }
  return best;
}

/**
 * Exact minimax score of every legal move for `mark`
 * (positive = forced win, 0 = draw, negative = forced loss; larger is better).
 * @param {Board} board
 * @param {Mark} mark The side to move.
 * @returns {{ cell: number, score: number }[]} Empty when the game is already over.
 */
export function scoreMoves(board, mark) {
  if (findWinner(board)) return [];
  return emptyCells(board).map((cell) => ({
    cell,
    score: minimax(placeMark(board, cell, mark), otherMark(mark), mark, 1, -Infinity, Infinity),
  }));
}

/**
 * The moves that share the best minimax score. Ties go to moves that block
 * an immediate threat: after a fork every reply loses equally fast, and a
 * block at least makes the opponent find the other winning cell.
 * @param {Board} board
 * @param {Mark} mark The side to move.
 * @returns {number[]} Ascending cell indexes; empty when the game is over.
 */
export function bestMoves(board, mark) {
  const scored = scoreMoves(board, mark);
  const top = Math.max(...scored.map((move) => move.score));
  const best = scored.filter((move) => move.score === top).map((move) => move.cell);
  const threats = winningCells(board, otherMark(mark));
  const blocks = best.filter((cell) => threats.includes(cell));
  return blocks.length > 0 ? blocks : best;
}

/**
 * Easy play: complete a line when possible, otherwise any random cell.
 * @param {Board} board
 * @param {Mark} mark
 * @param {Rng} rng
 * @returns {number}
 */
function easyMove(board, mark, rng) {
  const wins = winningCells(board, mark);
  return pick(rng, wins.length > 0 ? wins : emptyCells(board));
}

/**
 * Medium play: win, else block, else a coin flip between perfect and random.
 * @param {Board} board
 * @param {Mark} mark
 * @param {Rng} rng
 * @returns {number}
 */
function mediumMove(board, mark, rng) {
  const wins = winningCells(board, mark);
  if (wins.length > 0) return pick(rng, wins);
  const threats = winningCells(board, otherMark(mark));
  if (threats.length > 0) return pick(rng, threats);
  if (rng() < MEDIUM_PERFECT_CHANCE) return pick(rng, bestMoves(board, mark));
  return pick(rng, emptyCells(board));
}

/**
 * Picks the computer's next cell for the given difficulty.
 * Ties between equally good cells are broken with `rng`, so a seeded rng
 * makes the choice reproducible.
 * @param {Board} board
 * @param {Mark} mark The side the computer plays; it must be this side's turn.
 * @param {Difficulty} difficulty
 * @param {Rng} rng
 * @returns {number} Index of an empty cell.
 */
export function chooseMove(board, mark, difficulty, rng) {
  if (findWinner(board) || emptyCells(board).length === 0) throw new Error('The game is already over');
  switch (difficulty) {
    case 'easy':
      return easyMove(board, mark, rng);
    case 'medium':
      return mediumMove(board, mark, rng);
    case 'impossible':
      return pick(rng, bestMoves(board, mark));
    default:
      throw new RangeError(`Unknown difficulty "${difficulty}"`);
  }
}
