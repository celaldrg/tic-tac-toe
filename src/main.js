/**
 * Browser entry point. Owns the current GameState, wires pointer and
 * keyboard input, schedules the computer's moves and saves settings,
 * score and language through the storage helper.
 */

import {
  aiMove, createDemoState, createGame, isAiTurn, nextRound, normalizeOptions, normalizeScore, play, resetScore,
} from './game.js';
import { normalizeLang, otherLang, translate } from './i18n.js';
import { arrowDirection, digitToCell, moveCursor } from './input.js';
import { createRng } from './rng.js';
import { readJSON, writeJSON } from './storage.js';
import { applyLanguage, cellFromEvent, createView, focusCell, renderGame } from './view.js';

/** Pause before the computer answers, so its move is easy to follow. */
const AI_DELAY_MS = 420;

/** Seed used by ?demo so the screenshot is identical on every run. */
const DEMO_SEED = 2026;

/** Centre cell: where the keyboard cursor starts. */
const START_CURSOR = 4;

const demo = new URLSearchParams(window.location.search).has('demo');
const rng = createRng(demo ? DEMO_SEED : Date.now());
const view = createView(document);

let lang = normalizeLang(readJSON('lang', null));
let state = demo
  ? createDemoState()
  : createGame(normalizeOptions(readJSON('options', null)), normalizeScore(readJSON('score', null)));
let cursor = START_CURSOR;
let aiTimer = 0;

/**
 * Translates a key in the current language.
 * @param {string} key
 * @param {Record<string, string|number>} [params]
 * @returns {string}
 */
function t(key, params) {
  return translate(lang, key, params);
}

function render() {
  renderGame(view, state, t, cursor);
}

/** Starts (or cancels) the computer's delayed reply. */
function scheduleAi() {
  window.clearTimeout(aiTimer);
  if (isAiTurn(state)) aiTimer = window.setTimeout(() => update(aiMove(state, rng)), AI_DELAY_MS);
}

/**
 * Replaces the state, saves the score, redraws and lets the computer move.
 * When a round ends while the board has focus, focus jumps to "Next round"
 * so keyboard players can continue with Enter.
 * @param {import('./game.js').GameState} next
 */
function update(next) {
  if (next === state) return;
  const boardHadFocus = view.board.contains(document.activeElement);
  state = next;
  if (!demo) writeJSON('score', state.score);
  render();
  scheduleAi();
  if (state.status !== 'playing' && boardHadFocus) view.nextRound.focus();
}

/**
 * A human move on `cell`; illegal moves are ignored.
 * @param {number} cell
 */
function playCell(cell) {
  cursor = cell;
  const next = play(state, cell);
  if (next === state) render();
  else update(next);
}

/**
 * Applies a settings change and starts a fresh round with it.
 * @param {Partial<import('./game.js').GameOptions>} patch
 */
function changeOptions(patch) {
  const options = normalizeOptions({ ...state.options, ...patch });
  if (JSON.stringify(options) === JSON.stringify(state.options)) return;
  if (!demo) writeJSON('options', options);
  update(createGame(options, state.score));
}

function toggleLanguage() {
  lang = otherLang(lang);
  writeJSON('lang', lang);
  applyLanguage(view, lang, t);
  render();
}

/** Mouse, pen and touch: play as soon as the pointer goes down. */
function onBoardPointerDown(event) {
  if (event.button !== 0) return;
  const cell = cellFromEvent(event);
  if (cell !== null) playCell(cell);
}

/** Enter / Space on a focused cell (keyboard clicks have detail 0). */
function onBoardClick(event) {
  if (event.detail !== 0) return;
  const cell = cellFromEvent(event);
  if (cell !== null) playCell(cell);
}

/** Keeps the roving tab stop on whichever cell received focus. */
function onBoardFocusIn(event) {
  const cell = cellFromEvent(event);
  if (cell === null || cell === cursor) return;
  cursor = cell;
  render();
}

/**
 * Digits 1-9 (numpad layout) play a cell; arrows move the cursor.
 * @param {KeyboardEvent} event
 */
function onKeyDown(event) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const cell = digitToCell(event.key);
  if (cell !== null) {
    event.preventDefault();
    playCell(cell);
    if (state.status === 'playing') focusCell(view, cursor);
    else view.nextRound.focus();
    return;
  }
  const direction = arrowDirection(event.key);
  if (direction === null) return;
  const inBoard = view.board.contains(document.activeElement);
  if (!inBoard && document.activeElement !== document.body) return;
  event.preventDefault();
  if (inBoard) cursor = moveCursor(cursor, direction);
  render();
  focusCell(view, cursor);
}

view.board.addEventListener('pointerdown', onBoardPointerDown);
view.board.addEventListener('click', onBoardClick);
view.board.addEventListener('focusin', onBoardFocusIn);
document.addEventListener('keydown', onKeyDown);

view.newGame.addEventListener('click', () => update(createGame(state.options, state.score)));
view.nextRound.addEventListener('click', () => {
  update(nextRound(state));
  focusCell(view, cursor);
});
view.resetScore.addEventListener('click', () => update(resetScore(state)));
view.langToggle.addEventListener('click', toggleLanguage);
view.settings.addEventListener('click', (event) => {
  const button = event.target instanceof Element ? event.target.closest('button[data-option]') : null;
  if (button) changeOptions({ [button.dataset.option]: button.dataset.value });
});

applyLanguage(view, lang, t);
render();
scheduleAi();
