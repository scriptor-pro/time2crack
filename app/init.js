    return;
  }

  if (resetBtn) resetBtn.classList.add("visible");
  resultsDiv.classList.add("visible");
  resultsDiv.classList.remove("is-empty");
  if (attackerFrame) attackerFrame.hidden = false;  // Show force bar

  // Render character-by-character analysis (both versions)
  renderCharacterAnalysis(pw);
  renderCharacterAnalysisLive(pw);  // Real-time heatmap below crack time

  // Debounced HIBP check (600ms after last keystroke to avoid spamming)
  clearTimeout(hibpDebounce);
  if (!inputEmpty && pw !== lastCheckedPw) {
    hibpDebounce = setTimeout(() => {
      lastCheckedPw = pw;
      checkHIBP(pw);
    }, 600);
  } else if (inputEmpty) {
    if (hibpAbort) hibpAbort.abort();
    lastCheckedPw = "";
    updateHibpStatusBadge("default");
  }

  // Show/hide legacy bloom filter elements (kept for detail banners)
  const bloomTrigger = $("bloom-trigger");
  const bloomSection = $("bloom-section");
  if (bloomTrigger) bloomTrigger.hidden = true;  // Trigger moved to badge
  if (bloomSection) bloomSection.hidden = !state.ui.bloomLoaded && !state.ui.bloomLoading;

  // Check password against bloom filter if already loaded
  if (!inputEmpty && state.ui.bloomLoaded && state.cache.bloomFilter) {
    checkBloom(pw);
  } else if (!state.ui.bloomLoaded || inputEmpty) {
    // Reset bloom result if filter not loaded
    state.cache.bloomResult = null;
    updateBloomBanner(null);
  }
  const { size: cs, types } = getCharset(pw);
  const ent = entropy(pw);
  const sc = score(pw);
  const col = scoreColor(sc);

  // Segmented strength bar (Harrison et al. 2010: +23% clarity)
  // Activate segments progressively based on score (0-100)
  const activeSegments = Math.ceil((sc / 100) * 6);
  strengthSegments.forEach((seg, idx) => {
    if (idx < activeSegments) {
      seg.classList.add("active");
    } else {
      seg.classList.remove("active");
    }
  });
  
  // Icon + label (Forget et al. 2008: +58% comprehension)
  if (isReal(barLabel)) barLabel.style.display = "flex";
  if (strengthIcon) strengthIcon.textContent = scoreIcon(sc);
  if (isReal(strengthLabel)) {
    strengthLabel.textContent = scoreText(sc);
    strengthLabel.style.color = col;
  }
  if (isReal(strengthBits)) {
    const bits = Math.round(ent);
    strengthBits.textContent = `(${bits} bits)`;
  }
  if (isReal(barWrapper)) {
    barWrapper.setAttribute("aria-valuenow", sc);
    barWrapper.setAttribute("aria-valuetext", scoreText(sc));
  }

  // Update strength bar color indicator
  if (isReal(barWrapper)) {
    if (sc >= 60) {
      barWrapper.classList.add("strong");
    } else {
      barWrapper.classList.remove("strong");
    }
  }

  // Live details visible (always visible below heatmap)
  if (isReal(detailLengthLive)) detailLengthLive.textContent = pw.length;
  if (isReal(detailCharsetLive)) detailCharsetLive.textContent = cs;
  if (isReal(detailEntropyLive)) detailEntropyLive.textContent = Math.round(ent);
  if (isReal(detailCombosLive)) detailCombosLive.textContent =
    ent > 60 ? "2^" + Math.round(ent) : fmtBig(Math.pow(2, ent));

  if (isReal(liveDetailsVisible)) liveDetailsVisible.hidden = false;

  // Tags
  const vulns = getVulns(pw);
  
  // ML prediction (async)
  const mlProb = await predictHumanPattern(pw);
  if (runId !== renderRunId) return;
  if (mlProb !== null && mlProb > 0.85) {
    // If model predicts >85% probability of human pattern, add warning
    vulns.push({ t: t("vMLHuman") + ` (${Math.round(mlProb * 100)}%)`, l: "warn" });
  }
  
  if (isReal(vulnTagsEl)) vulnTagsEl.innerHTML = vulns
    .map(
      (v) =>
        '<span class="vuln-tag ' +
        v.l +
        '" role="status">' +
        (v.l === "critical" ? "⚠ " : v.l === "warn" ? "⚡ " : "✓ ") +
        v.t +
        "</span>",
    )
    .join("");

  // Update quality and pattern badges
  updateQualityBadge(sc);
  updatePatternBadge(vulns);

  // Scenarios
  const all = getScenarios(pw, mlProb);

  // Find FASTEST attack: true minimum across all applicable attacks
  const allFinite = all.filter((r) => r.sec !== null && isFinite(r.sec) && r.sec > 0);
  const fastest = pickFastestScenario(allFinite);

  // Auto-select the algo of the fastest attack so ct-panel matches the banner
  if (fastest && !userPinnedAlgo) {
    const ALGO_KEY_MAP = {
      "MD5": "md5", "SHA-1": "sha1", "SHA-256": "sha256",
      "NTLM": "ntlm",
    };
    const fastestAlgoKey = ALGO_KEY_MAP[fastest.hash] ||
      (fastest.hash.startsWith("bcrypt") ? "bcrypt" : fastest.hash.startsWith("Argon2") ? "argon2" : null);
    if (fastestAlgoKey && fastestAlgoKey !== selectedAlgo) {
      selectedAlgo = fastestAlgoKey;
      if (ctAlgo) ctAlgo.value = fastestAlgoKey;
    }
  }

  // --- FASTEST CARD ---
  const fastSec = fastest ? fastest.sec : 0;
  const fastDur = fmtDuration(fastSec);
  const fastDt = fmtDate(fastSec);

  if (isReal(crackDurationFast)) crackDurationFast.style.color = col;
  if (isReal(crackDateFast)) crackDateFast.style.color = col;

  // Map attack types to methodology anchor IDs
  const attackAnchorMap = {
    [t("aBrute")]: "attack-brute",
    [t("aDict")]: "attack-dict",
    [t("aHybrid")]: "attack-hybrid",
    [t("aRule")]: "attack-rule",
    [t("aPrince")]: "attack-prince",
    [t("aMask")]: "attack-mask",
    [t("aRainbow")]: "attack-rainbow",
    [t("aSpray")]: "attack-spray",
    [t("aTargeted")]: "attack-targeted",
    [t("aMarkov")]: "attack-markov",
    [t("aNeural")]: "attack-neural",
    [t("aPCFG")]: "attack-pcfg",
    [t("aCombi")]: "attack-combi",
    [t("aMorph")]: "attack-morph",
  };
  const fastestAnchor = fastest ? attackAnchorMap[fastest.atk] || "methodology" : "methodology";
  const methodAnchor =
    ' <a href="#' + fastestAnchor + '" class="method-inline-link">' +
    t("methodLink") +
    "</a>";
  const fastestMethodDesc = fastest ? getAttackMethodDescription(fastest.cat) : "";
  const fastestConfidenceText = fastest ? confidenceText(fastest.confidence) : "";

  if (fastDur.instant) {
    if (isReal(resultLabelFast)) resultLabelFast.textContent = fastest
      ? fastest.atk + " — " + fastest.hash
      : "";
    if (isReal(crackDurationFast)) crackDurationFast.textContent = t("lessSec");
    if (isReal(crackDateFast)) crackDateFast.textContent = t("now");
    resultSentenceFast.innerHTML =
      t("instantVia") +
      (fastest ? " via " + fastest.atk + "." : ".") +
      (fastestMethodDesc ? " " + fastestMethodDesc : "") +
      fastestConfidenceText +
      methodAnchor;
  } else if (fastDur.inf || !fastDur.ok) {
    if (isReal(resultLabelFast)) resultLabelFast.textContent = fastest ? fastest.atk + " — " + fastest.hash : t("allAttacks");
    if (isReal(crackDurationFast)) crackDurationFast.textContent = fastDur.text;
    if (isReal(crackDateFast)) crackDateFast.textContent = t("beyondDate");
    if (isReal(resultSentenceFast)) resultSentenceFast.innerHTML = fastest 
      ? t("unreachableFastest").replace("{attack}", "<strong>" + fastest.atk + "</strong>") +
          (fastestMethodDesc ? " " + fastestMethodDesc : "") +
          fastestConfidenceText +
          methodAnchor
      : t("unreachable") + fastestConfidenceText + methodAnchor;
  } else {
    if (isReal(resultLabelFast)) resultLabelFast.textContent = fastest.atk + " — " + fastest.hash;
    if (isReal(crackDurationFast)) crackDurationFast.textContent = fastDur.text;
    if (isReal(crackDateFast)) crackDateFast.textContent = fastDt || t("beyondDate");
    resultSentenceFast.innerHTML =
      t("via") +
      " <strong>" +
      fastest.atk +
      "</strong> — " +
      fastest.hash +
      "." +
      (fastestMethodDesc ? " " + fastestMethodDesc : "") +
      fastestConfidenceText +
      methodAnchor;
  }

  // Professional attacker (100 GPU): ~8× faster than Experienced (12 GPU)
  // Same fastest attack, but time divided by 8
  const proSec = fastest ? fastest.sec / 8 : Infinity;
  const proDur = fmtDuration(proSec);
  const proDt = fmtDate(proSec);

  if (proDur.instant) {
    if (isReal(resultLabelPro)) resultLabelPro.textContent = fastest
      ? fastest.atk + " — " + fastest.hash
      : "";
    if (isReal(crackDurationPro)) crackDurationPro.textContent = t("lessSec");
    if (isReal(crackDatePro)) crackDatePro.textContent = t("now");
    resultSentencePro.innerHTML =
      t("instantVia") +
      (fastest ? " via " + fastest.atk + "." : ".") +
      (fastestMethodDesc ? " " + fastestMethodDesc : "") +
      fastestConfidenceText +
      methodAnchor;
  } else if (proDur.inf || !proDur.ok) {
    if (isReal(resultLabelPro)) resultLabelPro.textContent = fastest ? fastest.atk + " — " + fastest.hash : t("allAttacks");
    if (isReal(crackDurationPro)) crackDurationPro.textContent = proDur.text;
    if (isReal(crackDatePro)) crackDatePro.textContent = t("beyondDate");
    if (isReal(resultSentencePro)) resultSentencePro.innerHTML = fastest 
      ? t("unreachableFastest").replace("{attack}", "<strong>" + fastest.atk + "</strong>") +
          (fastestMethodDesc ? " " + fastestMethodDesc : "") +
          fastestConfidenceText +
          methodAnchor
      : t("unreachable") + fastestConfidenceText + methodAnchor;
  } else {
    if (isReal(resultLabelPro)) resultLabelPro.textContent = fastest.atk + " — " + fastest.hash;
    if (isReal(crackDurationPro)) crackDurationPro.textContent = proDur.text;
    if (isReal(crackDatePro)) crackDatePro.textContent = proDt || t("beyondDate");
    resultSentencePro.innerHTML =
      t("via") +
      " <strong>" +
      fastest.atk +
      "</strong> — " +
      fastest.hash +
      "." +
      (fastestMethodDesc ? " " + fastestMethodDesc : "") +
      fastestConfidenceText +
      methodAnchor;
  }

  renderCtList(all);

  resultsDiv.classList.add("visible");
  resultsDiv.classList.remove("is-empty");
}

