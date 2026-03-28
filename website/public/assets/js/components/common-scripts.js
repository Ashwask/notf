(function() {
    // Load shared scripts that every page needs
    var scripts = [
        '/assets/i18n/translator.js',
        '/assets/i18n/language-selector.js',
        '/assets/js/nav-highlight.js'
    ];

    scripts.forEach(function(src) {
        var el = document.createElement('script');
        el.src = src;
        document.body.appendChild(el);
    });
})();
