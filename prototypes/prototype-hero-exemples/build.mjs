import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_ROOT = path.resolve(new URL('.', import.meta.url).pathname);
const REPO_ROOT = path.resolve(OUT_ROOT, '..');
const LIVE_ROOT = path.join(REPO_ROOT, 'live-time2crack.eu');
const V2_ROOT = path.join(REPO_ROOT, 'v2/public');

const LANGS = ['fr', 'en', 'es', 'pt', 'de', 'it', 'tr', 'pl', 'nl'];
const LANG_LABELS = {
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

const ROOT_PAGES = [
  'index.html',
  'generator.html',
  'faq.html',
  'about.html',
  'how-time2crack-works.html',
  'sources.html',
  'privacy.html',
  'hibp.html'
];

const METHOD_PAGES = [
  'index.html',
  'bruteforce.html',
  'dictionary.html',
  'hybrid.html',
  'mask.html',
  'markov.html',
  'pcfg.html',
  'combinator.html'
];

function rootSourceFor(file) {
  if (file === 'how-time2crack-works.html' || file === 'sources.html') {
    return path.join(LIVE_ROOT, 'fr', file);
  }
  return path.join(LIVE_ROOT, file);
}

function localeSourceFor(locale, file, isMethod) {
  if (isMethod && file === 'index.html') {
    const localized = path.join(V2_ROOT, locale, 'methode', 'index.html');
    return localized;
  }
  if (isMethod) {
    return path.join(LIVE_ROOT, locale, 'methode', file);
  }
  return path.join(LIVE_ROOT, locale, file);
}

function outputPathFor(locale, file, isMethod) {
  if (!locale) {
    return isMethod ? path.join(OUT_ROOT, 'methode', file) : path.join(OUT_ROOT, file);
  }
  return isMethod ? path.join(OUT_ROOT, locale, 'methode', file) : path.join(OUT_ROOT, locale, file);
}

function extractTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : 'Time2Crack';
}

function extractBody(html) {
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (main) return main[1].trim();
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (body) return body[1].trim();
  return html;
}

function relative(fromFile, toFile) {
  const fromDir = path.dirname(fromFile);
  const rel = path.relative(fromDir, toFile).replace(/\\/g, '/');
  return rel || '.';
}

function prefix(fromFile) {
  const rel = relative(fromFile, OUT_ROOT);
  return rel === '.' ? './' : `${rel}/`;
}

function buildPagesForLocale(locale, isRoot = false) {
  const pages = [];
  for (const file of ROOT_PAGES) pages.push({ file, isMethod: false });
  for (const file of METHOD_PAGES) pages.push({ file: `methode/${file}`, isMethod: true });

  return pages.map(({ file, isMethod }) => {
    const outPath = outputPathFor(locale, path.basename(file), isMethod);
    const sourcePath = locale ? localeSourceFor(locale, path.basename(file), isMethod) : rootSourceFor(path.basename(file));
    return { locale, isRoot, file, isMethod, outPath, sourcePath, pageKey: path.basename(file) };
  });
}

function buildAllPageSpecs() {
  return [
    ...buildPagesForLocale(null, true),
    ...LANGS.flatMap((lang) => buildPagesForLocale(lang, false))
  ];
}

