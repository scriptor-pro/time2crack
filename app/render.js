// ============================================================
// RENDER
// ============================================================
let timer;
let renderRunId = 0;
function setPendingState() {
  resultsDiv.classList.add("visible");
  resultsDiv.classList.remove("is-empty");
  if (resetBtn) resetBtn.classList.add("visible");
  
  // Reset strength bar segments
  strengthSegments.forEach((seg) => seg.classList.remove("active"));
  if (strengthIcon) strengthIcon.textContent = "—";
  if (isReal(strengthLabel)) {
    strengthLabel.textContent = "—";
    strengthLabel.style.color = "";
  }
  if (isReal(strengthBits)) strengthBits.textContent = "—";
  if (isReal(barWrapper)) {
    barWrapper.classList.remove("strong");
    barWrapper.setAttribute("aria-valuenow", "0");
    barWrapper.setAttribute("aria-valuetext", "No password entered");
  }
  if (isReal(resultLabelFast)) if (isReal(resultLabelFast)) resultLabelFast.textContent = "—";
  if (isReal(crackDurationFast)) if (isReal(crackDurationFast)) crackDurationFast.textContent = "";
  if (isReal(crackDateFast)) if (isReal(crackDateFast)) crackDateFast.textContent = "—";
  if (isReal(resultSentenceFast)) if (isReal(resultSentenceFast)) resultSentenceFast.textContent = "";
  if (isReal(liveDetailsVisible)) if (isReal(liveDetailsVisible)) liveDetailsVisible.hidden = true;
  if (isReal(vulnTagsEl)) if (isReal(vulnTagsEl)) vulnTagsEl.innerHTML = "";
}

input.addEventListener("input", () => {
  clearTimeout(timer);
  const len = input.value.length;
  if (!len) {
    render();
    return;
  }
  setPendingState();
  timer = setTimeout(render, INPUT_RENDER_DEBOUNCE_MS);
});

