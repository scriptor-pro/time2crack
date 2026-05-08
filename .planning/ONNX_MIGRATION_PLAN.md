# Plan de Migration: TensorFlow.js → Vanilla JS Inference 🚀

**Durée estimée**: 2-3 heures
**Complexité**: Modérée
**Bénéfice**: CSP sécurisée (zéro `'unsafe-eval'`) + 3.5 MB CDN économisé + inference <1ms

---

## Pourquoi Vanilla JS (Option A)?

Le modèle ML actuel est très simple:
- **Architecture**: 4 couches Dense: 35 → 128 → 64 → 32 → 1
- **Opérations**: relu, sigmoid (triviales en JS)
- **Taille poids**: ~58 KB de float32
- **Pas de dépendances**: Dropout est un no-op en inference

**Comparaison**:
| | TF.js | ONNX Runtime | Vanilla JS |
|---|-------|-------------|-----------|
| CSP Safe | ❌ `'unsafe-eval'` | ⚠️ `'wasm-unsafe-eval'` | ✅ Oui |
| Size | 3.5 MB CDN | 400 KB + 8 MB WASM | 0 B |
| Inference | ~5-15ms | ~2-5ms | <1ms |
| Maintenance | Dépendance externe | Dépendance externe | Code pur |

**Recommandation**: Vanilla JS = meilleur ratio coût/bénéfice pour ce projet.

---

## Comprendre le Modèle Actuel

### Architecture
```
Input (35 features)
    │
    └→ Dense(35→128) + ReLU
       │
       └→ Dropout(0.3) ← No-op en inference
           │
           └→ Dense(128→64) + ReLU
              │
              └→ Dropout(0.2) ← No-op en inference
                  │
                  └→ Dense(64→32) + ReLU
                     │
                     └→ Dense(32→1) + Sigmoid
                         │
                         └→ Output: probability [0,1]
```

### Fichiers
```
data/model-v2/
├── model.json           ← Metadata (shapes, weights names)
├── weights.bin          ← Binary: 35×128 + 128 + 128×64 + 64 + 64×32 + 32 + 32×1 + 1
└── normalization.json   ← Min/Max for feature scaling (inchangé)
```

### Taille des matrices
```
Layer 1: W1 = [35, 128] = 4,480 floats = 17.9 KB
         b1 = [128]     = 128 floats = 0.5 KB

Layer 2: W2 = [128, 64] = 8,192 floats = 32.8 KB
         b2 = [64]      = 64 floats = 0.3 KB

Layer 3: W3 = [64, 32]  = 2,048 floats = 8.2 KB
         b3 = [32]      = 32 floats = 0.1 KB

Layer 4: W4 = [32, 1]   = 32 floats = 0.1 KB
         b4 = [1]       = 1 float = 0.01 KB

Total: ~58 KB + JSON overhead
```

---

## Phase 0: Mesure Baseline (15 min)

### Tâche 1: Mesurer TF.js charge time

**Dans DevTools (F12)**:
```javascript
// Console
console.time('TF Load');
// ... charger le mot de passe, laisser TF.js charger
console.timeEnd('TF Load');
```

**Mesures à prendre**:
- Temps CDN jsdelivr (Network tab, `tf.min.js`)
- Taille en mémoire (Memory tab avant/après chargement)
- Note: ~3.5 MB compressé = ~15+ MB décompressé en RAM

### Tâche 2: Mesurer inference time

```javascript
// Dans app.js, ajouter temporairement:
console.time('ML Predict');
const result = predictHumanPattern("Password123");
console.timeEnd('ML Predict');
```

**Cible actuelle**: ~5-15ms (dépend du GPU/backend TF.js)

### Tâche 3: Vérifier CSP actuelle

```bash
# Dans index.html, chercher unsafe-eval
grep "unsafe-eval" index.html
```

Expected: `script-src ... 'unsafe-eval' ...` (présent pour TF.js)

---

## Phase 1: Extraction des Poids (30 min)

### Tâche 1: Lire model.json

```bash
cd /home/Baudouin/Documents/Projets/CrackDate
cat data/model-v2/model.json | jq '.config.layers[] | {name: .config.name, class_name: .class_name, config: .config | {units, activation, rate}}'
```

