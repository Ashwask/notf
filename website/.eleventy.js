const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Helper function to load all YAML files from a directory
function loadYamlDirectory(dirPath) {
  const results = [];
  if (!fs.existsSync(dirPath)) {
    return results;
  }

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (file.endsWith('.yaml') || file.endsWith('.yml')) {
      // Skip template files
      if (file.startsWith('_')) continue;

      const filePath = path.join(dirPath, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = yaml.load(content);
        if (data) {
          results.push(data);
        }
      } catch (e) {
        console.warn(`Warning: Could not parse ${filePath}:`, e.message);
      }
    }
  }
  return results;
}

module.exports = function(eleventyConfig) {
  // Copy assets
  eleventyConfig.addPassthroughCopy("src/assets");

  // Watch for changes in data directory
  eleventyConfig.addWatchTarget("../data/**/*");

  // Data directory path (relative to website folder)
  const dataDir = path.join(__dirname, '..', 'data');

  // Load organizations
  eleventyConfig.addGlobalData("organizations", () => {
    return loadYamlDirectory(path.join(dataDir, 'members', 'organizations'));
  });

  // Load individuals
  eleventyConfig.addGlobalData("individuals", () => {
    return loadYamlDirectory(path.join(dataDir, 'members', 'individuals'));
  });

  // Load communities
  eleventyConfig.addGlobalData("communities", () => {
    return loadYamlDirectory(path.join(dataDir, 'communities'));
  });

  // Helper filter to format domains
  eleventyConfig.addFilter("formatDomains", (domains) => {
    if (!domains || !Array.isArray(domains)) return '';
    return domains.map(d => d.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
  });

  // Helper filter to format date
  eleventyConfig.addFilter("formatDate", (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data"
    },
    // IMPORTANT: Set base path for GitHub Pages subdirectory
    pathPrefix: "/notf/"
  };
};
