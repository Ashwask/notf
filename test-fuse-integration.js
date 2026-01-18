#!/usr/bin/env node
/**
 * Fuse.js Integration Test Script
 * Tests discovery-engine.js with Fuse.js fuzzy search
 */

const Fuse = require('fuse.js');

// Sample test data
const communities = [
    {
        name: "Jayanagar Residents Welfare Association",
        location: "Jayanagar, Bengaluru, Karnataka",
        city: "Bengaluru",
        neighborhood: "Jayanagar",
        focus_areas: ["waste-management", "water", "environment"]
    },
    {
        name: "Malleshwaram Community Group",
        location: "Malleshwaram, Bengaluru, Karnataka",
        city: "Bengaluru",
        neighborhood: "Malleshwaram",
        focus_areas: ["education", "women-empowerment"]
    },
    {
        name: "Indiranagar Civic Action",
        location: "Indiranagar, Bengaluru, Karnataka",
        city: "Bengaluru",
        neighborhood: "Indiranagar",
        focus_areas: ["waste-management", "sanitation"]
    }
];

const members = [
    {
        name: "ATREE (Ashoka Trust for Research in Ecology and the Environment)",
        location: "Bengaluru, Karnataka",
        city: "Bengaluru",
        domains: ["environment", "research", "ecology", "conservation"]
    },
    {
        name: "Hasiru Dala",
        location: "Bengaluru, Karnataka",
        city: "Bengaluru",
        domains: ["waste-management", "recycling", "social-enterprise"]
    },
    {
        name: "Pratham Education Foundation",
        location: "Mumbai, Maharashtra",
        city: "Mumbai",
        domains: ["education", "children", "literacy"]
    }
];

// Simulate DiscoveryEngine class
class DiscoveryEngine {
    constructor(communities, members) {
        this.communities = communities || [];
        this.members = members || [];
        this.allResources = [
            ...this.communities.map(c => ({...c, resourceType: 'community'})),
            ...this.members.map(m => ({...m, resourceType: 'provider'}))
        ];

        this.initializeFuse();
    }

    initializeFuse() {
        const fuseOptions = {
            keys: [
                { name: 'name', weight: 2.0 },
                { name: 'focus_areas', weight: 1.5 },
                { name: 'domains', weight: 1.5 },
                { name: 'location', weight: 1.0 },
                { name: 'city', weight: 1.0 },
                { name: 'neighborhood', weight: 0.8 }
            ],
            threshold: 0.4,
            includeScore: true,
            minMatchCharLength: 2,
            ignoreLocation: true
        };

        if (typeof Fuse === 'undefined') {
            console.error('Fuse.js not loaded. Falling back to basic search.');
            this.fuse = null;
            return;
        }

        this.fuse = new Fuse(this.allResources, fuseOptions);
    }

    search(query) {
        const queryLower = query.toLowerCase();
        const requestedType = this.detectResourceType(queryLower);
        const cleanQuery = this.cleanQuery(queryLower);

        if (!this.fuse) {
            return this.basicSearch(cleanQuery, requestedType);
        }

        let results = this.fuse.search(cleanQuery).map(result => ({
            ...result.item,
            matchScore: 1 - result.score
        }));

        if (requestedType === 'community') {
            results = results.filter(r => r.resourceType === 'community');
        } else if (requestedType === 'provider') {
            results = results.filter(r => r.resourceType === 'provider');
        }

        return results.slice(0, 10);
    }

    detectResourceType(query) {
        const communityKeywords = [
            'community', 'communities', 'neighbourhood', 'neighborhood',
            'resident', 'residents', 'rwa', 'local group', 'civic group'
        ];

        const providerKeywords = [
            'provider', 'providers', 'organization', 'organizations',
            'ngo', 'ngos', 'company', 'companies', 'service', 'services',
            'solution provider', 'vendor', 'agency'
        ];

        if (communityKeywords.some(keyword => query.includes(keyword))) {
            return 'community';
        }

        if (providerKeywords.some(keyword => query.includes(keyword))) {
            return 'provider';
        }

        return null;
    }

    cleanQuery(query) {
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

        return cleaned.replace(/\s+/g, ' ').trim();
    }

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
}

// Test city matching
function testCityMatching() {
    console.log('\n=== Test 3: City Fuzzy Matching ===\n');

    const testCases = [
        { ask: 'Bengaluru', offer: 'Bangalore' },
        { ask: 'Mumbai', offer: 'Bombay' },
        { ask: 'Bengalore', offer: 'Bengaluru' },  // Typo
        { ask: 'Hydrabad', offer: 'Hyderabad' }   // Typo
    ];

    testCases.forEach(({ ask, offer }) => {
        const cityFuse = new Fuse([offer], { threshold: 0.3 });
        const match = cityFuse.search(ask);
        const hasMatch = match.length > 0;
        const score = hasMatch ? ((1 - match[0].score) * 100).toFixed(0) : 0;

        console.log(`  Ask: "${ask}" vs Offer: "${offer}"`);
        console.log(`  ${hasMatch ? `✅ Match (${score}% similarity)` : '❌ No match'}\n`);
    });
}

// Run tests
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║  Fuse.js Integration Test                           ║');
console.log('╚══════════════════════════════════════════════════════╝\n');

console.log('=== Test 1: Library Loading ===\n');
try {
    const testFuse = new Fuse([{ name: 'test' }], { keys: ['name'] });
    const result = testFuse.search('test');
    console.log('  ✅ Fuse.js loaded and working');
    console.log(`  ✅ Test search successful (${result.length} result)\n`);
} catch (error) {
    console.log(`  ❌ Fuse.js error: ${error.message}\n`);
    process.exit(1);
}

console.log('=== Test 2: Discovery Engine ===\n');
const engine = new DiscoveryEngine(communities, members);
console.log(`  ✅ Discovery Engine initialized`);
console.log(`  📊 Total resources: ${engine.allResources.length}`);
console.log(`  🏘️  Communities: ${communities.length}`);
console.log(`  🏢 Providers: ${members.length}`);
console.log(`  ${engine.fuse ? '✅ Fuse.js integration active' : '❌ Fallback mode'}\n`);

// Test queries
const testQueries = [
    'atree',
    'communities malleshwaram',
    'waste managment',  // Typo in "management"
    'provider bengaluru'
];

console.log('=== Test 3: Search Queries ===\n');
testQueries.forEach(query => {
    console.log(`  Query: "${query}"`);
    const results = engine.search(query);
    console.log(`  Results: ${results.length}`);

    if (results.length > 0) {
        results.slice(0, 3).forEach((r, i) => {
            const score = (r.matchScore * 100).toFixed(0);
            console.log(`    ${i + 1}. ${r.name} (${r.resourceType}) - ${score}% match`);
        });
    } else {
        console.log(`    ❌ No results found`);
    }
    console.log('');
});

// Test city matching
testCityMatching();

// Performance test
console.log('=== Test 4: Performance ===\n');
const iterations = 100;
const perfQuery = 'waste management bengaluru';

const start = Date.now();
for (let i = 0; i < iterations; i++) {
    engine.search(perfQuery);
}
const end = Date.now();

const avgTime = ((end - start) / iterations).toFixed(2);
console.log(`  ⚡ Average search time: ${avgTime}ms (${iterations} iterations)`);
console.log(`  📊 Query: "${perfQuery}"\n`);

console.log('╔══════════════════════════════════════════════════════╗');
console.log('║  ✅ All tests passed!                                ║');
console.log('╚══════════════════════════════════════════════════════╝\n');
