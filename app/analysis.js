const KB_PATTERNS = [
  // Forward walks (QWERTY/QWERTZ/AZERTY rows)
  "qwerty", "qwertz", "azerty",
  "qwertyuiop", "azertyuiop",
  "asdf", "asdfgh", "asdfghjkl",
  "zxcvbn", "zxcvbnm",
  // Diagonal walks — documented in RockYou/LinkedIn/Adobe leaks (Veras 2012)
  "qazwsx", "1qaz2wsx", "1qaz", "2wsx", "3edc", "4rfv",
  "zaq1zaq1",
  // Reverse walks — 0.18% of RockYou corpus (Veras 2012, factor 7× less than forward)
  "ytrewq", "trewq", "rewq",
  "fdsa", "lkjh", "kjhg",
  "mnbvc", "nbvc",
  "poiuy", "oiuy",
  // Numeric sequences (reverse)
  "9876", "8765", "7654", "0987",
];

// De-leet: try both i→1 and l→1 interpretations, return the one
// that matches a dictionary word (or the i-variant as default).
// This avoids the collision where P@55w1rd → "password" requires l→1,
// but m1lk → "milk" requires i→1.
const LEET_BASE = {
  a: "@4",
  e: "3",
  o: "0",
  s: "$5",
  t: "7",
  b: "8",
};

function deLeetWith(pw, oneMap) {
  let r = pw.normalize("NFC").toLowerCase();
  for (const [ch, reps] of Object.entries(LEET_BASE))
    for (const c of reps) r = r.split(c).join(ch);
  // Apply the 1-mapping last (either i or l)
  for (const [ch, reps] of Object.entries(oneMap))
    for (const c of reps) r = r.split(c).join(ch);
  return r;
}

function deLeet(pw) {
  const withI = deLeetWith(pw, { i: "1!", l: "" });
  const withL = deLeetWith(pw, { l: "1", i: "!" });
  // If dictionary loaded, prefer the variant that matches
  if (DICT_WORDS) {
    if (DICT_WORDS.has(withL)) return withL;
    if (DICT_WORDS.has(withI)) return withI;
  }
  // Default: try both, return the one with fewer digits remaining (more resolved)
  const digitsI = (withI.match(/\d/g) || []).length;
  const digitsL = (withL.match(/\d/g) || []).length;
  return digitsL <= digitsI ? withL : withI;
}

function isCommon(pw) {
  const l = pw.normalize("NFC").toLowerCase();
  if (COMMON.has(l)) return true;
  // Test both de-leet variants independently — avoids dependency on DICT_WORDS
  // which may not be loaded yet (page load race condition).
  const withI = deLeetWith(pw, { i: "1!", l: "" });
  const withL = deLeetWith(pw, { l: "1", i: "!" });
  return COMMON.has(withI) || COMMON.has(withL);
}

function isWeakPassword(pw) {
  // Ultra-weak detection: returns true if password is "ridiculously weak"
  // Used for instant-crack indication without computation
  const l = pw.toLowerCase();

  // Check Top 100 (instant, no time calculation needed)
  if (TOP_100.has(l) || TOP_100.has(deLeet(pw))) return true;

  // Heuristic 1: All same character (111111, aaaaaa, etc.)
  if (/^(.)\1{5,}$/.test(l)) return true;

  // Heuristic 2: Digit block repeated (123123, 12341234, 19901990, etc.)
  if (/^(\d{1,6})\1{1,}$/.test(l)) return true;

  // Heuristic 3: Obvious keyboard walks < 6 chars
  if (pw.length <= 5) {
    if (/(qwert|asdfg|zxcvb|dvorak)/i.test(pw)) return true;
    if (/^\d{1,5}$/.test(pw)) return true; // 1, 12, 123, 1234, 12345
  }

  return false;
}

function hasKBPattern(pw) {
  const l = pw.toLowerCase();
  return KB_PATTERNS.some((p) => l.includes(p));
}