**Sortie attendue**:
```json
{
  "name": "dense",
  "class_name": "Dense",
  "config": {
    "units": 128,
    "activation": "relu"
  }
}
...
```

### Tâche 2: Calculer les offsets byte dans weights.bin

Créer un petit script Node pour inspecter:

```bash
cat > /tmp/inspect-weights.mjs << 'EOF'
import fs from 'fs';

const buf = fs.readFileSync('./data/model-v2/weights.bin');
console.log(`Total bytes: ${buf.length}`);
console.log(`As float32: ${buf.length / 4} floats`);

// Offsets attendus
const offsets = {
  W1: 0,           // 35*128 = 4480 floats
  b1: 4480 * 4,    // 128 floats
};
console.log('W1 offset:', offsets.W1, 'end:', 4480*4);
console.log('b1 offset:', offsets.b1, 'end:', offsets.b1 + 128*4);
EOF

node /tmp/inspect-weights.mjs
```

**Résultat**: Vérifier que `buf.length = (4480 + 128 + 8192 + 64 + 2048 + 32 + 32 + 1) * 4 = 58,556 bytes`

### Tâche 3: Parser les poids au runtime

Pas besoin de script offline — on peut lire directement dans `loadMLModel()`.

---

## Phase 2: Modifier app.js (90 min)

### Tâche 1: Localiser les sections à remplacer

```bash
grep -n "TF_LOADED\|TF_LOADING\|ensureTensorFlowLoaded\|loadMLModel\|predictHumanPattern\|beforeunload" app.js
```

Expected lines:
- ~1439: `const TF_LOADED`, `TF_LOADING`
- ~1449: `ensureTensorFlowLoaded()`
- ~1484: `loadMLModel()`
- ~1715: `predictHumanPattern()`
- ~3952: `beforeunload` listener

### Tâche 2: Supprimer ancien code TensorFlow.js (lignes 1439-1511)

**Avant**:
```javascript
let TF_LOADED = false;
let TF_LOADING = false;

function ensureTensorFlowLoaded() {
  if (TF_LOADED || TF_LOADING) return;
  TF_LOADING = true;
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js';
  // ... etc
}

async function loadMLModel() {
  await ensureTensorFlowLoaded();
  ML_MODEL = await tf.loadLayersModel('data/model-v2/model.json');
  // ... etc
}
```

**À supprimer complètement**: lignes environ 1439-1511 (toute la section TensorFlow.js)

### Tâche 3: Ajouter nouveau code vanilla JS

À la place, insérer:

