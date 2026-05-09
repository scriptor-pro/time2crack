    { suffix: 'n', replacement: '' },         // hund → hun (less likely)
  ];

  for (const { suffix, replacement } of patterns) {
    const stem = removeSuffix(w, suffix, replacement);
    if (stem) variations.add(stem);
  }

  return Array.from(variations);
}

/**
 * Check if word appears in dictionary with morphological variations
 */
function isDictWord(pw) {
  if (!DICT_WORDS) return false;
  const l = pw.normalize("NFC").toLowerCase();

  // Direct checks
  if (DICT_WORDS.has(l) || DICT_WORDS.has(deLeet(pw))) return true;

  // Morphological variations
  const deleetWord = deLeet(pw);
  const variations = getMorphVariations(deleetWord);

  for (const variation of variations) {
    if (DICT_WORDS.has(variation)) {
      return true;
    }
  }

  return false;
}

// ============================================================
// ML MODEL — ONNX RUNTIME WEB
// ============================================================
// ML INFERENCE (ONNX Runtime Web)
// Note: Uses ONNX format (model.onnx) since 2026-03-20
// Legacy TensorFlow.js format (model.json + weights.bin) removed 2026-03-22
// ============================================================

let ML_SESSION = null;
let ML_RUNTIME_LOADED = false;

/**
 * Dynamically load ONNX Runtime from jsDelivr CDN
 * (Production: replace with https://cdn.time2crack.eu)
 */
