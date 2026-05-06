/**
 * Browser language detection for Time2Crack
 * Redirects to appropriate language version based on navigator.language
 * Respects user's previous choice stored in localStorage
 */

(function() {
  const SUPPORTED_LANGS = ['fr', 'en', 'es', 'pt', 'de', 'it', 'tr', 'pl', 'nl'];
  const DEFAULT_LANG = 'en';
  const STORAGE_KEY = 'time2crack-lang';

  // Only run on root or legacy pages (not on language-specific paths)
  const pathname = window.location.pathname;
  const isLanguagePath = SUPPORTED_LANGS.some(lang =>
    pathname.startsWith(`/${lang}/`) || pathname.startsWith(`/${lang}?`)
  );

  // Don't redirect if already on a language-specific path
  if (isLanguagePath) {
    return;
  }

  // Check if user has a saved language preference
  const savedLang = localStorage.getItem(STORAGE_KEY);
  if (savedLang && SUPPORTED_LANGS.includes(savedLang) && savedLang !== DEFAULT_LANG) {
    window.location.href = `/${savedLang}/`;
    return;
  }

  // Detect browser language
  const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();

  // Extract primary language code (e.g., 'fr' from 'fr-CA')
  const primaryLang = browserLang.split('-')[0];

  // If supported and not default, redirect
  if (primaryLang && SUPPORTED_LANGS.includes(primaryLang) && primaryLang !== DEFAULT_LANG) {
    localStorage.setItem(STORAGE_KEY, primaryLang);
    window.location.href = `/${primaryLang}/`;
  }
})();
