import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LINES, emptyBoard, emptyCells, findWinner, isDraw, otherMark, placeMark, winningCells,
} from '../src/board.js';

/** Builds a board from a 9-character string such as "XO.X....." ('.' = empty). */
const parse = (text) => [...text].map((ch) => (ch === '.' ? null : ch));

test('there are exactly 8 winning lines covering rows, columns and diagonals', () => {
  assert.equal(LINES.length, 8);
  const keys = new Set(LINES.map((line) => line.join(',')));
  for (const expected of ['0,1,2', '3,4,5', '6,7,8', '0,3,6', '1,4,7', '2,5,8', '0,4,8', '2,4,6']) {
    assert.ok(keys.has(expected), `missing line ${expected}`);
  }
});

test('findWinner detects every line for both marks and reports the line', () => {
  for (const mark of ['X', 'O']) {
    for (const line of LINES) {
      let board = emptyBoard();
      for (const cell of line) board = placeMark(board, cell, mark);
      assert.deepEqual(findWinner(board), { winner: mark, line: [...line] });
    }
  }
});

test('findWinner returns null when no line is complete', () => {
  assert.equal(findWinner(emptyBoard()), null);
  assert.equal(findWinner(parse('XX.OO....')), null);
  assert.equal(findWinner(parse('XOXXOOOXX')), null);
});

test('a full board with a winner is a win, not a draw', () => {
  const board = parse('XXXOOXXOO');
  assert.equal(findWinner(board).winner, 'X');
  assert.equal(isDraw(board), false);
});

test('isDraw is true only for a full board without a winner', () => {
  assert.equal(isDraw(parse('XOXXOOOXX')), true);
  assert.equal(isDraw(parse('XOXXOOOX.')), false);
  assert.equal(isDraw(emptyBoard()), false);
});

test('emptyCells and otherMark', () => {
  assert.deepEqual(emptyCells(emptyBoard()), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(emptyCells(parse('X...O...X')), [1, 2, 3, 5, 6, 7]);
  assert.equal(otherMark('X'), 'O');
  assert.equal(otherMark('O'), 'X');
});

test('placeMark returns a new board and rejects taken or invalid cells', () => {
  const board = emptyBoard();
  const next = placeMark(board, 4, 'X');
  assert.equal(board[4], null, 'original board must not change');
  assert.equal(next[4], 'X');
  assert.throws(() => placeMark(next, 4, 'O'), /already taken/);
  assert.throws(() => placeMark(board, 9, 'X'), RangeError);
  assert.throws(() => placeMark(board, -1, 'X'), RangeError);
  assert.throws(() => placeMark(board, 1.5, 'X'), RangeError);
});

test('winningCells lists every cell that completes a line', () => {
  assert.deepEqual(winningCells(parse('XX.......'), 'X'), [2]);
  assert.deepEqual(winningCells(parse('XX.X.....'), 'X'), [2, 6]);
  assert.deepEqual(winningCells(parse('XXO......'), 'X'), []);
  assert.deepEqual(winningCells(parse('XX.......'), 'O'), []);
});
