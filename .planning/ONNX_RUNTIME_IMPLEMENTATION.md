# Implémentation ONNX Runtime + Bunny CDN

**Objectif**: Remplacer vanilla JS par ONNX Runtime Web, hébergé sur Bunny CDN.

**Timeline**: 3-4h (incluant conversion ONNX)

---

## 📋 Étapes

### Phase 1: Convertir TensorFlow.js → ONNX (30-45 min)

**Problème**: Python bloqué sur le système.

**Solution**: Google Colab (gratuit, pas d'installation)

#### Étapes:
1. Ouvrir: https://colab.research.google.com
2. Créer nouveau notebook
3. Exécuter les cellules suivantes:

```python
# Cell 1: Install dependencies
!pip install -q tensorflow==2.15.0 tf2onnx onnx onnxsim tensorflowjs

# Cell 2: Download your model files from the project
import os
from google.colab import files

# Upload model.json and weights.bin
print("Upload data/model-v2/model.json and weights.bin")
uploaded = files.upload()
print("Files uploaded:", list(uploaded.keys()))

# Cell 3: Convert TensorFlow.js → SavedModel
!tensorflowjs_converter \
  --input_format=tfjs_layers_model \
  --output_format=tf_saved_model \
  model.json saved_model/

# Cell 4: Convert SavedModel → ONNX
!python -m tf2onnx.convert \
  --saved-model saved_model/ \
  --output model_raw.onnx \
  --opset 13

# Cell 5: Optimize with onnxsim
!onnxsim model_raw.onnx model.onnx

# Cell 6: Download the result
files.download('model.onnx')
print("✓ model.onnx downloaded")
```

4. Résultat: `model.onnx` (~65-80 KB)
5. Placer dans: `data/model-v2/model.onnx`

---

### Phase 2: Setup ONNX Runtime Web (45 min)

#### 2.1 Remplacer le code vanilla JS dans app.js

**Remplacer les lignes 1439-1728 par**:

```javascript
  // ============================================================
  // ML MODEL — ONNX RUNTIME WEB
  // ============================================================

  let ML_SESSION = null;
  let ML_RUNTIME_LOADED = false;

  /**
   * Dynamically load ONNX Runtime from Bunny CDN
   */
  async function loadONNXRuntime() {
    if (ML_RUNTIME_LOADED) return window.ort;

    try {
      // Load ONNX Runtime from Bunny CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.time2crack.eu/onnxruntime-web@1.17.0/dist/ort.min.js';
      script.async = true;

      await new Promise((resolve, reject) => {
        script.onload = () => {
          ML_RUNTIME_LOADED = true;
          resolve(window.ort);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });

      return window.ort;
    } catch (err) {
      console.warn('Failed to load ONNX Runtime:', err);
      return null;
    }
  }

  /**
   * Load ML model (ONNX format) and normalization parameters
   */
  async function loadMLModel() {
    if (ML_SESSION) return;

    try {
      const ort = await loadONNXRuntime();
      if (!ort) throw new Error('ONNX Runtime not available');

      // Configure WASM backend
      ort.env.wasm.wasmPaths = 'https://cdn.time2crack.eu/onnxruntime-web@1.17.0/dist/';
      ort.env.wasm.numThreads = 1; // Single-thread (no SharedArrayBuffer)
      ort.env.wasm.simdEnabled = true;

      // Load normalization parameters
      const normRes = await fetch('data/model-v2/normalization.json');
      if (!normRes.ok) throw new Error('Normalization file not found');
      ML_NORMALIZATION = await normRes.json();

      // Load ONNX model
      ML_SESSION = await ort.InferenceSession.create('data/model-v2/model.onnx', {
        executionProviders: ['wasm'],
        logSeverityLevel: 3, // Error only
      });

      console.log('✓ ML model v2 loaded (ONNX Runtime)');
      console.log(`  Input: ${ML_SESSION.inputNames[0]}`);
      console.log(`  Output: ${ML_SESSION.outputNames[0]}`);
    } catch (err) {
      console.warn('ML model not available:', err);
      ML_SESSION = null;
      ML_NORMALIZATION = null;
    }
  }

  /**
   * Predict if password is human-created (returns probability 0-1)
   */
  async function predictHumanPattern(pw) {
    // Lazy load ML model on first prediction
    if (!ML_SESSION && ML_NORMALIZATION === undefined) {
      await loadMLModel();
    }

    if (!ML_SESSION || !ML_NORMALIZATION) return null;

    try {
      const ort = await loadONNXRuntime();
      if (!ort) return null;

      const features = extractMLFeatures(pw);

      // Normalize features using training mean/std
      const normalized = features.map((f, i) =>
        (f - ML_NORMALIZATION.mean[i]) / (ML_NORMALIZATION.std[i] + 1e-7)
      );

      // Create input tensor
      const inputData = new Float32Array(normalized);
      const inputTensor = new ort.Tensor('float32', inputData, [1, 35]);

      // Get input/output names from session
      const inputName = ML_SESSION.inputNames[0];
      const outputName = ML_SESSION.outputNames[0];

      // Run inference
      const feeds = { [inputName]: inputTensor };
      const results = await ML_SESSION.run(feeds);
      const outputTensor = results[outputName];

      // Extract probability
      const probability = outputTensor.data[0];

      return probability;
    } catch (err) {
      console.warn('ML prediction error:', err);
      return null;
    }
  }
```

#### 2.2 Supprimer le listener beforeunload

Remplacer (ligne ~3951):
```javascript
  // No ML cleanup needed (ONNX Session handles its own lifecycle)
```

---

### Phase 3: Configuration Bunny CDN (30 min)

#### 3.1 Setup Bunny CDN

1. **Créer compte Bunny** (si pas de compte):
   - https://bunny.net
   - Créer zone "pull"

2. **Créer Pull Zone**:
   - Nom: `time2crack`
   - Origin: `https://time2crack.eu` (votre serveur actuel)
   - Origin Port: 443 (HTTPS)
   - Compression: BROTLI + GZIP
   - Cache: Tout (pas de bypass)

3. **Ajouter CNAME DNS**:
   ```
   cdn.time2crack.eu  CNAME  time2crack.b-cdn.net
   ```
   (Attendre ~24h pour propagation DNS)

4. **SSL/TLS**: Bunny fournit automatiquement via Let's Encrypt

#### 3.2 Uploader les fichiers sur Bunny

**Via Bunny Storage** (recommandé):

1. Créer bucket Storage: `time2crack-cdn`
2. Configurer FTP/API access
3. Uploader:
   ```
   /onnxruntime-web@1.17.0/dist/ort.min.js (400 KB)
   /onnxruntime-web@1.17.0/dist/ort-wasm.wasm (8 MB)
   /onnxruntime-web@1.17.0/dist/ort-wasm-simd.wasm (8 MB)
   ```

**Ou via GitHub** (plus simple):

1. Créer repo GitHub public: `time2crack-cdn`
2. Uploader les fichiers
3. Configuration Bunny:
   - Origin: `https://raw.githubusercontent.com/username/time2crack-cdn/main/`
   - Pull Zone: `cdn.time2crack.eu`

#### 3.3 Mettre à jour CSP dans index.html

Ligne 7, remplacer:
```html
<!-- AVANT -->
content="default-src 'self'; script-src 'self' 'sha256-...' https://umami.bvh.fyi; connect-src 'self' https://api.pwnedpasswords.com https://umami.bvh.fyi"

<!-- APRÈS -->
content="default-src 'self'; script-src 'self' 'sha256-...' https://umami.bvh.fyi https://cdn.time2crack.eu; connect-src 'self' https://api.pwnedpasswords.com https://umami.bvh.fyi https://cdn.time2crack.eu"
```

---

### Phase 4: Déploiement et Tests (45 min)

#### 4.1 Vérifier l'ONNX model
```bash
# Vérifier que model.onnx existe
ls -lh data/model-v2/model.onnx

# Doit être ~65-80 KB
```

#### 4.2 Tests locaux
```bash
# Lancer serveur local
python3 -m http.server 8000

# Ouvrir http://localhost:8000
```

#### 4.3 Tests DevTools

**Console**:
```javascript
// Devrait voir:
// ✓ ML model v2 loaded (ONNX Runtime)
// Input: input
// Output: output
```

**Network tab**:
- [ ] `ort.min.js` chargé depuis CDN (400 KB)
- [ ] `ort-wasm*.wasm` chargé depuis CDN (8 MB)
- [ ] `model.onnx` chargé (65-80 KB)
- [ ] Zéro erreur CSP
- [ ] Zéro TensorFlow.js (3.5 MB pas chargé)

**Fonctionnel**:
- [ ] "Password123" → "Human-like pattern" apparaît
- [ ] "xK9$mQ2@vL!pR" → Pas de warning ML
- [ ] Entropie calcule correctement
- [ ] HIBP k-anonymity fonctionne
- [ ] Mobile responsive (375px viewport)

#### 4.4 Performance Baseline

```javascript
// Console
console.time('ML Load');
// ... entrer un mot de passe avec pattern humain ...
console.timeEnd('ML Load');
// Expected: <300ms

console.time('ML Inference');
// ... regarder la prédiction ...
console.timeEnd('ML Inference');
// Expected: 2-5ms per prediction
```

---

## 📦 Fichiers à Créer/Modifier

### À créer:
- `data/model-v2/model.onnx` (65-80 KB) — Résultat conversion Colab

### À modifier:
- `app.js` (lignes 1439-1728, 3951) — Code ONNX Runtime
- `index.html` (ligne 7) — CSP + Bunny CDN

### À uploader sur Bunny:
```
onnxruntime-web@1.17.0/dist/
├── ort.min.js (~400 KB)
├── ort-wasm.wasm (~8 MB)
├── ort-wasm-simd.wasm (~8 MB)
└── ort-wasm-simd-threaded.wasm (~8 MB)
```

---

## 🔍 Vérification Finale

### Checklist Déploiement

- [ ] model.onnx existe (data/model-v2/model.onnx)
- [ ] app.js modifié (ONNX Runtime code)
- [ ] index.html CSP mis à jour (Bunny CDN)
- [ ] Bunny CDN configuré (dns + files)
- [ ] DNS propagé (cdn.time2crack.eu → b-cdn.net)
- [ ] Files sur Bunny (ort.min.js + WASM)
- [ ] Tests locaux passent
- [ ] DevTools Network OK
- [ ] Pas d'erreur CSP
- [ ] Fonctionnel: predictions ML travaillent

### CSP Validation

```javascript
// Console — Ceci doit être BLOQUÉ:
eval('alert("test")');
// Résultat: Content Security Policy: Refused to execute inline script

// Ceci doit fonctionne:
predictHumanPattern("Password123");
// Résultat: probability (ex: 0.87)
```

---

## 📊 Résultats Attendus

| Métrique | Vanilla JS | ONNX Runtime |
|----------|-----------|-------------|
| CSP Safe | ✅ Oui | ✅ Oui |
| Load (first) | ~50 ms | ~200 ms |
| Inference | <1 ms | 2-5 ms |
| Memory | <1 MB | ~200 MB (WebAssembly) |
| JS Size | 0 KB | 400 KB + 8 MB WASM |
| Extensible | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Future-proof | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🎯 Avantages ONNX + Bunny

✅ **ONNX**:
- Standard industriel (Microsoft, Meta, OpenAI)
- Supportera CNN/RNN si modèle évolue
- Optimisé via onnxsim
- Future-proof

✅ **Bunny CDN**:
- Coût faible ($5-10/mois)
- ~100-200 GB/mois trafic
- Edge locations worldwide
- Cache intelligent
- SSL/TLS gratuit

✅ **Combinaison**:
- Performance WASM (2-5x plus rapide que vanilla JS)
- Scalabilité (peut supporter modèles complexes)
- Maintenance (équipe ONNX Runtime)
- Coût modéré

---

## ⚠️ Prérequis

1. **Google Colab** (gratuit, pas d'installation)
2. **Bunny CDN** compte (gratuit tier ok)
3. **DNS CNAME** access (pour cdn.time2crack.eu)
4. **FTP/Storage** access Bunny

---

## 🔗 Ressources

- ONNX Runtime Web: https://github.com/microsoft/onnxruntime-web
- Bunny CDN: https://bunny.net
- Google Colab: https://colab.research.google.com
- tf2onnx: https://github.com/onnx/tensorflow-onnx

