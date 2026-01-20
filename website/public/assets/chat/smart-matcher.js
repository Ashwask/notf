/**
 * Smart Matcher - Unified Matching Algorithm
 *
 * Multi-component scoring system used across:
 * - Discovery Engine (search for communities/providers)
 * - Ask/Offer Matcher (match community needs with provider offerings)
 *
 * Combines 5 scoring components:
 * 1. Tag Matching (exact category matches)
 * 2. Keyword Matching (extracted keywords with overlap)
 * 3. City Matching (fuzzy/semantic matching)
 * 4. Theme Matching (exact theme matches)
 * 5. Semantic Text Similarity (Transformers.js embeddings)
 */

class SmartMatcher {
    constructor(config = {}) {
        // Default configuration
        this.config = {
            weights: {
                tags: 40,          // Tag matching importance (%)
                keywords: 30,      // Keyword matching importance (%)
                city: 15,          // City matching importance (%)
                theme: 15,         // Theme matching importance (%)
                semantic: 25,      // Semantic text similarity (%)
                proximity: 30      // Geographical proximity (NEW - when location mentioned)
            },
            cityMatchMode: 'fuse',        // 'exact' | 'fuse' | 'semantic' | 'normalized'
            semanticThreshold: 0.4,       // Minimum semantic similarity (0-1)
            minMatchScore: 0.3,           // Minimum overall match score to return
            proximityEnabled: true,       // Enable geographical proximity scoring
            maxDistanceKm: 50,            // Maximum distance to consider (km)
            ...config
        };

        // Normalize weights to 0-1 range
        this.normalizedWeights = {};
        const totalWeight = Object.values(this.config.weights).reduce((a, b) => a + b, 0);
        Object.keys(this.config.weights).forEach(key => {
            this.normalizedWeights[key] = this.config.weights[key] / Math.max(100, totalWeight);
        });

        console.log('[SmartMatcher] Initialized with config:', this.config);
        console.log('[SmartMatcher] Normalized weights:', this.normalizedWeights);

        // City coordinate lookup (major Indian cities)
        this.cityCoordinates = {
            'bengaluru': { lat: 12.9716, lon: 77.5946 },
            'bangalore': { lat: 12.9716, lon: 77.5946 },
            'mumbai': { lat: 19.0760, lon: 72.8777 },
            'bombay': { lat: 19.0760, lon: 72.8777 },
            'delhi': { lat: 28.6139, lon: 77.2090 },
            'new delhi': { lat: 28.6139, lon: 77.2090 },
            'kolkata': { lat: 22.5726, lon: 88.3639 },
            'calcutta': { lat: 22.5726, lon: 88.3639 },
            'chennai': { lat: 13.0827, lon: 80.2707 },
            'madras': { lat: 13.0827, lon: 80.2707 },
            'hyderabad': { lat: 17.3850, lon: 78.4867 },
            'pune': { lat: 18.5204, lon: 73.8567 },
            'ahmedabad': { lat: 23.0225, lon: 72.5714 },
            'jaipur': { lat: 26.9124, lon: 75.7873 },
            'kochi': { lat: 9.9312, lon: 76.2673 },
            'cochin': { lat: 9.9312, lon: 76.2673 },
            'thiruvananthapuram': { lat: 8.5241, lon: 76.9366 },
            'trivandrum': { lat: 8.5241, lon: 76.9366 },
            // Bengaluru neighborhoods
            'malleswaram': { lat: 13.0067, lon: 77.5703 },
            'malleshwaram': { lat: 13.0067, lon: 77.5703 },
            'indiranagar': { lat: 12.9719, lon: 77.6412 },
            'koramangala': { lat: 12.9352, lon: 77.6245 },
            'whitefield': { lat: 12.9698, lon: 77.7500 },
            'jayanagar': { lat: 12.9250, lon: 77.5838 },
            'rajajinagar': { lat: 12.9897, lon: 77.5551 },
            'btm layout': { lat: 12.9166, lon: 77.6101 },
            'hsr layout': { lat: 12.9082, lon: 77.6476 },
            'electronic city': { lat: 12.8399, lon: 77.6770 },
            'yelahanka': { lat: 13.1007, lon: 77.5963 },
            'jp nagar': { lat: 12.9078, lon: 77.5851 }
        };
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * @param {number} lat1 - Latitude of first point
     * @param {number} lon1 - Longitude of first point
     * @param {number} lat2 - Latitude of second point
     * @param {number} lon2 - Longitude of second point
     * @returns {number} - Distance in kilometers
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Extract coordinates from location string or city name
     * @param {string} location - Location string
     * @param {number} lat - Optional explicit latitude
     * @param {number} lon - Optional explicit longitude
     * @returns {Object|null} - { lat, lon } or null
     */
    extractCoordinates(location, lat = null, lon = null) {
        // If explicit coordinates provided
        if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
            return { lat: parseFloat(lat), lon: parseFloat(lon) };
        }

        // Try to extract from location string
        if (!location) return null;

        const locationLower = location.toLowerCase().trim();

        // Check city coordinates lookup
        if (this.cityCoordinates[locationLower]) {
            return this.cityCoordinates[locationLower];
        }

        // Check if location contains a known city/neighborhood
        for (const [name, coords] of Object.entries(this.cityCoordinates)) {
            if (locationLower.includes(name)) {
                return coords;
            }
        }

        return null;
    }

