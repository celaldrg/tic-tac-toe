import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTIES, bestMoves, chooseMove, scoreMoves } from '../src/ai.js';
import {
  emptyBoard, emptyCells, findWinner, otherMark, placeMark, turnOf, winningCells,
} from '../src/board.js';
import { createRng } from '../src/rng.js';

/** Builds a board from a 9-character string such as "XO.X....." ('.' = empty). */
const parse = (text) => [...text].map((ch) => (ch === '.' ? null : ch));

/**
 * Plays out every game where the opponent tries every legal reply and the
 * perfect AI tries every one of its optimal moves (so no tie-break can lose).
 * @returns {{ games: number, wins: number, draws: number, losses: number }}
 */
function exhaust(aiMark) {
  const tally = { games: 0, wins: 0, draws: 0, losses: 0 };
  const visit = (board) => {
    const win = findWinner(board);
    if (win || !board.includes(null)) {
      tally.games += 1;
      if (!win) tally.draws += 1;
      else if (win.winner === aiMark) tally.wins += 1;
      else tally.losses += 1;
      return;
    }
    const toMove = turnOf(board);
    const options = toMove === aiMark ? bestMoves(board, aiMark) : emptyCells(board);
    for (const cell of options) visit(placeMark(board, cell, toMove));
  };
  visit(emptyBoard());
  return tally;
}

/** Every position reachable by legal play where the game is still running. */
function liveReachablePositions() {
  const seen = new Map();
  const walk = (board) => {
    const key = board.map((cell) => cell ?? '.').join('');
    if (seen.has(key)) return;
    seen.set(key, board);
    if (findWinner(board) || !board.includes(null)) return;
    for (const cell of emptyCells(board)) walk(placeMark(board, cell, turnOf(board)));
  };
  walk(emptyBoard());
  return [...seen.values()].filter((board) => !findWinner(board) && board.includes(null));
}

test('DONE: the impossible AI never loses when it plays first (X)', () => {
  const tally = exhaust('X');
  assert.equal(tally.losses, 0);
  assert.ok(tally.games > 1000, `expected an exhaustive search, got ${tally.games} games`);
  assert.equal(tally.games, tally.wins + tally.draws);
});

test('DONE: the impossible AI never loses when it plays second (O)', () => {
  const tally = exhaust('O');
  assert.equal(tally.losses, 0);
  assert.ok(tally.games > 1000, `expected an exhaustive search, got ${tally.games} games`);
  assert.equal(tally.games, tally.wins + tally.draws);
});

test('perfect play from the empty board is a draw for every opening', () => {
  for (const { score } of scoreMoves(emptyBoard(), 'X')) assert.equal(score, 0);
});

test('in every reachable position the AI takes an immediate win', () => {
  let checked = 0;
  for (const board of liveReachablePositions()) {
    const mark = turnOf(board);
    const wins = winningCells(board, mark);
    if (wins.length === 0) continue;
    checked += 1;
    for (const cell of bestMoves(board, mark)) assert.ok(wins.includes(cell), `missed a win on ${board}`);
  }
  assert.ok(checked > 100);
});

test('in every reachable position the AI blocks a single immediate threat', () => {
  let checked = 0;
  for (const board of liveReachablePositions()) {
    const mark = turnOf(board);
    const threats = winningCells(board, otherMark(mark));
    if (winningCells(board, mark).length > 0 || threats.length !== 1) continue;
    checked += 1;
    assert.deepEqual(bestMoves(board, mark), threats, `failed to block on ${board}`);
  }
  assert.ok(checked > 100);
});

test('prefers the fastest win: immediate win outranks a slower forced win', () => {
  // X: 0 and 4, O: 1 and 2. Cell 8 wins now; 3 or 6 would only fork.
  const scores = scoreMoves(parse('XOO.X....'), 'X');
  const byCell = Object.fromEntries(scores.map(({ cell, score }) => [cell, score]));
  assert.ok(Object.values(byCell).some((score) => score > 0 && score < byCell[8]), 'expected a slower win too');
  assert.deepEqual(bestMoves(parse('XOO.X....'), 'X'), [8]);
});

test('prefers the slowest loss: blocks even when the game is already lost', () => {
  // O to move; X threatens 8 and every reply loses, but blocking loses later.
  const board = parse('XO..X....');
  const scores = scoreMoves(board, 'O');
  assert.ok(scores.every(({ score }) => score < 0), 'position should be lost for O');
  assert.deepEqual(bestMoves(board, 'O'), [8]);
});

test('scoreMoves and bestMoves return nothing for a finished game', () => {
  assert.deepEqual(scoreMoves(parse('XXXOO....'), 'O'), []);
  assert.deepEqual(bestMoves(parse('XXXOO....'), 'O'), []);
});

test('chooseMove: impossible picks among optimal moves and is reproducible per seed', () => {
  const board = parse('X........');
  const optimal = bestMoves(board, 'O');
  for (let seed = 1; seed <= 20; seed += 1) {
    const first = chooseMove(board, 'O', 'impossible', createRng(seed));
    assert.ok(optimal.includes(first));
    assert.equal(chooseMove(board, 'O', 'impossible', createRng(seed)), first);
  }
});

test('chooseMove: every difficulty returns a legal empty cell', () => {
  const boards = [emptyBoard(), parse('X...O....'), parse('XO.XO....'), parse('XOXOXO...')];
  for (const difficulty of DIFFICULTIES) {
    for (let seed = 1; seed <= 25; seed += 1) {
      for (const board of boards) {
        const cell = chooseMove(board, turnOf(board), difficulty, createRng(seed));
        assert.equal(board[cell], null);
      }
    }
  }
});

test('chooseMove: easy and medium also take an immediate win', () => {
  const board = parse('XX.OO....');
  for (const difficulty of ['easy', 'medium']) {
    for (let seed = 1; seed <= 25; seed += 1) {
      assert.equal(chooseMove(board, 'X', difficulty, createRng(seed)), 2);
    }
  }
});

test('chooseMove: medium blocks an immediate threat, easy sometimes does not', () => {
  const board = parse('XX..O....');
  const easyMoves = new Set();
  for (let seed = 1; seed <= 40; seed += 1) {
    assert.equal(chooseMove(board, 'O', 'medium', createRng(seed)), 2);
    easyMoves.add(chooseMove(board, 'O', 'easy', createRng(seed)));
  }
  assert.ok([...easyMoves].some((cell) => cell !== 2), 'easy should be beatable');
});

test('chooseMove: medium is weaker than perfect somewhere', () => {
  const board = parse('X........');
  const optimal = bestMoves(board, 'O');
  const picks = new Set();
  for (let seed = 1; seed <= 60; seed += 1) picks.add(chooseMove(board, 'O', 'medium', createRng(seed)));
  assert.ok([...picks].some((cell) => !optimal.includes(cell)), 'medium never strayed from perfect play');
});

test('chooseMove rejects finished games and unknown difficulties', () => {
  const rng = createRng(1);
  assert.throws(() => chooseMove(parse('XXXOO....'), 'O', 'impossible', rng), /over/);
  assert.throws(() => chooseMove(parse('XOXXOOOXX'), 'X', 'easy', rng), /over/);
  assert.throws(() => chooseMove(emptyBoard(), 'X', 'nightmare', rng), RangeError);
});