// ============================================================
// PASSWORD GENERATOR ACCORDION
// ============================================================
const genTrigger      = $("gen-accordion-trigger");
const genTriggerRow   = $("gen-accordion-trigger-row");
const genPanel        = $("gen-accordion-panel");
const genLenRange     = $("gen-len-range");
const genLenVal       = $("gen-len-val");
const genWordRow      = $("gen-word-row");
const genLenRow       = $("gen-len-row");
const genCharsetRow   = $("gen-charset-row");
const genWordInput    = $("gen-word-input");
const genPreviewTxt   = $("gen-preview-text");
const genPreviewStr   = $("gen-preview-strength");
const genMaskToggle   = $("gen-mask-toggle");
const genMaskIcon     = $("gen-mask-icon");
const genBtnRegen     = $("gen-btn-regen");
const genBtnUse       = $("gen-btn-use");
const genMemBadge     = $("gen-mem-badge");
const genMiniSegs     = [0,1,2,3,4,5].map(i => $("gen-mb"+i));
const genTypeChips    = document.querySelectorAll(".gen-type-chip");
const genChkU         = $("gen-chk-u");
const genChkL         = $("gen-chk-l");
const genChkD         = $("gen-chk-d");
const genChkS         = $("gen-chk-s");

const GEN_CHARS_U = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const GEN_CHARS_L = "abcdefghijklmnopqrstuvwxyz";
const GEN_CHARS_D = "0123456789";
const GEN_CHARS_S = "!@#$%^&*()-_=+[]{}|;:,.<>?";
const GEN_WORDS   = ["correct","horse","battery","staple","tiger","cloud","forest","river","stone","flame","swift","brave","quiet","golden","silver","pixel","nexus","delta","prime","ultra","vivid","noble","solar","lunar","frost","arrow","bloom","chess","drift","ember","flare","grove","haven","ivory","jewel","knack","lance","maple","north","orbit","pearl","quest","raven","sigma","thorn","umbra","vault","waltz","xenon","yield","zephyr"];