    /**
     * Calculate proximity score based on distance
     * @param {number} distanceKm - Distance in kilometers
     * @returns {number} - Proximity score (0-1)
     */
    calculateProximityScore(distanceKm) {
        if (distanceKm === null || distanceKm === undefined) return 0;

        const maxDistance = this.config.maxDistanceKm;

        // Exponential decay: closer = higher score
        // 0km = 1.0, 10km = 0.7, 25km = 0.4, 50km = 0.1
        if (distanceKm <= 0) return 1.0;
        if (distanceKm >= maxDistance) return 0;

        // Exponential decay formula
        const score = Math.exp(-distanceKm / (maxDistance / 3));
        return Math.max(0, Math.min(1, score));
    }

    /**
     * Extract tags (categories) from text
     * @param {string} text - The text to analyze
     * @returns {Array<string>} - Extracted tags
     */
    extractTags(text) {
        const tags = [];
        const lower = text.toLowerCase();

        const categories = {
            funding: ['funding', 'fund', 'money', 'financial', 'grant', 'investment', 'donate'],
            volunteers: ['volunteer', 'volunteers', 'help', 'support', 'manpower', 'people'],
            space: ['space', 'venue', 'room', 'hall', 'office', 'land', 'building'],
            expertise: ['expertise', 'expert', 'knowledge', 'training', 'skill', 'mentor', 'guidance', 'consulting'],
            equipment: ['equipment', 'tool', 'machine', 'device', 'hardware', 'material'],
            network: ['network', 'connection', 'connect', 'partnership', 'collaboration', 'contact']
        };

        Object.keys(categories).forEach(category => {
            if (categories[category].some(keyword => lower.includes(keyword))) {
                tags.push(category);
            }
        });

        // Domain-specific tags
        if (lower.match(/waste|compost|recycle|garbage|swm/)) tags.push('waste-management');
        if (lower.match(/solar|renewable|energy/)) tags.push('energy');
        if (lower.match(/water|rain/)) tags.push('water');
        if (lower.match(/education|school|learn|teach/)) tags.push('education');
        if (lower.match(/health|medical|clinic/)) tags.push('health');
        if (lower.match(/women|girl/)) tags.push('women');
        if (lower.match(/child|youth|student/)) tags.push('youth');
        if (lower.match(/environment|green|sustainable|eco/)) tags.push('environment');
        if (lower.match(/transport|mobility|bus|metro/)) tags.push('transport');
        if (lower.match(/safety|security|crime/)) tags.push('safety');

        return [...new Set(tags)];
    }

