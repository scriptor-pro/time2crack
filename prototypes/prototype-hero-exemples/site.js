(function () {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  const isMethodPage = segments.includes('methode');
  const isLangDir = ['fr', 'en', 'es', 'pt', 'de', 'it', 'tr', 'pl', 'nl'].includes(segments[0]);
  const pageDepth = isMethodPage ? (isLangDir ? 2 : 1) : (isLangDir ? 1 : 0);
  const assetRoot = '../'.repeat(pageDepth) || './';
  const base = isMethodPage ? '../' : './';
  const methodBase = isMethodPage ? './' : 'methode/';

  const pages = {
    index: `${base}index.html`,
    generator: `${base}generator.html`,
    faq: `${base}faq.html`,
    about: `${base}about.html`,
    how: `${base}how-time2crack-works.html`,
    sources: `${base}sources.html`,
    privacy: `${base}privacy.html`,
    hibp: `${base}hibp.html`,
    methodsIndex: `${methodBase}index.html`,
    bruteforce: `${methodBase}bruteforce.html`,
    dictionary: `${methodBase}dictionary.html`,
    hybrid: `${methodBase}hybrid.html`,
    mask: `${methodBase}mask.html`,
    markov: `${methodBase}markov.html`,
    pcfg: `${methodBase}pcfg.html`,
    combinator: `${methodBase}combinator.html`
  };

  const navActive = document.body.dataset.page || 'index';

  const header = `
    <header class="site-header">
      <div class="site-header__inner">
        <a class="site-logo" href="${pages.index}" aria-label="Time2Crack">
          <span class="site-logo__mark">🔒</span>
          Time<span class="site-logo__accent">2</span>Crack
        </a>
        <nav class="site-nav" aria-label="Navigation principale">
          <div class="site-nav__primary">
            <a class="nav-link ${navActive === 'index' ? 'is-active' : ''}" href="${pages.index}">Tester un mot de passe</a>
            <a class="nav-link ${navActive === 'generator' ? 'is-active' : ''}" href="${pages.generator}">Générer un mot de passe</a>
          </div>
          <div class="site-nav__secondary">
            <a class="nav-link ${navActive === 'faq' ? 'is-active' : ''}" href="${pages.faq}">FAQ</a>
            <a class="nav-link ${navActive === 'about' ? 'is-active' : ''}" href="${pages.about}">À propos</a>
            <div class="dropdown">
              <button class="nav-toggle" id="science-toggle" type="button" aria-expanded="false" aria-controls="science-menu">
                Science <span aria-hidden="true">▾</span>
              </button>
              <div class="dropdown__menu" id="science-menu" role="menu" aria-label="Science">
                <a class="dropdown__item" href="${pages.how}" role="menuitem">Comment ça fonctionne</a>
                <div class="dropdown__separator"></div>
                <span class="dropdown__group-title">Méthodes d'attaque</span>
                <a class="dropdown__item" href="${pages.bruteforce}" role="menuitem">Force brute</a>
                <a class="dropdown__item" href="${pages.dictionary}" role="menuitem">Dictionnaire</a>
                <a class="dropdown__item" href="${pages.hybrid}" role="menuitem">Hybride</a>
                <a class="dropdown__item" href="${pages.mask}" role="menuitem">Masque</a>
                <a class="dropdown__item" href="${pages.markov}" role="menuitem">Markov</a>
                <a class="dropdown__item" href="${pages.pcfg}" role="menuitem">PCFG</a>
                <a class="dropdown__item" href="${pages.combinator}" role="menuitem">Combinateur</a>
                <div class="dropdown__separator"></div>
                <a class="dropdown__item" href="${pages.sources}" role="menuitem">Sources</a>
              </div>
            </div>
          </div>
        </nav>
        <button class="hamburger" id="drawer-toggle" type="button" aria-expanded="false" aria-controls="mobile-drawer" aria-label="Ouvrir le menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
    <div class="drawer" id="mobile-drawer" hidden>
      <a class="drawer__link ${navActive === 'index' ? 'is-active' : ''}" href="${pages.index}">Tester un mot de passe</a>
      <a class="drawer__link ${navActive === 'generator' ? 'is-active' : ''}" href="${pages.generator}">Générer un mot de passe</a>
      <a class="drawer__link ${navActive === 'faq' ? 'is-active' : ''}" href="${pages.faq}">FAQ</a>
      <a class="drawer__link ${navActive === 'about' ? 'is-active' : ''}" href="${pages.about}">À propos</a>
      <details class="drawer__details">
        <summary>Science</summary>
        <div class="drawer__nested">
          <a class="drawer__link" href="${pages.how}">Comment ça fonctionne</a>
          <a class="drawer__link" href="${pages.bruteforce}">Force brute</a>
          <a class="drawer__link" href="${pages.dictionary}">Dictionnaire</a>
          <a class="drawer__link" href="${pages.hybrid}">Hybride</a>
          <a class="drawer__link" href="${pages.mask}">Masque</a>
          <a class="drawer__link" href="${pages.markov}">Markov</a>
          <a class="drawer__link" href="${pages.pcfg}">PCFG</a>
          <a class="drawer__link" href="${pages.combinator}">Combinateur</a>
          <a class="drawer__link" href="${pages.sources}">Sources</a>
        </div>
      </details>
    </div>
  `;

  const footer = `
    <footer class="footer">
      <div class="footer__links">
        <a href="${pages.about}">À propos</a>
        <a href="${pages.sources}">Sources</a>
        <a href="${pages.privacy}">Confidentialité</a>
        <a href="${pages.hibp}">HIBP</a>
      </div>
      <div class="footer__meta">Prototype Hero · navigation fonctionnelle · pages racine et méthode</div>
    </footer>
  `;

  const headerHost = document.getElementById('site-header');
  const footerHost = document.getElementById('site-footer');
  if (headerHost) headerHost.innerHTML = header;
  if (footerHost) footerHost.innerHTML = footer;

  const drawerToggle = document.getElementById('drawer-toggle');
  const drawer = document.getElementById('mobile-drawer');
  if (drawerToggle && drawer) {
    drawerToggle.addEventListener('click', () => {
      const open = drawer.hidden;
      drawer.hidden = !open;
      drawerToggle.setAttribute('aria-expanded', String(open));
    });
  }

  const scienceToggle = document.getElementById('science-toggle');
  const scienceMenu = document.getElementById('science-menu');
  setupDropdown(scienceToggle, scienceMenu);

  const securityToggle = document.getElementById('security-toggle');
  const securityMenu = document.getElementById('security-menu');
  setupDropdown(securityToggle, securityMenu);

  const langToggle = document.getElementById('lang-toggle');
  const langMenu = document.getElementById('lang-menu');
  setupDropdown(langToggle, langMenu);

  document.addEventListener('click', (event) => {
    [ [scienceToggle, scienceMenu], [securityToggle, securityMenu], [langToggle, langMenu] ].forEach(([toggle, menu]) => {
      if (toggle && menu && !toggle.contains(event.target) && !menu.contains(event.target)) {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    [ [scienceToggle, scienceMenu], [securityToggle, securityMenu], [langToggle, langMenu] ].forEach(([toggle, menu]) => {
      if (toggle && menu) {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    if (drawer && !drawer.hidden) {
      drawer.hidden = true;
      if (drawerToggle) drawerToggle.setAttribute('aria-expanded', 'false');
    }
  });

  function setupDropdown(toggle, menu) {
    if (!toggle || !menu) return;
    toggle.addEventListener('click', () => {
      const open = !menu.classList.contains('is-open');
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  const generatorRoot = document.querySelector('.generator-container');
  if (generatorRoot) {
    initGenerator(generatorRoot);
  }

  function initPasswordTester(input) {
    const results = document.getElementById('results');
    const status = document.getElementById('status');
    const bestAttackName = document.getElementById('best-attack-name');
    const bestAttackTime = document.getElementById('best-attack-time');
    const profileName = document.getElementById('profile-info-name');
    const profileGpus = document.getElementById('profile-info-gpus');
    const profileDesc = document.getElementById('profile-info-desc');
    const ctxLen = document.getElementById('ctx-len');
    const ctxCs = document.getElementById('ctx-cs');
    const ctxDt = document.getElementById('ctx-dt');
    const ctxKb = document.getElementById('ctx-kb');
    const ctxSeq = document.getElementById('ctx-seq');
    const ctxRep = document.getElementById('ctx-rep');
    const ctxDict = document.getElementById('ctx-dict');
    const ctxHybrid = document.getElementById('ctx-hybrid');
    const ctxPass = document.getElementById('ctx-pass');
    const tableBody = document.querySelector('#results-table tbody');

    const profile = {
      amateur: { name: 'Amateur', gpus: '1 GPU', speed: 1.5e9, desc: 'Attaquant opportuniste, machine unique.' },
      experienced: { name: 'Standard', gpus: '12 GPU', speed: 1.5e10, desc: 'Cluster GPU raisonnable, profil par défaut.' },
      professional: { name: 'Pro', gpus: '~100 GPU', speed: 1.25e11, desc: 'Infrastructure dédiée.' },
      nation_state: { name: 'État', gpus: '~10k GPU', speed: 1.25e13, desc: 'Capacité massive et ciblée.' }
    };

    let activeProfile = 'experienced';

    function analyze(pw) {
      const len = pw.length;
      const hasLower = /[a-z]/.test(pw);
      const hasUpper = /[A-Z]/.test(pw);
      const hasDigit = /\d/.test(pw);
      const hasSymbol = /[^A-Za-z0-9]/.test(pw);
      const charset = (hasLower ? 26 : 0) + (hasUpper ? 26 : 0) + (hasDigit ? 10 : 0) + (hasSymbol ? 33 : 0) || 1;
      const entropy = len * Math.log2(charset);
      const kb = /(qwerty|azerty|asdf|zxcv|12345|54321)/i.test(pw);
      const seq = /(abc|bcd|cde|123|234|456|789)/i.test(pw);
      const rep = /(.)\1{2,}/.test(pw);
      const dt = /\b(19|20)\d{2}\b/.test(pw) || /\b\d{2}[/-]\d{2}[/-]\d{2,4}\b/.test(pw);
      const dict = /^(password|welcome|admin|qwerty|letmein|azerty|bonjour|monde|secret|sunshine)$/i.test(pw) || /[a-z]{4,}/i.test(pw) && !hasSymbol && !hasDigit && len <= 12;
      const hybrid = dict && (hasDigit || hasSymbol);
      const passphrase = pw.trim().split(/\s+/).length >= 3 || /[-_]/.test(pw) && pw.split(/[-_]/).length >= 3;
      const complexity = Math.max(0, Math.min(100, Math.round(entropy * 1.2 + (hasLower + hasUpper + hasDigit + hasSymbol) * 5 - (kb ? 10 : 0) - (seq ? 8 : 0) - (rep ? 10 : 0))));
      return { len, charset, entropy, kb, seq, rep, dt, dict, hybrid, passphrase, complexity, hasLower, hasUpper, hasDigit, hasSymbol };
    }

    function attackScores(a) {
      const base = Math.max(1, a.len);
      const bruteRank = Math.pow(a.charset, base) / 2;
      const dictRank = a.dict ? 25 : a.passphrase ? 10000 : Math.pow(10, Math.max(1, 8 - base / 2));
      const hybridRank = a.hybrid ? dictRank * 4 : dictRank * 12;
      const maskRank = (a.kb || a.seq || a.dt) ? Math.max(20, Math.pow(a.charset, Math.max(2, base - 2)) / 10) : Math.pow(a.charset, base) / 3;
      const markovRank = Math.pow(Math.max(2, a.charset - 3), Math.max(2, base - 1)) / (a.rep ? 10 : 1);
      const pcfgRank = a.passphrase ? Math.pow(12, Math.max(2, base / 2)) : Math.pow(20, Math.max(2, base / 2));
      const combinatorRank = a.passphrase ? Math.max(50, Math.pow(6, Math.max(2, a.len / 2))) : Math.pow(50, Math.max(2, a.len / 3));
      return { brute: bruteRank, dictionary: dictRank, hybrid: hybridRank, mask: maskRank, markov: markovRank, pcfg: pcfgRank, combinator: combinatorRank };
    }

    function formatTime(seconds) {
      if (!isFinite(seconds) || seconds < 0) return '—';
      if (seconds < 1e-6) return '< 1 µs';
      if (seconds < 1e-3) return `${Math.round(seconds * 1e6)} µs`;
      if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
      if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;
      const mins = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      if (mins < 60) return `${mins} min ${secs} s`;
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      if (hours < 24) return `${hours} h ${remMins} min`;
      const days = Math.floor(hours / 24);
      const remHours = hours % 24;
      return `${days} j ${remHours} h`;
    }

    function render() {
      const pw = input.value;
      const a = analyze(pw);
      const attacks = attackScores(a);
      const current = profile[activeProfile];
      const best = Object.entries(attacks).sort((x, y) => x[1] - y[1])[0];
      const rows = [
        ['Force brute', 'Bruteforce', attacks.brute],
        ['Dictionnaire', 'Dictionary', attacks.dictionary],
        ['Hybride', 'Hybrid', attacks.hybrid],
        ['Masque', 'Mask', attacks.mask],
        ['Markov', 'Markov', attacks.markov],
        ['PCFG', 'PCFG', attacks.pcfg],
        ['Combinateur', 'Combinator', attacks.combinator]
      ];

      results.hidden = pw.length === 0;
      if (pw.length === 0) {
        status.textContent = 'Entrez un mot de passe pour lancer l’analyse.';
        return;
      }

      status.textContent = a.complexity >= 75 ? 'Mot de passe solide.' : a.complexity >= 45 ? 'Mot de passe moyen.' : 'Mot de passe faible.';
      bestAttackName.textContent = best[0];
      bestAttackTime.textContent = ` · ${formatTime(best[1] / current.speed)}`;
      profileName.textContent = current.name;
      profileGpus.textContent = current.gpus;
      profileDesc.textContent = current.desc;

      ctxLen.textContent = `${a.len}`;
      ctxCs.textContent = `${a.charset}`;
      ctxDt.textContent = a.dt ? 'oui' : 'non';
      ctxKb.textContent = a.kb ? 'oui' : 'non';
      ctxSeq.textContent = a.seq ? 'oui' : 'non';
      ctxRep.textContent = a.rep ? 'oui' : 'non';
      ctxDict.textContent = a.dict ? 'oui' : 'non';
      ctxHybrid.textContent = a.hybrid ? 'oui' : 'non';
      ctxPass.textContent = a.passphrase ? 'oui' : 'non';

      tableBody.innerHTML = rows.map(([label, algo, rank]) => {
        const time = formatTime(rank / current.speed);
        return `<tr${label === best[0] ? ' class="is-best-attack"' : ''}><td>${label}</td><td>${algo}</td><td>${time}</td></tr>`;
      }).join('');
    }

    input.addEventListener('input', render);
    render();
  }

  async function initGenerator(root) {
    const [{ calcCrackTime }, { rankToSeconds }] = await Promise.all([
      import(`${assetRoot}core/calc.js`),
      import(`${assetRoot}core/time.js`),
    ]);

    const length = document.getElementById('length');
    const lengthDisplay = document.getElementById('length-display');
    const entropyBadge = document.getElementById('entropy-badge');
    const strengthFill = document.getElementById('strength-fill');
    const strengthLabel = document.getElementById('strength-label');
    const entropyText = document.getElementById('entropy-text');
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const output = document.getElementById('generated-password');
    const feedback = document.getElementById('generator-feedback');
    const cracking = document.getElementById('cracking-results');
    const bruteTimeFormatted = document.getElementById('brute-time-formatted');
    const bruteTimeBreakdown = document.getElementById('brute-time-breakdown');
    const bestAttackName = document.getElementById('best-attack-name');
    const bestAttackTime = document.getElementById('best-attack-time');

    const controls = {
      uppercase: document.getElementById('include-uppercase'),
      lowercase: document.getElementById('include-lowercase'),
      numbers: document.getElementById('include-numbers'),
      symbols: document.getElementById('include-symbols'),
      ambiguous: document.getElementById('exclude-ambiguous')
    };

    const presets = {
      weak: { length: 8, uppercase: false, lowercase: true, numbers: true, symbols: false, ambiguous: false },
      medium: { length: 16, uppercase: true, lowercase: true, numbers: true, symbols: false, ambiguous: false },
      strong: { length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true, ambiguous: false },
      paranoia: { length: 32, uppercase: true, lowercase: true, numbers: true, symbols: true, ambiguous: true }
    };

    const chars = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()-_=+[]{};:,.?'
    };
    const ambiguous = 'lIO0';

    function getCharset() {
      let set = '';
      if (controls.uppercase.checked) set += chars.uppercase;
      if (controls.lowercase.checked) set += chars.lowercase;
      if (controls.numbers.checked) set += chars.numbers;
      if (controls.symbols.checked) set += chars.symbols;
      if (controls.ambiguous.checked) {
        set = set.split('').filter((ch) => !ambiguous.includes(ch)).join('');
      }
      return set || chars.lowercase + chars.numbers;
    }

    function entropy(len, size) {
      return Math.round(len * Math.log2(Math.max(size, 2)));
    }

    function estimateStrength(score) {
      if (score < 35) return 'Faible';
      if (score < 60) return 'Moyen';
      if (score < 80) return 'Fort';
      return 'Très fort';
    }

    function randomPassword(len, charset) {
      const arr = new Uint32Array(len);
      crypto.getRandomValues(arr);
      let out = '';
      for (let i = 0; i < len; i += 1) out += charset[arr[i] % charset.length];
      return out;
    }

    function analyzePassword(pw) {
      const len = pw.length;
      const hasLower = /[a-z]/.test(pw);
      const hasUpper = /[A-Z]/.test(pw);
      const hasDigit = /\d/.test(pw);
      const hasSymbol = /[^A-Za-z0-9]/.test(pw);
      const charset = (hasLower ? 26 : 0) + (hasUpper ? 26 : 0) + (hasDigit ? 10 : 0) + (hasSymbol ? 33 : 0) || 1;
      const score = Math.max(0, Math.min(100, Math.round(len * 4 + (hasLower + hasUpper + hasDigit + hasSymbol) * 6)));
      return { len, charset, score };
    }

    function renderStats(pw) {
      const data = analyzePassword(pw);
      const e = entropy(data.len, data.charset);
      const strength = estimateStrength(data.score);
      const crack = calcCrackTime(pw, {
        profile: 'experienced',
        lang: document.documentElement.lang || 'fr',
      });
      const detail = crack.rank?.details || {};
      lengthDisplay.textContent = `${length.value}`;
      entropyBadge.textContent = `${entropy(Number(length.value), getCharset().length)} bits`;
      entropyText.textContent = `${e} bits`;
      strengthLabel.textContent = strength;
      strengthFill.style.width = `${data.score}%`;
      strengthFill.dataset.score = String(data.score);
      output.value = pw;
      cracking.style.display = 'block';
      bestAttackName.textContent = crack.best_attack === 'brute' ? 'Force brute'
        : crack.best_attack === 'dictionary' ? 'Dictionnaire'
        : crack.best_attack === 'hybrid' ? 'Hybride'
        : crack.best_attack === 'mask' ? 'Masque'
        : crack.best_attack === 'markov' ? 'Markov'
        : crack.best_attack === 'pcfg' ? 'PCFG'
        : 'Combinateur';
      bestAttackTime.textContent = crack.best_attack_seconds === null ? '—' : formatTime(crack.best_attack_seconds);
      bruteTimeFormatted.textContent = crack.times?.sha256 ? formatTime(crack.times.sha256) : '—';
      bruteTimeBreakdown.textContent = `Charset: ${data.charset} · Entropie: ${e} bits · Rang: ${crack.rank?.standard?.toExponential?.(2) ?? '—'}`;
      const attackRows = {
        brute: ['attack-brute', 'rank-brute'],
        dictionary: ['attack-dict', 'rank-dict'],
        hybrid: ['attack-hybrid', 'rank-hybrid'],
        mask: ['attack-mask', 'rank-mask'],
        markov: ['attack-markov', 'rank-markov'],
        pcfg: ['attack-pcfg', 'rank-pcfg'],
      };
      Object.entries(attackRows).forEach(([attack, [timeId, rankId]]) => {
        const rank = detail[attack]?.rank ?? null;
        const timeEl = document.getElementById(timeId);
        const rankEl = document.getElementById(rankId);
        if (timeEl) {
          timeEl.textContent = rank === null ? '—' : formatTime(rankToSeconds(rank, 'sha256', 'experienced'));
        }
        if (rankEl) {
          rankEl.textContent = rank === null ? '—' : rank.toExponential(2);
        }
      });
    }

    function updateUI() {
      const charset = getCharset();
      const len = Number(length.value);
      lengthDisplay.textContent = `${len}`;
      entropyBadge.textContent = `${entropy(len, charset.length)} bits`;
      const pw = output.value || randomPassword(len, charset);
      renderStats(pw);
      copyBtn.disabled = !output.value;
      feedback.style.display = output.value ? 'block' : 'none';
      feedback.textContent = output.value ? 'Mot de passe prêt.' : 'Cliquez sur Generate pour produire un mot de passe.';
    }

    Object.entries(presets).forEach(([name, preset]) => {
      const btn = root.querySelector(`.preset-btn[data-preset="${name}"]`);
      if (!btn) return;
      btn.addEventListener('click', () => {
        length.value = String(preset.length);
        controls.uppercase.checked = preset.uppercase;
        controls.lowercase.checked = preset.lowercase;
        controls.numbers.checked = preset.numbers;
        controls.symbols.checked = preset.symbols;
        controls.ambiguous.checked = preset.ambiguous;
        updateUI();
      });
    });

    [length, controls.uppercase, controls.lowercase, controls.numbers, controls.symbols, controls.ambiguous].forEach((el) => {
      if (!el) return;
      el.addEventListener('input', updateUI);
      el.addEventListener('change', updateUI);
    });

    generateBtn?.addEventListener('click', () => {
      const pw = randomPassword(Number(length.value), getCharset());
      output.value = pw;
      renderStats(pw);
      copyBtn.disabled = false;
      feedback.style.display = 'block';
      feedback.textContent = 'Mot de passe généré.';
    });

    copyBtn?.addEventListener('click', async () => {
      if (!output.value) return;
      await navigator.clipboard.writeText(output.value);
      feedback.style.display = 'block';
      feedback.textContent = 'Copié dans le presse-papiers.';
    });

    output?.addEventListener('input', () => renderStats(output.value));
    updateUI();
  }
})();
