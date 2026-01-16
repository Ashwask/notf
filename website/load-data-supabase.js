const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const matter = require('gray-matter');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://abblyaukkoxmgzwretvm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Choose data source: 'supabase' or 'filesystem'
const DATA_SOURCE = process.env.DATA_SOURCE || (SUPABASE_ANON_KEY ? 'supabase' : 'filesystem');

console.log(`[NOTF] Data source: ${DATA_SOURCE}`);

// ============================================
// SUPABASE DATA LOADING
// ============================================

async function fetchFromSupabase(endpoint) {
    if (!SUPABASE_ANON_KEY) {
        console.warn('[NOTF] SUPABASE_ANON_KEY not set, falling back to filesystem');
        return null;
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Supabase fetch failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`[NOTF] Error fetching from Supabase:`, error.message);
        return null;
    }
}

async function loadSolutionProvidersFromSupabase() {
    const data = await fetchFromSupabase(
        'file_metadata?file_type=eq.solution-provider&status=eq.active&select=slug,metadata,updated_at'
    );

    if (!data) return null;

    return data.map(item => ({
        ...item.metadata,
        slug: item.slug,
        _updated_at: item.updated_at
    }));
}

async function loadCommunitiesFromSupabase() {
    const data = await fetchFromSupabase(
        'file_metadata?file_type=eq.community&status=eq.active&select=slug,city,metadata,updated_at'
    );

    if (!data) return null;

    return data.map(item => ({
        ...item.metadata,
        slug: item.slug,
        city: item.city,
        _updated_at: item.updated_at,
        content: '' // Content can be loaded separately if needed
    }));
}

// ============================================
// FILESYSTEM DATA LOADING (Fallback)
// ============================================

function loadSolutionProvidersFromFilesystem() {
    const providersDir = path.join(__dirname, '../data/solution-providers');
    if (!fs.existsSync(providersDir)) {
        return [];
    }

    const files = fs.readdirSync(providersDir).filter(f => f.endsWith('.yaml') && !f.startsWith('_'));

    const providers = files.map(file => {
        const content = fs.readFileSync(path.join(providersDir, file), 'utf8');
        try {
            const data = yaml.load(content);
            data.slug = file.replace('.yaml', '');
            return data;
        } catch (e) {
            console.error(`Error loading ${file}:`, e.message);
            return null;
        }
    }).filter(p => p !== null);

    return providers.filter(p => !p.status || p.status === 'approved' || p.status === 'active');
}

function loadCommunitiesFromFilesystem() {
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

    return communities.filter(c => !c.status || c.status === 'approved' || c.status === 'active');
}

// ============================================
// UNIFIED DATA LOADING FUNCTIONS
// ============================================

async function loadSolutionProviders() {
    if (DATA_SOURCE === 'supabase') {
        const data = await loadSolutionProvidersFromSupabase();
        if (data) {
            console.log(`[NOTF] Loaded ${data.length} solution providers from Supabase`);
            return data;
        }
        console.log(`[NOTF] Falling back to filesystem for solution providers`);
    }

    const data = loadSolutionProvidersFromFilesystem();
    console.log(`[NOTF] Loaded ${data.length} solution providers from filesystem`);
    return data;
}

async function loadCommunities() {
    if (DATA_SOURCE === 'supabase') {
        const data = await loadCommunitiesFromSupabase();
        if (data) {
            console.log(`[NOTF] Loaded ${data.length} communities from Supabase`);
            return data;
        }
        console.log(`[NOTF] Falling back to filesystem for communities`);
    }

    const data = loadCommunitiesFromFilesystem();
    console.log(`[NOTF] Loaded ${data.length} communities from filesystem`);
    return data;
}

// Legacy function - now returns solution providers for backwards compatibility
async function loadMembers() {
    return await loadSolutionProviders();
}

module.exports = { loadMembers, loadCommunities, loadSolutionProviders };