function hasSequence(pw) {
  if (pw.length < 4) return false;
  let asc = 1,
    desc = 1;
  for (let i = 1; i < pw.length; i++) {
    const d = pw.charCodeAt(i) - pw.charCodeAt(i - 1);
    if (d === 1) {
      if (++asc >= 4) return true;
    } else asc = 1;
    if (d === -1) {
      if (++desc >= 4) return true;
    } else desc = 1;
  }
  return false;
}

function hasRepeat(pw) {
  if (pw.length < 3) return false;
  let c = 1;
  for (let i = 1; i < pw.length; i++) {
    if (pw[i] === pw[i - 1]) {
      if (++c >= 3) return true;
    } else c = 1;
  }
  return false;
}

function hasDate(pw) {
  return (
    /(?:1[6-9]|20)\d{2}/.test(pw) ||
    /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(pw)
  );
}

function detectDateAndReduce(pw, len, cs) {
  // If date detected, calculate charset reduction from fixed date positions
  // Example: "Password2024!"
  //   Length 13, charset 94
  //   Date "2024" = 4 fixed chars
  //   Remaining 9 chars × 94 charset = 94^9 (not 94^13)
  // Reduction = 94^9 / 94^13 = 1 / 94^4 ≈ 0.00008

  if (!hasDate(pw)) return { hasDate: false, reduction: 1.0 };

  // Prefer full date patterns first (DD/MM/YYYY or MM/DD/YYYY-like),
  // then fallback to standalone year. This avoids undercounting cases like
  // "12/05/2024" where yearMatch is true but full-date structure is present.
  let dateChars = 0;
  let plausibleDates = 0;

  const fullDateMatch = pw.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.](?:1[6-9]|20)?\d{2}/);
  if (fullDateMatch) {
    dateChars = fullDateMatch[0].length;
    plausibleDates = 36500;
  } else {
    const yearMatch = pw.match(/(?:1[6-9]|20)\d{2}/);
    if (yearMatch) {
      dateChars = 4;
      // Plausible years for password creation: 1970 to current year.
      // Passwords typically reference birth years, recent years, or memorable years.
      // Using current year dynamically avoids stale hardcoded constants.
      const currentYear = new Date().getFullYear();
      plausibleDates = currentYear - 1970 + 1; // e.g. 2026 → 57 plausible years
    }
  }

  if (dateChars === 0) return { hasDate: false, reduction: 1.0 };

  // Remaining charset positions after fixing date
  const remainingLen = len - dateChars;
  if (remainingLen <= 0) return { hasDate: false, reduction: 1.0 };

  // Date digits only have ~57 plausible years (1970 to current) or ~36,500 days for full dates.
  // Correct reduction: plausible_values / total_digit_keyspace
  // For a 4-digit year: ~57 plausible years / 10^4 = 0.0057 (as of 2026)
  // For a full date (10 chars): ~36,500 days / 10^10 = 0.00000365
  // Then remaining chars still use full charset
  const digitKeyspace = Math.pow(10, dateChars);
  const dateReduction = plausibleDates / digitKeyspace;
  // Overall: replace date-digit positions with their actual entropy
  // reduction = (plausibleDates / 10^dateChars) × (cs^remainingLen / cs^totalLen)
  // = dateReduction / cs^dateChars... no, simpler:
  // mask keyspace = cs^remainingLen × plausibleDates (instead of cs^totalLen)
  // reduction = (cs^remainingLen × plausibleDates) / cs^totalLen
  const reduction = (Math.pow(cs, remainingLen) * plausibleDates) / Math.pow(cs, len);
  return { hasDate: true, reduction: Math.max(reduction, 0.00001) };
}

function weakGuessTime(rate, rank = WEAK_GUESS_RANK) {
  if (rate <= 0) return 0;
  const r = Math.max(1, rank);
  return Math.max(1 / rate, r / rate);
}

function getUnicodeBlockSize(codePoint) {
  if (codePoint >= 128 && codePoint <= 591) return 200;
  if (codePoint >= 592 && codePoint <= 1791) return 200;
  if (codePoint >= 19968 && codePoint <= 40959) return 20000;
  if (codePoint > 65535 || (codePoint >= 55296 && codePoint <= 57343)) return 1500;
  return 500;
}

