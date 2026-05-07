// app-entry.js — Entry point for bundling the calculation engine
// This imports all modules and makes them available in the browser

import { calcCrackTime, ALGORITHMS, initMarkov, initPCFG } from "./core/calc.js";
import { rankToSeconds } from "./core/time.js";
import { AppConfig } from "./config.js";
import { cacheGet, cachePut } from "./core/idb-cache.js";

// Make everything available globally for the rest of the app code
// The rest of the minified app code expects these to be importable
// So we export them to make them part of the bundle

export { calcCrackTime, ALGORITHMS, initMarkov, initPCFG, rankToSeconds, AppConfig, cacheGet, cachePut };
