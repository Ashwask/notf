/**
 * Boundary Validator
 * Ward-level boundary validation for 12 cities using GeoJSON boundaries
 * Auto-tags corporation and ward for complaint routing
 */

class BoundaryValidator {
    constructor() {
        this.boundaryLoader = null; // Will be initialized when needed
        this.bengaluruCorporations = null;

        // Bengaluru corporation mapping (ward number to corporation)
        // This maps ward numbers to their corporation codes
        this.bengaluruCorporationMap = this.loadBengaluruCorporationMap();
    }

    /**
     * Initialize BoundaryLoader (lazy loading)
     */
    getBoundaryLoader() {
        if (!this.boundaryLoader) {
            if (typeof BoundaryLoader === 'undefined') {
                throw new Error('BoundaryLoader not loaded. Include boundary-loader.js before boundary-validator.js');
            }
            this.boundaryLoader = new BoundaryLoader();
        }
        return this.boundaryLoader;
    }

    /**
     * Load Bengaluru corporation mapping (ward → corporation)
     * Based on BBMP structure: North, South, East, West, Central
     */
    loadBengaluruCorporationMap() {
        // This is a simplified mapping - in production, load from database or config
        // Ward numbers 1-369 mapped to 5 corporations
        const map = {};

        // Note: Actual ward-to-corporation mapping would come from the database
        // For now, we'll derive it from the ward boundary properties

        return map;
    }

    /**
     * Validate location and determine corporation/ward
     * Returns: { valid, city, corporation_code, corporation_id, ward, ... }
     */
    async validateLocation(lat, lng, userProvidedCity) {
        const loader = this.getBoundaryLoader();

        // Normalize city name
        const cityCode = userProvidedCity ? loader.normalizeCity(userProvidedCity) : null;

        // Special handling for Bengaluru (has 5 corporations)
        if (cityCode === 'bengaluru' || this.isProbablyBengaluru(lat, lng, userProvidedCity)) {
            return await this.validateBengaluruLocation(lat, lng);
        }

        // For other cities
        if (cityCode) {
            return await this.validateCityLocation(lat, lng, cityCode);
        }

        // Try to detect city from coordinates (expensive - tries all cities)
        return await this.detectCityFromCoordinates(lat, lng);
    }

    /**
     * Check if location is probably in Bengaluru (quick bounding box check)
     */
    isProbablyBengaluru(lat, lng, userProvidedCity) {
        // Rough bounding box for Greater Bengaluru
        const bbox = {
            minLat: 12.7342,
            maxLat: 13.1736,
            minLng: 77.3766,
            maxLng: 77.8826
        };

        const inBox = lat >= bbox.minLat && lat <= bbox.maxLat &&
                      lng >= bbox.minLng && lng <= bbox.maxLng;

        const cityMatch = userProvidedCity?.toLowerCase().includes('bengaluru') ||
                         userProvidedCity?.toLowerCase().includes('bangalore');

        return inBox || cityMatch;
    }

