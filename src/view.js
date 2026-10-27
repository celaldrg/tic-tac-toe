/**
 * DOM rendering. Reads the static markup of index.html, builds the nine
 * board cells and redraws everything from a GameState. Holds no game state
 * of its own beyond what is already painted.
 */

import { canPlay, isAiTurn } from './game.js';
import { cellMessage, sideLabelKey, statusMessage } from './labels.js';
import { MARK_PATHS, winLinePath } from './layout.js';

/** @typedef {import('./game.js').GameState} GameState */
/** @typedef {import('./board.js').Mark} Mark */
/** @typedef {import('./i18n.js').Lang} Lang */
/** @typedef {(key: string, params?: Record<string, string|number>) => string} Translate */

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * @typedef {object} View
 * @property {Document} doc
 * @property {HTMLElement} board
 * @property {HTMLButtonElement[]} cells
 * @property {SVGSVGElement} winLine
 * @property {SVGPathElement} winPath
 * @property {HTMLElement} status
 * @property {HTMLButtonElement} nextRound
 * @property {HTMLButtonElement} newGame
 * @property {HTMLButtonElement} langToggle
 * @property {HTMLButtonElement} resetScore
 * @property {HTMLElement} settings
 * @property {HTMLElement} markField
 * @property {HTMLElement} difficultyField
 * @property {Record<'X'|'O', HTMLElement>} cards
 * @property {Record<'x'|'o'|'draws', HTMLElement>} scores
 * @property {Record<'X'|'O', HTMLElement>} captions
 * @property {HTMLButtonElement[]} optionButtons
 */

/**
 * Finds the static elements and creates the board cells.
 * @param {Document} doc
 * @returns {View}
 */
export function createView(doc) {
  const byId = (id) => doc.getElementById(id);
  const view = {
    doc,
    board: byId('board'),
    cells: [],
    winLine: byId('win-line'),
    winPath: byId('win-path'),
    status: byId('status'),
    nextRound: byId('next-round'),
    newGame: byId('new-game'),
    langToggle: byId('lang-toggle'),
    resetScore: byId('reset-score'),
    settings: byId('settings'),
    markField: byId('mark-field'),
    difficultyField: byId('difficulty-field'),
    cards: { X: byId('card-x'), O: byId('card-o') },
    scores: { x: byId('score-x'), o: byId('score-o'), draws: byId('score-draws') },
    captions: { X: byId('caption-x'), O: byId('caption-o') },
    optionButtons: [...doc.querySelectorAll('button[data-option]')],
  };
  for (let cell = 0; cell < 9; cell += 1) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'cell';
    button.dataset.cell = String(cell);
    button.tabIndex = -1;
    view.board.append(button);
    view.cells.push(button);
  }
  return view;
}

/**
 * Draws one mark as an SVG whose strokes can animate in.
 * @param {Document} doc
 * @param {Mark} mark
 * @param {boolean} animate Only the newest mark animates.
 * @returns {SVGSVGElement}
 */
function createMarkSvg(doc, mark, animate) {
  const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', `mark mark-${mark.toLowerCase()}${animate ? ' is-new' : ''}`);
  for (const d of MARK_PATHS[mark]) {
    const path = doc.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('pathLength', '1');
    svg.append(path);
  }
  return svg;
}

/**
 * @param {View} view
 * @param {GameState} state
 * @param {Translate} t
 * @param {number} cursor Cell that owns the keyboard tab stop.
 */
function renderBoard(view, state, t, cursor) {
  view.board.classList.toggle('can-play', state.status === 'playing' && !isAiTurn(state));
  view.board.classList.toggle('is-over', state.status !== 'playing');
  view.cells.forEach((button, cell) => {
    const mark = state.board[cell];
    if ((button.dataset.mark ?? null) !== mark) {
      button.replaceChildren(...(mark ? [createMarkSvg(view.doc, mark, cell === state.lastMove)] : []));
      if (mark) button.dataset.mark = mark;
      else delete button.dataset.mark;
    }
    const inLine = state.line !== null && state.line.includes(cell);
    button.classList.toggle('is-win', inLine);
    button.classList.toggle('is-dim', state.status === 'won' && !inLine);
    button.tabIndex = cell === cursor ? 0 : -1;
    button.setAttribute('aria-disabled', String(!canPlay(state, cell)));
    const label = cellMessage(cell, mark);
    button.setAttribute('aria-label', t(label.key, label.params));
  });
}

