const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://abblyaukkoxmgzwretvm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('🔧 Supabase Config Check:');
console.log('  SUPABASE_URL:', SUPABASE_URL);
console.log('  SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Set (length: ' + SUPABASE_ANON_KEY.length + ')' : '❌ Not set');

if (!SUPABASE_ANON_KEY) {
    console.warn('⚠️  SUPABASE_ANON_KEY not set. Set it in Vercel environment variables.');
    console.warn('   Falling back to local file loading...');
}

// Initialize Supabase client
const supabase = SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

console.log('  Supabase client:', supabase ? '✅ Initialized' : '❌ Not initialized');

// Load solution providers from Supabase
async function loadSolutionProvidersFromSupabase() {
    console.log('📦 Loading solution providers from Supabase...');

    if (!supabase) {
        console.error('❌ Supabase client not initialized');
        return [];
    }

    try {
        const { data, error } = await supabase
            .rpc('get_active_solution_providers');

        if (error) {
            console.error('❌ Error loading solution providers:', error);
            return [];
        }

        console.log(`✅ Loaded ${data.length} solution providers from Supabase`);

        // Transform data: merge slug with metadata
        const result = data.map(item => ({
            slug: item.slug,
            ...item.data
        }));

        return result;
    } catch (error) {
        console.error('❌ Exception loading solution providers:', error);
        return [];
    }
}

// Load communities from Supabase
async function loadCommunitiesFromSupabase(city = null) {
    console.log('🏘️  Loading communities from Supabase...');

    if (!supabase) {
        console.error('❌ Supabase client not initialized');
        return [];
    }

    try {
        const { data, error} = await supabase
            .rpc('get_active_communities', { city_filter: city });

        if (error) {
            console.error('❌ Error loading communities:', error);
            return [];
        }

        console.log(`✅ Loaded ${data.length} communities from Supabase`);

        // Transform data: merge slug and city with metadata
        const result = data.map(item => ({
            slug: item.slug,
            city: item.city,
            ...item.data
        }));

        return result;
    } catch (error) {
        console.error('❌ Exception loading communities:', error);
        return [];
    }
}

// Wrapper functions that return promises
function loadSolutionProviders() {
    if (!supabase) {
        // Fallback to local loading if Supabase not configured
        try {
            const localLoader = require('./load-data');
            return localLoader.loadSolutionProviders();
        } catch (e) {
            console.error('Failed to load from local files:', e);
            return [];
        }
    }

    // Return the async function - Eleventy will handle the promise
    return loadSolutionProvidersFromSupabase();
}

function loadCommunities() {
    if (!supabase) {
        // Fallback to local loading if Supabase not configured
        try {
            const localLoader = require('./load-data');
            return localLoader.loadCommunities();
        } catch (e) {
            console.error('Failed to load from local files:', e);
            return [];
        }
    }

    // Return the async function - Eleventy will handle the promise
    return loadCommunitiesFromSupabase();
}

// Legacy function for backwards compatibility
function loadMembers() {
    return loadSolutionProviders();
}

module.exports = {
    loadMembers,
    loadCommunities,
    loadSolutionProviders
};
