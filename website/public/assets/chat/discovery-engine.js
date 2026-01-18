/**
 * Discovery Engine
 * Handles community and resource discovery using Fuse.js for fuzzy search
 */

class DiscoveryEngine {
    constructor(communities, members) {
        this.communities = communities || [];
        this.members = members || [];
        this.allResources = [
            ...this.communities.map(c => ({...c, resourceType: 'community'})),
            ...this.members.map(m => ({...m, resourceType: 'provider'}))
        ];

        // Initialize Fuse.js for fuzzy search
        this.initializeFuse();
    }

    initializeFuse() {
        // Configure Fuse.js with weighted keys for better relevance
        const fuseOptions = {
            keys: [
                { name: 'name', weight: 2.0 },              // Name is most important
                { name: 'focus_areas', weight: 1.5 },       // Focus areas are very relevant
                { name: 'domains', weight: 1.5 },           // Domains (for providers)
                { name: 'location', weight: 1.0 },          // Location matching
                { name: 'city', weight: 1.0 },              // City matching
                { name: 'neighborhood', weight: 0.8 },      // Neighborhood
                { name: 'description', weight: 0.5 }        // Description (if available)
            ],
            threshold: 0.4,                 // 0 = exact match, 1 = match anything
            distance: 100,                  // How far to search in the text
            includeScore: true,             // Include match score for sorting
            minMatchCharLength: 2,          // Minimum character length to match
            shouldSort: true,               // Sort by best match
            findAllMatches: false,          // Stop at first good match per item
            ignoreLocation: true,           // Search entire string, not just beginning
            useExtendedSearch: false        // Simple fuzzy search
        };

        // Check if Fuse is available
        if (typeof Fuse === 'undefined') {
            console.error('Fuse.js not loaded. Falling back to basic search.');
            this.fuse = null;
            return;
        }

        this.fuse = new Fuse(this.allResources, fuseOptions);
    }

    search(query) {
        const queryLower = query.toLowerCase();

        // Detect if user is asking for specific resource type
        const requestedType = this.detectResourceType(queryLower);

        // Remove resource type keywords from query for better matching
        const cleanQuery = this.cleanQuery(queryLower);

        // If Fuse.js is not available, fall back to basic search
        if (!this.fuse) {
            return this.basicSearch(cleanQuery, requestedType);
        }

        // Use Fuse.js for fuzzy search
        let results = this.fuse.search(cleanQuery).map(result => ({
            ...result.item,
            matchScore: 1 - result.score  // Invert score (lower Fuse score = better match)
        }));

        // Filter by requested resource type if specified
        if (requestedType === 'community') {
            results = results.filter(r => r.resourceType === 'community');
        } else if (requestedType === 'provider') {
            results = results.filter(r => r.resourceType === 'provider');
        }

        // Return top 10 results
        return results.slice(0, 10);
    }

    // Fallback basic search if Fuse.js fails to load
    basicSearch(cleanQuery, requestedType) {
        const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 0);
        const matchScores = new Map();

        this.allResources.forEach((resource, idx) => {
            const searchText = [
                resource.name,
                resource.location,
                resource.city,
                resource.neighborhood,
                ...(resource.focus_areas || []),
                ...(resource.domains || [])
            ].filter(Boolean).join(' ').toLowerCase();

            queryWords.forEach(word => {
                if (searchText.includes(word)) {
                    matchScores.set(idx, (matchScores.get(idx) || 0) + 1);
                }
            });
        });

        let results = Array.from(matchScores.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([idx, score]) => ({
                ...this.allResources[idx],
                matchScore: score
            }));

        if (requestedType === 'community') {
            results = results.filter(r => r.resourceType === 'community');
        } else if (requestedType === 'provider') {
            results = results.filter(r => r.resourceType === 'provider');
        }

        return results.slice(0, 10);
    }

    detectResourceType(query) {
        // Keywords that indicate user wants communities
        const communityKeywords = [
            'community', 'communities', 'neighbourhood', 'neighborhood',
            'resident', 'residents', 'rwa', 'local group', 'civic group'
        ];

        // Keywords that indicate user wants providers
        const providerKeywords = [
            'provider', 'providers', 'organization', 'organizations',
            'ngo', 'ngos', 'company', 'companies', 'service', 'services',
            'solution provider', 'vendor', 'agency'
        ];

        // Check for community keywords
        if (communityKeywords.some(keyword => query.includes(keyword))) {
            return 'community';
        }

        // Check for provider keywords
        if (providerKeywords.some(keyword => query.includes(keyword))) {
            return 'provider';
        }

        // No specific type requested - search both
        return null;
    }

    cleanQuery(query) {
        // Remove resource type keywords and common words to improve matching
        const stopWords = [
            'community', 'communities', 'provider', 'providers',
            'organization', 'organizations', 'find', 'search',
            'looking for', 'show me', 'in', 'at', 'near',
            'the', 'a', 'an'
        ];

        let cleaned = query;
        stopWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            cleaned = cleaned.replace(regex, ' ');
        });

        // Clean up multiple spaces
        return cleaned.replace(/\s+/g, ' ').trim();
    }

    searchByTheme(theme) {
        return this.communities.filter(community => {
            if (!community.focus_areas) return false;
            return community.focus_areas.some(area =>
                area.toLowerCase().includes(theme.toLowerCase())
            );
        });
    }

    searchByLocation(city, neighborhood) {
        return this.communities.filter(community => {
            if (!community.location) return false;

            const location = community.location.toLowerCase();

            if (neighborhood) {
                return location.includes(neighborhood.toLowerCase()) &&
                       location.includes(city.toLowerCase());
            }

            return location.includes(city.toLowerCase());
        });
    }

    detectIntent(query) {
        const q = query.toLowerCase();

        if (q.includes('find') || q.includes('search') || q.includes('looking for')) {
            return 'find_community';
        }

        if (q.includes('need') || q.includes('offer') || q.includes('funding') ||
            q.includes('volunteer') || q.includes('space') || q.includes('help')) {
            return 'match_resource';
        }

        if (q.includes('near') || q.includes(' in ') || q.includes('around')) {
            return 'location_search';
        }

        // Theme keywords
        const themes = ['waste', 'education', 'water', 'health', 'women', 'environment',
                       'sanitation', 'tree', 'park', 'garden', 'clean'];

        if (themes.some(theme => q.includes(theme))) {
            return 'theme_search';
        }

        return 'general_search';
    }
}