function getMaskCounts(pw) {
  let upCount = 0;
  let loCount = 0;
  let diCount = 0;
  let syCount = 0;
  let unCount = 0;
  let unicodeSetSize = 0;

  for (const ch of pw) {
    if (/[A-Z]/.test(ch)) upCount++;
    else if (/[a-z]/.test(ch)) loCount++;
    else if (/\d/.test(ch)) diCount++;
    else {
      const codePoint = ch.codePointAt(0);
      if (codePoint >= 33 && codePoint <= 126) {
        syCount++;
      } else {
        unCount++;
        unicodeSetSize = Math.max(unicodeSetSize, getUnicodeBlockSize(codePoint));
      }
    }
  }

  if (unCount > 0 && unicodeSetSize === 0) unicodeSetSize = CHARSET_UNICODE;
  return { upCount, loCount, diCount, syCount, unCount, unicodeSetSize };
}


// ============================================================
// CHARSET
// ============================================================
function getCharset(pw) {
  let s = 0,
    fl = { lo: 0, up: 0, di: 0, sy: 0, un: 0 };
  // unSize: estimated Unicode block size, differentiated by script
  let unSize = 0;
  for (let i = 0; i < pw.length; i++) {
    const c = pw.charCodeAt(i);
    if (c >= 97 && c <= 122) fl.lo = 1;
    else if (c >= 65 && c <= 90) fl.up = 1;
    else if (c >= 48 && c <= 57) fl.di = 1;
    else if (c >= 33 && c <= 126) fl.sy = 1;
    else {
      fl.un = 1;
      // Estimate charset size by Unicode block:
      // Latin Extended (128–591): ~200 chars used in practice
      // Arabic/Hebrew/Greek/Cyrillic (592–1791): ~200
      // CJK Unified (19968–40959): ~20000
      // Emoji (>65535 or surrogate pairs): ~1500
      // Other BMP: ~500 conservative estimate
      let blockSize;
      if (c >= 128 && c <= 591) blockSize = 200;
      else if (c >= 592 && c <= 1791) blockSize = 200;
      else if (c >= 19968 && c <= 40959) blockSize = 20000;
      else if (c >= 55296 && c <= 57343) blockSize = 1500; // surrogate pairs (emoji)
      else blockSize = 500;
      if (blockSize > unSize) unSize = blockSize;
    }
  }
  if (fl.un && unSize === 0) unSize = CHARSET_UNICODE; // fallback
  s =
    fl.lo * CHARSET_LOWER +
    fl.up * CHARSET_UPPER +
    fl.di * CHARSET_DIGIT +
    fl.sy * CHARSET_SYMBOL +
    (fl.un ? unSize : 0);
  return {
    size: Math.max(s, 1),
    flags: fl,
    types: fl.lo + fl.up + fl.di + fl.sy + fl.un,
  };
}

function entropy(pw) {
  return pw.length * Math.log2(getCharset(pw).size);
}

// ============================================================
// TIME CALCULATION
// ============================================================
// For brute force: models expected time under uniform random search without replacement.
// E[guesses] = keyspace/2 — valid when the target password is uniformly distributed in the space.
// This is a deliberate approximation: real Hashcat scans linearly (short-to-long), so for passwords
// at exactly the target length the true expected position is ~keyspace/2 within that length bucket.
// The factor-of-2 bias is acceptable and well-established in academic literature (Wheeler 2016,
// Hive Systems 2025). It models the "average" attacker, not worst-case (keyspace/rate) or best-case.
function bruteTime(keyspace, rate) {
  if (keyspace <= 0 || rate <= 0) return 0;
  const ls = Math.log(keyspace / 2) - Math.log(rate);
  return ls > 230 ? Infinity : Math.max(0, Math.exp(ls));
}
// For budget-based attacks (PCFG, hybrid, rule, etc.):
// keyspace IS the number of guesses needed — do not halve
function budgetTime(guesses, rate) {
  if (guesses <= 0 || rate <= 0) return 0;
  const ls = Math.log(guesses) - Math.log(rate);
  return ls > 230 ? Infinity : Math.max(0, Math.exp(ls));
}

