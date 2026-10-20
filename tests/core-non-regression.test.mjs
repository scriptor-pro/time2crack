import test from 'node:test';
import assert from 'node:assert/strict';

import { charsetSize } from '../core/charset.js';
import { analyzePatterns } from '../core/patterns.js';
import { estimateRank } from '../core/rank/index.js';
import { rankMask } from '../core/rank/mask.js';

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
