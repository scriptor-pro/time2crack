// ============================================================
// MULTILINGUAL WORDLISTS
// ============================================================
const WORDLISTS_BASE_URL =
  window.TIME2CRACK_WORDLISTS_BASE_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "data/wordlists/"
    : "https://time2crack.b-cdn.net/data/wordlists/");

async function loadDictionary(lang) {
  if (state.cache.dictLang === lang && state.cache.dictWords) return;
  if (state.ui.dictLoading) {
    state.ui.dictPendingLang = lang;
    return;
  }
  state.ui.dictLoading = true;
  state.ui.dictPendingLang = null;

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
    if (state.cache.dictWords) {
      state.cache.dictWords.clear();
    }

    state.cache.dictWords = new Set(
      text.split("\n")
          .map(w => w.normalize("NFC").trim().toLowerCase())
          .filter(w => w.length >= 4)
    );
    state.cache.dictLang = lang;
  } catch {
    state.cache.dictWords = null; // silently fail
  } finally {
    state.ui.dictLoading = false;

    // Hide loading indicator
    if (dictLoadingEl) {
      dictLoadingEl.hidden = true;
    }

    if (state.ui.dictPendingLang && state.ui.dictPendingLang !== state.cache.dictLang) {
      const nextLang = state.ui.dictPendingLang;
      state.ui.dictPendingLang = null;
      loadDictionary(nextLang);
    }

    if (state.dom.input && state.dom.input.value.length) render(state);
  }
}
