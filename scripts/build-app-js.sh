#!/bin/bash
# Build script: combines modular app/ components into a single IIFE app.js

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$PROJECT_ROOT/app"
OUTPUT="$PROJECT_ROOT/app.js"

echo "Building app.js from modular components..."

# Create temporary file for concatenation
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

# Start IIFE wrapper
cat > "$TEMP_FILE" << 'HEADER'
(function() {
  "use strict";

  // ============================================================
  // TIME2CRACK - COMBINED APP.JS
  // Built from modular components
  // ============================================================

HEADER

# 1. STATE & HELPERS
echo "// ============================================================" >> "$TEMP_FILE"
echo "// 1. STATE & HELPERS" >> "$TEMP_FILE"
echo "// ============================================================" >> "$TEMP_FILE"
grep -v "^// ===" "$APP_DIR/state.js" | grep -v "^$" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# 1B. INITIALIZE DOM & CREATE LOCAL ALIASES
echo "// ============================================================" >> "$TEMP_FILE"
echo "// 1B. INITIALIZE DOM ELEMENTS" >> "$TEMP_FILE"
echo "// ============================================================" >> "$TEMP_FILE"
cat >> "$TEMP_FILE" << 'INIT_DOM'
// Initialize DOM elements and create local aliases for shared scope
initializeDOMElements();

// Create local aliases for backward compatibility throughout the app
const input = state.dom.input;
const resultsDiv = state.dom.results;
const resetBtn = state.dom.resetBtn;
const strengthSegments = state.dom.strengthSegments;
const barLabel = state.dom.barLabel;
const strengthLabel = state.dom.strengthLabel;
const strengthIcon = state.dom.strengthIcon;
const strengthBits = state.dom.strengthBits;
const barWrapper = state.dom.barWrapper;
const detailLengthLive = state.dom.detailLengthLive;
const detailCharsetLive = state.dom.detailCharsetLive;
const detailEntropyLive = state.dom.detailEntropyLive;
const detailCombosLive = state.dom.detailCombosLive;
const liveDetailsVisible = state.dom.liveDetailsVisible;
const resultLabelFast = state.dom.resultLabelFast;
const crackDurationFast = state.dom.crackDurationFast;
const crackDateFast = state.dom.crackDateFast;
const resultSentenceFast = state.dom.resultSentenceFast;
const resultLabelPro = state.dom.resultLabelPro;
const crackDurationPro = state.dom.crackDurationPro;
const crackDatePro = state.dom.crackDatePro;
const resultSentencePro = state.dom.resultSentencePro;
const ctList = state.dom.ctList;
const ctAlgo = state.dom.ctAlgo;
const vulnTagsEl = state.dom.vulnTagsEl;
const attackerFrame = state.dom.attackerFrame;
const attackerTabsNodes = state.dom.attackerTabsNodes;
const copyBtn = state.dom.copyBtn;
const strengthInfoBtn = state.dom.strengthInfoBtn;
const strengthTooltip = state.dom.strengthTooltip;

// Generator elements
const genTrigger = state.dom.genAccordionTrigger;
const genPanel = state.dom.genPanel;
const genLenRange = state.dom.genLenRange;
const genLenVal = state.dom.genLenVal;
const genWordInput = state.dom.genWordInput;
const genPreviewTxt = state.dom.genPreviewText;
const genPreviewStr = state.dom.genPreviewStrength;
const genMaskToggle = state.dom.genMaskToggle;
const genMaskIcon = state.dom.genMaskIcon;
const genBtnRegen = state.dom.genBtnRegen;
const genBtnUse = state.dom.genBtnUse;
const genMemBadge = state.dom.genMemBadge;
const genMiniSegs = state.dom.genMiniSegs;
const genTypeChips = state.dom.genTypeChips;
const genChkU = state.dom.genChkU;
const genChkL = state.dom.genChkL;
const genChkD = state.dom.genChkD;
const genChkS = state.dom.genChkS;

// Local variables for state management (shared scope)
let timer;
let renderRunId = 0;
let hibpDebounce;
let lastCheckedPw = "";
let hibpAbort;

// Placeholder render function (will be defined in render.js)
let render = () => {};
INIT_DOM
echo "" >> "$TEMP_FILE"

# 2. I18N
echo "// ============================================================" >> "$TEMP_FILE"
echo "// 2. I18N (TRANSLATIONS)" >> "$TEMP_FILE"
echo "// ============================================================" >> "$TEMP_FILE"
grep -v "^// ===" "$APP_DIR/i18n.js" | grep -v "^$" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# 3. CONSTANTS
echo "// ============================================================" >> "$TEMP_FILE"
echo "// 3. CONSTANTS & CALIBRATION DATA" >> "$TEMP_FILE"
echo "// ============================================================" >> "$TEMP_FILE"
grep -v "^// ===" "$APP_DIR/constants.js" | grep -v "^$" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# 4. ANALYSIS
echo "// ============================================================" >> "$TEMP_FILE"
echo "// 4. ANALYSIS FUNCTIONS (Pure)" >> "$TEMP_FILE"
echo "// ============================================================" >> "$TEMP_FILE"
cat "$APP_DIR/analysis.js" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# 5. ATTACKS
echo "// ============================================================" >> "$TEMP_FILE"
echo "// 5. ATTACK SCENARIO FUNCTIONS" >> "$TEMP_FILE"
echo "// ============================================================" >> "$TEMP_FILE"
cat "$APP_DIR/attacks.js" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# 5b. FORMATTING
echo "// ============================================================" >> "$TEMP_FILE"
echo "// 5B. FORMATTING & UTILITIES" >> "$TEMP_FILE"
echo "// ============================================================" >> "$TEMP_FILE"
cat "$APP_DIR/formatting.js" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# 6. ML
echo "// ============================================================" >> "$TEMP_FILE"
echo "// 6. ML (ONNX RUNTIME)" >> "$TEMP_FILE"
echo "// ============================================================" >> "$TEMP_FILE"
cat "$APP_DIR/ml.js" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# 7. DICTIONARY
echo "// ============================================================" >> "$TEMP_FILE"
echo "// 7. DICTIONARY LOADING" >> "$TEMP_FILE"
echo "// ============================================================" >> "$TEMP_FILE"
cat "$APP_DIR/dictionary.js" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# 8. CALIBRATIONS
echo "// ============================================================" >> "$TEMP_FILE"
echo "// 8. CALIBRATIONS (PCFG, Markov, Neural, Prince)" >> "$TEMP_FILE"
echo "// ============================================================" >> "$TEMP_FILE"
cat "$APP_DIR/calibrations.js" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# 9. HIBP
echo "// ============================================================" >> "$TEMP_FILE"
echo "// 9. HIBP & BLOOM FILTER" >> "$TEMP_FILE"
echo "// ============================================================" >> "$TEMP_FILE"
cat "$APP_DIR/hibp.js" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# 10. RENDER
echo "// ============================================================" >> "$TEMP_FILE"
echo "// 10. RENDERING" >> "$TEMP_FILE"
echo "// ============================================================" >> "$TEMP_FILE"
cat "$APP_DIR/render.js" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# 11. INIT
echo "// ============================================================" >> "$TEMP_FILE"
echo "// 11. INITIALIZATION & EVENT HANDLERS" >> "$TEMP_FILE"
echo "// ============================================================" >> "$TEMP_FILE"
cat "$APP_DIR/init.js" >> "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# Close IIFE
cat >> "$TEMP_FILE" << 'FOOTER'

})();
FOOTER

# Move to output
mv "$TEMP_FILE" "$OUTPUT"

echo "✓ Built $OUTPUT ($(wc -l < "$OUTPUT") lines)"
echo "✓ Ready for 11ty build"