function buildHeader({ currentSpec, allSpecs }) {
  const currentDir = path.dirname(currentSpec.outPath);
  const currentFile = currentSpec.pageKey;
  const currentLocale = currentSpec.locale || 'fr';
  const displayLabel = LANG_LABELS[currentLocale] || 'Français';

  const sameLocaleTargets = {
    index: currentSpec.isMethod ? path.join(currentDir, '..', 'index.html') : path.join(currentDir, 'index.html'),
    generator: currentSpec.isMethod ? path.join(currentDir, '..', 'generator.html') : path.join(currentDir, 'generator.html'),
    faq: currentSpec.isMethod ? path.join(currentDir, '..', 'faq.html') : path.join(currentDir, 'faq.html'),
    about: currentSpec.isMethod ? path.join(currentDir, '..', 'about.html') : path.join(currentDir, 'about.html'),
    how: currentSpec.isMethod ? path.join(currentDir, '..', 'how-time2crack-works.html') : path.join(currentDir, 'how-time2crack-works.html'),
    sources: currentSpec.isMethod ? path.join(currentDir, '..', 'sources.html') : path.join(currentDir, 'sources.html'),
    privacy: currentSpec.isMethod ? path.join(currentDir, '..', 'privacy.html') : path.join(currentDir, 'privacy.html'),
    hibp: currentSpec.isMethod ? path.join(currentDir, '..', 'hibp.html') : path.join(currentDir, 'hibp.html')
  };

  const methodTargets = METHOD_PAGES
    .map((file) => path.join(currentDir, currentSpec.isMethod ? '' : 'methode', file))
    .map((target) => ({ file: path.basename(target), href: relative(currentSpec.outPath, target) }))
    .map(({ file, href }) => `<a class="dropdown__item" href="${href}" role="menuitem">${file.replace('.html', '').replace('bruteforce', 'Force brute').replace('dictionary', 'Dictionnaire').replace('hybrid', 'Hybride').replace('mask', 'Masque').replace('markov', 'Markov').replace('pcfg', 'PCFG').replace('combinator', 'Combinateur')}</a>`)
    .join('');

  const langItems = LANGS
    .map((lang) => {
      const target = outputPathFor(lang, currentFile, currentSpec.isMethod);
      const href = relative(currentSpec.outPath, target);
      const active = currentLocale === lang ? ' is-active' : '';
      return `<a class="dropdown__item${active}" href="${href}" hreflang="${lang}" role="menuitem">${LANG_LABELS[lang]}</a>`;
    })
    .join('');

  const homeHref = relative(currentSpec.outPath, sameLocaleTargets.index);
  const generatorHref = relative(currentSpec.outPath, sameLocaleTargets.generator);
  const faqHref = relative(currentSpec.outPath, sameLocaleTargets.faq);
  const aboutHref = relative(currentSpec.outPath, sameLocaleTargets.about);
  const howHref = relative(currentSpec.outPath, sameLocaleTargets.how);
  const sourcesHref = relative(currentSpec.outPath, sameLocaleTargets.sources);
  const privacyHref = relative(currentSpec.outPath, sameLocaleTargets.privacy);
  const hibpHref = relative(currentSpec.outPath, sameLocaleTargets.hibp);

  return `
  <header class="site-header">
    <div class="site-header__inner">
      <a class="site-logo" href="${homeHref}">
        <span class="site-logo__mark">🔒</span>
        Time<span class="site-logo__accent">2</span>Crack
      </a>
      <nav class="site-nav" aria-label="Navigation principale">
        <div class="site-nav__primary">
          <a class="nav-link ${currentFile === 'index.html' ? 'is-active' : ''}" href="${homeHref}">Tester un mot de passe</a>
          <a class="nav-link ${currentFile === 'generator.html' ? 'is-active' : ''}" href="${generatorHref}">Générer un mot de passe</a>
        </div>
        <div class="site-nav__secondary">
          <a class="nav-link ${currentFile === 'faq.html' ? 'is-active' : ''}" href="${faqHref}">FAQ</a>
          <a class="nav-link ${currentFile === 'about.html' ? 'is-active' : ''}" href="${aboutHref}">À propos</a>
          <div class="dropdown">
            <button class="nav-toggle" id="science-toggle" type="button" aria-expanded="false" aria-controls="science-menu">
              Science <span aria-hidden="true">▾</span>
            </button>
            <div class="dropdown__menu" id="science-menu" role="menu" aria-label="Science">
              <a class="dropdown__item" href="${howHref}" role="menuitem">Comment ça fonctionne</a>
              <div class="dropdown__separator"></div>
              <span class="dropdown__group-title">Méthodes d'attaque</span>
              ${methodTargets}
              <div class="dropdown__separator"></div>
              <a class="dropdown__item" href="${sourcesHref}" role="menuitem">Sources</a>
            </div>
          </div>
          <div class="dropdown">
            <button class="nav-toggle" id="security-toggle" type="button" aria-expanded="false" aria-controls="security-menu">
              Sécurité <span aria-hidden="true">▾</span>
            </button>
            <div class="dropdown__menu" id="security-menu" role="menu" aria-label="Sécurité">
              <a class="dropdown__item" href="${hibpHref}" role="menuitem">HIBP</a>
              <a class="dropdown__item" href="${privacyHref}" role="menuitem">Confidentialité</a>
            </div>
          </div>
          <div class="dropdown">
            <button class="nav-toggle" id="lang-toggle" type="button" aria-expanded="false" aria-controls="lang-menu">
              ${displayLabel} <span aria-hidden="true">▾</span>
            </button>
            <div class="dropdown__menu dropdown__menu--lang" id="lang-menu" role="menu" aria-label="Langue">
              ${langItems}
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
    <a class="drawer__link ${currentFile === 'index.html' ? 'is-active' : ''}" href="${homeHref}">Tester un mot de passe</a>
    <a class="drawer__link ${currentFile === 'generator.html' ? 'is-active' : ''}" href="${generatorHref}">Générer un mot de passe</a>
    <a class="drawer__link ${currentFile === 'faq.html' ? 'is-active' : ''}" href="${faqHref}">FAQ</a>
    <a class="drawer__link ${currentFile === 'about.html' ? 'is-active' : ''}" href="${aboutHref}">À propos</a>
    <details class="drawer__details">
      <summary>Science</summary>
      <div class="drawer__nested">
        <a class="drawer__link" href="${howHref}">Comment ça fonctionne</a>
        ${METHOD_PAGES.map((file) => {
          const target = relative(currentSpec.outPath, outputPathFor(currentSpec.locale, file, true));
          const label = file === 'bruteforce.html' ? 'Force brute'
            : file === 'dictionary.html' ? 'Dictionnaire'
            : file === 'hybrid.html' ? 'Hybride'
            : file === 'mask.html' ? 'Masque'
            : file === 'markov.html' ? 'Markov'
            : file === 'pcfg.html' ? 'PCFG'
            : 'Combinateur';
          return `<a class="drawer__link" href="${target}">${label}</a>`;
        }).join('')}
        <a class="drawer__link" href="${sourcesHref}">Sources</a>
      </div>
    </details>
    <details class="drawer__details">
      <summary>Sécurité</summary>
      <div class="drawer__nested">
        <a class="drawer__link" href="${hibpHref}">HIBP</a>
        <a class="drawer__link" href="${privacyHref}">Confidentialité</a>
      </div>
    </details>
    <details class="drawer__details">
      <summary>Langue</summary>
      <div class="drawer__nested">
        ${LANGS.map((lang) => {
          const target = outputPathFor(lang, currentFile, currentSpec.isMethod);
          const href = relative(currentSpec.outPath, target);
          return `<a class="drawer__link" hreflang="${lang}" href="${href}">${LANG_LABELS[lang]}</a>`;
        }).join('')}
      </div>
    </details>
  </div>`;
}

