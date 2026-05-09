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
