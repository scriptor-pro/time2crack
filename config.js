// config.js — Centralized application state & configuration
// Allows modules to access LANG, DICT_WORDS, etc. without global variables

const SUPPORTED_LANGS = ['fr', 'en', 'es', 'pt', 'de', 'it', 'tr', 'pl', 'nl'];

// The page's own language wins: /xx/ path prefix, else the authored <html lang> (root = en).
// The stored preference only applies when the page declares nothing usable.
function detectPageLang() {
  const prefix = window.location.pathname.split('/').filter(Boolean)[0];
  if (SUPPORTED_LANGS.includes(prefix)) return prefix;
  const htmlLang = document.documentElement.lang;
  if (SUPPORTED_LANGS.includes(htmlLang)) return htmlLang;
  return localStorage.getItem('time2crack-lang') || 'en';
}

export const AppConfig = {
  // Language state
  lang: detectPageLang(),
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