    /**
     * Validate Bengaluru location with corporation detection
     */
    async validateBengaluruLocation(lat, lng) {
        const loader = this.getBoundaryLoader();

        try {
            // Load Bengaluru ward boundaries
            const boundaryData = await loader.loadBoundary('bengaluru');

            // Find which ward this location is in
            const ward = loader.findWard('bengaluru', lat, lng);

            if (!ward) {
                return {
                    valid: false,
                    error: 'location_outside_bengaluru',
                    message: 'This location is outside Bengaluru municipal boundaries. Please verify the address.',
                    suggested_action: 'try_different_address',
                    coordinates: { latitude: lat, longitude: lng }
                };
            }

            // Determine corporation from ward properties
            const corporation = this.getBengaluruCorporationFromWard(ward);

            return {
                valid: true,
                city: 'Bengaluru',
                corporation_code: corporation.code,
                corporation_id: corporation.id,
                corporation_name: corporation.name,
                ward: ward.wardName,
                wardNumber: ward.wardNumber,
                coordinates: { latitude: lat, longitude: lng },
                metadata: {
                    auto_tagged: true,
                    boundary_match: true,
                    tagged_at: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Bengaluru validation error:', error);

            return {
                valid: false,
                error: 'boundary_loading_failed',
                message: 'Unable to load boundary data. Please try again or select your corporation manually.',
                details: error.message
            };
        }
    }

    /**
     * Determine Bengaluru corporation from ward information
     */
    getBengaluruCorporationFromWard(ward) {
        // Check ward properties for corporation info
        const props = ward.properties || {};

        // Try to extract corporation from properties
        const corpCode = props.corporation || props.zone || props.area;

        if (corpCode) {
            return this.mapBengaluruCorporation(corpCode);
        }

        // Fallback: derive from ward number (simplified logic)
        // In production, use actual ward-to-corporation mapping from database
        const wardNum = parseInt(ward.wardNumber) || 0;

        if (wardNum >= 1 && wardNum <= 74) {
            return { code: 'north', id: null, name: 'Bengaluru North Corporation' };
        } else if (wardNum >= 75 && wardNum <= 148) {
            return { code: 'south', id: null, name: 'Bengaluru South Corporation' };
        } else if (wardNum >= 149 && wardNum <= 222) {
            return { code: 'east', id: null, name: 'Bengaluru East Corporation' };
        } else if (wardNum >= 223 && wardNum <= 296) {
            return { code: 'west', id: null, name: 'Bengaluru West Corporation' };
        } else {
            return { code: 'central', id: null, name: 'Bengaluru Central Corporation' };
        }
    }

    /**
     * Map corporation code to full info
     */
    mapBengaluruCorporation(code) {
        const corporations = {
            'north': { code: 'north', id: null, name: 'Bengaluru North Corporation' },
            'south': { code: 'south', id: null, name: 'Bengaluru South Corporation' },
            'east': { code: 'east', id: null, name: 'Bengaluru East Corporation' },
            'west': { code: 'west', id: null, name: 'Bengaluru West Corporation' },
            'central': { code: 'central', id: null, name: 'Bengaluru Central Corporation' }
        };

        return corporations[code.toLowerCase()] || corporations.central;
    }

    /**
     * Validate location for other cities (11 cities besides Bengaluru)
     */
    async validateCityLocation(lat, lng, cityCode) {
        const loader = this.getBoundaryLoader();

        try {
            // Load city ward boundaries
            const boundaryData = await loader.loadBoundary(cityCode);

            // Find which ward this location is in
            const ward = loader.findWard(cityCode, lat, lng);

            if (!ward) {
                const cityInfo = loader.getCityInfo(cityCode);

                return {
                    valid: false,
                    error: 'location_outside_city',
                    message: `This location is outside ${cityInfo.name} municipal boundaries. Please verify the address.`,
                    suggested_action: 'try_different_address',
                    city: cityInfo.name,
                    coordinates: { latitude: lat, longitude: lng }
                };
            }

            const cityInfo = loader.getCityInfo(cityCode);

            return {
                valid: true,
                city: cityInfo.name,
                corporation_code: cityCode,
                corporation_id: null, // Single corporation per city
                corporation_name: `${cityInfo.name} Municipal Corporation`,
                ward: ward.wardName,
                wardNumber: ward.wardNumber,
                state: cityInfo.state,
                coordinates: { latitude: lat, longitude: lng },
                metadata: {
                    auto_tagged: true,
                    boundary_match: true,
                    tagged_at: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error(`${cityCode} validation error:`, error);

            // Fallback: accept location without strict validation
            const cityInfo = loader.getCityInfo(cityCode);

            return {
                valid: true,
                city: cityInfo.name,
                corporation_code: cityCode,
                corporation_id: null,
                corporation_name: `${cityInfo.name} Municipal Corporation`,
                ward: null,
                wardNumber: null,
                state: cityInfo.state,
                coordinates: { latitude: lat, longitude: lng },
                metadata: {
                    auto_tagged: true,
                    boundary_match: false,
                    fallback_mode: true,
                    note: 'Location accepted based on user input (boundary validation unavailable)',
                    tagged_at: new Date().toISOString()
                }
            };
        }
    }

    /**
     * Detect city from coordinates (try all cities)
     */
    async detectCityFromCoordinates(lat, lng) {
        const loader = this.getBoundaryLoader();
        const cities = loader.getSupportedCities();

        // Try each city (expensive but necessary without user input)
        for (const cityInfo of cities) {
            try {
                await loader.loadBoundary(cityInfo.code);
                const ward = loader.findWard(cityInfo.code, lat, lng);

                if (ward) {
                    // Found the city!
                    if (cityInfo.code === 'bengaluru') {
                        return await this.validateBengaluruLocation(lat, lng);
                    } else {
                        return await this.validateCityLocation(lat, lng, cityInfo.code);
                    }
                }
            } catch (error) {
                // Skip this city and try next
                continue;
            }
        }

        // Location not in any supported city
        return {
            valid: false,
            error: 'location_outside_all_boundaries',
            message: this.getOutOfBoundsMessage(),
            suggested_action: 'view_coverage_map',
            coordinates: { latitude: lat, longitude: lng },
            nearest_city: await this.findNearestCity(lat, lng)
        };
    }

    /**
     * Get message for locations outside all boundaries
     */
    getOutOfBoundsMessage() {
        return `⚠️ This location is outside our service areas.

We currently support complaints from 12 cities:
• Bengaluru (5 corporations)
• Ahmedabad, Bhubaneswar, Chennai, Gurugram, Hyderabad
• Jaipur, Kolkata, Mumbai, Pune, Thane, Visakhapatnam

Please verify the address is within one of these cities.`;
    }

    /**
     * Find nearest supported city
     */
    async findNearestCity(lat, lng) {
        const cityCenters = {
            'Bengaluru': { lat: 12.9716, lng: 77.5946 },
            'Mumbai': { lat: 19.0760, lng: 72.8777 },
            'Chennai': { lat: 13.0827, lng: 80.2707 },
            'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
            'Hyderabad': { lat: 17.3850, lng: 78.4867 },
            'Kolkata': { lat: 22.5726, lng: 88.3639 },
            'Pune': { lat: 18.5204, lng: 73.8567 },
            'Jaipur': { lat: 26.9124, lng: 75.7873 },
            'Gurugram': { lat: 28.4595, lng: 77.0266 },
            'Thane': { lat: 19.2183, lng: 72.9781 },
            'Bhubaneswar': { lat: 20.2961, lng: 85.8245 },
            'Visakhapatnam': { lat: 17.6869, lng: 83.2185 }
        };

        let nearest = null;
        let minDistance = Infinity;

        for (const [cityName, coords] of Object.entries(cityCenters)) {
            const distance = this.calculateDistance(lat, lng, coords.lat, coords.lng);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = { name: cityName, distance: Math.round(distance) };
            }
        }

        return nearest;
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.getBoundaryLoader().getCacheStats();
    }

    /**
     * Clear cached boundaries (memory management)
     */
    clearCache() {
        if (this.boundaryLoader) {
            this.boundaryLoader.clearCache();
        }
    }
}
