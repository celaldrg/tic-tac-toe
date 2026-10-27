import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readJSON, writeJSON } from '../src/storage.js';

/** In-memory stand-in for localStorage. */
function memoryStorage() {
  const data = new Map();
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  };
}

/** A storage that throws on every call, like a blocked private-mode store. */
const brokenStorage = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('QuotaExceededError'); },
};

test('values round-trip as JSON under a project prefix', () => {
  const store = memoryStorage();
  assert.equal(writeJSON('score', { x: 1, o: 2, draws: 3 }, store), true);
  assert.deepEqual(readJSON('score', null, store), { x: 1, o: 2, draws: 3 });
  assert.deepEqual([...store.data.keys()], ['tic-tac-toe:score']);
});

test('missing keys and corrupt data return the fallback', () => {
  const store = memoryStorage();
  assert.equal(readJSON('lang', 'en', store), 'en');
  store.setItem('tic-tac-toe:lang', '{not json');
  assert.equal(readJSON('lang', 'en', store), 'en');
});

test('a throwing or absent storage never crashes', () => {
  assert.equal(readJSON('lang', 'en', brokenStorage), 'en');
  assert.equal(writeJSON('lang', 'tr', brokenStorage), false);
  assert.equal(readJSON('lang', 'en', null), 'en');
  assert.equal(writeJSON('lang', 'tr', null), false);
});
