// ============================================================
// STATE & HELPERS
// ============================================================

const SUPPORTED_LANGS = ["en", "fr", "es", "pt", "de", "it", "tr", "pl", "nl"];

const safe = (id) => document.getElementById(id);
const isReal = (el) => el !== null && el !== undefined;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function detectBrowserLanguage() {
  const browserLang = (navigator.language || navigator.userLanguage || "en")
    .split("-")[0]
    .toLowerCase();
  return SUPPORTED_LANGS.includes(browserLang) ? browserLang : "en";
}

const state = {
  // Language & Detection
  lang: "en",
  browserLang: detectBrowserLanguage(),

  // Password input
  password: "",

  // DOM Elements (queried once at init, then cached)
  dom: {
    input: null,
    toggleVisibility: null,
    results: null,
    resultLabelFast: null,
    crackDurationFast: null,
    crackDateFast: null,
    resultSentenceFast: null,
    strengthLabel: null,
    strengthIcon: null,
    strengthBits: null,
    barWrapper: null,
    barLabel: null,
    strengthSegments: [],
    ctList: null,
    ctFastestValue: null,
    ctAlgo: null,
    vulnTagsEl: null,
    liveDetailsVisible: null,
    detailLengthLive: null,
    detailCharsetLive: null,
    detailEntropyLive: null,
    detailCombosLive: null,
    langToggle: null,
    langSelector: null,
    langMenu: null,
    langCode: null,
    dictLoading: null,
    resetBtn: null,
    copyBtn: null,
    genAccordionTrigger: null,
    genPanel: null,
    hibpLoading: null,
    hibpCount: null,
    hibpBanner: null,
  },

  // Data caches
  cache: {
    dictWords: null,
    dictLang: null,
    bloomFilter: null,
    bloomResult: null,
    ml: {
      session: null,
      normalization: null,
    },
    calibrations: {
      pcfg: null,
      markov: null,
      neural: null,
      prince: null,
    },
  },

  // UI State
  ui: {
    isPending: false,
    debounceTimer: null,
    showPassword: false,
    dictLoading: false,
    dictPendingLang: null,
    bloomLoaded: false,
    bloomLoading: false,
    pcfgCalibLoading: false,
    markovCalibLoading: false,
    neuralCalibLoading: false,
    princeCalibLoading: false,
    mlRuntimeLoaded: false,
    selectedAlgo: "md5",
    selectedProfile: "experienced",
    userPinnedAlgo: false,
    langMenuOpen: false,
  },

  // Analysis results
  results: {
    password: "",
    score: 0,
    entropy: 0,
    charset: { size: 0, description: "" },
    scenarios: [],
    mlProbability: null,
    mlConfidence: null,
    vulns: [],
    hibpHit: false,
    hibpCount: 0,
  },

  // Translations (loaded from I[lang])
  i18n: {},
};
