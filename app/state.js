// ============================================================
// STATE & HELPERS
// ============================================================

const SUPPORTED_LANGS = ["en", "fr", "es", "pt", "de", "it", "tr", "pl", "nl"];

const safe = (id) => document.getElementById(id);
const isReal = (el) => el !== null && el !== undefined;

function initializeDOMElements() {
  state.dom.input = safe("password-input");
  state.dom.toggleVisibility = safe("toggle-visibility");
  state.dom.results = safe("results");
  state.dom.resultLabelFast = safe("result-label-fast");
  state.dom.crackDurationFast = safe("crack-duration-fast");
  state.dom.crackDateFast = safe("crack-date-fast");
  state.dom.resultSentenceFast = safe("result-sentence-fast");
  state.dom.strengthLabel = safe("strength-label");
  state.dom.strengthIcon = safe("strength-icon");
  state.dom.strengthBits = safe("strength-bits");
  state.dom.barWrapper = document.querySelector(".strength-bar-wrapper");
  state.dom.barLabel = state.dom.strengthIcon ? state.dom.strengthIcon.parentElement : null;
  state.dom.strengthSegments = Array.from(document.querySelectorAll(".strength-bar-segments .segment"));
  state.dom.ctList = safe("ct-list");
  state.dom.ctFastestValue = safe("ct-fastest-value");
  state.dom.ctAlgo = safe("ct-algo");
  state.dom.vulnTagsEl = safe("vuln-tags");
  state.dom.liveDetailsVisible = safe("live-details-visible");
  state.dom.detailLengthLive = safe("detail-length-live");
  state.dom.detailCharsetLive = safe("detail-charset-live");
  state.dom.detailEntropyLive = safe("detail-entropy-live");
  state.dom.detailCombosLive = safe("detail-combos-live");
  state.dom.langToggle = safe("lang-toggle");
  state.dom.langSelector = document.querySelector(".lang-selector");
  state.dom.langMenu = safe("lang-menu");
  state.dom.langCode = safe("lang-code");
  state.dom.dictLoading = safe("dict-loading");
  state.dom.resetBtn = safe("reset-btn");
  state.dom.copyBtn = safe("copy-btn");
  state.dom.genAccordionTrigger = safe("gen-accordion-trigger");
  state.dom.genPanel = safe("gen-accordion-panel");
  state.dom.hibpLoading = safe("hibp-loading");
  state.dom.hibpCount = safe("hibp-count");
  state.dom.hibpBanner = safe("hibp-banner");
  // Additional elements
  state.dom.crackDatePro = safe("crack-date-pro");
  state.dom.crackDurationPro = safe("crack-duration-pro");
  state.dom.resultLabelPro = safe("result-label-pro");
  state.dom.resultSentencePro = safe("result-sentence-pro");
  state.dom.characterAnalysis = safe("character-analysis");
  state.dom.characterAnalysisWrapper = safe("character-analysis-wrapper");
  state.dom.characterAnalysisLive = safe("character-analysis-live");
  state.dom.characterAnalysisLiveWrapper = safe("character-analysis-live-wrapper");
  state.dom.bloomBanner = safe("bloom-banner");
  state.dom.bloomSafe = safe("bloom-safe");
  state.dom.bloomError = safe("bloom-error");
  state.dom.bloomLoading = safe("bloom-loading");
  state.dom.bloomTrigger = safe("bloom-trigger");
  state.dom.bloomSection = safe("bloom-section");
  state.dom.bloomCheckBtn = safe("bloom-check-btn");
  state.dom.strengthInfoBtn = safe("strength-info-btn");
  state.dom.strengthTooltip = safe("strength-tooltip");
  state.dom.attackerFrame = safe("attacker-frame");
  state.dom.attackerTabsNodes = Array.from(document.querySelectorAll(".attacker-tab"));
  // Password generator
  state.dom.genLenRange = safe("gen-len-range");
  state.dom.genLenVal = safe("gen-len-val");
  state.dom.genWordInput = safe("gen-word-input");
  state.dom.genPreviewText = safe("gen-preview-text");
  state.dom.genPreviewStrength = safe("gen-preview-strength");
  state.dom.genMaskToggle = safe("gen-mask-toggle");
  state.dom.genMaskIcon = safe("gen-mask-icon");
  state.dom.genBtnRegen = safe("gen-btn-regen");
  state.dom.genBtnUse = safe("gen-btn-use");
  state.dom.genMemBadge = safe("gen-mem-badge");
  state.dom.genMiniSegs = [0,1,2,3,4,5].map(i => safe("gen-mb"+i)).filter(isReal);
  state.dom.genTypeChips = Array.from(document.querySelectorAll(".gen-type-chip"));
  state.dom.genChkU = safe("gen-chk-u");
  state.dom.genChkL = safe("gen-chk-l");
  state.dom.genChkD = safe("gen-chk-d");
  state.dom.genChkS = safe("gen-chk-s");
}

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
    // Password analysis & results
    crackDatePro: null,
    crackDurationPro: null,
    resultLabelPro: null,
    resultSentencePro: null,
    // Character analysis
    characterAnalysis: null,
    characterAnalysisWrapper: null,
    characterAnalysisLive: null,
    characterAnalysisLiveWrapper: null,
    // Bloom filter UI
    bloomBanner: null,
    bloomSafe: null,
    bloomError: null,
    bloomLoading: null,
    bloomTrigger: null,
    bloomSection: null,
    bloomCheckBtn: null,
    // Password strength tooltip
    strengthInfoBtn: null,
    strengthTooltip: null,
    // Attacker tabs
    attackerFrame: null,
    attackerTabsNodes: [],
    // Password generator
    genLenRange: null,
    genLenVal: null,
    genWordInput: null,
    genPreviewText: null,
    genPreviewStrength: null,
    genMaskToggle: null,
    genMaskIcon: null,
    genBtnRegen: null,
    genBtnUse: null,
    genMemBadge: null,
    genMiniSegs: [],
    genTypeChips: [],
    genChkU: null,
    genChkL: null,
    genChkD: null,
    genChkS: null,
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
