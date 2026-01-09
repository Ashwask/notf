const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const matter = require('gray-matter');

// Load all organization YAML files
function loadMembers() {
    const membersDir = path.join(__dirname, '../data/members/organizations');
    if (!fs.existsSync(membersDir)) {
        return [];
    }

    const files = fs.readdirSync(membersDir).filter(f => f.endsWith('.yaml') && !f.startsWith('_'));

    const members = files.map(file => {
        const content = fs.readFileSync(path.join(membersDir, file), 'utf8');
        try {
            return yaml.load(content);
        } catch (e) {
            console.error(`Error loading ${file}:`, e.message);
            return null;
        }
    }).filter(m => m !== null);

    // Filter to show only approved members (or those without status field - backward compatible)
    return members.filter(m => !m.status || m.status === 'approved');
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

    // Filter to show only approved communities (or those without status field - backward compatible)
    return communities.filter(c => !c.status || c.status === 'approved' || c.status === 'active');
}

module.exports = { loadMembers, loadCommunities };
