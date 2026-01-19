/**
 * NOTF i18n Translator
 * Lightweight translation system for static HTML sites
 * Supports 10 Indian languages + English
 *
 * Usage:
 *   <h1 data-i18n="homepage.title">Neighbourhoods of the Future</h1>
 *   translator.setLanguage('hi'); // Switch to Hindi
 */

class NOTFTranslator {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = {};
        this.loadedLanguages = new Set();
        this.defaultLanguage = 'en';

        // Supported languages with metadata
        this.languages = {
            'en': { name: 'English', nativeName: 'English', dir: 'ltr', font: 'system' },
            'hi': { name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', font: 'Noto Sans Devanagari' },
            'kn': { name: 'Kannada', nativeName: 'ಕನ್ನಡ', dir: 'ltr', font: 'Noto Sans Kannada' },
            'mr': { name: 'Marathi', nativeName: 'मराठी', dir: 'ltr', font: 'Noto Sans Devanagari' },
            'ta': { name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr', font: 'Noto Sans Tamil' },
            'te': { name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr', font: 'Noto Sans Telugu' },
            'gu': { name: 'Gujarati', nativeName: 'ગુજરાતી', dir: 'ltr', font: 'Noto Sans Gujarati' },
            'bn': { name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr', font: 'Noto Sans Bengali' },
            'ml': { name: 'Malayalam', nativeName: 'മലയാളം', dir: 'ltr', font: 'Noto Sans Malayalam' },
            'or': { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', dir: 'ltr', font: 'Noto Sans Oriya' },
            'ur': { name: 'Urdu', nativeName: 'اردو', dir: 'rtl', font: 'Noto Nastaliq Urdu' }
        };

        // Detect and set initial language
        this.detectLanguage();
    }

    /**
     * Detect user's preferred language
     */
    detectLanguage() {
        // 1. Check localStorage
        const saved = localStorage.getItem('notf_language');
        if (saved && this.languages[saved]) {
            this.currentLanguage = saved;
            return;
        }

        // 2. Check browser language
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.split('-')[0]; // 'en-US' -> 'en'

        if (this.languages[langCode]) {
            this.currentLanguage = langCode;
            return;
        }

        // 3. Default to English
        this.currentLanguage = 'en';
    }

    /**
     * Load translation file for a language
     */
    async loadLanguage(langCode) {
        if (this.loadedLanguages.has(langCode)) {
            return true; // Already loaded
        }

        try {
            const response = await fetch(`/assets/i18n/locales/${langCode}.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const translations = await response.json();
            this.translations[langCode] = translations;
            this.loadedLanguages.add(langCode);

            console.log(`✅ Loaded ${langCode} translations`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to load ${langCode} translations:`, error);
            return false;
        }
    }

    /**
     * Get translation for a key
     * @param {string} key - Translation key (e.g., 'nav.home')
     * @param {object} params - Optional parameters for interpolation
     */
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLanguage];

        // Traverse nested object
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                value = null;
                break;
            }
        }

        // Fallback to English if translation not found
        if (!value && this.currentLanguage !== this.defaultLanguage) {
            let fallback = this.translations[this.defaultLanguage];
            for (const k of keys) {
                if (fallback && typeof fallback === 'object') {
                    fallback = fallback[k];
                } else {
                    fallback = null;
                    break;
                }
            }
            value = fallback;
        }

        // If still no value, return the key itself
        if (!value) {
            console.warn(`Missing translation: ${key} (${this.currentLanguage})`);
            return key;
        }

        // Interpolate parameters
        if (params && typeof value === 'string') {
            return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
                return params[param] !== undefined ? params[param] : match;
            });
        }

        return value;
    }

    /**
     * Translate all elements with data-i18n attribute
     */
    translatePage() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');

            // Check for params
            let params = {};
            const paramsAttr = element.getAttribute('data-i18n-params');
            if (paramsAttr) {
                try {
                    params = JSON.parse(paramsAttr);
                } catch (e) {
                    console.warn(`Failed to parse data-i18n-params for key ${key}:`, e);
                }
            }

            const translation = this.t(key, params);

            // Check if element has data-i18n-html attribute or params (allows HTML)
            if (element.hasAttribute('data-i18n-html') || paramsAttr) {
                element.innerHTML = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.t(key);
            element.placeholder = translation;
        });

        // Translate aria-labels
        document.querySelectorAll('[data-i18n-aria]').forEach(element => {
            const key = element.getAttribute('data-i18n-aria');
            const translation = this.t(key);
            element.setAttribute('aria-label', translation);
        });

        // Translate titles
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const translation = this.t(key);
            element.setAttribute('title', translation);
        });
    }

    /**
     * Set the current language and update the page
     */
    async setLanguage(langCode) {
        if (!this.languages[langCode]) {
            console.error(`Unsupported language: ${langCode}`);
            return false;
        }

        // Load language file if not already loaded
        const loaded = await this.loadLanguage(langCode);
        if (!loaded) {
            return false;
        }

        this.currentLanguage = langCode;

        // Save to localStorage
        localStorage.setItem('notf_language', langCode);

        // Update HTML lang and dir attributes
        document.documentElement.lang = langCode;
        document.documentElement.dir = this.languages[langCode].dir;

        // Apply language-specific font
        this.applyFont(langCode);

        // Translate all elements
        this.translatePage();

        // Update language selector UI
        this.updateLanguageSelectorUI();

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: langCode }
        }));

        console.log(`✅ Language changed to: ${this.languages[langCode].nativeName}`);
        return true;
    }

    /**
     * Apply language-specific font
     */
    applyFont(langCode) {
        const lang = this.languages[langCode];
        if (!lang || lang.font === 'system') return;

        // Add font-family to body
        document.body.style.fontFamily = `"${lang.font}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    }

    /**
     * Update language selector UI (if present)
     */
    updateLanguageSelectorUI() {
        const currentLangElement = document.querySelector('.language-selector-current');
        if (currentLangElement) {
            const lang = this.languages[this.currentLanguage];
            currentLangElement.textContent = lang.nativeName;
        }

        // Update active state in dropdown
        document.querySelectorAll('.language-option').forEach(option => {
            const langCode = option.getAttribute('data-lang');
            if (langCode === this.currentLanguage) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    /**
     * Get list of supported languages
     */
    getLanguages() {
        return Object.entries(this.languages).map(([code, data]) => ({
            code,
            ...data
        }));
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return {
            code: this.currentLanguage,
            ...this.languages[this.currentLanguage]
        };
    }

    /**
     * Initialize translator on page load
     */
    async init() {
        // Load current language translations
        await this.loadLanguage(this.currentLanguage);

        // Apply current language
        document.documentElement.lang = this.currentLanguage;
        document.documentElement.dir = this.languages[this.currentLanguage].dir;
        this.applyFont(this.currentLanguage);

        // Translate page
        this.translatePage();

        console.log(`✅ NOTF Translator initialized (${this.currentLanguage})`);
    }
}

// Create global translator instance
window.translator = new NOTFTranslator();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.translator.init();
    });
} else {
    window.translator.init();
}
