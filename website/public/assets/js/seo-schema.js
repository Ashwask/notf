/**
 * NOTF SEO schema helper
 *
 * Injects schema.org JSON-LD into the document <head> from in-memory data.
 * Keeps a single source of truth (the same data that renders the page) and
 * ensures new Supabase entries automatically get structured data without
 * deploys or regeneration.
 *
 * Usage:
 *   window.notfSeo.injectItemList({
 *     name: 'Communities',
 *     url: 'https://notf.in/communities/',
 *     items: allCommunities,
 *     toItem: (c) => ({ '@type': 'Organization', name: c.name, ... })
 *   });
 */
(function () {
    'use strict';

    function createScript(data) {
        // Remove any prior schema we injected so re-renders don't duplicate.
        document.querySelectorAll('script[data-notf-seo]').forEach((el) => el.remove());

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-notf-seo', '1');
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
    }

    function injectItemList(opts) {
        if (!opts || !Array.isArray(opts.items) || opts.items.length === 0) return;

        const itemListElement = opts.items.map((item, i) => {
            const schemaItem = opts.toItem(item, i);
            if (!schemaItem) return null;
            return {
                '@type': 'ListItem',
                position: i + 1,
                item: schemaItem,
            };
        }).filter(Boolean);

        if (itemListElement.length === 0) return;

        const payload = {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: opts.name,
            url: opts.url,
            numberOfItems: itemListElement.length,
            itemListElement: itemListElement,
        };

        createScript(payload);
    }

    function injectBreadcrumb(items) {
        if (!Array.isArray(items) || items.length === 0) return;
        const payload = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: items.map((it, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: it.name,
                item: it.url,
            })),
        };
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-notf-seo-breadcrumb', '1');
        script.textContent = JSON.stringify(payload);
        document.head.appendChild(script);
    }

    window.notfSeo = {
        injectItemList: injectItemList,
        injectBreadcrumb: injectBreadcrumb,
    };
})();