// ============================================================
// ATTACK SCENARIO BUILDERS (Refactored)
// ============================================================
// ============================================================
// STRENGTH SCORE
// ============================================================
function score(pw) {
  const e = entropy(pw);
  let s;
  if (e <= 0) s = 0;
  else if (e < SCORE_ENTROPY[0]) s = (e / SCORE_ENTROPY[0]) * SCORE_RANGES[0];
  else if (e < SCORE_ENTROPY[1])
    s =
      SCORE_RANGES[0] +
      ((e - SCORE_ENTROPY[0]) / (SCORE_ENTROPY[1] - SCORE_ENTROPY[0])) * 15;
  else if (e < SCORE_ENTROPY[2])
    s =
      SCORE_RANGES[1] +
      ((e - SCORE_ENTROPY[1]) / (SCORE_ENTROPY[2] - SCORE_ENTROPY[1])) * 25;
  else if (e < SCORE_ENTROPY[3])
    s =
      SCORE_RANGES[2] +
      ((e - SCORE_ENTROPY[2]) / (SCORE_ENTROPY[3] - SCORE_ENTROPY[2])) * 30;
  else
    s = Math.min(100, SCORE_RANGES[3] + ((e - SCORE_ENTROPY[3]) / 64) * 10);
  if (isCommon(pw)) s = Math.min(s, SCORE_COMMON_PENALTY);
  if (hasKBPattern(pw)) s = Math.min(s, SCORE_KEYBOARD_PENALTY);
  if (hasDate(pw)) s -= SCORE_DATE_PENALTY;
  return Math.max(0, Math.min(100, Math.round(s)));
}

function scoreColor(s) {
  // 6-level security scale based on scientific research
  // Wogalter et al. (2002) - ISO 3864 + Brewer et al. (2003) - ColorBrewer
  return s < 20
    ? "var(--critical)"     // 0-20: Very weak (red)
    : s < 35
      ? "var(--danger)"      // 20-35: Weak (orange)
      : s < 60
        ? "var(--warning)"   // 35-60: Medium (amber)
        : s < 80
          ? "var(--success)" // 60-80: Good (green)
          : s < 95
            ? "var(--excellent)"    // 80-95: Excellent (dark green)
            : "var(--exceptional)"; // 95+: Exceptional (cyan)
}

function scoreLabel(s) {
  if (s < 20) return t("scoreLevelVeryWeak") || "🔴 Très faible";
  if (s < 35) return t("scoreLevelWeak") || "🟠 Faible";
  if (s < 60) return t("scoreLevelMedium") || "🟡 Moyen";
  if (s < 80) return t("scoreLevelGood") || "🟢 Bon";
  if (s < 95) return t("scoreLevelExcellent") || "🟢 Excellent";
  return t("scoreLevelExceptional") || "🔵 Exceptionnel";
}
function scoreText(s) {
  // 6-level text labels matching color scale
  return s < 20
    ? t("veryWeak")      // 0-20: Critical
    : s < 35
      ? t("_weak")       // 20-35: Weak/Danger
      : s < 60
        ? t("moderate")  // 35-60: Medium/Warning
        : s < 80
          ? t("_strong") // 60-80: Good/Success
          : s < 95
            ? t("veryStrong")   // 80-95: Excellent
            : t("exceptional"); // 95+: Exceptional
}
function scoreIcon(s) {
  // Icons based on Forget et al. (2008): Icons +58% comprehension
  // Wogalter et al. (2002): ISO 3864 safety symbols
  return s < 20
    ? "❌"      // 0-20: Critical (prohibition symbol)
    : s < 35
      ? "🔶"    // 20-35: Danger (warning diamond)
      : s < 60
        ? "🟡"  // 35-60: Warning (caution circle)
        : s < 80
          ? "✅" // 60-80: Success (check mark)
          : s < 95
            ? "✅✅"   // 80-95: Excellent (double check)
            : "⭐";   // 95+: Exceptional (star)
}

// ============================================================
// RENDER