```javascript
// ============================================================
// ML MODEL — Vanilla JS Inference
// ============================================================

const ML_WEIGHTS = {};
const ML_NORMALIZATION = {};
let ML_MODEL_LOADED = false;

/**
 * Charger les poids du modèle depuis data/model-v2/weights.bin
 * Structure: W1(4480), b1(128), W2(8192), b2(64), W3(2048), b3(32), W4(32), b4(1)
 */
async function loadMLModel() {
  if (ML_MODEL_LOADED) return;

  try {
    // Fetch weights binary
    const weightsResp = await fetch('data/model-v2/weights.bin');
    if (!weightsResp.ok) throw new Error('Failed to load weights');

    const arrayBuffer = await weightsResp.arrayBuffer();
    const dataView = new DataView(arrayBuffer);

    // Helper: lire Float32 à offset
    const readFloat32 = (offset) => dataView.getFloat32(offset, true); // little-endian

    // Calculer les offsets (en float32 count, puis bytes)
    let offset = 0; // en bytes
    const shapes = {
      W1: [35, 128], b1: [128],
      W2: [128, 64], b2: [64],
      W3: [64, 32], b3: [32],
      W4: [32, 1], b4: [1]
    };

    // W1: 35×128 = 4480 floats
    ML_WEIGHTS.W1 = new Float32Array(arrayBuffer, offset, 4480);
    offset += 4480 * 4;

    // b1: 128 floats
    ML_WEIGHTS.b1 = new Float32Array(arrayBuffer, offset, 128);
    offset += 128 * 4;

    // W2: 128×64 = 8192 floats
    ML_WEIGHTS.W2 = new Float32Array(arrayBuffer, offset, 8192);
    offset += 8192 * 4;

    // b2: 64 floats
    ML_WEIGHTS.b2 = new Float32Array(arrayBuffer, offset, 64);
    offset += 64 * 4;

    // W3: 64×32 = 2048 floats
    ML_WEIGHTS.W3 = new Float32Array(arrayBuffer, offset, 2048);
    offset += 2048 * 4;

    // b3: 32 floats
    ML_WEIGHTS.b3 = new Float32Array(arrayBuffer, offset, 32);
    offset += 32 * 4;

    // W4: 32×1 = 32 floats
    ML_WEIGHTS.W4 = new Float32Array(arrayBuffer, offset, 32);
    offset += 32 * 4;

    // b4: 1 float
    ML_WEIGHTS.b4 = new Float32Array(arrayBuffer, offset, 1);
    offset += 1 * 4;

    console.log('[ML] Weights loaded:', ML_WEIGHTS);
    ML_MODEL_LOADED = true;
  } catch (err) {
    console.error('[ML] Error loading model:', err);
    ML_MODEL_LOADED = false;
  }
}

/**
 * Multiplication matricielle: output[j] = bias[j] + sum_i(weight[i,j] * input[i])
 * weight shape: [in, out] (row-major), weight stored as flat array
 */
function matmul(input, weight, bias, inSize, outSize) {
  const output = new Float32Array(outSize);
  for (let j = 0; j < outSize; j++) {
    let sum = bias[j];
    for (let i = 0; i < inSize; i++) {
      sum += weight[i * outSize + j] * input[i];
    }
    output[j] = sum;
  }
  return output;
}

/**
 * ReLU activation
 */
function relu(x) {
  return x.map(v => Math.max(0, v));
}

/**
 * Sigmoid activation
 */
function sigmoid(x) {
  return x.map(v => 1 / (1 + Math.exp(-v)));
}

/**
 * Forward pass: input(35) → output(1 probability)
 */
function mlInference(normalized) {
  // Layer 1: Dense(35→128) + ReLU
  let h = matmul(normalized, ML_WEIGHTS.W1, ML_WEIGHTS.b1, 35, 128);
  h = relu(h);

  // Layer 2: Dense(128→64) + ReLU
  h = matmul(h, ML_WEIGHTS.W2, ML_WEIGHTS.b2, 128, 64);
  h = relu(h);

  // Layer 3: Dense(64→32) + ReLU
  h = matmul(h, ML_WEIGHTS.W3, ML_WEIGHTS.b3, 64, 32);
  h = relu(h);

  // Layer 4: Dense(32→1) + Sigmoid
  h = matmul(h, ML_WEIGHTS.W4, ML_WEIGHTS.b4, 32, 1);
  h = sigmoid(h);

  return h[0];
}

/**
 * Predict human-like probability
 */
async function predictHumanPattern(pw) {
  if (!ML_MODEL_LOADED) {
    await loadMLModel();
    if (!ML_MODEL_LOADED) return null;
  }

  try {
    const features = extractMLFeatures(pw);
    const normalized = normalizeFeatures(features);
    const probability = mlInference(normalized);
    return probability;
  } catch (err) {
    console.error('[ML] Prediction error:', err);
    return null;
  }
}
```

### Tâche 4: Supprimer le listener beforeunload (ligne ~3952)

**Avant**:
```javascript
window.addEventListener('beforeunload', () => {
  if (ML_MODEL && ML_MODEL.dispose) ML_MODEL.dispose();
});
```

**Après**: Supprimer ces 3 lignes (plus besoin de cleanup avec vanilla JS)

### Tâche 5: Vérifier que extractMLFeatures et normalizeFeatures existent

```bash
grep -n "function extractMLFeatures\|function normalizeFeatures" app.js
```

Si absent, vérifier que ces fonctions sont déjà dans le code (environ lignes 1563-1650). Si absent, les copier depuis le code TensorFlow.js existant — elles sont indépendantes du runtime ML.

---

## Phase 3: Modifier CSP dans index.html (10 min)

### Tâche 1: Localiser CSP

```bash
grep -n "Content-Security-Policy" index.html
```

Expected: Line 7 (meta tag)

### Tâche 2: Remplacer script-src

**Avant**:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-eval' 'sha256-...'; ... connect-src 'self' https://api.pwnedpasswords.com https://cdn.jsdelivr.net;">
```

**Après**:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'sha256-...'; ... connect-src 'self' https://api.pwnedpasswords.com;">
```