let genSelectedType  = "random";
let genPendingPw     = "";
let genPreviewMasked = false;
let genIsOpen        = false;

function genRnd(max) {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % max;
}
function genShuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = genRnd(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function genRandom(len, u, l, d, s) {
  let pool = "";
  const req = [];
  if (u) { pool += GEN_CHARS_U; req.push(GEN_CHARS_U[genRnd(GEN_CHARS_U.length)]); }
  if (l) { pool += GEN_CHARS_L; req.push(GEN_CHARS_L[genRnd(GEN_CHARS_L.length)]); }
  if (d) { pool += GEN_CHARS_D; req.push(GEN_CHARS_D[genRnd(GEN_CHARS_D.length)]); }
  if (s) { pool += GEN_CHARS_S; req.push(GEN_CHARS_S[genRnd(GEN_CHARS_S.length)]); }
  if (!pool) { pool = GEN_CHARS_L; req.push(GEN_CHARS_L[genRnd(GEN_CHARS_L.length)]); }
  const pw = [...req];
  while (pw.length < len) pw.push(pool[genRnd(pool.length)]);
  return genShuffle(pw).join("");
}
function genPassphrase() {
  const w = [];
  for (let i = 0; i < 4; i++) w.push(GEN_WORDS[genRnd(GEN_WORDS.length)]);
  return w.join("-");
}
function genWordBased(base) {
  if (!base || base.length < 2) base = GEN_WORDS[genRnd(GEN_WORDS.length)];
  const cap = base.charAt(0).toUpperCase() + base.slice(1).toLowerCase();
  const num = String(10 + genRnd(90));
  const sym = GEN_CHARS_S[genRnd(GEN_CHARS_S.length)];
  return cap + num + sym;
}

function genUpdateRangeFill() {
  if (!genLenRange) return;
  const p = ((genLenRange.value - genLenRange.min) / (genLenRange.max - genLenRange.min)) * 100;
  genLenRange.style.background = `linear-gradient(to right, var(--accent) ${p}%, var(--surface-elev) ${p}%)`;
}

function genUpdatePreview() {
  let pw;
  if (genSelectedType === "random") {
    pw = genRandom(+genLenRange.value, genChkU.checked, genChkL.checked, genChkD.checked, genChkS.checked);
  } else if (genSelectedType === "passphrase") {
    pw = genPassphrase();
  } else {
    pw = genWordBased(genWordInput ? genWordInput.value.trim() : "");
  }
  genPendingPw = pw;

  genPreviewTxt.className = "gen-pw-preview-text";
  if (genPreviewMasked) genPreviewTxt.classList.add("masked");
  genPreviewTxt.textContent = pw;

  let cs = 0;
  if (/[a-z]/.test(pw)) cs += 26;
  if (/[A-Z]/.test(pw)) cs += 26;
  if (/[0-9]/.test(pw)) cs += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) cs += 32;
  const bits = Math.log2(Math.pow(cs || 1, pw.length));
  const lvl = bits < 28 ? 0 : bits < 45 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : bits < 120 ? 4 : 5;
  const colors = ["var(--critical)","var(--danger)","var(--warning)","var(--success)","var(--excellent)","var(--exceptional)"];
  const miniColors = ["var(--critical)","var(--danger)","var(--warning)","var(--success)","var(--excellent)","var(--exceptional)"];
  if (genPreviewStr) {
    genPreviewStr.textContent = Math.round(bits) + " bits";
    genPreviewStr.style.color = colors[lvl];
  }
  genMiniSegs.forEach((seg, i) => {
    if (!seg) return;
    seg.style.background = i <= lvl ? miniColors[i] : "var(--surface-elev)";
  });

  if (genBtnUse) genBtnUse.disabled = false;
  if (genMemBadge) genMemBadge.hidden = false;
}