async function loadONNXRuntime() {
  if (ML_RUNTIME_LOADED) return window.ort;

  try {
    // Load ONNX Runtime from jsDelivr (public CDN, free)
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/ort.min.js';
    script.async = true;

    await new Promise((resolve, reject) => {
      script.onload = () => {
        ML_RUNTIME_LOADED = true;
        resolve(window.ort);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return window.ort;
  } catch (err) {
    console.warn('Failed to load ONNX Runtime:', err);
    return null;
  }
}

/**
 * Load ML model (ONNX format) and normalization parameters
 */
async function loadMLModel() {
  if (ML_SESSION) return;

  try {
    const ort = await loadONNXRuntime();
    if (!ort) throw new Error('ONNX Runtime not available');

    // Configure WASM backend
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/';
    ort.env.wasm.numThreads = 1; // Single-thread (no SharedArrayBuffer)
    ort.env.wasm.simdEnabled = true;

    // Load normalization parameters
    const normRes = await fetch('data/model-v2/normalization.json');
    if (!normRes.ok) throw new Error('Normalization file not found');
    ML_NORMALIZATION = await normRes.json();

    // Load ONNX model
    ML_SESSION = await ort.InferenceSession.create('data/model-v2/model.onnx', {
      executionProviders: ['wasm'],
      logSeverityLevel: 3, // Error only
    });

    console.log('✓ ML model v2 loaded (ONNX Runtime)');
    console.log(`  Input: ${ML_SESSION.inputNames[0]}`);
    console.log(`  Output: ${ML_SESSION.outputNames[0]}`);
  } catch (err) {
    console.warn('ML model not available:', err);
    ML_SESSION = null;
    ML_NORMALIZATION = null;
  }
}

/**
 * Extract 35 features from password (v2 model)
 */
function extractMLFeatures(pw) {
  // Keyboard layouts for adjacency detection
  const QWERTY = {
    rows: [
      ['q','w','e','r','t','y','u','i','o','p'],
      ['a','s','d','f','g','h','j','k','l'],
      ['z','x','c','v','b','n','m']
    ]
  };
  const AZERTY = {
    rows: [
      ['a','z','e','r','t','y','u','i','o','p'],
      ['q','s','d','f','g','h','j','k','l','m'],
      ['w','x','c','v','b','n']
    ]
  };
  
  const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec','janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const COMMON_BIGRAMS = ['th','he','in','er','an','re','on','at','en','nd','ti','es','or','te','of','ed','is','it','al','ar','le','de','la','es','en','qu','un','ou','se','ai','st','to','nt','ng','se','ha','as','ou','io','le','pa','ss','wo','rd','lo','ve','me','my'];
  const COMMON_TRIGRAMS = ['the','and','ing','ion','tio','ent','ati','for','her','ter','hat','tha','ere','ate','his','con','que','les','des','une','ent','ion','ait','our','par','ais','res','ver','all','ons','nce','men','wit','are','ess','pro','ass','ord','pas'];
  
  // Helper: check keyboard adjacency
  function isAdjacent(c1, c2, layout) {
    c1 = c1.toLowerCase(); c2 = c2.toLowerCase();
    for (const row of layout.rows) {
      const i1 = row.indexOf(c1), i2 = row.indexOf(c2);
      if (i1 !== -1 && i2 !== -1 && Math.abs(i1 - i2) === 1) return true;
    }
    return false;
  }
  
  // Helper: Shannon entropy
  function calcEntropy(s) {
    const freq = {};
    for (const c of s) freq[c] = (freq[c] || 0) + 1;
    let ent = 0;
    for (const c in freq) {
      const p = freq[c] / s.length;
      ent -= p * Math.log2(p);
    }
    return ent;
  }
  
  // Helper: Levenshtein distance
  function levDist(s1, s2) {
    const m = s1.length, n = s2.length;
    const dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  }
  
  // ===== BASIC FEATURES (1-15) =====
  const len = pw.length;
  const upperCount = (pw.match(/[A-Z]/g) || []).length;
  const lowerCount = (pw.match(/[a-z]/g) || []).length;
  const digitCount = (pw.match(/[0-9]/g) || []).length;
  const symbolCount = (pw.match(/[^A-Za-z0-9]/g) || []).length;
  const upperStart = /^[A-Z]/.test(pw) ? 1 : 0;
  const digitEnd = /[0-9]$/.test(pw) ? 1 : 0;
  const hasSeq = /(?:123|234|345|456|567|678|789|890|098|987|876|765|654|543|432|321|210|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|qwer|asdf|zxcv|qwerty|azerty|qwertz)/i.test(pw) ? 1 : 0;
  const hasYear = /(19|20)\d{2}/.test(pw) ? 1 : 0;
  const ent = calcEntropy(pw);
  const ratioUpper = upperCount / len;
  const ratioDigit = digitCount / len;
  const hasSub = /[@0314!$]/.test(pw) ? 1 : 0;
  const pwLower = pw.toLowerCase();
  const bigramScore = COMMON_BIGRAMS.filter(bg => pwLower.includes(bg)).length / Math.max(1, pw.length - 1);
  const trigramScore = COMMON_TRIGRAMS.filter(tg => pwLower.includes(tg)).length / Math.max(1, pw.length - 2);
  
  // ===== ADVANCED FEATURES (16-35) =====
  // 16-17: Keyboard adjacency
  let qwertyAdj = 0, azertyAdj = 0;
  if (pw.length >= 2) {
    for (let i = 0; i < pw.length - 1; i++) {
      if (isAdjacent(pw[i], pw[i + 1], QWERTY)) qwertyAdj++;
      if (isAdjacent(pw[i], pw[i + 1], AZERTY)) azertyAdj++;
    }
    qwertyAdj /= (pw.length - 1);
    azertyAdj /= (pw.length - 1);
  }
  
  // 18-19: Repeated characters/substrings
  let repeatChars = 0;
  for (let i = 0; i < pw.length - 1; i++) {
    if (pw[i] === pw[i + 1]) repeatChars++;
  }
  let repeatSubs = 0;
  for (let subLen = 2; subLen <= 3; subLen++) {
    for (let i = 0; i <= pw.length - subLen * 2; i++) {
      const sub = pw.substring(i, i + subLen);
      if (pw.substring(i + subLen).includes(sub)) repeatSubs++;
    }
  }
  
  // 20-22: Position entropy
  const third = Math.floor(len / 3);
  const entStart = calcEntropy(pw.substring(0, third || 1));
  const entMid = calcEntropy(pw.substring(third, 2 * third || len));
  const entEnd = calcEntropy(pw.substring(2 * third, len));
  
  // 23-26: Additional patterns
  const ratioSymbol = symbolCount / len;
  const datePattern = /\d{1,2}[\/\-\.]\d{1,2}|\d{4}[\/\-\.]\d{1,2}/.test(pw) ? 1 : 0;
  const monthName = MONTHS.some(m => pwLower.includes(m)) ? 1 : 0;
  const namePattern = /[A-Z][a-z]{2,}/.test(pw) ? 1 : 0;
  
  // 27-28: Digit/letter clusters
  let maxDigit = 0, currDigit = 0;
  let maxLetter = 0, currLetter = 0;
  for (const c of pw) {
    if (/\d/.test(c)) { currDigit++; maxDigit = Math.max(maxDigit, currDigit); currLetter = 0; }
    else if (/[a-zA-Z]/.test(c)) { currLetter++; maxLetter = Math.max(maxLetter, currLetter); currDigit = 0; }
    else { currDigit = 0; currLetter = 0; }
  }
  
  // 29-30: Charset diversity & consonant/vowel ratio
  let diversity = 0;
  if (/[a-z]/.test(pw)) diversity++;
  if (/[A-Z]/.test(pw)) diversity++;
  if (/[0-9]/.test(pw)) diversity++;
  if (/[^a-zA-Z0-9]/.test(pw)) diversity++;
  const vowels = (pw.match(/[aeiouAEIOU]/g) || []).length;
  const consonants = (pw.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || []).length;
  const cvRatio = consonants ? vowels / consonants : 0;
  
  // 31-32: Uppercase/special in middle
  const upperMid = pw.length >= 3 ? (pw.substring(1).match(/[A-Z]/g) || []).length : 0;
  const specialMid = pw.length >= 3 ? (pw.substring(1, pw.length - 1).match(/[^a-zA-Z0-9]/g) || []).length : 0;
  
  // 33: Repeating pattern
  let repeatPat = 0;
  for (let pLen = 2; pLen <= Math.floor(pw.length / 2); pLen++) {
    const pat = pw.substring(0, pLen);
    if (pw.startsWith(pat.repeat(Math.floor(pw.length / pLen)))) {
      repeatPat = 1;
      break;
    }
  }
  
  // 34: Transition count
  function charType(c) {
    if (/[a-z]/.test(c)) return 'l';
    if (/[A-Z]/.test(c)) return 'u';
    if (/[0-9]/.test(c)) return 'd';
    return 's';
  }
  let transitions = 0;
  if (pw.length >= 2) {
    let prevType = charType(pw[0]);
    for (let i = 1; i < pw.length; i++) {
      const currType = charType(pw[i]);
      if (currType !== prevType) transitions++;
      prevType = currType;
    }
  }
  
  // 35: Edit distance to "password"
  const editDist = levDist(pwLower, 'password') / Math.max(pw.length, 8);
  
  return [
    len, upperCount, lowerCount, digitCount, symbolCount,
    upperStart, digitEnd, hasSeq, hasYear, ent,
    ratioUpper, ratioDigit, hasSub, bigramScore, trigramScore,
    qwertyAdj, azertyAdj, repeatChars, repeatSubs,
    entStart, entMid, entEnd, ratioSymbol,
    datePattern, monthName, namePattern, maxDigit, maxLetter,
    diversity, cvRatio, upperMid, specialMid,
    repeatPat, transitions, editDist
  ];
}

/**
 * Predict if password is human-created (returns probability 0-1)
 */
async function predictHumanPattern(pw) {
  // Lazy load ML model on first prediction
  if (!ML_SESSION || !ML_NORMALIZATION) {
    await loadMLModel();
  }

  if (!ML_SESSION || !ML_NORMALIZATION) return null;

  try {
    const ort = await loadONNXRuntime();
    if (!ort) return null;

    const features = extractMLFeatures(pw);

    // Normalize features using training mean/std
    const normalized = features.map((f, i) =>
      (f - ML_NORMALIZATION.mean[i]) / (ML_NORMALIZATION.std[i] + 1e-7)
    );

    // Create input tensor
    const inputData = new Float32Array(normalized);
    const inputTensor = new ort.Tensor('float32', inputData, [1, 35]);

    // Get input/output names from session
    const inputName = ML_SESSION.inputNames[0];
    const outputName = ML_SESSION.outputNames[0];

    // Run inference
    const feeds = { [inputName]: inputTensor };
    const results = await ML_SESSION.run(feeds);
    const outputTensor = results[outputName];

    // Extract probability
    const probability = outputTensor.data[0];

    return probability;
  } catch (err) {
    console.warn('ML prediction error:', err);
    return null;
  }
}

function setLang(lang) {
  LANG = lang;
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.lang = lang;
  document.title =
    "Time2Crack — " +
    (lang === "fr"
      ? "Quand votre mot de passe sera-t-il craqué ?"
      : "When will your password be cracked?");
  
  // Update canonical URL dynamically for SEO
  const canonicalLink = safe('canonical-link');
  if (canonicalLink) {
    canonicalLink.setAttribute('href', `https://time2crack.eu/?lang=${lang}`);
  }
