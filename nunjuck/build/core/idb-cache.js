// core/idb-cache.js
// Minimal IndexedDB wrapper — get / put / clear
// DB name: 'time2crack', object store: 'cache', keyPath: none (out-of-line keys)
// DB_VERSION bumped → all cached data is discarded and re-fetched automatically.

const DB_NAME    = 'time2crack';
const STORE_NAME = 'cache';
const DB_VERSION = 1; // Bump this when wordlists or models change incompatibly

// ──────────────────────────────────────────────────────────────────────────────
// INVALIDATION DE CACHE
// Pour forcer le re-téléchargement de tous les dictionnaires et modèles
// (ex: mise à jour d'un wordlist), incrémenter DB_VERSION ci-dessus.
// Le navigateur détecte la version différente, supprime et recrée le store,
// ce qui force un re-fetch au prochain chargement.
// ──────────────────────────────────────────────────────────────────────────────

let _dbPromise = null;

function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      // Drop old store if exists (handles version upgrades)
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }
      db.createObjectStore(STORE_NAME);
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
  return _dbPromise;
}

/**
 * Retrieve a cached value by key. Returns `null` if not found.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export async function cacheGet(key) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req   = store.get(key);
      req.onsuccess = (e) => resolve(e.target.result ?? null);
      req.onerror   = (e) => reject(e.target.error);
    });
  } catch {
    return null; // IndexedDB unavailable (private browsing, quota exceeded) → graceful fallback
  }
}

/**
 * Store a value under key.
 * @param {string} key
 * @param {any}    value
 * @returns {Promise<void>}
 */
export async function cachePut(key, value) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req   = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror   = (e) => reject(e.target.error);
    });
  } catch {
    // Silently swallow write errors (quota exceeded, private mode)
  }
}

/**
 * Clear all cached entries (useful for testing / forced refresh).
 * @returns {Promise<void>}
 */
export async function cacheClear() {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req   = store.clear();
      req.onsuccess = () => resolve();
      req.onerror   = (e) => reject(e.target.error);
    });
  } catch {
    // Silently swallow
  }
}