function genOpen() {
  genIsOpen = true;
  if (genTrigger) genTrigger.setAttribute("aria-expanded", "true");
  if (genTriggerRow) genTriggerRow.classList.add("open");
  if (genPanel) genPanel.classList.add("open");
  genUpdatePreview();
}
function genClose() {
  genIsOpen = false;
  if (genTrigger) genTrigger.setAttribute("aria-expanded", "false");
  if (genTriggerRow) genTriggerRow.classList.remove("open");
  if (genPanel) genPanel.classList.remove("open");
}

if (genTrigger) {
  genTrigger.addEventListener("click", () => {
    if (genIsOpen) genClose(); else genOpen();
  });
}

genTypeChips.forEach(btn => {
  btn.addEventListener("click", () => {
    genSelectedType = btn.dataset.genType;
    genTypeChips.forEach(b => b.classList.toggle("active", b === btn));
    const isRand   = genSelectedType === "random";
    const isPhrase = genSelectedType === "passphrase";
    const isWord   = genSelectedType === "word-based";
    if (genLenRow)     genLenRow.hidden     = isPhrase;
    if (genCharsetRow) genCharsetRow.hidden = !isRand;
    if (genWordRow)    genWordRow.hidden     = !isWord;
    genUpdatePreview();
  });
});

