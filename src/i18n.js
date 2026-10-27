/**
 * User-facing strings in English and Turkish. Pure data plus a lookup
 * helper; the UI applies them to the DOM.
 */

/** @typedef {'en'|'tr'} Lang */

/** Supported languages; the first one is the default. */
export const LANGS = Object.freeze(['en', 'tr']);

/** Language used on a first visit. */
export const DEFAULT_LANG = 'en';

/** Every visible string, keyed by language. Placeholders look like {name}. */
export const STRINGS = Object.freeze({
  en: Object.freeze({
    title: 'Tic-Tac-Toe',
    newGame: 'New game',
    langButton: 'TR',
    switchLang: 'Switch to Turkish',
    settings: 'Settings',
    mode: 'Mode',
    modeAi: 'vs Computer',
    modePvp: '2 players',
    yourMark: 'Your mark',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    impossible: 'Impossible',
    scoreboard: 'Scoreboard',
    draws: 'Draws',
    you: 'You',
    computer: 'Computer',
    player1: 'Player 1',
    player2: 'Player 2',
    resetScore: 'Reset score',
    statusYourTurn: 'Your turn ({mark})',
    statusThinking: 'Computer is thinking…',
    statusTurn: '{mark} to move',
    statusYouWin: 'You win!',
    statusAiWins: 'Computer wins!',
    statusWins: '{mark} wins!',
    statusDraw: 'It’s a draw!',
    nextRound: 'Next round',
    board: 'Game board',
    cellEmpty: 'Row {row}, column {col}: empty',
    cellMark: 'Row {row}, column {col}: {mark}',
    hint: 'Keyboard: 1–9 (numpad layout) or arrows + Enter.',
    footer: 'MIT · Source on GitHub',
  }),
  tr: Object.freeze({
    title: 'Tic-Tac-Toe',
    newGame: 'Yeni oyun',
    langButton: 'EN',
    switchLang: 'İngilizceye geç',
    settings: 'Ayarlar',
    mode: 'Mod',
    modeAi: 'Bilgisayara karşı',
    modePvp: '2 oyuncu',
    yourMark: 'İşaretin',
    difficulty: 'Zorluk',
    easy: 'Kolay',
    medium: 'Orta',
    impossible: 'İmkânsız',
    scoreboard: 'Skor tablosu',
    draws: 'Berabere',
    you: 'Sen',
    computer: 'Bilgisayar',
    player1: '1. oyuncu',
    player2: '2. oyuncu',
    resetScore: 'Skoru sıfırla',
    statusYourTurn: 'Sıra sende ({mark})',
    statusThinking: 'Bilgisayar düşünüyor…',
    statusTurn: 'Sıra: {mark}',
    statusYouWin: 'Kazandın!',
    statusAiWins: 'Bilgisayar kazandı!',
    statusWins: '{mark} kazandı!',
    statusDraw: 'Berabere!',
    nextRound: 'Sonraki tur',
    board: 'Oyun tahtası',
    cellEmpty: '{row}. satır, {col}. sütun: boş',
    cellMark: '{row}. satır, {col}. sütun: {mark}',
    hint: 'Klavye: 1–9 (sayı tuş takımı düzeni) ya da oklar + Enter.',
    footer: 'MIT · Kaynak kodu GitHub’da',
  }),
});

/**
 * Returns a supported language, falling back to the default.
 * @param {unknown} raw For example a value read from storage.
 * @returns {Lang}
 */
export function normalizeLang(raw) {
  return LANGS.includes(/** @type {Lang} */ (raw)) ? /** @type {Lang} */ (raw) : DEFAULT_LANG;
}

/**
 * The language the toggle switches to.
 * @param {Lang} lang
 * @returns {Lang}
 */
export function otherLang(lang) {
  return normalizeLang(lang) === 'en' ? 'tr' : 'en';
}

/**
 * Looks up a string and fills its {placeholders}.
 * Unknown keys fall back to English, then to the key itself.
 * @param {Lang} lang
 * @param {string} key
 * @param {Record<string, string|number>} [params]
 * @returns {string}
 */
export function translate(lang, key, params = {}) {
  const table = STRINGS[normalizeLang(lang)];
  const text = Object.hasOwn(table, key) ? table[key] : (STRINGS.en[key] ?? key);
  return text.replace(/\{(\w+)\}/g, (match, name) => (Object.hasOwn(params, name) ? String(params[name]) : match));
}
