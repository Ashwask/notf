/**
 * Boundary Loader
 * Dynamically loads ward boundaries for 12 cities
 * Uses lazy loading to avoid loading all boundaries at once
 */

class BoundaryLoader {
    constructor() {
        this.cache = new Map();
        this.loading = new Map();
        this.baseUrl = '/assets/data/boundaries';

        // City configuration
        this.cities = {
            'ahmedabad': { name: 'Ahmedabad', state: 'Gujarat', wards: 48 },
            'bengaluru': { name: 'Bengaluru', state: 'Karnataka', wards: 369 },
            'bhubaneswar': { name: 'Bhubaneswar', state: 'Odisha', wards: 67 },
            'chennai': { name: 'Chennai', state: 'Tamil Nadu', wards: 200 },
            'gurugram': { name: 'Gurugram', state: 'Haryana', wards: 35 },
            'hyderabad': { name: 'Hyderabad', state: 'Telangana', wards: 145 },
            'jaipur': { name: 'Jaipur', state: 'Rajasthan', wards: 150 },
            'kolkata': { name: 'Kolkata', state: 'West Bengal', wards: 141 },
            'mumbai': { name: 'Mumbai', state: 'Maharashtra', wards: 24 },
            'pune': { name: 'Pune', state: 'Maharashtra', wards: 58 },
            'thane': { name: 'Thane', state: 'Maharashtra', wards: 47 },
            'visakhapatnam': { name: 'Visakhapatnam', state: 'Andhra Pradesh', wards: 98 }
        };

        // City name aliases for better matching
        this.aliases = {
            'bangalore': 'bengaluru',
            'bombay': 'mumbai',
            'calcutta': 'kolkata',
            'vizag': 'visakhapatnam',
            'bbsr': 'bhubaneswar',
            'gurgaon': 'gurugram'
        };
    }

    /**
     * Normalize city name to standard format
     */
    normalizeCity(cityName) {
        if (!cityName) return null;

        const normalized = cityName.toLowerCase().trim();

        // Check aliases first
        if (this.aliases[normalized]) {
            return this.aliases[normalized];
        }

        // Check if it's a valid city code
        if (this.cities[normalized]) {
            return normalized;
        }

        // Try to find partial match
        for (const [code, info] of Object.entries(this.cities)) {
            if (info.name.toLowerCase() === normalized) {
                return code;
            }
        }

        return null;
    }

    /**
     * Get city information
     */
    getCityInfo(cityName) {
        const cityCode = this.normalizeCity(cityName);
        if (!cityCode) return null;

        return {
            code: cityCode,
            ...this.cities[cityCode]
        };
    }

    /**
     * Load boundary data for a city
     */
    async loadBoundary(cityName) {
        const cityCode = this.normalizeCity(cityName);

        if (!cityCode) {
            throw new Error(`Unknown city: ${cityName}`);
        }

        // Return cached data if available
        if (this.cache.has(cityCode)) {
            return this.cache.get(cityCode);
        }

        // Return existing promise if already loading
        if (this.loading.has(cityCode)) {
            return this.loading.get(cityCode);
        }

        // Start loading
        const loadPromise = this._fetchBoundary(cityCode);
        this.loading.set(cityCode, loadPromise);

        try {
            const data = await loadPromise;
            this.cache.set(cityCode, data);
            this.loading.delete(cityCode);
            return data;
        } catch (error) {
            this.loading.delete(cityCode);
            throw error;
        }
    }

    /**
     * Fetch boundary GeoJSON from server
     */
    async _fetchBoundary(cityCode) {
        const url = `${this.baseUrl}/${cityCode}-wards.geojson`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const geojson = await response.json();

            // Validate GeoJSON structure
            if (!geojson.type || !geojson.features) {
                throw new Error('Invalid GeoJSON format');
            }

            return {
                cityCode,
                cityInfo: this.cities[cityCode],
                geojson,
                loadedAt: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to load boundary for ${cityCode}: ${error.message}`);
        }
    }

    /**
     * Check if a point is inside any ward of a city
     * Returns ward information if found
     */
    findWard(cityCode, latitude, longitude) {
        if (!this.cache.has(cityCode)) {
            throw new Error(`Boundary data not loaded for ${cityCode}. Call loadBoundary() first.`);
        }

        const { geojson } = this.cache.get(cityCode);

        // Check if turf.js is available for point-in-polygon
        if (typeof turf === 'undefined') {
            console.warn('Turf.js not loaded. Point-in-polygon not available.');
            return null;
        }

        const point = turf.point([longitude, latitude]);

        // Check each ward boundary
        for (const feature of geojson.features) {
            if (feature.geometry && feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                try {
                    if (turf.booleanPointInPolygon(point, feature)) {
                        return {
                            wardName: feature.properties.name || feature.properties.Name || 'Unknown',
                            wardNumber: feature.properties.ward_no || feature.properties.wardNo || feature.properties.number,
                            cityCode,
                            coordinates: {
                                latitude,
                                longitude
                            },
                            properties: feature.properties
                        };
                    }
                } catch (error) {
                    console.error(`Error checking ward polygon:`, error);
                }
            }
        }

        return null; // Not in any ward
    }

    /**
     * Preload boundaries for multiple cities (optional optimization)
     */
    async preloadCities(cityNames) {
        const promises = cityNames.map(city => this.loadBoundary(city).catch(err => {
            console.warn(`Failed to preload ${city}:`, err.message);
            return null;
        }));

        const results = await Promise.all(promises);
        return results.filter(r => r !== null);
    }

    /**
     * Get all supported cities
     */
    getSupportedCities() {
        return Object.entries(this.cities).map(([code, info]) => ({
            code,
            ...info
        }));
    }

    /**
     * Clear cache (useful for memory management)
     */
    clearCache() {
        this.cache.clear();
        this.loading.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            cachedCities: Array.from(this.cache.keys()),
            cacheSize: this.cache.size,
            loadingCities: Array.from(this.loading.keys()),
            totalSupported: Object.keys(this.cities).length
        };
    }
}
