/**
 * Complaint Engine
 * Handles complaint categorization and workflow for 12 cities
 * Supports multi-city complaints with auto-tagging
 */

class ComplaintEngine {
    constructor() {
        this.categories = this.loadCategories();
        this.boundaryValidator = null; // Lazy load
        this.supportedCities = this.loadSupportedCities();
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
        const descLower = description.toLowerCase();
        let bestMatch = null;
        let maxScore = 0;

        this.categories.forEach(category => {
            let score = 0;

            category.keywords.forEach(keyword => {
                if (descLower.includes(keyword)) {
                    score += keyword.split(' ').length; // Longer phrases get higher scores
                }
            });

            if (score > maxScore) {
                maxScore = score;
                bestMatch = category;
            }
        });

        // Only return if we have a reasonable match
        return maxScore > 0 ? bestMatch : null;
    }

    validatePhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone.replace(/\s+/g, ''));
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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

        // Location required
        if (!data.latitude || !data.longitude) {
            errors.push('Location is required');
        }

        // Contact required (phone OR email)
        if (!data.phone && !data.email) {
            errors.push('Phone number or email is required');
        }

        // Validate phone if provided
        if (data.phone && !this.validatePhone(data.phone)) {
            errors.push('Invalid phone number (must be 10 digits starting with 6-9)');
        }

        // Validate email if provided
        if (data.email && !this.validateEmail(data.email)) {
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
