const { loadMembers, loadCommunities, loadSolutionProviders } = require('./load-data-supabase.js');

module.exports = function(eleventyConfig) {
  // Copy assets
  eleventyConfig.addPassthroughCopy("src/assets");

  // Watch for changes in data directory
  eleventyConfig.addWatchTarget("../data/**/*");

  // Load data
  eleventyConfig.addGlobalData("solutionProviders", () => {
    return loadSolutionProviders();
  });

  eleventyConfig.addGlobalData("communities", () => {
    return loadCommunities();
  });

  // Legacy support - members now maps to solution providers
  eleventyConfig.addGlobalData("members", () => {
    return loadSolutionProviders();
  });

  // Legacy support - organizations
  eleventyConfig.addGlobalData("organizations", () => {
    return loadSolutionProviders();
  });

  // Individuals - empty for now (can be added later if needed)
  eleventyConfig.addGlobalData("individuals", () => {
    return [];
  });

  // Add filters
  eleventyConfig.addFilter("filterByType", function(members, type) {
    if (!members) return [];
    return members.filter(m => m.type === type);
  });

  eleventyConfig.addFilter("filterByLocation", function(members, location) {
    if (!members || !location) return members || [];
    return members.filter(m => m.location && m.location.includes(location));
  });

  eleventyConfig.addFilter("filterByCity", function(communities, city) {
    if (!communities || !city) return communities || [];
    return communities.filter(c => c.city === city);
  });

  eleventyConfig.addFilter("limit", function(array, limit) {
    if (!array) return [];
    return array.slice(0, limit);
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

  // Simple markdown rendering (just return content as-is for now)
  eleventyConfig.addFilter("markdown", function(content) {
    return content || '';
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
