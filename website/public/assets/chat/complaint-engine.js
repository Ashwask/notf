/**
 * Complaint Engine
 * Handles complaint categorization and workflow for 12 cities
 * Supports multi-city complaints with auto-tagging
 */

class ComplaintEngine {
    constructor() {
        this.categories = this.loadCategories(); // Fallback categories
        this.boundaryValidator = null; // Lazy load
        this.supportedCities = this.loadSupportedCities();
        this.categoriesLoaded = false;
        this.apiBaseUrl = 'https://notf-cms.vercel.app/api';

        // Fetch categories from API in background
        this.initializeCategories();
    }

    /**
     * Initialize categories from API (async)
     * Falls back to hardcoded categories if API fails
     */
    async initializeCategories() {
        try {
            const categories = await this.fetchCategoriesFromAPI();
            if (categories && categories.length > 0) {
                this.categories = categories;
                this.categoriesLoaded = true;
                console.log('[ComplaintEngine] Loaded', categories.length, 'categories from API');
            }
        } catch (error) {
            console.warn('[ComplaintEngine] Failed to load categories from API, using fallback:', error.message);
            // Already using fallback from constructor
        }
    }

    /**
     * Fetch categories from API
     * @returns {Promise<Array>} - Array of category objects
     */
    async fetchCategoriesFromAPI() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/categories`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.categories) {
                return result.categories;
            }

            throw new Error('Invalid API response format');
        } catch (error) {
            console.error('[ComplaintEngine] API fetch error:', error);
            throw error;
        }
    }

    /**
     * Load supported cities (12 cities)
     */
    loadSupportedCities() {
        return [
            { code: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat' },
            { code: 'bengaluru', name: 'Bengaluru', state: 'Karnataka' },
            { code: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha' },
            { code: 'chennai', name: 'Chennai', state: 'Tamil Nadu' },
            { code: 'gurugram', name: 'Gurugram', state: 'Haryana' },
            { code: 'hyderabad', name: 'Hyderabad', state: 'Telangana' },
            { code: 'jaipur', name: 'Jaipur', state: 'Rajasthan' },
            { code: 'kolkata', name: 'Kolkata', state: 'West Bengal' },
            { code: 'mumbai', name: 'Mumbai', state: 'Maharashtra' },
            { code: 'pune', name: 'Pune', state: 'Maharashtra' },
            { code: 'thane', name: 'Thane', state: 'Maharashtra' },
            { code: 'visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh' }
        ];
    }

    /**
     * Get or create boundary validator
     */
    getBoundaryValidator() {
        if (!this.boundaryValidator) {
            if (typeof BoundaryValidator === 'undefined') {
                throw new Error('BoundaryValidator not loaded');
            }
            this.boundaryValidator = new BoundaryValidator();
        }
        return this.boundaryValidator;
    }

    loadCategories() {
        // Issue categories with keywords (matches notf-cms database)
        return [
            // Electrical
            {
                id: 'streetlight_not_working',
                name: 'Street Light Not Working',
                department: 'Electrical',
                keywords: ['streetlight', 'street light', 'light not working', 'lamp', 'dark street', 'no light']
            },
            {
                id: 'streetlight_flickering',
                name: 'Street Light Flickering',
                department: 'Electrical',
                keywords: ['flickering', 'blinking', 'flashing light', 'unstable light']
            },
            {
                id: 'electrical_wire',
                name: 'Exposed/Dangling Wires',
                department: 'Electrical',
                keywords: ['wire', 'cable', 'exposed wire', 'dangling', 'electric cable', 'dangerous wire']
            },

            // SWM (Solid Waste Management)
            {
                id: 'garbage_not_collected',
                name: 'Garbage Not Collected',
                department: 'SWM',
                keywords: ['garbage', 'waste', 'not collected', 'rubbish', 'trash', 'no pickup']
            },
            {
                id: 'garbage_dump',
                name: 'Illegal Garbage Dump',
                department: 'SWM',
                keywords: ['dump', 'dumping', 'illegal dump', 'garbage pile', 'waste dump']
            },
            {
                id: 'dustbin',
                name: 'Dustbin Overflow/Missing',
                department: 'SWM',
                keywords: ['dustbin', 'bin', 'overflow', 'full bin', 'no dustbin']
            },

            // Roads
            {
                id: 'pothole',
                name: 'Pothole',
                department: 'Roads',
                keywords: ['pothole', 'hole', 'pit', 'road damage', 'crater']
            },
            {
                id: 'road_damage',
                name: 'Road Damage/Cracks',
                department: 'Roads',
                keywords: ['road damage', 'crack', 'broken road', 'road repair']
            },
            {
                id: 'footpath',
                name: 'Footpath Issues',
                department: 'Roads',
                keywords: ['footpath', 'pavement', 'sidewalk', 'walking path', 'pedestrian']
            },

            // Water
            {
                id: 'no_water',
                name: 'No Water Supply',
                department: 'Water',
                keywords: ['no water', 'water supply', 'water cut', 'dry tap', 'no supply']
            },
            {
                id: 'pipe_leak',
                name: 'Water Pipe Leakage',
                department: 'Water',
                keywords: ['leak', 'leakage', 'pipe burst', 'water leak', 'broken pipe']
            },

            // Drainage
            {
                id: 'drain_block',
                name: 'Blocked Drain',
                department: 'Drainage',
                keywords: ['blocked', 'clogged', 'drain block', 'choked drain', 'overflow']
            },
            {
                id: 'sewage_overflow',
                name: 'Sewage Overflow',
                department: 'Drainage',
                keywords: ['sewage', 'overflow', 'sewage leak', 'sewage smell', 'manhole']
            },

            // Trees
            {
                id: 'tree_fall',
                name: 'Fallen Tree',
                department: 'Forest',
                keywords: ['fallen tree', 'tree fall', 'uprooted', 'tree down']
            },
            {
                id: 'tree_pruning',
                name: 'Tree Pruning Required',
                department: 'Forest',
                keywords: ['pruning', 'overgrown', 'branches', 'trim tree', 'cutting']
            },

            // Health
            {
                id: 'mosquito',
                name: 'Mosquito Breeding',
                department: 'Health',
                keywords: ['mosquito', 'breeding', 'dengue', 'malaria', 'stagnant water']
            },
            {
                id: 'dead_animal',
                name: 'Dead Animal Removal',
                department: 'Health',
                keywords: ['dead animal', 'carcass', 'dead dog', 'dead cat', 'animal body']
            },

            // Animals
            {
                id: 'stray_dogs',
                name: 'Stray Dogs Menace',
                department: 'Animals',
                keywords: ['stray dog', 'dog', 'dogs', 'barking', 'dog bite', 'aggressive dog']
            },
            {
                id: 'stray_cattle',
                name: 'Stray Cattle',
                department: 'Animals',
                keywords: ['cattle', 'cow', 'bull', 'stray cattle', 'animals on road']
            }
        ];
    }

    categorizeComplaint(description) {
        // Try Fuse.js fuzzy matching first
        if (typeof Fuse !== 'undefined') {
            return this.categorizeWithFuse(description);
        }

        // Fallback to basic substring matching
        const descLower = description.toLowerCase();
        const matches = [];

        this.categories.forEach(category => {
            let score = 0;

            category.keywords.forEach(keyword => {
                if (descLower.includes(keyword)) {
                    score += keyword.split(' ').length; // Longer phrases get higher scores
                }
            });

            if (score > 0) {
                matches.push({ ...category, score });
            }
        });

        // Sort by score (highest first)
        matches.sort((a, b) => b.score - a.score);

        // Return best match for backward compatibility
        return matches.length > 0 ? matches[0] : null;
    }

    /**
     * Fuzzy categorization using Fuse.js
     * @param {string} description - The complaint description
     * @returns {Object|null} - Best matching category with score
     */
    categorizeWithFuse(description) {
        let bestMatch = null;
        let bestScore = 0;

        // Create a Fuse instance for searching keywords IN the description
        const descFuse = new Fuse([description], {
            threshold: 0.4,           // Allow 40% difference (typo tolerance)
            includeScore: true,       // Return match quality
            minMatchCharLength: 2,    // Minimum 2 chars to match
            ignoreLocation: true,     // Search entire string
            findAllMatches: true      // Get all keyword matches
        });

        this.categories.forEach(category => {
            let categoryScore = 0;
            const matchedKeywords = [];

            // If category has keywords, use them for matching
            if (category.keywords && category.keywords.length > 0) {
                // Check each keyword against the description
                category.keywords.forEach(keyword => {
                    const results = descFuse.search(keyword);

                    if (results.length > 0) {
                        // Found a match - score based on match quality
                        const matchQuality = 1 - results[0].score;
                        // Weight by keyword length (longer phrases = more specific = higher score)
                        const keywordWeight = keyword.split(' ').length;
                        categoryScore += matchQuality * keywordWeight;
                        matchedKeywords.push(keyword);
                    }
                });
            } else {
                // Fallback: If no keywords, match against category name
                const nameResults = descFuse.search(category.name);

                if (nameResults.length > 0) {
                    const matchQuality = 1 - nameResults[0].score;
                    // Very low weight for name-only matches to avoid matching location references
                    // (e.g., "post office" as a location shouldn't match "Post Offices" category)
                    categoryScore = matchQuality * 0.2;
                    matchedKeywords.push(`[name: ${category.name}]`);
                }
            }

            if (categoryScore > bestScore) {
                bestScore = categoryScore;
                bestMatch = {
                    ...category,
                    score: categoryScore,
                    matchedKeywords: matchedKeywords
                };
            }
        });

        return bestMatch;
    }

    /**
     * Get top N category matches for a description
     * @param {string} description - The complaint description
     * @param {number} limit - Maximum number of suggestions (default: 5)
     * @returns {Array} - Array of category objects with scores
     */
    getTopCategorySuggestions(description, limit = 5) {
        // Try Fuse.js fuzzy matching first
        if (typeof Fuse !== 'undefined') {
            return this.getTopSuggestionsWithFuse(description, limit);
        }

        // Fallback to basic substring matching
        const descLower = description.toLowerCase();
        const matches = [];

        this.categories.forEach(category => {
            let score = 0;

            category.keywords.forEach(keyword => {
                if (descLower.includes(keyword)) {
                    score += keyword.split(' ').length; // Longer phrases get higher scores
                }
            });

            if (score > 0) {
                matches.push({ ...category, score });
            }
        });

        // Sort by score (highest first) and limit results
        return matches.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    /**
     * Get top N category suggestions using Fuse.js fuzzy matching
     * @param {string} description - The complaint description
     * @param {number} limit - Maximum number of suggestions
     * @returns {Array} - Top matching categories with scores
     */
    getTopSuggestionsWithFuse(description, limit = 5) {
        const keywordMatches = [];
        const nameMatches = [];

        // Create a Fuse instance for searching keywords IN the description
        const descFuse = new Fuse([description], {
            threshold: 0.4,
            includeScore: true,
            minMatchCharLength: 2,
            ignoreLocation: true,
            findAllMatches: true
        });

        // Minimum score thresholds
        const MIN_KEYWORD_SCORE = 0.3;  // Higher bar for keyword matches
        const MIN_NAME_SCORE = 0.15;     // Lower bar for name matches

        this.categories.forEach(category => {
            let categoryScore = 0;
            const matchedKeywords = [];
            let hasKeywordMatch = false;

            // If category has keywords, use them for matching
            if (category.keywords && category.keywords.length > 0) {
                // Check each keyword against the description
                category.keywords.forEach(keyword => {
                    const results = descFuse.search(keyword);

                    if (results.length > 0) {
                        // Found a match - score based on match quality
                        const matchQuality = 1 - results[0].score;
                        // Weight by keyword length (longer phrases = more specific = higher score)
                        const keywordWeight = keyword.split(' ').length;
                        categoryScore += matchQuality * keywordWeight;
                        matchedKeywords.push(keyword);
                        hasKeywordMatch = true;
                    }
                });

                // Store in keyword matches array if it passed threshold
                if (categoryScore >= MIN_KEYWORD_SCORE) {
                    keywordMatches.push({
                        ...category,
                        score: categoryScore,
                        matchedKeywords: matchedKeywords,
                        matchType: 'keyword'
                    });
                }
            } else {
                // Fallback: If no keywords, match against category name
                const nameResults = descFuse.search(category.name);

                if (nameResults.length > 0) {
                    const matchQuality = 1 - nameResults[0].score;
                    // Very low weight for name-only matches to avoid matching location references
                    // (e.g., "post office" as a location shouldn't match "Post Offices" category)
                    categoryScore = matchQuality * 0.2;
                    matchedKeywords.push(`[name: ${category.name}]`);

                    // Store in name matches array if it passed threshold
                    if (categoryScore >= MIN_NAME_SCORE) {
                        nameMatches.push({
                            ...category,
                            score: categoryScore,
                            matchedKeywords: matchedKeywords,
                            matchType: 'name'
                        });
                    }
                }
            }
        });

        // Prioritize keyword matches over name matches
        // If we have keyword matches, use those; otherwise fall back to name matches
        const results = keywordMatches.length > 0 ? keywordMatches : nameMatches;

        return results.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    validatePhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        // Remove whitespace, dashes, and common separators
        return phoneRegex.test(phone.replace(/[\s\-().+]/g, ''));
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate photo upload
     * @param {File} file - The file to validate
     * @returns {Object} - { valid: boolean, error?: string }
     */
    validatePhoto(file) {
        const MAX_SIZE = 2 * 1024 * 1024; // 2MB in bytes
        const ALLOWED_TYPES = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/heic',
            'image/heif'
        ];

        if (!file) {
            return { valid: false, error: 'No file provided' };
        }

        // Check file size
        if (file.size > MAX_SIZE) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            return {
                valid: false,
                error: `File size (${sizeMB}MB) exceeds the 2MB limit`
            };
        }

        // Check file type
        if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
            return {
                valid: false,
                error: 'Invalid file type. Only JPG, JPEG, PNG, HEIC, and HEIF images are allowed'
            };
        }

        return { valid: true };
    }

    /**
     * Validate location and get corporation/ward details
     * Returns: { valid, city, corporation_code, ward, ... } or { valid: false, error, message }
     */
    async validateAndTagLocation(latitude, longitude, cityName = null) {
        try {
            const validator = this.getBoundaryValidator();
            return await validator.validateLocation(latitude, longitude, cityName);
        } catch (error) {
            console.error('Location validation error:', error);
            return {
                valid: false,
                error: 'validation_failed',
                message: 'Unable to validate location. Please try again.',
                details: error.message
            };
        }
    }

    /**
     * Geocode address to coordinates using Nominatim
     */
    async geocodeAddress(address) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'NOTF-Chatbot/1.0 (https://notf-one.vercel.app; chatbot@notf.in)'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Geocoding failed: ${response.status}`);
            }

            const results = await response.json();

            if (results.length === 0) {
                return {
                    success: false,
                    error: 'location_not_found',
                    message: 'Could not find this address. Please try a more specific address.'
                };
            }

            const result = results[0];

            return {
                success: true,
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon),
                display_name: result.display_name,
                address: result.address
            };
        } catch (error) {
            console.error('Geocoding error:', error);
            return {
                success: false,
                error: 'geocoding_failed',
                message: 'Unable to geocode address. Please try again or use map to select location.',
                details: error.message
            };
        }
    }

    /**
     * Prepare complaint data for submission to notf-cms API
     */
    prepareComplaintData(formData) {
        const complaint = {
            // Required fields
            description: formData.description,
            category_id: formData.category_id,

            // Location data (with auto-tagging)
            location: {
                address: formData.address,
                latitude: formData.latitude,
                longitude: formData.longitude,
                city: formData.city,
                corporation_code: formData.corporation_code,
                corporation_id: formData.corporation_id,
                ward: formData.ward,
                wardNumber: formData.wardNumber
            },

            // Contact information
            contact: {
                phone: formData.phone || null,
                email: formData.email || null,
                name: formData.name || 'Anonymous'
            },

            // Metadata
            metadata: {
                source: 'notf-chatbot',
                user_agent: navigator.userAgent,
                submitted_at: new Date().toISOString(),
                auto_tagged: formData.metadata?.auto_tagged || false,
                boundary_match: formData.metadata?.boundary_match || false
            }
        };

        // Add photo if provided
        if (formData.photo) {
            complaint.photo = formData.photo;
        }

        return complaint;
    }

    /**
     * Validate complaint data before submission
     */
    validateComplaintData(data) {
        const errors = [];

        // Description required (min 10 chars)
        if (!data.description || data.description.trim().length < 10) {
            errors.push('Description must be at least 10 characters');
        }

        // Category required
        if (!data.category_id) {
            errors.push('Issue category is required');
        }

        // Location required (check nested location object)
        if (!data.location || !data.location.latitude || !data.location.longitude) {
            errors.push('Location is required');
        }

        // Contact required (phone OR email - check nested contact object)
        if (!data.contact || (!data.contact.phone && !data.contact.email)) {
            errors.push('Phone number or email is required');
        }

        // Validate phone if provided
        if (data.contact?.phone && !this.validatePhone(data.contact.phone)) {
            errors.push('Invalid phone number (must be 10 digits starting with 6-9)');
        }

        // Validate email if provided
        if (data.contact?.email && !this.validateEmail(data.contact.email)) {
            errors.push('Invalid email address');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Get city info by code or name
     */
    getCityInfo(cityIdentifier) {
        if (!cityIdentifier) return null;

        const normalized = cityIdentifier.toLowerCase().trim();

        return this.supportedCities.find(city =>
            city.code === normalized || city.name.toLowerCase() === normalized
        );
    }

    /**
     * Check if a city is supported
     */
    isCitySupported(cityName) {
        return this.getCityInfo(cityName) !== null;
    }
}
