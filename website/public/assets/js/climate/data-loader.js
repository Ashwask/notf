/**
 * Climate Data Loader
 * Handles loading and caching of ward climate data
 *
 * 3-Tier Loading Strategy:
 * 1. City Summary (10 KB) - Loaded on sector pages
 * 2. Ward Index (96 KB) - Loaded for ward selector
 * 3. Corporation Data (600 KB each) - Lazy loaded when needed
 */

class ClimateDataLoader {
    constructor(city = 'bengaluru') {
        this.city = city;
        this.baseUrl = `/assets/data/climate/${city}`;
        this.cache = new Map();
        this.loading = new Map();
    }

    /**
     * Load city-level summary data
     * @returns {Promise<Object>} City summary with aggregates and rankings
     */
    async loadCitySummary() {
        const cacheKey = `${this.city}_city_summary`;

        // Check cache
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Check sessionStorage
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                this.cache.set(cacheKey, data);
                return data;
            } catch (e) {
                console.warn('Failed to parse cached city summary:', e);
            }
        }

        // Fetch from server
        try {
            const response = await fetch(`${this.baseUrl}/city_climate.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Cache in memory and sessionStorage
            this.cache.set(cacheKey, data);
            sessionStorage.setItem(cacheKey, JSON.stringify(data));

            return data;
        } catch (error) {
            console.error('Failed to load city summary:', error);
            throw error;
        }
    }

    /**
     * Load ward index (metadata for all wards)
     * @returns {Promise<Object>} Ward index with basic metadata
     */
    async loadWardIndex() {
        const cacheKey = `${this.city}_ward_index`;

        // Check cache
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Check sessionStorage
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                this.cache.set(cacheKey, data);
                return data;
            } catch (e) {
                console.warn('Failed to parse cached ward index:', e);
            }
        }

        // Fetch from server
        try {
            const response = await fetch(`${this.baseUrl}/ward_index.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Cache in memory and sessionStorage
            this.cache.set(cacheKey, data);
            sessionStorage.setItem(cacheKey, JSON.stringify(data));

            return data;
        } catch (error) {
            console.error('Failed to load ward index:', error);
            throw error;
        }
    }

    /**
     * Load corporation/zone data (lazy loaded)
     * @param {string} corporation - Corporation/zone name (e.g., Central, East, northern, eastern)
     * @returns {Promise<Object>} Corporation/zone data with full ward details
     */
    async loadCorporationData(corporation) {
        const corpLower = corporation.toLowerCase();
        const cacheKey = `${this.city}_corp_${corpLower}`;

        // Check cache
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Check if already loading (prevent duplicate requests)
        if (this.loading.has(cacheKey)) {
            return this.loading.get(cacheKey);
        }

        // Check sessionStorage
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                this.cache.set(cacheKey, data);
                return data;
            } catch (e) {
                console.warn(`Failed to parse cached ${corporation} data:`, e);
            }
        }

        // Fetch from server
        const loadPromise = (async () => {
            try {
                const response = await fetch(`${this.baseUrl}/climate_${corpLower}.json`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                // Cache in memory and sessionStorage
                this.cache.set(cacheKey, data);
                sessionStorage.setItem(cacheKey, JSON.stringify(data));

                return data;
            } catch (error) {
                console.error(`Failed to load ${corporation} data:`, error);
                throw error;
            } finally {
                this.loading.delete(cacheKey);
            }
        })();

        this.loading.set(cacheKey, loadPromise);
        return loadPromise;
    }

    /**
     * Get ward data by slug
     * @param {string} wardSlug - Ward URL slug
     * @returns {Promise<Object>} Ward data
     */
    async getWardBySlug(wardSlug) {
        // Load ward index to find corporation
        const wardIndex = await this.loadWardIndex();
        const ward = wardIndex.wards.find(w => w.slug === wardSlug);

        if (!ward) {
            throw new Error(`Ward not found: ${wardSlug}`);
        }

        // Load corporation data
        const corpData = await this.loadCorporationData(ward.corporation);

        // Find full ward data
        const fullWard = corpData.wards.find(w => w.slug === wardSlug);

        if (!fullWard) {
            throw new Error(`Ward data not found: ${wardSlug}`);
        }

        return fullWard;
    }

    /**
     * Search wards by name (fuzzy matching)
     * @param {string} query - Search query
     * @param {string} [corporation] - Optional corporation filter
     * @returns {Promise<Array>} Matching wards
     */
    async searchWards(query, corporation = null) {
        const wardIndex = await this.loadWardIndex();
        let wards = wardIndex.wards;

        // Filter by corporation
        if (corporation) {
            wards = wards.filter(w => w.corporation === corporation);
        }

        // If no query, return all (filtered) wards
        if (!query || query.trim() === '') {
            return wards;
        }

        // Use Fuse.js for fuzzy search if available
        if (typeof Fuse !== 'undefined') {
            const fuse = new Fuse(wards, {
                keys: ['name', 'name_local'],
                threshold: 0.4,
                minMatchCharLength: 2
            });

            const results = fuse.search(query);
            return results.map(r => r.item);
        }

        // Fallback: simple substring matching
        const lowerQuery = query.toLowerCase();
        return wards.filter(w =>
            w.name.toLowerCase().includes(lowerQuery) ||
            w.name_local.includes(query)
        );
    }

    /**
     * Get sector data for specific metric
     * @param {string} sector - Sector key (e.g., 'energy_buildings')
     * @param {string} metric - Metric key (e.g., 'clean_cooking')
     * @returns {Promise<Object>} Sector metric data with city stats
     */
    async getSectorMetric(sector, metric) {
        const citySummary = await this.loadCitySummary();
        const sectorData = citySummary.sectors[sector];

        if (!sectorData || !sectorData[metric]) {
            return null;
        }

        return sectorData[metric];
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.cache.clear();
        // Clear city-specific session storage
        const prefix = `${this.city}_`;
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key.startsWith(prefix) || key === 'city_summary' || key === 'ward_index' || key.startsWith('corp_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
    }
}

// Export as global
window.ClimateDataLoader = ClimateDataLoader;

// Create global instance
window.climateData = new ClimateDataLoader();