function buildFooter(currentSpec) {
  const currentDir = path.dirname(currentSpec.outPath);
  const aboutHref = relative(currentSpec.outPath, path.join(currentDir, currentSpec.isMethod ? '..' : '', 'about.html'));
  const sourcesHref = relative(currentSpec.outPath, path.join(currentDir, currentSpec.isMethod ? '..' : '', 'sources.html'));
  const privacyHref = relative(currentSpec.outPath, path.join(currentDir, currentSpec.isMethod ? '..' : '', 'privacy.html'));
  const hibpHref = relative(currentSpec.outPath, path.join(currentDir, currentSpec.isMethod ? '..' : '', 'hibp.html'));

  return `
  <footer class="footer">
    <div class="footer__links">
      <a href="${aboutHref}">À propos</a>
      <a href="${sourcesHref}">Sources</a>
      <a href="${privacyHref}">Confidentialité</a>
      <a href="${hibpHref}">HIBP</a>
    </div>
    <div class="footer__meta">Copie locale avec contenu réel des pages existantes et navigation interne fonctionnelle.</div>
  </footer>`;
}

async function loadHtml(filePath, fallbackPath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    if (!fallbackPath) throw new Error(`Missing source: ${filePath}`);
    return readFile(fallbackPath, 'utf8');
  }
}