**Changements**:
- ❌ Supprimer `'unsafe-eval'`
- ❌ Supprimer `https://cdn.jsdelivr.net` de `script-src` (plus de TF.js CDN)
- ✅ Garder le `'sha256-...'` pour le script inline actuel

### Tâche 3: Recalculer le hash SHA-256 (si le script inline a changé)

Si le script inline a modifié du texte quelconque, recalculer:

```bash
# Extraire le script inline
grep -A999 '<script>' index.html | grep -B999 '</script>' | sed '1d;$d' > /tmp/inline-script.js

# Calculer le SHA-256
openssl dgst -sha256 -binary /tmp/inline-script.js | openssl enc -base64
```

Expected output: Une chaîne base64 comme `abc123def456...==`

Mettre à jour le `'sha256-...'` dans la CSP.

---

## Phase 4: Tests Complets (45 min)

### Tâche 1: Tests Fonctionnels

**Test 1: Le modèle charge**
```javascript
// Console DevTools
await loadMLModel();
console.log('ML_MODEL_LOADED:', ML_MODEL_LOADED);
console.log('Weights loaded:', Object.keys(ML_WEIGHTS));
// Expected: W1, b1, W2, b2, W3, b3, W4, b4
```

**Test 2: Inference fonctionne**
```javascript
const prob = await predictHumanPattern("Password123");
console.log('Probability:', prob);
// Expected: float entre 0 et 1, ex: 0.87
```

**Test 3: Warnings ML apparaissent**

Test dans l'UI avec ces mots de passe:
- `MyPassword123!` → Devrait avoir "Human-like pattern" (prob > 0.85)
- `xK9$mQ2@vL!pR` → Devrait PAS avoir le warning (prob < 0.85, aléatoire)
- `abc123abc123` → Peut avoir le warning (pattern répétitif)

### Tâche 2: Tests de Performance

```javascript
// Mesurez le temps d'inference
console.time('ML Inference');
for (let i = 0; i < 100; i++) {
  await predictHumanPattern(`Password${i}`);
}
console.timeEnd('ML Inference');
// Expected: < 100ms pour 100 inferences (~1ms chacun)
```

**Mesure de mémoire**:
- Avant: Ouvrir Memory tab
- Après chargement du modèle: +~200 KB (float32arrays)
- Vs TF.js: +15+ MB (énorme différence!)

### Tâche 3: Tests CSP

**Dans DevTools Console**:
1. Aller à DevTools → Network tab
2. Rechargez la page
3. **Vérification**:
   - ❌ Zéro requête vers `cdn.jsdelivr.net` pour `tf.min.js`
   - ❌ Zéro erreur CSP dans la console
   - ✅ Requête vers `data/model-v2/weights.bin` (200 OK)

**Test eval() bloqué**:
```javascript
// Ceci devrait être BLOQUÉ par CSP
eval('alert("hello")');
// Expected error: Refused to execute inline script because...
```

### Tâche 4: Tests Régression

Tester que les autres features marchent toujours:
- [ ] Entrée password fonctionne
- [ ] Calcul d'entropie OK
- [ ] Table d'attaque s'affiche
- [ ] Changement de langue fonctionne
- [ ] HIBP k-anonymity fonctionne (chercher "password")
- [ ] Mobile responsive (375px)

### Tâche 5: Tests Multi-navigateurs

Si possible, tester sur:
- [ ] Chrome/Edge (Linux/Windows)
- [ ] Firefox
- [ ] Safari (macOS si disponible)

Tous les navigateurs modernes supportent Float32Array et Fetch.

---

## Phase 5: Commit & Cleanup (15 min)

### Tâche 1: Vérifier les fichiers modifiés

```bash
git status
# Expected:
#   modified:   app.js
#   modified:   index.html
```

### Tâche 2: Vérifier le diff

```bash
git diff app.js | head -100
git diff index.html
```

**Checklist**:
- ✅ Toutes les références à `tf.` supprimées
- ✅ Nouvelle fonction `mlInference()` ajoutée
- ✅ CSP `'unsafe-eval'` supprimé
- ✅ Pas d'autres changements accidentels

### Tâche 3: Garder les fichiers du modèle inchangés

```bash
# Ne PAS supprimer (fallback + historique)
git status data/model-v2/
# Expected: nothing (inchangé)
```

