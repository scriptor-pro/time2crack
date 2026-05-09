const WEAK_GUESS_RANK = 100;

// Markov attack parameters (v2 rank-based model)
const MARKOV_SOFTCAP_KNEE = 1e15;
const MARKOV_MAX_GUESSES = 1e19;

// Rainbow table parameters (v2 smooth model)
// Note: Rainbow tables require unsalted hashes. With salt, each unique salt = unique table needed.
// This v2 model estimates expected lookup effort from coverage rather than hard thresholds.
const RAINBOW_LOOKUP_BASE_SEC = 0.003;
const RAINBOW_PROBE_SEC = 0.05;
const RAINBOW_EPS = 1e-4;
const RAINBOW_L50 = 7;
const RAINBOW_KL = 1.2;
const RAINBOW_C50 = 50;
const RAINBOW_KC = 8;

// PCFG keyspace estimation (Weir et al. 2009, Wheeler 2016)
// Rank-based approximation: estimate expected candidate rank from skeleton + token classes.
// No live grammar inference; calibrated profile per language loaded from data/pcfg-calibration.json.
const PCFG_SOFTCAP_KNEE = 1e14;
const PCFG_MAX_GUESSES = 1e18;

// Smooth cap to avoid hard plateaus at a fixed value.
// Linear below knee, then asymptotically approaches max.
function softCapGuesses(guesses, knee, max) {
  if (!isFinite(guesses) || guesses <= 0) return max;
  if (guesses <= knee) return guesses;
  const span = Math.max(1, max - knee);
  const overflow = guesses - knee;
  return knee + span * (1 - Math.exp(-overflow / span));
}

function pcfgCharClass(ch) {
  if (/\p{L}/u.test(ch)) return "L";
  if (/\p{N}/u.test(ch)) return "D";
  return "S";
}

function pcfgLengthBucket(n) {
  if (n >= 12) return "12+";
  return String(n);
}

function tokenizeForPCFG(pw) {
  const chars = [...pw.normalize("NFC")];
  if (!chars.length) return [];
  const segs = [];
  let cur = pcfgCharClass(chars[0]);
  let len = 1;
  for (let i = 1; i < chars.length; i++) {
    const cls = pcfgCharClass(chars[i]);
    if (cls === cur) len++;
    else {
      segs.push({ cls: cur, len });
      cur = cls;
      len = 1;
    }
  }
  segs.push({ cls: cur, len });
  return segs;
}

function getPcfgProfile(lang) {
  const source = PCFG_CALIBRATION || DEFAULT_PCFG_CALIBRATION;
  const g = source.global || {};
  const l = (source.langs && source.langs[lang]) || {};

  const tokenBase = g.tokenRanks || {};
  const tokenLang = l.tokenRanks || {};

  return {
    defaultRank: l.defaultRank || g.defaultRank || 50000,
    skeletonRanks: Object.assign({}, g.skeletonRanks || {}, l.skeletonRanks || {}),
    shapeRanks: Object.assign({}, g.shapeRanks || {}, l.shapeRanks || {}),
    tokenRanks: {
      L: Object.assign({}, tokenBase.L || {}, tokenLang.L || {}),
      D: Object.assign({}, tokenBase.D || {}, tokenLang.D || {}),
      S: Object.assign({}, tokenBase.S || {}, tokenLang.S || {}),
    },
    orderMultipliers: Object.assign({}, g.orderMultipliers || {}, l.orderMultipliers || {}),
    shapeMultipliers: Object.assign({}, l.shapeMultipliers || {}),
    classFallback: Object.assign({ L: 32, D: 10, S: 22 }, g.classFallback || {}, l.classFallback || {}),
  };
}

