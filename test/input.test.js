import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arrowDirection, digitToCell, moveCursor } from '../src/input.js';

test('digits follow the numeric keypad layout', () => {
  const expected = { 7: 0, 8: 1, 9: 2, 4: 3, 5: 4, 6: 5, 1: 6, 2: 7, 3: 8 };
  for (const [digit, cell] of Object.entries(expected)) assert.equal(digitToCell(digit), cell);
});

test('non-digit keys map to no cell', () => {
  for (const key of ['0', '10', 'a', '', 'Enter', ' 5']) assert.equal(digitToCell(key), null);
});

test('arrow keys map to directions', () => {
  assert.equal(arrowDirection('ArrowUp'), 'up');
  assert.equal(arrowDirection('ArrowDown'), 'down');
  assert.equal(arrowDirection('ArrowLeft'), 'left');
  assert.equal(arrowDirection('ArrowRight'), 'right');
  assert.equal(arrowDirection('Enter'), null);
  assert.equal(arrowDirection('toString'), null);
});

test('moveCursor moves one cell and stops at the edges', () => {
  assert.equal(moveCursor(4, 'up'), 1);
  assert.equal(moveCursor(4, 'down'), 7);
  assert.equal(moveCursor(4, 'left'), 3);
  assert.equal(moveCursor(4, 'right'), 5);
  assert.equal(moveCursor(0, 'up'), 0);
  assert.equal(moveCursor(0, 'left'), 0);
  assert.equal(moveCursor(8, 'down'), 8);
  assert.equal(moveCursor(8, 'right'), 8);
  assert.equal(moveCursor(2, 'right'), 2);
  assert.equal(moveCursor(6, 'down'), 6);
});
