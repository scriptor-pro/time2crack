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
