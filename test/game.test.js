import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_OPTIONS, aiMove, canPlay, createDemoState, createGame, isAiTurn, nextRound,
  normalizeOptions, normalizeScore, play,
} from '../src/game.js';
import { createRng } from '../src/rng.js';

/** Plays a list of cells in order through the public API. */
const playAll = (state, cells) => cells.reduce((current, cell) => play(current, cell), state);

/**
 * Explores every sequence of human moves against the impossible AI through
 * the same API the UI uses, and counts finished rounds by outcome.
 */
function exhaustThroughApi(humanMark, seed) {
  const tally = { games: 0, humanWins: 0 };
  const visit = (state) => {
    if (state.status !== 'playing') {
      tally.games += 1;
      if (state.winner === humanMark) tally.humanWins += 1;
      return;
    }
    if (isAiTurn(state)) {
      visit(aiMove(state, createRng(seed)));
      return;
    }
    state.board.forEach((cell, index) => {
      if (cell === null) visit(play(state, index));
    });
  };
  visit(createGame({ mode: 'ai', humanMark, difficulty: 'impossible' }));
  return tally;
}

test('createGame starts an empty round with X to move and default options', () => {
  const state = createGame();
  assert.deepEqual(state.board, Array(9).fill(null));
  assert.equal(state.turn, 'X');
  assert.equal(state.status, 'playing');
  assert.equal(state.winner, null);
  assert.equal(state.line, null);
  assert.equal(state.lastMove, null);
  assert.deepEqual(state.score, { x: 0, o: 0, draws: 0 });
  assert.deepEqual(state.options, { ...DEFAULT_OPTIONS });
});

test('two-player mode alternates marks and records the last move', () => {
  let state = createGame({ mode: 'pvp' });
  state = play(state, 4);
  assert.equal(state.board[4], 'X');
  assert.equal(state.turn, 'O');
  assert.equal(state.lastMove, 4);
  state = play(state, 0);
  assert.equal(state.board[0], 'O');
  assert.equal(state.turn, 'X');
  assert.equal(isAiTurn(state), false);
});

test('illegal moves return the very same state object', () => {
  const state = play(createGame({ mode: 'pvp' }), 4);
  assert.equal(play(state, 4), state, 'taken cell');
  assert.equal(play(state, 9), state, 'out of range');
  assert.equal(play(state, -1), state, 'negative');
  assert.equal(canPlay(state, 4), false);
  assert.equal(canPlay(state, 0), true);
});

test('a win sets winner, line, status and increments the score', () => {
  const state = playAll(createGame({ mode: 'pvp' }), [0, 3, 1, 4, 2]);
  assert.equal(state.status, 'won');
  assert.equal(state.winner, 'X');
  assert.deepEqual(state.line, [0, 1, 2]);
  assert.deepEqual(state.score, { x: 1, o: 0, draws: 0 });
  assert.equal(play(state, 8), state, 'no moves after the round ends');
});

test('O can win too', () => {
  const state = playAll(createGame({ mode: 'pvp' }), [0, 2, 1, 4, 8, 6]);
  assert.equal(state.winner, 'O');
  assert.deepEqual(state.line, [2, 4, 6]);
  assert.deepEqual(state.score, { x: 0, o: 1, draws: 0 });
});

test('a full board without a line is a draw and counts as one', () => {
  // X O X / X O O / O X X
  const state = playAll(createGame({ mode: 'pvp' }), [0, 1, 2, 4, 3, 5, 7, 6, 8]);
  assert.equal(state.status, 'draw');
  assert.equal(state.winner, null);
  assert.deepEqual(state.score, { x: 0, o: 0, draws: 1 });
});

test('nextRound clears the board but keeps score and options', () => {
  const won = playAll(createGame({ mode: 'pvp' }), [0, 3, 1, 4, 2]);
  const next = nextRound(won);
  assert.deepEqual(next.board, Array(9).fill(null));
  assert.equal(next.status, 'playing');
  assert.equal(next.turn, 'X');
  assert.deepEqual(next.score, won.score);
  assert.deepEqual(next.options, won.options);
});

test('vs AI: the computer opens when the human picks O and humans cannot move for it', () => {
  const state = createGame({ mode: 'ai', humanMark: 'O', difficulty: 'impossible' });
  assert.equal(isAiTurn(state), true);
  assert.equal(play(state, 4), state);
  const after = aiMove(state, createRng(3));
  assert.equal(after.board.filter(Boolean).length, 1);
  assert.equal(isAiTurn(after), false);
  assert.equal(aiMove(after, createRng(3)), after, 'aiMove is a no-op on the human turn');
});

test('vs AI: the computer answers and aiMove is deterministic per seed', () => {
  const state = play(createGame({ mode: 'ai', humanMark: 'X', difficulty: 'medium' }), 0);
  assert.equal(isAiTurn(state), true);
  const a = aiMove(state, createRng(42));
  const b = aiMove(state, createRng(42));
  assert.deepEqual(a.board, b.board);
  assert.equal(a.turn, 'X');
});

test('DONE through the game API: humans never beat the impossible AI', () => {
  for (const humanMark of ['X', 'O']) {
    for (const seed of [1, 2, 3]) {
      const tally = exhaustThroughApi(humanMark, seed);
      assert.equal(tally.humanWins, 0, `human as ${humanMark} won with seed ${seed}`);
      assert.ok(tally.games > 50, `only ${tally.games} games explored`);
    }
  }
});

test('normalizeOptions accepts valid values and repairs the rest', () => {
  assert.deepEqual(normalizeOptions({ mode: 'pvp', humanMark: 'O', difficulty: 'easy' }),
    { mode: 'pvp', humanMark: 'O', difficulty: 'easy' });
  assert.deepEqual(normalizeOptions({ mode: 'online', humanMark: 'Z', difficulty: 'hard' }), { ...DEFAULT_OPTIONS });
  assert.deepEqual(normalizeOptions(null), { ...DEFAULT_OPTIONS });
  assert.deepEqual(normalizeOptions('junk'), { ...DEFAULT_OPTIONS });
});

test('normalizeScore keeps non-negative integers and zeroes the rest', () => {
  assert.deepEqual(normalizeScore({ x: 2, o: 5, draws: 1 }), { x: 2, o: 5, draws: 1 });
  assert.deepEqual(normalizeScore({ x: -1, o: 1.5, draws: '3' }), { x: 0, o: 0, draws: 0 });
  assert.deepEqual(normalizeScore(undefined), { x: 0, o: 0, draws: 0 });
});

test('createDemoState: a deterministic mid-game with 4 marks and a non-zero score', () => {
  const demo = createDemoState();
  assert.deepEqual(demo, createDemoState());
  assert.equal(demo.board.filter(Boolean).length, 4);
  assert.equal(demo.board.filter((cell) => cell === 'X').length, 2);
  assert.equal(demo.status, 'playing');
  assert.equal(demo.winner, null);
  assert.equal(demo.turn, 'X');
  assert.equal(isAiTurn(demo), false, 'the human is to move in the screenshot');
  assert.ok(demo.score.x + demo.score.o + demo.score.draws > 0);
});
