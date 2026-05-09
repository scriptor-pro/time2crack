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