    /**
     * Extract keywords from text (filter stopwords)
     * @param {string} text - The text to analyze
     * @returns {Array<string>} - Extracted keywords
     */
    extractKeywords(text) {
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                          'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were',
                          'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
                          'will', 'would', 'should', 'could', 'may', 'might', 'can',
                          'need', 'want', 'looking', 'search', 'find'];

        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopWords.includes(w));

        return [...new Set(words)];
    }

    /**
     * Extract city from location string
     * @param {string} location - Location string (e.g., "Malleswaram, Bengaluru, Karnataka")
     * @returns {string} - Extracted city
     */
    extractCity(location) {
        if (!location) return '';
        const parts = location.split(',').map(p => p.trim());

        // If there are multiple parts, the city is usually the second-to-last or last
        if (parts.length > 1) {
            // Check if last part is a state (common Indian states)
            const states = ['karnataka', 'maharashtra', 'tamil nadu', 'kerala', 'delhi',
                           'west bengal', 'gujarat', 'andhra pradesh', 'telangana'];
            const lastPart = parts[parts.length - 1].toLowerCase();
            if (states.some(state => lastPart.includes(state))) {
                // City is second-to-last
                return parts[parts.length - 2];
            }
        }

        // Otherwise, return last part
        return parts[parts.length - 1];
    }

    /**
     * Normalize common city name variations
     * @param {string} cityName - City name to normalize
     * @returns {string} - Normalized city name
     */
    normalizeCity(cityName) {
        const normalized = {
            'bengaluru': 'bengaluru',
            'bangalore': 'bengaluru',
            'mumbai': 'mumbai',
            'bombay': 'mumbai',
            'kolkata': 'kolkata',
            'calcutta': 'kolkata',
            'chennai': 'chennai',
            'madras': 'chennai',
            'thiruvananthapuram': 'thiruvananthapuram',
            'trivandrum': 'thiruvananthapuram',
            'kochi': 'kochi',
            'cochin': 'kochi',
            'delhi': 'delhi',
            'new delhi': 'delhi',
            'hyderabad': 'hyderabad',
            'pune': 'pune',
            'poona': 'pune'
        };

        const lower = cityName.toLowerCase().trim();
        return normalized[lower] || lower;
    }

    /**
     * Calculate city similarity score
     * @param {string} city1 - First city name
     * @param {string} city2 - Second city name
     * @returns {Promise<number>} - Similarity score (0-1)
     */
    async calculateCityScore(city1, city2) {
        if (!city1 || !city2) return 0;

        const mode = this.config.cityMatchMode;

        // Exact match
        if (mode === 'exact') {
            return city1.toLowerCase() === city2.toLowerCase() ? 1 : 0;
        }

        // Normalized match (using hardcoded map)
        if (mode === 'normalized') {
            return this.normalizeCity(city1) === this.normalizeCity(city2) ? 1 : 0;
        }

        // Fuzzy match using Fuse.js
        if (mode === 'fuse') {
            // Shortcut for exact match
            if (city1.toLowerCase() === city2.toLowerCase()) return 1;

            // Try normalized first
            if (this.normalizeCity(city1) === this.normalizeCity(city2)) return 0.95;

            // Use Fuse.js for fuzzy matching
            if (typeof Fuse !== 'undefined') {
                const fuse = new Fuse([city2], {
                    threshold: 0.3,  // Stricter for city matching
                    ignoreLocation: true
                });
                const results = fuse.search(city1);
                if (results.length > 0) {
                    // Fuse returns score where 0 = perfect match, 1 = no match
                    // Convert to similarity: 1 - score
                    return 1 - results[0].score;
                }
            }
            return 0;
        }

        // Semantic match using Transformers.js
        if (mode === 'semantic') {
            // Shortcut for exact match
            if (city1.toLowerCase() === city2.toLowerCase()) return 1;

            // Use semantic matcher if available
            if (window.semanticMatcher && window.semanticMatcher.isReady) {
                try {
                    const embedding1 = await window.semanticMatcher.embed(city1);
                    const embedding2 = await window.semanticMatcher.embed(city2);
                    if (embedding1 && embedding2) {
                        const similarity = window.semanticMatcher.cosineSimilarity(embedding1, embedding2);
                        return similarity > 0.7 ? similarity : 0; // Only count if >70% similar
                    }
                } catch (e) {
                    console.warn('[SmartMatcher] City semantic matching failed:', e);
                    return 0;
                }
            }
        }

        return 0;
    }

    /**
     * Calculate match score between two items (query vs resource, ask vs offer, etc.)
     * @param {Object} item1 - First item with { text, tags, keywords, city, theme, embedding }
     * @param {Object} item2 - Second item with same structure
     * @returns {Promise<Object>} - Match result with score and details
     */
    async calculateMatchScore(item1, item2) {
        const details = {
            tags: 0,
            keywords: 0,
            city: 0,
            theme: 0,
            semantic: 0,
            proximity: 0,         // NEW: Geographical proximity
            rawSemantic: 0,       // Store raw semantic similarity before threshold
            distance: null        // Store actual distance in km
        };

        const weights = this.normalizedWeights;

        // Prepare items if tags/keywords not already extracted
        const prepared1 = this.prepareItem(item1);
        const prepared2 = this.prepareItem(item2);

        // Track matched items for display
        const matchedTags = prepared1.tags.filter(t => prepared2.tags.includes(t));
        const matchedKeywords = prepared1.keywords.filter(k => prepared2.keywords.includes(k));

        // 1. TAG MATCHING (exact)
        if (matchedTags.length > 0) {
            details.tags = weights.tags;
        }

        // 2. KEYWORD MATCHING (exact, filtered)
        const keywordScore = Math.min(matchedKeywords.length * 0.1, weights.keywords);
        details.keywords = keywordScore;

        // 3. CITY MATCHING (configurable mode)
        const cityScore = await this.calculateCityScore(prepared1.city, prepared2.city);
        details.city = cityScore * weights.city;

        // 4. THEME MATCHING (exact or contains)
        if (prepared1.theme && prepared2.theme) {
            const theme1 = prepared1.theme.toLowerCase();
            const theme2 = prepared2.theme.toLowerCase();

            // Exact match or one contains the other
            if (theme1 === theme2 || theme1.includes(theme2) || theme2.includes(theme1)) {
                details.theme = weights.theme;
            }
        }

        // 5. GEOGRAPHICAL PROXIMITY (NEW - only if both have coordinates)
        if (this.config.proximityEnabled) {
            const coords1 = this.extractCoordinates(
                prepared1.location || prepared1.city || prepared1.neighborhood,
                prepared1.lat,
                prepared1.lon
            );
            const coords2 = this.extractCoordinates(
                prepared2.location || prepared2.city || prepared2.neighborhood,
                prepared2.lat,
                prepared2.lon
            );

            if (coords1 && coords2) {
                const distance = this.calculateDistance(coords1.lat, coords1.lon, coords2.lat, coords2.lon);
                details.distance = distance;
                const proximityScore = this.calculateProximityScore(distance);
                details.proximity = proximityScore * weights.proximity;

                console.log(`[SmartMatcher] Proximity: ${prepared1.name || 'item1'} to ${prepared2.name || 'item2'} = ${distance.toFixed(2)}km (score: ${proximityScore.toFixed(3)})`);
            }
        }

        // 6. SEMANTIC TEXT SIMILARITY (Transformers.js or Fuse.js fallback)
        const semanticReady = window.semanticMatcher && window.semanticMatcher.isReady;

        if (semanticReady && prepared1.embedding && prepared2.embedding) {
            const similarity = window.semanticMatcher.cosineSimilarity(prepared1.embedding, prepared2.embedding);
            details.rawSemantic = similarity;

            // Apply threshold filter
            if (similarity >= this.config.semanticThreshold) {
                details.semantic = similarity * weights.semantic;
            } else {
                details.semantic = 0; // Below threshold
            }
        } else if (!semanticReady && prepared1.text && prepared2.text) {
            // Fallback: Use Fuse.js for text similarity if semantic not available
            if (typeof Fuse !== 'undefined') {
                const fuse = new Fuse([{ text: prepared2.text }], {
                    keys: ['text'],
                    threshold: 0.5,
                    includeScore: true
                });
                const results = fuse.search(prepared1.text);
                if (results.length > 0) {
                    const textSimilarity = 1 - results[0].score;
                    details.rawSemantic = textSimilarity;
                    if (textSimilarity >= this.config.semanticThreshold) {
                        details.semantic = textSimilarity * weights.semantic;
                    }
                }
            }
        }

        // Calculate total score (including proximity)
        let score = details.tags + details.keywords + details.city + details.theme + details.semantic + details.proximity;

        // Normalize score to 0-1 range (already done with normalized weights)
        score = Math.min(score, 1); // Cap at 100%

        return {
            score,
            details,
            matchedTags,
            matchedKeywords,
            confidenceLevel: this.getConfidenceLevel(score)
        };
    }

    /**
     * Prepare item for matching (extract tags, keywords, city if not already done)
     * @param {Object} item - Item to prepare
     * @returns {Object} - Prepared item with tags, keywords, city extracted
     */
    prepareItem(item) {
        const prepared = { ...item };

        // Extract text representation if not provided
        if (!prepared.text) {
            const parts = [];
            if (prepared.name) parts.push(prepared.name);
            if (prepared.description) parts.push(prepared.description);
            if (prepared.themes) parts.push(...(Array.isArray(prepared.themes) ? prepared.themes : [prepared.themes]));
            if (prepared.focus_areas) parts.push(...(Array.isArray(prepared.focus_areas) ? prepared.focus_areas : [prepared.focus_areas]));
            if (prepared.asks) parts.push(...(Array.isArray(prepared.asks) ? prepared.asks : [prepared.asks]));
            if (prepared.offers) parts.push(...(Array.isArray(prepared.offers) ? prepared.offers : [prepared.offers]));
            prepared.text = parts.filter(Boolean).join(' ');
        }

        // Extract tags if not already present
        if (!prepared.tags || prepared.tags.length === 0) {
            prepared.tags = this.extractTags(prepared.text);
        }

        // Extract keywords if not already present
        if (!prepared.keywords || prepared.keywords.length === 0) {
            prepared.keywords = this.extractKeywords(prepared.text);
        }

        // Extract city if not already present
        if (!prepared.city && prepared.location) {
            prepared.city = this.extractCity(prepared.location);
        }

        // Normalize city
        if (prepared.city) {
            prepared.city = prepared.city.trim();
        }

        // Handle theme (could be array or string)
        if (Array.isArray(prepared.theme)) {
            prepared.theme = prepared.theme.join(', ');
        } else if (prepared.themes && Array.isArray(prepared.themes)) {
            prepared.theme = prepared.themes.join(', ');
        }

        return prepared;
    }

    /**
     * Get confidence level from score
     * @param {number} score - Match score (0-1)
     * @returns {string} - Confidence level ('excellent' | 'good' | 'potential' | 'low')
     */
    getConfidenceLevel(score) {
        if (score >= 0.85) return 'excellent';
        if (score >= 0.70) return 'good';
        if (score >= 0.50) return 'potential';
        return 'low';
    }

    /**
     * Search for matches against a query
     * @param {string|Object} query - Search query (string or object with text)
     * @param {Array<Object>} resources - Array of resources to search
     * @param {Object} options - Search options { limit: 10, minScore: 0.3 }
     * @returns {Promise<Array<Object>>} - Sorted array of matches with scores
     */
    async search(query, resources, options = {}) {
        const { limit = 10, minScore = this.config.minMatchScore } = options;

        // Prepare query item
        const queryItem = typeof query === 'string'
            ? { text: query }
            : query;

        const preparedQuery = this.prepareItem(queryItem);

        // Precompute embeddings if semantic matcher available
        if (window.semanticMatcher && window.semanticMatcher.isReady && !preparedQuery.embedding) {
            preparedQuery.embedding = await window.semanticMatcher.embed(preparedQuery.text);
        }

        // Calculate scores for all resources
        const matches = [];

        for (const resource of resources) {
            // Prepare resource
            const preparedResource = this.prepareItem(resource);

            // Precompute embedding if needed
            if (window.semanticMatcher && window.semanticMatcher.isReady && !preparedResource.embedding) {
                preparedResource.embedding = await window.semanticMatcher.embed(preparedResource.text);
            }

            // Calculate match score
            const result = await this.calculateMatchScore(preparedQuery, preparedResource);

            // Only include if above minimum score
            if (result.score >= minScore) {
                matches.push({
                    ...resource,
                    matchScore: result.score,
                    matchDetails: result.details,
                    matchedTags: result.matchedTags,
                    matchedKeywords: result.matchedKeywords,
                    confidenceLevel: result.confidenceLevel
                });
            }
        }

        // Sort by score (highest first) and limit
        return matches
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, limit);
    }

    /**
     * Batch search with pre-computed embeddings (faster for multiple queries)
     * @param {string|Object} query - Search query
     * @param {Array<Object>} resources - Array of resources (must have embeddings precomputed)
     * @param {Object} options - Search options
     * @returns {Promise<Array<Object>>} - Sorted matches
     */
    async batchSearch(query, resources, options = {}) {
        // Same as search() but assumes resources already have embeddings
        // Useful when searching multiple times against the same dataset
        return this.search(query, resources, options);
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.SmartMatcher = SmartMatcher;
}