if (genLenRange) {
  genLenRange.addEventListener("input", () => {
    if (genLenVal) genLenVal.textContent = genLenRange.value;
    genUpdateRangeFill();
    genUpdatePreview();
  });
  genUpdateRangeFill();
}

[genChkU, genChkL, genChkD, genChkS].forEach(chk => {
  if (!chk) return;
  chk.addEventListener("change", () => {
    chk.closest(".gen-cs-chip").classList.toggle("active", chk.checked);
    genUpdatePreview();
  });
});

if (genWordInput) genWordInput.addEventListener("input", genUpdatePreview);

if (genBtnRegen) {
  genBtnRegen.addEventListener("click", () => {
    genBtnRegen.classList.add("spinning");
    setTimeout(() => genBtnRegen.classList.remove("spinning"), 400);
    genUpdatePreview();
  });
}

if (genMaskToggle) {
  genMaskToggle.addEventListener("click", () => {
    genPreviewMasked = !genPreviewMasked;
    if (genPreviewTxt) genPreviewTxt.classList.toggle("masked", genPreviewMasked);
    const eyeOpen   = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    const eyeClosed = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
    if (genMaskIcon) genMaskIcon.innerHTML = genPreviewMasked ? eyeClosed : eyeOpen;
  });
}

if (genBtnUse) {
  genBtnUse.addEventListener("click", () => {
    if (!genPendingPw) return;
    input.value = genPendingPw;
    input.type = "text";
    const textSpanToggle = toggleBtn.querySelector("span");
    if (textSpanToggle) textSpanToggle.textContent = t("hide");
    toggleBtn.setAttribute("aria-label", t("hideAria"));
    clearTimeout(timer);
    genClose();
    render();
    input.focus();
  });
}

// Reset
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    input.value = "";
    input.type = "password";
    const textSpan = toggleBtn.querySelector("span");
    if (textSpan) textSpan.textContent = t("show");
    toggleBtn.setAttribute("aria-label", t("showAria"));

    // Cancel pending renders/checks and force a fresh empty-state render
    clearTimeout(timer);
    userPinnedAlgo = false;
    selectedAlgo = "sha256";
    if (ctAlgo) ctAlgo.value = "sha256";
    if (hibpAbort) hibpAbort.abort();
    clearTimeout(hibpDebounce);
    lastCheckedPw = "";

    render();
    input.focus();
  });
}

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") e.preventDefault();
});
window.addEventListener("beforeunload", () => {
  input.value = "";
});

// ============================================================
// CHARACTER PREVIEW (brief reveal on type)
// ============================================================
const charPreview = safe('char-preview');
let previewTimeout = null;
let lastLength = 0;

if (charPreview) {
  input.addEventListener('input', (e) => {
    // Only show preview when typing (not deleting) and input is password type
    if (input.type === 'password' && input.value.length > lastLength) {
      const lastChar = input.value[input.value.length - 1];
      
      // Clear previous timeout
      if (previewTimeout) {
        clearTimeout(previewTimeout);
      }
      
      // Show the character
      charPreview.textContent = lastChar;
      charPreview.classList.add('show');
      
      // Hide after 600ms
      previewTimeout = setTimeout(() => {
        charPreview.classList.remove('show');
        setTimeout(() => {
          charPreview.textContent = '';
        }, 150);
      }, 600);
    } else {
      // Hide immediately when deleting or password is visible
      charPreview.classList.remove('show');
      charPreview.textContent = '';
    }
    
    lastLength = input.value.length;
  });
}

// ============================================================
// INFO TOOLTIP
// ============================================================
const tooltipTrigger = document.querySelector('.info-tooltip-trigger');
const tooltip = safe('speed-tooltip');

