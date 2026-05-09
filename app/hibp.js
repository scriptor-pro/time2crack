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
  if (state.ui.bloomLoading || state.ui.bloomLoaded) return;
  state.ui.bloomLoading = true;

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

    state.cache.bloomFilter = { bitArray, m, k };
    state.ui.bloomLoaded = true;

    // Check current password if one is entered
    if (state.dom.input && state.dom.input.value.length) {
      checkBloom(state.dom.input.value);
    }
    updateBloomBanner(state.cache.bloomResult);
  } catch (e) {
    console.error("Failed to load bloom filter:", e);
    state.cache.bloomResult = "error";
    state.ui.bloomLoaded = false; // allow retry
    updateBloomBanner("error");
  } finally {
    state.ui.bloomLoading = false;
    if (bloomLoadingEl) bloomLoadingEl.hidden = true;
    if (bloomBtnEl) bloomBtnEl.disabled = false;
    // Don't hide bloom-trigger here — render() controls visibility
  }
}

/**
 * Check password against loaded bloom filter
 */
function checkBloom(pw) {
  if (!state.cache.bloomFilter || !pw) return;
  const found = bloomHas(state.cache.bloomFilter, pw);
  state.cache.bloomResult = found ? "found" : "not_found";
  updateBloomBanner(state.cache.bloomResult);
}

/**
 * Update bloom filter UI banners based on state
 */
function updateBloomBanner(bloomResult) {
  const bannerEl = safe("bloom-banner");
  const safeEl = safe("bloom-safe");
  const errorEl = safe("bloom-error");

  if (bannerEl) bannerEl.hidden = bloomResult !== "found";
  if (safeEl) safeEl.hidden = bloomResult !== "not_found";
  if (errorEl) errorEl.hidden = bloomResult !== "error";
}