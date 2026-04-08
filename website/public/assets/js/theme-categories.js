/**
 * Shared theme categories and supported cities. Single source of truth.
 * Used by join form, admin pages, catalogue filters, chatbot onboarding,
 * and complaint engine.
 *
 * Idempotent: this file may be loaded twice on the same page (e.g. directly
 * via <script> and again by chatbot-loader.js). Guard against re-declaration.
 */
if (typeof window.THEME_CATEGORIES === 'undefined') {
    window.THEME_CATEGORIES = [
        'Waste & Circular Economy',
        'Placemaking & Urban Ecology',
        'Governance & Policy',
        'Energy & Climate',
        'Livelihoods & Inclusion',
        'Water & Ecology',
        'Mobility',
        'Place-Based Centres'
    ];
}

if (typeof window.SUPPORTED_CITIES === 'undefined') {
    window.SUPPORTED_CITIES = [
        'Ahmedabad',
        'Bengaluru',
        'Bhubaneswar',
        'Chennai',
        'Dehradun',
        'Dharamshala',
        'Hyderabad',
        'Jaipur',
        'Kochi',
        'Kolkata',
        'Mumbai',
        'Pune',
        'Thane',
        'Visakhapatnam'
    ];
}

// Backwards-compatible bare references for code that does `typeof THEME_CATEGORIES`.
var THEME_CATEGORIES = window.THEME_CATEGORIES;
var SUPPORTED_CITIES = window.SUPPORTED_CITIES;
