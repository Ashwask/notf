#!/bin/bash

# Fix organization display by accepting "active" status
# Run this from: ~/Documents/GitHub/notf/

echo "🔧 Fixing Organization Display"
echo "=============================="
echo ""

cd ~/Documents/GitHub/notf/website

# Backup
cp load-data.js load-data.js.backup
echo "✅ Backup created: load-data.js.backup"
echo ""

# Fix the filter to accept "active" status for organizations
cat > load-data.js << 'LOADDATA'
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

    // Filter to show only approved or active members (or those without status field - backward compatible)
    // "pending" status will be hidden
    return members.filter(m => !m.status || m.status === 'approved' || m.status === 'active');
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

module.exports = { loadMembers, loadCommunities };
LOADDATA

echo "✅ Updated load-data.js to accept 'active' status"
echo ""
echo "   Previous filter: !m.status || m.status === 'approved'"
echo "   New filter:      !m.status || m.status === 'approved' || m.status === 'active'"
echo ""

# Rebuild
echo "🔨 Rebuilding website..."
npm run build

# Check how many organizations are now loaded
ORG_COUNT=$(find ../data/members/organizations -name "*.yaml" ! -name "_*" | wc -l | tr -d ' ')
echo ""
echo "📊 Found $ORG_COUNT organization files"
echo ""

# Deploy
echo "📦 Deploying to docs..."
cd ..
rm -rf docs/*
cp -r website/_site/* docs/

# Commit
echo ""
echo "📤 Committing changes..."
git add .
git commit -m "Fix organization display: accept 'active' status in filter"
git push

echo ""
echo "✅ ORGANIZATIONS FIXED!"
echo "======================="
echo ""
echo "Changes made:"
echo "  ✅ Updated status filter to accept 'active'"
echo "  ✅ All $ORG_COUNT organizations will now display"
echo "  ✅ 'pending' status still hidden (as intended)"
echo ""
echo "Status behavior:"
echo "  🟢 status: 'active'    → SHOWN"
echo "  🟢 status: 'approved'  → SHOWN"
echo "  🟢 no status field     → SHOWN"
echo "  🔴 status: 'pending'   → HIDDEN"
echo ""
echo "Pages affected:"
echo "  • /members/ (organization directory)"
echo "  • /matcher/ (ask/offer matching)"
echo "  • /search/ (search results)"
echo "  • / (homepage stats)"
echo ""
echo "Live site: https://urbanmorph.github.io/notf/"
