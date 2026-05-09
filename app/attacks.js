function addBruteForceAttacks(rows, full, weak) {
  for (const a of ALGOS) {
    rows.push({
      atk: t("aBrute"),
      hash: a.name,
      rate: a.rate,
      sec: weak ? weakGuessTime(a.rate) : bruteTime(full, a.rate),
      note: weak ? t("nWeakPassword") : t("nAllCombos"),
      cat: "brute",
    });
  }
}

function addDictionaryAttacks(rows, common, weak, dictWord) {
  // COMMON.size reflects the actual hardcoded list (~400 entries).
  // Using COMMON.size / rate ensures the formula matches the real keyspace being modelled,
  // not a fictitious "top 10k HIBP" that COMMON does not represent.
  const COMMON_KEYSPACE = COMMON.size; // ~400 entries — passwords at HIBP top-400 rank
  const DICT_KEYSPACE = DICT_WORDS ? DICT_WORDS.size : 200000; // actual wordlist size per language
  for (const a of ALGOS) {
    // weak     = TOP_100 hit → ~100 guesses (position 1-100 in any priority list)
    // common   = COMMON hit → ~COMMON.size guesses (position 100-400 in HIBP ordered list)
    // dictWord = full wordlist scan at actual loaded size (50k-200k depending on language)
    // absent   → null (not applicable)
    let sec;
    if (weak) sec = 100 / a.rate;
    else if (common) sec = COMMON_KEYSPACE / a.rate;
    else if (dictWord) sec = DICT_KEYSPACE / a.rate;
    else sec = null;
    const note = weak ? t("nWeakPassword") : common ? t("nInLeaks") : dictWord ? t("nDictHit") : t("nAbsentLeaks");
    rows.push({
      atk: t("aDict"),
      hash: a.name,
      rate: a.rate,
      sec: sec,
      note: note,
      cat: "dict",
    });
  }
}

function addHybridAttacks(rows, hybridVuln, weak, common, dictWord) {
  if (hybridVuln || weak) {
    // hybridVuln = dictWord || (common && /[a-z]/i.test(pw))
    // → if hybridVuln is true, either common or dictWord is always true.
    // Keyspace selection covers all reachable cases:
    //   common=true  → HYBRID_KEYSPACE_COMMON (~500 guesses, Ma 2014 top-100 median)
    //   dictWord=true → HYBRID_KEYSPACE_DICT (~25k guesses, Ma 2014 geometric median for full wordlist)
    const hybridKS = common ? HYBRID_KEYSPACE_COMMON : HYBRID_KEYSPACE_DICT;
    for (const a of ALGOS) {
      rows.push({
        atk: t("aHybrid"),
        hash: a.name,
        rate: a.rate,
        sec: weak ? weakGuessTime(a.rate) : budgetTime(hybridKS, a.rate),
        note: weak ? t("nWeakPassword") : t("nDictMut"),
        cat: "hybrid",
      });
    }
  } else {
    rows.push({
      atk: t("aHybrid"),
      hash: "(all)",
      rate: 0,
      sec: null,
      note: t("nStructUnrecog"),
      cat: "hybrid",
    });
  }
}

function addRuleBasedAttacks(rows, hybridVuln, kbPat, seq, dt, weak) {
  const ruleVuln = hybridVuln || kbPat || seq || dt || weak;
  if (ruleVuln) {
    for (const a of ALGOS) {
      rows.push({
        atk: t("aRule"),
        hash: a.name,
        rate: a.rate,
        sec: weak ? weakGuessTime(a.rate) : budgetTime(RULE_KEYSPACE, a.rate),
        note: weak ? t("nWeakPassword") : t("nRulesAdvanced"),
        cat: "rule",
      });
    }
  } else {
    rows.push({
      atk: t("aRule"),
      hash: "(all)",
      rate: 0,
      sec: null,
      note: t("nStructUnrecog"),
      cat: "rule",
    });
  }
}

