(function () {
  "use strict";

  // Safe DOM access helper — returns null if element not found (caller must use isReal() check)
  const safe = (id) => {
    return document.getElementById(id);
  };

  // Check if element exists and is real (not null)
  const isReal = (el) => el !== null && el !== undefined;

  // ============================================================
  // I18N
  // ============================================================
  
  // Detect browser language
  function detectBrowserLanguage() {
    // Get browser language (e.g., "fr-FR", "en-US", "es-ES")
    const browserLang = navigator.language || navigator.userLanguage || "en";
    
    // Extract the primary language code (e.g., "fr" from "fr-FR")
    const langCode = browserLang.split("-")[0].toLowerCase();
    
    // List of supported languages
    const supportedLangs = ["en", "fr", "es", "pt", "de", "tr", "it", "pl", "nl"];
    
    // Return the language if supported, otherwise default to English
    return supportedLangs.includes(langCode) ? langCode : "en";
  }
  
  let LANG = detectBrowserLanguage();

  // Wordlist for active language (loaded lazily on language change)
  let DICT_WORDS = null;   // Set<string> | null
  let DICT_LANG = null;    // language of currently loaded dictionary
  let DICT_LOADING = false; // prevent double-fetch
  let DICT_PENDING_LANG = null; // queue latest requested language while loading

  // PCFG calibration profiles (lazy-loaded, fallback to built-in defaults)
  let PCFG_CALIBRATION = null;
  let PCFG_CALIB_LOADING = false;

  // Markov calibration profiles (lazy-loaded, fallback to built-in defaults)
  let MARKOV_CALIBRATION = null;
  let MARKOV_CALIB_LOADING = false;

  // Neural calibration profiles (lazy-loaded, fallback to built-in defaults)
  let NEURAL_CALIBRATION = null;
  let NEURAL_CALIB_LOADING = false;

  // PRINCE calibration profiles (lazy-loaded, fallback to built-in defaults)
  let PRINCE_CALIBRATION = null;
  let PRINCE_CALIB_LOADING = false;

  // RockYou Bloom Filter (lazy-loaded on user request)
  let BLOOM_FILTER = null;   // { bitArray: Uint8Array, m: number, k: number } | null
  let BLOOM_LOADING = false; // prevent double-fetch
  let BLOOM_LOADED = false;  // user has triggered load
  let BLOOM_RESULT = null;   // "found" | "not_found" | "error" | null

  // ============================================================
  // ML MODEL (ONNX Runtime)
  // ============================================================
  let ML_NORMALIZATION = null;   // Mean and std for feature normalization (loaded with ONNX model)
  let ML_LOADING = false;        // Prevent double-load
  const ML_MIN_LENGTH = 10;
  const ML_SCORE_MIN = 35;
  const ML_SCORE_MAX = 80;

  const I = {
    en: {
      skip: "Skip to content",
      subtitle:
        "What if a hacker went after your password? Type it to see how long it would hold up. Everything is calculated on your device\u00a0— nothing leaves your browser.",
      inputLabel: "Test your password",
      placeholder: "Your password…",
      show: "Show",
      hide: "Hide",
      showAria: "Show password",
      hideAria: "Hide password",
      reset: "Reset",
      resetAria: "Reset",
      languageAria: "Language",
      strengthAria: "Password strength",
      tooltipBenchmarkAria: "Hardware benchmark information",
      dictLoading: "Loading dictionary...",
      hibpTitle: "This password has been leaked!",
      hibpText:
        'This password appears <strong id="hibp-count">—</strong> times in data breaches indexed by <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noopener">Have I Been Pwned</a>. It is strongly recommended not to use it.',
      hibpPrivacy:
        'Verified via <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">k-anonymity</a>: only the first 5 chars of the SHA-1 hash are sent.',
      hibpSafe:
        "This password does not appear in any known breach from Have I Been Pwned.",
      hibpError: "Could not verify against Have I Been Pwned (network issue).",
      hibpLoading: "Checking against known breaches...",
      weak: "Weak",
      strong: "Strong",
      chars: "Characters",
      charsetSize: "Charset size",
      entropyBits: "Entropy bits",
      combos: "Combinations",
      heatmapUnpredictable: "Unpredictable",
      heatmapModerate: "Moderate",
      heatmapPredictable: "Predictable",
      heatmapExplanation: "<strong>Unpredictable</strong>: Characters that don't follow common patterns (randomness, unusual combinations).<br><strong>Moderate</strong>: Characters with mixed predictability (some patterns, but not fully common).<br><strong>Predictable</strong>: Characters following common patterns (keyboard sequences, repeated characters, common positions).",
      status: "Status",
      statusShort: "Too short",
      statusGood: "Good length",
      statusExcellent: "Excellent",
      tableCaption: "Crack time by attack type and hashing algorithm",
      advancedDetails: "Advanced details",
      timeToCrackTitle: "Time to crack:",
      methodLink: "How does this attack work?",
      howItWorks: "How it works",
      thAttack: "Attack type",
      thAlgo: "Algorithm",
      thSpeed: "Speed (12 GPU)",
      thTime: "Est. time",
      hfModeLabel: "High-fidelity mode",
      hfModeHint: "Calibrated with leak-like priors and attack-specific multipliers",
      hfModeOn: "Calibration: high-fidelity",
      hfModeOff: "Calibration: standard",
      tooltipBenchmarkTitle: "Hardware benchmark",
      tooltipBenchmarkText: "All estimates use <strong>12× NVIDIA RTX 4090 GPUs (2025 benchmarks)</strong> (~2027 GH/s MD5, ~3462 GH/s NTLM), representing an experienced attacker.",
      tooltipAmateur: "1× RTX 4090",
      tooltipAmateurSpeed: "12× slower",
      tooltipPro: "100 GPU Cloud",
      tooltipProSpeed: "~8× faster",
      tooltipNation: "10,000 GPU Cluster",
      tooltipNationSpeed: "~800× faster",
      tooltipFootnote: "Even against nation-states, bcrypt/Argon2id remain secure.",
      dominantAttack: "Fastest attack",
      profileExperienced: "Experienced (12 GPU)",
      ctNotApplicable: "N/A",
      attackDescriptions: "Everything about attack types",
      methTitle: "Sources",
      methContent: "",
      footer:
        'No password is stored. Only network request: first 5 chars of SHA-1 hash sent to <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">Have I Been Pwned</a> (k-anonymity).',
      veryWeak: "Very weak",
      _weak: "Weak",
      moderate: "Moderate",
      _strong: "Strong",
      veryStrong: "Very strong",
      exceptional: "Exceptional",
      now: "Now",
      instant: "⚡ Instant",
      lessSec: "< 1 second",
      beyondDate: "Beyond any calculable date",
      beyondUniverse: "Longer than the age of the universe",
      na: "✓ N/A",
      via: "Via",
      allAttacks: "All attacks",
      unreachable:
        "<strong>Unreachable</strong>, even with the fastest attack.",
      unreachableFastest:
        "<strong>Unreachable</strong>, even with {attack}.",
      instantVia: "Cracked <strong>instantly</strong>",
      evenSlowest: "Even the slowest attack is <strong>instant</strong>.",
      resistsBeyond: "Resists <strong>beyond the age of the universe</strong>.",
      bruteForce: "Brute force",
      bruteSectionLabel: "Detail: brute force by hashing algorithm",
      vCommon: "Common password",
      vKeyboard: "Keyboard pattern",
      vShort: "Too short (< 8)",
      vSequence: "Sequence detected",
      vRepeat: "Repetition",
      vDate: "Date detected",
      v1Type: "Single char type",
      vMLHuman: "Human-like pattern detected",
      vDiversity: "Good diversity",
      vGoodLen: "Good length",
      vGreatLen: "Excellent length",
      aBrute: "🔨 Brute force",
      aDict: "📖 Dictionary",
      aHybrid: "🔀 Hybrid (dict+rules)",
      aMask: "🎭 Mask (patterns)",
      aRainbow: "🌈 Rainbow table",
      aSpray: "🌬️ Password spraying",
      aMarkov: "🧠 Markov (probabilistic)",
      aPCFG: "🏗️ PCFG (grammar)",
      aCombi: "➕ Combinator (2 words)",
      aRule: "📐 Rule-based (advanced)",
      aPrince: "🔮 PRINCE chaining",
      aNeural: "🤖 Neural guessing",
      aTargeted: "🎯 Targeted OSINT",
      aMorph: "📚 Morphological variants",
      nAllCombos: "All combinations",
      nInLeaks: "Found in known leaks!",
      nDictHit: "Dictionary word → cracked in seconds",
      nAbsentLeaks: "Not in known lists → ineffective",
      nDictMut: "Dict+mutation pattern detected",
      nStructUnrecog: "Unrecognizable structure → ineffective",
      nStructCaps: "Uppercase+lower+digits structure detected",
      nKBDetected: "Keyboard pattern detected",
      nSeqDetected: "Sequence detected",
      nNoPattern: "No predictable pattern → ineffective",
      nSalted: "Salted hash → tables impractical (each salt = unique table)",
      nNoRainbow: "No public rainbow tables exist for this algorithm",
      nTooLong: "Too long/complex for existing tables",
      nTablesAvail: "Precomputed tables available",
      nTablesBig: "Possible but large tables",
      nTop20: "Top 20 worldwide → priority target!",
      nNotTop: "Not in top common",
      nHuman95: "Human patterns → space reduced ~95%",
      nStatPrio: "Statistical sequence prioritization",
      nKeyboardUltra: "Keyboard walk detected → space reduced ~99.7%",
      nDateDetected: "Date detected → charset reduced dramatically",
      nPCFGDetected: "Grammatical structure detected → targeted",
      nPCFGNone: "Non-grammatical → less effective",
      nPassphrase: "Passphrase detected → 2-dict concatenation",
      nNotPassphrase: "Not a passphrase → ineffective",
      nRulesAdvanced: "Advanced mutation rules prioritized",
      nPrinceChain: "Likely multi-token chain structure",
      nNeuralModel: "Neural priorization of leaked-like patterns",
      nTargetedOSINT: "Targeted clues likely (name/date/context)",
      nMorphVariants: "Dictionary morphology/transliteration variants",
      nWeakPassword: "🚨 Ultra-weak: instant crack (Top 100 + heuristics)",
      yr: "year",
      yrs: "years",
      mo: "months",
      day: "day",
      days: "days",
      thousand: "thousand",
      million: "million",
      billion: "billion",
      trillion: "trillion",
      quadrillion: "quadrillion",
      appDescription:
        "Time2Crack calculates locally how long it would take to crack your password, without ever transmitting your password.",
      inputPlaceholder: "Test your password",
      testBtn: "Test your password",
      generateBtn: "Generate a password",
      genMemorized: "Memorized",
      genType: "Type",
      genTypeRandom: "🔀 Random",
      genTypePassphrase: "💬 Passphrase",
      genTypeWord: "✏️ Word-based",
      genLength: "Length",
      genCharset: "Characters",
      genBaseWord: "Base word",
      genBaseWordPlaceholder: "e.g. sunshine, mountain...",
      genWordHint: "Digits and symbols will be added automatically.",
      genPreview: "Live preview",
      genPreviewPlaceholder: "Choose a type and adjust options",
      genUseBtn: "Use this password",
      copyBtn: "Copy",
      copyBtnAria: "Copy password",
      copied: "Copied!",
      badgeExperienced: "Pirate experienced: 12× RTX 4090 (2025)",
      badgeProfessional: "Pirate professional: 100 GPU Cloud",
      tabExperienced: "Experienced",
      tabExperiencedGpus: "12× RTX 4090 GPUs",
      tabProfessional: "Professional",
      tabProfessionalGpus: "~100 GPUs",
      patternStrong: "Strong",
      scoreLevelVeryWeak: "🔴 Very Weak",
      scoreLevelWeak: "🟠 Weak",
      scoreLevelMedium: "🟡 Medium",
      scoreLevelGood: "🟢 Good",
      scoreLevelExcellent: "🟢 Excellent",
      scoreLevelExceptional: "🔵 Exceptional",
      qualityMsg: "This password is {0}",
      entropyLabel: "Entropy",
      entropyDesc: "Length + Variety + Unpredictability",
      structureLabel: "Structure",
      structureDesc: "Is the character arrangement recognizable?",
      analyseRowLabel: "Analysis",
      leakRowLabel: "Has your password already been breached?",
      leakedLabel: "Leaked",
      patternMsg: "Analysis: {0}",
      hibpStatusMsg: "Have I Been Pwned: {0}",
      hibpLoading: "⏳ Checking...",
      hibpLeaked: "⚠ Leaked",
      hibpSafe: "✓ Not leaked",
      hibpError: "? Check failed",
      bloomCheckBtn: "Check against RockYou (14M passwords)",
      bloomCheckNote: "~17 MB · one-time · stays local",
      bloomFoundTitle: "Found in RockYou!",
      bloomFoundText: "This password is in the RockYou dataset (14M+ most breached passwords). Any attacker will crack it instantly.",
      bloomNotFound: "Not found in RockYou dataset.",
      bloomLoading: "Loading RockYou filter (~17 MB)…",
      bloomError: "Could not load RockYou filter.",
      descBrute: "<p>Brute force attacks test every possible character combination, one by one, until the correct password is found. The only limit is available computing power: with a modern GPU like the RTX 4090, an attacker can test up to <em>169 billion</em> MD5 hashes per second.</p><p>A 6-character alphanumeric password (62 symbols) has 62⁶ = 56 billion combinations — cracked in under a second. At 10 characters, roughly 70 minutes. At 14 characters with uppercase, digits and symbols (95 symbols), combinations exceed 10²⁷: even a <a href='https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/wheeler' target='_blank' rel='noopener'>nation-state adversary cannot crack that</a> before the Sun dies.</p><p>Brute force is ineffective against long passwords but devastates short ones. Every extra character multiplies cracking time by the size of the alphabet used.</p>",
      descDict: "<p>Dictionary attacks do not test every combination: they test only real passwords already used by millions of people. These lists come from massive data breaches — <a href='https://haveibeenpwned.com/' target='_blank' rel='noopener'>Have I Been Pwned</a> catalogs over 14 billion compromised passwords.</p><p>Speed is identical to brute force — 169 GH/s on MD5 — but the search space is reduced to a few hundred million entries instead of trillions. <a href='https://ieeexplore.ieee.org/document/6234435' target='_blank' rel='noopener'>Academic studies show</a> that over 50% of real-world passwords appear in the top 10 million entries of a dictionary list.</p><p>If your password is a real word or a first name, consider it compromised within seconds.</p>",
      descHybrid: "<p>Hybrid attacks combine a dictionary with automatic transformation rules. The attacker starts from a known word — \"sunshine\" — then applies hundreds of mutations: initial capital (Sunshine), trailing digits (sunshine123), substitutions (sunsh1ne), year suffixes (sunshine2024), punctuation (sunshine!).</p><p><a href='https://gist.github.com/Chick3nman/32e662a5bb63bc4f51b847bb422222fd' target='_blank' rel='noopener'>Benchmarks published by the Hashcat team</a> show that Hashcat can apply over 1,000 rules per dictionary entry, generating billions of variants in minutes. <a href='https://ieeexplore.ieee.org/document/6956583' target='_blank' rel='noopener'>Academic security studies</a> confirm that \"Password1!\", \"qwerty2023\" and \"Sunshine!\" fall in under 60 seconds.</p><p>If your password is a recognizable word with a few visual modifications, it is vulnerable.</p>",
      descMask: "<p>Mask attacks exploit the predictable structure of human-chosen passwords. Rather than testing all combinations randomly, the attacker targets <em>recurring patterns</em> observed in data breaches: one uppercase followed by lowercase letters and two digits (\"Thomas42\"); or a common word followed by a year (\"Summer2024\").</p><p>Hashcat allows precisely defining such masks: <code>?u?l?l?l?l?d?d</code> means \"one uppercase, four lowercase, two digits\". <a href='https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/wheeler' target='_blank' rel='noopener'>Wheeler's research (2016)</a> has shown that 30 to 40% of real-world passwords follow one of the ten most common mask patterns.</p><p>A structured 8-character password can fall in seconds where brute force would take hours.</p>",
      descRainbow: "<p>A rainbow table is a precomputed database that maps hashes to their original passwords. Rather than computing hashes in real time, the attacker computes them <em>once</em> and stores them. To crack a stolen hash, a simple lookup suffices — like searching a word in a printed dictionary.</p><p>This technique is particularly devastating against unsalted algorithms like MD5 and SHA-1. Tables covering all alphanumeric passwords up to 8 characters take only a few terabytes, commercially accessible. <a href='https://www.hivesystems.com/blog/are-your-passwords-in-the-green' target='_blank' rel='noopener'>Hive Systems publishes annual tables</a> showing the effectiveness of this method.</p><p>The countermeasure is <em>salting</em>: adding a unique random value before hashing makes any precomputed table useless. That is why bcrypt and Argon2id include automatic salting — unlike MD5 and SHA-1 which remain vulnerable.</p>",
      descSpray: "<p>Password spraying reverses the logic of brute force. Rather than testing thousands of passwords on a single account — which triggers lockout — the attacker tests <em>one very common password</em> against thousands of different accounts.</p><p>Classic example: testing \"Summer2024!\" against 50,000 company accounts. Even if only 1% use this password, the attacker compromises 500 accounts without triggering a single alert. This technique is particularly used against corporate systems (Active Directory, Office 365, VPN). <a href='https://securelist.com/password-brute-force-time/112984/' target='_blank' rel='noopener'>Recent analysis by Kaspersky</a> shows it is one of the most commonly used initial access techniques.</p><p>The defense: multi-factor authentication (MFA) and monitoring for abnormal login patterns.</p>",
      descMarkov: "<p>Markov probabilistic attacks generate passwords by mimicking human linguistic habits. Rather than testing \"aaaa\", \"aaab\", \"aaac\" in alphabetical order, they prioritize the statistically most probable sequences.</p><p>The model is trained on millions of real passwords: it learns that \"th\" often follows \"e\", that passwords rarely begin with \"zx\", and that digits appear mostly at the end. <a href='https://link.springer.com/chapter/10.1007/978-3-319-24174-6_7' target='_blank' rel='noopener'>Research</a> shows this reduces the effective search space by 98 to 99% for common passwords.</p><p>Typical human passwords are tested <em>millions of times earlier</em> than in an exhaustive search. Keyboard sequences like \"qwerty\" or \"azerty\" are detected and prioritized instantly.</p>",
      descPCFG: "<p>PCFG (Probabilistic Context-Free Grammar) models the <em>structural grammar</em> of human-chosen passwords. The algorithm decomposes real passwords into typed segments: letters (L), digits (D), symbols (S). \"Password123!\" becomes L8D3S1 — 8 letters, 3 digits, 1 symbol.</p><p>The model learns which structures are most frequent (L8D2 is very common, S4L3 is rare), then generates and prioritizes candidates accordingly. A password like \"Password123\" has high theoretical entropy (72 bits), but its L8D3 structure is one of the most frequent in real password databases.</p><p><a href='https://ieeexplore.ieee.org/document/5207658' target='_blank' rel='noopener'>Weir et al. (2009)</a> demonstrated that PCFG cracks 10 to 50% more real passwords than classical attacks at equal budget. <a href='https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/wheeler' target='_blank' rel='noopener'>Wheeler (2016)</a> confirms that predictable structure is as dangerous as low entropy.</p>",
      descCombi: "<p>Combinator attacks concatenate two dictionary words to form synthetic passphrases. If each dictionary contains 200,000 words, possible combinations reach 40 billion pairs — a tiny fraction of pure brute force, but enough to cover most human passphrases.</p><p>Users creating a \"secure passphrase\" often choose two familiar words like \"horse-battery\" or \"bluesky\". Modern attackers use several specialized dictionaries: common words, first names, geographic locations, technical terms. <a href='https://www.researchgate.net/publication/389902836' target='_blank' rel='noopener'>Recent research</a> shows that two-word passphrases drawn from common vocabulary fall within hours.</p><p>The strength of a passphrase depends on the number of words (minimum three) and their rarity. A genuinely effective passphrase must combine at least four infrequent words, ideally with an unexpected separator.</p>",
      descRule: "<p>Rule-based attack is the industrial version of the hybrid attack. Instead of a few dozen transformations, the attacker uses rule files containing <em>thousands of combinable operations</em>: string reversal, duplication, leetspeak substitutions (a→4, e→3, o→0, s→5), symbol insertion, truncation, calendar suffixes. <a href='https://hashcat.net/wiki/doku.php?id=rule_based_attack' target='_blank' rel='noopener'>The official Hashcat documentation</a> lists over 100 different rule operators.</p><p>Files like \"best64.rule\" or \"OneRuleToRuleThemAll\" (40,000+ rules) generate hundreds of billions of variants from a base dictionary. A single word — \"password\" — produces \"P@ssw0rd!\", \"PASSWORD123\", \"drowssap\", \"p4ssw0rd2024!\".</p><p>Result: passwords that appear complex — mixes of uppercase, digits and symbols derived from a recognizable word — fall in seconds.</p>",
      descPrince: "<p>PRINCE (<em>PRobability INfinite Chained Elements</em>) is an advanced candidate generator designed to surpass the limits of classic combinator attacks. Rather than concatenating two words, PRINCE chains <em>variable-length elements</em> extracted from a base keyspace, computing the probability of each combination according to their frequency in real data.</p><p>The algorithm can combine 1, 2, 3 or more elements, with controlled repetitions, to cover structures like \"cat2024!\", \"abc123abc\" or \"mypassword1\". <a href='https://github.com/hashcat/princeprocessor' target='_blank' rel='noopener'>The official PRINCE processor</a> is maintained by the Hashcat team.</p><p>PRINCE's strength lies in its probabilistic ordering: statistically most probable candidates are tested first. It is particularly effective against intermediate-length passwords (8–12 characters) combining several recognizable semantic units.</p>",
      descNeural: "<p>Neural guessing models apply deep neural networks to password generation. An LSTM or Transformer network is trained on tens of millions of real passwords from leaks, learning to mimic the statistical distribution of human passwords with a precision that classical models (Markov, PCFG) cannot achieve.</p><p>The model generates new candidates that appear in no existing dictionary but strongly resemble real passwords: \"stuff2021!\", \"Margaret_92\", \"p@ssi0n\". <a href='https://arxiv.org/abs/1709.00440' target='_blank' rel='noopener'>PassGAN (2017)</a> was one of the first public demonstrations: a GAN trained on RockYou generated passwords indistinguishable from real ones.</p><p>More recent LLM-based versions show success rates 20 to 30% higher than classical PCFG attacks. Still mainly academic, but its effectiveness grows rapidly as models improve.</p>",
      descTargeted: "<p>Targeted OSINT attack (<em>Open Source Intelligence</em>) abandons generic approaches to exploit the victim's personal information. The attacker collects from social networks, LinkedIn, public registries: first name, last name, date of birth, pet name, hometown, employer.</p><p>This data feeds a generator like <a href='https://github.com/Mebus/cupp' target='_blank' rel='noopener'>CUPP (Common User Passwords Profiler)</a>, which automatically produces thousands of personalized combinations: \"Marie1985\", \"rex2803\", \"PSG_2024!\". Even a long password like \"Margaret-Smith-4thJuly\" is immediately vulnerable if this information is public.</p><p>The defense: never include personal information in a password, use a random generator, and enable two-factor authentication on all sensitive accounts.</p>",
      descMorph: "<p>Morphological analysis extends the dictionary attack by generating systematic grammatical variants of each base word. For \"sing\", the engine produces: \"sings\", \"singing\", \"singer\", \"sang\", \"sung\"… These variants are real words that users naturally employ in their passwords but may not appear in a base dictionary.</p><p><a href='https://github.com/iphelix/pack' target='_blank' rel='noopener'>The PACK tool (Password Analysis and Cracking Kit)</a> allows analyzing existing password sets to extract the most frequent morphological patterns. Combined with transformation rules, it covers variants like \"singer2024!\" or \"Quickness#1\" that neither a standard dictionary nor brute force would find efficiently.</p><p>Particularly formidable for morphologically rich languages (French, German, Polish) where inflection produces a high number of legitimate forms per root.</p>",
    },
    fr: {
      skip: "Aller au contenu principal",
      subtitle:
        "Et si un pirate s'en prenait à votre mot de passe\u00a0? Tapez-le pour voir combien de temps il résisterait. Tout est calculé sur votre appareil\u00a0— rien ne quitte votre navigateur.",
      inputLabel: "Testez votre mot de passe",
      placeholder: "Votre mot de passe…",
      show: "Afficher",
      hide: "Masquer",
      showAria: "Afficher le mot de passe",
      hideAria: "Masquer le mot de passe",
      reset: "Recommencer",
      resetAria: "Recommencer",
      languageAria: "Langue",
      strengthAria: "Robustesse du mot de passe",
      tooltipBenchmarkAria: "Informations sur la référence matérielle",
      dictLoading: "Chargement du dictionnaire...",
      hibpTitle: "Ce mot de passe a fuité !",
      hibpText:
        'Ce mot de passe apparaît <strong id="hibp-count">—</strong> fois dans des fuites répertoriées par <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noopener">Have I Been Pwned</a>. Il est fortement recommandé de ne pas l\'utiliser.',
      hibpPrivacy:
        'Vérification par <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">k-anonymity</a> : seuls les 5 premiers caractères du hash SHA-1 sont envoyés.',
      hibpSafe:
        "Ce mot de passe n'apparaît dans aucune fuite connue de Have I Been Pwned.",
      hibpError:
        "Impossible de vérifier auprès de Have I Been Pwned (problème réseau).",
      hibpLoading: "Vérification des fuites connues...",
      weak: "Faible",
      strong: "Fort",
      chars: "Caractères",
      charsetSize: "Taille du jeu",
      entropyBits: "Bits d'entropie",
      combos: "Combinaisons",
      heatmapUnpredictable: "Imprévisible",
      heatmapModerate: "Modéré",
      heatmapPredictable: "Prévisible",
      heatmapExplanation: "<strong>Imprévisible</strong> : Caractères qui ne suivent pas de schémas courants (aléatoire, combinaisons inhabituelles).<br><strong>Modéré</strong> : Caractères avec prévisibilité mixte (certains schémas, mais pas entièrement communs).<br><strong>Prévisible</strong> : Caractères suivant des schémas courants (séquences clavier, caractères répétés, positions communes).",
      status: "État",
      statusShort: "Trop court",
      statusGood: "Bonne longueur",
      statusExcellent: "Excellent",
      tableCaption:
        "Temps de craquage par type d'attaque et algorithme de hachage",
      advancedDetails: "Détails avancés",
      timeToCrackTitle: "Temps de craquage :",
      methodLink: "Comment fonctionne cette attaque ?",
      thAttack: "Type d'attaque",
      thAlgo: "Algorithme",
      thSpeed: "Vitesse (12 GPU)",
      thTime: "Temps estimé",
      hfModeLabel: "Mode haute fidelite",
      hfModeHint: "Calibre avec des priors proches des fuites et des multiplicateurs par attaque",
      hfModeOn: "Calibration : haute fidelite",
      hfModeOff: "Calibration : standard",
      tooltipBenchmarkTitle: "Référence matérielle",
      tooltipBenchmarkText: "Toutes les estimations utilisent <strong>12× NVIDIA RTX 4090 GPUs</strong> (~2027 GH/s MD5, ~3462 GH/s NTLM), représentant un attaquant expérimenté.",
      tooltipAmateur: "Amateur (1 GPU)",
      tooltipAmateurSpeed: "12× plus lent",
      tooltipPro: "Professionnel",
      tooltipProSpeed: "~8× plus rapide",
      tooltipNation: "État-nation",
      tooltipNationSpeed: "~800× plus rapide",
      tooltipFootnote: "Même contre des États-nations, bcrypt/Argon2id restent sécurisés.",
      dominantAttack: "Attaque dominante",
      profileExperienced: "Expérimenté (12 GPU)",
      ctNotApplicable: "N/A",
      methTitle: "Sources",
      methContent: "",
      footer:
        'Aucun mot de passe n\'est stocké. Seule requête réseau : les 5 premiers caractères du hash SHA-1 vers l\'API <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">Have I Been Pwned</a> (k-anonymity).',
      veryWeak: "Très faible",
      _weak: "Faible",
      moderate: "Modéré",
      _strong: "Fort",
      veryStrong: "Très fort",
      exceptional: "Exceptionnel",
      now: "Maintenant",
      instant: "⚡ Instantané",
      lessSec: "< 1 seconde",
      beyondDate: "Au-delà de toute date",
      beyondUniverse: "Plus que l'âge de l'univers",
      na: "✓ Non applicable",
      via: "Via",
      allAttacks: "Toutes attaques",
      unreachable:
        "<strong>Inatteignable</strong>, même avec l'attaque la plus rapide.",
      unreachableFastest:
        "<strong>Inatteignable</strong>, même avec {attack}.",
      instantVia: "Déchiffré <strong>instantanément</strong>",
      evenSlowest:
        "Même l'attaque la plus lente est <strong>instantanée</strong>.",
      resistsBeyond: "Résiste <strong>au-delà de l'âge de l'univers</strong>.",
      bruteForce: "Force brute",
      bruteSectionLabel: "Détail : force brute par algorithme de hachage",
      vCommon: "Mot de passe courant",
      vKeyboard: "Motif clavier",
      vShort: "Trop court (< 8)",
      vSequence: "Séquence détectée",
      vRepeat: "Répétition",
      vDate: "Date détectée",
      v1Type: "1 seul type de caractère",
      vMLHuman: "Motif humain détecté",
      vDiversity: "Bonne diversité",
      vGoodLen: "Bonne longueur",
      vGreatLen: "Excellente longueur",
      aBrute: "🔨 Force brute",
      aDict: "📖 Dictionnaire",
      aHybrid: "🔀 Hybride (dict+règles)",
      aMask: "🎭 Masque (motifs)",
      aRainbow: "🌈 Table arc-en-ciel",
      aSpray: "🌬️ Password spraying",
       aMarkov: "🧠 Markov (probabiliste)",
       aPCFG: "🏗️ PCFG (grammaire)",
       aCombi: "➕ Combinatoire (2 mots)",
       aRule: "📐 Règles avancées",
       aPrince: "🔮 PRINCE (chaînage)",
       aNeural: "🤖 Guessing neuronal",
       aTargeted: "🎯 Ciblé OSINT",
       aMorph: "📚 Variantes morphologiques",
      nAllCombos: "Toutes les combinaisons",
      nInLeaks: "Présent dans les fuites connues !",
      nDictHit: "Mot du dictionnaire → craqué en secondes",
      nAbsentLeaks: "Absent des listes → attaque inefficace",
      nDictMut: "Motif dict+mutations détecté",
      nStructUnrecog: "Structure non reconnaissable → inefficace",
      nStructCaps: "Structure Maj+min+chiffres détectée",
      nKBDetected: "Motif clavier détecté",
      nSeqDetected: "Séquence détectée",
      nNoPattern: "Aucun motif prévisible → inefficace",
      nSalted: "Hachage salé → tables impratiques (chaque salt = table unique)",
      nNoRainbow: "Pas de tables arc-en-ciel publiques pour cet algorithme",
      nTooLong: "Trop long/complexe pour les tables",
      nTablesAvail: "Tables précalculées disponibles",
      nTablesBig: "Tables possibles mais volumineuses",
      nTop20: "Top 20 mondial → ciblé en priorité !",
      nNotTop: "Hors top commun",
      nHuman95: "Motifs humains → espace réduit ~95 %",
      nStatPrio: "Priorisation statistique des séquences",
      nKeyboardUltra: "Motif clavier détecté → espace réduit ~99,7 %",
      nDateDetected: "Date détectée → charset réduit drastiquement",
      nPCFGDetected: "Structure grammaticale détectée → ciblé",
      nPCFGNone: "Non grammaticale → peu efficace",
       nPassphrase: "Passphrase détectée → 2 dictionnaires",
       nNotPassphrase: "Pas une passphrase → inefficace",
       nRulesAdvanced: "Règles de mutation avancées priorisées",
       nPrinceChain: "Structure chaînée multi-fragments probable",
       nNeuralModel: "Priorisation neuronale sur motifs de fuites",
       nTargetedOSINT: "Indices ciblés probables (nom/date/contexte)",
       nMorphVariants: "Variantes morphologiques/translittération",
       nWeakPassword: "🚨 Ultra-faible : craquage instantané (Top 100 + heuristiques)",
      yr: "année",
      yrs: "années",
      mo: "mois",
      day: "jour",
      days: "jours",
      thousand: "milliers",
      million: "millions",
      billion: "milliard",
      trillion: "billion",
      quadrillion: "billiard",
      appDescription:
        "Honnête, transparent et open-source. Time2Crack calcule gratuitement le temps de résistance au piratage de votre mot de passe, sans jamais transmettre votre mot de passe.",
      inputPlaceholder: "Testez votre mot de passe",
      testBtn: "Tester votre mot de passe",
      generateBtn: "Générer un mot de passe",
      genMemorized: "Mémorisé",
      genType: "Type",
      genTypeRandom: "🔀 Aléatoire",
      genTypePassphrase: "💬 Passphrase",
      genTypeWord: "✏️ Basé sur un mot",
      genLength: "Longueur",
      genCharset: "Caractères",
      genBaseWord: "Mot de base",
      genBaseWordPlaceholder: "Ex : soleil, montagne...",
      genWordHint: "Des chiffres et symboles seront ajoutés automatiquement.",
      genPreview: "Aperçu en temps réel",
      genPreviewPlaceholder: "Choisissez un type et ajustez les options",
      genUseBtn: "Utiliser ce mot de passe",
      copyBtn: "Copier",
      copyBtnAria: "Copier le mot de passe",
      copied: "Copié !",
       badgeExperienced: "Pirate expérimenté: 12× RTX 4090 (2025)",
       badgeProfessional: "Pirate professionnel: 100 GPU Cloud",
       tabExperienced: "Expérimenté",
       tabExperiencedGpus: "12× RTX 4090 GPUs",
       tabProfessional: "Professionnel",
       tabProfessionalGpus: "~100 GPUs",
       patternStrong: "Robuste",
       scoreLevelVeryWeak: "🔴 Très faible",
       scoreLevelWeak: "🟠 Faible",
       scoreLevelMedium: "🟡 Moyen",
       scoreLevelGood: "🟢 Bon",
       scoreLevelExcellent: "🟢 Excellent",
       scoreLevelExceptional: "🔵 Exceptionnel",
       qualityMsg: "Ce mot de passe est {0}",
       entropyLabel: "Entropie",
       entropyDesc: "Longueur + Variété + Imprévisibilité",
       structureLabel: "Structure",
       structureDesc: "L'arrangement des caractères est-il reconnaissable ?",
       analyseRowLabel: "Analyse",
       leakRowLabel: "Votre mot de passe a-t-il déjà été piraté ?",
       leakedLabel: "Fuite",
       patternMsg: "Analyse : {0}",
       hibpStatusMsg: "Have I Been Pwned : {0}",
       hibpLoading: "⏳ Vérification en cours...",
       hibpLeaked: "⚠ Divulgué",
       hibpSafe: "✓ Non divulgué",
       hibpError: "? Vérification échouée",
       bloomCheckBtn: "Vérifier contre RockYou (14M mots de passe)",
       bloomCheckNote: "~17 Mo en téléchargement · unique · reste local",
       bloomFoundTitle: "Trouvé dans RockYou !",
       bloomFoundText: "Ce mot de passe figure dans le dataset RockYou (14M+ mots de passe les plus compromis). Tout attaquant le cracke instantanément.",
       bloomNotFound: "Absent du dataset RockYou.",
       bloomLoading: "Chargement du filtre RockYou (~17 Mo)…",
       bloomError: "Impossible de charger le filtre RockYou.",
       attackDescriptions: "Tout savoir sur les types d'attaque",
       descBrute: "<p>L'attaque par force brute teste toutes les combinaisons possibles de caractères, une par une. La seule limite est la puissance de calcul : avec un GPU moderne comme le RTX 4090, un attaquant peut tester jusqu'à <em>169 milliards</em> de hachages MD5 par seconde.</p><p>Un mot de passe de 6 caractères alphanumériques représente 62⁶ = 56 milliards de combinaisons — moins d'une seconde. À 10 caractères, environ 70 minutes. À 14 caractères avec majuscules, chiffres et symboles, on dépasse 10²⁷ combinaisons : même un <a href='https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/wheeler' target='_blank' rel='noopener'>État-nation ne pourrait pas craquer ça</a> avant la mort du Soleil.</p><p>La force brute est inefficace contre les mots de passe longs, mais dévaste les courts. Chaque caractère supplémentaire multiplie le temps de craquage par la taille de l'alphabet utilisé.</p>",
       descDict: "<p>L'attaque par dictionnaire ne teste pas toutes les combinaisons : elle teste uniquement les mots de passe réels déjà utilisés par des millions de personnes. Les bases <a href='https://haveibeenpwned.com/' target='_blank' rel='noopener'>Have I Been Pwned</a> répertorient plus de 14 milliards de mots de passe compromis.</p><p>La vitesse est identique à la force brute — 169 GH/s sur MD5 — mais l'espace de recherche est réduit à quelques centaines de millions d'entrées au lieu de billions. <a href='https://ieeexplore.ieee.org/document/6234435' target='_blank' rel='noopener'>Selon les études universitaires</a>, plus de 50 % des mots de passe réels figurent dans les top 10 millions d'une liste de dictionnaire.</p><p>Si votre mot de passe est un vrai mot ou un prénom, considérez-le comme compromis en quelques secondes.</p>",
       descHybrid: "<p>L'attaque hybride combine un dictionnaire avec des règles de transformation automatiques. L'attaquant part d'un mot connu — \"soleil\" — puis applique des centaines de mutations : majuscule (Soleil), chiffres (soleil123), substitutions (s0l3il), suffixes d'années (soleil2024), ponctuation (soleil!).</p><p>Les benchmarks <a href='https://gist.github.com/Chick3nman/32e662a5bb63bc4f51b847bb422222fd' target='_blank' rel='noopener'>publiés par l'équipe Hashcat</a> montrent que Hashcat peut appliquer plus de 1 000 règles par entrée, générant des milliards de variantes en quelques minutes. <a href='https://ieeexplore.ieee.org/document/6956583' target='_blank' rel='noopener'>Des études académiques</a> confirment que \"Password1!\", \"azerty2023\" et \"Soleil!\" tombent en moins de 60 secondes.</p><p>Si votre mot de passe est un mot reconnaissable avec quelques modifications visuelles, il est vulnérable.</p>",
       descMask: "<p>L'attaque par masque exploite la structure prévisible des mots de passe humains. Plutôt que de tester toutes les combinaisons au hasard, l'attaquant cible des <em>schémas récurrents</em> : une majuscule suivie de minuscules et deux chiffres (\"Thomas42\") ; ou un mot commun suivi d'une année (\"Summer2024\").</p><p>Hashcat permet de définir précisément ces masques : <code>?u?l?l?l?l?d?d</code> = \"une majuscule, quatre minuscules, deux chiffres\". <a href='https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/wheeler' target='_blank' rel='noopener'>Wheeler (2016)</a> a montré que 30 à 40 % des mots de passe réels suivent un des dix masques les plus fréquents.</p><p>Un mot de passe de 8 caractères structuré peut tomber en secondes là où la force brute prendrait des heures.</p>",
       descRainbow: "<p>Une table arc-en-ciel est une base de données précalculée qui associe des hachages à leurs mots de passe d'origine. Plutôt que de calculer les hachages en temps réel, l'attaquant les calcule <em>une seule fois</em> et les stocke. Pour craquer un hachage volé, une simple recherche dans la table suffit.</p><p>Cette technique est particulièrement dévastatrice contre les algorithmes non salés comme MD5 et SHA-1. Des tables couvrant tous les mots de passe alphanumériques jusqu'à 8 caractères occupent quelques téraoctets, accessibles sur le marché. <a href='https://www.hivesystems.com/blog/are-your-passwords-in-the-green' target='_blank' rel='noopener'>Hive Systems publie chaque année</a> des tableaux montrant l'efficacité de cette méthode.</p><p>La parade est le <em>salage</em> : ajouter une valeur aléatoire unique avant le hachage rend toute table précalculée inutile. C'est pourquoi bcrypt et Argon2id intègrent un sel automatique, contrairement à MD5 et SHA-1.</p>",
       descSpray: "<p>Le password spraying inverse la logique de la force brute. Plutôt que de tester des milliers de mots de passe sur un seul compte — ce qui déclenche le verrouillage — l'attaquant teste <em>un seul mot de passe très courant</em> sur des milliers de comptes différents.</p><p>Exemple : tester \"Summer2024!\" sur 50 000 comptes d'une entreprise. Même si 1 % des employés l'utilisent, l'attaquant compromet 500 comptes sans déclencher d'alerte. <a href='https://securelist.com/password-brute-force-time/112984/' target='_blank' rel='noopener'>Kaspersky</a> identifie cette technique comme l'un des vecteurs d'accès initial les plus fréquents dans les cyberattaques d'entreprise.</p><p>La défense : authentification multifacteur (MFA) et surveillance des connexions anormales.</p>",
        descMarkov: "<p>L'attaque probabiliste de Markov génère des mots de passe en imitant les habitudes linguistiques humaines. Plutôt que de tester \"aaaa\", \"aaab\", \"aaac\" dans l'ordre alphabétique, elle priorise les séquences les plus probables statistiquement.</p><p>Le modèle apprend que \"th\" suit souvent \"e\", que les mots de passe commencent rarement par \"zx\", que les chiffres apparaissent surtout en fin de chaîne. <a href='https://link.springer.com/chapter/10.1007/978-3-319-24174-6_7' target='_blank' rel='noopener'>Des recherches</a> montrent que cette approche réduit l'espace effectif de 98 à 99 % pour les mots de passe courants.</p><p>\"Thibault42\" ou \"mariecurie\" tombent bien plus vite que leur entropie théorique ne le suggère. Les séquences clavier comme \"qwerty\" ou \"azerty\" sont détectées et priorisées instantanément.</p>",
        descPCFG: "<p>Le PCFG (Probabilistic Context-Free Grammar) modélise la <em>grammaire structurelle</em> des mots de passe humains. L'algorithme décompose les mots de passe en segments typés : lettres (L), chiffres (D), symboles (S). \"Password123!\" devient L8D3S1 — 8 lettres, 3 chiffres, 1 symbole.</p><p>Le modèle apprend quelles structures sont les plus fréquentes (L8D2 est très courant, S4L3 est rare), puis priorise les candidats en conséquence. \"Password123\" a une entropie théorique élevée (72 bits), mais sa structure L8D3 est l'une des plus fréquentes dans les vraies bases de données.</p><p><a href='https://ieeexplore.ieee.org/document/5207658' target='_blank' rel='noopener'>Weir et al. (2009)</a> ont démontré que le PCFG craque 10 à 50 % plus de mots de passe réels que les attaques classiques à budget égal. <a href='https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/wheeler' target='_blank' rel='noopener'>Wheeler (2016)</a> confirme que la structure prévisible est aussi dangereuse que l'entropie faible.</p>",
        descCombi: "<p>L'attaque combinatoire concatène deux mots de dictionnaire pour former des phrases de passe synthétiques. Avec 200 000 mots par dictionnaire, les combinaisons atteignent 40 milliards de paires — une fraction infime de la force brute, mais suffisante pour couvrir la plupart des passphrases humaines.</p><p>Les utilisateurs créant une \"passphrase sécurisée\" choisissent souvent deux mots familiers comme \"cheval-batterie\" ou \"cielbleu\". Les attaquants utilisent plusieurs dictionnaires spécialisés : mots courants, prénoms, lieux géographiques. <a href='https://www.researchgate.net/publication/389902836' target='_blank' rel='noopener'>Des recherches récentes</a> montrent que les passphrases à deux mots courants tombent en quelques heures.</p><p>La robustesse d'une passphrase dépend du nombre de mots (minimum trois) et de leur rareté. Une passphrase efficace combine au moins quatre mots peu fréquents, idéalement avec un séparateur inattendu.</p>",
        descRule: "<p>L'attaque basée sur des règles est la version industrielle de l'attaque hybride. Au lieu de quelques dizaines de transformations, l'attaquant utilise des fichiers contenant des <em>milliers d'opérations combinables</em> : inversion, duplication, substitutions leetspeak (a→4, e→3, o→0), insertions de symboles, suffixes calendaires. <a href='https://hashcat.net/wiki/doku.php?id=rule_based_attack' target='_blank' rel='noopener'>Hashcat</a> recense plus de 100 opérateurs différents.</p><p>Des fichiers comme \"best64.rule\" ou \"OneRuleToRuleThemAll\" (40 000+ règles) génèrent des centaines de milliards de variantes. Un seul mot — \"password\" — produit \"P@ssw0rd!\", \"PASSWORD123\", \"drowssap\", \"p4ssw0rd2024!\".</p><p>Résultat : des mots de passe qui semblent complexes — mélanges de majuscules, chiffres et symboles issus d'un mot reconnaissable — tombent en secondes.</p>",
        descPrince: "<p>PRINCE (<em>PRobability INfinite Chained Elements</em>) est un générateur de candidats avancé conçu pour dépasser les limites du combinator classique. Plutôt que de concaténer deux mots, PRINCE enchaîne des <em>éléments de longueur variable</em> en calculant la probabilité de chaque combinaison selon leur fréquence réelle.</p><p>L'algorithme combine 1, 2, 3 éléments ou plus pour couvrir des structures comme \"chat2024!\", \"abc123abc\" ou \"monmotdepasse1\". <a href='https://github.com/hashcat/princeprocessor' target='_blank' rel='noopener'>Le PRINCE processor</a> est maintenu par l'équipe Hashcat.</p><p>Les candidats les plus probables sont testés en premier, maximisant le taux de succès pour un budget de calcul donné. Particulièrement efficace contre les mots de passe de 8–12 caractères combinant plusieurs unités sémantiques reconnaissables.</p>",
        descNeural: "<p>Les modèles de devinette neurale appliquent les réseaux de neurones profonds à la génération de mots de passe. Un réseau LSTM ou Transformer est entraîné sur des dizaines de millions de mots de passe réels, et apprend à imiter leur distribution statistique avec une précision que Markov et PCFG ne peuvent pas atteindre.</p><p>Le modèle génère des candidats qui ne figurent dans aucun dictionnaire mais ressemblent fortement à de vrais mots de passe : \"truc2021!\", \"Margaux_92\", \"p@ssi0n\". <a href='https://arxiv.org/abs/1709.00440' target='_blank' rel='noopener'>PassGAN (2017)</a> a été l'une des premières démonstrations publiques de cette approche.</p><p>Des versions récentes basées sur des LLM montrent des taux de succès 20 à 30 % supérieurs aux attaques PCFG. Encore principalement académique, mais son efficacité croît rapidement.</p>",
        descTargeted: "<p>L'attaque ciblée par OSINT (<em>Open Source Intelligence</em>) exploite les informations personnelles de la victime. L'attaquant collecte sur les réseaux sociaux, LinkedIn ou les registres publics : prénom, nom, date de naissance, nom du chien, ville natale, entreprise.</p><p>Ces données alimentent un générateur comme <a href='https://github.com/Mebus/cupp' target='_blank' rel='noopener'>CUPP</a>, qui produit des milliers de combinaisons personnalisées : \"Marie1985\", \"rex2803\", \"PSG_2024!\". Même un mot de passe long comme \"Margaux-Dupont-14juillet\" est immédiatement vulnérable si ces informations sont publiques.</p><p>La défense : ne jamais inclure d'informations personnelles dans un mot de passe, utiliser un générateur aléatoire, et activer l'authentification à deux facteurs.</p>",
        descMorph: "<p>L'analyse morphologique étend l'attaque par dictionnaire en générant des variantes grammaticales systématiques. Pour \"chanter\", le moteur produit : \"chante\", \"chantons\", \"chanté\", \"chanteur\"… Ces variantes sont des mots réels que les utilisateurs emploient naturellement mais qui ne figurent pas forcément dans le dictionnaire de base.</p><p><a href='https://github.com/iphelix/pack' target='_blank' rel='noopener'>L'outil PACK</a> permet d'extraire les patterns morphologiques les plus fréquents. Combinée avec des règles, cette technique couvre des variantes comme \"chanteur2024!\" ou \"Rapidite#1\" que ni un dictionnaire standard ni la force brute ne trouveraient efficacement.</p><p>Particulièrement redoutable pour les langues à morphologie riche (français, allemand, polonais) où la flexion produit de nombreuses formes par racine.</p>",
      },
    es: {
      skip: "Ir al contenido principal",
      subtitle:
        "¿Y si un hacker atacara tu contraseña? Escríbela para ver cuánto resistiría. Todo se calcula en tu dispositivo\u00a0— nada sale de tu navegador.",
      inputLabel: "Ingresa una contraseña para probar",
      placeholder: "Tu contraseña…",
      show: "Mostrar",
      hide: "Ocultar",
      showAria: "Mostrar contraseña",
      hideAria: "Ocultar contraseña",
      reset: "Reiniciar",
      resetAria: "Reiniciar",
      languageAria: "Idioma",
      strengthAria: "Fortaleza de la contraseña",
      tooltipBenchmarkAria: "Información del benchmark de hardware",
      dictLoading: "Cargando diccionario...",
      hibpTitle: "¡Esta contraseña ha sido filtrada!",
      hibpText:
        'Esta contraseña aparece <strong id="hibp-count">—</strong> veces en brechas de datos indexadas por <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noopener">Have I Been Pwned</a>. Se recomienda encarecidamente no utilizarla.',
      hibpPrivacy:
        'Verificado mediante <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">k-anonymity</a>: solo se envían los primeros 5 caracteres del hash SHA-1.',
      hibpSafe:
        "Esta contraseña no aparece en ninguna filtración conocida de Have I Been Pwned.",
      hibpError:
        "No se pudo verificar con Have I Been Pwned (problema de red).",
      hibpLoading: "Verificando contra filtraciones conocidas...",
      weak: "Débil",
      strong: "Fuerte",
      chars: "Caracteres",
      charsetSize: "Tamaño del conjunto",
      entropyBits: "Bits de entropía",
      combos: "Combinaciones",
      heatmapUnpredictable: "Impredecible",
      heatmapModerate: "Moderado",
      heatmapPredictable: "Predecible",
      heatmapExplanation: "<strong>Impredecible</strong>: Caracteres que no siguen patrones comunes (aleatoriedad, combinaciones inusuales).<br><strong>Moderado</strong>: Caracteres con previsibilidad mixta (algunos patrones, pero no totalmente comunes).<br><strong>Predecible</strong>: Caracteres que siguen patrones comunes (secuencias de teclado, caracteres repetidos, posiciones comunes).",
      status: "Estado",
      statusShort: "Demasiado corta",
      statusGood: "Buena longitud",
      statusExcellent: "Excelente",
      tableCaption: "Tiempo de craqueo por tipo de ataque y algoritmo de hash",
      advancedDetails: "Detalles avanzados",
      timeToCrackTitle: "Tiempo de crack:",
      methodLink: "¿Cómo funciona este ataque?",
      thAttack: "Tipo de ataque",
      thAlgo: "Algoritmo",
      thSpeed: "Velocidad (12 GPU)",
      thTime: "Tiempo estimado",
      tooltipBenchmarkTitle: "Referencia de hardware",
      tooltipBenchmarkText: "Todas las estimaciones usan <strong>12× NVIDIA RTX 4090 GPUs</strong> (~2027 GH/s MD5, ~3462 GH/s NTLM), representando un atacante experimentado.",
      tooltipAmateur: "Aficionado (1 GPU)",
      tooltipAmateurSpeed: "12× más lento",
      tooltipPro: "Profesional",
      tooltipProSpeed: "~8× más rápido",
      tooltipNation: "Estado-nación",
      tooltipNationSpeed: "~800× más rápido",
      tooltipFootnote: "Incluso contra estados-nación, bcrypt/Argon2id permanecen seguros.",
      dominantAttack: "Ataque dominante",
      profileExperienced: "Experimentado (12 GPU)",
      ctNotApplicable: "N/A",
      methTitle: "Metodología y fuentes",
      methContent: "",
      footer:
        'Ninguna contraseña se almacena. Única solicitud de red: los primeros 5 caracteres del hash SHA-1 se envían a la API <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">Have I Been Pwned</a> (k-anonymity).',
      veryWeak: "Muy débil",
      _weak: "Débil",
      moderate: "Moderada",
      _strong: "Fuerte",
      veryStrong: "Muy fuerte",
      exceptional: "Excepcional",
      now: "Ahora",
      instant: "⚡ Instantáneo",
      lessSec: "< 1 segundo",
      beyondDate: "Más allá de cualquier fecha calculable",
      beyondUniverse: "Más que la edad del universo",
      na: "✓ No aplica",
      via: "Vía",
      allAttacks: "Todos los ataques",
      unreachable:
        "<strong>Inalcanzable</strong>, incluso con el ataque más rápido.",
      unreachableFastest:
        "<strong>Inalcanzable</strong>, incluso con {attack}.",
      instantVia: "Descifrado <strong>instantáneamente</strong>",
      evenSlowest:
        "Incluso el ataque más lento es <strong>instantáneo</strong>.",
      resistsBeyond:
        "Resiste <strong>más allá de la edad del universo</strong>.",
      bruteForce: "Fuerza bruta",
      bruteSectionLabel: "Detalle: fuerza bruta por algoritmo de hash",
      vCommon: "Contraseña común",
      vKeyboard: "Patrón de teclado",
      vShort: "Demasiado corta (< 8)",
      vSequence: "Secuencia detectada",
      vRepeat: "Repetición",
      vDate: "Fecha detectada",
      v1Type: "Un solo tipo de carácter",
      vMLHuman: "Patrón humano detectado",
      vDiversity: "Buena diversidad",
      vGoodLen: "Buena longitud",
      vGreatLen: "Excelente longitud",
      aBrute: "🔨 Fuerza bruta",
      aDict: "📖 Diccionario",
      aHybrid: "🔀 Híbrido (dict+reglas)",
      aMask: "🎭 Máscara (patrones)",
      aRainbow: "🌈 Tabla arcoíris",
      aSpray: "🌬️ Password spraying",
      aMarkov: "🧠 Markov (probabilístico)",
      aPCFG: "🏗️ PCFG (gramática)",
      aCombi: "➕ Combinador (2 palabras)",
      nAllCombos: "Todas las combinaciones",
      nInLeaks: "Encontrado en filtraciones conocidas",
      nDictHit: "Palabra del diccionario → descifrada en segundos",
      nAbsentLeaks: "No en listas conocidas → ataque ineficaz",
      nDictMut: "Patrón dict+mutaciones detectado",
      nStructUnrecog: "Estructura no reconocible → ineficaz",
      nStructCaps: "Estructura mayús+minús+dígitos detectada",
      nKBDetected: "Patrón de teclado detectado",
      nSeqDetected: "Secuencia detectada",
      nNoPattern: "Sin patrón predecible → ineficaz",
      nSalted: "Hash salteado → tablas impracticables (cada salt = tabla única)",
      nNoRainbow: "No existen tablas arcoíris públicas para este algoritmo",
      nTooLong: "Demasiado largo/complejo para tablas",
      nTablesAvail: "Tablas precalculadas disponibles",
      nTablesBig: "Tablas posibles pero grandes",
      nTop20: "Top 20 mundial → objetivo prioritario!",
      nNotTop: "Fuera de los comunes",
      nHuman95: "Patrones humanos → espacio reducido ~95%",
      nStatPrio: "Priorización estadística de secuencias",
      nPCFGDetected: "Estructura gramatical detectada → dirigida",
      nPCFGNone: "No gramatical → menos eficaz",
      nPassphrase: "Frase de paso detectada → 2 diccionarios",
      nNotPassphrase: "No es una frase de paso → ineficaz",
      yr: "año",
      yrs: "años",
      mo: "meses",
      day: "día",
      days: "días",
      thousand: "mil",
      million: "millón",
      billion: "mil millones",
      trillion: "billón",
      quadrillion: "mil billones",
      appDescription:
        "Time2Crack calcula localmente cuánto tardarían en descifrar tu contraseña, sin transmitir nunca tu contraseña.",
      inputPlaceholder: "Ingresa una contraseña para probar",
      testBtn: "Probar una contraseña",
      generateBtn: "Generar una contraseña",
      genMemorized: "Memorizado",
      genType: "Tipo",
      genTypeRandom: "🔀 Aleatorio",
      genTypePassphrase: "💬 Frase de contraseña",
      genTypeWord: "✏️ Basado en palabra",
      genLength: "Longitud",
      genCharset: "Caracteres",
      genBaseWord: "Palabra base",
      genBaseWordPlaceholder: "p.ej. sol, montaña...",
      genWordHint: "Se añadirán dígitos y símbolos automáticamente.",
      genPreview: "Vista previa en vivo",
      genPreviewPlaceholder: "Elige un tipo y ajusta las opciones",
      genUseBtn: "Usar esta contraseña",
      copyBtn: "Copiar",
      copyBtnAria: "Copiar contraseña",
      copied: "¡Copiado!",
      badgeExperienced: "Pirata experimentado: 12× RTX 4090 (2025)",
      badgeProfessional: "Pirata profesional: 100 GPU Cloud",
      tabExperienced: "Experimentado",
      tabExperiencedGpus: "12× RTX 4090 GPUs",
      tabProfessional: "Profesional",
      tabProfessionalGpus: "~100 GPUs",
      patternStrong: "Fuerte",
      scoreLevelVeryWeak: "🔴 Muy débil",
      scoreLevelWeak: "🟠 Débil",
      scoreLevelMedium: "🟡 Medio",
      scoreLevelGood: "🟢 Bueno",
      scoreLevelExcellent: "🟢 Excelente",
      scoreLevelExceptional: "🔵 Excepcional",
      qualityMsg: "Esta contraseña es {0}",
      entropyLabel: "Entropy",
      entropyDesc: "Length + Variety + Unpredictability",
      patternMsg: "Análisis: {0}",
      hibpStatusMsg: "Have I Been Pwned: {0}",
      hibpLoading: "⏳ Verificando...",
      hibpLeaked: "⚠ Filtrada",
      hibpSafe: "✓ No filtrada",
      hibpError: "? Verificación fallida",
      bloomCheckBtn: "Check against RockYou (14M passwords)",
      bloomCheckNote: "~17 MB · one-time · stays local",
      bloomFoundTitle: "Found in RockYou!",
      bloomFoundText: "This password is in the RockYou dataset (14M+ most breached passwords). Any attacker will crack it instantly.",
      bloomNotFound: "Not found in RockYou dataset.",
      bloomLoading: "Loading RockYou filter (~17 MB)…",
      bloomError: "Could not load RockYou filter.",
    },
    pt: {
      skip: "Ir para o conteúdo principal",
      subtitle:
        "E se um hacker atacasse sua senha? Digite-a para ver quanto tempo ela resistiria. Tudo é calculado no seu dispositivo\u00a0— nada sai do seu navegador.",
      inputLabel: "Digite uma senha para testar",
      placeholder: "Sua senha…",
      show: "Mostrar",
      hide: "Ocultar",
      showAria: "Mostrar senha",
      hideAria: "Ocultar senha",
      reset: "Reiniciar",
      resetAria: "Reiniciar",
      languageAria: "Idioma",
      strengthAria: "Força da senha",
      tooltipBenchmarkAria: "Informações do benchmark de hardware",
      dictLoading: "Carregando dicionário...",
      hibpTitle: "Esta senha foi vazada!",
      hibpText:
        'Esta senha aparece <strong id="hibp-count">—</strong> vezes em violações de dados indexadas por <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noopener">Have I Been Pwned</a>. É fortemente recomendável não utilizá-la.',
      hibpPrivacy:
        'Verificado via <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">k-anonymity</a>: apenas os primeiros 5 caracteres do hash SHA-1 são enviados.',
      hibpSafe:
        "Esta senha não aparece em nenhuma violação conhecida do Have I Been Pwned.",
      hibpError:
        "Não foi possível verificar com Have I Been Pwned (problema de rede).",
      hibpLoading: "Verificando contra violações conhecidas...",
      weak: "Fraca",
      strong: "Forte",
      chars: "Caracteres",
      charsetSize: "Tamanho do conjunto",
      entropyBits: "Bits de entropia",
      combos: "Combinações",
      heatmapUnpredictable: "Imprevisível",
      heatmapModerate: "Moderado",
      heatmapPredictable: "Previsível",
      heatmapExplanation: "<strong>Imprevisível</strong>: Caracteres que não seguem padrões comuns (aleatoriedade, combinações incomuns).<br><strong>Moderado</strong>: Caracteres com previsibilidade mista (alguns padrões, mas não totalmente comuns).<br><strong>Previsível</strong>: Caracteres que seguem padrões comuns (sequências de teclado, caracteres repetidos, posições comuns).",
      status: "Estado",
      statusShort: "Muito curta",
      statusGood: "Bom comprimento",
      statusExcellent: "Excelente",
      tableCaption: "Tempo de quebra por tipo de ataque e algoritmo de hash",
      advancedDetails: "Detalhes avançados",
      timeToCrackTitle: "Tempo de quebra:",
      methodLink: "Como funciona este ataque?",
      thAttack: "Tipo de ataque",
      thAlgo: "Algoritmo",
      thSpeed: "Velocidade (12 GPU)",
      thTime: "Tempo estimado",
      tooltipBenchmarkTitle: "Referência de hardware",
      tooltipBenchmarkText: "Todas as estimativas usam <strong>12× NVIDIA RTX 4090 GPUs</strong> (~2027 GH/s MD5, ~3462 GH/s NTLM), representando um atacante experiente.",
      tooltipAmateur: "Amador (1 GPU)",
      tooltipAmateurSpeed: "12× mais lento",
      tooltipPro: "Profissional",
      tooltipProSpeed: "~8× mais rápido",
      tooltipNation: "Estado-nação",
      tooltipNationSpeed: "~800× mais rápido",
      tooltipFootnote: "Mesmo contra estados-nação, bcrypt/Argon2id permanecem seguros.",
      dominantAttack: "Ataque dominante",
      profileExperienced: "Experiente (12 GPU)",
      ctNotApplicable: "N/A",
      methTitle: "Metodologia e fontes",
      methContent: "",
      footer:
        'Nenhuma senha é armazenada. Única requisição de rede: os primeiros 5 caracteres do hash SHA-1 são enviados para a API <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">Have I Been Pwned</a> (k-anonymity).',
      veryWeak: "Muito fraca",
      _weak: "Fraca",
      moderate: "Moderada",
      _strong: "Forte",
      veryStrong: "Muito forte",
      exceptional: "Excepcional",
      now: "Agora",
      instant: "⚡ Instantâneo",
      lessSec: "< 1 segundo",
      beyondDate: "Além de qualquer data calculável",
      beyondUniverse: "Mais que a idade do universo",
      na: "✓ Não aplicável",
      via: "Via",
      allAttacks: "Todos os ataques",
      unreachable:
        "<strong>Inatingível</strong>, mesmo com o ataque mais rápido.",
      unreachableFastest:
        "<strong>Inalcançável</strong>, mesmo com {attack}.",
      instantVia: "Quebrado <strong>instantaneamente</strong>",
      evenSlowest: "Até o ataque mais lento é <strong>instantâneo</strong>.",
      resistsBeyond: "Resiste <strong>além da idade do universo</strong>.",
      bruteForce: "Força bruta",
      bruteSectionLabel: "Detalhe: força bruta por algoritmo de hash",
      vCommon: "Senha comum",
      vKeyboard: "Padrão de teclado",
      vShort: "Muito curta (< 8)",
      vSequence: "Sequência detectada",
      vRepeat: "Repetição",
      vDate: "Data detectada",
      v1Type: "Um único tipo de caractere",
      vMLHuman: "Padrão humano detectado",
      vDiversity: "Boa diversidade",
      vGoodLen: "Bom comprimento",
      vGreatLen: "Excelente comprimento",
      aBrute: "🔨 Força bruta",
      aDict: "📖 Dicionário",
      aHybrid: "🔀 Híbrido (dict+regras)",
      aMask: "🎭 Máscara (padrões)",
      aRainbow: "🌈 Tabela arco-íris",
      aSpray: "🌬️ Password spraying",
      aMarkov: "🧠 Markov (probabilístico)",
      aPCFG: "🏗️ PCFG (gramática)",
      aCombi: "➕ Combinador (2 palavras)",
      nAllCombos: "Todas as combinações",
      nInLeaks: "Encontrado em vazamentos conhecidos!",
      nDictHit: "Palavra do dicionário → quebrada em segundos",
      nAbsentLeaks: "Não em listas conhecidas → ataque ineficaz",
      nDictMut: "Padrão dict+mutações detectado",
      nStructUnrecog: "Estrutura não reconhecível → ineficaz",
      nStructCaps: "Estrutura maiúsc+minúsc+dígitos detectada",
      nKBDetected: "Padrão de teclado detectado",
      nSeqDetected: "Sequência detectada",
      nNoPattern: "Sem padrão previsível → ineficaz",
      nSalted: "Hash com sal → tabelas impraticáveis (cada salt = tabela única)",
      nNoRainbow: "Não existem tabelas arco-íris públicas para este algoritmo",
      nTooLong: "Muito longo/complexo para tabelas",
      nTablesAvail: "Tabelas pré-calculadas disponíveis",
      nTablesBig: "Tabelas possíveis mas grandes",
      nTop20: "Top 20 mundial → alvo prioritário!",
      nNotTop: "Fora do comum",
      nHuman95: "Padrões humanos → espaço reduzido ~95%",
      nStatPrio: "Priorização estatística de sequências",
      nPCFGDetected: "Estrutura gramatical detectada → alvo",
      nPCFGNone: "Não gramatical → menos eficaz",
      nPassphrase: "Frase-passe detectada → 2 dicionários",
      nNotPassphrase: "Não é uma frase-passe → ineficaz",
      yr: "ano",
      yrs: "anos",
      mo: "meses",
      day: "dia",
      days: "dias",
      thousand: "mil",
      million: "milhão",
      billion: "bilhão",
      trillion: "trilhão",
      quadrillion: "quatrilhão",
      appDescription:
        "Time2Crack calcula localmente quanto tempo levaria para quebrar sua senha, sem nunca transmitir sua senha.",
      inputPlaceholder: "Digite uma senha para testar",
      testBtn: "Testar uma senha",
      generateBtn: "Gerar uma senha",
      genMemorized: "Memorizado",
      genType: "Tipo",
      genTypeRandom: "🔀 Aleatório",
      genTypePassphrase: "💬 Frase secreta",
      genTypeWord: "✏️ Baseado em palavra",
      genLength: "Comprimento",
      genCharset: "Caracteres",
      genBaseWord: "Palavra base",
      genBaseWordPlaceholder: "ex: sol, montanha...",
      genWordHint: "Dígitos e símbolos serão adicionados automaticamente.",
      genPreview: "Pré-visualização ao vivo",
      genPreviewPlaceholder: "Escolha um tipo e ajuste as opções",
      genUseBtn: "Usar esta senha",
      copyBtn: "Copiar",
      copyBtnAria: "Copiar senha",
      copied: "Copiado!",
      badgeExperienced: "Pirata experiente: 12× RTX 4090 (2025)",
      badgeProfessional: "Pirata profissional: 100 GPU Cloud",
      tabExperienced: "Experiente",
      tabExperiencedGpus: "12× RTX 4090 GPUs",
      tabProfessional: "Profissional",
      tabProfessionalGpus: "~100 GPUs",
      patternStrong: "Forte",
      scoreLevelVeryWeak: "🔴 Muito fraco",
      scoreLevelWeak: "🟠 Fraco",
      scoreLevelMedium: "🟡 Médio",
      scoreLevelGood: "🟢 Bom",
      scoreLevelExcellent: "🟢 Excelente",
      scoreLevelExceptional: "🔵 Excepcional",
      qualityMsg: "Esta senha é {0}",
      entropyLabel: "Entropy",
      entropyDesc: "Length + Variety + Unpredictability",
      patternMsg: "Análise: {0}",
      hibpStatusMsg: "Have I Been Pwned: {0}",
      hibpLoading: "⏳ Verificando...",
      hibpLeaked: "⚠ Vazada",
      hibpSafe: "✓ Não vazada",
      hibpError: "? Verificação falhou",
      bloomCheckBtn: "Check against RockYou (14M passwords)",
      bloomCheckNote: "~17 MB · one-time · stays local",
      bloomFoundTitle: "Found in RockYou!",
      bloomFoundText: "This password is in the RockYou dataset (14M+ most breached passwords). Any attacker will crack it instantly.",
      bloomNotFound: "Not found in RockYou dataset.",
      bloomLoading: "Loading RockYou filter (~17 MB)…",
      bloomError: "Could not load RockYou filter.",
    },
    de: {
      skip: "Zum Inhalt springen",
      subtitle:
        "Was wäre, wenn ein Hacker Ihr Passwort angreifen würde? Geben Sie es ein, um zu sehen, wie lange es standhalten würde. Alles wird auf Ihrem Gerät berechnet\u00a0— nichts verlässt Ihren Browser.",
      inputLabel: "Geben Sie ein Passwort zum Testen ein",
      placeholder: "Ihr Passwort…",
      show: "Anzeigen",
      hide: "Verbergen",
      showAria: "Passwort anzeigen",
      hideAria: "Passwort verbergen",
      reset: "Zurücksetzen",
      resetAria: "Zurücksetzen",
      languageAria: "Sprache",
      strengthAria: "Passwortstärke",
      tooltipBenchmarkAria: "Informationen zum Hardware-Benchmark",
      dictLoading: "Wörterbuch wird geladen...",
      hibpTitle: "Dieses Passwort wurde durchgesickert!",
      hibpText:
        'Dieses Passwort erscheint <strong id="hibp-count">—</strong> Mal in Datenverletzungen, die von <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noopener">Have I Been Pwned</a> indiziert wurden. Es wird dringend empfohlen, es nicht zu verwenden.',
      hibpPrivacy:
        'Verifiziert über <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">k-Anonymität</a>: Nur die ersten 5 Zeichen des SHA-1-Hash werden gesendet.',
      hibpSafe:
        "Dieses Passwort erscheint in keiner bekannten Verletzung von Have I Been Pwned.",
      hibpError:
        "Konnte nicht mit Have I Been Pwned überprüfen (Netzwerkproblem).",
      hibpLoading: "Überprüfung gegen bekannte Datenpannen...",
      weak: "Schwach",
      strong: "Stark",
      chars: "Zeichen",
      charsetSize: "Zeichensatzgröße",
      entropyBits: "Entropiebits",
      combos: "Kombinationen",
      heatmapUnpredictable: "Unvorhersehbar",
      heatmapModerate: "Moderat",
      heatmapPredictable: "Vorhersehbar",
      heatmapExplanation: "<strong>Unvorhersehbar</strong>: Zeichen, die keine häufigen Muster befolgen (Zufälligkeit, ungewöhnliche Kombinationen).<br><strong>Moderat</strong>: Zeichen mit gemischter Vorhersehbarkeit (einige Muster, aber nicht vollständig häufig).<br><strong>Vorhersehbar</strong>: Zeichen, die häufige Muster befolgen (Tastatursequenzen, wiederholte Zeichen, häufige Positionen).",
      status: "Status",
      statusShort: "Zu kurz",
      statusGood: "Gute Länge",
      statusExcellent: "Ausgezeichnet",
      tableCaption: "Risszeit nach Angriffstyp und Hash-Algorithmus",
      advancedDetails: "Erweiterte Details",
      timeToCrackTitle: "Knackzeit:",
      methodLink: "Wie funktioniert dieser Angriff?",
      thAttack: "Angriffstyp",
      thAlgo: "Algorithmus",
      thSpeed: "Geschwindigkeit (12 GPU)",
      thTime: "Geschätzte Zeit",
      tooltipBenchmarkTitle: "Hardware-Referenz",
      tooltipBenchmarkText: "Alle Schätzungen verwenden <strong>12× NVIDIA RTX 4090 GPUs</strong> (~2027 GH/s MD5, ~3462 GH/s NTLM), was einen erfahrenen Angreifer darstellt.",
      tooltipAmateur: "Amateur (1 GPU)",
      tooltipAmateurSpeed: "12× langsamer",
      tooltipPro: "Professionell",
      tooltipProSpeed: "~8× schneller",
      tooltipNation: "Nationalstaat",
      tooltipNationSpeed: "~800× schneller",
      tooltipFootnote: "Selbst gegen Nationalstaaten bleiben bcrypt/Argon2id sicher.",
      dominantAttack: "Schnellster Angriff",
      profileExperienced: "Erfahren (12 GPU)",
      ctNotApplicable: "N/A",
      methTitle: "Methodik und Quellen",
      methContent: "",
      footer:
        'Kein Passwort wird gespeichert. Einzige Netzwerkanfrage: Die ersten 5 Zeichen des SHA-1-Hash werden an die API <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">Have I Been Pwned</a> (k-Anonymität) gesendet.',
      veryWeak: "Sehr schwach",
      _weak: "Schwach",
      moderate: "Moderat",
      _strong: "Stark",
      veryStrong: "Sehr stark",
      exceptional: "Außergewöhnlich",
      now: "Jetzt",
      instant: "⚡ Sofort",
      lessSec: "< 1 Sekunde",
      beyondDate: "Jenseits jedes berechenbaren Datums",
      beyondUniverse: "Länger als das Alter des Universums",
      na: "✓ Nicht zutreffend",
      via: "Über",
      allAttacks: "Alle Angriffe",
      unreachable:
        "<strong>Unerreichbar</strong>, selbst mit dem schnellsten Angriff.",
      unreachableFastest:
        "<strong>Unerreichbar</strong>, selbst mit {attack}.",
      instantVia: "Sofort <strong>geknackt</strong>",
      evenSlowest: "Auch der langsamste Angriff ist <strong>sofort</strong>.",
      resistsBeyond:
        "Widersetzt sich <strong>über das Alter des Universums hinaus</strong>.",
      bruteForce: "Brute Force",
      bruteSectionLabel: "Detail: Brute Force nach Hash-Algorithmus",
      vCommon: "Häufiges Passwort",
      vKeyboard: "Tastatormuster",
      vShort: "Zu kurz (< 8)",
      vSequence: "Sequenz erkannt",
      vRepeat: "Wiederholung",
      vDate: "Datum erkannt",
      v1Type: "Nur ein Zeichentyp",
      vMLHuman: "Menschliches Muster erkannt",
      vDiversity: "Gute Vielfalt",
      vGoodLen: "Gute Länge",
      vGreatLen: "Ausgezeichnete Länge",
      aBrute: "🔨 Brute Force",
      aDict: "📖 Wörterbuch",
      aHybrid: "🔀 Hybrid (dict+Regeln)",
      aMask: "🎭 Maske (Muster)",
      aRainbow: "🌈 Regenbogentabelle",
      aSpray: "🌬️ Password Spraying",
      aMarkov: "🧠 Markov (probabilistisch)",
      aPCFG: "🏗️ PCFG (Grammatik)",
      aCombi: "➕ Kombinator (2 Wörter)",
      nAllCombos: "Alle Kombinationen",
      nInLeaks: "In bekannten Lecks gefunden!",
      nDictHit: "Wörterbuchwort → in Sekunden geknackt",
      nAbsentLeaks: "Nicht in bekannten Listen → ineffektiver Angriff",
      nDictMut: "Dict+Mutationsmuster erkannt",
      nStructUnrecog: "Nicht erkannte Struktur → ineffektiv",
      nStructCaps: "Struktur Großbuchstaben+Kleinbuchstaben+Ziffern erkannt",
      nKBDetected: "Tastatormuster erkannt",
      nSeqDetected: "Sequenz erkannt",
      nNoPattern: "Kein vorhersehbares Muster → ineffektiv",
      nSalted: "Salted Hash → Tabellen unpraktisch (jeder Salt = eigene Tabelle)",
      nNoRainbow: "Keine öffentlichen Rainbow-Tabellen für diesen Algorithmus",
      nTooLong: "Zu lang/komplex für Tabellen",
      nTablesAvail: "Vorgenerierte Tabellen verfügbar",
      nTablesBig: "Tabellen möglich aber groß",
      nTop20: "Top 20 weltweit → Zielpriorität!",
      nNotTop: "Nicht häufig",
      nHuman95: "Menschliche Muster → Raum um 95% reduziert",
      nStatPrio: "Statistische Sequenzpriorisierung",
      nPCFGDetected: "Grammatikalische Struktur erkannt → zielgerichtet",
      nPCFGNone: "Nicht grammatikalisch → weniger effektiv",
      nPassphrase: "Passphrase erkannt → 2 Wörterbücher",
      nNotPassphrase: "Keine Passphrase → ineffektiv",
      yr: "Jahr",
      yrs: "Jahre",
      mo: "Monate",
      day: "Tag",
      days: "Tage",
      thousand: "Tausend",
      million: "Million",
      billion: "Milliarde",
      trillion: "Billion",
      quadrillion: "Billiarde",
      appDescription:
        "Time2Crack berechnet lokal, wie lange es dauern würde, Ihr Passwort zu knacken, ohne Ihr Passwort jemals zu übertragen.",
      inputPlaceholder: "Geben Sie ein Passwort ein zum Testen",
      testBtn: "Ein Passwort testen",
      generateBtn: "Ein Passwort generieren",
      genMemorized: "Gespeichert",
      genType: "Typ",
      genTypeRandom: "🔀 Zufällig",
      genTypePassphrase: "💬 Passphrase",
      genTypeWord: "✏️ Wortbasiert",
      genLength: "Länge",
      genCharset: "Zeichen",
      genBaseWord: "Basiswort",
      genBaseWordPlaceholder: "z.B. Sonne, Berg...",
      genWordHint: "Ziffern und Symbole werden automatisch hinzugefügt.",
      genPreview: "Live-Vorschau",
      genPreviewPlaceholder: "Wählen Sie einen Typ und passen Sie die Optionen an",
      genUseBtn: "Dieses Passwort verwenden",
      copyBtn: "Kopieren",
      copyBtnAria: "Passwort kopieren",
      copied: "Kopiert!",
      badgeExperienced: "Pirat erfahren: 12× RTX 4090 (2025)",
      badgeProfessional: "Pirat professionell: 100 GPU Cloud",
      tabExperienced: "Erfahren",
      tabExperiencedGpus: "12× RTX 4090 GPUs",
      tabProfessional: "Professionell",
      tabProfessionalGpus: "~100 GPUs",
      patternStrong: "Stark",
      scoreLevelVeryWeak: "🔴 Sehr schwach",
      scoreLevelWeak: "🟠 Schwach",
      scoreLevelMedium: "🟡 Mittel",
      scoreLevelGood: "🟢 Gut",
      scoreLevelExcellent: "🟢 Ausgezeichnet",
      scoreLevelExceptional: "🔵 Außergewöhnlich",
      qualityMsg: "Dieses Passwort ist {0}",
      entropyLabel: "Entropy",
      entropyDesc: "Length + Variety + Unpredictability",
      patternMsg: "Analyse: {0}",
      hibpStatusMsg: "Have I Been Pwned: {0}",
      hibpLoading: "⏳ Wird überprüft...",
      hibpLeaked: "⚠ Geleakt",
      hibpSafe: "✓ Nicht geleakt",
      hibpError: "? Überprüfung fehlgeschlagen",
      bloomCheckBtn: "Check against RockYou (14M passwords)",
      bloomCheckNote: "~17 MB · one-time · stays local",
      bloomFoundTitle: "Found in RockYou!",
      bloomFoundText: "This password is in the RockYou dataset (14M+ most breached passwords). Any attacker will crack it instantly.",
      bloomNotFound: "Not found in RockYou dataset.",
      bloomLoading: "Loading RockYou filter (~17 MB)…",
      bloomError: "Could not load RockYou filter.",
    },
    tr: {
      skip: "Ana içeriğe atla",
      subtitle:
        "Ya bir hacker şifrenizi hedef alsaydı? Ne kadar dayanacağını görmek için yazın. Her şey cihazınızda hesaplanır\u00a0— hiçbir şey tarayıcınızdan çıkmaz.",
      inputLabel: "Test etmek için bir şifre girin",
      placeholder: "Şifreniz…",
      show: "Göster",
      hide: "Gizle",
      showAria: "Şifre göster",
      hideAria: "Şifre gizle",
      reset: "Sıfırla",
      resetAria: "Sıfırla",
      languageAria: "Dil",
      strengthAria: "Şifre gücü",
      tooltipBenchmarkAria: "Donanım kıyaslama bilgisi",
      dictLoading: "Sözlük yükleniyor...",
      hibpTitle: "Bu şifre sızdırılmıştır!",
      hibpText:
        'Bu şifre <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noopener">Have I Been Pwned</a> tarafından indekslenen veri ihlallerinde <strong id="hibp-count">—</strong> kez görülüyor. Kullanılmaması kesinlikle önerilir.',
      hibpPrivacy:
        '<a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">k-anonimlik</a> aracılığıyla doğrulandı: yalnızca SHA-1 karmasının ilk 5 karakteri gönderilir.',
      hibpSafe:
        "Bu şifre Have I Been Pwned'in hiçbir bilinen ihlaline ait değildir.",
      hibpError: "Have I Been Pwned ile doğrulanamadı (ağ sorunu).",
      hibpLoading: "Bilinen ihlallere karşı kontrol ediliyor...",
      weak: "Zayıf",
      strong: "Güçlü",
      chars: "Karakterler",
      charsetSize: "Karakter seti boyutu",
      entropyBits: "Entropi bitleri",
      combos: "Kombinasyonlar",
      heatmapUnpredictable: "Öngörülemez",
      heatmapModerate: "Orta",
      heatmapPredictable: "Öngörülebilir",
      heatmapExplanation: "<strong>Öngörülemez</strong>: Yaygın desenleri takip etmeyen karakterler (rastgelelik, olağandışı kombinasyonlar).<br><strong>Orta</strong>: Karışık öngörülebilirliğe sahip karakterler (bazı desenler, ancak tamamen yaygın değil).<br><strong>Öngörülebilir</strong>: Yaygın desenleri takip eden karakterler (klavye dizileri, tekrarlanan karakterler, yaygın pozisyonlar).",
      status: "Durum",
      statusShort: "Çok kısa",
      statusGood: "İyi uzunluk",
      statusExcellent: "Mükemmel",
      tableCaption: "Saldırı türü ve karma algoritmasına göre kırma süresi",
      advancedDetails: "Gelişmiş ayrıntılar",
      timeToCrackTitle: "Kırılma süresi:",
      methodLink: "Bu saldırı nasıl çalışır?",
      thAttack: "Saldırı türü",
      thAlgo: "Algoritma",
      thSpeed: "Hız (12 GPU)",
      thTime: "Tahmini zaman",
      tooltipBenchmarkTitle: "Donanım referansı",
      tooltipBenchmarkText: "Tüm tahminler <strong>12× NVIDIA RTX 4090 GPU</strong> (~2027 GH/s MD5, ~3462 GH/s NTLM) kullanır, deneyimli bir saldırganı temsil eder.",
      tooltipAmateur: "Amatör (1 GPU)",
      tooltipAmateurSpeed: "12× daha yavaş",
      tooltipPro: "Profesyonel",
      tooltipProSpeed: "~8× daha hızlı",
      tooltipNation: "Ulus-devlet",
      tooltipNationSpeed: "~800× daha hızlı",
      tooltipFootnote: "Ulus-devletlere karşı bile bcrypt/Argon2id güvenli kalır.",
      dominantAttack: "En hızlı saldırı",
      profileExperienced: "Deneyimli (12 GPU)",
      ctNotApplicable: "N/A",
      methTitle: "Metodoloji ve kaynaklar",
      methContent: "",
      footer:
        'Şifre saklanmaz. Tek ağ isteği: SHA-1 karmasının ilk 5 karakteri <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">Have I Been Pwned</a> API\'ye (k-anonimlik) gönderilir.',
      veryWeak: "Çok zayıf",
      _weak: "Zayıf",
      moderate: "Orta",
      _strong: "Güçlü",
      veryStrong: "Çok güçlü",
      exceptional: "İstisnai",
      now: "Şimdi",
      instant: "⚡ Anında",
      lessSec: "< 1 saniye",
      beyondDate: "Herhangi bir hesaplanabilir tarih dışında",
      beyondUniverse: "Evrenin yaşından daha fazla",
      na: "✓ Uygulanmaz",
      via: "Aracılığıyla",
      allAttacks: "Tüm saldırılar",
      unreachable: "<strong>Erişilemez</strong>, en hızlı saldırı ile bile.",
      unreachableFastest: "<strong>Erişilemez</strong>, {attack} ile bile.",
      instantVia: "<strong>Anında</strong> kırıldı",
      evenSlowest: "En yavaş saldırı bile <strong>anında</strong>.",
      resistsBeyond: "Evrenin yaşından <strong>ötesine direnir</strong>.",
      bruteForce: "Brute Force",
      bruteSectionLabel: "Detay: Karma algoritmasına göre brute force",
      vCommon: "Yaygın şifre",
      vKeyboard: "Klavye deseni",
      vShort: "Çok kısa (< 8)",
      vSequence: "Dizi algılandı",
      vRepeat: "Tekrar",
      vDate: "Tarih algılandı",
      v1Type: "Tek karakter türü",
      vMLHuman: "İnsan benzeri desen tespit edildi",
      vDiversity: "İyi çeşitlilik",
      vGoodLen: "İyi uzunluk",
      vGreatLen: "Mükemmel uzunluk",
      aBrute: "🔨 Brute Force",
      aDict: "📖 Sözlük",
      aHybrid: "🔀 Hibrit (dict+kurallar)",
      aMask: "🎭 Maske (desenler)",
      aRainbow: "🌈 Gökkuşağı tablosu",
      aSpray: "🌬️ Şifre Sprayı",
      aMarkov: "🧠 Markov (olasılıksal)",
      aPCFG: "🏗️ PCFG (dilbilim)",
      aCombi: "➕ Kombinator (2 kelime)",
      nAllCombos: "Tüm kombinasyonlar",
      nInLeaks: "Bilinen sızıntılarda bulundu!",
      nDictHit: "Sözlük kelimesi → saniyeler içinde kırıldı",
      nAbsentLeaks: "Bilinen listelerde yok → etkisiz saldırı",
      nDictMut: "Dict+mutasyon deseni algılandı",
      nStructUnrecog: "Tanınmayan yapı → etkisiz",
      nStructCaps: "Büyük harf+küçük harf+rakam yapısı algılandı",
      nKBDetected: "Klavye deseni algılandı",
      nSeqDetected: "Dizi algılandı",
      nNoPattern: "Öngörülebilir desen yok → etkisiz",
      nSalted: "Tuzlanmış karma → tablolar pratik değil (her tuz = benzersiz tablo)",
      nNoRainbow: "Bu algoritma için herkese açık gökkuşağı tablosu yok",
      nTooLong: "Tablolar için çok uzun/karmaşık",
      nTablesAvail: "Önceden hesaplanmış tablolar mevcut",
      nTablesBig: "Tablolar mümkün ama büyük",
      nTop20: "Dünya top 20 → hedef önceliği!",
      nNotTop: "Yaygın değil",
      nHuman95: "İnsan desenleri → alan %95 azaldı",
      nStatPrio: "İstatistiksel dizi önceliklendirmesi",
      nPCFGDetected: "Dilbilimsel yapı algılandı → hedefli",
      nPCFGNone: "Dilbilimsel olmayan → daha az etkili",
      nPassphrase: "İfade algılandı → 2 sözlük",
      nNotPassphrase: "İfade değil → etkisiz",
      yr: "yıl",
      yrs: "yıl",
      mo: "ay",
      day: "gün",
      days: "gün",
      thousand: "bin",
      million: "milyon",
      billion: "milyar",
      trillion: "trilyon",
      quadrillion: "katrilyon",
      appDescription:
        "Time2Crack, şifrenizin kırılmasının ne kadar süreceğini yerel olarak hesaplar ve şifrenizi asla iletmez.",
      inputPlaceholder: "Test etmek için bir şifre girin",
      testBtn: "Bir şifre test et",
      generateBtn: "Bir şifre oluştur",
      genMemorized: "Kaydedildi",
      genType: "Tür",
      genTypeRandom: "🔀 Rastgele",
      genTypePassphrase: "💬 Parola cümlesi",
      genTypeWord: "✏️ Kelime tabanlı",
      genLength: "Uzunluk",
      genCharset: "Karakterler",
      genBaseWord: "Temel kelime",
      genBaseWordPlaceholder: "ör. güneş, dağ...",
      genWordHint: "Rakamlar ve semboller otomatik olarak eklenecektir.",
      genPreview: "Canlı önizleme",
      genPreviewPlaceholder: "Bir tür seçin ve seçenekleri ayarlayın",
      genUseBtn: "Bu şifreyi kullan",
      copyBtn: "Kopyala",
      copyBtnAria: "Şifreyi kopyala",
      copied: "Kopyalandı!",
      badgeExperienced: "Bilgisayar deneyimli: 12× RTX 4090 (2025)",
      badgeProfessional: "Bilgisayar profesyonel: 100 GPU Cloud",
      tabExperienced: "Deneyimli",
      tabExperiencedGpus: "12× RTX 4090 GPUs",
      tabProfessional: "Profesyonel",
      tabProfessionalGpus: "~100 GPUs",
      patternStrong: "Güçlü",
      scoreLevelVeryWeak: "🔴 Çok zayıf",
      scoreLevelWeak: "🟠 Zayıf",
      scoreLevelMedium: "🟡 Orta",
      scoreLevelGood: "🟢 İyi",
      scoreLevelExcellent: "🟢 Mükemmel",
      scoreLevelExceptional: "🔵 Olağanüstü",
      qualityMsg: "Bu şifre {0}",
      entropyLabel: "Entropy",
      entropyDesc: "Length + Variety + Unpredictability",
      patternMsg: "Analiz: {0}",
      hibpStatusMsg: "Have I Been Pwned: {0}",
      hibpLoading: "⏳ Kontrol ediliyor...",
      hibpLeaked: "⚠ Sızdırıldı",
      hibpSafe: "✓ Sızdırılmadı",
      hibpError: "? Kontrol başarısız",
      bloomCheckBtn: "Check against RockYou (14M passwords)",
      bloomCheckNote: "~17 MB · one-time · stays local",
      bloomFoundTitle: "Found in RockYou!",
      bloomFoundText: "This password is in the RockYou dataset (14M+ most breached passwords). Any attacker will crack it instantly.",
      bloomNotFound: "Not found in RockYou dataset.",
      bloomLoading: "Loading RockYou filter (~17 MB)…",
      bloomError: "Could not load RockYou filter.",
    },
    it: {
      skip: "Vai al contenuto principale",
      subtitle:
        "E se un hacker prendesse di mira la tua password? Digitala per vedere quanto resisterebbe. Tutto viene calcolato sul tuo dispositivo\u00a0— nulla esce dal tuo browser.",
      inputLabel: "Inserisci una password da testare",
      placeholder: "La tua password…",
      show: "Mostra",
      hide: "Nascondi",
      showAria: "Mostra password",
      hideAria: "Nascondi password",
      reset: "Ripristina",
      resetAria: "Ripristina",
      languageAria: "Lingua",
      strengthAria: "Robustezza della password",
      tooltipBenchmarkAria: "Informazioni sul benchmark hardware",
      dictLoading: "Caricamento dizionario...",
      hibpTitle: "Questa password è stata divulgata!",
      hibpText:
        'Questa password appare <strong id="hibp-count">—</strong> volte in violazioni di dati indicizzate da <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noopener">Have I Been Pwned</a>. Si consiglia vivamente di non utilizzarla.',
      hibpPrivacy:
        'Verificato tramite <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">k-anonimato</a>: solo i primi 5 caratteri dell\'hash SHA-1 vengono inviati.',
      hibpSafe:
        "Questa password non appare in alcuna violazione nota di Have I Been Pwned.",
      hibpError:
        "Impossibile verificare con Have I Been Pwned (problema di rete).",
      hibpLoading: "Verifica contro violazioni note...",
      weak: "Debole",
      strong: "Forte",
      chars: "Caratteri",
      charsetSize: "Dimensione set",
      entropyBits: "Bit di entropia",
      combos: "Combinazioni",
      heatmapUnpredictable: "Imprevedibile",
      heatmapModerate: "Moderato",
      heatmapPredictable: "Prevedibile",
      heatmapExplanation: "<strong>Imprevedibile</strong>: Caratteri che non seguono schemi comuni (casualità, combinazioni inusuali).<br><strong>Moderato</strong>: Caratteri con prevedibilità mista (alcuni schemi, ma non totalmente comuni).<br><strong>Prevedibile</strong>: Caratteri che seguono schemi comuni (sequenze da tastiera, caratteri ripetuti, posizioni comuni).",
      status: "Stato",
      statusShort: "Troppo corta",
      statusGood: "Buona lunghezza",
      statusExcellent: "Eccellente",
      tableCaption: "Tempo di crack per tipo di attacco e algoritmo di hash",
      advancedDetails: "Dettagli avanzati",
      timeToCrackTitle: "Tempo di crack:",
      methodLink: "Come funziona questo attacco?",
      thAttack: "Tipo di attacco",
      thAlgo: "Algoritmo",
      thSpeed: "Velocità (12 GPU)",
      thTime: "Tempo stimato",
      tooltipBenchmarkTitle: "Riferimento hardware",
      tooltipBenchmarkText: "Tutte le stime utilizzano <strong>12× NVIDIA RTX 4090 GPU</strong> (~2027 GH/s MD5, ~3462 GH/s NTLM), rappresentando un attaccante esperto.",
      tooltipAmateur: "Dilettante (1 GPU)",
      tooltipAmateurSpeed: "12× più lento",
      tooltipPro: "Professionale",
      tooltipProSpeed: "~8× più veloce",
      tooltipNation: "Stato-nazione",
      tooltipNationSpeed: "~800× più veloce",
      tooltipFootnote: "Anche contro stati-nazione, bcrypt/Argon2id rimangono sicuri.",
      dominantAttack: "Attacco dominante",
      profileExperienced: "Esperto (12 GPU)",
      ctNotApplicable: "N/A",
      methTitle: "Metodologia e fonti",
      methContent: "",
      footer:
        'Nessuna password viene archiviata. Unica richiesta di rete: i primi 5 caratteri dell\'hash SHA-1 vengono inviati all\'API <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">Have I Been Pwned</a> (k-anonimato).',
      veryWeak: "Molto debole",
      _weak: "Debole",
      moderate: "Moderata",
      _strong: "Forte",
      veryStrong: "Molto forte",
      exceptional: "Eccezionale",
      now: "Adesso",
      instant: "⚡ Istantaneo",
      lessSec: "< 1 secondo",
      beyondDate: "Al di là di qualsiasi data calcolabile",
      beyondUniverse: "Più dell'età dell'universo",
      na: "✓ Non applicabile",
      via: "Via",
      allAttacks: "Tutti gli attacchi",
      unreachable:
        "<strong>Irraggiungibile</strong>, anche con l'attacco più veloce.",
      unreachableFastest:
        "<strong>Irraggiungibile</strong>, anche con {attack}.",
      instantVia: "Craccato <strong>istantaneamente</strong>",
      evenSlowest: "Anche l'attacco più lento è <strong>istantaneo</strong>.",
      resistsBeyond: "Resiste <strong>oltre l'età dell'universo</strong>.",
      bruteForce: "Brute force",
      bruteSectionLabel: "Dettaglio: brute force per algoritmo di hash",
      vCommon: "Password comune",
      vKeyboard: "Motivo tastiera",
      vShort: "Troppo corta (< 8)",
      vSequence: "Sequenza rilevata",
      vRepeat: "Ripetizione",
      vDate: "Data rilevata",
      v1Type: "Un solo tipo di carattere",
      vMLHuman: "Pattern umano rilevato",
      vDiversity: "Buona diversità",
      vGoodLen: "Buona lunghezza",
      vGreatLen: "Lunghezza eccellente",
      aBrute: "🔨 Brute force",
      aDict: "📖 Dizionario",
      aHybrid: "🔀 Ibrido (dict+regole)",
      aMask: "🎭 Maschera (motivi)",
      aRainbow: "🌈 Tavola arcobaleno",
      aSpray: "🌬️ Password spraying",
      aMarkov: "🧠 Markov (probabilistico)",
      aPCFG: "🏗️ PCFG (grammatica)",
      aCombi: "➕ Combinatore (2 parole)",
      nAllCombos: "Tutte le combinazioni",
      nInLeaks: "Trovato in violazioni note!",
      nDictHit: "Parola del dizionario → violata in secondi",
      nAbsentLeaks: "Non in liste note → attacco inefficace",
      nDictMut: "Motivo dict+mutazioni rilevato",
      nStructUnrecog: "Struttura non riconosciuta → inefficace",
      nStructCaps: "Struttura Maius+minus+cifre rilevata",
      nKBDetected: "Motivo tastiera rilevato",
      nSeqDetected: "Sequenza rilevata",
      nNoPattern: "Nessun motivo prevedibile → inefficace",
      nSalted: "Hash salato → tabelle impraticabili (ogni salt = tabella univoca)",
      nNoRainbow: "Nessuna tabella arcobaleno pubblica per questo algoritmo",
      nTooLong: "Troppo lungo/complesso per le tabelle",
      nTablesAvail: "Tabelle precalcolate disponibili",
      nTablesBig: "Tabelle possibili ma grandi",
      nTop20: "Top 20 mondiale → bersaglio prioritario!",
      nNotTop: "Non comune",
      nHuman95: "Motivi umani → spazio ridotto ~95%",
      nStatPrio: "Prioritizzazione sequenza statistica",
      nPCFGDetected: "Struttura grammaticale rilevata → mirata",
      nPCFGNone: "Non grammaticale → meno efficace",
      nPassphrase: "Passphrase rilevata → 2 dizionari",
      nNotPassphrase: "Non una passphrase → inefficace",
      yr: "anno",
      yrs: "anni",
      mo: "mesi",
      day: "giorno",
      days: "giorni",
      thousand: "migliaia",
      million: "milioni",
      billion: "miliardo",
      trillion: "bilione",
      quadrillion: "biliardo",
      appDescription:
        "Time2Crack calcola localmente quanto tempo servirebbe per violare la tua password, senza trasmettere mai la tua password.",
      inputPlaceholder: "Inserisci una password da testare",
      testBtn: "Testa una password",
      generateBtn: "Genera una password",
      genMemorized: "Memorizzato",
      genType: "Tipo",
      genTypeRandom: "🔀 Casuale",
      genTypePassphrase: "💬 Passphrase",
      genTypeWord: "✏️ Basato su parola",
      genLength: "Lunghezza",
      genCharset: "Caratteri",
      genBaseWord: "Parola base",
      genBaseWordPlaceholder: "es. sole, montagna...",
      genWordHint: "Cifre e simboli verranno aggiunti automaticamente.",
      genPreview: "Anteprima live",
      genPreviewPlaceholder: "Scegli un tipo e regola le opzioni",
      genUseBtn: "Usa questa password",
      copyBtn: "Copia",
      copyBtnAria: "Copia password",
      copied: "Copiato!",
      badgeExperienced: "Pirata esperto: 12× RTX 4090 (2025)",
      badgeProfessional: "Pirata professionale: 100 GPU Cloud",
      tabExperienced: "Esperto",
      tabExperiencedGpus: "12× RTX 4090 GPUs",
      tabProfessional: "Professionale",
      tabProfessionalGpus: "~100 GPUs",
      patternStrong: "Forte",
      scoreLevelVeryWeak: "🔴 Molto debole",
      scoreLevelWeak: "🟠 Debole",
      scoreLevelMedium: "🟡 Medio",
      scoreLevelGood: "🟢 Buono",
      scoreLevelExcellent: "🟢 Eccellente",
      scoreLevelExceptional: "🔵 Eccezionale",
      qualityMsg: "Questa password è {0}",
      entropyLabel: "Entropy",
      entropyDesc: "Length + Variety + Unpredictability",
      patternMsg: "Analisi: {0}",
      hibpStatusMsg: "Have I Been Pwned: {0}",
      hibpLoading: "⏳ Verifica in corso...",
      hibpLeaked: "⚠ Trapelato",
      hibpSafe: "✓ Non trapelato",
      hibpError: "? Verifica fallita",
      bloomCheckBtn: "Check against RockYou (14M passwords)",
      bloomCheckNote: "~17 MB · one-time · stays local",
      bloomFoundTitle: "Found in RockYou!",
      bloomFoundText: "This password is in the RockYou dataset (14M+ most breached passwords). Any attacker will crack it instantly.",
      bloomNotFound: "Not found in RockYou dataset.",
      bloomLoading: "Loading RockYou filter (~17 MB)…",
      bloomError: "Could not load RockYou filter.",
      dominantAttack: "Attacco dominante",
      profileExperienced: "Esperto (12 GPU)",
      ctNotApplicable: "N/A",
    },
    pl: {
      skip: "Przejdź do treści",
      subtitle:
        "A gdyby haker zaatakował Twoje hasło? Wpisz je, aby sprawdzić, jak długo by wytrzymało. Wszystko jest obliczane na Twoim urządzeniu\u00a0— nic nie opuszcza przeglądarki.",
      inputLabel: "Wpisz hasło do przetestowania",
      placeholder: "Twoje hasło…",
      show: "Pokaż",
      hide: "Ukryj",
      showAria: "Pokaż hasło",
      hideAria: "Ukryj hasło",
      reset: "Resetuj",
      resetAria: "Resetuj",
      languageAria: "Język",
      strengthAria: "Siła hasła",
      tooltipBenchmarkAria: "Informacje o benchmarku sprzętowym",
      dictLoading: "Ładowanie słownika...",
      hibpTitle: "To hasło zostało ujawnione!",
      hibpText:
        'To hasło pojawia się <strong id="hibp-count">—</strong> razy w naruszeniach danych indeksowanych przez <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noopener">Have I Been Pwned</a>. Zdecydowanie zaleca się go nie używać.',
      hibpPrivacy:
        'Zweryfikowany za pośrednictwem <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">k-anonimowości</a>: przesyłane są tylko pierwsze 5 znaków skrótu SHA-1.',
      hibpSafe:
        "To hasło nie pojawia się w żadnym znanym naruszeniu Have I Been Pwned.",
      hibpError:
        "Nie można było zweryfikować w Have I Been Pwned (problem z siecią).",
      hibpLoading: "Sprawdzanie przed znanymi naruszeniami...",
      weak: "Słabe",
      strong: "Silne",
      chars: "Znaki",
      charsetSize: "Rozmiar zestawu",
      entropyBits: "Bity entropii",
      combos: "Kombinacje",
      heatmapUnpredictable: "Nieprzewidywalny",
      heatmapModerate: "Umiarkowany",
      heatmapPredictable: "Przewidywalny",
      heatmapExplanation: "<strong>Nieprzewidywalny</strong>: Znaki, które nie następują wspólne wzorce (losowość, niezwykłe kombinacje).<br><strong>Umiarkowany</strong>: Znaki z mieszaną przewidywalnością (niektóre wzorce, ale nie całkowicie wspólne).<br><strong>Przewidywalny</strong>: Znaki następujące wspólne wzorce (sekwencje klawiaturowe, powtórzone znaki, wspólne pozycje).",
      status: "Status",
      statusShort: "Za krótkie",
      statusGood: "Dobra długość",
      statusExcellent: "Doskonałe",
      tableCaption: "Czas łamania według typu ataku i algorytmu hashowania",
      advancedDetails: "Szczegóły zaawansowane",
      timeToCrackTitle: "Czas złamania:",
      methodLink: "Jak działa ten atak?",
      thAttack: "Typ ataku",
      thAlgo: "Algorytm",
      thSpeed: "Prędkość (12 GPU)",
      thTime: "Szacunkowy czas",
      methTitle: "Metodologia i źródła",
      methContent: "",
      footer:
        'Żadne hasło nie jest przechowywane. Jedyne żądanie sieciowe: pierwsze 5 znaków skrótu SHA-1 jest wysyłane do API <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">Have I Been Pwned</a> (k-anonimowość).',
      veryWeak: "Bardzo słabe",
      _weak: "Słabe",
      moderate: "Umiarkowane",
      _strong: "Silne",
      veryStrong: "Bardzo silne",
      exceptional: "Wyjątkowe",
      now: "Teraz",
      instant: "⚡ Natychmiast",
      lessSec: "< 1 sekunda",
      beyondDate: "Poza dowolną obliczalną datą",
      beyondUniverse: "Dłużej niż wiek wszechświata",
      na: "✓ Nie dotyczy",
      via: "Via",
      allAttacks: "Wszystkie ataki",
      unreachable:
        "<strong>Nieosiągalne</strong>, nawet przy najszybszym ataku.",
      unreachableFastest:
        "<strong>Nieosiągalne</strong>, nawet z {attack}.",
      instantVia: "Złamane <strong>natychmiast</strong>",
      evenSlowest:
        "Nawet najwolniejszy atak jest <strong>natychmiastowy</strong>.",
      resistsBeyond: "Opiera się <strong>poza wiekiem wszechświata</strong>.",
      bruteForce: "Brute force",
      bruteSectionLabel: "Szczegół: brute force według algorytmu hashowania",
      vCommon: "Popularne hasło",
      vKeyboard: "Wzór klawiatury",
      vShort: "Za krótkie (< 8)",
      vSequence: "Sekwencja wykryta",
      vRepeat: "Powtórzenie",
      vDate: "Data wykryta",
      v1Type: "Tylko jeden typ znaku",
      vMLHuman: "Wykryto ludzki wzorzec",
      vDiversity: "Dobra różnorodność",
      vGoodLen: "Dobra długość",
      vGreatLen: "Doskonała długość",
      aBrute: "🔨 Brute force",
      aDict: "📖 Słownik",
      aHybrid: "🔀 Hybrydowy (dict+reguły)",
      aMask: "🎭 Maska (wzory)",
      aRainbow: "🌈 Tablica tęczy",
      aSpray: "🌬️ Password spraying",
      aMarkov: "🧠 Markov (probabilistyczny)",
      aPCFG: "🏗️ PCFG (gramatyka)",
      aCombi: "➕ Kombinator (2 słowa)",
      nAllCombos: "Wszystkie kombinacje",
      nInLeaks: "Znalezione w znanych naruszeniach!",
      nDictHit: "Słowo ze słownika → złamane w sekundach",
      nAbsentLeaks: "Nie na znanych listach → atak nieskuteczny",
      nDictMut: "Wykryte dict+mutacje",
      nStructUnrecog: "Nierozpoznana struktura → nieskuteczna",
      nStructCaps: "Wykryta struktura Wielkie+małe+cyfry",
      nKBDetected: "Wzór klawiatury wykryty",
      nSeqDetected: "Sekwencja wykryta",
      nNoPattern: "Brak przewidywalnego wzoru → nieskuteczna",
      nSalted: "Haszowanie solone → tabele niepraktyczne (każdy salt = unikalna tabela)",
      nNoRainbow: "Brak publicznych tablic tęczowych dla tego algorytmu",
      nTooLong: "Za długie/skomplikowane dla tabel",
      nTablesAvail: "Dostępne wstępnie obliczone tabele",
      nTablesBig: "Tabele możliwe ale duże",
      nTop20: "Top 20 na świecie → cel priorytetowy!",
      nNotTop: "Nie popularne",
      nHuman95: "Wzory ludzkie → przestrzeń zmniejszona ~95%",
      nStatPrio: "Priorytet sekwencji statystycznej",
      nPCFGDetected: "Struktura gramatyczna wykryta → celowana",
      nPCFGNone: "Niegramatyczna → mniej efektywna",
      nPassphrase: "Fraza hasła wykryta → 2 słowniki",
      nNotPassphrase: "Nie fraza hasła → nieskuteczna",
      yr: "rok",
      yrs: "lata",
      mo: "miesiące",
      day: "dzień",
      days: "dni",
      thousand: "tysiąc",
      million: "milion",
      billion: "miliard",
      trillion: "bilion",
      quadrillion: "biliard",
      appDescription:
        "Time2Crack oblicza lokalnie, ile czasu zajęłoby złamanie Twojego hasła, nigdy nie przesyłając Twojego hasła.",
      inputPlaceholder: "Wpisz hasło do przetestowania",
      testBtn: "Testuj hasło",
      generateBtn: "Generuj hasło",
      genMemorized: "Zapamiętane",
      genType: "Typ",
      genTypeRandom: "🔀 Losowe",
      genTypePassphrase: "💬 Hasło zdaniowe",
      genTypeWord: "✏️ Oparte na słowie",
      genLength: "Długość",
      genCharset: "Znaki",
      genBaseWord: "Słowo bazowe",
      genBaseWordPlaceholder: "np. słońce, góra...",
      genWordHint: "Cyfry i symbole zostaną dodane automatycznie.",
      genPreview: "Podgląd na żywo",
      genPreviewPlaceholder: "Wybierz typ i dostosuj opcje",
      genUseBtn: "Użyj tego hasła",
      copyBtn: "Kopiuj",
      copyBtnAria: "Kopiuj hasło",
      copied: "Skopiowano!",
      badgeExperienced: "Pirat doświadczony: 12× RTX 4090 (2025)",
      badgeProfessional: "Pirat profesjonalny: 100 GPU Cloud",
      tabExperienced: "Doświadczony",
      tabExperiencedGpus: "12× RTX 4090 GPUs",
      tabProfessional: "Profesjonalny",
      tabProfessionalGpus: "~100 GPUs",
      patternStrong: "Silne",
      scoreLevelVeryWeak: "🔴 Bardzo słaby",
      scoreLevelWeak: "🟠 Słaby",
      scoreLevelMedium: "🟡 Średni",
      scoreLevelGood: "🟢 Dobry",
      scoreLevelExcellent: "🟢 Doskonały",
      scoreLevelExceptional: "🔵 Wyjątkowy",
      qualityMsg: "To hasło jest {0}",
      entropyLabel: "Entropy",
      entropyDesc: "Length + Variety + Unpredictability",
      patternMsg: "Analiza: {0}",
      hibpStatusMsg: "Have I Been Pwned: {0}",
      hibpLoading: "⏳ Sprawdzanie...",
      hibpLeaked: "⚠ Wycieknięte",
      hibpSafe: "✓ Nie wycieknięte",
      hibpError: "? Sprawdzenie nie powiodło się",
      bloomCheckBtn: "Check against RockYou (14M passwords)",
      bloomCheckNote: "~17 MB · one-time · stays local",
      bloomFoundTitle: "Found in RockYou!",
      bloomFoundText: "This password is in the RockYou dataset (14M+ most breached passwords). Any attacker will crack it instantly.",
      bloomNotFound: "Not found in RockYou dataset.",
      bloomLoading: "Loading RockYou filter (~17 MB)…",
      bloomError: "Could not load RockYou filter.",
      dominantAttack: "Najszybszy atak",
      profileExperienced: "Doświadczony (12 GPU)",
      ctNotApplicable: "N/D",
    },
    nl: {
      skip: "Ga naar hoofdinhoud",
      subtitle:
        "Wat als een hacker je wachtwoord zou aanvallen? Typ het in om te zien hoe lang het stand zou houden. Alles wordt berekend op je apparaat\u00a0— niets verlaat je browser.",
      inputLabel: "Voer een wachtwoord in om te testen",
      placeholder: "Jouw wachtwoord…",
      show: "Weergeven",
      hide: "Verbergen",
      showAria: "Wachtwoord weergeven",
      hideAria: "Wachtwoord verbergen",
      reset: "Herstellen",
      resetAria: "Herstellen",
      languageAria: "Taal",
      strengthAria: "Wachtwoordsterkte",
      tooltipBenchmarkAria: "Informatie over hardwarebenchmark",
      dictLoading: "Woordenboek laden...",
      hibpTitle: "Dit wachtwoord is gelekt!",
      hibpText:
        'Dit wachtwoord komt <strong id="hibp-count">—</strong> keer voor in gegevensinbreuken geïndexeerd door <a href="https://haveibeenpwned.com/Passwords" target="_blank" rel="noopener">Have I Been Pwned</a>. Het wordt sterk aanbevolen dit niet te gebruiken.',
      hibpPrivacy:
        'Geverifieerd via <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">k-anonimiteit</a>: alleen de eerste 5 tekens van de SHA-1 hash worden verzonden.',
      hibpSafe:
        "Dit wachtwoord komt niet voor in enige bekende inbreuk van Have I Been Pwned.",
      hibpError: "Kon niet verifiëren met Have I Been Pwned (netwerkprobleem).",
      hibpLoading: "Controleren tegen bekende inbreuken...",
      weak: "Zwak",
      strong: "Sterk",
      chars: "Tekens",
      charsetSize: "Tekensetgrootte",
      entropyBits: "Entropiebits",
      combos: "Combinaties",
      heatmapUnpredictable: "Onvoorspelbaar",
      heatmapModerate: "Matig",
      heatmapPredictable: "Voorspelbaar",
      heatmapExplanation: "<strong>Onvoorspelbaar</strong>: Tekens die geen gemeenschappelijke patronen volgen (willekeur, ongewone combinaties).<br><strong>Matig</strong>: Tekens met gemengde voorspelbaarheid (enkele patronen, maar niet volledig gebruikelijk).<br><strong>Voorspelbaar</strong>: Tekens die gemeenschappelijke patronen volgen (toetsenbordsecties, herhaalde tekens, gangbare posities).",
      status: "Status",
      statusShort: "Te kort",
      statusGood: "Goede lengte",
      statusExcellent: "Uitstekend",
      tableCaption: "Kraaktijd naar aangrifstype en hashalgoritme",
      advancedDetails: "Geavanceerde details",
      timeToCrackTitle: "Kraaktijd:",
      methodLink: "Hoe werkt deze aanval?",
      thAttack: "Aangrifstype",
      thAlgo: "Algoritme",
      thSpeed: "Snelheid (12 GPU)",
      thTime: "Geschatte tijd",
      methTitle: "Methodologie en bronnen",
      methContent: "",
      footer:
        'Geen wachtwoord wordt opgeslagen. Enig netwerkverzoek: de eerste 5 tekens van de SHA-1 hash worden verzonden naar de <a href="https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange" target="_blank" rel="noopener">Have I Been Pwned</a> API (k-anonimiteit).',
      veryWeak: "Erg zwak",
      _weak: "Zwak",
      moderate: "Matig",
      _strong: "Sterk",
      veryStrong: "Erg sterk",
      exceptional: "Uitzonderlijk",
      now: "Nu",
      instant: "⚡ Instant",
      lessSec: "< 1 seconde",
      beyondDate: "Voorbij elke berekenbare datum",
      beyondUniverse: "Langer dan het universum oud is",
      na: "✓ Niet van toepassing",
      via: "Via",
      allAttacks: "Alle aanvallen",
      unreachable:
        "<strong>Onbereikbaar</strong>, zelfs met de snelste aanval.",
      unreachableFastest:
        "<strong>Onbereikbaar</strong>, zelfs met {attack}.",
      instantVia: "<strong>Instant</strong> gekraakt",
      evenSlowest: "Zelfs de langzaamste aanval is <strong>instant</strong>.",
      resistsBeyond: "Bestand <strong>voorbij het universum</strong>.",
      bruteForce: "Brute force",
      bruteSectionLabel: "Detail: brute force per hashalgoritme",
      vCommon: "Veelgebruikt wachtwoord",
      vKeyboard: "Toetsenbordpatroon",
      vShort: "Te kort (< 8)",
      vSequence: "Reeks gedetecteerd",
      vRepeat: "Herhaling",
      vDate: "Datum gedetecteerd",
      v1Type: "Slechts één tekentype",
      vMLHuman: "Menselijk patroon gedetecteerd",
      vDiversity: "Goede diversiteit",
      vGoodLen: "Goede lengte",
      vGreatLen: "Uitstekende lengte",
      aBrute: "🔨 Brute force",
      aDict: "📖 Woordenboek",
      aHybrid: "🔀 Hybrid (dict+regels)",
      aMask: "🎭 Masker (patronen)",
      aRainbow: "🌈 Regenboogtabel",
      aSpray: "🌬️ Password spraying",
      aMarkov: "🧠 Markov (probabilistisch)",
      aPCFG: "🏗️ PCFG (grammatica)",
      aCombi: "➕ Combinator (2 woorden)",
      nAllCombos: "Alle combinaties",
      nInLeaks: "Gevonden in bekende inbreuken!",
      nDictHit: "Woordenboekwoord → in seconden gekraakt",
      nAbsentLeaks: "Niet op bekende lijsten → ineffectieve aanval",
      nDictMut: "Dict+mutatie patroon gedetecteerd",
      nStructUnrecog: "Onherkende structuur → ineffectief",
      nStructCaps: "Hoofdletter+kleine+cijfers structuur gedetecteerd",
      nKBDetected: "Toetsenbordpatroon gedetecteerd",
      nSeqDetected: "Reeks gedetecteerd",
      nNoPattern: "Geen voorspelbaar patroon → ineffectief",
      nSalted: "Gezoute hash → tabellen onpraktisch (elke salt = unieke tabel)",
      nNoRainbow: "Geen openbare regenboogtabellen voor dit algoritme",
      nTooLong: "Te lang/complex voor tabellen",
      nTablesAvail: "Vooraf berekende tabellen beschikbaar",
      nTablesBig: "Tabellen mogelijk maar groot",
      nTop20: "Top 20 wereldwijd → prioriteitsdoel!",
      nNotTop: "Niet veelgebruikt",
      nHuman95: "Menselijke patronen → ruimte verkleind ~95%",
      nStatPrio: "Statistische reeksprioriteit",
      nPCFGDetected: "Grammaticale structuur gedetecteerd → gericht",
      nPCFGNone: "Niet-grammaticaal → minder effectief",
      nPassphrase: "Wachtzin gedetecteerd → 2 woordenboeken",
      nNotPassphrase: "Geen wachtzin → ineffectief",
      yr: "jaar",
      yrs: "jaren",
      mo: "maanden",
      day: "dag",
      days: "dagen",
      thousand: "duizend",
      million: "miljoen",
      billion: "miljard",
      trillion: "biljoen",
      quadrillion: "biljard",
      appDescription:
        "Time2Crack berekent lokaal hoe lang het zou duren om je wachtwoord te kraken, zonder je wachtwoord ooit te verzenden.",
      inputPlaceholder: "Voer een wachtwoord in om te testen",
      testBtn: "Test een wachtwoord",
      generateBtn: "Genereer een wachtwoord",
      genMemorized: "Onthouden",
      genType: "Type",
      genTypeRandom: "🔀 Willekeurig",
      genTypePassphrase: "💬 Wachtwoordzin",
      genTypeWord: "✏️ Woordgebaseerd",
      genLength: "Lengte",
      genCharset: "Tekens",
      genBaseWord: "Basiswoord",
      genBaseWordPlaceholder: "bijv. zon, berg...",
      genWordHint: "Cijfers en symbolen worden automatisch toegevoegd.",
      genPreview: "Live voorbeeld",
      genPreviewPlaceholder: "Kies een type en pas de opties aan",
      genUseBtn: "Dit wachtwoord gebruiken",
      copyBtn: "Kopiëren",
      copyBtnAria: "Kopieer wachtwoord",
      copied: "Gekopieerd!",
      badgeExperienced: "Piraat ervaren: 12× RTX 4090 (2025)",
      badgeProfessional: "Piraat professioneel: 100 GPU Cloud",
      tabExperienced: "Ervaren",
      tabExperiencedGpus: "12× RTX 4090 GPUs",
      tabProfessional: "Professioneel",
      tabProfessionalGpus: "~100 GPUs",
      patternStrong: "Sterk",
      scoreLevelVeryWeak: "🔴 Erg zwak",
      scoreLevelWeak: "🟠 Zwak",
      scoreLevelMedium: "🟡 Gemiddeld",
      scoreLevelGood: "🟢 Goed",
      scoreLevelExcellent: "🟢 Uitstekend",
      scoreLevelExceptional: "🔵 Uitzonderlijk",
      qualityMsg: "Dit wachtwoord is {0}",
      entropyLabel: "Entropy",
      entropyDesc: "Length + Variety + Unpredictability",
      patternMsg: "Analyse: {0}",
      hibpStatusMsg: "Have I Been Pwned: {0}",
      hibpLoading: "⏳ Controleren...",
      hibpLeaked: "⚠ Gelekt",
      hibpSafe: "✓ Niet gelekt",
      hibpError: "? Controle mislukt",
      bloomCheckBtn: "Check against RockYou (14M passwords)",
      bloomCheckNote: "~17 MB · one-time · stays local",
      bloomFoundTitle: "Found in RockYou!",
      bloomFoundText: "This password is in the RockYou dataset (14M+ most breached passwords). Any attacker will crack it instantly.",
      bloomNotFound: "Not found in RockYou dataset.",
      bloomLoading: "Loading RockYou filter (~17 MB)…",
      bloomError: "Could not load RockYou filter.",
      dominantAttack: "Snelste aanval",
      profileExperienced: "Ervaren (12 GPU)",
      ctNotApplicable: "N.v.t.",
    },
  };

  function t(k) {
    return I[LANG][k] || I.en[k] || k;
  }

  function syncA11yLabels() {
    const langToggleBtn = safe("lang-toggle");
    if (langToggleBtn) langToggleBtn.setAttribute("aria-label", t("languageAria") || "Change language");

    if (isReal(barWrapper)) barWrapper.setAttribute("aria-label", t("strengthAria"));

    if (resetBtn) resetBtn.setAttribute("aria-label", t("resetAria"));

    if (toggleBtn && input) {
      const isVisible = input.type === "text";
      toggleBtn.setAttribute(
        "aria-label",
        isVisible ? t("hideAria") : t("showAria"),
      );
    }

    const tooltipBtn = document.querySelector(".info-tooltip-trigger");
    if (tooltipBtn) tooltipBtn.setAttribute("aria-label", t("tooltipBenchmarkAria"));
    
    // Update copy button aria-label
    if (copyBtn) copyBtn.setAttribute("aria-label", t("copyBtnAria"));
  }

  // ============================================================
  // MULTILINGUAL WORDLISTS
  // ============================================================
  const WORDLISTS_BASE_URL =
    window.TIME2CRACK_WORDLISTS_BASE_URL ||
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "data/wordlists/"
      : "https://time2crack.b-cdn.net/data/wordlists/");

  async function loadDictionary(lang) {
    if (DICT_LANG === lang && DICT_WORDS) return;
    if (DICT_LOADING) {
      DICT_PENDING_LANG = lang;
      return;
    }
    DICT_LOADING = true;
    DICT_PENDING_LANG = null;
    
    // Show loading indicator
    const dictLoadingEl = safe('dict-loading');
    if (dictLoadingEl) {
      dictLoadingEl.hidden = false;
    }
    
    try {
      const res = await fetch(`${WORDLISTS_BASE_URL}${lang}.txt`);
      if (!res.ok) throw new Error(res.status);
      const text = await res.text();
      
      // Clear old dictionary to prevent memory leak
      if (DICT_WORDS) {
        DICT_WORDS.clear();
      }
      
      DICT_WORDS = new Set(
        text.split("\n")
            .map(w => w.normalize("NFC").trim().toLowerCase())
            .filter(w => w.length >= 4)
      );
      DICT_LANG = lang;
    } catch {
      DICT_WORDS = null; // silently fail
    } finally {
      DICT_LOADING = false;
      
      // Hide loading indicator
      if (dictLoadingEl) {
        dictLoadingEl.hidden = true;
      }

      if (DICT_PENDING_LANG && DICT_PENDING_LANG !== DICT_LANG) {
        const nextLang = DICT_PENDING_LANG;
        DICT_PENDING_LANG = null;
        loadDictionary(nextLang);
      }
      
      if (input && input.value.length) render();
    }
  }

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
    
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n");
      if (I[lang][k]) el.textContent = I[lang][k];
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const k = el.getAttribute("data-i18n-html");
      if (I[lang][k]) el.innerHTML = I[lang][k];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const k = el.getAttribute("data-i18n-placeholder");
      if (I[lang][k]) el.placeholder = I[lang][k];
    });
    // Update toggle button text (preserve icon)
    const isVisible = input.type === "text";
    const textSpan = toggleBtn.querySelector("span");
    if (textSpan) textSpan.textContent = isVisible ? t("hide") : t("show");
    toggleBtn.setAttribute("aria-label", isVisible ? t("hideAria") : t("showAria"));
    // Update lang selector (globe button + menu)
    const langCodeSpan = safe("lang-code");
    if (langCodeSpan) {
      langCodeSpan.textContent = lang.toUpperCase();
    }
    // Update menu item aria-current
    document.querySelectorAll(".lang-option").forEach((b) => {
      const isCurrent = b.getAttribute("data-lang") === lang;
      if (isCurrent) {
        b.setAttribute("aria-current", "page");
      } else {
        b.removeAttribute("aria-current");
      }
    });
    syncA11yLabels();
    renderAttackTabs();
    updateAttackDescription();
    updateHighFidelityUI();
    // Load dictionary for the new language (async, non-blocking)
    loadDictionary(lang);
    // Re-render if there's content
    if (input.value.length) render();
  }

  // Lang selector: toggle dropdown menu
  const langToggle = safe("lang-toggle");
  const langMenu = safe("lang-menu");
  const langSelector = safe("lang-selector");
  
  if (langToggle && langMenu) {
    langToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = langMenu.hidden;
      if (isOpen) {
        langMenu.hidden = false;
        langToggle.setAttribute("aria-expanded", "true");
      } else {
        langMenu.hidden = true;
        langToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Lang menu option clicks
  document.querySelectorAll(".lang-option").forEach((b) => {
    b.addEventListener("click", () => {
      const newLang = b.getAttribute("data-lang");
      setLang(newLang);
      // Close menu after selection
      if (langMenu) {
        langMenu.hidden = true;
        langToggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (langMenu && langToggle && langSelector) {
      if (!langSelector.contains(e.target) && !langMenu.hidden) {
        langMenu.hidden = true;
        langToggle.setAttribute("aria-expanded", "false");
      }
    }
  });

  // Defer password analyzer initialization to DOMContentLoaded
  // This ensures DOM is ready and prevents crashes on pages without password input
  document.addEventListener("DOMContentLoaded", () => {
    const $ = (id) => safe(id);
    const input = $("pw-input");

    // If page doesn't have password input, don't initialize analyzer
    if (!input) return;

    // Check for critical elements required by the analyzer
    const resultsDiv = $("results");
    if (!resultsDiv) return; // Can't render results without results div

  // Only run password analysis code on pages that have the password input (index + generator)
  if (input) {
  const toggleBtn = $("toggle-visibility");
  const strengthIcon = $("strength-icon");
  const strengthLabel = $("strength-label");
  const strengthBits = $("strength-bits");
  const strengthInfoBtn = $("strength-info-btn");
  const strengthTooltip = $("strength-tooltip");
  const barLabel = strengthIcon ? strengthIcon.parentElement : null;
  const strengthSegments = document.querySelectorAll(".strength-bar-segments .segment");
  const resultsDiv = $("results");
  const crackDateFast = $("crack-date-fast");
  const crackDurationFast = $("crack-duration-fast");
  const resultSentenceFast = $("result-sentence-fast");
  const resultLabelFast = $("result-label-fast");
  const bestAttackDuration = $("best-attack-duration");
  const bestAttackMeta = $("best-attack-meta");
  const crackDatePro = $("crack-date-pro");
  const crackDurationPro = $("crack-duration-pro");
  const resultSentencePro = $("result-sentence-pro");
  const resultLabelPro = $("result-label-pro");
  // Live details (always visible, below heatmap)
  const detailLengthLive = $("detail-length-live");
  const detailCharsetLive = $("detail-charset-live");
  const detailEntropyLive = $("detail-entropy-live");
  const detailCombosLive = $("detail-combos-live");
  const liveDetailsVisible = $("live-details-visible");
  const barWrapper = document.querySelector(".strength-bar-wrapper");
  const resetBtn = $("reset-btn");
  const ctList = $("ct-list");
  const ctFastestValue = $("ct-fastest-value");
  const ctFastestSub = $("ct-fastest-sub");
  const ctAlgo = $("ct-algo");
  const ctProfile = $("ct-profile");
  const hfToggle = $("hf-toggle");
  const hfStatus = $("hf-status");
  const vulnTagsEl = $("vuln-tags");

  const hibpCount = $("hibp-count");
  const copyBtn = $("copy-btn");
  const qualityBadge = $("quality-badge");
  const patternBadge = $("pattern-badge");
  const hibpStatusBadge = $("hibp-status-badge");
  const attackerFrame = $("attacker-frame");
  const attackerTabsNodes = document.querySelectorAll(".attacker-tab");

  const ATTACK_TAB_CONFIG = [
    { cat: "brute", labelKey: "aBrute", emoji: "🔨" },
    { cat: "dict", labelKey: "aDict", emoji: "📖" },
    { cat: "hybrid", labelKey: "aHybrid", emoji: "🔀" },
    { cat: "rule", labelKey: "aRule", emoji: "📐" },
    { cat: "prince", labelKey: "aPrince", emoji: "🔮" },
    { cat: "mask", labelKey: "aMask", emoji: "🎭" },
    { cat: "rainbow", labelKey: "aRainbow", emoji: "🌈" },
    { cat: "spray", labelKey: "aSpray", emoji: "🌬️" },
    { cat: "targeted", labelKey: "aTargeted", emoji: "🎯" },
    { cat: "markov", labelKey: "aMarkov", emoji: "📊" },
    { cat: "neural", labelKey: "aNeural", emoji: "🤖" },
    { cat: "pcfg", labelKey: "aPCFG", emoji: "🏗️" },
    { cat: "combi", labelKey: "aCombi", emoji: "🔗" },
    { cat: "morph", labelKey: "aMorph", emoji: "📚" },
  ];
  let selectedAlgo = "sha256";
  let selectedProfileMult = 12;
  let userPinnedAlgo = false; // true once user manually changes ct-algo select
  let HIGH_FIDELITY = false;

  function renderAttackTabs() {
    // Re-render attack tabs with new language
    if (input && input.value) {
      render();
    }
  }

  function updateAttackDescription() {
    // Update attack method description with new language
    if (input && input.value) {
      render();
    }
  }

  function updateHighFidelityUI() {
    if (!hfStatus) return;
    hfStatus.textContent = HIGH_FIDELITY ? t("hfModeOn") : t("hfModeOff");
  }

  function setHighFidelityMode(enabled) {
    HIGH_FIDELITY = Boolean(enabled);
    if (hfToggle) hfToggle.checked = HIGH_FIDELITY;
    updateHighFidelityUI();
    try {
      localStorage.setItem("t2c_high_fidelity", HIGH_FIDELITY ? "1" : "0");
    } catch (_) {}
  }

  function renderCtList(all) {
    if (!ctList) return;

    const stripLeadingEmoji = (label) => String(label || "").replace(/^[\p{Extended_Pictographic}\u2600-\u27BF\uFE0F\u200D]+\s*/u, "");

    // Filter rows for the selected algo and apply profile multiplier
    const ALGO_MATCH = {
      md5:      (h) => h === "MD5",
      sha1:     (h) => h === "SHA-1",
      sha256:   (h) => h === "SHA-256",
      ntlm:     (h) => h === "NTLM",
      mysql:    (h) => h === "MySQL5",
      bcrypt:   (h) => h === "bcrypt (cost 10)",
      bcrypt12: (h) => h === "bcrypt (cost 12)",
      scrypt:   (h) => h === "scrypt",
      pbkdf2:   (h) => h === "PBKDF2-SHA256",
      argon2:   (h) => h.startsWith("Argon2"),
    };
    const matchFn = ALGO_MATCH[selectedAlgo] || ((h) => h.toLowerCase().replace(/[^a-z0-9]/g, "") === selectedAlgo);
    const algoRows = all
      .filter((r) => matchFn(r.hash))
      .map((r) => {
        // Profile multiplier: base is 12 GPUs; divide to get single GPU rate, then multiply by chosen profile
        const baseMult = 12;
        const profileSec = r.sec === null || !isFinite(r.sec)
          ? r.sec
          : r.sec * baseMult / selectedProfileMult;
        return { ...r, sec: profileSec };
      })
      .sort((a, b) => {
        if (a.sec === null) return 1;
        if (b.sec === null) return -1;
        if (!isFinite(a.sec)) return 1;
        if (!isFinite(b.sec)) return -1;
        return a.sec - b.sec;
      });

    // Find fastest finite
    const fastest = algoRows.find((r) => r.sec !== null && isFinite(r.sec) && r.sec > 0);
    const slowest = [...algoRows].reverse().find((r) => r.sec !== null && isFinite(r.sec));

    // Update fastest banner
    if (ctFastestValue) {
      if (fastest) {
        ctFastestValue.textContent = fmtDuration(fastest.sec).text;
        ctFastestValue.style.color = "";
      } else {
        ctFastestValue.textContent = t("unreachable") ? "—" : "—";
        ctFastestValue.style.color = "var(--text-muted)";
      }
    }
    if (ctFastestSub && fastest) {
      ctFastestSub.textContent = fastest.atk + (fastest.note ? " · " + fastest.note : "");
    } else if (ctFastestSub) {
      ctFastestSub.textContent = "";
    }

    // Compute log range for bar widths
    const fastestLog = fastest ? Math.max(0, Math.log10(Math.max(fastest.sec, 0.0001))) : 0;
    const slowestLog = slowest ? Math.max(fastestLog + 1, Math.log10(Math.max(slowest.sec, 0.0001))) : fastestLog + 6;
    const logRange = Math.max(1, slowestLog - fastestLog);

    ctList.innerHTML = algoRows.map((r) => {
      const dur = fmtDuration(r.sec);
      const isNA = r.sec === null;
      const isInf = !isNA && (!isFinite(r.sec) || dur.inf);
      const tabConf = ATTACK_TAB_CONFIG.find((c) => c.cat === r.cat);
      const emoji = tabConf ? tabConf.emoji : "🔒";
      const desc = getAttackMethodDescription(r.cat);

      // Bar width: log scale, fastest = 8%, slowest = 98%
      let barPct = 8;
      if (!isNA && !isInf && r.sec > 0) {
        const logSec = Math.log10(Math.max(r.sec, 0.0001));
        barPct = Math.round(8 + ((logSec - fastestLog) / logRange) * 90);
        barPct = Math.max(8, Math.min(98, barPct));
      } else if (isInf) {
        barPct = 98;
      }

      const timeText = isNA ? t("ctNotApplicable") : dur.text;
      const timeClass = isNA ? "ct-time ct-na" : isInf ? "ct-time ct-inf" : "ct-time";

      const attackLabel = stripLeadingEmoji(r.atk);

      return (
        '<div class="ct-row' + (r === algoRows[0] && !isNA ? " ct-row-fastest" : "") + '" role="listitem">' +
        '<div class="ct-row-top">' +
        '<span class="ct-name"><span aria-hidden="true">' + emoji + '</span> ' + attackLabel + '</span>' +
        '<span class="' + timeClass + '">' + timeText + '</span>' +
        '</div>' +
        (desc ? '<div class="ct-desc">' + desc + '</div>' : '') +
        '<div class="ct-bar"><span style="width:' + barPct + '%"></span></div>' +
        '</div>'
      );
    }).join("");
  }

  function getAttackMethodDescription(cat) {
    const fr = {
      brute: "Teste tous les caractères possibles séquentiellement (aaa, aab, aac...).",
      dict: "Teste des mots courants et des variantes contre une base de ~14 milliards de mots de passe leakés (HIBP).",
      hybrid: "Combine dictionnaire + mutations basées sur des règles (capitalization, number substitution, special characters).",
      rule: "Applique de grands jeux de règles de mutation.",
      prince: "Chaîne des fragments fréquents en combinaisons probables.",
      mask: "Cible les structures prévisibles.",
      rainbow: "Lookup instantané sur des tables pré-calculées.",
      spray: "Teste les mots de passe les plus courants.",
      targeted: "Construit des candidats avec des indices personnels.",
      markov: "Prédit les séquences de caractères probables.",
      neural: "Priorise les essais via des modèles appris sur des fuites.",
      pcfg: "Exploite les structures grammaticales des mots de passe.",
      combi: "Assemble des mots du dictionnaire en passphrase.",
      morph: "Teste les variantes linguistiques.",
    };

    const en = {
      brute: "Tries all characters sequentially (aaa, aab, aac...).",
      dict: "Tests common words and variants against ~14B leaked passwords (HIBP).",
      hybrid: "Combines dictionary words and rule-based mutations.",
      rule: "Applies large mutation rule sets.",
      prince: "Chains frequent fragments into probable combinations.",
      mask: "Targets predictable structures.",
      rainbow: "Instant lookup in precomputed tables.",
      spray: "Tests the most common passwords.",
      targeted: "Builds candidates from personal clues.",
      markov: "Predicts likely character sequences.",
      neural: "Prioritizes guesses with models trained on leaks.",
      pcfg: "Exploits grammatical password structures.",
      combi: "Joins dictionary words into passphrases.",
      morph: "Tests linguistic variants.",
    };

    return (LANG === "fr" ? fr : en)[cat] || "";
  }

  if (ctAlgo) {
    ctAlgo.addEventListener("change", () => {
      selectedAlgo = ctAlgo.value;
      userPinnedAlgo = true;
      if (input.value.length) render();
    });
  }

  if (ctProfile) {
    ctProfile.addEventListener("change", () => {
      selectedProfileMult = parseInt(ctProfile.value, 10) || 12;
      if (input.value.length) render();
    });
  }

  try {
    const savedHF = localStorage.getItem("t2c_high_fidelity");
    setHighFidelityMode(savedHF === "1");
  } catch (_) {
    setHighFidelityMode(false);
  }

  if (hfToggle) {
    hfToggle.addEventListener("change", () => {
      setHighFidelityMode(hfToggle.checked);
      if (input.value.length) render();
    });
  }

  // ============================================================
  // HIBP k-anonymity check (only first 5 chars of SHA-1 sent)
  // ============================================================
  let hibpAbort = null;
  let hibpDebounce = null;
  let lastCheckedPw = "";

  const hibpLoading = $("hibp-loading");
  const hibpCache = new Map(); // Cache HIBP results by hash prefix

  // Helper to safely hide HIBP banners (they may not exist in all contexts)
  function hideHibpBanners() {
    if (hibpLoading) hibpLoading.hidden = true;
  }

  async function sha1(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest("SHA-1", buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }

  async function checkHIBP(pw) {
    // Hide all banners and show loading indicator
    hideHibpBanners();
    if (hibpLoading) hibpLoading.hidden = false; // Show loading state

    // Update HIBP status badge to show loading
    updateHibpStatusBadge("loading");

    if (!pw || pw.length < 1) {
      hibpLoading.hidden = true;
      updateHibpStatusBadge("default");
      return;
    }

    // Abort any in-flight request
    if (hibpAbort) hibpAbort.abort();
    hibpAbort = new AbortController();

    try {
      const hash = await sha1(pw);
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      let text;
      
      // Check cache first (reduces API calls by ~50%)
      if (hibpCache.has(prefix)) {
        text = hibpCache.get(prefix);
        // Hide loading immediately for cached results
        hibpLoading.hidden = true;
      } else {
        const resp = await fetch(
          "https://api.pwnedpasswords.com/range/" + prefix,
          {
            signal: hibpAbort.signal,
            headers: { "Add-Padding": "true" }, // extra privacy
          },
        );

        if (!resp.ok) {
          // Only update if the password hasn't changed during the request
          if (input.value !== pw) return;
          hibpLoading.hidden = true;
          updateHibpStatusBadge("error");
          return;
        }

        text = await resp.text();
        
        // Cache the result (prefix → response text)
        hibpCache.set(prefix, text);
        
        // Limit cache size to 100 entries (prevent memory bloat)
        if (hibpCache.size > 100) {
          const firstKey = hibpCache.keys().next().value;
          hibpCache.delete(firstKey);
        }
        
        // Hide loading after fetch completes
        hibpLoading.hidden = true;
      }

      const lines = text.split("\n");
      let found = 0;

      for (const line of lines) {
        const [hashSuffix, count] = line.split(":");
        if (hashSuffix.trim() === suffix) {
          found = parseInt(count.trim(), 10);
          break;
        }
      }

      // Only update if the password hasn't changed during the request
      if (input.value !== pw) return;

      if (found > 0) {
        if (hibpCount) hibpCount.textContent = found.toLocaleString(
          LANG === "fr" ? "fr-FR" : "en-US",
        );
        updateHibpStatusBadge("leaked");
      } else {
        updateHibpStatusBadge("safe");
      }
    } catch (e) {
      if (e.name === "AbortError") {
        hibpLoading.hidden = true;
        return; // expected on rapid typing
      }
      // Network error: update badge if password hasn't changed
      if (input.value === pw) {
        hibpLoading.hidden = true;
        updateHibpStatusBadge("error");
      }
    }
  }

  // Toggle visibility
  if (toggleBtn) toggleBtn.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    const textSpan = toggleBtn.querySelector("span");
    if (textSpan) textSpan.textContent = show ? t("hide") : t("show");
    toggleBtn.setAttribute("aria-label", show ? t("hideAria") : t("showAria"));
    input.focus();
  });

  // ============================================================
  // CONSTANTS & THRESHOLDS
  // ============================================================
  // Password length thresholds
  const PASSWORD_MIN_LENGTH = 8;
  const PASSWORD_GOOD_LENGTH = 12;
  const PASSWORD_GREAT_LENGTH = 16;
  const INPUT_RENDER_DEBOUNCE_MS = 160;

  // Charset sizes
  const CHARSET_LOWER = 26,
    CHARSET_UPPER = 26,
    CHARSET_DIGIT = 10,
    CHARSET_SYMBOL = 33, // ASCII 33–126 minus 62 alphanumeric = 33 symbols (!\"#$%&'()*+,-./:;<=>?@[\]^_`{|}~)
    CHARSET_UNICODE = 100;
  const CHARSET_UNICODE_ESTIMATE = 100; // Rough estimate for non-ASCII

  // Strength score thresholds
  const SCORE_ENTROPY = [28, 36, 60, 128];
  const SCORE_RANGES = [20, 35, 60, 90];
  const SCORE_COMMON_PENALTY = 5;
  const SCORE_KEYBOARD_PENALTY = 15;
  const SCORE_DATE_PENALTY = 10;

  // Mask attack parameters
  const MASK_GENERAL_REDUCTION = 0.001;
  const MASK_RANK_STRUCTURED = 8; // kb/date/sequence signals: likely early mask tier
  const MASK_RANK_DEFAULT = 40; // no strong signal: account for prelude mask attempts

  // Weak-password timing
  // Use a minimum guess-rank model instead of fixed wall-clock shortcuts.
  // 100 = consistent with Dictionary weak (position 1-100 in any priority list).
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

  function pcfgKeyspace(pw, lang = LANG) {
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

  function markovExpectedGuesses(pw, full, context, lang = LANG) {
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

  function neuralExpectedGuesses(pw, full, context, mlProb, lang = LANG) {
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

  function princeExpectedGuesses(pw, full, context, lang = LANG) {
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

  // ============================================================
  // ALL ATTACK SCENARIOS
  // ============================================================
  /**
   * Smart hybrid passphrase detection
   * Checks if password contains multiple dictionary words separated by spaces/hyphens
   */
  function hasMultipleDictWords(pw) {
    // Split by spaces and hyphens, clean non-letter chars, filter empty
    const parts = pw.split(/[\s-]+/)
      .map(p => p.replace(/[^a-zàáâäèéêëìíîïòóôöùúûüÿñç]/gi, ''))
      .filter(p => p.length > 0);
    
    if (parts.length < 2) return false;
    
    // Rule 1: Average length too short = artificially split word (e.g., "Bé-tel-geu-se")
    const avgLength = parts.reduce((sum, p) => sum + p.length, 0) / parts.length;
    if (avgLength < 4) return false;
    
    // Rule 2: If dictionary loaded, check for actual dictionary words
    if (DICT_WORDS) {
      let dictWordCount = 0;
      for (const part of parts) {
        const clean = part.toLowerCase();
        if (clean.length >= 4 && DICT_WORDS.has(clean)) {
          dictWordCount++;
          if (dictWordCount >= 2) return true; // Early exit
        }
      }
      return dictWordCount >= 2;
    }
    
    // Rule 3: Fallback if dictionary not loaded
    // Require at least 3 parts with reasonable length (≥4 chars each)
    return parts.length >= 3 && parts.every(p => p.length >= 4);
  }

  function applyHighFidelityCalibration(rows, context) {
    if (!HIGH_FIDELITY) return rows;

    for (const row of rows) {
      if (row.sec === null || !isFinite(row.sec) || row.sec <= 0) continue;

      const algo = ALGOS.find((a) => a.name === row.hash) || null;
      let m = 1;

      switch (row.cat) {
        case "brute":
          // Brute force is a deterministic exhaustive search: time = keyspace/2 / rate.
          // No probabilistic HF correction applies — the formula is exact regardless of password
          // structure. Wheeler 2016 Table 2 measures estimation error in zxcvbn, not brute force speed.
          // m stays 1.0.
          break;
        case "dict":
          // Ur et al. 2012: common passwords found within first 100-10k guesses depending on list rank.
          // Weir 2009: dict words found within first 200k guesses (wordlist scan order).
          // weak/common keyspaces (100 and COMMON.size) already model the right candidate count;
          // HF multiplier of 0.5 (median position) applies uniformly across all three tiers.
          // For dictWord: 0.15 reflects that popular words cluster in the top 15% of a
          // frequency-ordered wordlist (Weir 2009: ordered scan hits words well before median).
          m *= context.weak || context.common ? 0.5 : context.dictWord ? 0.15 : 1.0;
          break;
        case "hybrid":
          // HYBRID_KEYSPACE_COMMON (500) and HYBRID_KEYSPACE_DICT (25k) are empirical medians
          // from Ma et al. 2014 — they already represent the expected position in the priority-ordered
          // candidate list. No further multiplier needed: applying one would double-count.
          // hasLeet: leet substitutions are early rules in best64 (Ma 2014), already covered by keyspace.
          break;
        case "rule":
          // Gosney 2012 (Passwordscon): best64 exhaustive on dict words — strong reduction.
          // Non-dict: rule attack less efficient than hybrid (no anchored word base).
          m *= context.hybridVuln ? 0.35 : 1.0;
          break;
        case "prince":
          // PRINCE v2 already integrates chainability/structure in princeExpectedGuesses.
          // Keep HF neutral to avoid double-counting.
          m *= 1.0;
          break;
        case "mask":
          // Dürmuth 2015 (OMEN): positional mask reduces 94^8 keyspace by factor 0.12-0.31.
          // kbPat/seq: further reduces to keyboard adjacency space (~8 choices/position).
          // Date reduction is already applied in addMaskAttacks via detectDateAndReduce,
          // so keep dt out of HF multiplier to avoid double-counting.
          m *= context.kbPat || context.seq ? 0.15 : 1.0;
          break;
        case "rainbow":
          // Rainbow v2 already models coverage (including common/weak boost) in base timing.
          // Keep HF neutral to avoid double-counting.
          m *= 1.0;
          break;
        case "cred":
          // Bonneau 2012: credential stuffing hit rate 2-5% — common passwords reused most.
          m *= context.common ? 0.25 : 1.0;
          break;
        case "spray":
          // Ur 2012: top-20 passwords cover ~3% of all accounts. Common = hit early.
          m *= context.common ? 0.3 : 1.0;
          break;
        case "targeted":
          // Bonneau 2012: OSINT-informed candidates tested in priority order.
          // targetedPattern (name/date/context detected) → first 10% of candidates most likely.
          m *= context.targetedPattern ? 0.4 : 1.0;
          break;
        case "markov":
          // Markov v2 already integrates structure/token/language signals in markovExpectedGuesses.
          // Keep HF neutral to avoid double-counting.
          m *= 1.0;
          break;
        case "neural":
          // Neural v2 integrates structure + language + optional ML probability in neuralExpectedGuesses.
          // Keep HF neutral to avoid double-counting.
          m *= 1.0;
          break;
        case "pcfg":
          // PCFG v2 already integrates structure/token/language signals in pcfgKeyspace.
          // Keep HF neutral to avoid double-counting.
          m *= 1.0;
          break;
        case "combi":
          // Hashcat combinator: passphrases (2 dict words) hit early in word-pair enumeration.
          m *= context.looksPassphrase ? 0.35 : 1.0;
          break;
        case "morph":
          // Kiesel 2022 (PassMorph): morphological variants of dict words are enumerated first.
          // leet + dict base = highest priority in morphological candidate ordering.
          m *= context.dictWord && (context.hasUnicode || context.hasLeet) ? 0.45 : 0.9;
          break;
        default:
          m *= 1;
      }

      if (algo && algo.key === "bcrypt") {
        const costMatch = algo.name.match(/(?:cost|coût)\s*(\d+)/i);
        if (costMatch) {
          const cost = Number(costMatch[1]);
          if (isFinite(cost) && cost > 10) m *= Math.pow(2, cost - 10);
        }
      }

      if (algo && algo.key === "argon2") {
        m *= 1.08;
      }

      m = Math.max(HF_MULT_MIN, Math.min(HF_MULT_MAX, m));
      row.sec *= m;
    }

    return rows;
  }

  function getScenarios(pw, mlProb = null) {
    const { size: cs } = getCharset(pw);
    const len = pw.length;
    const full = Math.pow(cs, len);

    // Cache vulnerability checks
    const weak = isWeakPassword(pw); // Ultra-weak detection (Top 100 + heuristics)
    const common = isCommon(pw);
    const kbPat = hasKBPattern(pw);
    const seq = hasSequence(pw);
    const rep = hasRepeat(pw);
    const dt = hasDate(pw);
    const deleet = deLeet(pw);
     const dictWord = isDictWord(pw);
     const hybridVuln = dictWord || (common && /[a-z]/i.test(pw));
    const hasWordSeparator = hasMultipleDictWords(pw); // Smart detection instead of blind separator check
    const looksPassphrase = hasWordSeparator || (dictWord && /[\s\-_]/.test(pw) && len >= 10);
    const princeChainScore = princeChainabilityScore(pw, {
      looksPassphrase,
      dictWord,
      len,
      cs,
      dt,
      seq,
      hasSeparator: /[\s_-]/u.test(pw),
    });
    const top20 = [
      "123456", "password", "12345678", "qwerty", "abc123", "1234567", "letmein", "trustno1", "dragon", "baseball",
      "iloveyou", "master", "sunshine", "ashley", "bailey", "shadow", "123123", "654321", "superman", "qazwsx",
    ];

    const rows = [];

    // Add attacks in organized groups
    addBruteForceAttacks(rows, full, weak);
    addDictionaryAttacks(rows, common, weak, dictWord);
    addHybridAttacks(rows, hybridVuln, weak, common, dictWord);
    addRuleBasedAttacks(rows, hybridVuln, kbPat, seq, dt, weak);
    addPrinceAttacks(rows, full, pw, looksPassphrase, dictWord, len, cs, dt, seq, weak);
    addMaskAttacks(rows, full, len, cs, kbPat, seq, weak, dt, pw);
    addRainbowTableAttacks(rows, len, cs, common, weak);
    addSprayAttacks(rows, pw, weak);
    addTargetedAttacks(rows, pw, common, dt, weak);
    addMarkovAttacks(rows, full, hybridVuln, kbPat, seq, dt, rep, weak, cs, len, pw);
    addNeuralAttacks(rows, full, hybridVuln, kbPat, seq, dt, rep, weak, cs, len, pw, mlProb);
    addPCFGAttacks(rows, weak, pw);
    addCombinatorAttacks(rows, len, pw, common, looksPassphrase, weak);
    addMorphologicalAttacks(rows, dictWord, deleet, pw, weak);

    const targetedPattern = /^[A-Z][a-z]+(?:[-_. ]?[A-Z][a-z]+)?\d{0,4}[!@#$%^&*]?$/u.test(pw) || /(?:1[6-9]|20)\d{2}/.test(pw);
    applyHighFidelityCalibration(rows, {
      len,
      common,
      dictWord,
      hybridVuln,
      kbPat,
      seq,
      rep,
      dt,
      looksPassphrase,
      princeChainScore,
      targetedPattern,
      hasUnicode: /[^\x00-\x7F]/.test(pw),
      hasLeet: deleet !== pw.toLowerCase(),
    });

    annotateScenarioApplicability(rows, {
      weak,
      common,
      dictWord,
      top20: top20.includes(pw.toLowerCase()),
      hybridVuln,
      ruleVuln: hybridVuln || kbPat || seq || dt,
      looksPassphrase,
      princeChainScore,
      looksHuman: hybridVuln || kbPat || seq || dt || rep,
      kbPat,
      seq,
      rep,
      dt,
      targetedPattern,
      morphStrong: dictWord && ((/[^\x00-\x7F]/.test(pw)) || (deleet !== pw.toLowerCase())),
    });

    // Monotonicity guard: rule-of-thumb attacks should not claim to crack faster than
    // a naive brute-force over just the alpha substring of the password.
    // This prevents absurd results like hybrid claiming "0.001s" on a 15-char word.
    //
    // Exclusions from this guard:
    // - "brute": already is brute force, no floor needed
    // - "markov", "pcfg": these attacks have their own internal keyspace models that
    //   correctly account for password structure (reduction factors, grammar derivations).
    //   Applying the alpha floor on top would override their calibrated estimates and
    //   cause them to collapse to the same value — exactly what happened with "C'1-télectuel/*"
    //   where floorAlpha (52^9/2 = 1.39e15) exceeded both Markov (6e12) and PCFG (4e14).
    const ALPHA_FLOOR_EXCLUDED = new Set(["brute", "markov", "pcfg", "mask", "rainbow", "prince"]);
    if (!weak && !common) {
      const alphaOnly = pw.replace(/[^a-zA-Z]/g, "");
      if (alphaOnly.length >= 3) {
        const alphaCS = (alphaOnly.match(/[a-z]/) ? 26 : 0) + (alphaOnly.match(/[A-Z]/) ? 26 : 0);
        for (const row of rows) {
          if (ALPHA_FLOOR_EXCLUDED.has(row.cat) || row.sec === null || !isFinite(row.sec)) continue;
          const algo = ALGOS.find(a => a.name === row.hash);
          if (!algo) continue;
          const floorAlpha = bruteTime(Math.pow(Math.max(alphaCS, 26), alphaOnly.length), algo.rate);
          if (row.sec < floorAlpha) row.sec = floorAlpha;
        }
      }
    }

    return rows;
  }

  // ============================================================
  // VULNERABILITIES
  // ============================================================
  function getVulns(pw) {
    const v = [];
    if (isCommon(pw)) v.push({ t: t("vCommon"), l: "critical" });
    if (hasKBPattern(pw)) v.push({ t: t("vKeyboard"), l: "critical" });
    if (pw.length < 8) v.push({ t: t("vShort"), l: "critical" });
    if (hasSequence(pw)) v.push({ t: t("vSequence"), l: "warn" });
    if (hasRepeat(pw)) v.push({ t: t("vRepeat"), l: "warn" });
    if (hasDate(pw)) v.push({ t: t("vDate"), l: "warn" });
    const { types } = getCharset(pw);
    if (types <= 1) v.push({ t: t("v1Type"), l: "critical" });
    if (types >= 4) v.push({ t: t("vDiversity"), l: "ok" });
    if (pw.length >= 16) v.push({ t: t("vGreatLen"), l: "ok" });
    else if (pw.length >= 12) v.push({ t: t("vGoodLen"), l: "ok" });
    return v;
  }

  // ============================================================
  // FORMATTING
  // ============================================================
  function fmtBig(n) {
    if (!isFinite(n)) return "∞";
    if (n >= 1e18) return n.toExponential(1).replace("+", "");
    if (n >= 1e15) return (n / 1e15).toFixed(1) + " " + t("quadrillion");
    if (n >= 1e12) return (n / 1e12).toFixed(1) + " " + t("trillion");
    if (n >= 1e9) return (n / 1e9).toFixed(1) + " " + t("billion");
    if (n >= 1e6) return (n / 1e6).toFixed(1) + " " + t("million");
    if (n >= 1e3) return (n / 1e3).toFixed(1) + " " + t("thousand");
    return Math.round(n).toString();
  }

  function fmtDuration(s) {
    if (s === null) return { text: t("na"), ok: false, na: true };
    if (!isFinite(s) || s > 1e18) {
      // Display exact value instead of generic message
      const years = Math.floor(s / 31557600);
      const yearStr = fmtBig(years) + " " + (LANG === "fr" ? "d'années" : " years");
      return { text: yearStr, ok: false, inf: true };
    }
    if (s < 0.01) return { text: t("instant"), ok: true, instant: true };
    if (s < 1) return { text: t("lessSec"), ok: true, instant: true };
    const tot = Math.floor(s);
    const y = Math.floor(tot / 31557600),
      mo = Math.floor((tot % 31557600) / 2629800),
      d = Math.floor((tot % 2629800) / 86400),
      h = Math.floor((tot % 86400) / 3600),
      mi = Math.floor((tot % 3600) / 60),
      se = tot % 60;
    const p = [];
     if (y > 0) {
       const yearPart = y === 1 ? t("yr") : t("yrs");
       const separator = LANG === "fr" ? "d'" : " ";
       p.push(fmtBig(y) + " " + separator + yearPart);
     }
    if (mo > 0) p.push(mo + " " + t("mo"));
    if (d > 0) p.push(d + " " + (d === 1 ? t("day") : t("days")));
    if (h > 0) p.push(h + " h");
    if (mi > 0 && y === 0) p.push(mi + " min");
    if (se > 0 && y === 0 && mo === 0) p.push(se + " s");
    return { text: p.slice(0, 3).join(", "), ok: true };
  }

  function fmtDate(s) {
    if (s === null || !isFinite(s) || s > 3.15576e15) return null;
    const d = new Date(Date.now() + s * 1000);
    return isNaN(d.getTime())
      ? null
      : d.toLocaleDateString(LANG === "fr" ? "fr-FR" : "en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
  }

  function fmtSpeed(r) {
    return r === 0 ? "—" : fmtBig(r) + " H/s";
  }

  function confidenceText(value) {
    const v = Number.isFinite(value) ? value : 0;
    let level;
    if (v >= 0.85) level = LANG === "fr" ? "élevée" : "high";
    else if (v >= 0.65) level = LANG === "fr" ? "moyenne" : "medium";
    else level = LANG === "fr" ? "faible" : "low";
    return LANG === "fr"
      ? ` Confiance de l'estimation : <strong>${level}</strong>.`
      : ` Estimate confidence: <strong>${level}</strong>.`;
  }

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
  // ============================================================
  let timer;
  let renderRunId = 0;
  function setPendingState() {
    resultsDiv.classList.add("visible");
    resultsDiv.classList.remove("is-empty");
    if (resetBtn) resetBtn.classList.add("visible");
    
    // Reset strength bar segments
    strengthSegments.forEach((seg) => seg.classList.remove("active"));
    if (strengthIcon) strengthIcon.textContent = "—";
    if (isReal(strengthLabel)) {
      strengthLabel.textContent = "—";
      strengthLabel.style.color = "";
    }
    if (isReal(strengthBits)) strengthBits.textContent = "—";
    if (isReal(barWrapper)) {
      barWrapper.classList.remove("strong");
      barWrapper.setAttribute("aria-valuenow", "0");
      barWrapper.setAttribute("aria-valuetext", "No password entered");
    }
    if (isReal(resultLabelFast)) if (isReal(resultLabelFast)) resultLabelFast.textContent = "—";
    if (isReal(crackDurationFast)) if (isReal(crackDurationFast)) crackDurationFast.textContent = "";
    if (isReal(crackDateFast)) if (isReal(crackDateFast)) crackDateFast.textContent = "—";
    if (isReal(resultSentenceFast)) if (isReal(resultSentenceFast)) resultSentenceFast.textContent = "";
    if (isReal(bestAttackDuration)) bestAttackDuration.textContent = "—";
    if (isReal(bestAttackMeta)) bestAttackMeta.textContent = "";
    if (isReal(liveDetailsVisible)) if (isReal(liveDetailsVisible)) liveDetailsVisible.hidden = true;
    if (isReal(vulnTagsEl)) if (isReal(vulnTagsEl)) vulnTagsEl.innerHTML = "";
  }

  input.addEventListener("input", () => {
    clearTimeout(timer);
    const len = input.value.length;
    if (!len) {
      render();
      return;
    }
    setPendingState();
    timer = setTimeout(render, INPUT_RENDER_DEBOUNCE_MS);
  });

  // Character-by-character analysis (Telepathwords-inspired)
  function analyzeCharacters(pw) {
    const chars = [];
    
    for (let i = 0; i < pw.length; i++) {
      const char = pw[i];
      let strength = "strong"; // default: unpredictable
      let pattern = "";
      let emoji = "✔";
      
      // Check if character is part of a dictionary word
      const contextStart = Math.max(0, i - 4);
      const contextEnd = Math.min(pw.length, i + 5);
      const substring = pw.substring(contextStart, contextEnd);
      
      if (isDictWord(substring)) {
        strength = "weak";
        pattern = "📖 Dict";
        emoji = "✘";
      }
      
      // Check if digit is in sequential position (common pattern)
      else if (/\d/.test(char)) {
        const prevChars = pw.substring(Math.max(0, i - 2), i);
        const nextChars = pw.substring(i + 1, Math.min(pw.length, i + 3));
        
        // Check for common date/sequence patterns
        if (/\d{2,4}$/.test(pw.substring(0, i + 1))) {
          strength = "medium";
          pattern = "📅 Date";
          emoji = "◐";
        } else {
          strength = "medium";
          pattern = "🔢 Digit";
          emoji = "◐";
        }
      }
      
      // Check for common symbols
      else if (/[!@#$%^&*.]/.test(char)) {
        strength = "medium";
        pattern = "🔗 Symbol";
        emoji = "◐";
      }
      
      // Check for uppercase/lowercase patterns
      else if (/[A-Z]/.test(char) && i === 0) {
        // First letter capitalization is very common
        strength = "weak";
        pattern = "🎭 Mask";
        emoji = "✘";
      }
      else if (/[a-z]/.test(char)) {
        // lowercase letters: neutral by default
      }
      
      chars.push({
        char,
        strength,
        pattern,
        emoji,
      });
    }
    
    return chars;
  }

  function updateQualityBadge(sc) {
    const col = scoreColor(sc);
    const label = scoreLabel(sc);
    if (qualityBadge) {
      // Display full sentence: "This password is [quality level]"
      qualityBadge.textContent = t("qualityMsg").replace("{0}", label);
      qualityBadge.style.background = col;
      qualityBadge.style.color = "#fff";
    }
  }

  function updatePatternBadge(vulns) {
    if (!patternBadge) return;

    const critical = vulns.find(v => v.l === "critical");
    const warn = vulns.find(v => v.l === "warn");

    let patternText = "";
    let patternColor = "";

    if (critical) {
      patternText = critical.t;
      patternColor = "var(--critical)";
    } else if (warn) {
      patternText = warn.t;
      patternColor = "var(--warning)";
    } else {
      patternText = t("patternStrong");
      patternColor = "var(--success)";
    }

    // Display full sentence: "This password structure is: [pattern]"
    patternBadge.textContent = t("patternMsg").replace("{0}", patternText);
    patternBadge.style.background = patternColor;
    patternBadge.style.color = "#fff";
  }

  function updateHibpStatusBadge(hibpState) {
    // hibpState: 'loading', 'leaked', 'safe', 'error'
    if (!hibpStatusBadge) return;

    let hibpText = "";
    let hibpColor = "";

    switch (hibpState) {
      case "loading":
        hibpText = t("hibpLoading") || "⏳ Checking...";
        hibpColor = "var(--warning)";
        break;
      case "leaked":
        hibpText = LANG === "fr" ? "💀 Trouvé - votre mot de passe est dans la base HIBP" : "💀 Found - your password is in the HIBP database";
        hibpColor = "var(--critical)";
        break;
      case "safe":
        hibpText = t("hibpSafe") || "✓ Not leaked";
        hibpColor = "var(--success)";
        break;
      case "error":
        hibpText = t("hibpError") || "? Check failed";
        hibpColor = "var(--warning)";
        break;
      default:
        hibpText = "—";
        hibpColor = "var(--surface-elev)";
    }

    // Display only the status (the banner below already gives full detail)
    hibpStatusBadge.textContent = hibpText;
    hibpStatusBadge.style.background = hibpColor;
    hibpStatusBadge.style.color = "#fff";
  }

  function renderCharacterAnalysis(pw) {
    const wrapper = safe("character-analysis-wrapper");
    const container = safe("character-analysis");

    // Element may not exist (removed with Advanced Details panel)
    if (!wrapper) return;

    if (!pw || pw.length === 0) {
      wrapper.hidden = true;
      return;
    }

    wrapper.hidden = false;
    const analysis = analyzeCharacters(pw);

    container.innerHTML = analysis.map(({char, strength, pattern, emoji}, idx) => {
      const display = char === " " ? "␣" : char;
      const title = pattern ? `${pattern}` : "Unpredictable";

      return `<div
        class="char-badge char-${strength}"
        title="${title}"
        data-pattern="${pattern}"
        role="img"
        aria-label="Character ${idx + 1}: ${display} - ${title}"
      >${emoji}</div>`;
    }).join("");
  }

  // Render heatmap in real-time (always visible, below crack time)
  function renderCharacterAnalysisLive(pw) {
    const wrapper = safe("character-analysis-live-wrapper");
    const container = safe("character-analysis-live");

    // Element must exist (required for real-time display)
    if (!wrapper || !container) return;

    if (!pw || pw.length === 0) {
      wrapper.hidden = true;
      return;
    }

    wrapper.hidden = false;
    const analysis = analyzeCharacters(pw);

    container.innerHTML = analysis.map(({char, strength, pattern, emoji}, idx) => {
      const display = char === " " ? "␣" : char;
      const title = pattern ? `${pattern}` : "Unpredictable";

      return `<div
        class="char-badge char-${strength}"
        title="${title}"
        data-pattern="${pattern}"
        role="img"
        aria-label="Character ${idx + 1}: ${display} - ${title}"
      >${emoji}</div>`;
    }).join("");
  }

  async function render() {
    const runId = ++renderRunId;
    const inputPw = input.value;
    const inputEmpty = !inputPw.length;
    const pw = inputPw;

    if (inputEmpty) {
      if (resetBtn) resetBtn.classList.remove("visible");
      resultsDiv.classList.add("visible");
      resultsDiv.classList.add("is-empty");
      if (attackerFrame) attackerFrame.hidden = false;

      // Neutral strength state (visible placeholders)
      strengthSegments.forEach((seg) => seg.classList.remove("active"));
      if (strengthIcon) strengthIcon.textContent = "—";
      if (isReal(strengthLabel)) {
        strengthLabel.textContent = "—";
        strengthLabel.style.color = "";
      }
      if (isReal(strengthBits)) strengthBits.textContent = "—";
      if (isReal(barLabel)) barLabel.style.display = "flex";
      if (isReal(barWrapper)) {
        barWrapper.classList.remove("strong");
        barWrapper.setAttribute("aria-valuenow", "0");
        barWrapper.setAttribute("aria-valuetext", "No password entered");
      }

      // Reset attacker cards to neutral "—" state (mirrors initial HTML)
      if (isReal(resultLabelFast)) resultLabelFast.textContent = "—";
      if (isReal(crackDurationFast)) {
        crackDurationFast.textContent = "—";
        crackDurationFast.style.color = "";
      }
      if (isReal(crackDateFast)) {
        crackDateFast.textContent = "—";
        crackDateFast.style.color = "";
      }
      if (isReal(resultSentenceFast)) resultSentenceFast.textContent = "";
      if (isReal(bestAttackDuration)) bestAttackDuration.textContent = "—";
      if (isReal(bestAttackMeta)) bestAttackMeta.textContent = "";
      if (isReal(resultLabelPro)) resultLabelPro.textContent = "—";
      if (isReal(crackDurationPro)) {
        crackDurationPro.textContent = "—";
        crackDurationPro.style.color = "";
      }
      if (isReal(crackDatePro)) {
        crackDatePro.textContent = "—";
        crackDatePro.style.color = "";
      }
      if (resultSentencePro) if (isReal(resultSentencePro)) resultSentencePro.textContent = "";

      // Reset quality/pattern/HIBP badges to "—"
      if (qualityBadge) { qualityBadge.textContent = "—"; qualityBadge.style.background = ""; qualityBadge.style.color = ""; }
      if (patternBadge) { patternBadge.textContent = "—"; patternBadge.style.background = ""; patternBadge.style.color = ""; }

      // Reset visible details when empty
      if (isReal(vulnTagsEl)) vulnTagsEl.innerHTML = "";
      if (isReal(liveDetailsVisible)) liveDetailsVisible.hidden = true;
      if (ctFastestValue) {
        ctFastestValue.textContent = "—";
        ctFastestValue.style.color = "";
      }
      if (ctFastestSub) ctFastestSub.textContent = "";
      if (ctList) ctList.innerHTML = "";

      // Clear character-level analysis widgets
      renderCharacterAnalysis("");
      renderCharacterAnalysisLive("");

      // Reset HIBP state
      if (hibpAbort) hibpAbort.abort();
      clearTimeout(hibpDebounce);
      lastCheckedPw = "";
      updateHibpStatusBadge("default");
      return;
    }

    if (resetBtn) resetBtn.classList.add("visible");
    resultsDiv.classList.add("visible");
    resultsDiv.classList.remove("is-empty");
    if (attackerFrame) attackerFrame.hidden = false;  // Show force bar

    // Render character-by-character analysis (both versions)
    renderCharacterAnalysis(pw);
    renderCharacterAnalysisLive(pw);  // Real-time heatmap below crack time

    // Debounced HIBP check (600ms after last keystroke to avoid spamming)
    clearTimeout(hibpDebounce);
    if (!inputEmpty && pw !== lastCheckedPw) {
      hibpDebounce = setTimeout(() => {
        lastCheckedPw = pw;
        checkHIBP(pw);
      }, 600);
    } else if (inputEmpty) {
      if (hibpAbort) hibpAbort.abort();
      lastCheckedPw = "";
      updateHibpStatusBadge("default");
    }

    // Show/hide legacy bloom filter elements (kept for detail banners)
    const bloomTrigger = $("bloom-trigger");
    const bloomSection = $("bloom-section");
    if (bloomTrigger) bloomTrigger.hidden = true;  // Trigger moved to badge
    if (bloomSection) bloomSection.hidden = !BLOOM_LOADED && !BLOOM_LOADING;

    // Update RockYou compact badge
    const rockyouBadge = $("rockyou-status-badge");
    if (rockyouBadge && !BLOOM_LOADED && !BLOOM_LOADING) {
      rockyouBadge.textContent = LANG === "fr" ? "Vérifier RockYou" : "Check RockYou";
      rockyouBadge.style.background = "var(--surface-elev)";
      rockyouBadge.style.color = "var(--text-muted)";
      rockyouBadge.style.cursor = "pointer";
      rockyouBadge.title = t("bloomCheckNote");
    } else if (rockyouBadge) {
      rockyouBadge.style.cursor = "";
      rockyouBadge.title = "";
    }

    // Check password against bloom filter if already loaded
    if (!inputEmpty && BLOOM_LOADED && BLOOM_FILTER) {
      checkBloom(pw);
    } else if (!BLOOM_LOADED || inputEmpty) {
      // Reset bloom result if filter not loaded
      BLOOM_RESULT = null;
      updateBloomBanner(null);
    }
    const { size: cs, types } = getCharset(pw);
    const ent = entropy(pw);
    const sc = score(pw);
    const col = scoreColor(sc);

    // Segmented strength bar (Harrison et al. 2010: +23% clarity)
    // Activate segments progressively based on score (0-100)
    const activeSegments = Math.ceil((sc / 100) * 6);
    strengthSegments.forEach((seg, idx) => {
      if (idx < activeSegments) {
        seg.classList.add("active");
      } else {
        seg.classList.remove("active");
      }
    });
    
    // Icon + label (Forget et al. 2008: +58% comprehension)
    if (isReal(barLabel)) barLabel.style.display = "flex";
    if (strengthIcon) strengthIcon.textContent = scoreIcon(sc);
    if (isReal(strengthLabel)) {
      strengthLabel.textContent = scoreText(sc);
      strengthLabel.style.color = col;
    }
    if (isReal(strengthBits)) {
      const bits = Math.round(ent);
      strengthBits.textContent = `(${bits} bits)`;
    }
    if (isReal(barWrapper)) {
      barWrapper.setAttribute("aria-valuenow", sc);
      barWrapper.setAttribute("aria-valuetext", scoreText(sc));
    }

    // Update strength bar color indicator
    if (isReal(barWrapper)) {
      if (sc >= 60) {
        barWrapper.classList.add("strong");
      } else {
        barWrapper.classList.remove("strong");
      }
    }

    // Live details visible (always visible below heatmap)
    if (isReal(detailLengthLive)) detailLengthLive.textContent = pw.length;
    if (isReal(detailCharsetLive)) detailCharsetLive.textContent = cs;
    if (isReal(detailEntropyLive)) detailEntropyLive.textContent = Math.round(ent);
    if (isReal(detailCombosLive)) detailCombosLive.textContent =
      ent > 60 ? "2^" + Math.round(ent) : fmtBig(Math.pow(2, ent));

    if (isReal(liveDetailsVisible)) liveDetailsVisible.hidden = false;

    // Tags
    const vulns = getVulns(pw);
    
    // ML prediction (async)
    const mlProb = await predictHumanPattern(pw);
    if (runId !== renderRunId) return;
    if (mlProb !== null && mlProb > 0.85) {
      // If model predicts >85% probability of human pattern, add warning
      vulns.push({ t: t("vMLHuman") + ` (${Math.round(mlProb * 100)}%)`, l: "warn" });
    }
    
    if (isReal(vulnTagsEl)) vulnTagsEl.innerHTML = vulns
      .map(
        (v) =>
          '<span class="vuln-tag ' +
          v.l +
          '" role="status">' +
          (v.l === "critical" ? "⚠ " : v.l === "warn" ? "⚡ " : "✓ ") +
          v.t +
          "</span>",
      )
      .join("");

    // Update quality and pattern badges
    updateQualityBadge(sc);
    updatePatternBadge(vulns);

    // Scenarios
    const all = getScenarios(pw, mlProb);

    // Find FASTEST attack: true minimum across all applicable attacks
    const allFinite = all.filter((r) => r.sec !== null && isFinite(r.sec) && r.sec > 0);
    const fastest = pickFastestScenario(allFinite);

    // Auto-select the algo of the fastest attack so ct-panel matches the banner
    if (fastest && !userPinnedAlgo) {
      const ALGO_KEY_MAP = {
        "MD5": "md5", "SHA-1": "sha1", "SHA-256": "sha256",
        "NTLM": "ntlm",
      };
      const fastestAlgoKey = ALGO_KEY_MAP[fastest.hash] ||
        (fastest.hash.startsWith("bcrypt") ? "bcrypt" : fastest.hash.startsWith("Argon2") ? "argon2" : null);
      if (fastestAlgoKey && fastestAlgoKey !== selectedAlgo) {
        selectedAlgo = fastestAlgoKey;
        if (ctAlgo) ctAlgo.value = fastestAlgoKey;
      }
    }

    // --- FASTEST CARD ---
    const fastSec = fastest ? fastest.sec : 0;
    const fastDur = fmtDuration(fastSec);
    const fastDt = fmtDate(fastSec);

    // Best-attack card (nouvelle carte typographique)
    if (isReal(bestAttackDuration)) {
      bestAttackDuration.textContent = fastest ? fastDur.text : "—";
    }
    if (isReal(bestAttackMeta) && fastest) {
      const guesses = fastest.sec != null && isFinite(fastest.sec) && fastest.rate > 0
        ? Math.round(fastest.sec * fastest.rate)
        : null;
      const triesStr = guesses != null
        ? guesses.toLocaleString(LANG === "fr" ? "fr-FR" : "en-US")
        : "—";
      const methLabel = LANG === "fr" ? "Nombre de tentatives" : "Number of attempts";
      const meth = LANG === "fr" ? "méthode" : "method";
      bestAttackMeta.innerHTML = methLabel + " : <strong>" + triesStr + "</strong> – " + meth + " : <strong>" + fastest.atk + "</strong>";
    } else if (isReal(bestAttackMeta)) {
      bestAttackMeta.textContent = "";
    }

    if (isReal(crackDurationFast)) crackDurationFast.style.color = col;
    if (isReal(crackDateFast)) crackDateFast.style.color = col;

    // Map attack types to methodology anchor IDs
    const attackAnchorMap = {
      [t("aBrute")]: "attack-brute",
      [t("aDict")]: "attack-dict",
      [t("aHybrid")]: "attack-hybrid",
      [t("aRule")]: "attack-rule",
      [t("aPrince")]: "attack-prince",
      [t("aMask")]: "attack-mask",
      [t("aRainbow")]: "attack-rainbow",
      [t("aSpray")]: "attack-spray",
      [t("aTargeted")]: "attack-targeted",
      [t("aMarkov")]: "attack-markov",
      [t("aNeural")]: "attack-neural",
      [t("aPCFG")]: "attack-pcfg",
      [t("aCombi")]: "attack-combi",
      [t("aMorph")]: "attack-morph",
    };
    const fastestAnchor = fastest ? attackAnchorMap[fastest.atk] || "methodology" : "methodology";
    const methodAnchor =
      ' <a href="#' + fastestAnchor + '" class="method-inline-link">' +
      t("methodLink") +
      "</a>";
    const fastestMethodDesc = fastest ? getAttackMethodDescription(fastest.cat) : "";
    const fastestConfidenceText = fastest ? confidenceText(fastest.confidence) : "";

    if (fastDur.instant) {
      if (isReal(resultLabelFast)) resultLabelFast.textContent = fastest
        ? fastest.atk + " — " + fastest.hash
        : "";
      if (isReal(crackDurationFast)) crackDurationFast.textContent = t("lessSec");
      if (isReal(crackDateFast)) crackDateFast.textContent = t("now");
      resultSentenceFast.innerHTML =
        t("instantVia") +
        (fastest ? " via " + fastest.atk + "." : ".") +
        (fastestMethodDesc ? " " + fastestMethodDesc : "") +
        fastestConfidenceText +
        methodAnchor;
    } else if (fastDur.inf || !fastDur.ok) {
      if (isReal(resultLabelFast)) resultLabelFast.textContent = fastest ? fastest.atk + " — " + fastest.hash : t("allAttacks");
      if (isReal(crackDurationFast)) crackDurationFast.textContent = fastDur.text;
      if (isReal(crackDateFast)) crackDateFast.textContent = t("beyondDate");
      if (isReal(resultSentenceFast)) resultSentenceFast.innerHTML = fastest 
        ? t("unreachableFastest").replace("{attack}", "<strong>" + fastest.atk + "</strong>") +
            (fastestMethodDesc ? " " + fastestMethodDesc : "") +
            fastestConfidenceText +
            methodAnchor
        : t("unreachable") + fastestConfidenceText + methodAnchor;
    } else {
      if (isReal(resultLabelFast)) resultLabelFast.textContent = fastest.atk + " — " + fastest.hash;
      if (isReal(crackDurationFast)) crackDurationFast.textContent = fastDur.text;
      if (isReal(crackDateFast)) crackDateFast.textContent = fastDt || t("beyondDate");
      resultSentenceFast.innerHTML =
        t("via") +
        " <strong>" +
        fastest.atk +
        "</strong> — " +
        fastest.hash +
        "." +
        (fastestMethodDesc ? " " + fastestMethodDesc : "") +
        fastestConfidenceText +
        methodAnchor;
    }

    // Professional attacker (100 GPU): ~8× faster than Experienced (12 GPU)
    // Same fastest attack, but time divided by 8
    const proSec = fastest ? fastest.sec / 8 : Infinity;
    const proDur = fmtDuration(proSec);
    const proDt = fmtDate(proSec);

    if (proDur.instant) {
      if (isReal(resultLabelPro)) resultLabelPro.textContent = fastest
        ? fastest.atk + " — " + fastest.hash
        : "";
      if (isReal(crackDurationPro)) crackDurationPro.textContent = t("lessSec");
      if (isReal(crackDatePro)) crackDatePro.textContent = t("now");
      resultSentencePro.innerHTML =
        t("instantVia") +
        (fastest ? " via " + fastest.atk + "." : ".") +
        (fastestMethodDesc ? " " + fastestMethodDesc : "") +
        fastestConfidenceText +
        methodAnchor;
    } else if (proDur.inf || !proDur.ok) {
      if (isReal(resultLabelPro)) resultLabelPro.textContent = fastest ? fastest.atk + " — " + fastest.hash : t("allAttacks");
      if (isReal(crackDurationPro)) crackDurationPro.textContent = proDur.text;
      if (isReal(crackDatePro)) crackDatePro.textContent = t("beyondDate");
      if (isReal(resultSentencePro)) resultSentencePro.innerHTML = fastest 
        ? t("unreachableFastest").replace("{attack}", "<strong>" + fastest.atk + "</strong>") +
            (fastestMethodDesc ? " " + fastestMethodDesc : "") +
            fastestConfidenceText +
            methodAnchor
        : t("unreachable") + fastestConfidenceText + methodAnchor;
    } else {
      if (isReal(resultLabelPro)) resultLabelPro.textContent = fastest.atk + " — " + fastest.hash;
      if (isReal(crackDurationPro)) crackDurationPro.textContent = proDur.text;
      if (isReal(crackDatePro)) crackDatePro.textContent = proDt || t("beyondDate");
      resultSentencePro.innerHTML =
        t("via") +
        " <strong>" +
        fastest.atk +
        "</strong> — " +
        fastest.hash +
        "." +
        (fastestMethodDesc ? " " + fastestMethodDesc : "") +
        fastestConfidenceText +
        methodAnchor;
    }

    renderCtList(all);

    resultsDiv.classList.add("visible");
    resultsDiv.classList.remove("is-empty");
  }

  // ============================================================
  // PASSWORD GENERATOR ACCORDION
  // ============================================================
  const genTrigger      = $("gen-accordion-trigger");
  const genTriggerRow   = $("gen-accordion-trigger-row");
  const genPanel        = $("gen-accordion-panel");
  const genLenRange     = $("gen-len-range");
  const genLenVal       = $("gen-len-val");
  const genWordRow      = $("gen-word-row");
  const genLenRow       = $("gen-len-row");
  const genCharsetRow   = $("gen-charset-row");
  const genWordInput    = $("gen-word-input");
  const genPreviewTxt   = $("gen-preview-text");
  const genPreviewStr   = $("gen-preview-strength");
  const genMaskToggle   = $("gen-mask-toggle");
  const genMaskIcon     = $("gen-mask-icon");
  const genBtnRegen     = $("gen-btn-regen");
  const genBtnUse       = $("gen-btn-use");
  const genMemBadge     = $("gen-mem-badge");
  const genMiniSegs     = [0,1,2,3,4,5].map(i => $("gen-mb"+i));
  const genTypeChips    = document.querySelectorAll(".gen-type-chip");
  const genChkU         = $("gen-chk-u");
  const genChkL         = $("gen-chk-l");
  const genChkD         = $("gen-chk-d");
  const genChkS         = $("gen-chk-s");

  const GEN_CHARS_U = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const GEN_CHARS_L = "abcdefghijklmnopqrstuvwxyz";
  const GEN_CHARS_D = "0123456789";
  const GEN_CHARS_S = "!@#$%^&*()-_=+[]{}|;:,.<>?";
  const GEN_WORDS   = ["correct","horse","battery","staple","tiger","cloud","forest","river","stone","flame","swift","brave","quiet","golden","silver","pixel","nexus","delta","prime","ultra","vivid","noble","solar","lunar","frost","arrow","bloom","chess","drift","ember","flare","grove","haven","ivory","jewel","knack","lance","maple","north","orbit","pearl","quest","raven","sigma","thorn","umbra","vault","waltz","xenon","yield","zephyr"];

  let genSelectedType  = "random";
  let genPendingPw     = "";
  let genPreviewMasked = false;
  let genIsOpen        = false;

  function genRnd(max) {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % max;
  }
  function genShuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = genRnd(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function genRandom(len, u, l, d, s) {
    let pool = "";
    const req = [];
    if (u) { pool += GEN_CHARS_U; req.push(GEN_CHARS_U[genRnd(GEN_CHARS_U.length)]); }
    if (l) { pool += GEN_CHARS_L; req.push(GEN_CHARS_L[genRnd(GEN_CHARS_L.length)]); }
    if (d) { pool += GEN_CHARS_D; req.push(GEN_CHARS_D[genRnd(GEN_CHARS_D.length)]); }
    if (s) { pool += GEN_CHARS_S; req.push(GEN_CHARS_S[genRnd(GEN_CHARS_S.length)]); }
    if (!pool) { pool = GEN_CHARS_L; req.push(GEN_CHARS_L[genRnd(GEN_CHARS_L.length)]); }
    const pw = [...req];
    while (pw.length < len) pw.push(pool[genRnd(pool.length)]);
    return genShuffle(pw).join("");
  }
  function genPassphrase() {
    const w = [];
    for (let i = 0; i < 4; i++) w.push(GEN_WORDS[genRnd(GEN_WORDS.length)]);
    return w.join("-");
  }
  function genWordBased(base) {
    if (!base || base.length < 2) base = GEN_WORDS[genRnd(GEN_WORDS.length)];
    const cap = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
    const num = String(10 + genRnd(90));
    const sym = GEN_CHARS_S[genRnd(GEN_CHARS_S.length)];
    return cap + num + sym;
  }

  function genUpdateRangeFill() {
    if (!genLenRange) return;
    const p = ((genLenRange.value - genLenRange.min) / (genLenRange.max - genLenRange.min)) * 100;
    genLenRange.style.background = `linear-gradient(to right, var(--accent) ${p}%, var(--surface-elev) ${p}%)`;
  }

  function genUpdatePreview() {
    let pw;
    if (genSelectedType === "random") {
      pw = genRandom(+genLenRange.value, genChkU.checked, genChkL.checked, genChkD.checked, genChkS.checked);
    } else if (genSelectedType === "passphrase") {
      pw = genPassphrase();
    } else {
      pw = genWordBased(genWordInput ? genWordInput.value.trim() : "");
    }
    genPendingPw = pw;

    genPreviewTxt.className = "gen-pw-preview-text";
    if (genPreviewMasked) genPreviewTxt.classList.add("masked");
    genPreviewTxt.textContent = pw;

    let cs = 0;
    if (/[a-z]/.test(pw)) cs += 26;
    if (/[A-Z]/.test(pw)) cs += 26;
    if (/[0-9]/.test(pw)) cs += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) cs += 32;
    const bits = Math.log2(Math.pow(cs || 1, pw.length));
    const lvl = bits < 28 ? 0 : bits < 45 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : bits < 120 ? 4 : 5;
    const colors = ["var(--critical)","var(--danger)","var(--warning)","var(--success)","var(--excellent)","var(--exceptional)"];
    const miniColors = ["var(--critical)","var(--danger)","var(--warning)","var(--success)","var(--excellent)","var(--exceptional)"];
    if (genPreviewStr) {
      genPreviewStr.textContent = Math.round(bits) + " bits";
      genPreviewStr.style.color = colors[lvl];
    }
    genMiniSegs.forEach((seg, i) => {
      if (!seg) return;
      seg.style.background = i <= lvl ? miniColors[i] : "var(--surface-elev)";
    });

    if (genBtnUse) genBtnUse.disabled = false;
    if (genMemBadge) genMemBadge.hidden = false;
  }

  function genOpen() {
    genIsOpen = true;
    if (genTrigger) genTrigger.setAttribute("aria-expanded", "true");
    if (genTriggerRow) genTriggerRow.classList.add("open");
    if (genPanel) genPanel.classList.add("open");
    genUpdatePreview();
  }
  function genClose() {
    genIsOpen = false;
    if (genTrigger) genTrigger.setAttribute("aria-expanded", "false");
    if (genTriggerRow) genTriggerRow.classList.remove("open");
    if (genPanel) genPanel.classList.remove("open");
  }

  if (genTrigger) {
    genTrigger.addEventListener("click", () => {
      if (genIsOpen) genClose(); else genOpen();
    });
  }

  genTypeChips.forEach(btn => {
    btn.addEventListener("click", () => {
      genSelectedType = btn.dataset.genType;
      genTypeChips.forEach(b => b.classList.toggle("active", b === btn));
      const isRand   = genSelectedType === "random";
      const isPhrase = genSelectedType === "passphrase";
      const isWord   = genSelectedType === "word-based";
      if (genLenRow)     genLenRow.hidden     = isPhrase;
      if (genCharsetRow) genCharsetRow.hidden = !isRand;
      if (genWordRow)    genWordRow.hidden     = !isWord;
      genUpdatePreview();
    });
  });

  if (genLenRange) {
    genLenRange.addEventListener("input", () => {
      if (genLenVal) genLenVal.textContent = genLenRange.value;
      genUpdateRangeFill();
      genUpdatePreview();
    });
    genUpdateRangeFill();
  }

  [genChkU, genChkL, genChkD, genChkS].forEach(chk => {
    if (!chk) return;
    chk.addEventListener("change", () => {
      chk.closest(".gen-cs-chip").classList.toggle("active", chk.checked);
      genUpdatePreview();
    });
  });

  if (genWordInput) genWordInput.addEventListener("input", genUpdatePreview);

  if (genBtnRegen) {
    genBtnRegen.addEventListener("click", () => {
      genBtnRegen.classList.add("spinning");
      setTimeout(() => genBtnRegen.classList.remove("spinning"), 400);
      genUpdatePreview();
    });
  }

  if (genMaskToggle) {
    genMaskToggle.addEventListener("click", () => {
      genPreviewMasked = !genPreviewMasked;
      if (genPreviewTxt) genPreviewTxt.classList.toggle("masked", genPreviewMasked);
      const eyeOpen   = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
      const eyeClosed = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
      if (genMaskIcon) genMaskIcon.innerHTML = genPreviewMasked ? eyeClosed : eyeOpen;
    });
  }

  if (genBtnUse) {
    genBtnUse.addEventListener("click", () => {
      if (!genPendingPw) return;
      input.value = genPendingPw;
      input.type = "text";
      const textSpanToggle = toggleBtn.querySelector("span");
      if (textSpanToggle) textSpanToggle.textContent = t("hide");
      toggleBtn.setAttribute("aria-label", t("hideAria"));
      clearTimeout(timer);
      genClose();
      render();
      input.focus();
    });
  }

  // Reset
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      input.value = "";
      input.type = "password";
      const textSpan = toggleBtn.querySelector("span");
      if (textSpan) textSpan.textContent = t("show");
      toggleBtn.setAttribute("aria-label", t("showAria"));

      // Cancel pending renders/checks and force a fresh empty-state render
      clearTimeout(timer);
      userPinnedAlgo = false;
      selectedAlgo = "sha256";
      if (ctAlgo) ctAlgo.value = "sha256";
      if (hibpAbort) hibpAbort.abort();
      clearTimeout(hibpDebounce);
      lastCheckedPw = "";

      render();
      input.focus();
    });
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.preventDefault();
  });
  window.addEventListener("beforeunload", () => {
    input.value = "";
  });

  // ============================================================
  // CHARACTER PREVIEW (brief reveal on type)
  // ============================================================
  const charPreview = safe('char-preview');
  let previewTimeout = null;
  let lastLength = 0;

  if (charPreview) {
    input.addEventListener('input', (e) => {
      // Only show preview when typing (not deleting) and input is password type
      if (input.type === 'password' && input.value.length > lastLength) {
        const lastChar = input.value[input.value.length - 1];
        
        // Clear previous timeout
        if (previewTimeout) {
          clearTimeout(previewTimeout);
        }
        
        // Show the character
        charPreview.textContent = lastChar;
        charPreview.classList.add('show');
        
        // Hide after 600ms
        previewTimeout = setTimeout(() => {
          charPreview.classList.remove('show');
          setTimeout(() => {
            charPreview.textContent = '';
          }, 150);
        }, 600);
      } else {
        // Hide immediately when deleting or password is visible
        charPreview.classList.remove('show');
        charPreview.textContent = '';
      }
      
      lastLength = input.value.length;
    });
  }

  // ============================================================
  // INFO TOOLTIP
  // ============================================================
  const tooltipTrigger = document.querySelector('.info-tooltip-trigger');
  const tooltip = safe('speed-tooltip');
  
  if (tooltipTrigger && tooltip) {
    let isTooltipVisible = false;
    tooltipTrigger.setAttribute("aria-expanded", "false");
    
    // Show tooltip on click
    tooltipTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      isTooltipVisible = !isTooltipVisible;
      tooltip.hidden = !isTooltipVisible;
      tooltipTrigger.setAttribute('aria-expanded', isTooltipVisible);
    });
    
    // Hide tooltip when clicking outside
    document.addEventListener('click', (e) => {
      if (isTooltipVisible && !tooltip.contains(e.target) && e.target !== tooltipTrigger) {
        isTooltipVisible = false;
        tooltip.hidden = true;
        tooltipTrigger.setAttribute('aria-expanded', 'false');
      }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isTooltipVisible) {
        isTooltipVisible = false;
        tooltip.hidden = true;
        tooltipTrigger.setAttribute('aria-expanded', 'false');
        tooltipTrigger.focus();
      }
    });
  }

  // ============================================================
  // PASSWORD GENERATOR
  // ============================================================
  function generateSecurePassword(length = 16) {
    length = Math.max(4, length | 0);

    function randomIndex(maxExclusive) {
      if (maxExclusive <= 1) return 0;
      const maxUint32 = 0x100000000;
      const threshold = maxUint32 - (maxUint32 % maxExclusive);
      const buf = new Uint32Array(1);
      let value;
      do {
        crypto.getRandomValues(buf);
        value = buf[0];
      } while (value >= threshold);
      return value % maxExclusive;
    }

    // Use cryptographically secure random values
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[randomIndex(lowercase.length)];
    password += uppercase[randomIndex(uppercase.length)];
    password += numbers[randomIndex(numbers.length)];
    password += symbols[randomIndex(symbols.length)];
    
    // Fill the rest with random characters
    for (let i = 4; i < length; i++) {
      password += allChars[randomIndex(allChars.length)];
    }
    
    // Shuffle with Fisher-Yates to avoid sort comparator bias
    const chars = password.split('');
    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1);
      const tmp = chars[i];
      chars[i] = chars[j];
      chars[j] = tmp;
    }
    
    return chars.join('');
  }

  // Test button (currently just triggers analysis, password is analyzed on input)
  // Initialize: hide strength label on page load
  if (isReal(barLabel)) barLabel.style.display = "none";

  // Strength info tooltip toggle
  if (isReal(strengthInfoBtn) && isReal(strengthTooltip)) {
    strengthInfoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      strengthTooltip.hidden = !strengthTooltip.hidden;
    });

    // Close tooltip when clicking outside
    document.addEventListener('click', (e) => {
      if (!strengthInfoBtn.contains(e.target) && !strengthTooltip.contains(e.target)) {
        strengthTooltip.hidden = true;
      }
    });
  }

  // Copy button
  if (isReal(copyBtn)) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(input.value);

        // Visual feedback - change aria-label since no visible text
        copyBtn.classList.add('copied');
        const originalLabel = copyBtn.getAttribute('aria-label');
        copyBtn.setAttribute('aria-label', t('copied'));

        // Reset after 2 seconds
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.setAttribute('aria-label', originalLabel);
      }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });
  }

  // Hide copy button when user types
  input.addEventListener('input', () => {
    copyBtn.hidden = true;
  });

  // No ML model cleanup needed (vanilla JS uses native GC)

  // Tab switching logic
  attackerTabsNodes.forEach(tab => {
    tab.addEventListener("click", () => {
      // Remove active state from all tabs and wrappers
      attackerTabsNodes.forEach(t => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
        t.parentElement.classList.remove("is-active");
      });
      // Add active state to clicked tab and wrapper
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      if (tab.parentElement) tab.parentElement.classList.add("is-active");

      // Hide all panels
      document.querySelectorAll(".attacker-panel").forEach(p => {
        p.hidden = true;
      });
      // Show selected panel
      const panelId = tab.getAttribute("aria-controls");
      const panel = safe(panelId);
      if (panel) panel.hidden = false;
    });
  });

  // Bloom filter check button listener (legacy button + new badge)
  const bloomBtn = $("bloom-check-btn");
  if (bloomBtn) {
    bloomBtn.addEventListener("click", () => loadBloomFilter());
  }
  const rockyouBadgeBtn = $("rockyou-status-badge");
  if (rockyouBadgeBtn) {
    rockyouBadgeBtn.addEventListener("click", () => {
      if (!BLOOM_LOADED && !BLOOM_LOADING) loadBloomFilter();
    });
  }
  } // End of: if (input) block

  // Initialize i18n and load dictionary on page load
  // ML model is lazy-loaded when first password is entered (saves ~600KB initial load)
  if (input) {
    setLang(LANG);
    loadDictionary(LANG); // Load in background, don't block initialization
    loadPcfgCalibration();
    loadMarkovCalibration();
    loadNeuralCalibration();
    loadPrinceCalibration();
    render(); // Keep layout fully visible even with empty input
  }
  }); // End DOMContentLoaded
})();
