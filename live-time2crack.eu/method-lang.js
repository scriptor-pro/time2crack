(function () {
  const LANG_NAMES = {
    fr: 'Français',
    en: 'English',
    es: 'Español',
    pt: 'Português',
    de: 'Deutsch',
    it: 'Italiano',
    tr: 'Türkçe',
    pl: 'Polski',
    nl: 'Nederlands',
  };

  const ARIA_LABELS = {
    fr: 'Sélectionner la langue',
    en: 'Select language',
    es: 'Seleccionar idioma',
    pt: 'Selecionar idioma',
    de: 'Sprache auswählen',
    it: 'Seleziona la lingua',
    tr: 'Dil seçin',
    pl: 'Wybierz język',
    nl: 'Taal selecteren',
  };

  const LANGS = ['fr', 'en', 'es', 'pt', 'de', 'it', 'tr', 'pl', 'nl'];
  const match = window.location.pathname.match(/\/([^\/]+)\/methode\/([^\/?#]+)$/);

  if (!match) {
    return;
  }

  const currentLang = match[1];
  const currentFile = match[2];
  const container = document.getElementById('method-lang-selector');

  if (!container) {
    return;
  }

  const currentLabel = LANG_NAMES[currentLang] || currentLang;
  const ariaLabel = ARIA_LABELS[currentLang] || 'Select language';

  container.innerHTML = `
    <button aria-controls="method-lang-menu" aria-expanded="false" aria-label="${ariaLabel}" class="lang-toggle" id="method-lang-toggle" type="button">
      <svg class="lang-toggle__icon" fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm.75 15.92A8.001 8.001 0 0 0 19.92 13h-3.23a15.53 15.53 0 0 1-1.74 4.92zM13.67 13a13.45 13.45 0 0 1-1.67 4.05A13.45 13.45 0 0 1 10.33 13h3.34zm0-2h-3.34A13.45 13.45 0 0 1 12 6.95 13.45 13.45 0 0 1 13.67 11zM12 4a8 8 0 0 0-2.85.52A15.53 15.53 0 0 1 9.58 11h4.84a15.53 15.53 0 0 1 .43-6.48A8 8 0 0 0 12 4zM7.9 4.92A8.001 8.001 0 0 0 4.08 11h3.23c.18-2.16.7-4.25 1.6-6.08zM4.08 13a8.001 8.001 0 0 0 3.82 6.08A15.53 15.53 0 0 1 6.3 13H4.08zm12.02 6.08A8.001 8.001 0 0 0 19.92 13H17.7a15.53 15.53 0 0 1-1.6 6.08zM17.7 11h2.22a8.001 8.001 0 0 0-3.9-6.08A15.53 15.53 0 0 1 17.7 11z" />
      </svg>
      <span class="lang-toggle__label" id="method-lang-label">${currentLabel}</span>
      <span class="dropdown-arrow">▼</span>
    </button>
    <menu aria-label="${ariaLabel}" class="lang-menu" hidden id="method-lang-menu" role="menu">
      ${LANGS.map((lang) => `<button class="lang-menu__item" data-lang="${lang}" role="menuitem" type="button"${lang === currentLang ? ' aria-selected="true"' : ''}>${LANG_NAMES[lang] || lang}</button>`).join('')}
    </menu>
  `;

  const toggle = document.getElementById('method-lang-toggle');
  const menu = document.getElementById('method-lang-menu');
  const items = Array.from(menu?.querySelectorAll('.lang-menu__item') || []);

  if (!toggle || !menu || !items.length) {
    return;
  }

  const updateToggleState = () => {
    toggle.setAttribute('aria-expanded', String(!menu.hidden));
  };

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    menu.hidden = !menu.hidden;
    updateToggleState();
    if (!menu.hidden) {
      items.find((item) => !item.hasAttribute('aria-selected'))?.focus();
    }
  });

  items.forEach((item) => {
    item.addEventListener('click', () => {
      const lang = item.dataset.lang;
      if (!lang || lang === currentLang) {
        menu.hidden = true;
        updateToggleState();
        return;
      }
      window.location.href = `../../${lang}/methode/${currentFile}`;
    });
  });

  document.addEventListener('click', (event) => {
    if (!container.contains(event.target)) {
      menu.hidden = true;
      updateToggleState();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      menu.hidden = true;
      updateToggleState();
      toggle.focus();
    }
  });
})();