function pcfgKeyspace(pw, lang = state.lang) {
  const segs = tokenizeForPCFG(pw);
  if (!segs.length) return 1;

  const profile = getPcfgProfile(lang);
  const skeletonKey = segs.map((s) => `${s.cls}${pcfgLengthBucket(s.len)}`).join("");
  const shapeKey = segs.map((s) => s.cls).join("");

  let baseRank = profile.skeletonRanks[skeletonKey] || profile.shapeRanks[shapeKey] || profile.defaultRank;
  if (!isFinite(baseRank) || baseRank <= 0) baseRank = profile.defaultRank;

  let lnRank = Math.log(baseRank);

  for (const seg of segs) {
    const bucket = pcfgLengthBucket(seg.len);
    const map = profile.tokenRanks[seg.cls] || {};
    let tokenRank = map[bucket] || map.default;
    if (!isFinite(tokenRank) || tokenRank <= 0) {
      const fallbackBase = profile.classFallback[seg.cls] || 24;
      tokenRank = Math.pow(fallbackBase, Math.min(seg.len, 8));
    }
    lnRank += Math.log(tokenRank);
  }

  const orderMult = (profile.orderMultipliers[shapeKey] || 1) * (profile.shapeMultipliers[shapeKey] || 1);
  lnRank += Math.log(Math.max(orderMult, 0.01));

  // Segment complexity penalty: fragmented structures are usually less likely early.
  if (segs.length > 3) lnRank += Math.log(Math.pow(1.12, segs.length - 3));

  // Numeric stability
  lnRank = Math.max(Math.log(1), Math.min(lnRank, 230));
  const rawRank = Math.exp(lnRank);
  return softCapGuesses(rawRank, PCFG_SOFTCAP_KNEE, PCFG_MAX_GUESSES);
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function getMarkovProfile(lang) {
  const source = MARKOV_CALIBRATION || DEFAULT_MARKOV_CALIBRATION;
  const g = source.global || {};
  const l = (source.langs && source.langs[lang]) || {};
  const tBase = g.tokenRanks || {};
  const tLang = l.tokenRanks || {};

  return {
    defaultRank: l.defaultRank || g.defaultRank || 6_000_000,
    randomRankCap: l.randomRankCap || g.randomRankCap || 5e16,
    skeletonRanks: Object.assign({}, g.skeletonRanks || {}, l.skeletonRanks || {}),
    shapeRanks: Object.assign({}, g.shapeRanks || {}, l.shapeRanks || {}),
    tokenRanks: {
      L: Object.assign({}, tBase.L || {}, tLang.L || {}),
      D: Object.assign({}, tBase.D || {}, tLang.D || {}),
      S: Object.assign({}, tBase.S || {}, tLang.S || {}),
    },
    signalMultipliers: Object.assign({}, g.signalMultipliers || {}, l.signalMultipliers || {}),
    randomModel: Object.assign({
      randomCsCenter: 66,
      randomCsScale: 36,
      randomLenCenter: 11,
      randomLenScale: 10,
    }, g.randomModel || {}, l.randomModel || {}),
    shapeMultipliers: Object.assign({}, l.shapeMultipliers || {}),
    classFallback: Object.assign({ L: 32, D: 10, S: 22 }, g.classFallback || {}, l.classFallback || {}),
  };
}

function markovExpectedGuesses(pw, full, context, lang = state.lang) {
  const segs = tokenizeForPCFG(pw);
  if (!segs.length) return 1;

  const profile = getMarkovProfile(lang);
  const skeletonKey = segs.map((s) => `${s.cls}${pcfgLengthBucket(s.len)}`).join("");
  const shapeKey = segs.map((s) => s.cls).join("");

  let baseRank = profile.skeletonRanks[skeletonKey] || profile.shapeRanks[shapeKey] || profile.defaultRank;
  if (!isFinite(baseRank) || baseRank <= 0) baseRank = profile.defaultRank;

  let lnHumanRank = Math.log(baseRank);
  for (const seg of segs) {
    const bucket = pcfgLengthBucket(seg.len);
    const map = profile.tokenRanks[seg.cls] || {};
    let tokenRank = map[bucket] || map.default;
    if (!isFinite(tokenRank) || tokenRank <= 0) {
      const fb = profile.classFallback[seg.cls] || 24;
      tokenRank = Math.pow(fb, Math.min(seg.len, 8));
    }
    lnHumanRank += Math.log(tokenRank);
  }

  const shapeMult = profile.shapeMultipliers[shapeKey] || 1;
  lnHumanRank += Math.log(Math.max(shapeMult, 0.05));

  // Apply structural signals directly in base rank model.
  const sm = profile.signalMultipliers || {};
  if (context.kbPat) lnHumanRank += Math.log(sm.kbPat || 0.08);
  if (context.seq) lnHumanRank += Math.log(sm.seq || 0.34);
  if (context.dt) lnHumanRank += Math.log(sm.dt || 0.45);
  if (context.rep) lnHumanRank += Math.log(sm.rep || 0.62);
  if (context.hybridVuln) lnHumanRank += Math.log(sm.hybridVuln || 0.52);

  // Mild penalty on highly fragmented shapes.
  if (segs.length > 3) lnHumanRank += Math.log(Math.pow(1.1, segs.length - 3));

  lnHumanRank = Math.max(Math.log(1), Math.min(lnHumanRank, 230));
  const humanRank = Math.exp(lnHumanRank);

  // Continuous interpolation toward random-like search effort.
  const rm = profile.randomModel || {};
  const signalScoreRaw =
    (context.kbPat ? 1.0 : 0) +
    (context.hybridVuln ? 0.8 : 0) +
    (context.seq ? 0.6 : 0) +
    (context.dt ? 0.45 : 0) +
    (context.rep ? 0.35 : 0);
  const signalScore = clamp01(signalScoreRaw / 3.2);
  const csPressure = clamp01((context.cs - (rm.randomCsCenter || 66)) / (rm.randomCsScale || 36));
  const lenPressure = clamp01((context.len - (rm.randomLenCenter || 11)) / (rm.randomLenScale || 10));
  const randomWeight = clamp01(0.58 * csPressure + 0.42 * lenPressure - 0.62 * signalScore);

  const randomRank = Math.max(humanRank, Math.min(full * 0.95, profile.randomRankCap || full));
  const lnBlended =
    (1 - randomWeight) * Math.log(Math.max(humanRank, 1)) +
    randomWeight * Math.log(Math.max(randomRank, 1));
  const blendedRank = Math.exp(Math.max(Math.log(1), Math.min(lnBlended, 230)));

  return softCapGuesses(Math.min(blendedRank, full), MARKOV_SOFTCAP_KNEE, MARKOV_MAX_GUESSES);
}

// PRINCE parameters (v2 rank-based model) — moved here to avoid TDZ references
const PRINCE_SOFTCAP_KNEE = 1e15;
const PRINCE_MAX_GUESSES = 1e19;

// Neural guessing parameters (v2 rank-based model) — moved here to avoid TDZ references
const NEURAL_SOFTCAP_KNEE = 1e15;
const NEURAL_MAX_GUESSES = 1e19;

function getNeuralProfile(lang) {
  const source = NEURAL_CALIBRATION || DEFAULT_NEURAL_CALIBRATION;
  const g = source.global || {};
  const l = (source.langs && source.langs[lang]) || {};
  const tBase = g.tokenRanks || {};
  const tLang = l.tokenRanks || {};

  return {
    defaultRank: l.defaultRank || g.defaultRank || 4_500_000,
    randomRankCap: l.randomRankCap || g.randomRankCap || 8e16,
    skeletonRanks: Object.assign({}, g.skeletonRanks || {}, l.skeletonRanks || {}),
    shapeRanks: Object.assign({}, g.shapeRanks || {}, l.shapeRanks || {}),
    tokenRanks: {
      L: Object.assign({}, tBase.L || {}, tLang.L || {}),
      D: Object.assign({}, tBase.D || {}, tLang.D || {}),
      S: Object.assign({}, tBase.S || {}, tLang.S || {}),
    },
    signalMultipliers: Object.assign({}, g.signalMultipliers || {}, l.signalMultipliers || {}),
    randomModel: Object.assign({
      randomCsCenter: 66,
      randomCsScale: 34,
      randomLenCenter: 11,
      randomLenScale: 9,
    }, g.randomModel || {}, l.randomModel || {}),
    mlBlend: Object.assign({
      neutralProb: 0.5,
      humanBoostMax: 0.12,
      randomPenaltyMax: 2.0,
    }, g.mlBlend || {}, l.mlBlend || {}),
    shapeMultipliers: Object.assign({}, l.shapeMultipliers || {}),
    classFallback: Object.assign({ L: 32, D: 10, S: 22 }, g.classFallback || {}, l.classFallback || {}),
  };
}

function neuralExpectedGuesses(pw, full, context, mlProb, lang = state.lang) {
  const segs = tokenizeForPCFG(pw);
  if (!segs.length) return 1;

  const profile = getNeuralProfile(lang);
  const skeletonKey = segs.map((s) => `${s.cls}${pcfgLengthBucket(s.len)}`).join("");
  const shapeKey = segs.map((s) => s.cls).join("");

  let baseRank = profile.skeletonRanks[skeletonKey] || profile.shapeRanks[shapeKey] || profile.defaultRank;
  if (!isFinite(baseRank) || baseRank <= 0) baseRank = profile.defaultRank;

  let lnHumanRank = Math.log(baseRank);
  for (const seg of segs) {
    const bucket = pcfgLengthBucket(seg.len);
    const map = profile.tokenRanks[seg.cls] || {};
    let tokenRank = map[bucket] || map.default;
    if (!isFinite(tokenRank) || tokenRank <= 0) {
      const fb = profile.classFallback[seg.cls] || 24;
      tokenRank = Math.pow(fb, Math.min(seg.len, 8));
    }
    lnHumanRank += Math.log(tokenRank);
  }

  const shapeMult = profile.shapeMultipliers[shapeKey] || 1;
  lnHumanRank += Math.log(Math.max(shapeMult, 0.05));

  const sm = profile.signalMultipliers || {};
  if (context.kbPat) lnHumanRank += Math.log(sm.kbPat || 0.06);
  if (context.seq) lnHumanRank += Math.log(sm.seq || 0.28);
  if (context.dt) lnHumanRank += Math.log(sm.dt || 0.42);
  if (context.rep) lnHumanRank += Math.log(sm.rep || 0.58);
  if (context.hybridVuln) lnHumanRank += Math.log(sm.hybridVuln || 0.44);
  if (segs.length > 3) lnHumanRank += Math.log(Math.pow(1.08, segs.length - 3));

  const mlCfg = profile.mlBlend || {};
  const neutralProb = isFinite(mlCfg.neutralProb) ? mlCfg.neutralProb : 0.5;
  const fallbackProb = context.looksHuman ? 0.72 : 0.4;
  const p = clamp01(isFinite(mlProb) ? mlProb : fallbackProb);
  const pCentered = p - neutralProb;
  const humanBoostMax = Math.max(0, mlCfg.humanBoostMax || 0.12);
  const randomPenaltyMax = Math.max(0, mlCfg.randomPenaltyMax || 2.0);
  const mlRankMult = pCentered >= 0
    ? Math.max(0.04, 1 - (pCentered / Math.max(1e-3, 1 - neutralProb)) * (1 - humanBoostMax))
    : 1 + ((-pCentered) / Math.max(1e-3, neutralProb)) * (randomPenaltyMax - 1);
  lnHumanRank += Math.log(Math.max(mlRankMult, 0.04));

  lnHumanRank = Math.max(Math.log(1), Math.min(lnHumanRank, 230));
  const humanRank = Math.exp(lnHumanRank);

  const rm = profile.randomModel || {};
  const signalScoreRaw =
    (context.kbPat ? 1.0 : 0) +
    (context.hybridVuln ? 0.8 : 0) +
    (context.seq ? 0.6 : 0) +
    (context.dt ? 0.45 : 0) +
    (context.rep ? 0.35 : 0);
  const signalScore = clamp01(signalScoreRaw / 3.2);
  const csPressure = clamp01((context.cs - (rm.randomCsCenter || 66)) / (rm.randomCsScale || 34));
  const lenPressure = clamp01((context.len - (rm.randomLenCenter || 11)) / (rm.randomLenScale || 9));
  const mlRandomPush = clamp01((neutralProb - p) / Math.max(0.1, neutralProb));
  const randomWeight = clamp01(0.44 * csPressure + 0.34 * lenPressure + 0.32 * mlRandomPush - 0.58 * signalScore);

  const randomRank = Math.max(humanRank, Math.min(full * 0.98, profile.randomRankCap || full));
  const lnBlended =
    (1 - randomWeight) * Math.log(Math.max(humanRank, 1)) +
    randomWeight * Math.log(Math.max(randomRank, 1));
  const blendedRank = Math.exp(Math.max(Math.log(1), Math.min(lnBlended, 230)));

  return softCapGuesses(Math.min(blendedRank, full), NEURAL_SOFTCAP_KNEE, NEURAL_MAX_GUESSES);
}

function getPrinceProfile(lang) {
  const source = PRINCE_CALIBRATION || DEFAULT_PRINCE_CALIBRATION;
  const g = source.global || {};
  const l = (source.langs && source.langs[lang]) || {};
  const tBase = g.tokenRanks || {};
  const tLang = l.tokenRanks || {};
  return {
    defaultRank: l.defaultRank || g.defaultRank || 3_500_000,
    randomRankCap: l.randomRankCap || g.randomRankCap || 1.2e17,
    skeletonRanks: Object.assign({}, g.skeletonRanks || {}, l.skeletonRanks || {}),
    shapeRanks: Object.assign({}, g.shapeRanks || {}, l.shapeRanks || {}),
    tokenRanks: {
      L: Object.assign({}, tBase.L || {}, tLang.L || {}),
      D: Object.assign({}, tBase.D || {}, tLang.D || {}),
      S: Object.assign({}, tBase.S || {}, tLang.S || {}),
    },
    signalMultipliers: Object.assign({}, g.signalMultipliers || {}, l.signalMultipliers || {}),
    randomModel: Object.assign({
      randomCsCenter: 62,
      randomCsScale: 34,
      randomLenCenter: 10,
      randomLenScale: 9,
    }, g.randomModel || {}, l.randomModel || {}),
    shapeMultipliers: Object.assign({}, l.shapeMultipliers || {}),
    classFallback: Object.assign({ L: 30, D: 10, S: 22 }, g.classFallback || {}, l.classFallback || {}),
  };
}

function princeChainabilityScore(pw, context) {
  const parts = pw.split(/[\s_-]+/u).filter(Boolean);
  const hasSeparator = parts.length >= 2;
  const hasDigitTail = /\d{2,4}$/.test(pw);
  const hasSymbolTail = /[^\p{L}\p{N}]$/u.test(pw);
  const longish = context.len >= 9;
  const scoreRaw =
    (context.looksPassphrase ? 1.0 : 0) +
    (hasSeparator ? 0.85 : 0) +
    (context.dictWord ? 0.6 : 0) +
    (hasDigitTail ? 0.35 : 0) +
    (hasSymbolTail ? 0.22 : 0) +
    (longish ? 0.2 : 0) +
    (context.dt ? 0.2 : 0) -
    (context.cs >= 70 && context.len >= 12 ? 0.55 : 0);
  return clamp01(scoreRaw / 2.8);
}

function princeExpectedGuesses(pw, full, context, lang = state.lang) {
  const segs = tokenizeForPCFG(pw);
  if (!segs.length) return 1;

  const profile = getPrinceProfile(lang);
  const skeletonKey = segs.map((s) => `${s.cls}${pcfgLengthBucket(s.len)}`).join("");
  const shapeKey = segs.map((s) => s.cls).join("");

  let baseRank = profile.skeletonRanks[skeletonKey] || profile.shapeRanks[shapeKey] || profile.defaultRank;
  if (!isFinite(baseRank) || baseRank <= 0) baseRank = profile.defaultRank;

  let lnHumanRank = Math.log(baseRank);
  for (const seg of segs) {
    const bucket = pcfgLengthBucket(seg.len);
    const map = profile.tokenRanks[seg.cls] || {};
    let tokenRank = map[bucket] || map.default;
    if (!isFinite(tokenRank) || tokenRank <= 0) {
      const fb = profile.classFallback[seg.cls] || 24;
      tokenRank = Math.pow(fb, Math.min(seg.len, 8));
    }
    lnHumanRank += Math.log(tokenRank);
  }

  const shapeMult = profile.shapeMultipliers[shapeKey] || 1;
  lnHumanRank += Math.log(Math.max(shapeMult, 0.05));

  const sm = profile.signalMultipliers || {};
  if (context.looksPassphrase) lnHumanRank += Math.log(sm.looksPassphrase || 0.28);
  if (context.hasSeparator) lnHumanRank += Math.log(sm.hasSeparator || 0.52);
  if (context.dictWord) lnHumanRank += Math.log(sm.dictWord || 0.6);
  if (context.dt) lnHumanRank += Math.log(sm.dt || 0.55);
  if (context.seq) lnHumanRank += Math.log(sm.seq || 0.75);
  if (segs.length > 3) lnHumanRank += Math.log(Math.pow(1.1, segs.length - 3));

  lnHumanRank = Math.max(Math.log(1), Math.min(lnHumanRank, 230));
  const humanRank = Math.exp(lnHumanRank);

  const rm = profile.randomModel || {};
  const chainability = princeChainabilityScore(pw, context);
  const csPressure = clamp01((context.cs - (rm.randomCsCenter || 62)) / (rm.randomCsScale || 34));
  const lenPressure = clamp01((context.len - (rm.randomLenCenter || 10)) / (rm.randomLenScale || 9));
  const randomWeight = clamp01(0.5 * csPressure + 0.35 * lenPressure - 0.7 * chainability);

  const randomRank = Math.max(humanRank, Math.min(full * 0.98, profile.randomRankCap || full));
  const lnBlended =
    (1 - randomWeight) * Math.log(Math.max(humanRank, 1)) +
    randomWeight * Math.log(Math.max(randomRank, 1));
  const blendedRank = Math.exp(Math.max(Math.log(1), Math.min(lnBlended, 230)));

  return {
    guesses: softCapGuesses(Math.min(blendedRank, full), PRINCE_SOFTCAP_KNEE, PRINCE_MAX_GUESSES),
    chainability,
  };
}

// ============================================================
// COMBINATOR KEYSPACE (Dynamic calculation)
// ============================================================
// Remplace la constante fixe en calculant le keyspace en fonction du nombre de mots.
// Basé sur empirical data de rockyou2021 (Stockell et al. 2013):
//   - 57,549 passphrases à 2 mots
//   - 1,794 passphrases à 3 mots
//   - 534 passphrases à 4+ mots
//
// Modèle: keyspace ≈ dictSize ^ exponent(numWords)
// où exponent varie selon le nombre de mots détectés.
//
// Exemples:
//   "correct horse battery staple" (4 words) + 200k dict
//   → keyspace ≈ (200k)^1.6 ≈ 1.1e14 guesses ≈ 180,000 sec ≈ 50 heures
//
//   "the and a" (3 words ultra-courants) + 200k dict
//   → keyspace ≈ (200k)^1.3 ≈ 6.3e15... (mais sera approprié pour combos très rares)

function calculateCombiKeyspace(pw, dictWords, looksPassphrase) {
  // Fallback : si les conditions ne sont pas remplies, retourner la constante par défaut
  if (!looksPassphrase || !dictWords || !(dictWords instanceof Set)) {
    return 3e9;  // 3 milliards — valeur de sécurité conservatrice
  }

  // Détecter les segments (mots séparés par espaces, tirets, etc.)
  // Minimum 3 caractères par segment (exclu "a", "I", "to")
  const segments = pw.toLowerCase()
    .split(/[^\p{L}]+/u)  // Split on non-letters (preserves accents)
    .filter(s => s.length >= 3);

  // Si moins de 2 mots, ce n'est pas une passphrase — retourner fallback
  if (segments.length < 2) {
    return 3e9;
  }

  const numWords = segments.length;
  const dictSize = Math.max(dictWords.size, 1000);  // Avoid division by zero edge case

  // Exposants empiriques par nombre de mots
  // Basés sur calibration rockyou2021
  // Logique: plus de mots = espace plus grand exponentiellement
  const exponentsByWords = {
    2: 1.0,   // 2-word: rockyou contient ~57k, donc D^1.0
    3: 1.3,   // 3-word: rockyou contient ~1.8k (32× moins), donc D^1.3
    4: 1.6,   // 4-word: rockyou contient ~534 (110× moins), donc D^1.6
    5: 2.0,   // 5-word: rockyou contient ~100, très rare, donc D^2.0
  };

  // Pour 6+ mots, utiliser une extrapolation conservative
  const exponent = exponentsByWords[numWords] ?? Math.min(numWords - 0.5, 3.0);

  // Calculer le keyspace
  const keyspace = Math.pow(dictSize, exponent);

  // Vérifier que le résultat est valide (pas NaN, pas Infinity)
  if (!isFinite(keyspace) || keyspace <= 0) {
    return 3e9;  // Fallback sur erreur
  }

  return keyspace;
}

// Constante de fallback (gardée pour compatibilité et comme default)
// Utilisée si calculateCombiKeyspace() échoue ou si looksPassphrase est false
const COMBI_KEYSPACE = 3e9;

// Hybrid attack keyspace: wordlist × mutation rules
// Ma et al. 2014 (IEEE S&P): top-1000 passwords cracked within first ~8-10 rules (median 450 guesses)
// Common word (TOP_100/COMMON): ~500 guesses (Ma 2014 measured median, best64 prioritized)
// Dict word (any position in wordlist, 50k–200k entries): Ma 2014 measured 5k–200k range.
//   Geometric mean of [5000, 200000] ≈ 31 600. Rounded conservatively to 25 000.
//   (Old value of 8 000 only reflected top-10k words — under-estimated by 10–25× for rare words.)
const HYBRID_KEYSPACE_COMMON = 500;      // Ma et al. 2014 (IEEE S&P) — measured median, top-100 words
const HYBRID_KEYSPACE_DICT = 25_000;     // Ma et al. 2014 — geometric median across full wordlist range

// Advanced rule engine keyspace (hashcat/JtR rule stacks)
const RULE_KEYSPACE = 250e6;

// Morphological variants around dictionary roots
// Kiesel et al. 2022 (PassMorph): ~150 variants/word (inflections + leet + diacritics) × 200k words
const MORPH_KEYSPACE = 30e6;

// Targeted OSINT candidate space (names, dates, org/context tokens)
// Bonneau et al. 2012 (IEEE S&P): OSINT-driven attack generates 10^3–10^5 usable candidates
// CUPP README: 600–2000 candidates for a full profile; 500k is already generous with permutations
const TARGETED_KEYSPACE = 500_000;

// High-fidelity calibration controls
const HF_MULT_MIN = 0.08;
const HF_MULT_MAX = 20;

// ============================================================
// HASH RATES — 12× RTX 4090 (Official Hashcat v6.2.6 benchmarks)
// Source: https://gist.github.com/Chick3nman/32e662a5bb63bc4f51b847bb422222fd
// ============================================================
const ALGOS = [
  { key: "md5",     name: "MD5",              rate: 168.9e9 * 12,  salted: false }, // 2,026.8 GH/s — Chick3nman RTX 4090 benchmark
  { key: "sha1",    name: "SHA-1",             rate: 50.86e9 * 12,  salted: false }, // 610.3 GH/s
  { key: "sha256",  name: "SHA-256",           rate: 22.68e9 * 12,  salted: false }, // 272.2 GH/s
  { key: "ntlm",    name: "NTLM",              rate: 288.5e9 * 12,  salted: false }, // 3,462 GH/s
  { key: "mysql",   name: "MySQL5",            rate: 22292e6 * 12,  salted: false }, // 267.5 GH/s — SHA1(SHA1(pw)), mode -m 300
  { key: "bcrypt",  name: "bcrypt (cost 10)",  rate: 5750 * 12,     salted: true  }, // 69 kH/s — cost 5: 184kH/s/GPU → cost 10: /2^5
  { key: "bcrypt12",name: "bcrypt (cost 12)",  rate: 1438 * 12,     salted: true  }, // 17.3 kH/s — cost 10: 5750/2^2
  { key: "scrypt",  name: "scrypt",            rate: 7126 * 12,     salted: true  }, // 85.5 kH/s — N=16384 r=8 p=1, mode -m 8900
  { key: "pbkdf2",  name: "PBKDF2-SHA256",     rate: Math.round(8865700 * 999 / 600000) * 12, salted: true }, // ~177 kH/s/GPU @ 600k iter (OWASP 2023) × 12
  { key: "argon2",  name: "Argon2id",          rate: 800,           salted: true  }, // ~800 H/s (conservative estimate)
];

// ============================================================
// COMMON PASSWORDS & PATTERNS
// ============================================================
// Generated from data/common-passwords.json via scripts/sync-common-passwords.mjs
// Generated from data/common-passwords.json via scripts/sync-common-passwords.mjs

// Top 100 most common passwords worldwide (instant crack detection)
const TOP_100 = new Set([
  "password",
  "123456",
  "12345678",
  "qwerty",
  "abc123",
  "monkey",
  "1234567",
  "letmein",
  "trustno1",
  "dragon",
  "baseball",
  "iloveyou",
  "master",
  "sunshine",
  "ashley",
  "bailey",
  "passw0rd",
  "shadow",
  "123123",
  "654321",
  "superman",
  "qazwsx",
  "michael",
  "football",
  "password1",
  "admin",
  "welcome",
  "hello",
  "charlie",
  "donald",
  "princess",
  "qwerty123",
  "solo",
  "loveme",
  "starwars",
  "azerty",
  "soleil",
  "bonjour",
  "000000",
  "111111",
  "1234",
  "12345",
  "123456789",
  "1234567890",
  "666666",
  "696969",
  "888888",
  "abcdef",
  "access",
  "amor",
  "batman",
  "cheese",
  "computer",
  "flower",
  "freedom",
  "google",
  "jesus",
  "jordan",
  "killer",
  "maggie",
  "matrix",
  "mustang",
  "nicole",
  "pass",
  "pepper",
  "robert",
  "samantha",
  "soccer",
  "thomas",
  "thunder",
  "112233",
  "123321",
  "123qwe",
  "123abc",
  "1234qwer",
  "987654321",
  "1111111",
  "555555",
  "7777777",
  "999999",
  "88888888",
  "121212",
  "12121212",
  "1q2w3e",
  "1q2w3e4r",
  "1q2w3e4r5t",
  "qwertyuiop",
  "zxcvbnm",
  "asdfgh",
  "asdfghjkl",
  "qwe123",
  "test123",
  "welcome1",
  "changeme",
  "default",
  "root",
  "user",
]);

const COMMON = new Set([
  "password",
  "123456",
  "12345678",
  "qwerty",
  "abc123",
  "monkey",
  "1234567",
  "letmein",
  "trustno1",
  "dragon",
  "baseball",
  "iloveyou",
  "master",
  "sunshine",
  "ashley",
  "bailey",
  "passw0rd",
  "shadow",
  "123123",
  "654321",
  "superman",
  "qazwsx",
  "michael",
  "football",
  "password1",
  "admin",
  "welcome",
  "hello",
  "charlie",
  "donald",
  "princess",
  "qwerty123",
  "solo",
  "loveme",
  "starwars",
  "azerty",
  "soleil",
  "bonjour",
  "000000",
  "111111",
  "1234",
  "12345",
  "123456789",
  "1234567890",
  "666666",
  "696969",
  "888888",
  "abcdef",
  "access",
  "amor",
  "batman",
  "cheese",
  "computer",
  "flower",
  "freedom",
  "google",
  "jesus",
  "jordan",
  "killer",
  "maggie",
  "matrix",
  "mustang",
  "nicole",
  "pass",
  "pepper",
  "robert",
  "samantha",
  "soccer",
  "thomas",
  "thunder",
  "112233",
  "123321",
  "123qwe",
  "123abc",
  "1234qwer",
  "987654321",
  "1111111",
  "555555",
  "7777777",
  "999999",
  "88888888",
  "121212",
  "12121212",
  "1q2w3e",
  "1q2w3e4r",
  "1q2w3e4r5t",
  "qwertyuiop",
  "zxcvbnm",
  "asdfgh",
  "asdfghjkl",
  "qwe123",
  "test123",
  "welcome1",
  "changeme",
  "default",
  "root",
  "user",
  "qwertz",
  "iloveu",
  "whatever",
  "pass123",
  "susana",
  "maria",
  "virginia",
  "veronica",
  "lorena",
  "monica",
  "claudia",
  "passwort",
  "parola",
  "123",
  "12345678910",
  "admin123",
  "admin@123",
  "admintelecom",
  "aa123456",
  "aa@123456",
  "pass@123",
  "p@ssw0rd",
  "skibidi",
  "pakistan123",
  "marta",
  "margarita",
  "rodolfo",
  "valentina",
  "graciela",
  "contraseña",
  "zaq1zaq1",
  "login",
  "password123",
  "azerty123",
  "azertyuiop",
  "azertyuiop1",
  "azerty1234",
  "azerty12345",
  "nicolas",
  "pierre",
  "alexandre",
  "julien",
  "camille",
  "sophie",
  "marie",
  "chloe",
  "lea",
  "emma",
  "lucas",
  "hugo",
  "maxime",
  "mathieu",
  "motdepasse",
  "bienvenue",
  "marseille",
  "paris123",
  "chocolat",
  "secret",
  "jetaime",
  "amour",
  "loulou",
  "doudou",
  "toto",
  "titi",
  "tata",
  "coucou",
  "france123",
  "france2024",
  "paris2024",
  "soleil123",
  "bonjour1",
  "merde",
  "nounours",
  "mamour",
  "chouchou",
  "alejandro",
  "carlos",
  "juan",
  "diego",
  "andres",
  "pablo",
  "fernando",
  "jose",
  "miguel",
  "antonio",
  "isabel",
  "carmen",
  "lucia",
  "ana",
  "elena",
  "rosa",
  "pedro",
  "rafael",
  "manuel",
  "contraseña1",
  "hola123",
  "españa",
  "españa123",
  "madrid123",
  "barcelona",
  "futbol",
  "teamo",
  "miamor",
  "corazon",
  "tigre123",
  "estrella",
  "sebastian",
  "campeones",
  "españa2024",
  "madrid2024",
  "joao",
  "matheus",
  "gabriel",
  "thiago",
  "rodrigo",
  "fernanda",
  "julia",
  "beatriz",
  "camila",
  "leticia",
  "amanda",
  "bruna",
  "senha123",
  "brasil",
  "brasil123",
  "brasil2024",
  "portugal",
  "portugal123",
  "flamengo",
  "corinthians",
  "palmeiras",
  "saopaulo",
  "rio123",
  "beijo",
  "saudade",
  "meuamor",
  "porto123",
  "qwertzuiop",
  "qwertz123",
  "qwertzuiop1",
  "stefan",
  "andreas",
  "peter",
  "christian",
  "daniel",
  "markus",
  "tobias",
  "sarah",
  "anna",
  "lena",
  "laura",
  "lisa",
  "sandra",
  "passwort1",
  "hallo123",
  "deutschland",
  "deutschland123",
  "berlin123",
  "münchen",
  "hallo",
  "willkommen",
  "geheim",
  "schatz",
  "fußball",
  "schalke04",
  "dortmund123",
  "hamburg123",
  "germany2024",
  "mehmet",
  "mustafa",
  "ahmet",
  "ali",
  "hasan",
  "huseyin",
  "ibrahim",
  "ismail",
  "ayse",
  "fatma",
  "hatice",
  "zeynep",
  "elif",
  "esra",
  "burak",
  "mert",
  "emre",
  "can",
  "sifre123",
  "turkiye",
  "türkiye",
  "türkiye123",
  "istanbul",
  "istanbul123",
  "ankara",
  "galatasaray",
  "fenerbahce",
  "besiktas",
  "merhaba",
  "seviyorum",
  "sifrem",
  "turkey2024",
  "marco",
  "luca",
  "matteo",
  "andrea",
  "davide",
  "simone",
  "giuseppe",
  "giovanni",
  "francesco",
  "sofia",
  "giulia",
  "martina",
  "francesca",
  "sara",
  "chiara",
  "alessia",
  "ciao123",
  "italia",
  "italia123",
  "roma123",
  "milano",
  "napoli",
  "juventus",
  "forza",
  "amore123",
  "sole123",
  "bella123",
  "benvenuto",
  "inter123",
  "italy2024",
  "roma2024",
  "piotr",
  "krzysztof",
  "andrzej",
  "tomasz",
  "adam",
  "marek",
  "kamil",
  "michal",
  "malgorzata",
  "agnieszka",
  "barbara",
  "ewa",
  "katarzyna",
  "magdalena",
  "monika",
  "joanna",
  "haslo123",
  "polska",
  "polska123",
  "warszawa",
  "krakow",
  "zxcvbnm1",
  "tajne",
  "witaj",
  "cześć",
  "poland2024",
  "warszawa123",
  "jan",
  "piet",
  "kees",
  "henk",
  "gerrit",
  "dirk",
  "wouter",
  "frank",
  "anne",
  "linda",
  "welkom123",
  "nederland",
  "nederland123",
  "amsterdam",
  "amsterdam123",
  "rotterdam",
  "utrecht",
  "wachtwoord1",
  "geheim123",
  "oranje",
  "ajax123",
  "psv123",
  "feyenoord",
  "lekker",
  "gezellig",
  "dutch2024",
]);
