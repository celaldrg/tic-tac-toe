/**
 * Pure helpers that decide which i18n string describes the game state.
 * They return translation keys and parameters, never DOM nodes.
 */

import { isAiTurn } from './game.js';

/** @typedef {import('./game.js').GameState} GameState */
/** @typedef {import('./game.js').GameOptions} GameOptions */
/** @typedef {import('./board.js').Mark} Mark */
/** @typedef {{ key: string, params: Record<string, string|number> }} Message */

/**
 * The status line for the current state.
 * @param {GameState} state
 * @returns {Message}
 */
export function statusMessage(state) {
  const vsAi = state.options.mode === 'ai';
  if (state.status === 'draw') return { key: 'statusDraw', params: {} };
  if (state.status === 'won') {
    if (!vsAi) return { key: 'statusWins', params: { mark: state.winner } };
    return { key: state.winner === state.options.humanMark ? 'statusYouWin' : 'statusAiWins', params: {} };
  }
  if (!vsAi) return { key: 'statusTurn', params: { mark: state.turn } };
  if (isAiTurn(state)) return { key: 'statusThinking', params: {} };
  return { key: 'statusYourTurn', params: { mark: state.turn } };
}

/**
 * Caption under a mark on the scoreboard: who plays that mark.
 * @param {GameOptions} options
 * @param {Mark} mark
 * @returns {'you'|'computer'|'player1'|'player2'}
 */
export function sideLabelKey(options, mark) {
  if (options.mode === 'ai') return mark === options.humanMark ? 'you' : 'computer';
  return mark === 'X' ? 'player1' : 'player2';
}

/**
 * Accessible name of a board cell, e.g. "Row 1, column 3: X".
 * @param {number} cell 0-8, row by row.
 * @param {Mark|null} mark
 * @returns {Message}
 */
export function cellMessage(cell, mark) {
  const params = { row: Math.floor(cell / 3) + 1, col: (cell % 3) + 1 };
  return mark ? { key: 'cellMark', params: { ...params, mark } } : { key: 'cellEmpty', params };
}
