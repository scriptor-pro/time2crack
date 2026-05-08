# Compression Configuration for Time2Crack

## 📊 Compression Impact

Time2Crack uses pre-compressed assets to dramatically reduce load times:

| File | Original | Gzip | Brotli | Best Savings |
|------|----------|------|--------|--------------|
| `index.html` | 36KB | 8.3KB (-77%) | **7.8KB (-78%)** | Brotli |
| `app.js` | 170KB | 46KB (-73%) | **42KB (-75%)** | Brotli |
| `styles.css` | 37KB | 7.3KB (-80%) | **6.9KB (-82%)** | Brotli |
| **Total** | **243KB** | **61.6KB (-75%)** | **56.7KB (-77%)** | **Brotli** |

Combined with Phase 2 optimizations (TensorFlow.js lazy loading), initial page load drops from **690KB → 56.7KB** (**-92% total reduction**).

---

## 🔧 Setup Instructions

### Option 1: Pre-compression (Recommended)

**Run before each deployment:**

```bash
./compress.sh
```

This generates `.gz` and `.br` files for all static assets.

**What it does:**
- Creates `index.html.gz` / `index.html.br`
- Creates `app.js.gz` / `app.js.br`
- Creates `styles.css.gz` / `styles.css.br`
- Creates `favicon.svg.gz` / `favicon.svg.br`

**Server requirements:**
- Must support serving pre-compressed files
- Apache: Use provided `.htaccess`
- Nginx: Use provided `nginx.conf`
- Cloudflare Pages / Netlify / Vercel: Automatic

---

### Option 2: Dynamic Compression

If your server doesn't support pre-compressed files, enable dynamic compression:

#### Apache (.htaccess)

```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml
</IfModule>
```

#### Nginx

```nginx
gzip on;
gzip_types text/html text/css application/javascript image/svg+xml;
gzip_min_length 1024;
gzip_comp_level 6;
```

---

## 🚀 Codeberg Pages Setup

**Current Status:** Codeberg Pages does **not** automatically compress files.

**Solutions:**

### A. Pre-compression (Easiest)

1. Run `./compress.sh` before pushing
2. Commit `.gz` and `.br` files
3. Configure server (see below)

### B. Cloudflare CDN (Recommended)

1. Add site to Cloudflare (free plan)
2. Point DNS to Codeberg Pages
3. Enable "Auto Minify" + "Brotli" in Cloudflare dashboard
4. Cloudflare automatically compresses on-the-fly

**Result:** 
- No manual compression needed
- Brotli compression automatic
- Global CDN caching
- Free SSL/TLS

### C. Reverse Proxy (Advanced)

Set up nginx reverse proxy in front of Codeberg Pages:

```nginx
server {
    listen 443 ssl http2;
    server_name time2crack.eu;
    
    # Proxy to Codeberg Pages
    location / {
        proxy_pass https://baudouin.codeberg.page/crack-date/;
        proxy_set_header Host $host;
    }
    
    # Enable compression
    gzip on;
    gzip_types text/html text/css application/javascript image/svg+xml;
    gzip_min_length 1024;
    gzip_comp_level 6;
}
```

---

## 🧪 Testing Compression

### Check if compression is working:

```bash
# Test Gzip
curl -sI -H "Accept-Encoding: gzip" https://time2crack.eu/ | grep -i content-encoding

# Test Brotli
curl -sI -H "Accept-Encoding: br" https://time2crack.eu/ | grep -i content-encoding

# Compare sizes
curl -s https://time2crack.eu/ | wc -c                    # Uncompressed
curl -s -H "Accept-Encoding: gzip" https://time2crack.eu/ | wc -c  # Compressed
```

**Expected output:**
```
content-encoding: br
```
or
```
content-encoding: gzip
```

---

## 📦 Files Generated

After running `./compress.sh`:

```
.
├── index.html       (36KB - original)
├── index.html.gz    (8.3KB - gzip)
├── index.html.br    (7.8KB - brotli)
├── app.js           (170KB - original)
├── app.js.gz        (46KB - gzip)
├── app.js.br        (42KB - brotli)
├── styles.css       (37KB - original)
├── styles.css.gz    (7.3KB - gzip)
├── styles.css.br    (6.9KB - brotli)
└── ...
```

**Git:** Add compressed files to `.gitignore` if you regenerate on each deploy, or commit them if your host doesn't support build steps.

---

## 🎯 Recommended Workflow

### Local Development
```bash
# No compression needed (served from localhost)
python3 -m http.server 8000
```

### Pre-deployment
```bash
# Generate compressed assets
./compress.sh

# Commit (if deploying to static host without build step)
git add *.gz *.br
git commit -m "chore: update compressed assets"
git push
```

### Production (Cloudflare CDN)
```bash
# Just push - Cloudflare handles compression
git push origin pages
```

---

## 📈 Performance Impact

**Before compression:**
- Initial load: 243KB (HTML + JS + CSS)
- Time to Interactive: ~1.5s (on 3G)

**After compression (Brotli):**
- Initial load: 56.7KB (**-77%**)
- Time to Interactive: ~0.5s (**-67%**)

**Combined with lazy loading:**
- Initial load: **56.7KB** (was 690KB)
- Total savings: **-92%**

---

## 🔍 Browser Support

| Compression | Browser Support |
|-------------|-----------------|
| **Gzip** | All browsers (100%) |
| **Brotli** | Chrome 50+, Firefox 44+, Safari 11+, Edge 15+ (~95%) |

**Strategy:** Serve Brotli to modern browsers, Gzip to legacy, uncompressed as fallback.

---

## 💡 Tips

1. **Always serve both `.gz` and `.br`** - browsers choose best format
2. **Brotli is 5-15% better** than gzip but slightly slower to compress
3. **Pre-compression is free** - no CPU cost on server
4. **Don't compress images/videos** - already compressed formats
5. **Use Cloudflare CDN** - easiest solution for static sites

---

## 🐛 Troubleshooting

### Compression not working?

1. Check server headers:
   ```bash
   curl -sI https://time2crack.eu/ | grep -i content-encoding
   ```

2. If no `content-encoding` header:
   - Pre-compressed files not being served
   - Server doesn't support compression
   - Use Cloudflare CDN as workaround

3. Verify files exist:
   ```bash
   ls -lh *.gz *.br
   ```

### Cloudflare not compressing?

1. Check "Auto Minify" is enabled (Speed → Optimization)
2. Check "Brotli" is enabled (Speed → Optimization)
3. Wait 5-10 minutes for cache to update
4. Purge Cloudflare cache if needed

---

## 📚 References

- [Google PageSpeed: Enable Compression](https://developers.google.com/speed/docs/insights/EnableCompression)
- [MDN: Content-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding)
- [Brotli Compression](https://github.com/google/brotli)
- [Can I Use: Brotli](https://caniuse.com/brotli)
