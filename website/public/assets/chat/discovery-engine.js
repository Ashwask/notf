/**
 * Discovery Engine
 * Handles community and resource discovery
 */

class DiscoveryEngine {
    constructor(communities, members) {
        this.communities = communities || [];
        this.members = members || [];
        this.allResources = [
            ...this.communities.map(c => ({...c, resourceType: 'community'})),
            ...this.members.map(m => ({...m, resourceType: 'provider'}))
        ];
        this.index = this.buildSearchIndex();
    }

    buildSearchIndex() {
        // Build searchable index of all resources (communities + members)
        const index = new Map();

        this.allResources.forEach((resource, idx) => {
            // Index by name
            if (resource.name) {
                const nameWords = resource.name.toLowerCase().split(/\s+/);
                nameWords.forEach(word => {
                    if (!index.has(word)) {
                        index.set(word, []);
                    }
                    index.get(word).push(idx);
                });
            }

            // Index by location
            const location = resource.location || resource.city || resource.neighborhood;
            if (location) {
                const locationWords = location.toLowerCase().split(/\s+/);
                locationWords.forEach(word => {
                    if (!index.has(word)) {
                        index.set(word, []);
                    }
                    index.get(word).push(idx);
                });
            }

            // Index by focus areas/themes/domains
            const focusAreas = resource.focus_areas || resource.domains || [];
            if (focusAreas && focusAreas.length > 0) {
                focusAreas.forEach(area => {
                    const areaWords = area.toLowerCase().split(/\s+/);
                    areaWords.forEach(word => {
                        if (!index.has(word)) {
                            index.set(word, []);
                        }
                        index.get(word).push(idx);
                    });
                });
            }
        });

        return index;
    }

    search(query) {
        const queryWords = query.toLowerCase().split(/\s+/);
        const matchScores = new Map();

        queryWords.forEach(word => {
            if (this.index.has(word)) {
                this.index.get(word).forEach(idx => {
                    matchScores.set(idx, (matchScores.get(idx) || 0) + 1);
                });
            }

            // Also do partial matching
            this.index.forEach((indices, indexedWord) => {
                if (indexedWord.includes(word) || word.includes(indexedWord)) {
                    indices.forEach(idx => {
                        matchScores.set(idx, (matchScores.get(idx) || 0) + 0.5);
                    });
                }
            });
        });

        // Sort by score
        const results = Array.from(matchScores.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([idx, score]) => ({
                ...this.allResources[idx],
                matchScore: score
            }));

        return results;
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
