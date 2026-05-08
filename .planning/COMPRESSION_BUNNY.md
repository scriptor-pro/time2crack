# Compression avec Bunny.net CDN

## 🐰 Alternative à Cloudflare

**Bunny.net** est un excellent CDN européen, réputé pour :
- ✅ **Privacy-first** (GDPR compliant, basé en Slovénie)
- ✅ **Performance Europe** exceptionnelle (24ms médian vs 27ms Cloudflare)
- ✅ **Pricing transparent** (pay-as-you-go, $1 minimum)
- ✅ **Support premium** (Super Bunnies™ réactifs)

**Inconvénient :** Pas gratuit comme Cloudflare (mais très abordable : ~$5-10/mois pour un petit site).

---

## 💰 Coût Estimé pour Time2Crack

**Trafic estimé :** 1-5 TB/mois (site statique avec wordlists)

### Option 1 : Standard Network (119 PoPs)
- Europe & North America : **$0.01/GB**
- **Coût mensuel** : $10-50

### Option 2 : Volume Network (10 PoPs, haute bande passante)
- Tarif global : **$0.005/GB** (premiers 500TB)
- **Coût mensuel** : $5-25
- **Note** : Moins de PoPs, mais moitié prix

**Recommandation :** Standard Network (meilleure performance pour les petits sites).

---

## 🚀 Setup Bunny.net CDN

### Étape 1 : Créer un Compte

