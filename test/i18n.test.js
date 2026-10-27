import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_LANG, LANGS, STRINGS, normalizeLang, otherLang, translate } from '../src/i18n.js';

const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

test('English and Turkish define exactly the same keys, none empty', () => {
  const en = Object.keys(STRINGS.en).sort();
  assert.deepEqual(Object.keys(STRINGS.tr).sort(), en);
  for (const lang of LANGS) {
    for (const [key, text] of Object.entries(STRINGS[lang])) {
      assert.equal(typeof text, 'string', `${lang}.${key}`);
      assert.ok(text.trim().length > 0, `${lang}.${key} is empty`);
    }
  }
});

test('both languages use the same placeholders for every key', () => {
  for (const key of Object.keys(STRINGS.en)) {
    assert.deepEqual(placeholders(STRINGS.tr[key]), placeholders(STRINGS.en[key]), key);
  }
});

test('every data-i18n key in index.html exists', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const keys = [...html.matchAll(/data-i18n(?:-label)?="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(keys.length > 10, 'expected many translated elements');
  for (const key of keys) assert.ok(Object.hasOwn(STRINGS.en, key), `missing key "${key}"`);
});

test('translate fills placeholders and falls back sensibly', () => {
  assert.equal(translate('en', 'statusWins', { mark: 'O' }), 'O wins!');
  assert.equal(translate('tr', 'statusWins', { mark: 'X' }), 'X kazandı!');
  assert.equal(translate('tr', 'newGame'), 'Yeni oyun');
  assert.equal(translate('xx', 'newGame'), 'New game', 'unknown language -> default');
  assert.equal(translate('en', 'noSuchKey'), 'noSuchKey');
  assert.equal(translate('en', 'statusWins'), '{mark} wins!', 'missing params stay visible');
});

test('the language toggle label names the other language', () => {
  assert.equal(translate('en', 'langButton'), 'TR');
  assert.equal(translate('tr', 'langButton'), 'EN');
});

test('normalizeLang and otherLang', () => {
  assert.equal(DEFAULT_LANG, 'en');
  assert.equal(normalizeLang('tr'), 'tr');
  assert.equal(normalizeLang('de'), 'en');
  assert.equal(normalizeLang(null), 'en');
  assert.equal(otherLang('en'), 'tr');
  assert.equal(otherLang('tr'), 'en');
});
