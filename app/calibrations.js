const DEFAULT_PCFG_CALIBRATION = {
  version: 1,
  global: {
    defaultRank: 40000,
    skeletonRanks: {
      L8D2: 22000,
      L6D4: 28000,
      L8D4: 42000,
      L10: 60000,
      L8D2S1: 18000,
      L7D1S1: 26000,
      L6D2S1: 30000,
    },
    shapeRanks: {
      LDS: 28000,
      LD: 32000,
      L: 75000,
      DL: 90000,
      DLS: 70000,
      SLD: 120000,
      LS: 65000,
    },
    tokenRanks: {
      L: {
        1: 6,
        2: 16,
        3: 30,
        4: 55,
        5: 90,
        6: 140,
        7: 210,
        8: 300,
        9: 420,
        10: 560,
        11: 760,
        "12+": 1100,
        default: 180,
      },
      D: {
        1: 4,
        2: 9,
        3: 20,
        4: 45,
        5: 90,
        6: 180,
        7: 330,
        8: 600,
        "12+": 1800,
        default: 75,
      },
      S: {
        1: 8,
        2: 24,
        3: 60,
        4: 140,
        5: 300,
        6: 600,
        "12+": 2200,
        default: 120,
      },
    },
    orderMultipliers: {
      LD: 0.62,
      LDS: 0.58,
      LSD: 0.72,
      L: 1.0,
      DL: 1.35,
      DLS: 1.2,
      SLD: 1.45,
    },
    classFallback: { L: 32, D: 10, S: 22 },
  },
  langs: {
    en: { shapeMultipliers: { LD: 0.9, LDS: 0.88, L: 0.95 } },
    fr: { shapeMultipliers: { LD: 0.94, LDS: 0.93, L: 0.98 } },
    es: { shapeMultipliers: { LD: 0.95, LDS: 0.94 } },
    pt: { shapeMultipliers: { LD: 0.95, LDS: 0.94 } },
    de: { shapeMultipliers: { LD: 0.96, LDS: 0.95, L: 1.02 } },
    tr: { shapeMultipliers: { LD: 0.97, LDS: 0.95 } },
    it: { shapeMultipliers: { LD: 0.95, LDS: 0.94 } },
    pl: { shapeMultipliers: { LD: 0.98, LDS: 0.96 } },
    nl: { shapeMultipliers: { LD: 0.96, LDS: 0.95 } },
  },
};