1. Aller sur [bunny.net](https://bunny.net)
2. Cliquer "Get Started" → "Sign Up"
3. Email + mot de passe
4. **Ajouter $10 de crédit** (carte bancaire ou PayPal)
   - Durée estimée : 1-2 mois pour Time2Crack

---

### Étape 2 : Créer une Pull Zone

1. Dans le Dashboard : **CDN** → **Add Pull Zone**

2. Configuration :
   ```
   Name: time2crack
   Origin URL: https://baudouin.codeberg.page/crack-date/
   Type: Standard (ou Volume si >5TB/mois)
   ```

3. **Pricing Zone** : Sélectionner "Tier 1 - Europe, North & South America"
   - Autres régions : Désactiver (économie)

4. **Caching** :
   - Cache Expiration Time : 1 hour
   - Browser Cache Expiration : 4 hours

5. **Compression** (IMPORTANT) :
   - ✅ **Enable Brotli** : ON
   - ✅ **Enable Gzip** : ON
   - Auto Minify : ON (HTML, CSS, JS)

6. Cliquer **Add Pull Zone**

---

### Étape 3 : Configurer le DNS

Bunny.net vous donnera un hostname comme :
```
time2crack.b-cdn.net
```

**Option A : CNAME (Recommandé)**

Chez votre registrar DNS :
```
CNAME  www      time2crack.b-cdn.net
CNAME  @        time2crack.b-cdn.net  (si supporté)
```

**Option B : A Record (Si CNAME @ pas supporté)**

1. Dans Bunny Dashboard : **Networking** → **Hostnames**
2. Ajouter `time2crack.eu`
3. Bunny vous donnera une IP
4. Créer A record chez votre registrar :
   ```
   A  @  [IP fournie par Bunny]
   ```

---

### Étape 4 : Activer SSL/TLS

1. Dans Pull Zone : **SSL** → **Add Free SSL Certificate**
2. Choisir **Let's Encrypt** (gratuit, auto-renew)
3. Hostname : `time2crack.eu` + `www.time2crack.eu`
4. **Force SSL** : ON
5. Attendre 2-5 minutes (provisioning automatique)

---

### Étape 5 : Optimisations Avancées

#### A. Perma-Cache (Recommandé)

Stocke les fichiers statiques **en permanence** sur les edge servers :

1. **Optimizer** → **Perma-Cache** → Enable
2. Extensions : `jpg,jpeg,png,gif,svg,css,js,woff,woff2,ttf`
3. Impact : CDN sert les fichiers même si Codeberg est down

#### B. Optimizer (Images)

Si vous ajoutez des images plus tard :

1. **Add Bunny Optimizer**
2. Auto WebP conversion : ON
3. Lazy loading : ON
4. Quality : 85% (balance taille/qualité)

#### C. Edge Rules (Optionnel)

Ajouter des règles de cache personnalisées :

```
# Cache HTML 1 heure
If Request URL matches: *.html
Action: Override Cache Time → 3600 seconds

# Cache JS/CSS 1 semaine
If Request URL matches: *.js, *.css
Action: Override Cache Time → 604800 seconds

# Cache wordlists 1 mois
If Request URL matches: */wordlists/*
Action: Override Cache Time → 2592000 seconds
```

---

### Étape 6 : Vérifier la Compression

```bash
# Test compression
curl -sI -H "Accept-Encoding: br" https://time2crack.eu/ | grep content-encoding
# Attendu: content-encoding: br

# Test taille
curl -s https://time2crack.eu/ | wc -c          # Sans compression (depuis origin)
curl -s -H "Accept-Encoding: br" https://time2crack.eu/ | wc -c  # Avec compression
```

**Attendu :**
- `index.html` : 36KB → **7.8KB** (-78%)
- `app.js` : 170KB → **42KB** (-75%)
- `styles.css` : 37KB → **6.9KB** (-81%)

---

## 📊 Monitoring & Analytics

### Dashboard Bunny.net

1. **Statistics** : Voir bande passante utilisée
2. **Requests** : Nombre de requêtes par heure
3. **Cache Hit Ratio** : % de fichiers servis depuis cache
   - **Objectif** : >90% (excellent)
   - <70% : Augmenter Cache Expiration Time

### Alertes de Coût

1. **Billing** → **Overcharge Protection**
2. Définir limite mensuelle : $20 (sécurité)
3. Email alert quand 80% atteint

---

## 💡 Optimisations Supplémentaires

### 1. Purge Cache Automatique

Quand vous pushez vers Codeberg Pages :

```bash
# Via Bunny API
curl -X POST "https://api.bunny.net/pullzone/PULL_ZONE_ID/purgeCache" \
  -H "AccessKey: YOUR_API_KEY"
```

**Setup :**
1. Bunny Dashboard → **Account** → **API**
2. Copier API Key
3. Ajouter à Codeberg Actions (CI/CD) après deploy

### 2. Geo-Blocking (Optionnel)

Si spam de certains pays :

1. **Security** → **Geo-Blocking**
2. Bloquer pays spécifiques
3. Économie de bande passante

### 3. Token Authentication (Sécurité)

Protéger les wordlists contre hotlinking :

1. **Security** → **Token Authentication**
2. Générer token secret
3. URLs deviennent : `time2crack.eu/file?token=XXX`

---

## 🆚 Bunny.net vs Cloudflare - Tableau Comparatif

| Feature | Bunny.net | Cloudflare Free |
|---------|-----------|-----------------|
| **Prix** | $5-10/mois (Time2Crack) | **Gratuit** |
| **PoPs** | 119 (Standard) | 330+ |
| **Compression** | Gzip + Brotli | Gzip + Brotli |
| **Performance EU** | ⭐⭐⭐⭐⭐ (24ms) | ⭐⭐⭐⭐ (27ms) |
| **Privacy** | ⭐⭐⭐⭐⭐ GDPR-first | ⭐⭐⭐ OK |
| **Support** | Super Bunnies™ (chat) | Community forum |
| **DDoS Protection** | Inclus | Inclus |
| **SSL** | Let's Encrypt (auto) | Let's Encrypt (auto) |
| **Analytics** | Détaillées | Basiques (Free) |
| **Perma-Cache** | ✅ Oui | ❌ Non |
| **Image Optimizer** | ✅ Oui (+$) | ❌ Non (Free) |

---

## 🎯 Quand Choisir Bunny.net ?

### ✅ **Utilisez Bunny.net si :**
1. Vous voulez le **meilleur support client** (Super Bunnies™ très réactifs)
2. **Privacy/GDPR** est une priorité absolue
3. Votre audience est **principalement européenne**
4. Vous voulez **Perma-Cache** (fichiers persistent même si origin down)
5. Vous avez un **budget** ($5-20/mois acceptable)
6. Vous préférez éviter les **GAFAM** et gros acteurs US

### ❌ **Restez avec Cloudflare si :**
1. **Budget = $0** (gratuit absolu requis)
2. Audience **mondiale** (330 PoPs vs 119)
3. Vous voulez le **plus simple** (setup 5 min, zero config)
4. Trafic **imprévisible** (pas de risque de facture surprise)

---

## 📈 Impact Attendu (Identique à Cloudflare)

**Avant CDN :**
- Initial load : 243KB (HTML+JS+CSS)
- Total avec TF.js : 690KB
- Time to Interactive : ~1.5s

**Après Bunny.net CDN :**
- Initial load : **56.7KB** (Brotli, -77%)
- Total : **56.7KB** (-92% vs original)
- Time to Interactive : **~0.5s** (-67%)
- **+ Perma-Cache** : Files servis même si Codeberg down

---

## 🐛 Troubleshooting

### "Compression ne fonctionne pas"
1. Vérifier Pull Zone → **Optimizer** → Brotli/Gzip **ON**
2. Purger cache : **Purge** → **Purge Everything**
3. Attendre 5 minutes (propagation)
4. Re-tester : `curl -sI -H "Accept-Encoding: br" https://time2crack.eu/`

### "Cache Hit Ratio faible (<70%)"
1. Augmenter **Cache Expiration Time** (Pull Zone Settings)
2. Vérifier que Codeberg n'envoie pas `Cache-Control: no-cache`
3. Ajouter Edge Rules pour forcer cache

### "Coût plus élevé que prévu"
1. **Statistics** → Voir quelles régions consomment
2. Désactiver régions non-nécessaires (Asie, Afrique si audience EU/US)
3. Activer **Overcharge Protection**

### "SSL Certificate invalide"
1. Attendre 5 minutes (provisioning Let's Encrypt)
2. Vérifier DNS : `dig time2crack.eu` doit pointer vers Bunny
3. Re-générer certificat : **SSL** → **Force SSL** → Re-issue

---

## 📚 Ressources

- [Bunny.net Dashboard](https://dash.bunny.net/)
- [Documentation Bunny.net](https://docs.bunny.net/)
- [API Reference](https://docs.bunny.net/reference/bunnynet-api-overview)
- [Status Page](https://status.bunny.net/)
- [Support (Super Bunnies™)](https://support.bunny.net/)
- [Perma-Cache Guide](https://docs.bunny.net/docs/cdn-perma-cache)

---

## 🔄 Migration Cloudflare → Bunny.net (Si besoin plus tard)

Si vous commencez avec Cloudflare et voulez migrer :

1. **Créer Pull Zone** sur Bunny.net (voir Étape 2)
2. **Tester** avec hostname temporaire (`time2crack.b-cdn.net`)
3. **Basculer DNS** : Changer CNAME vers Bunny
4. **Attendre propagation** (5 minutes - 24 heures)
5. **Désactiver Cloudflare** une fois stable

**Downtime** : Aucun (les deux peuvent coexister temporairement).

---

**TL;DR : Bunny.net est excellent mais coûte $5-10/mois. Pour Time2Crack, Cloudflare gratuit est probablement suffisant. Utilisez Bunny.net si privacy/support/Perma-Cache sont prioritaires.**