function addPrinceAttacks(rows, full, pw, looksPassphrase, dictWord, len, cs, dt, seq, weak) {
  const hasSeparator = /[\s_-]/u.test(pw);
  const out = princeExpectedGuesses(
    pw,
    full,
    { looksPassphrase, dictWord, len, cs, dt, seq, hasSeparator },
    LANG
  );
  const note = weak ? t("nWeakPassword") : out.chainability >= 0.28 ? t("nPrinceChain") : t("nNotPassphrase");
  for (const a of ALGOS) {
    rows.push({
      atk: t("aPrince"),
      hash: a.name,
      rate: a.rate,
      sec: weak ? weakGuessTime(a.rate) : budgetTime(out.guesses, a.rate),
      note: note,
      cat: "prince",
    });
  }
}

function addMaskAttacks(rows, full, len, cs, kbPat, seq, weak, dt, pw) {
  const dateInfo = dt ? detectDateAndReduce(pw, len, cs) : { hasDate: false, reduction: 1.0 };
  // Positional mask with Unicode-aware buckets.
  const { upCount, loCount, diCount, syCount, unCount, unicodeSetSize } = getMaskCounts(pw);
  let maskKS;
  if (weak) {
    maskKS = WEAK_GUESS_RANK;
  } else if (dateInfo.hasDate) {
    maskKS = full * dateInfo.reduction;
  } else {
    maskKS =
      (upCount > 0 ? Math.pow(CHARSET_UPPER, upCount) : 1) *
      (loCount > 0 ? Math.pow(CHARSET_LOWER, loCount) : 1) *
      (diCount > 0 ? Math.pow(CHARSET_DIGIT, diCount) : 1) *
      (syCount > 0 ? Math.pow(CHARSET_SYMBOL, syCount) : 1) *
      (unCount > 0 ? Math.pow(Math.max(unicodeSetSize, CHARSET_UNICODE), unCount) : 1);
  }

  // Account for the fact that attackers usually try several masks before the exact one.
  const maskRank = dateInfo.hasDate || kbPat || seq ? MASK_RANK_STRUCTURED : MASK_RANK_DEFAULT;
  const effectiveMaskGuesses = weak
    ? WEAK_GUESS_RANK
    : Math.max(1, Math.min(full, Math.ceil(Math.min(maskKS, full) * maskRank)));

  const note = weak
    ? t("nWeakPassword")
    : dateInfo.hasDate
      ? t("nDateDetected")
      : kbPat
        ? t("nKBDetected")
        : seq
          ? t("nSeqDetected")
          : t("nMaskPositional");
  for (const a of ALGOS) {
    rows.push({
      atk: t("aMask"),
      hash: a.name,
      rate: a.rate,
      sec: weak ? weakGuessTime(a.rate) : budgetTime(effectiveMaskGuesses, a.rate),
      note: note,
      cat: "mask",
    });
  }
}

// Rainbow tables only exist publicly for MD5, SHA-1, and NTLM (unsalted).
// SHA-256 rainbow tables for ≥8 chars do not exist in public tools
// (ophcrack, RainbowCrack, hashkiller all focus on MD5/NTLM/SHA-1).
const RAINBOW_HASH_AVAILABLE = new Set(["md5", "sha1", "ntlm"]);

function logisticCoverage(x, x50, k) {
  return 1 / (1 + Math.exp((x - x50) / k));
}

function rainbowCoverage(len, cs, common) {
  const lenCov = logisticCoverage(len, RAINBOW_L50, RAINBOW_KL);
  const csCov = logisticCoverage(cs, RAINBOW_C50, RAINBOW_KC);
  const commonBoost = common ? 1.25 : 1.0;
  return Math.max(0, Math.min(1, lenCov * csCov * commonBoost));
}

function rainbowTimeV2(len, cs, common) {
  const cov = rainbowCoverage(len, cs, common);
  const steps = 1 / Math.max(cov, RAINBOW_EPS);
  return RAINBOW_LOOKUP_BASE_SEC + RAINBOW_PROBE_SEC * steps;
}