async function loadPcfgCalibration() {
  if (PCFG_CALIBRATION || PCFG_CALIB_LOADING) return;
  PCFG_CALIB_LOADING = true;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("data/pcfg-calibration.json", { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(res.status);
    const json = await res.json();
    if (json && typeof json === "object") PCFG_CALIBRATION = json;
  } catch (err) {
    console.warn("PCFG calibration load failed:", err.message);
    PCFG_CALIBRATION = null;
  } finally {
    PCFG_CALIB_LOADING = false;
    if (input && input.value.length) render();
  }
}

const DEFAULT_MARKOV_CALIBRATION = {
  version: 1,
  global: {
    defaultRank: 6_000_000,
    randomRankCap: 5e16,
    skeletonRanks: {
      L8D2: 1_200_000,
      L6D4: 1_500_000,
      L8D4: 2_800_000,
      L8D2S1: 900_000,
      L10: 4_500_000,
    },
    shapeRanks: {
      L: 4_800_000,
      LD: 2_200_000,
      LDS: 1_300_000,
      DL: 6_800_000,
      DLS: 5_500_000,
      LS: 3_200_000,
      SLD: 8_000_000,
    },
    tokenRanks: {
      L: {
        1: 4,
        2: 10,
        3: 18,
        4: 30,
        5: 45,
        6: 64,
        7: 86,
        8: 112,
        9: 145,
        10: 190,
        11: 240,
        "12+": 340,
        default: 80,
      },
      D: {
        1: 3,
        2: 7,
        3: 14,
        4: 26,
        5: 50,
        6: 92,
        7: 160,
        8: 280,
        "12+": 720,
        default: 36,
      },
      S: {
        1: 6,
        2: 16,
        3: 38,
        4: 88,
        5: 190,
        6: 380,
        "12+": 1200,
        default: 65,
      },
    },
    signalMultipliers: {
      kbPat: 0.08,
      seq: 0.34,
      dt: 0.45,
      rep: 0.62,
      hybridVuln: 0.52,
    },
    randomModel: {
      randomCsCenter: 66,
      randomCsScale: 36,
      randomLenCenter: 11,
      randomLenScale: 10,
    },
  },
  langs: {
    en: { shapeMultipliers: { LD: 0.88, LDS: 0.84, L: 0.92 } },
    fr: { shapeMultipliers: { LD: 0.93, LDS: 0.9, L: 0.97 } },
    es: { shapeMultipliers: { LD: 0.94, LDS: 0.91 } },
    pt: { shapeMultipliers: { LD: 0.94, LDS: 0.91 } },
    de: { shapeMultipliers: { LD: 0.95, LDS: 0.93, L: 1.03 } },
    tr: { shapeMultipliers: { LD: 0.96, LDS: 0.93 } },
    it: { shapeMultipliers: { LD: 0.94, LDS: 0.91 } },
    pl: { shapeMultipliers: { LD: 0.97, LDS: 0.94 } },
    nl: { shapeMultipliers: { LD: 0.95, LDS: 0.93 } },
  },
};

async function loadMarkovCalibration() {
  if (MARKOV_CALIBRATION || MARKOV_CALIB_LOADING) return;
  MARKOV_CALIB_LOADING = true;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("data/markov-calibration.json", { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(res.status);
    const json = await res.json();
    if (json && typeof json === "object") MARKOV_CALIBRATION = json;
  } catch (err) {
    console.warn("Markov calibration load failed:", err.message);
    MARKOV_CALIBRATION = null;
  } finally {
    MARKOV_CALIB_LOADING = false;
    if (input && input.value.length) render();
  }
}

const DEFAULT_NEURAL_CALIBRATION = {
  version: 1,
  global: {
    defaultRank: 4_500_000,
    randomRankCap: 8e16,
    skeletonRanks: {
      L8D2: 700_000,
      L6D4: 1_100_000,
      L8D4: 1_900_000,
      L8D2S1: 480_000,
      L7D1S1: 700_000,
      L10: 2_800_000,
    },
    shapeRanks: {
      L: 3_800_000,
      LD: 1_500_000,
      LDS: 820_000,
      DL: 5_500_000,
      DLS: 4_200_000,
      LS: 2_400_000,
      SLD: 7_000_000,
    },
    tokenRanks: {
      L: {
        1: 3,
        2: 8,
        3: 14,
        4: 22,
        5: 34,
        6: 50,
        7: 70,
        8: 95,
        9: 125,
        10: 165,
        11: 210,
        "12+": 300,
        default: 62,
      },
      D: {
        1: 2,
        2: 5,
        3: 10,
        4: 20,
        5: 40,
        6: 80,
        7: 145,
        8: 250,
        "12+": 680,
        default: 30,
      },
      S: {
        1: 4,
        2: 11,
        3: 28,
        4: 68,
        5: 150,
        6: 320,
        "12+": 1000,
        default: 52,
      },
    },
    signalMultipliers: {
      kbPat: 0.06,
      seq: 0.28,
      dt: 0.42,
      rep: 0.58,
      hybridVuln: 0.44,
    },
    randomModel: {
      randomCsCenter: 66,
      randomCsScale: 34,
      randomLenCenter: 11,
      randomLenScale: 9,
    },
    mlBlend: {
      neutralProb: 0.5,
      humanBoostMax: 0.12,
      randomPenaltyMax: 2.0,
    },
    classFallback: { L: 32, D: 10, S: 22 },
  },
  langs: {
    en: { shapeMultipliers: { LD: 0.82, LDS: 0.78, L: 0.9 } },
    fr: { shapeMultipliers: { LD: 0.88, LDS: 0.84, L: 0.95 } },
    es: { shapeMultipliers: { LD: 0.9, LDS: 0.86 } },
    pt: { shapeMultipliers: { LD: 0.9, LDS: 0.86 } },
    de: { shapeMultipliers: { LD: 0.92, LDS: 0.88, L: 0.98 } },
    tr: { shapeMultipliers: { LD: 0.93, LDS: 0.89 } },
    it: { shapeMultipliers: { LD: 0.9, LDS: 0.86 } },
    pl: { shapeMultipliers: { LD: 0.94, LDS: 0.9 } },
    nl: { shapeMultipliers: { LD: 0.92, LDS: 0.88 } },
  },
};

async function loadNeuralCalibration() {
  if (NEURAL_CALIBRATION || NEURAL_CALIB_LOADING) return;
  NEURAL_CALIB_LOADING = true;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("data/neural-calibration.json", { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(res.status);
    const json = await res.json();
    if (json && typeof json === "object") NEURAL_CALIBRATION = json;
  } catch (err) {
    console.warn("Neural calibration load failed:", err.message);
    NEURAL_CALIBRATION = null;
  } finally {
    NEURAL_CALIB_LOADING = false;
    if (input && input.value.length) render();
  }
}

const DEFAULT_PRINCE_CALIBRATION = {
  version: 1,
  global: {
    defaultRank: 3_500_000,
    randomRankCap: 1.2e17,
    skeletonRanks: {
      L8D2: 520_000,
      L6D4: 760_000,
      L8D2S1: 360_000,
      L4L4D2: 420_000,
      L5L5: 580_000,
    },
    shapeRanks: {
      L: 4_200_000,
      LD: 1_800_000,
      LDS: 840_000,
      LL: 1_200_000,
      LLD: 700_000,
      LLS: 620_000,
      DL: 5_300_000,
      DLS: 4_100_000,
    },
    tokenRanks: {
      L: {
        1: 3,
        2: 7,
        3: 12,
        4: 18,
        5: 26,
        6: 38,
        7: 52,
        8: 70,
        9: 92,
        10: 120,
        "12+": 240,
        default: 52,
      },
      D: {
        1: 2,
        2: 4,
        3: 8,
        4: 16,
        5: 34,
        6: 68,
        7: 120,
        8: 220,
        "12+": 600,
        default: 22,
      },
      S: {
        1: 4,
        2: 10,
        3: 24,
        4: 58,
        5: 130,
        6: 280,
        "12+": 900,
        default: 44,
      },
    },
    signalMultipliers: {
      looksPassphrase: 0.28,
      hasSeparator: 0.52,
      dictWord: 0.6,
      dt: 0.55,
      seq: 0.75,
    },
    randomModel: {
      randomCsCenter: 62,
      randomCsScale: 34,
      randomLenCenter: 10,
      randomLenScale: 9,
    },
    classFallback: { L: 30, D: 10, S: 22 },
  },
  langs: {
    en: { shapeMultipliers: { LL: 0.84, LLD: 0.8, LLS: 0.78 } },
    fr: { shapeMultipliers: { LL: 0.88, LLD: 0.84, LLS: 0.82 } },
    es: { shapeMultipliers: { LL: 0.9, LLD: 0.86 } },
    pt: { shapeMultipliers: { LL: 0.9, LLD: 0.86 } },
    de: { shapeMultipliers: { LL: 0.92, LLD: 0.88 } },
    tr: { shapeMultipliers: { LL: 0.93, LLD: 0.89 } },
    it: { shapeMultipliers: { LL: 0.9, LLD: 0.86 } },
    pl: { shapeMultipliers: { LL: 0.94, LLD: 0.9 } },
    nl: { shapeMultipliers: { LL: 0.92, LLD: 0.88 } },
  },
};

async function loadPrinceCalibration() {
  if (PRINCE_CALIBRATION || PRINCE_CALIB_LOADING) return;
  PRINCE_CALIB_LOADING = true;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("data/prince-calibration.json", { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(res.status);
    const json = await res.json();
    if (json && typeof json === "object") PRINCE_CALIBRATION = json;
  } catch (err) {
    console.warn("Prince calibration load failed:", err.message);
    PRINCE_CALIBRATION = null;
  } finally {
    PRINCE_CALIB_LOADING = false;
    if (input && input.value.length) render();
  }
}

// ============================================================
// ROCKYOU BLOOM FILTER (lazy-loaded)
// ============================================================

/**
 * FNV1a 32-bit hash function (identical to Node.js script)
 * Used for double-hashing in bloom filter
 */
function fnv1a32(str, seed) {
  seed = seed >>> 0; // ensure uint32
  for (let i = 0; i < str.length; i++) {
    seed ^= str.charCodeAt(i);
    seed = Math.imul(seed, 16777619) >>> 0;
  }
  return seed >>> 0;
}

/**
 * Check if password exists in bloom filter
 * Returns true if "definitely maybe" (with 1% false positive rate)
 */
function bloomHas(filter, word) {
  if (!filter) return false;
  const { bitArray, m, k } = filter;
  const w = word.toLowerCase();

  // Double hashing: compute k positions
  const h1 = fnv1a32(w, 2166136261);
  const h2 = fnv1a32(w, 0x811c9dc5);

  for (let i = 0; i < k; i++) {
    const pos = (h1 + ((i * h2) >>> 0)) % m;
    const byteIdx = Math.floor(pos / 8);
    const bitIdx = pos % 8;

    // If any bit is 0, word is definitely not in set
    if ((bitArray[byteIdx] & (1 << bitIdx)) === 0) {
      return false;
    }
  }

  // All bits set, word might be in set (with ~1% false positive)
  return true;
}

/**
 * Load bloom filter from data/rockyou.bloom
 * This is a user-triggered action (not automatic on page load)
 */
async function loadBloomFilter() {
  if (BLOOM_LOADING || BLOOM_LOADED) return;
  BLOOM_LOADING = true;

  const bloomLoadingEl = safe("bloom-loading");
  const bloomBtnEl = safe("bloom-check-btn");
  const bloomTriggerEl = safe("bloom-trigger");

  if (bloomLoadingEl) bloomLoadingEl.hidden = false;
  if (bloomBtnEl) bloomBtnEl.disabled = true;
  updateBloomBanner("loading");

  try {
    const res = await fetch("data/rockyou.bloom");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buf = await res.arrayBuffer();
    const view = new DataView(buf);

    // Read header (20 bytes, little-endian)
    const magic = view.getUint32(0, false);
    if (magic !== 0x424c4f4f) {
      throw new Error("Invalid bloom filter format (magic number mismatch)");
    }

    const m = view.getUint32(8, true);
    const k = view.getUint32(12, true);
    // const n = view.getUint32(16, true);

    // Zero-copy view of bit array (no memory duplication)
    const bitArray = new Uint8Array(buf, 20);

    BLOOM_FILTER = { bitArray, m, k };
    BLOOM_LOADED = true;

    // Check current password if one is entered
    if (input && input.value.length) {
      checkBloom(input.value);
    }
    updateBloomBanner(BLOOM_RESULT);
  } catch (e) {
    console.error("Failed to load bloom filter:", e);
    BLOOM_RESULT = "error";
    BLOOM_LOADED = false; // allow retry
    updateBloomBanner("error");
  } finally {
    BLOOM_LOADING = false;
    if (bloomLoadingEl) bloomLoadingEl.hidden = true;
    if (bloomBtnEl) bloomBtnEl.disabled = false;
    // Don't hide bloom-trigger here — render() controls visibility
  }
}

/**
 * Check password against loaded bloom filter
 */
function checkBloom(pw) {
  if (!BLOOM_FILTER || !pw) return;
  const found = bloomHas(BLOOM_FILTER, pw);
  BLOOM_RESULT = found ? "found" : "not_found";
  updateBloomBanner(BLOOM_RESULT);
}

/**
 * Update bloom filter UI banners based on state
 */
function updateBloomBanner(state) {
  const bannerEl = safe("bloom-banner");
  const safeEl = safe("bloom-safe");
  const errorEl = safe("bloom-error");
  const badge = safe("rockyou-status-badge");
  const hintEl = safe("rockyou-hint");
  const wrapperEl = safe("qp-rockyou-wrapper");

  if (bannerEl) bannerEl.hidden = state !== "found";
  if (safeEl) safeEl.hidden = state !== "not_found";
  if (errorEl) errorEl.hidden = state !== "error";

  // Update compact badge in status bar
  if (badge) {
    if (state === "found") {
      badge.textContent = LANG === "fr" ? "💀 Trouvé - votre mot de passe est dans la fuite RockYou" : "💀 Found - your password is in the RockYou leak";
      badge.style.background = "var(--critical)";
      badge.style.color = "#fff";
      if (hintEl) hintEl.hidden = true;
    } else if (state === "not_found") {
      badge.textContent = LANG === "fr" ? "✓ Absent de RockYou" : "✓ Not in RockYou";
      badge.style.background = "var(--success)";
      badge.style.color = "#fff";
      if (hintEl) hintEl.hidden = true;
    } else if (state === "loading") {
      badge.textContent = "⏳ " + t("bloomLoading").slice(0, 20) + "…";
      badge.style.background = "var(--surface-elev)";
      badge.style.color = "var(--text-muted)";
    } else if (state === "error") {
      badge.textContent = "⚠ " + t("bloomError");
      badge.style.background = "var(--warning)";
      badge.style.color = "#fff";
    } else {
      // null: not loaded yet — show trigger button state
      badge.textContent = "—";
      badge.style.background = "";
      badge.style.color = "";
    }
  }
  // Show/hide the RockYou wrapper only when there's a password
  if (wrapperEl) wrapperEl.hidden = false;
}

/**
 * Generate morphological variations of a word (plurals, verb forms, suffixes)
 * Detects ~80% of common morphological variations across languages
 * Supports EN, FR, ES, PT, DE, TR, IT, PL, NL
 */
function getMorphVariations(word) {
  const variations = new Set([word]); // Include original
  const w = word.toLowerCase();

  // Helper: safely remove suffix and handle consonant doubling
  const removeSuffix = (word, suffix, replacement = '') => {
    if (word.endsWith(suffix)) {
      let stem = word.slice(0, -suffix.length) + replacement;
      // Handle doubled consonants (running → run, not runn)
      if (suffix === 'ing' && stem.length > 3) {
        const lastChar = stem[stem.length - 1];
        const secondLast = stem[stem.length - 2];
        if (lastChar === secondLast && /[aeiouy]/.test(stem[stem.length - 3])) {
          stem = stem.slice(0, -1); // Remove one double letter
        }
      }
      return stem.length >= 3 ? stem : null;
    }
    return null;
  };

  // Patterns: longer/more specific first, then general
  const patterns = [
    // Verb forms & participles (longer/more specific first)
    { suffix: 'ation', replacement: '' },     // nation → nat
    { suffix: 'sion', replacement: '' },      // decision → deci
    { suffix: 'tion', replacement: '' },      // nation → na, notion → noti
    { suffix: 'ion', replacement: 'e' },      // creation → create (creat + e)
    { suffix: 'ness', replacement: '' },      // happiness → happy
    { suffix: 'ment', replacement: '' },      // development → develop
    { suffix: 'able', replacement: '' },      // comfortable → comfort
    { suffix: 'ible', replacement: '' },      // possible → possibl
    { suffix: 'ful', replacement: '' },       // beautiful → beauti
    { suffix: 'less', replacement: '' },      // helpless → help
    { suffix: 'ous', replacement: '' },       // famous → fam

    // Verb conjugations
    { suffix: 'ing', replacement: '' },       // running → run
    { suffix: 'ed', replacement: '' },        // cracked → crack
    { suffix: 'er', replacement: '' },        // runner → run
    { suffix: 'ers', replacement: '' },       // runners → runner

    // Spanish/Romance forms
    { suffix: 'ito', replacement: '' },       // gatito → gato
    { suffix: 'ita', replacement: '' },       // gatita → gata
    { suffix: 'ción', replacement: 'cion' },  // acción → accion (normalize)
    { suffix: 'sión', replacement: 'sion' },  // versión → version

    // French accented forms
    { suffix: 'é', replacement: 'er' },       // craqué → cracker (approximate)
    { suffix: 'è', replacement: 'e' },        // mère → mere
    { suffix: 'ê', replacement: 'e' },        // château → chateau
    { suffix: 'ç', replacement: 'c' },        // français → francais

    // Irregular plurals (before regular -s, -es)
    { suffix: 'ies', replacement: 'y' },      // ladies → lady
    { suffix: 'ves', replacement: 'f' },      // wives → wife
    { suffix: 'es', replacement: '' },        // passes → pass, boxes → box
    { suffix: 's', replacement: '' },         // words → word

    // German & Dutch patterns
    { suffix: 'e', replacement: '' },         // Hunde → Hund
    { suffix: 'en', replacement: '' },        // hunden → hund
    { suffix: 'n', replacement: '' },         // hund → hun (less likely)
  ];

  for (const { suffix, replacement } of patterns) {
    const stem = removeSuffix(w, suffix, replacement);
    if (stem) variations.add(stem);
  }

  return Array.from(variations);
}