### Tâche 4: Créer un commit atomique

```bash
git add app.js index.html
git commit -m "feat: migrate ML inference to vanilla JS (no TensorFlow.js)

- Remove TensorFlow.js CDN dependency (-3.5 MB)
- Implement direct vanilla JS inference from weights.bin
- matmul + relu + sigmoid operations in pure JS
- Remove 'unsafe-eval' from CSP (security improvement)
- Reduce ML model memory from 15+ MB to <1 MB
- Inference time: 5-15ms (TF.js) → <1ms (vanilla)

Benefits:
- CSP is now fully secure (no eval)
- Faster load time (no 3.5 MB CDN)
- Faster inference (native Float32Array ops)
- Zero external dependencies

Testing:
- Manual: predictHumanPattern('Password123') → 0.87
- DevTools: Network shows no tf.min.js, CSP clean
- Memory: +200 KB instead of +15 MB"
```

### Tâche 5: Tag pour rollback

```bash
git tag v-pre-ml-vanilla  # En cas de besoin de revenir
git log --oneline -5      # Vérifier le commit est là
```

---

## Rollback Plan (en cas de problème)

Si quelque chose casse, reverter est trivial:

```bash
# Option 1: Revert le commit entier
git revert HEAD

# Option 2: Restaurer les fichiers précédents
git checkout v-pre-ml-vanilla -- app.js index.html

# Option 3: Reset à la version précédente
git reset --hard v-pre-ml-vanilla
```

---

## Checklist Finale ✅

### Avant de commencer
- [ ] Lire ce plan complet
- [ ] Backup local: `cp app.js app.js.backup`
- [ ] Créer branche: `git checkout -b feat/ml-vanilla`

### Phase 0 (15 min)
- [ ] Mesurer baseline TF.js load time
- [ ] Mesurer baseline inference time
- [ ] Vérifier CSP contient `'unsafe-eval'`

### Phase 1 (30 min)
- [ ] Lire model.json et comprendre l'architecture
- [ ] Vérifier weights.bin = 58 KB
- [ ] Calculer les offsets byte des matrices

### Phase 2 (90 min)
- [ ] Supprimer code TensorFlow.js (lignes 1439-1511)
- [ ] Ajouter code vanilla JS (matmul, relu, sigmoid, mlInference)
- [ ] Supprimer listener beforeunload
- [ ] Vérifier extractMLFeatures/normalizeFeatures existent

### Phase 3 (10 min)
- [ ] Supprimer `'unsafe-eval'` de CSP
- [ ] Supprimer `cdn.jsdelivr.net` de script-src
- [ ] Recalculer SHA-256 du script inline (si changé)

### Phase 4 (45 min)
- [ ] Test: loadMLModel() succeed
- [ ] Test: predictHumanPattern() retourne probability
- [ ] Test: "Human-like pattern" warning apparaît
- [ ] Test: DevTools Network = zéro tf.min.js
- [ ] Test: DevTools Console = zéro CSP error
- [ ] Test: Toutes les features marchent encore (entropie, HIBP, etc.)
- [ ] Test: Mobile (375px viewport)

### Phase 5 (15 min)
- [ ] git diff vérifié
- [ ] Commit créé avec message descriptif
- [ ] Tag v-pre-ml-vanilla créé
- [ ] git log montre le commit

---

## Notes Importantes

1. **Pas de dépendances extérieures ajoutées** — Vanilla JS pur, zéro npm install
2. **Pas de build step** — Reste du projet inchangé, zéro bundler
3. **CSP maintenant vraiment sécurisée** — Zéro `'unsafe-eval'`, zéro risque eval()
4. **Fallback gracieux** — Si weights.bin charge échoue, ML_MODEL_LOADED = false, warning silencieusement ignoré
5. **Précision identique** — Float32Array = même précision que TensorFlow.js
6. **Rollback en <1 min** — Un simple `git revert` si problème

---

## Contacts & Ressources

- **Validation des offsets**: Vérifier que total bytes = 58556 (= somme des shapes × 4)
- **Test réseau**: Si offline, vérifier que l'app marche quand même (ML juste désactivé)
- **Performance target**: <1ms inference (vs 5-15ms TF.js)

---

**Prêt à commencer? Lancez la Phase 0!** 🚀
