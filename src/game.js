/**
 * Pure, immutable game state for one match (a series of rounds with a
 * running scoreboard). Every function returns a new state object and never
 * touches the DOM, timers or storage, so the UI simply re-renders the result.
 */

import { DIFFICULTIES, chooseMove } from './ai.js';
import { emptyBoard, findWinner, isDraw, otherMark, placeMark } from './board.js';

/** @typedef {import('./board.js').Mark} Mark */
/** @typedef {import('./ai.js').Difficulty} Difficulty */
/** @typedef {import('./rng.js').Rng} Rng */
/** @typedef {'ai'|'pvp'} Mode */
/** @typedef {'playing'|'won'|'draw'} Status */
/** @typedef {{ mode: Mode, humanMark: Mark, difficulty: Difficulty }} GameOptions */
/** @typedef {{ x: number, o: number, draws: number }} Score */
/**
 * @typedef {object} GameState
 * @property {(Mark|null)[]} board 9 cells, row by row.
 * @property {Mark} turn Side to move next (X always opens a round).
 * @property {Status} status
 * @property {Mark|null} winner
 * @property {number[]|null} line The three winning cells, when won.
 * @property {number|null} lastMove Cell filled by the most recent move.
 * @property {Score} score Totals across rounds, including this one once it ends.
 * @property {GameOptions} options
 */

/** Settings used when nothing (valid) was chosen yet. */
export const DEFAULT_OPTIONS = Object.freeze({ mode: 'ai', humanMark: 'X', difficulty: 'medium' });

/**
 * Coerces untrusted input (e.g. parsed from storage) into valid options.
 * @param {unknown} raw
 * @returns {GameOptions}
 */
export function normalizeOptions(raw) {
  const source = raw !== null && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {};
  return {
    mode: source.mode === 'pvp' ? 'pvp' : 'ai',
    humanMark: source.humanMark === 'O' ? 'O' : 'X',
    difficulty: DIFFICULTIES.includes(/** @type {Difficulty} */ (source.difficulty))
      ? /** @type {Difficulty} */ (source.difficulty)
      : DEFAULT_OPTIONS.difficulty,
  };
}

/**
 * Coerces untrusted input into a scoreboard of non-negative integers.
 * @param {unknown} raw
 * @returns {Score}
 */
export function normalizeScore(raw) {
  const source = raw !== null && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {};
  const count = (value) => (Number.isSafeInteger(value) && value > 0 ? value : 0);
  return { x: count(source.x), o: count(source.o), draws: count(source.draws) };
}

/**
 * Starts a fresh round.
 * @param {Partial<GameOptions>} [options]
 * @param {Score} [score] Scoreboard to carry over; zeros when omitted.
 * @returns {GameState}
 */
export function createGame(options = {}, score = { x: 0, o: 0, draws: 0 }) {
  return {
    board: emptyBoard(),
    turn: 'X',
    status: 'playing',
    winner: null,
    line: null,
    lastMove: null,
    score: normalizeScore(score),
    options: normalizeOptions({ ...DEFAULT_OPTIONS, ...options }),
  };
}

/**
 * Starts the next round of the same match, keeping options and score.
 * @param {GameState} state
 * @returns {GameState}
 */
export function nextRound(state) {
  return createGame(state.options, state.score);
}

/**
 * Zeroes the scoreboard without touching the round in progress.
 * @param {GameState} state
 * @returns {GameState}
 */
export function resetScore(state) {
  return { ...state, score: { x: 0, o: 0, draws: 0 } };
}

/**
 * True when the computer should move now.
 * @param {GameState} state
 * @returns {boolean}
 */
export function isAiTurn(state) {
  return state.status === 'playing' && state.options.mode === 'ai' && state.turn !== state.options.humanMark;
}

/**
 * True when a human may place a mark on `cell` right now.
 * @param {GameState} state
 * @param {number} cell
 * @returns {boolean}
 */
export function canPlay(state, cell) {
  return state.status === 'playing'
    && !isAiTurn(state)
    && Number.isInteger(cell) && cell >= 0 && cell <= 8
    && state.board[cell] === null;
}

/**
 * Places the side-to-move's mark and resolves wins, draws and the score.
 * @param {GameState} state
 * @param {number} cell Must be empty and the round must be in progress.
 * @returns {GameState}
 */
function applyMove(state, cell) {
  const board = placeMark(state.board, cell, state.turn);
  const win = findWinner(board);
  const base = { ...state, board, lastMove: cell, turn: otherMark(state.turn) };
  if (win) {
    const key = win.winner === 'X' ? 'x' : 'o';
    return { ...base, status: 'won', winner: win.winner, line: win.line, score: { ...state.score, [key]: state.score[key] + 1 } };
  }
  if (isDraw(board)) {
    return { ...base, status: 'draw', score: { ...state.score, draws: state.score.draws + 1 } };
  }
  return base;
}

/**
 * A human move. Illegal input (taken cell, finished round, computer's turn)
 * returns the same state object unchanged, so callers can compare by identity.
 * @param {GameState} state
 * @param {number} cell 0-8, row by row.
 * @returns {GameState}
 */
export function play(state, cell) {
  return canPlay(state, cell) ? applyMove(state, cell) : state;
}

/**
 * Lets the computer move. Returns the same state when it is not its turn.
 * @param {GameState} state
 * @param {Rng} rng Seeded random source used for tie-breaks and weaker levels.
 * @returns {GameState}
 */
export function aiMove(state, rng) {
  if (!isAiTurn(state)) return state;
  return applyMove(state, chooseMove(state.board, state.turn, state.options.difficulty, rng));
}

/** Opening used by the ?demo screenshot: X centre, O corner, X opposite corner, O corner. */
const DEMO_MOVES = [4, 0, 8, 2];

/**
 * A fixed, good-looking position for the README screenshot: four marks,
 * X (the human) to move, and a non-zero scoreboard.
 * @returns {GameState}
 */
export function createDemoState() {
  const start = createGame({ mode: 'ai', humanMark: 'X', difficulty: 'medium' }, { x: 3, o: 2, draws: 4 });
  return DEMO_MOVES.reduce(applyMove, start);
}
