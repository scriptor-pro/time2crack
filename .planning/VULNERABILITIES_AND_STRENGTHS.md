# 📋 Time2Crack: Complete List of Vulnerability & Strength Indicators

**Last Updated**: 2026-03-17  
**Version**: Based on current app.js translations

---

## 🔴 VULNERABILITY INDICATORS (Weaknesses Detected)

### Password Quality Issues
| Indicator | Key | Description | Impact |
|-----------|-----|-------------|--------|
| **Very weak** | `veryWeak` | Ultra-weak password (Top 100) | Cracked instantly |
| **Too short** | `vShort` | Less than 8 characters | Vulnerable to brute force |
| **Single char type** | `v1Type` | Only lowercase, OR only uppercase, OR only digits | Missing diversity |
| **🚨 Ultra-weak** | `nWeakPassword` | In Top 100 most common passwords + heuristics | Instant crack |

### Pattern Detections (Easily Guessable)
| Indicator | Key | Description | Attack Vector |
|-----------|-----|-------------|-----------------|
| **Common password** | `vCommon` | Word appears in HIBP breaches | Dictionary attack |
| **Keyboard pattern** | `vKeyboard` | Sequential key patterns (qwerty, asdf, etc.) | Mask/Markov attack |
| **Sequence detected** | `vSequence` | Numeric or alphabetic runs (123, abc, etc.) | Mask attack |
| **Repetition** | `vRepeat` | Repeating characters or patterns (aaa, 11, etc.) | Pattern recognition |
| **Date detected** | `vDate` | Recognizable date format (2024, 1990, etc.) | Mask/PCFG attack |
| **Predictable structure** | `vStruct` | Common structure like Cap+lower+digits | Mask/PCFG attack |
| **Human-like pattern** | `vMLHuman` | Statistically similar to real passwords | Markov/PCFG attack |

### Attack-Specific Vulnerabilities
| Indicator | Key | Description | Attack |
|-----------|-----|-------------|--------|
| **Found in known leaks!** | `nInLeaks` | Password exists in HIBP database | Dictionary attack |
| **Known credentials** | `nCredKnown` | Email/password pair in breaches | Credential stuffing |
| **Top 20 worldwide** | `nTop20` | In top 20 most common passwords | Password spraying |
| **Dict+mutation pattern** | `nDictMut` | Dictionary word with predictable mutations | Hybrid attack |
| **Keyboard walk detected** | `nKeyboardUltra` | Advanced keyboard pattern (~99.7% space reduction) | Mask/Markov attack |
| **Grammatical structure** | `nPCFGDetected` | Recognizable grammar (Word+digits+symbol) | PCFG attack |

---

## 🟢 STRENGTH INDICATORS (Good Points)

### Password Quality Achievements
| Indicator | Key | Description | Benefit |
|-----------|-----|-------------|---------|
| **Good diversity** | `vDiversity` | Mix of character types | Increases keyspace |
| **Good length** | `vGoodLen` | 12+ characters | Exponentially harder |
| **Excellent length** | `vGreatLen` | 16+ characters | Massively resistant |
| **Weak** | `_weak` | General weak rating | — |
| **Strong** | `_strong` | General strong rating | — |
| **Very strong** | `veryStrong` | Very strong rating | Resistant to most attacks |
| **Exceptional** | `exceptional` | Exceptional rating | Near-unbreakable |

### Pattern Absence (Good!)
| Indicator | Key | Description | Benefit |
|-----------|-----|-------------|---------|
| **Not in known lists** | `nAbsentLeaks` | Not in HIBP breaches | Dictionary attack ineffective |
| **No predictable pattern** | `nNoPattern` | Unrecognizable structure | Mask attack ineffective |
| **Non-grammatical** | `nPCFGNone` | Doesn't match common grammar | PCFG attack ineffective |
| **Not in top common** | `nNotTop` | Not in top 20 passwords | Password spraying ineffective |
| **Not a passphrase** | `nNotPassphrase` | Not 2-word combination | Combinator attack ineffective |
| **Unrecognizable structure** | `nStructUnrecog` | No common pattern | Mask attack ineffective |

### Hash Algorithm Strength
| Indicator | Key | Description |
|-----------|-----|-------------|
| **Salted hash** | `nSalted` | Using salt (bcrypt, Argon2) → Rainbow tables impractical |
| **Too long for tables** | `nTooLong` | Length exceeds rainbow table capacity |