/**
 * @param {View} view
 * @param {GameState} state
 */
function renderWinLine(view, state) {
  if (state.line) {
    view.winPath.setAttribute('d', winLinePath(state.line));
    view.winLine.dataset.mark = state.winner;
  }
  view.winLine.classList.toggle('is-shown', state.line !== null);
}

/**
 * @param {View} view
 * @param {GameState} state
 * @param {Translate} t
 */
function renderStatus(view, state, t) {
  const message = statusMessage(state);
  view.status.textContent = t(message.key, message.params);
  view.status.dataset.tone = state.status === 'won' ? state.winner : state.status;
  view.nextRound.hidden = state.status === 'playing';
}

/**
 * Sets a score number and replays its "bump" animation when it changed.
 * @param {HTMLElement} node
 * @param {number} value
 */
function setScore(node, value) {
  const text = String(value);
  if (node.textContent === text) return;
  node.textContent = text;
  node.classList.remove('bump');
  void node.offsetWidth;
  node.classList.add('bump');
}

/**
 * @param {View} view
 * @param {GameState} state
 * @param {Translate} t
 */
function renderScore(view, state, t) {
  setScore(view.scores.x, state.score.x);
  setScore(view.scores.o, state.score.o);
  setScore(view.scores.draws, state.score.draws);
  for (const mark of /** @type {Mark[]} */ (['X', 'O'])) {
    view.captions[mark].textContent = t(sideLabelKey(state.options, mark));
    view.cards[mark].classList.toggle('is-turn', state.status === 'playing' && state.turn === mark);
  }
}

/**
 * @param {View} view
 * @param {GameState} state
 */
function renderSettings(view, state) {
  for (const button of view.optionButtons) {
    const pressed = state.options[button.dataset.option] === button.dataset.value;
    button.setAttribute('aria-pressed', String(pressed));
  }
  const vsAi = state.options.mode === 'ai';
  view.markField.hidden = !vsAi;
  view.difficultyField.hidden = !vsAi;
}

/**
 * Redraws the whole UI from the state. Existing marks are kept so only the
 * newest one animates.
 * @param {View} view
 * @param {GameState} state
 * @param {Translate} t
 * @param {number} cursor Cell that owns the keyboard tab stop.
 */
export function renderGame(view, state, t, cursor) {
  renderBoard(view, state, t, cursor);
  renderWinLine(view, state);
  renderStatus(view, state, t);
  renderScore(view, state, t);
  renderSettings(view, state);
}

/**
 * Writes every static string of the page in the given language.
 * Elements opt in with data-i18n (text) and data-i18n-label (aria-label).
 * @param {View} view
 * @param {Lang} lang
 * @param {Translate} t
 */
export function applyLanguage(view, lang, t) {
  const { doc } = view;
  doc.documentElement.lang = lang;
  doc.title = t('title');
  for (const node of doc.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of doc.querySelectorAll('[data-i18n-label]')) node.setAttribute('aria-label', t(node.dataset.i18nLabel));
}

/**
 * Moves keyboard focus to a board cell.
 * @param {View} view
 * @param {number} cell
 */
export function focusCell(view, cell) {
  view.cells[cell].focus();
}

/**
 * The cell index of the element an event happened on, if it was a cell.
 * @param {Event} event
 * @returns {number|null}
 */
export function cellFromEvent(event) {
  const target = event.target instanceof Element ? event.target.closest('[data-cell]') : null;
  return target ? Number(target.dataset.cell) : null;
}
