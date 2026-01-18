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
                { name: 'name', weight: 2.0 },                           // Name is most important
                { name: 'themes', weight: 1.5 },                         // Themes for communities
                { name: 'focus_areas', weight: 1.5 },                    // Focus areas (legacy/providers)
                { name: 'domains', weight: 1.5 },                        // Domains (for providers)
                { name: 'asks', weight: 1.3 },                           // What communities need
                { name: 'offers', weight: 1.3 },                         // What communities offer
                { name: 'infrastructure_offers', weight: 1.2 },          // Infrastructure available
                { name: 'neighborhood', weight: 1.2 },                   // Neighborhood (boosted)
                { name: 'city', weight: 1.0 },                           // City matching
                { name: 'location', weight: 1.0 },                       // Combined location (if available)
                { name: 'metadata.searchable_content', weight: 0.8 },    // Markdown content keywords
                { name: 'state', weight: 0.7 },                          // State
                { name: 'description', weight: 0.5 }                     // Description (if available)
            ],
            threshold: 0.5,                 // 0 = exact match, 1 = match anything (relaxed)
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

        console.log('[Discovery] Search query:', query);
        console.log('[Discovery] Total resources:', this.allResources.length);
        console.log('[Discovery] Communities:', this.communities.length);
        console.log('[Discovery] Providers:', this.members.length);

        // Detect if user is asking for specific resource type
        const requestedType = this.detectResourceType(queryLower);
        console.log('[Discovery] Requested type:', requestedType);

        // Remove resource type keywords from query for better matching
        const cleanQuery = this.cleanQuery(queryLower);
        console.log('[Discovery] Clean query:', cleanQuery);

        // If Fuse.js is not available, fall back to basic search
        if (!this.fuse) {
            console.warn('[Discovery] Fuse.js not available, using basic search');
            return this.basicSearch(cleanQuery, requestedType);
        }

        // Use Fuse.js for fuzzy search
        let results = this.fuse.search(cleanQuery).map(result => ({
            ...result.item,
            matchScore: 1 - result.score  // Invert score (lower Fuse score = better match)
        }));

        console.log('[Discovery] Fuse.js found', results.length, 'results before filtering');

        // Filter by requested resource type if specified
        if (requestedType === 'community') {
            results = results.filter(r => r.resourceType === 'community');
        } else if (requestedType === 'provider') {
            results = results.filter(r => r.resourceType === 'provider');
        }

        console.log('[Discovery] Final results after filtering:', results.length);
        if (results.length > 0) {
            console.log('[Discovery] Top result:', results[0]);
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
                resource.state,
                ...(resource.themes || []),                      // Communities use 'themes'
                ...(resource.focus_areas || []),                  // Providers use 'focus_areas'
                ...(resource.domains || []),
                ...(resource.asks || []),                         // What communities need
                ...(resource.offers || []),                       // What communities offer
                ...(resource.infrastructure_offers || []),        // Infrastructure available
                resource.description,
                resource.metadata?.searchable_content || ''       // Indexed markdown content
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
            // Check both 'themes' (communities) and 'focus_areas' (providers)
            const areas = community.themes || community.focus_areas || [];
            if (areas.length === 0) return false;
            return areas.some(area =>
                area.toLowerCase().includes(theme.toLowerCase())
            );
        });
    }

    searchByLocation(city, neighborhood) {
        return this.communities.filter(community => {
            // Communities have separate city and neighborhood fields
            const communityCity = (community.city || '').toLowerCase();
            const communityNeighborhood = (community.neighborhood || '').toLowerCase();
            const communityLocation = (community.location || '').toLowerCase(); // Fallback for providers

            if (neighborhood) {
                // Search for both city and neighborhood
                const neighborhoodMatch = communityNeighborhood.includes(neighborhood.toLowerCase()) ||
                                         communityLocation.includes(neighborhood.toLowerCase());
                const cityMatch = communityCity.includes(city.toLowerCase()) ||
                                communityLocation.includes(city.toLowerCase());
                return neighborhoodMatch && cityMatch;
            }

            // Search for city only
            return communityCity.includes(city.toLowerCase()) ||
                   communityLocation.includes(city.toLowerCase());
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