---

## ⏱️ TIME-TO-CRACK INDICATORS (Speed Messages)

### Instant/Fast
| Message | Key | Meaning |
|---------|-----|---------|
| **⚡ Instant** | `instant` | < 1 ms (milliseconds) |
| **< 1 second** | `lessSec` | Less than 1 second |
| **Cracked instantly** | `instantVia` | Multiple attacks are instant |
| **Now** | `now` | Current moment |

### Moderate Times
| Message | Key | Meaning |
|---------|-----|---------|
| **{N} seconds** | — | Seconds to minutes |
| **{N} minutes** | — | Minutes (1-60) |
| **{N} hours** | — | Hours (1-24) |
| **{N} days** | — | Days (1-1000) |
| **{N} months** | — | Months (1-12) |
| **{N} years** | — | Years (1-billions) |

### Excellent/Unreachable
| Message | Key | Meaning |
|---------|-----|---------|
| **Beyond any calculable date** | `beyondDate` | > 3.15 × 10^15 seconds (~100 billion years) |
| **Longer than age of universe** | `beyondUniverse` | >> 13.8 billion years |
| **Unreachable** | `unreachable` | Even fastest attack cannot crack |
| **Resists beyond universe** | `resistsBeyond` | Security beyond practical lifetime |

---

## 🎯 ATTACK INDICATORS (Showing Which Attacks Work)

### Attack Names (10 Total)
| Attack | Key | What It Tests |
|--------|-----|---------------|
| 🔨 **Brute force** | `aBrute` | All combinations (baseline) |
| 📖 **Dictionary** | `aDict` | Known passwords + wordlists |
| 🔀 **Hybrid** | `aHybrid` | Dictionary words + mutations |
| 🎭 **Mask** | `aMask` | Predictable patterns |
| 🌈 **Rainbow table** | `aRainbow` | Pre-computed hash lookups |
| 👥 **Credential stuffing** | `aCred` | Leaked email/password pairs |
| 🌬️ **Password spraying** | `aSpray` | Common passwords across accounts |
| 🧠 **Markov** | `aMarkov` | Probabilistic sequences |
| 🏗️ **PCFG** | `aPCFG` | Grammatical structures |
| ➕ **Combinator** | `aCombi` | Two-word concatenation |

### Attack Effectiveness Messages
| Message | Key | Meaning |
|---------|-----|---------|
| **All combinations** | `nAllCombos` | Brute force tests all keyspace |
| **Unrecognizable → ineffective** | `nStructUnrecog` | Hybrid can't apply mutations |
| **No pattern → ineffective** | `nNoPattern` | Mask has nothing to target |
| **Dict+mutation pattern detected** | `nDictMut` | Hybrid finds dictionary word |
| **Structure detected** | `nStructCaps` | Mask recognizes Cap+lower+digits |
| **Keyboard pattern detected** | `nKBDetected` | Mask finds keyboard walk |
| **Sequence detected** | `nSeqDetected` | Mask finds 123, abc, etc. |
| **Human patterns → 95% reduction** | `nHuman95` | Markov reduces search space |
| **Keyboard walk → 99.7% reduction** | `nKeyboardUltra` | Markov ultra-effective |
| **Date detected → charset reduced** | `nDateDetected` | Mask/PCFG narrows digits |
| **Grammatical structure detected** | `nPCFGDetected` | PCFG finds patterns |
| **Passphrase detected** | `nPassphrase` | Combinator targets 2-word concat |

---

## 📊 STATUS INDICATORS (Overall Password Quality)

| Status | Key | Meaning |
|--------|-----|---------|
| **Too short** | `statusShort` | < 8 characters |
| **Good length** | `statusGood` | 8-15 characters |
| **Excellent** | `statusExcellent` | 16+ characters |

---

## 🔢 NUMERIC STRENGTH RATINGS

| Rating | Display | Range |
|--------|---------|-------|
| **Very weak** | `veryWeak` | 0-20 bits entropy |
| **Weak** | `_weak` | 20-40 bits |
| **Moderate** | `moderate` | 40-60 bits |
| **Strong** | `_strong` | 60-80 bits |
| **Very strong** | `veryStrong` | 80-120 bits |
| **Exceptional** | `exceptional` | 120+ bits |

