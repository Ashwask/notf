(function() {
    // Load translator first, then language-selector (depends on translator),
    // then nav-highlight. Sequential to avoid race conditions.
    var queue = [
        '/assets/i18n/translator.js',
        '/assets/i18n/language-selector.js',
        '/assets/js/nav-highlight.js'
    ];

    function loadNext(i) {
        if (i >= queue.length) return;
        var el = document.createElement('script');
        el.src = queue[i];
        el.onload = function() { loadNext(i + 1); };
        el.onerror = function() { loadNext(i + 1); };
        document.body.appendChild(el);
    }

    loadNext(0);
})();
