import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, pick } from '../src/rng.js';

test('the same seed produces the same sequence', () => {
  const a = createRng(123);
  const b = createRng(123);
  for (let i = 0; i < 50; i += 1) assert.equal(a(), b());
});

test('different seeds produce different sequences', () => {
  const a = createRng(1);
  const b = createRng(2);
  const same = Array.from({ length: 20 }, () => a() === b()).filter(Boolean).length;
  assert.ok(same < 20);
});

test('values stay in [0, 1)', () => {
  const rng = createRng(99);
  for (let i = 0; i < 1000; i += 1) {
    const value = rng();
    assert.ok(value >= 0 && value < 1, `out of range: ${value}`);
  }
});

test('pick returns an element and covers all of them over time', () => {
  const rng = createRng(5);
  const items = ['a', 'b', 'c'];
  const seen = new Set();
  for (let i = 0; i < 100; i += 1) seen.add(pick(rng, items));
  assert.deepEqual([...seen].sort(), items);
  assert.throws(() => pick(rng, []), RangeError);
});
