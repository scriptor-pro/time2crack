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

test('global score is never below the winning attack rank', () => {
  // Une passphrase pure n'active que le combinator : le score global égale son rang.
  // (Avant la correction de l'hybride, "correct_horse" était aussi compté comme
  // "correct" + suffixe "_horse", ce qui ne correspond à aucune règle réelle.)
  const hyphen = estimate('correct-horse', dictWords);
  const underscore = estimate('correct_horse', dictWords);

  assert.equal(hyphen.best_attack, 'combinator');
  assert.equal(underscore.best_attack, 'combinator');
  assert.ok(hyphen.attack_rank < underscore.attack_rank);
  assert.ok(hyphen.standard >= hyphen.attack_rank * (1 - 1e-9)); // 10^log10(x) ≈ x
  assert.ok(underscore.standard >= underscore.attack_rank * (1 - 1e-9));

  // Plusieurs modèles applicables (hybride + masque) : le score global est lissé au-dessus.
  const decorated = estimate('pizza12', dictWords);
  assert.equal(decorated.best_attack, 'hybrid');
  assert.ok(decorated.standard > decorated.attack_rank);
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

test('detectDate — nom de mois inclus dans un mot : pas un mois', () => {
  // « mar » dans Marie, « mai » dans maison, « set » dans sunset, « out » dans about…
  for (const pw of ['maison', 'sunset', 'about', 'general', 'Margaux', 'mayday', 'Pierremai']) {
    assert.equal(analyzePatterns(pw).dt, false, pw);
  }
  // L'année reste détectée, mais pas le mois
  assert.equal(analyzePatterns('Marie1987').datePattern.format, 'YYYY');
});

test('detectDate — nom de mois isolé par des chiffres, symboles ou bords', () => {
  const cases = { 'mai': 'MonthName', 'MAI2020': 'MonthNameYYYY', 'Paris14juillet': 'DDMonthName',
    'juin-2015': 'MonthName', 'chat.mars.1990': 'MonthName', '2003avril': 'MonthNameYYYY' };
  for (const [pw, format] of Object.entries(cases)) {
    assert.equal(analyzePatterns(pw).datePattern?.format, format, pw);
  }
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

// --- Toggle-case : rankHybrid() ---

test('rankHybrid — password123 rank non-null (all-lower inchangé)', () => {
  const words = new Set(['password']);
  const r = rankHybrid('password123', words);
  assert.ok(r.rank !== null);
});

test('rankHybrid — Password123 rank = 2× password123', () => {
  const words = new Set(['password']);
  const lower    = rankHybrid('password123', words).rank;
  const startcap = rankHybrid('Password123', words).rank;
  assert.ok(lower !== null && startcap !== null);
  assert.equal(startcap, lower * 2);
});

test('rankHybrid — PASSWORD123 rank = 2× password123', () => {
  const words = new Set(['password']);
  const lower  = rankHybrid('password123', words).rank;
  const allcaps = rankHybrid('PASSWORD123', words).rank;
  assert.ok(lower !== null && allcaps !== null);
  assert.equal(allcaps, lower * 2);
});

test('rankHybrid — pAsSwOrD123 rank = 162× password123', () => {
  const words = new Set(['password']);
  const lower   = rankHybrid('password123', words).rank;
  const toggled = rankHybrid('pAsSwOrD123', words).rank;
  assert.ok(lower !== null && toggled !== null);
  assert.equal(toggled, lower * 162);
});

// --- Hybride : un seul mot transformé (hashcat -a 0 -r, -a 6/7) ---

test('rankHybrid — plusieurs mots → pas hybride (combinator / PCFG)', () => {
  const words = new Set(['visé', 'mol', 'ran', 'chat', 'soleil']);
  assert.equal(rankHybrid('9Visé-Mol-ran-4', words).rank, null);
  assert.equal(rankHybrid('chat_soleil', words).rank, null);
});

test('rankHybrid — décoration courte inchangée (jeux de règles)', () => {
  const words = new Set(['batman']);
  const r1 = rankHybrid('batman1', words).rank;
  const r3 = rankHybrid('batman123', words).rank;
  assert.ok(r1 !== null && r3 !== null);
  assert.equal(r3, r1 * 9); // 900 / 100 règles
});

test('rankHybrid — décoration longue = coût du masque, sans plafond', () => {
  const words = new Set(['pizza']);
  const short = rankHybrid('pizza1', words).rank;          // 100 règles
  const long  = rankHybrid('pizza12345678', words).rank;   // masque ?d×8 = 1e8
  assert.equal(long, (short / 100) * 1e8);
});

// --- Combinator : séparateurs ---

test('combinator — plusieurs symboles entre deux mots restent une passphrase', () => {
  const words = new Set(['bonheur']);
  assert.equal(analyze('youpie-.bonheur-', words).looksPassphrase, true);
  assert.notEqual(estimate('youpie-.bonheur-', words).details.combinator.rank, null);
});

test('combinator — seul le séparateur entre deux blocs est gratuit', () => {
  const words = new Set(['bonheur']);
  const base = estimate('youpie-bonheur', words).details.combinator.rank;
  const trailing = estimate('youpie-bonheur-', words).details.combinator.rank;
  const group = estimate('youpie-.bonheur-', words).details.combinator.rank;
  assert.equal(trailing, base * 33);       // tiret final = décoration
  assert.equal(group, base * 33 ** 3);     // "-." + "-" payés un par un
});

test('combinator — séparateur répété entre mots et chiffres gratuit', () => {
  const words = new Set(['visé']);
  const plain = estimate('Visé-mol-ran', words).details.combinator.rank;
  const digits = estimate('9Visé-mol-ran-4', words).details.combinator.rank;
  assert.equal(digits, plain * 100);       // 9 et 4 : ×10 chacun, tirets gratuits
});

// --- Toggle-case : rankDictionary() ---

test('rankDictionary — mayonnaise (all-lower) rank non-null', () => {
  const words = new Set(['mayonnaise']);
  const r = rankDictionary('mayonnaise', words);
  assert.ok(r.rank !== null);
});

test('rankDictionary — Mayonnaise rank = 2× mayonnaise', () => {
  const words = new Set(['mayonnaise']);
  const lower    = rankDictionary('mayonnaise', words).rank;
  const startcap = rankDictionary('Mayonnaise', words).rank;
  assert.ok(lower !== null && startcap !== null);
  assert.equal(startcap, lower * 2);
});

test('rankDictionary — MAYONNAISE rank = 2× mayonnaise', () => {
  const words = new Set(['mayonnaise']);
  const lower  = rankDictionary('mayonnaise', words).rank;
  const allcaps = rankDictionary('MAYONNAISE', words).rank;
  assert.ok(lower !== null && allcaps !== null);
  assert.equal(allcaps, lower * 2);
});

test('rankDictionary — password (top HIBP) all-lower rank = 2', () => {
  const r = rankDictionary('password', null);
  assert.equal(r.rank, 2);
});

test('rankDictionary — Password (top HIBP StartCap) rank = 2× password', () => {
  const lower = rankDictionary('password', null).rank;
  const cap   = rankDictionary('Password', null).rank;
  assert.ok(cap !== null);
  assert.equal(cap, lower * 2);
});

// --- Toggle-case : pipeline e2e ---

test('pipeline — Password123 rank > password123 rank', () => {
  const words = new Set(['password']);
  const lower    = estimate('password123', words);
  const startcap = estimate('Password123', words);
  assert.ok(startcap.attack_rank > lower.attack_rank,
    `Password123 (${startcap.attack_rank}) doit être > password123 (${lower.attack_rank})`);
});

test('pipeline — pAsSwOrD123 rank > Password123 rank', () => {
  const words = new Set(['password']);
  const startcap = estimate('Password123', words);
  const toggled  = estimate('pAsSwOrD123', words);
  assert.ok(toggled.attack_rank > startcap.attack_rank,
    `pAsSwOrD123 (${toggled.attack_rank}) doit être > Password123 (${startcap.attack_rank})`);
});

test('pipeline — Mayonnaise rank > mayonnaise rank', () => {
  // Wordlist de taille > 1 pour que mid = floor(size/2) > 0
  const words = new Set(['mayonnaise', 'correct', 'horse', 'battery', 'staple']);
  const lower = estimate('mayonnaise', words);
  const cap   = estimate('Mayonnaise', words);
  assert.ok(cap.attack_rank > lower.attack_rank,
    `Mayonnaise (${cap.attack_rank}) doit être > mayonnaise (${lower.attack_rank})`);
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

// ─── PCFG (2026-10-22) ───────────────────────────────────────────────────────
import { init as initPCFG, rankPCFG } from '../core/rank/pcfg.js';

const PCFG_TEST_DATA = {
  total_passwords: 1_000_000,
  skeleton_total: 1_000_000,
  skeletons: { L8D3: 5_000, L6D2: 100_000, L8: 200_000 },
  segments: { L: {}, D: { 2: { space: 100 }, 3: { space: 1000 } }, S: {} },
  threshold: 100,
};
const pcfgDict = new Set(['password', 'sunshine', 'princess', 'monkey']);

test('rankPCFG — squelette fréquent : le rang PCFG n’est pas écrasé par la force brute', () => {
  initPCFG(PCFG_TEST_DATA);
  const r = rankPCFG('password123', pcfgDict);
  // 1/P(L8D3) ≈ 200, × 4 mots de 8 lettres × 1000 → ~10⁶ ; force brute 36¹¹/2 ≈ 6,6×10¹⁶
  assert.ok(r.confidence > 0.99);
  assert.ok(r.rank < 1e7, `rang ${r.rank.toExponential(2)}`);
});

test('rankPCFG — segment lettres hors dictionnaire : pas de gain par rapport à la force brute', () => {
  initPCFG(PCFG_TEST_DATA);
  const known = rankPCFG('password123', pcfgDict).rank;
  const unknown = rankPCFG('xkqzvbmw123', pcfgDict).rank;
  assert.ok(unknown > known * 1e6, `${unknown.toExponential(2)} vs ${known.toExponential(2)}`);
  assert.ok(unknown > 1e15);
});

test('rankPCFG — la majuscule initiale coûte un facteur 2', () => {
  initPCFG(PCFG_TEST_DATA);
  const lower = rankPCFG('password123', pcfgDict).rank;
  const cap = rankPCFG('Password123', pcfgDict).rank;
  assert.ok(Math.abs(cap / lower - 2) < 0.05, `ratio ${cap / lower}`);
});

test('rankPCFG — données dans un autre format : non applicable, sans exception', () => {
  initPCFG({ structures: {}, terminals: {} });
  assert.equal(rankPCFG('password123', pcfgDict).rank, null);
  initPCFG(null);
});