function addRainbowTableAttacks(rows, len, cs, common, weak) {
  for (const a of ALGOS) {
    let s;
    if (a.salted || !RAINBOW_HASH_AVAILABLE.has(a.key)) {
      s = null;
    } else {
      // Rainbow lookup depends on table coverage and lookup/probe overhead,
      // not on online GPU hash-rate throughput.
      s = rainbowTimeV2(len, cs, common || weak);
    }
    rows.push({
      atk: t("aRainbow"),
      hash: a.name,
      rate: a.salted ? 0 : a.rate,
      sec: s,
      note: (a.salted || !RAINBOW_HASH_AVAILABLE.has(a.key))
        ? (a.salted ? t("nSalted") : t("nNoRainbow"))
        : weak
          ? t("nWeakPassword")
          : s === null
            ? t("nTooLong")
            : s < 1
              ? t("nTablesAvail")
              : t("nTablesBig"),
      cat: "rainbow",
    });
  }
}

function addSprayAttacks(rows, pw, weak) {
  const top20 = [
    "123456",
    "password",
    "12345678",
    "qwerty",
    "abc123",
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
    "shadow",
    "123123",
    "654321",
    "superman",
    "qazwsx",
  ];
  const spray = weak || top20.includes(pw.toLowerCase());
  rows.push({
    atk: t("aSpray"),
    hash: "(all)",
    rate: 0,
    sec: spray ? 0.0001 : null,
    note: spray ? (weak ? t("nWeakPassword") : t("nTop20")) : t("nNotTop"),
    cat: "spray",
  });
}