---

## 💾 HAVE I BEEN PWNED (HIBP) MESSAGES

| Message | Key | Meaning |
|---------|-----|---------|
| **This password has been leaked!** | `hibpTitle` | ⚠️ Found in breaches |
| **{count} times in breaches** | `hibpText` | Appears N times in HIBP |
| **Not in any known breach** | `hibpSafe` | ✅ Safe (not in HIBP) |
| **Could not verify (network)** | `hibpError` | ❌ Connection error |
| **Checking breaches...** | `hibpLoading` | 🔄 Verifying... |

---

## 📈 DETAILED ANALYSIS METRICS (Advanced Panel)

| Metric | Description |
|--------|-------------|
| **Characters** | Length of password |
| **Charset size** | Number of unique character types |
| **Entropy bits** | Shannon entropy measurement |
| **Combinations** | Total possible combinations (2^entropy) |

---

## ⚙️ HASHING ALGORITHM SPEEDS (6 Total)

| Algorithm | Key | Speed (12× RTX 4090) |
|-----------|-----|---------------------|
| **MD5** | — | 2,026.8 GH/s |
| **SHA-1** | — | 610.3 GH/s |
| **SHA-256** | — | 272.2 GH/s |
| **NTLM** | — | 3,462 GH/s |
| **bcrypt (cost 10)** | — | 22 kH/s |
| **Argon2id** | — | 800 H/s |

---

## 🎓 ATTACK CAPABILITY PROFILES

| Attacker Type | Hardware | Speed Multiplier |
|---------------|----------|------------------|
| **Amateur** | 1× GPU | 12× slower |
| **Experienced** | 12× GPU | 1× (baseline) |
| **Professional** | 100 GPU | ~8× faster |
| **Nation-state** | 10,000 GPU | ~800× faster |

---

## 📝 EXAMPLE READINGS

### Weak Password: `password`
```
🔴 Very weak
- vCommon: Common password
- nInLeaks: Found in known leaks!
- Dictionary attack: < 1 second
- Status: Too short
```

### Moderate Password: `MyP4ssw0rd`
```
🟡 Moderate
- vStruct: Predictable structure (Cap+lower+digits+symbols)
- vDiversity: Good diversity
- nStructCaps: Structure detected
- Mask attack: Minutes
- Hybrid attack: Seconds
```

### Strong Password: `K9@mLx#pQw2nJ$vR`
```
🟢 Strong
- vDiversity: Good diversity
- vGoodLen: Good length (16 chars)
- nAbsentLeaks: Not in known lists
- nNoPattern: No predictable pattern
- Brute force: Millions of years
- Status: Excellent
```

### Exceptional Password: `7fR#$@qW9kL2Xvbp8mZ!nC5hYjT`
```
🟢 Exceptional
- vDiversity: Good diversity
- vGreatLen: Excellent length (28 chars)
- nAbsentLeaks: Not in known lists
- nNoPattern: No predictable pattern
- Brute force: Beyond universe age
- Status: Excellent
- All attacks: Unreachable
```

---

## 🔗 RELATIONSHIPS

### Vulnerability → Attack Type
```
Dictionary word          → Dictionary, Hybrid, Combinator
Keyboard pattern         → Mask, Markov
Date pattern            → Mask, PCFG
Repetition              → Mask
Structure (Cap+low+dig) → Mask, PCFG
Common password         → Dictionary, Password spraying
```

### Strength → Protection
```
Good diversity          → Increases keyspace
Good length (12+)       → Exponential resistance
Absent from HIBP        → Defeats dictionary
No pattern              → Defeats mask/PCFG
Random characters       → Defeats Markov
```

---

## 📌 KEY THRESHOLDS

| Threshold | Meaning |
|-----------|---------|
| **< 8 characters** | Too short (instant brute force on GPU) |
| **8-11 characters** | Vulnerable unless very diverse |
| **12-15 characters** | Good length (hours-years on GPU) |
| **16+ characters** | Excellent length (millions+ years) |
| **< 40 bits entropy** | Weak (< 1 minute) |
| **40-60 bits** | Moderate (hours-days) |
| **60-80 bits** | Strong (years) |
| **80+ bits** | Very strong (millions+ years) |
| **120+ bits** | Exceptional (beyond universe age) |

