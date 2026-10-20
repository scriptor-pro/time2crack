/**
 * Browser language detection for Time2Crack
 * Redirects to appropriate language version based on navigator.language
 * Respects user's previous choice stored in localStorage
 */

(function() {
  const SUPPORTED_LANGS = ['fr', 'en', 'es', 'pt', 'de', 'it', 'tr', 'pl', 'nl'];
  const DEFAULT_LANG = 'en';
  const STORAGE_KEY = 'time2crack-lang';

  // Compute base path to support both custom domains (/) and GitHub Pages (/repo/)
  const pathname = window.location.pathname;
  const langMatch = pathname.match(/^(.*?\/)((?:fr|en|es|pt|de|it|tr|pl|nl)\/)/);
  const basePath = langMatch
    ? langMatch[1]
    : pathname.replace(/\/[^/]*$/, '/').replace(/\/$/, '') + '/';

  const isLanguagePath = SUPPORTED_LANGS.some(lang =>
    pathname.includes(`/${lang}/`) || pathname.includes(`/${lang}?`)
  );

  // Don't redirect if already on a language-specific path
  if (isLanguagePath) {
    return;
  }

  // Don't redirect if on static documentation pages (methode, sources, etc.)
  if (pathname.includes('/methode/') || pathname.includes('/sources')) {
    return;
  }

  // Check if user has a saved language preference
  const savedLang = localStorage.getItem(STORAGE_KEY);
  if (savedLang && SUPPORTED_LANGS.includes(savedLang) && savedLang !== DEFAULT_LANG) {
    window.location.href = `${basePath}${savedLang}/`;
    return;
  }

  // Detect browser language
  const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();

  // Extract primary language code (e.g., 'fr' from 'fr-CA')
  const primaryLang = browserLang.split('-')[0];

  // If supported and not default, redirect
  if (primaryLang && SUPPORTED_LANGS.includes(primaryLang) && primaryLang !== DEFAULT_LANG) {
    localStorage.setItem(STORAGE_KEY, primaryLang);
    window.location.href = `${basePath}${primaryLang}/`;
  }
})();
