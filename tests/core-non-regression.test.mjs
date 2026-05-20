import test from 'node:test';
import assert from 'node:assert/strict';

import { charsetSize } from '../core/charset.js';
import { analyzePatterns } from '../core/patterns.js';
import { estimateRank } from '../core/rank/index.js';
import { rankMask } from '../core/rank/mask.js';
import { uppercaseCost } from '../core/rank/uppercase.js';
import { rankHybrid } from '../core/rank/hybrid.js';
import { rankDictionary } from '../core/rank/dictionary.js';

const dictWords = new Set(['correct', 'horse', 'battery', 'staple', 'time', 'crack', 'pizza']);

function analyze(password, words = null) {
  return analyzePatterns(password, words);
}

function estimate(password, words = null) {
  const context = analyze(password, words);
  return estimateRank(password, {
    dictWords: words,
    looksPassphrase: context.looksPassphrase,
    hybridVuln: context.hybridVuln,
    lang: 'en',
  });
}

test('explicit separators stay recognized as passphrases', () => {
  const hyphen = analyze('correct-horse');
  const space = analyze('correct horse');

  assert.equal(hyphen.looksPassphrase, true);
  assert.equal(space.looksPassphrase, true);

  const hyphenRank = estimate('correct-horse', dictWords);
  const spaceRank = estimate('correct horse', dictWords);

  assert.equal(hyphenRank.details.combinator.rank, spaceRank.details.combinator.rank);
  assert.equal(hyphenRank.best_attack, 'combinator');
  assert.equal(spaceRank.best_attack, 'combinator');
});

test('underscore acts like an explicit passphrase separator', () => {
  const underscore = analyze('correct_horse', dictWords);

  assert.equal(underscore.looksPassphrase, true);

  const underscoreRank = estimate('correct_horse', dictWords);
  assert.notEqual(underscoreRank.details.combinator.rank, null);
});

test('concatenated dictionary words are still detected as passphrases', () => {
  const concatenated = analyze('correcthorse', dictWords);

  assert.equal(concatenated.looksPassphrase, true);

  const concatenatedRank = estimate('correcthorse', dictWords);
  assert.equal(concatenatedRank.details.combinator.rank, null);
  assert.notEqual(concatenatedRank.best_attack, 'combinator');
});

test('hyphen and underscore remain distinct in charset sizing', () => {
  assert.equal(charsetSize('abc-def'), 58);
  assert.equal(charsetSize('abc def'), 58);
  assert.equal(charsetSize('abc_def'), 26);
});

test('hybrid counts emoji suffixes as one character', () => {
  const punctuation = estimate('pizza?', dictWords);
  const emoji = estimate('pizza😀', dictWords);

  assert.notEqual(punctuation.details.hybrid.rank, null);
  assert.notEqual(emoji.details.hybrid.rank, null);
  assert.equal(punctuation.details.hybrid.rank, emoji.details.hybrid.rank);
});

test('mask keeps accented letters as letters', () => {
  const accentedUpper = rankMask('Éclair123', 'fr');
  const accentedLower = rankMask('éclair123', 'fr');

  assert.equal(accentedUpper.model, 'mask');
  assert.equal(accentedLower.model, 'mask');
  assert.equal(accentedUpper.pattern, 'UL+D+');
  assert.equal(accentedLower.pattern, 'L+D+');
  assert.notEqual(accentedUpper.rank, null);
  assert.notEqual(accentedLower.rank, null);
});

test('global score is smoother than the winning attack rank', () => {
  const hyphen = estimate('correct-horse', dictWords);
  const underscore = estimate('correct_horse', dictWords);

  assert.equal(hyphen.best_attack, 'combinator');
  assert.equal(underscore.best_attack, 'combinator');
  assert.ok(hyphen.attack_rank < underscore.attack_rank);
  assert.ok(hyphen.standard > hyphen.attack_rank);
  assert.ok(underscore.standard > underscore.attack_rank);

  const attackDelta = Math.abs(Math.log10(hyphen.attack_rank) - Math.log10(underscore.attack_rank));
  const standardDelta = Math.abs(Math.log10(hyphen.standard) - Math.log10(underscore.standard));

  assert.ok(standardDelta < attackDelta);
});

import { rankKeyboard } from '../core/rank/keyboard.js';
import { rankDate }     from '../core/rank/date.js';
import { rankBrute }    from '../core/rank/brute.js';

// ── Task 1 : detectDate() étendu ─────────────────────────────────────────────

test('detectDate — DDMM sans séparateur', () => {
  const ctx = analyzePatterns('14071990');
  assert.equal(ctx.dt, true);
  assert.equal(ctx.datePattern.format, 'DDMM');
  assert.equal(ctx.datePattern.space, 365);
});

test('detectDate — DDMonthName français', () => {
  const ctx = analyzePatterns('14Mai');
  assert.equal(ctx.dt, true);
  assert.equal(ctx.datePattern.format, 'DDMonthName');
  assert.equal(ctx.datePattern.space, 730);
});

test('detectDate — MonthNameDD anglais (format US)', () => {
  const ctx = analyzePatterns('July4');
  assert.equal(ctx.dt, true);
  assert.equal(ctx.datePattern.format, 'MonthNameDD');
  assert.equal(ctx.datePattern.space, 730);
});

