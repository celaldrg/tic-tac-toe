import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, play, resetScore } from '../src/game.js';
import { STRINGS } from '../src/i18n.js';
import { cellMessage, sideLabelKey, statusMessage } from '../src/labels.js';
import { MARK_PATHS, cellCenter, winLinePath } from '../src/layout.js';

const playAll = (state, cells) => cells.reduce((current, cell) => play(current, cell), state);

test('status messages for every situation use existing i18n keys', () => {
  const cases = [
    [createGame({ mode: 'ai', humanMark: 'X' }), 'statusYourTurn', { mark: 'X' }],
    [createGame({ mode: 'ai', humanMark: 'O' }), 'statusThinking', {}],
    [createGame({ mode: 'pvp' }), 'statusTurn', { mark: 'X' }],
    [playAll(createGame({ mode: 'pvp' }), [0, 3, 1, 4, 2]), 'statusWins', { mark: 'X' }],
    [playAll(createGame({ mode: 'pvp' }), [0, 1, 2, 4, 3, 5, 7, 6, 8]), 'statusDraw', {}],
  ];
  for (const [state, key, params] of cases) {
    assert.deepEqual(statusMessage(state), { key, params });
    assert.ok(Object.hasOwn(STRINGS.en, key), key);
  }
});

test('vs AI a finished round says who won from the human point of view', () => {
  const won = { ...createGame({ mode: 'ai', humanMark: 'O' }), status: 'won', winner: 'O' };
  assert.equal(statusMessage(won).key, 'statusYouWin');
  assert.equal(statusMessage({ ...won, winner: 'X' }).key, 'statusAiWins');
});

test('scoreboard captions follow the mode and the human mark', () => {
  assert.equal(sideLabelKey({ mode: 'ai', humanMark: 'X' }, 'X'), 'you');
  assert.equal(sideLabelKey({ mode: 'ai', humanMark: 'X' }, 'O'), 'computer');
  assert.equal(sideLabelKey({ mode: 'ai', humanMark: 'O' }, 'O'), 'you');
  assert.equal(sideLabelKey({ mode: 'pvp', humanMark: 'O' }, 'X'), 'player1');
  assert.equal(sideLabelKey({ mode: 'pvp', humanMark: 'O' }, 'O'), 'player2');
});

test('cell labels give 1-based row and column', () => {
  assert.deepEqual(cellMessage(0, null), { key: 'cellEmpty', params: { row: 1, col: 1 } });
  assert.deepEqual(cellMessage(5, 'O'), { key: 'cellMark', params: { row: 2, col: 3, mark: 'O' } });
});

test('resetScore zeroes the scoreboard and keeps the round', () => {
  const state = play(createGame({ mode: 'pvp' }, { x: 4, o: 1, draws: 2 }), 4);
  const reset = resetScore(state);
  assert.deepEqual(reset.score, { x: 0, o: 0, draws: 0 });
  assert.deepEqual(reset.board, state.board);
  assert.equal(reset.turn, state.turn);
  assert.deepEqual(state.score, { x: 4, o: 1, draws: 2 }, 'the old state is untouched');
});

test('cell centres sit in the middle of a 300x300 board', () => {
  assert.deepEqual(cellCenter(0), { x: 50, y: 50 });
  assert.deepEqual(cellCenter(4), { x: 150, y: 150 });
  assert.deepEqual(cellCenter(5), { x: 250, y: 150 });
  assert.deepEqual(cellCenter(8), { x: 250, y: 250 });
});

test('win lines run through the cell centres and overshoot both ends', () => {
  assert.equal(winLinePath([0, 1, 2]), 'M20 50 L280 50');
  assert.equal(winLinePath([1, 4, 7]), 'M150 20 L150 280');
  assert.equal(winLinePath([2, 4, 6], 0), 'M250 50 L50 250');
  assert.equal(winLinePath([0, 4, 8], 10 * Math.SQRT2), 'M40 40 L260 260');
});

test('mark outlines exist for both marks', () => {
  assert.equal(MARK_PATHS.X.length, 2);
  assert.equal(MARK_PATHS.O.length, 1);
});