function buildShell(currentSpec, innerHtml, title, cssText) {
  const assetPrefix = prefix(currentSpec.outPath);
  const header = buildHeader({ currentSpec });
  const footer = buildFooter(currentSpec);
  return `<!DOCTYPE html>
<html lang="${currentSpec.locale || 'fr'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
  <link href="https://fonts.bunny.net/css?family=ibm-plex-sans:300,400,500,600|ibm-plex-mono:400,500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${assetPrefix}site.css">
  <style>${cssText}</style>
</head>
<body data-page="${currentSpec.pageKey.replace('.html', '')}">
${header}
<main class="page-shell">
${innerHtml}
</main>
${footer}
<script src="${assetPrefix}site.js"></script>
<script type="module" src="${assetPrefix}engine-bridge.js"></script>
</body>
</html>`;
}

async function main() {
  const cssText = await readFile(path.join(OUT_ROOT, 'site.css'), 'utf8');
  const specs = [];
  for (const file of ROOT_PAGES) {
    specs.push({
      locale: null,
      isMethod: false,
      file,
      pageKey: file,
      outPath: outputPathFor(null, file, false),
      sourcePath: rootSourceFor(file),
      fallbackPath: file === 'how-time2crack-works.html' || file === 'sources.html' ? path.join(LIVE_ROOT, 'fr', file) : null
    });
  }
  for (const lang of LANGS) {
    for (const file of ROOT_PAGES) {
      specs.push({
        locale: lang,
        isMethod: false,
        file,
        pageKey: file,
        outPath: outputPathFor(lang, file, false),
        sourcePath: localeSourceFor(lang, file, false),
        fallbackPath: file === 'how-time2crack-works.html' || file === 'sources.html' ? path.join(LIVE_ROOT, 'fr', file) : null
      });
    }
    for (const file of METHOD_PAGES) {
      specs.push({
        locale: lang,
        isMethod: true,
        file: `methode/${file}`,
        pageKey: file,
        outPath: outputPathFor(lang, file, true),
        sourcePath: localeSourceFor(lang, file, true),
        fallbackPath: file === 'index.html' ? path.join(V2_ROOT, lang, 'methode', 'index.html') : null
      });
    }
  }
  for (const file of METHOD_PAGES) {
    specs.push({
      locale: null,
      isMethod: true,
      file: `methode/${file}`,
      pageKey: file,
      outPath: outputPathFor(null, file, true),
      sourcePath: file === 'index.html' ? path.join(V2_ROOT, 'methode', 'index.html') : path.join(LIVE_ROOT, 'methode', file),
      fallbackPath: file === 'index.html' ? path.join(V2_ROOT, 'methode', 'index.html') : null
    });
  }

  await Promise.all(specs.map(async (spec) => {
    const source = await loadHtml(spec.sourcePath, spec.fallbackPath);
    const title = extractTitle(source);
    const body = extractBody(source);
    const html = buildShell(spec, body, title, cssText);
    await mkdir(path.dirname(spec.outPath), { recursive: true });
    await writeFile(spec.outPath, html, 'utf8');
  }));
}

await main();