function addTargetedAttacks(rows, pw, common, dt, weak) {
  const targetedVuln =
    weak ||
    common ||
    dt ||
    /^[A-Z][a-z]+(?:[-_. ]?[A-Z][a-z]+)?\d{0,4}[!@#$%^&*]?$/u.test(pw) ||
    /(?:1[6-9]|20)\d{2}/.test(pw);
  if (targetedVuln) {
    for (const a of ALGOS) {
      rows.push({
        atk: t("aTargeted"),
        hash: a.name,
        rate: a.rate,
        sec: weak ? weakGuessTime(a.rate) : budgetTime(TARGETED_KEYSPACE, a.rate),
        note: weak ? t("nWeakPassword") : t("nTargetedOSINT"),
        cat: "targeted",
      });
    }
  } else {
    rows.push({
      atk: t("aTargeted"),
      hash: "(all)",
      rate: 0,
      sec: null,
      note: t("nNoPattern"),
      cat: "targeted",
    });
  }
}

function addMarkovAttacks(rows, full, hybridVuln, kbPat, seq, dt, rep, weak, cs, len, pw) {
  if (weak) {
    for (const a of ALGOS) {
      rows.push({
        atk: t("aMarkov"),
        hash: a.name,
        rate: a.rate,
        sec: weakGuessTime(a.rate),
        note: t("nWeakPassword"),
        cat: "markov",
      });
    }
  } else {
    const markovGuesses = markovExpectedGuesses(
      pw,
      full,
      { hybridVuln, kbPat, seq, dt, rep, cs, len },
      LANG
    );
    // Keep messaging neutral: this v2 is rank-based and no longer tied to fixed % reductions.
    const note = kbPat ? t("nKeyboardUltra") : t("nStatPrio");
    for (const a of ALGOS) {
      rows.push({
        atk: t("aMarkov"),
        hash: a.name,
        rate: a.rate,
        sec: budgetTime(markovGuesses, a.rate),
        note: note,
        cat: "markov",
      });
    }
  }
}

function addNeuralAttacks(rows, full, hybridVuln, kbPat, seq, dt, rep, weak, cs, len, pw, mlProb) {
  const looksHuman = hybridVuln || kbPat || seq || dt || rep;
  const neuralGuesses = neuralExpectedGuesses(
    pw,
    full,
    { hybridVuln, kbPat, seq, dt, rep, cs, len, looksHuman },
    mlProb,
    LANG
  );
  for (const a of ALGOS) {
    rows.push({
      atk: t("aNeural"),
      hash: a.name,
      rate: a.rate,
      sec: weak ? weakGuessTime(a.rate) : budgetTime(neuralGuesses, a.rate),
      note: weak ? t("nWeakPassword") : t("nNeuralModel"),
      cat: "neural",
    });
  }
}

function addPCFGAttacks(rows, weak, pw) {
  const pcfgGuesses = pcfgKeyspace(pw);
  for (const a of ALGOS) {
    rows.push({
      atk: t("aPCFG"),
      hash: a.name,
      rate: a.rate,
      sec: weak ? weakGuessTime(a.rate) : budgetTime(pcfgGuesses, a.rate),
      note: weak ? t("nWeakPassword") : t("nPCFGDetected"),
      cat: "pcfg",
    });
  }
}

function addCombinatorAttacks(rows, len, pw, common, looksPassphrase, weak) {
  if (looksPassphrase || common || weak) {
    // Calcul dynamique du keyspace basé sur le mot de passe réel
    // (nombre de mots + taille du dictionnaire)
    const combiKeyspace = calculateCombiKeyspace(pw, DICT_WORDS, looksPassphrase);

    for (const a of ALGOS) {
      rows.push({
        atk: t("aCombi"),
        hash: a.name,
        rate: a.rate,
        sec: weak ? weakGuessTime(a.rate) : budgetTime(combiKeyspace, a.rate),
        note: weak ? t("nWeakPassword") : t("nPassphrase"),
        cat: "combi",
      });
    }
  } else {
    rows.push({
      atk: t("aCombi"),
      hash: "(all)",
      rate: 0,
      sec: null,
      note: t("nNotPassphrase"),
      cat: "combi",
    });
  }
}

function addMorphologicalAttacks(rows, dictWord, deleet, pw, weak) {
  const hasUnicode = /[^\x00-\x7F]/.test(pw);
  const hasDiacritics = /[àáâäèéêëìíîïòóôöùúûüÿñç]/i.test(pw);
  const hasLeetSubst = deleet !== pw.toLowerCase();
  const morphVuln = weak || (dictWord && (hasUnicode || hasDiacritics || hasLeetSubst));
  if (morphVuln) {
    for (const a of ALGOS) {
      rows.push({
        atk: t("aMorph"),
        hash: a.name,
        rate: a.rate,
        sec: weak ? weakGuessTime(a.rate) : budgetTime(MORPH_KEYSPACE, a.rate),
        note: weak ? t("nWeakPassword") : t("nMorphVariants"),
        cat: "morph",
      });
    }
  } else {
    rows.push({
      atk: t("aMorph"),
      hash: "(all)",
      rate: 0,
      sec: null,
      note: t("nStructUnrecog"),
      cat: "morph",
    });
  }
}

function annotateScenarioApplicability(rows, context) {
  const speculativeCats = new Set(["neural", "targeted", "morph"]);
  const tieBreakPriority = {
    pcfg: 1,
    mask: 2,
    dict: 3,
    markov: 4,
    rule: 5,
    brute: 6,
    neural: 7,
    hybrid: 8,
    combi: 9,
    morph: 10,
    prince: 11,
    rainbow: 12,
    targeted: 13,
    cred: 14,
    spray: 15,
  };

  const confidenceBase = {
    brute: 1.0,
    dict: 0.9,
    hybrid: 0.75,
    rule: 0.75,
    prince: 0.7,
    mask: 0.9,
    rainbow: 0.95,
    cred: 0.55,
    spray: 0.55,
    targeted: 0.55,
    markov: 0.75,
    neural: 0.7,
    pcfg: 0.9,
    combi: 0.75,
    morph: 0.7,
  };

  function evidenceScoreForRow(row) {
    switch (row.cat) {
      case "brute":
        return 1;
      case "dict":
        return Number(!!context.common) + Number(!!context.dictWord);
      case "hybrid":
        return Number(!!context.hybridVuln) + Number(!!context.common) + Number(!!context.dictWord);
      case "rule":
        return Number(!!context.ruleVuln) + Number(!!context.kbPat) + Number(!!context.seq) + Number(!!context.dt);
      case "prince":
        return Number(!!context.looksPassphrase) + Number(!!context.dictWord) + Number((context.princeChainScore || 0) >= 0.4);
      case "mask":
        return Number(!!context.kbPat) + Number(!!context.seq) + Number(!!context.dt);
      case "rainbow":
        return Number(!!context.common);
      case "cred":
        return Number(!!context.common) + Number(!!context.weak);
      case "spray":
        return Number(!!context.top20) + Number(!!context.weak);
      case "targeted":
        return Number(!!context.targetedPattern) + Number(!!context.dt);
      case "markov":
        return Number(!!context.looksHuman) + Number(!!context.kbPat) + Number(!!context.seq) + Number(!!context.rep);
      case "neural":
        return Number(!!context.looksHuman) + Number(!!context.kbPat) + Number(!!context.seq) + Number(!!context.rep);
      case "pcfg":
        return Number(!!context.hybridVuln) + Number(!!context.dictWord) + Number(!!context.seq);
      case "combi":
        return Number(!!context.looksPassphrase);
      case "morph":
        return Number(!!context.morphStrong) + Number(!!context.dictWord);
      default:
        return 0;
    }
  }

  function scoreForRow(row) {
    const algo = ALGOS.find((a) => a.name === row.hash) || null;
    const salted = !!(algo && algo.salted);
    switch (row.cat) {
      case "brute":
        return 1;
      case "dict":
        return context.common ? 0.99 : context.dictWord ? 0.85 : 0;
      case "hybrid":
        return context.weak ? 1 : context.hybridVuln ? 0.84 : 0;
      case "rule":
        return context.weak ? 1 : context.ruleVuln ? 0.79 : 0.2;
      case "prince":
        return context.weak ? 1 : Math.max(0.12, Math.min(0.9, context.princeChainScore || 0.2));
      case "mask":
        return context.weak ? 1 : context.kbPat || context.seq || context.dt ? 0.81 : 0.22;
      case "rainbow":
        return !salted && context.common ? 0.95 : 0;
      case "cred":
        return context.weak || context.common ? 0.95 : 0;
      case "spray":
        return context.weak || context.top20 ? 0.9 : 0;
      case "targeted":
        return context.targetedPattern ? 0.72 : 0.24;
      case "markov":
        return context.looksHuman ? 0.76 : 0.34;
      case "neural":
        return context.looksHuman ? 0.67 : 0.26;
      case "pcfg":
        return context.hybridVuln ? 0.78 : 0.2;
      case "combi":
        return context.looksPassphrase ? 0.81 : 0;
      case "morph":
        return context.morphStrong ? 0.71 : 0.15;
      default:
        return 0;
    }
  }

  for (const row of rows) {
    const app = scoreForRow(row);
    row.applicability = app;
    row.tieBreakPriority = tieBreakPriority[row.cat] || 999;
    row.evidenceScore = evidenceScoreForRow(row);
    const base = confidenceBase[row.cat] || 0.6;
    const evidenceBoost = Math.min(0.12, row.evidenceScore * 0.04);
    const speculativePenalty = speculativeCats.has(row.cat) ? 0.08 : 0;
    row.confidence = Math.max(0, Math.min(1, Math.max(app, base) + evidenceBoost - speculativePenalty));
    const solid = app >= 0.6;
    const speculativeOk = !speculativeCats.has(row.cat) || app >= 0.85;
    row.primaryEligible = row.sec !== null && isFinite(row.sec) && solid && speculativeOk;
  }

  return rows;
}

function pickFastestScenario(rows) {
  const finiteRows = rows.filter((row) => row.sec !== null && isFinite(row.sec));
  if (!finiteRows.length) return null;

  const EPS = 1e-12;
  finiteRows.sort((a, b) => {
    if (Math.abs(a.sec - b.sec) > EPS) return a.sec - b.sec;
    if ((a.primaryEligible ? 1 : 0) !== (b.primaryEligible ? 1 : 0)) return (b.primaryEligible ? 1 : 0) - (a.primaryEligible ? 1 : 0);
    if ((a.confidence || 0) !== (b.confidence || 0)) return (b.confidence || 0) - (a.confidence || 0);
    if ((a.evidenceScore || 0) !== (b.evidenceScore || 0)) return (b.evidenceScore || 0) - (a.evidenceScore || 0);
    if ((a.tieBreakPriority || 999) !== (b.tieBreakPriority || 999)) return (a.tieBreakPriority || 999) - (b.tieBreakPriority || 999);
    if (a.hash !== b.hash) return String(a.hash).localeCompare(String(b.hash));
    return String(a.atk).localeCompare(String(b.atk));
  });

  return finiteRows[0];
}

