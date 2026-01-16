const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const matter = require('gray-matter');

// Load solution providers from YAML files
function loadSolutionProviders() {
    const providersDir = path.join(__dirname, '../data/solution-providers');
    if (!fs.existsSync(providersDir)) {
        return [];
    }

    const files = fs.readdirSync(providersDir).filter(f => f.endsWith('.yaml') && !f.startsWith('_'));

    const providers = files.map(file => {
        const content = fs.readFileSync(path.join(providersDir, file), 'utf8');
        try {
            const data = yaml.load(content);
            // Add slug for URL generation
            data.slug = file.replace('.yaml', '');
            return data;
        } catch (e) {
            console.error(`Error loading ${file}:`, e.message);
            return null;
        }
    }).filter(p => p !== null);

    // Filter to show only approved or active providers
    return providers.filter(p => !p.status || p.status === 'approved' || p.status === 'active');
}

// Legacy function - now returns solution providers for backwards compatibility
function loadMembers() {
    return loadSolutionProviders();
}

// Load all community markdown files from all cities
function loadCommunities() {
    const communitiesBaseDir = path.join(__dirname, '../data/communities');
    if (!fs.existsSync(communitiesBaseDir)) {
        return [];
    }

    const communities = [];
    const cities = ['bengaluru', 'mumbai', 'ahmedabad', 'bhubaneswar'];

    for (const city of cities) {
        const cityDir = path.join(communitiesBaseDir, city);
        if (!fs.existsSync(cityDir)) {
            continue;
        }

        const files = fs.readdirSync(cityDir).filter(f => f.endsWith('.md') && !f.startsWith('_'));

        for (const file of files) {
            const content = fs.readFileSync(path.join(cityDir, file), 'utf8');
            try {
                const parsed = matter(content);
                communities.push({
                    ...parsed.data,
                    content: parsed.content,
                    slug: file.replace('.md', ''),
                    city: city
                });
            } catch (e) {
                console.error(`Error loading ${file}:`, e.message);
            }
        }
    }

    // Filter to show only approved or active communities (or those without status field - backward compatible)
    // "pending" status will be hidden
    return communities.filter(c => !c.status || c.status === 'approved' || c.status === 'active');
}

module.exports = { loadMembers, loadCommunities, loadSolutionProviders };
