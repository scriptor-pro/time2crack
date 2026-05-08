// Simplified includes: setup drawer, dropdowns, and language selector
// Header/footer are now inline in HTML layouts

(function() {
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
    const items = menu?.querySelectorAll('.lang-menu__item') || [];

    if (!toggle || !menu) return;

    // Toggle menu ouverture/fermeture
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      menu.toggleAttribute('hidden');
    });

    // Sélectionner une langue
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const newLang = item.getAttribute('data-lang');
        localStorage.setItem('time2crack-lang', newLang);
        window.location.href = `/${newLang}/index.html`;
      });
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
