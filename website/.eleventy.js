module.exports = function(eleventyConfig) {
  // Copy assets
  eleventyConfig.addPassthroughCopy("src/assets");
  
  // Watch for changes in data directory
  eleventyConfig.addWatchTarget("../data/**/*");
  
  // Add data files
  eleventyConfig.addGlobalData("members", () => {
    // Will be populated by build process
    return [];
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