if (tooltipTrigger && tooltip) {
  let isTooltipVisible = false;
  tooltipTrigger.setAttribute("aria-expanded", "false");
  
  // Show tooltip on click
  tooltipTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    isTooltipVisible = !isTooltipVisible;
    tooltip.hidden = !isTooltipVisible;
    tooltipTrigger.setAttribute('aria-expanded', isTooltipVisible);
  });
  
  // Hide tooltip when clicking outside
  document.addEventListener('click', (e) => {
    if (isTooltipVisible && !tooltip.contains(e.target) && e.target !== tooltipTrigger) {
      isTooltipVisible = false;
      tooltip.hidden = true;
      tooltipTrigger.setAttribute('aria-expanded', 'false');
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isTooltipVisible) {
      isTooltipVisible = false;
      tooltip.hidden = true;
      tooltipTrigger.setAttribute('aria-expanded', 'false');
      tooltipTrigger.focus();
    }
  });
}

// ============================================================
// PASSWORD GENERATOR
// ============================================================
function generateSecurePassword(length = 16) {
  length = Math.max(4, length | 0);

  function randomIndex(maxExclusive) {
    if (maxExclusive <= 1) return 0;
    const maxUint32 = 0x100000000;
    const threshold = maxUint32 - (maxUint32 % maxExclusive);
    const buf = new Uint32Array(1);
    let value;
    do {
      crypto.getRandomValues(buf);
      value = buf[0];
    } while (value >= threshold);
    return value % maxExclusive;
  }

  // Use cryptographically secure random values
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[randomIndex(lowercase.length)];
  password += uppercase[randomIndex(uppercase.length)];
  password += numbers[randomIndex(numbers.length)];
  password += symbols[randomIndex(symbols.length)];
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars[randomIndex(allChars.length)];
  }
  
  // Shuffle with Fisher-Yates to avoid sort comparator bias
  const chars = password.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    const tmp = chars[i];
    chars[i] = chars[j];
    chars[j] = tmp;
  }
  
  return chars.join('');
}

// Test button (currently just triggers analysis, password is analyzed on input)
// Initialize: hide strength label on page load
if (isReal(barLabel)) barLabel.style.display = "none";

// Strength info tooltip toggle
if (isReal(strengthInfoBtn) && isReal(strengthTooltip)) {
  strengthInfoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    strengthTooltip.hidden = !strengthTooltip.hidden;
  });

  // Close tooltip when clicking outside
  document.addEventListener('click', (e) => {
    if (!strengthInfoBtn.contains(e.target) && !strengthTooltip.contains(e.target)) {
      strengthTooltip.hidden = true;
    }
  });
}

// Copy button
if (isReal(copyBtn)) {
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(input.value);

      // Visual feedback - change aria-label since no visible text
      copyBtn.classList.add('copied');
      const originalLabel = copyBtn.getAttribute('aria-label');
      copyBtn.setAttribute('aria-label', t('copied'));

      // Reset after 2 seconds
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.setAttribute('aria-label', originalLabel);
    }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  });
}

// Hide copy button when user types
input.addEventListener('input', () => {
  copyBtn.hidden = true;
});

// No ML model cleanup needed (vanilla JS uses native GC)

// Tab switching logic
attackerTabsNodes.forEach(tab => {
  tab.addEventListener("click", () => {
    // Remove active state from all tabs and wrappers
    attackerTabsNodes.forEach(t => {
      t.classList.remove("is-active");
      t.setAttribute("aria-selected", "false");
      t.parentElement.classList.remove("is-active");
    });
    // Add active state to clicked tab and wrapper
    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");
    if (tab.parentElement) tab.parentElement.classList.add("is-active");

    // Hide all panels
    document.querySelectorAll(".attacker-panel").forEach(p => {
      p.hidden = true;
    });
    // Show selected panel
    const panelId = tab.getAttribute("aria-controls");
    const panel = safe(panelId);
    if (panel) panel.hidden = false;
  });
});

// Bloom filter check button listener (legacy button + new badge)
const bloomBtn = $("bloom-check-btn");
if (bloomBtn) {
  bloomBtn.addEventListener("click", () => loadBloomFilter());
}

// Initialize i18n and load dictionary on page load
// ML model is lazy-loaded when first password is entered (saves ~600KB initial load)
if (state.dom.input) {
  setLang(state.lang);
  loadDictionary(state.lang); // Load in background, don't block initialization
  loadPcfgCalibration();
  loadMarkovCalibration();
  loadNeuralCalibration();
  loadPrinceCalibration();
  render(); // Keep layout fully visible even with empty input
}
})();
