// Simplified includes: setup drawer, dropdowns, language selector, and shared footer

(function() {
  const LANGS = ['fr', 'en', 'es', 'pt', 'de', 'it', 'tr', 'pl', 'nl'];
  const LANGUAGE_NAMES = {
    fr: 'Français',
    en: 'English',
    es: 'Español',
    pt: 'Português',
    de: 'Deutsch',
    it: 'Italiano',
    tr: 'Türkçe',
    pl: 'Polski',
    nl: 'Nederlands'
  };
  const HEADER_TEXTS = {
    fr: {
      home: 'Tester un mot de passe',
      generator: 'Générer un mot de passe',
      faq: 'FAQ',
      about: 'À propos',
      science: 'Science',
      how: 'Comment ça marche?',
      methods: "Méthodes d'attaque",
      sources: 'Sources',
      security: 'Sécurité',
      hibp: 'HIBP',
      privacy: 'Confidentialité',
      menuOpen: 'Ouvrir le menu',
      drawerSecondary: 'Menu secondaire',
      drawerClose: 'Fermer le menu',
      selectLanguage: 'Sélectionner la langue',
      privacyLead: 'Tout reste dans votre navigateur.',
      privacyBody1: "Aucun mot de passe n'est transmis. Le calcul est entièrement local.",
      privacyBody2: 'La seule requête externe est une vérification anonyme de fuite (5 premiers caractères du hash SHA-1, jamais le mot de passe).',
      drawerFooter: 'v2.2.1 • Estimateur de crack local 🔐 — 2026-04-23 (Globe language selector + 9 languages)'
    },
    en: {
      home: 'Test a password',
      generator: 'Generate a password',
      faq: 'FAQ',
      about: 'About',
      science: 'Science',
      how: 'How does it work?',
      methods: 'Attack methods',
      sources: 'Sources',
      security: 'Security',
      hibp: 'HIBP',
      privacy: 'Privacy',
      menuOpen: 'Open menu',
      drawerSecondary: 'Secondary menu',
      drawerClose: 'Close menu',
      selectLanguage: 'Select language',
      privacyLead: 'Everything stays in your browser.',
      privacyBody1: 'No password is transmitted. The computation is fully local.',
      privacyBody2: 'The only external request is an anonymous leak check (first 5 characters of the SHA-1 hash, never the password).',
      drawerFooter: 'v2.2.1 • Local crack estimator 🔐 — 2026-04-23 (Globe language selector + 9 languages)'
    },
    es: {
      home: 'Probar una contraseña',
      generator: 'Generar una contraseña',
      faq: 'FAQ',
      about: 'Acerca de',
      science: 'Ciencia',
      how: '¿Cómo funciona?',
      methods: 'Métodos de ataque',
      sources: 'Fuentes',
      security: 'Seguridad',
      hibp: 'HIBP',
      privacy: 'Privacidad',
      menuOpen: 'Abrir menú',
      drawerSecondary: 'Menú secundario',
      drawerClose: 'Cerrar menú',
      selectLanguage: 'Seleccionar idioma',
      privacyLead: 'Todo permanece en tu navegador.',
      privacyBody1: 'No se transmite ninguna contraseña. El cálculo es completamente local.',
      privacyBody2: 'La única solicitud externa es una comprobación anónima de filtración (los primeros 5 caracteres del hash SHA-1, nunca la contraseña).',
      drawerFooter: 'v2.2.1 • Estimador de crack local 🔐 — 2026-04-23 (Globe language selector + 9 languages)'
    },
    pt: {
      home: 'Testar uma senha',
      generator: 'Gerar uma senha',
      faq: 'FAQ',
      about: 'Sobre',
      science: 'Ciência',
      how: 'Como funciona?',
      methods: 'Métodos de ataque',
      sources: 'Fontes',
      security: 'Segurança',
      hibp: 'HIBP',
      privacy: 'Privacidade',
      menuOpen: 'Abrir menu',
      drawerSecondary: 'Menu secundário',
      drawerClose: 'Fechar menu',
      selectLanguage: 'Selecionar idioma',
      privacyLead: 'Tudo permanece no seu navegador.',
      privacyBody1: 'Nenhuma senha é transmitida. O cálculo é totalmente local.',
      privacyBody2: 'A única solicitação externa é uma verificação anônima de vazamento (os primeiros 5 caracteres do hash SHA-1, nunca a senha).',
      drawerFooter: 'v2.2.1 • Estimador local de crack 🔐 — 2026-04-23 (Globe language selector + 9 languages)'
    },
    de: {
      home: 'Passwort testen',
      generator: 'Passwort generieren',
      faq: 'FAQ',
      about: 'Über',
      science: 'Wissenschaft',
      how: 'Wie funktioniert es?',
      methods: 'Angriffsmethoden',
      sources: 'Quellen',
      security: 'Sicherheit',
      hibp: 'HIBP',
      privacy: 'Datenschutz',
      menuOpen: 'Menü öffnen',
      drawerSecondary: 'Sekundärmenü',
      drawerClose: 'Menü schließen',
      selectLanguage: 'Sprache auswählen',
      privacyLead: 'Alles bleibt in deinem Browser.',
      privacyBody1: 'Es wird kein Passwort übertragen. Die Berechnung ist vollständig lokal.',
      privacyBody2: 'Die einzige externe Anfrage ist eine anonyme Leckprüfung (die ersten 5 Zeichen des SHA-1-Hashes, niemals das Passwort).',
      drawerFooter: 'v2.2.1 • Lokaler Crack-Schätzer 🔐 — 2026-04-23 (Globe language selector + 9 languages)'
    },
    it: {
      home: 'Testa una password',
      generator: 'Genera una password',
      faq: 'FAQ',
      about: 'Chi siamo',
      science: 'Scienza',
      how: 'Come funziona?',
      methods: 'Metodi di attacco',
      sources: 'Fonti',
      security: 'Sicurezza',
      hibp: 'HIBP',
      privacy: 'Privacy',
      menuOpen: 'Apri menu',
      drawerSecondary: 'Menu secondario',
      drawerClose: 'Chiudi menu',
      selectLanguage: 'Seleziona lingua',
      privacyLead: 'Tutto resta nel tuo browser.',
      privacyBody1: 'Nessuna password viene trasmessa. Il calcolo è completamente locale.',
      privacyBody2: 'L’unica richiesta esterna è un controllo anonimo delle violazioni (i primi 5 caratteri dell’hash SHA-1, mai la password).',
      drawerFooter: 'v2.2.1 • Stimatore locale di crack 🔐 — 2026-04-23 (Globe language selector + 9 languages)'
    },
    tr: {
      home: 'Parolayı test et',
      generator: 'Parola oluştur',
      faq: 'SSS',
      about: 'Hakkında',
      science: 'Bilim',
      how: 'Nasıl çalışır?',
      methods: 'Saldırı yöntemleri',
      sources: 'Kaynaklar',
      security: 'Güvenlik',
      hibp: 'HIBP',
      privacy: 'Gizlilik',
      menuOpen: 'Menüyü aç',
      drawerSecondary: 'İkincil menü',
      drawerClose: 'Menüyü kapat',
      selectLanguage: 'Dil seç',
      privacyLead: 'Her şey tarayıcınızda kalır.',
      privacyBody1: 'Hiçbir parola aktarılmaz. Hesaplama tamamen yereldir.',
      privacyBody2: 'Tek dış istek, anonim bir sızıntı kontrolüdür (SHA-1 karmasının ilk 5 karakteri, asla parola değil).',
      drawerFooter: 'v2.2.1 • Yerel crack tahmincisi 🔐 — 2026-04-23 (Globe language selector + 9 languages)'
    },
    pl: {
      home: 'Sprawdź hasło',
      generator: 'Generuj hasło',
      faq: 'FAQ',
      about: 'O projekcie',
      science: 'Nauka',
      how: 'Jak to działa?',
      methods: 'Metody ataku',
      sources: 'Źródła',
      security: 'Bezpieczeństwo',
      hibp: 'HIBP',
      privacy: 'Prywatność',
      menuOpen: 'Otwórz menu',
      drawerSecondary: 'Menu dodatkowe',
      drawerClose: 'Zamknij menu',
      selectLanguage: 'Wybierz język',
      privacyLead: 'Wszystko zostaje w twojej przeglądarce.',
      privacyBody1: 'Żadne hasło nie jest przesyłane. Obliczenia są całkowicie lokalne.',
      privacyBody2: 'Jedynym zewnętrznym żądaniem jest anonimowe sprawdzenie wycieku (pierwsze 5 znaków hasza SHA-1, nigdy hasło).',
      drawerFooter: 'v2.2.1 • Lokalny estymator crackowania 🔐 — 2026-04-23 (Globe language selector + 9 languages)'
    },
    nl: {
      home: 'Wachtwoord testen',
      generator: 'Wachtwoord genereren',
      faq: 'FAQ',
      about: 'Over',
      science: 'Wetenschap',
      how: 'Hoe werkt het?',
      methods: 'Aanvalsmethoden',
      sources: 'Bronnen',
      security: 'Beveiliging',
      hibp: 'HIBP',
      privacy: 'Privacy',
      menuOpen: 'Menu openen',
      drawerSecondary: 'Secundair menu',
      drawerClose: 'Menu sluiten',
      selectLanguage: 'Kies taal',
      privacyLead: 'Alles blijft in je browser.',
      privacyBody1: 'Er wordt geen wachtwoord verzonden. De berekening is volledig lokaal.',
      privacyBody2: 'De enige externe aanvraag is een anonieme lekcontrole (de eerste 5 tekens van de SHA-1-hash, nooit het wachtwoord).',
      drawerFooter: 'v2.2.1 • Lokale crack-schatting 🔐 — 2026-04-23 (Globe language selector + 9 languages)'
    }
  };

  const HERO_TEXTS = {
    fr: {
      title: 'Si ton mot de passe est attaqué par un pirate, combien de temps va-t-il résister ?',
    },
    en: {
      title: 'Test your password strength',
    },
    es: {
      title: 'Comprueba la fuerza de tu contraseña',
    },
    pt: {
      title: 'Teste a força da sua senha',
    },
    de: {
      title: 'Testen Sie die Stärke Ihres Passworts',
    },
    it: {
      title: 'Testa la forza della tua password',
    },
    tr: {
      title: 'Şifrenizin gücünü test edin',
    },
    pl: {
      title: 'Sprawdź siłę swojego hasła',
    },
    nl: {
      title: 'Test de sterkte van je wachtwoord',
    }
  };

  function getPageContext() {
    const pathname = window.location.pathname;
    const segments = pathname.split('/').filter(Boolean);
    const lang = LANGS.includes(segments[0]) ? segments[0] : 'fr';
    const localized = LANGS.includes(segments[0]);
    const isMethodDir = localized ? segments[1] === 'methode' : segments[0] === 'methode';
    const assetPrefix = segments.length > 1 ? '../'.repeat(segments.length - 1) : '';
    const pagePrefix = isMethodDir ? '../' : '';
    const texts = HEADER_TEXTS[lang] || HEADER_TEXTS.fr;
    return { lang, localized, isMethodDir, assetPrefix, pagePrefix, texts };
  }

  function getLanguageHref(targetLang) {
    const pathname = window.location.pathname;
    const segments = pathname.split('/').filter(Boolean);
    const hasLangPrefix = LANGS.includes(segments[0]);
    const rest = hasLangPrefix ? segments.slice(1).join('/') : segments.join('/');
    const targetRest = rest || 'index.html';
    return `/${targetLang}/${targetRest}`;
  }

  // Detect current page for active state
  const pathname = window.location.pathname;
  const pageName = pathname.split('/').pop() || 'index.html';

  // Map page to nav class
  const pageToNavClass = {
    'index.html': 'nav-home',
    'generator.html': 'nav-generator',
    'about.html': 'nav-about',
    'faq.html': 'nav-faq',
    'hibp.html': 'nav-hibp',
    'privacy.html': 'nav-privacy',
    'sources.html': 'nav-sources',
    'how-time2crack-works.html': 'nav-how-it-works'
  };

  function setupUI() {
    renderSharedHeader();
    renderHomeHero();
    renderSharedFooter();
    reorderHomeLayout();

    // Set active nav link (primary + secondary + drawer)
    const activeNavClass = pageToNavClass[pageName];
    if (activeNavClass) {
      // Primary + Secondary nav
      const activeTopLink = document.querySelector('.' + activeNavClass);
      if (activeTopLink) {
        document.querySelectorAll('.site-nav__link').forEach(link => {
          link.removeAttribute('aria-current');
          link.classList.remove('site-nav__link--active');
        });
        activeTopLink.setAttribute('aria-current', 'page');
        activeTopLink.classList.add('site-nav__link--active');
      }

      // Drawer links
      const activeDrawerLink = document.querySelector('.drawer__link.' + activeNavClass);
      if (activeDrawerLink) {
        document.querySelectorAll('.drawer__link').forEach(link => {
          link.removeAttribute('aria-current');
        });
        activeDrawerLink.setAttribute('aria-current', 'page');
      }
    }

    // Setup drawer interaction
    setupDrawer();

    // Setup desktop dropdowns
    setupDropdowns();

    // Setup language selector
    setupLanguageSelector();

    // Signal includes are ready
    document.dispatchEvent(new CustomEvent('includesLoaded'));
  }

  function reorderHomeLayout() {
    const inputGroup = document.querySelector('.input-group');
    const results = document.querySelector('#results');
    const hibpBadge = document.querySelector('#hibp-badge');
    const bestAttackCard = document.querySelector('.best-attack-card');
    const profileSelector = document.querySelector('.profile-selector');

    if (inputGroup && hibpBadge && hibpBadge.parentElement !== inputGroup) {
      inputGroup.appendChild(hibpBadge);
    }

    if (results && bestAttackCard && profileSelector) {
      results.insertBefore(profileSelector, bestAttackCard.nextElementSibling);
    }
  }

  function renderHomeHero() {
    if (pageName !== 'index.html') return;

    const main = document.querySelector('main');
    if (!main || main.querySelector('.hero')) return;
    const ctx = getPageContext();

    if (!document.getElementById('hero-inline-style')) {
      const style = document.createElement('style');
      style.id = 'hero-inline-style';
      style.textContent = `
        .hero{margin-bottom:var(--space-4)}
        .hero__grid{display:flex;flex-direction:column;gap:var(--space-3)}
        .hero__media{margin:0;width:100%;max-width:560px;align-self:center;overflow:hidden}
        .hero__media picture,.hero__media img{display:block;width:100%;max-width:100%;height:auto}
        .hero__image{aspect-ratio:1344/768;object-fit:cover}
        .hero__content{width:100%;max-width:560px;align-self:center}
        .hero__title{width:100%;font-size:clamp(1.35rem,2.8vw,2rem);line-height:1.06;max-width:none}
        @media (min-width:860px){
          .hero{margin-bottom:var(--space-3)}
          .hero__grid{gap:var(--space-3)}
        }
      `;
      document.head.appendChild(style);
    }

    const { assetPrefix } = ctx;
    const hero = document.createElement('section');
    hero.className = 'hero';
    hero.setAttribute('aria-labelledby', 'hero-title');
    hero.innerHTML = `
      <div class="hero__grid">
        <figure class="hero__media">
          <picture>
            <source media="(min-width: 1100px)" srcset="${assetPrefix}hero/time2crack-password-desktop.webp">
            <source media="(min-width: 700px)" srcset="${assetPrefix}hero/time2crack-password-tablet.webp">
            <img
              class="hero__image"
              src="${assetPrefix}hero/time2crack-password-mobile.webp"
              alt="Password resistance illustration"
              loading="eager"
              fetchpriority="high"
            >
          </picture>
        </figure>
        <div class="hero__content">
          <h1 class="hero__title" id="hero-title"></h1>
        </div>
      </div>
    `;

    const heroText = HERO_TEXTS[ctx.lang] || HERO_TEXTS.fr;
    const heroTitle = hero.querySelector('#hero-title');
    if (heroTitle) heroTitle.textContent = heroText.title;

    const inputSection = main.querySelector('.input-section');
    if (inputSection) {
      main.insertBefore(hero, inputSection);
    } else {
      main.prepend(hero);
    }
  }

  function renderSharedHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;

    const ctx = getPageContext();
    const { assetPrefix, pagePrefix, localized, isMethodDir, texts, lang } = ctx;
    const logoMarkup = localized
      ? `<img src="${assetPrefix}logo.png" alt="" class="site-logo__icon" aria-hidden="true">`
      : '';

    header.outerHTML = `
      <header class="site-header">
        <div class="site-header__top">
          <h1><a href="${pagePrefix}index.html" class="site-logo">${logoMarkup}Time2Crack</a></h1>
          <div class="lang-selector">
            <button id="lang-toggle" class="lang-toggle" type="button" aria-label="${texts.selectLanguage}" aria-expanded="false" aria-controls="lang-menu">
              <svg class="lang-toggle__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M2.00312 12.1255C2.07025 17.59 6.52083 22.0001 12.0014 22.0001C17.5238 22.0001 22.0005 17.5224 22.0005 12.0002C22.0005 6.49245 17.5473 2.02384 12.0449 2.00038C12.0304 2.00013 12.0158 2 12.0012 2C11.9866 2 11.972 2.00013 11.9574 2.00038C6.49755 2.02389 2.07089 6.42415 2.00314 11.8733C2.00106 11.9151 2 11.9572 2 11.9996C2 12.0418 2.00105 12.0838 2.00312 12.1255ZM8.97906 8.97712C8.83291 9.91428 8.75196 10.9319 8.75196 11.9996C8.75196 13.0674 8.83291 14.0849 8.97906 15.0221C9.91569 15.168 10.9326 15.2489 11.9996 15.2489C13.0679 15.2489 14.086 15.1678 15.0235 15.0216C15.1696 14.0845 15.2505 13.0671 15.2505 11.9996C15.2505 10.932 15.1696 9.91466 15.0235 8.97764C14.086 8.83136 13.0679 8.75032 11.9996 8.75032C10.9326 8.75032 9.91568 8.83117 8.97906 8.97712ZM7.419 9.29819C7.30981 10.1594 7.25196 11.0661 7.25196 11.9996C7.25196 12.9331 7.30981 13.8398 7.419 14.701C6.8082 14.5418 6.25021 14.3524 5.75696 14.1391C4.976 13.8015 4.39155 13.4187 4.01306 13.0318C3.66763 12.6787 3.52335 12.3559 3.50265 12.072C3.50245 12.0481 3.50235 12.0242 3.50235 12.0002C3.50235 11.9758 3.50245 11.9514 3.50266 11.927C3.5234 11.6432 3.66769 11.3204 4.01306 10.9674C4.39155 10.5805 4.976 10.1978 5.75696 9.86009C6.25021 9.64683 6.8082 9.45746 7.419 9.29819ZM9.30032 7.4171C10.1609 7.30808 11.0669 7.25032 11.9996 7.25032C12.9336 7.25032 13.8407 7.30824 14.7023 7.41753C14.5431 6.8073 14.3538 6.24981 14.1407 5.75696C13.8031 4.976 13.4203 4.39155 13.0335 4.01306C12.6606 3.64825 12.3214 3.5078 12.0263 3.50032L12.0014 3.50028L11.9761 3.50032C11.6811 3.50781 11.3419 3.64827 10.969 4.01306C10.5821 4.39155 10.1994 4.976 9.86173 5.75696C9.64869 6.24969 9.45948 6.80704 9.30032 7.4171ZM16.5836 9.29907C16.6927 10.16 16.7505 11.0664 16.7505 11.9996C16.7505 12.9328 16.6927 13.8392 16.5836 14.7001C17.1931 14.5411 17.7499 14.352 18.2422 14.1391C19.0232 13.8015 19.6077 13.4187 19.9862 13.0318C20.3613 12.6483 20.4992 12.3005 20.4992 11.9996C20.4992 11.6987 20.3613 11.3509 19.9862 10.9674C19.6077 10.5805 19.0232 10.1978 18.2422 9.86009C17.7499 9.64723 17.1931 9.45816 16.5836 9.29907ZM14.7023 16.5817C13.8407 16.691 12.9336 16.7489 11.9996 16.7489C11.0669 16.7489 10.1609 16.6911 9.30032 16.5821C9.45948 17.1922 9.64869 17.7495 9.86173 18.2422C10.1994 19.0232 10.5821 19.6077 10.969 19.9862C11.3525 20.3613 11.7003 20.4992 12.0012 20.4992C12.3021 20.4992 12.65 20.3613 13.0335 19.9861C13.4203 19.6077 13.8031 19.0232 14.1407 18.2422C14.3538 17.7494 14.5431 17.1919 14.7023 16.5817ZM7.69311 16.3082C6.76016 16.1055 5.90633 15.8379 5.16168 15.5159C4.75227 15.3389 4.36866 15.1424 4.01951 14.9265C4.87777 17.2671 6.73603 19.1253 9.07661 19.9833C8.85983 19.6332 8.66253 19.2484 8.48491 18.8375C8.16319 18.0934 7.89575 17.2403 7.69311 16.3082ZM16.3095 16.3074C17.2411 16.1048 18.0938 15.8375 18.8375 15.5159C19.2488 15.3381 19.634 15.1406 19.9844 14.9236C19.1265 17.2657 17.2675 19.1252 14.9258 19.9835C15.1426 19.6333 15.3399 19.2484 15.5176 18.8375C15.8394 18.0932 16.1069 17.2399 16.3095 16.3074ZM19.9838 9.07529C19.6336 8.85838 19.2485 8.66098 18.8375 8.48327C18.0938 8.16171 17.2411 7.89437 16.3095 7.69177C16.1069 6.75934 15.8394 5.90596 15.5176 5.16168C15.3402 4.75137 15.1431 4.36698 14.9267 4.01722C17.2675 4.87548 19.1258 6.7342 19.9838 9.07529ZM7.69311 7.69102C6.76016 7.89372 5.90632 8.16132 5.16168 8.48327C4.75248 8.66019 4.36906 8.85663 4.02005 9.0724C4.87844 6.73282 6.73604 4.87536 9.0757 4.01737C8.85927 4.3671 8.66228 4.75144 8.48491 5.16168C8.16319 5.90577 7.89575 6.75888 7.69311 7.69102Z" fill="currentColor"/>
              </svg>
              <span class="lang-toggle__label" id="lang-label">${LANGUAGE_NAMES[lang] || LANGUAGE_NAMES.fr}</span>
              <span class="dropdown-arrow">▼</span>
            </button>
            <menu id="lang-menu" class="lang-menu" hidden role="menu" aria-label="${texts.selectLanguage}">
              ${Object.entries(LANGUAGE_NAMES).map(([code, label]) => {
                const href = getLanguageHref(code);
                return `<button type="button" data-lang="${code}" class="lang-menu__item" role="menuitem" onclick="localStorage.setItem('time2crack-lang','${code}');window.location.href='${href}';return false;">${label}</button>`;
              }).join('')}
            </menu>
          </div>
        </div>
        <nav class="site-nav" aria-label="Navigation principale">
          <div class="site-nav__primary">
            <a href="${pagePrefix}index.html" class="site-nav__link nav-home">${texts.home}</a>
            <a href="${pagePrefix}generator.html" class="site-nav__link nav-generator">${texts.generator}</a>
          </div>
          <button class="hamburger" id="hamburger-btn" type="button" aria-label="${texts.menuOpen}" aria-expanded="false" aria-controls="drawer">
            <span class="hamburger__icon"></span>
          </button>
          <div class="site-nav__secondary">
            <a href="${pagePrefix}faq.html" class="site-nav__link">${texts.faq}</a>
            <a href="${pagePrefix}about.html" class="site-nav__link">${texts.about}</a>
            <div class="site-nav__dropdown">
              <button class="site-nav__dropdown-toggle" aria-expanded="false" aria-label="${texts.science}">
                ${texts.science} <span class="dropdown-arrow">▼</span>
              </button>
              <ul class="site-nav__dropdown-menu" role="menu" aria-label="${texts.science}">
                <li role="none"><a href="${pagePrefix}how-time2crack-works.html" role="menuitem" class="site-nav__dropdown-item">${texts.how}</a></li>
                <li role="none" class="site-nav__dropdown-item--group">
                  <span class="site-nav__dropdown-group-title">${texts.methods}</span>
                  <ul class="site-nav__dropdown-submenu" role="menu">
                    <li role="none"><a href="${isMethodDir ? '' : 'methode/'}bruteforce.html" role="menuitem" class="site-nav__dropdown-item">Brute Force</a></li>
                    <li role="none"><a href="${isMethodDir ? '' : 'methode/'}dictionary.html" role="menuitem" class="site-nav__dropdown-item">Dictionary</a></li>
                    <li role="none"><a href="${isMethodDir ? '' : 'methode/'}hybrid.html" role="menuitem" class="site-nav__dropdown-item">Hybrid</a></li>
                    <li role="none"><a href="${isMethodDir ? '' : 'methode/'}mask.html" role="menuitem" class="site-nav__dropdown-item">Mask</a></li>
                    <li role="none"><a href="${isMethodDir ? '' : 'methode/'}markov.html" role="menuitem" class="site-nav__dropdown-item">Markov</a></li>
                    <li role="none"><a href="${isMethodDir ? '' : 'methode/'}pcfg.html" role="menuitem" class="site-nav__dropdown-item">PCFG</a></li>
                    <li role="none"><a href="${isMethodDir ? '' : 'methode/'}combinator.html" role="menuitem" class="site-nav__dropdown-item">Combinator</a></li>
                  </ul>
                </li>
                <li role="none"><a href="${pagePrefix}sources.html" role="menuitem" class="site-nav__dropdown-item">${texts.sources}</a></li>
              </ul>
            </div>
            <div class="site-nav__dropdown">
              <button class="site-nav__dropdown-toggle" aria-expanded="false" aria-label="${texts.security}">
                ${texts.security} <span class="dropdown-arrow">▼</span>
              </button>
              <ul class="site-nav__dropdown-menu" role="menu" aria-label="${texts.security}">
                <li role="none"><a href="${pagePrefix}hibp.html" role="menuitem" class="site-nav__dropdown-item">${texts.hibp}</a></li>
                <li role="none"><a href="${pagePrefix}privacy.html" role="menuitem" class="site-nav__dropdown-item">${texts.privacy}</a></li>
              </ul>
            </div>
          </div>
        </nav>

        <aside id="drawer" class="drawer" role="complementary" aria-hidden="true" aria-label="${texts.drawerSecondary}">
          <div class="drawer__header">
            <button class="drawer__close" id="drawer-close-btn" type="button" aria-label="${texts.drawerClose}">✕</button>
          </div>
          <nav class="drawer__nav" aria-label="${texts.drawerSecondary}">
            <a href="${pagePrefix}faq.html" class="drawer__link">${texts.faq}</a>
            <a href="${pagePrefix}about.html" class="drawer__link">${texts.about}</a>
            <details class="drawer__details">
              <summary class="drawer__summary">${texts.science}</summary>
              <a href="${pagePrefix}how-time2crack-works.html" class="drawer__link">${texts.how}</a>
              <details class="drawer__details drawer__details--nested">
                <summary class="drawer__summary drawer__summary--nested">${texts.methods}</summary>
                <a href="${isMethodDir ? '' : 'methode/'}bruteforce.html" class="drawer__link drawer__link--nested">Brute Force</a>
                <a href="${isMethodDir ? '' : 'methode/'}dictionary.html" class="drawer__link drawer__link--nested">Dictionary</a>
                <a href="${isMethodDir ? '' : 'methode/'}hybrid.html" class="drawer__link drawer__link--nested">Hybrid</a>
                <a href="${isMethodDir ? '' : 'methode/'}mask.html" class="drawer__link drawer__link--nested">Mask</a>
                <a href="${isMethodDir ? '' : 'methode/'}markov.html" class="drawer__link drawer__link--nested">Markov</a>
                <a href="${isMethodDir ? '' : 'methode/'}pcfg.html" class="drawer__link drawer__link--nested">PCFG</a>
                <a href="${isMethodDir ? '' : 'methode/'}combinator.html" class="drawer__link drawer__link--nested">Combinator</a>
              </details>
              <a href="${pagePrefix}sources.html" class="drawer__link">${texts.sources}</a>
            </details>
            <details class="drawer__details">
              <summary class="drawer__summary">${texts.security}</summary>
              <a href="${pagePrefix}hibp.html" class="drawer__link">${texts.hibp}</a>
              <a href="${pagePrefix}privacy.html" class="drawer__link">${texts.privacy}</a>
            </details>
          </nav>
          <footer class="drawer__footer">
            <p>${texts.drawerFooter}</p>
          </footer>
        </aside>

        <div id="drawer-backdrop" class="drawer-backdrop" hidden aria-hidden="true"></div>

      </header>
    `;
  }

  function renderSharedFooter() {
    const footer = document.getElementById('site-footer');
    if (!footer) return;
    const { assetPrefix } = getPageContext();

    footer.classList.add('site-footer');
    footer.innerHTML = `
      <p>
        Calcul local &middot; Une seule vérification externe (HIBP k-anonymité) &middot; Open source
      </p>

      <div class="footer-social">
        <a href="https://www.linkedin.com/in/baudouinvanhumbeeck/" title="LinkedIn" class="footer-social__link" aria-label="Suivez-nous sur LinkedIn">
          <svg class="footer-social__icon" viewBox="0 0 24 24" role="img" aria-hidden="true">
            <path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
          </svg>
        </a>
        <a href="https://bsky.app/profile/bvh.fyi" title="Bluesky" class="footer-social__link" aria-label="Suivez-nous sur Bluesky">
          <img src="${assetPrefix}bluesky-line.svg" alt="Bluesky" class="footer-social__icon" role="img" aria-hidden="true">
        </a>
        <a href="https://mastodon.social/@baudouinvh" title="Mastodon" class="footer-social__link" aria-label="Suivez-nous sur Mastodon">
          <img src="${assetPrefix}mastodon-line.svg" alt="Mastodon" class="footer-social__icon" role="img" aria-hidden="true">
        </a>
      </div>

      <p style="font-size: 0.8rem; color: #999; margin-top: 1rem;">
        Updated: 04 mai 2026, 13:32 UTC
      </p>
    `;
  }

  // Drawer state management
  let isDrawerOpen = false;

  function setupDrawer() {
    const hamburger = document.getElementById('hamburger-btn');
    const drawer = document.getElementById('drawer');
    const drawerClose = document.getElementById('drawer-close-btn');
    const drawerBackdrop = document.getElementById('drawer-backdrop');

    if (!hamburger || !drawer) return;

    function openDrawer() {
      isDrawerOpen = true;
      drawer.setAttribute('aria-hidden', 'false');
      drawerBackdrop.removeAttribute('hidden');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      isDrawerOpen = false;
      drawer.setAttribute('aria-hidden', 'true');
      drawerBackdrop.setAttribute('hidden', '');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    // Hamburger button click
    hamburger.addEventListener('click', () => {
      if (isDrawerOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    // Close button click
    if (drawerClose) {
      drawerClose.addEventListener('click', closeDrawer);
    }

    // Backdrop click
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', closeDrawer);
    }

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    });

    // Close drawer when clicking on a link inside it
    const drawerLinks = drawer.querySelectorAll('.drawer__link');
    drawerLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeDrawer();
      });
    });

    // Close details/accordions when drawer closes
    drawer.querySelectorAll('.drawer__details').forEach(details => {
      details.addEventListener('toggle', () => {
        if (!isDrawerOpen && details.hasAttribute('open')) {
          details.removeAttribute('open');
        }
      });
    });
  }

  function setupDropdowns() {
    // Desktop dropdowns: hover to open, click to toggle
    const dropdownToggles = document.querySelectorAll('.site-nav__dropdown-toggle');

    dropdownToggles.forEach(toggle => {
      const dropdown = toggle.closest('.site-nav__dropdown');
      const menu = dropdown.querySelector('.site-nav__dropdown-menu');
      let closeTimeout;

      // Show on hover
      dropdown.addEventListener('mouseenter', () => {
        clearTimeout(closeTimeout);
        toggle.setAttribute('aria-expanded', 'true');
      });

      // Hide on mouse leave
      dropdown.addEventListener('mouseleave', () => {
        closeTimeout = setTimeout(() => {
          toggle.setAttribute('aria-expanded', 'false');
        }, 150);
      });

      // Click to toggle (fallback)
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!isExpanded));
      });

      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  function setupLanguageSelector() {
    const toggle = document.getElementById('lang-toggle');
    const menu = document.getElementById('lang-menu');

    if (!toggle || !menu) return;

    // Toggle menu ouverture/fermeture
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      menu.toggleAttribute('hidden');
    });

    // Fermer le menu si clic ailleurs
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.lang-selector')) {
        toggle.setAttribute('aria-expanded', 'false');
        menu.setAttribute('hidden', '');
      }
    });
  }

  // Setup UI when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupUI);
  } else {
    setupUI();
  }
})();
