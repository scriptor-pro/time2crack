// ============================================================
// TIME2CRACK - APP.JS
// Combined entry point from modular components
// ============================================================

(function() {
  "use strict";

  // ============================================================
  // 1. STATE & HELPERS (from state.js)
  // ============================================================

  const safe = (id) => document.getElementById(id);
  const isReal = (el) => el !== null && el !== undefined;

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function detectBrowserLanguage() {
    const SUPPORTED_LANGS = ["en", "fr", "es", "pt", "de", "it", "tr", "pl", "nl"];
    const browserLang = (navigator.language || navigator.userLanguage || "en")
      .split("-")[0]
      .toLowerCase();
    return SUPPORTED_LANGS.includes(browserLang) ? browserLang : "en";
  }

  const state = {
    lang: "en",
    browserLang: detectBrowserLanguage(),
    password: "",
    dom: {
      input: null,
      toggleVisibility: null,
      results: null,
      strengthLabel: null,
      strengthIcon: null,
      strengthBits: null,
      barWrapper: null,
      barLabel: null,
      strengthSegments: [],
      ctList: null,
      vulnTagsEl: null,
      langToggle: null,
      langMenu: null,
      dictLoading: null,
      resetBtn: null,
      copyBtn: null,
      hibpLoading: null,
      hibpCount: null,
      hibpBanner: null,
    },
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
    },
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
    i18n: {},
  };

  // ============================================================
  // 2. INCLUDE ALL MODULE CONTENT HERE (will be injected by build)
  // ============================================================
  // Placeholder for modular content
  // Build script will inject:
  // - I18N (translations)
  // - CONSTANTS (ALGOS, COMMON, etc)
  // - ANALYSIS (functions)
  // - ATTACKS (functions)
  // - ML (functions)
  // - DICTIONARY (functions)
  // - CALIBRATIONS (functions)
  // - HIBP (functions)
  // - RENDER (function)
  // - INIT (functions & initialization)

})();