// Character-by-character analysis (Telepathwords-inspired)
function analyzeCharacters(pw) {
  const chars = [];
  
  for (let i = 0; i < pw.length; i++) {
    const char = pw[i];
    let strength = "strong"; // default: unpredictable
    let pattern = "";
    let emoji = "✔";
    
    // Check if character is part of a dictionary word
    const contextStart = Math.max(0, i - 4);
    const contextEnd = Math.min(pw.length, i + 5);
    const substring = pw.substring(contextStart, contextEnd);
    
    if (isDictWord(substring)) {
      strength = "weak";
      pattern = "📖 Dict";
      emoji = "✘";
    }
    
    // Check if digit is in sequential position (common pattern)
    else if (/\d/.test(char)) {
      const prevChars = pw.substring(Math.max(0, i - 2), i);
      const nextChars = pw.substring(i + 1, Math.min(pw.length, i + 3));
      
      // Check for common date/sequence patterns
      if (/\d{2,4}$/.test(pw.substring(0, i + 1))) {
        strength = "medium";
        pattern = "📅 Date";
        emoji = "◐";
      } else {
        strength = "medium";
        pattern = "🔢 Digit";
        emoji = "◐";
      }
    }
    
    // Check for common symbols
    else if (/[!@#$%^&*.]/.test(char)) {
      strength = "medium";
      pattern = "🔗 Symbol";
      emoji = "◐";
    }
    
    // Check for uppercase/lowercase patterns
    else if (/[A-Z]/.test(char) && i === 0) {
      // First letter capitalization is very common
      strength = "weak";
      pattern = "🎭 Mask";
      emoji = "✘";
    }
    else if (/[a-z]/.test(char)) {
      // lowercase letters: neutral by default
    }
    
    chars.push({
      char,
      strength,
      pattern,
      emoji,
    });
  }
  
  return chars;
}

function updateQualityBadge(sc) {
  const col = scoreColor(sc);
  const label = scoreLabel(sc);
  if (qualityBadge) {
    // Display full sentence: "This password is [quality level]"
    qualityBadge.textContent = t("qualityMsg").replace("{0}", label);
    qualityBadge.style.background = col;
    qualityBadge.style.color = "#fff";
  }
}

function updatePatternBadge(vulns) {
  if (!patternBadge) return;

  const critical = vulns.find(v => v.l === "critical");
  const warn = vulns.find(v => v.l === "warn");

  let patternText = "";
  let patternColor = "";

  if (critical) {
    patternText = critical.t;
    patternColor = "var(--critical)";
  } else if (warn) {
    patternText = warn.t;
    patternColor = "var(--warning)";
  } else {
    patternText = t("patternStrong");
    patternColor = "var(--success)";
  }

  // Display full sentence: "This password structure is: [pattern]"
  patternBadge.textContent = t("patternMsg").replace("{0}", patternText);
  patternBadge.style.background = patternColor;
  patternBadge.style.color = "#fff";
}

function updateHibpStatusBadge(hibpState) {
  // hibpState: 'loading', 'leaked', 'safe', 'error'
  if (!hibpStatusBadge) return;

  let hibpText = "";
  let hibpColor = "";

  switch (hibpState) {
    case "loading":
      hibpText = t("hibpLoading") || "⏳ Checking...";
      hibpColor = "var(--warning)";
      break;
    case "leaked":
      hibpText = LANG === "fr" ? "💀 Trouvé - votre mot de passe est dans la base HIBP" : "💀 Found - your password is in the HIBP database";
      hibpColor = "var(--critical)";
      break;
    case "safe":
      hibpText = t("hibpSafe") || "✓ Not leaked";
      hibpColor = "var(--success)";
      break;
    case "error":
      hibpText = t("hibpError") || "? Check failed";
      hibpColor = "var(--warning)";
      break;
    default:
      hibpText = "—";
      hibpColor = "var(--surface-elev)";
  }

  // Display only the status (the banner below already gives full detail)
  hibpStatusBadge.textContent = hibpText;
  hibpStatusBadge.style.background = hibpColor;
  hibpStatusBadge.style.color = "#fff";
}

function renderCharacterAnalysis(pw) {
  const wrapper = safe("character-analysis-wrapper");
  const container = safe("character-analysis");

  // Element may not exist (removed with Advanced Details panel)
  if (!wrapper) return;

  if (!pw || pw.length === 0) {
    wrapper.hidden = true;
    return;
  }

  wrapper.hidden = false;
  const analysis = analyzeCharacters(pw);

  container.innerHTML = analysis.map(({char, strength, pattern, emoji}, idx) => {
    const display = char === " " ? "␣" : char;
    const title = pattern ? `${pattern}` : "Unpredictable";

    return `<div
      class="char-badge char-${strength}"
      title="${title}"
      data-pattern="${pattern}"
      role="img"
      aria-label="Character ${idx + 1}: ${display} - ${title}"
    >${emoji}</div>`;
  }).join("");
}

// Render heatmap in real-time (always visible, below crack time)
function renderCharacterAnalysisLive(pw) {
  const wrapper = safe("character-analysis-live-wrapper");
  const container = safe("character-analysis-live");

  // Element must exist (required for real-time display)
  if (!wrapper || !container) return;

  if (!pw || pw.length === 0) {
    wrapper.hidden = true;
    return;
  }

  wrapper.hidden = false;
  const analysis = analyzeCharacters(pw);

  container.innerHTML = analysis.map(({char, strength, pattern, emoji}, idx) => {
    const display = char === " " ? "␣" : char;
    const title = pattern ? `${pattern}` : "Unpredictable";

    return `<div
      class="char-badge char-${strength}"
      title="${title}"
      data-pattern="${pattern}"
      role="img"
      aria-label="Character ${idx + 1}: ${display} - ${title}"
    >${emoji}</div>`;
  }).join("");
}

async function render() {
  const runId = ++renderRunId;
  const inputPw = input.value;
  const inputEmpty = !inputPw.length;
  const pw = inputPw;

  if (inputEmpty) {
    if (resetBtn) resetBtn.classList.remove("visible");
    resultsDiv.classList.add("visible");
    resultsDiv.classList.add("is-empty");
    if (attackerFrame) attackerFrame.hidden = false;

    // Neutral strength state (visible placeholders)
    strengthSegments.forEach((seg) => seg.classList.remove("active"));
    if (strengthIcon) strengthIcon.textContent = "—";
    if (isReal(strengthLabel)) {
      strengthLabel.textContent = "—";
      strengthLabel.style.color = "";
    }
    if (isReal(strengthBits)) strengthBits.textContent = "—";
    if (isReal(barLabel)) barLabel.style.display = "flex";
    if (isReal(barWrapper)) {
      barWrapper.classList.remove("strong");
      barWrapper.setAttribute("aria-valuenow", "0");
      barWrapper.setAttribute("aria-valuetext", "No password entered");
    }

    // Reset attacker cards to neutral "—" state (mirrors initial HTML)
    if (isReal(resultLabelFast)) resultLabelFast.textContent = "—";
    if (isReal(crackDurationFast)) {
      crackDurationFast.textContent = "—";
      crackDurationFast.style.color = "";
    }
    if (isReal(crackDateFast)) {
      crackDateFast.textContent = "—";
      crackDateFast.style.color = "";
    }
    if (isReal(resultSentenceFast)) resultSentenceFast.textContent = "";
    if (isReal(resultLabelPro)) resultLabelPro.textContent = "—";
    if (isReal(crackDurationPro)) {
      crackDurationPro.textContent = "—";
      crackDurationPro.style.color = "";
    }
    if (isReal(crackDatePro)) {
      crackDatePro.textContent = "—";
      crackDatePro.style.color = "";
    }
    if (resultSentencePro) if (isReal(resultSentencePro)) resultSentencePro.textContent = "";

    // Reset quality/pattern/HIBP badges to "—"
    if (qualityBadge) { qualityBadge.textContent = "—"; qualityBadge.style.background = ""; qualityBadge.style.color = ""; }
    if (patternBadge) { patternBadge.textContent = "—"; patternBadge.style.background = ""; patternBadge.style.color = ""; }

    // Reset visible details when empty
    if (isReal(vulnTagsEl)) vulnTagsEl.innerHTML = "";
    if (isReal(liveDetailsVisible)) liveDetailsVisible.hidden = true;
    if (ctFastestValue) {
      ctFastestValue.textContent = "—";
      ctFastestValue.style.color = "";
    }
    if (ctFastestSub) ctFastestSub.textContent = "";
    if (ctList) ctList.innerHTML = "";

    // Clear character-level analysis widgets
    renderCharacterAnalysis("");
    renderCharacterAnalysisLive("");

    // Reset HIBP state
    if (hibpAbort) hibpAbort.abort();
    clearTimeout(hibpDebounce);
    lastCheckedPw = "";
    updateHibpStatusBadge("default");
    return;
