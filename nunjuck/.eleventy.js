const fs = require('fs');
const path = require('path');

module.exports = function(eleventyConfig) {

  // Pas de passthrough copy — les assets sont déjà dans v2/public/
  // IMPORTANT : ne jamais utiliser --cleanOutput (effacerait les assets)

  const LANGS = ['fr', 'en', 'es', 'pt', 'de', 'it', 'tr', 'pl', 'nl'];

  // Filtre : chemin absolu pour les assets (évite les chemins relatifs cassés)
  eleventyConfig.addFilter("assetUrl", function(asset) {
    return "/" + asset;
  });

  // Filtre : URL d'une page dans une langue donnée
  eleventyConfig.addFilter("pageUrl", function(lang, slug) {
    return "/" + lang + "/" + slug;
  });

  // Filtre : injecter le CSS critique si demandé
  eleventyConfig.addFilter("getCriticalCss", function() {
    const criticalCssPath = path.join(__dirname, 'critical.min.css');
    try {
      if (fs.existsSync(criticalCssPath)) {
        const css = fs.readFileSync(criticalCssPath, 'utf8');
        return `<style>${css}</style>`;
      }
    } catch (e) {
      console.warn('Critical CSS file not found:', criticalCssPath);
    }
    return '';
  });

  eleventyConfig.setNunjucksEnvironmentOptions({
    throwOnUndefined: false,
    trimBlocks: true,
    lstripBlocks: true
  });

  return {
    dir: {
      input: "src",
      output: "build",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data"
    },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk"
  };
};
