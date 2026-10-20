// config.js — Centralized application state & configuration
// Allows modules to access LANG, DICT_WORDS, etc. without global variables

export const AppConfig = {
  // Language state
  lang: localStorage.getItem('time2crack-lang') || 'fr',
  dictLang: null,
  dictLoading: false,
  dictWords: null,

  // Model loading state
  markovLoaded: false,
  pcfgLoaded: false,
  modelsLoading: null,

  // Helper to update language
  setLanguage(newLang) {
    this.lang = newLang;
    localStorage.setItem('time2crack-lang', newLang);
    document.documentElement.lang = newLang;
  },

  // Helper to update dictionary
  setDictionary(words, lang) {
    this.dictWords = words;
    this.dictLang = lang;
  },
};

// Expose to window for DevTools debugging
window.AppConfig = AppConfig;