test('detectDate — MonthNameYYYY', () => {
  const ctx = analyzePatterns('avril2003');
  assert.equal(ctx.dt, true);
  assert.equal(ctx.datePattern.format, 'MonthNameYYYY');
  assert.equal(ctx.datePattern.space, 1368);
});

test('detectDate — DDMonthNameYYYY', () => {
  const ctx = analyzePatterns('14juillet1989');
  assert.equal(ctx.dt, true);
  assert.equal(ctx.datePattern.format, 'DDMonthNameYYYY');
  assert.equal(ctx.datePattern.space, 41610);
});

test('detectDate — pas de faux positif', () => {
  const ctx1 = analyzePatterns('password');
  assert.equal(ctx1.dt, false);
  // 14135555 : 13 n'est pas un mois valide, 5555 n'est pas une année 19xx/20xx
  const ctx2 = analyzePatterns('14135555');
  assert.equal(ctx2.dt, false);
});

// ── Task 2 : rankKeyboard ────────────────────────────────────────────────────

test('rankKeyboard — qwerty retourne rang < 50 000', () => {
  const result = rankKeyboard('qwerty', true);
  assert.equal(result.model, 'keyboard');
  assert.ok(result.rank !== null);
  assert.ok(result.rank < 50_000, `rank trop élevé: ${result.rank}`);
});

test('rankKeyboard — kbPat=false retourne null', () => {
  const result = rankKeyboard('aBcDeFgH', false);
  assert.equal(result.model, 'keyboard');
  assert.equal(result.rank, null);
});

test('rankKeyboard — rang < rang brute force', () => {
  const kb    = rankKeyboard('azerty!', true);
  const brute = rankBrute('azerty!');
  assert.ok(kb.rank < brute.rank, `keyboard ${kb.rank} devrait être < brute ${brute.rank}`);
});

// ── Task 3 : rankDate ────────────────────────────────────────────────────────

test('rankDate — 14071990 rang < brute', () => {
  const ctx    = analyzePatterns('14071990');
  const result = rankDate('14071990', ctx.dt, ctx.datePattern);
  const brute  = rankBrute('14071990');
  assert.equal(result.model, 'date');
  assert.ok(result.rank !== null);
  assert.ok(result.rank < brute.rank, `date ${result.rank} devrait être < brute ${brute.rank}`);
});

test('rankDate — dt=false retourne null', () => {
  const result = rankDate('password', false, null);
  assert.equal(result.model, 'date');
  assert.equal(result.rank, null);
});

test('rankDate — 14Mai rang < brute', () => {
  const ctx    = analyzePatterns('14Mai');
  const result = rankDate('14Mai', ctx.dt, ctx.datePattern);
  const brute  = rankBrute('14Mai');
  assert.ok(result.rank < brute.rank);
});

test('rankDate — born1987 rang < brute', () => {
  const ctx    = analyzePatterns('born1987');
  assert.equal(ctx.dt, true);
  const result = rankDate('born1987', ctx.dt, ctx.datePattern);
  const brute  = rankBrute('born1987');
  assert.ok(result.rank < brute.rank);
});

// ── Task 4 : pipeline estimateRank ───────────────────────────────────────────

function estimateFull(password, words = null) {
  const context = analyzePatterns(password, words);
  return estimateRank(password, {
    dictWords:       words,
    looksPassphrase: context.looksPassphrase,
    hybridVuln:      context.hybridVuln,
    kbPat:           context.kbPat,
    dt:              context.dt,
    dateResult:      context.datePattern,
    lang: 'en',
  });
}

test('pipeline — qwerty a un rang keyboard dans details', () => {
  const rank = estimateFull('qwerty');
  assert.ok(rank.details.keyboard !== undefined, 'details.keyboard manquant');
  assert.ok(rank.details.keyboard.rank !== null, 'rank keyboard null pour qwerty');
});

test('pipeline — 14071990 a un rang date dans details', () => {
  const rank = estimateFull('14071990');
  assert.ok(rank.details.date !== undefined, 'details.date manquant');
  assert.ok(rank.details.date.rank !== null, 'rank date null pour 14071990');
});

test('pipeline — Qwerty123 best_attack est keyboard ou mask', () => {
  const rank = estimateFull('Qwerty123');
  assert.ok(
    rank.best_attack === 'keyboard' || rank.best_attack === 'mask',
    `best_attack inattendu: ${rank.best_attack}`
  );
});

test('pipeline — born1987 rang date < rang brute', () => {
  const rank = estimateFull('born1987');
  assert.ok(rank.details.date.rank < rank.worst_case,
    `date ${rank.details.date.rank} devrait être < brute ${rank.worst_case}`);
});

// --- Toggle-case : uppercaseCost() ---

test('uppercaseCost — all-lower retourne 1', () => {
  assert.equal(uppercaseCost('mayonnaise'), 1);
});

test('uppercaseCost — StartCap retourne 2', () => {
  assert.equal(uppercaseCost('Mayonnaise'), 2);
});

test('uppercaseCost — AllCaps retourne 2', () => {
  assert.equal(uppercaseCost('MAYONNAISE'), 2);
});

test('uppercaseCost — EndCap retourne 2', () => {
  assert.equal(uppercaseCost('mayonnaisE'), 2);
});

test('uppercaseCost — toggle aléatoire retourne combinatoire', () => {
  // pAsSwOrD : U=4, L=4 → ∑C(8,1..4) = 8+28+56+70 = 162
  assert.equal(uppercaseCost('pAsSwOrD'), 162);
});
