/**
 * Language Selector Component
 * Creates and manages the language dropdown UI
 * Supports city-specific language filtering
 */

let citiesMetadata = null;

/**
 * Load cities metadata to get language mappings
 */
async function loadCitiesMetadata() {
    if (citiesMetadata) return citiesMetadata;

    try {
        const response = await fetch('/assets/data/cities-metadata.json');
        citiesMetadata = await response.json();
        return citiesMetadata;
    } catch (error) {
        console.error('Error loading cities metadata:', error);
        return null;
    }
}

/**
 * Detect current city from URL path
 * @returns {string|null} - City slug or null if not on city page
 */
function getCurrentCity() {
    const path = window.location.pathname;
    const match = path.match(/^\/cities\/([^\/]+)/);
    return match ? match[1] : null;
}

/**
 * Get filtered languages based on current context
 * - Homepage (/): Show all 11 languages
 * - City pages (/cities/[city]/): Show only English + city's primary language
 * @returns {Array} - Filtered array of language objects
 */
async function getAvailableLanguages() {
    const allLanguages = window.translator.getLanguages();
    const currentCity = getCurrentCity();

    // Homepage: show all languages
    if (!currentCity) {
        return allLanguages;
    }

    // City pages: show English + city's primary language
    const metadata = await loadCitiesMetadata();
    if (!metadata) {
        // Fallback to all languages if metadata fails to load
        return allLanguages;
    }

    const cityData = metadata.cities.find(c => c.slug === currentCity);
    if (!cityData || !cityData.primaryLanguage) {
        // Fallback to English only if city not found
        return allLanguages.filter(lang => lang.code === 'en');
    }

    // Return English + city's primary language
    const primaryLangCode = cityData.primaryLanguage;
    return allLanguages.filter(lang =>
        lang.code === 'en' || lang.code === primaryLangCode
    );
}

/**
 * Create language selector UI
 */
async function createLanguageSelector() {
    const container = document.createElement('div');
    container.className = 'language-selector';

    const currentLang = window.translator.getCurrentLanguage();
    const availableLanguages = await getAvailableLanguages();

    // If current language is not in available languages, switch to English
    if (!availableLanguages.find(lang => lang.code === currentLang.code)) {
        await window.translator.setLanguage('en');
    }

    container.innerHTML = `
        <button class="language-selector-button" aria-label="Select language" aria-expanded="false">
            <span class="icon"><i class="fa-solid fa-language"></i></span>
            <span class="language-selector-current">${currentLang.nativeName}</span>
            <span class="chevron"><i class="fa-solid fa-chevron-down"></i></span>
        </button>
        <div class="language-dropdown">
            <div class="language-dropdown-header">Choose Language</div>
            <div class="language-options">
                ${availableLanguages.map(lang => `
                    <button
                        class="language-option ${lang.code === currentLang.code ? 'active' : ''}"
                        data-lang="${lang.code}"
                        onclick="switchLanguage('${lang.code}')"
                    >
                        <div class="language-option-details">
                            <span class="language-option-native">${lang.nativeName}</span>
                            <span class="language-option-english">${lang.name}</span>
                        </div>
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    // Toggle dropdown
    const button = container.querySelector('.language-selector-button');
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        container.classList.toggle('open');
        button.setAttribute('aria-expanded', container.classList.contains('open'));
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            container.classList.remove('open');
            button.setAttribute('aria-expanded', 'false');
        }
    });

    // Close dropdown on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && container.classList.contains('open')) {
            container.classList.remove('open');
            button.setAttribute('aria-expanded', 'false');
            button.focus();
        }
    });

    return container;
}

/**
 * Switch language globally
 */
async function switchLanguage(langCode) {
    const success = await window.translator.setLanguage(langCode);
    if (success) {
        // Close dropdown
        document.querySelectorAll('.language-selector').forEach(selector => {
            selector.classList.remove('open');
            const button = selector.querySelector('.language-selector-button');
            if (button) {
                button.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

/**
 * Add language selector to navigation
 */
async function initLanguageSelector() {
    // Find navigation menu
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) {
        console.warn('Navigation menu not found, language selector not added');
        return;
    }

    // Create and add language selector before admin link
    const languageSelector = await createLanguageSelector();
    const adminLink = navMenu.querySelector('.admin-link');

    if (adminLink) {
        navMenu.insertBefore(languageSelector, adminLink);
    } else {
        navMenu.appendChild(languageSelector);
    }

    const currentCity = getCurrentCity();
    if (currentCity) {
        console.log(`✅ Language selector added (city mode: ${currentCity})`);
    } else {
        console.log('✅ Language selector added (all languages mode)');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageSelector);
} else {
    initLanguageSelector();
}

// Re-initialize when language changes (to update dropdown state)
window.addEventListener('languageChanged', () => {
    // Update current language display
    document.querySelectorAll('.language-selector-current').forEach(el => {
        const currentLang = window.translator.getCurrentLanguage();
        el.textContent = currentLang.nativeName;
    });
});
