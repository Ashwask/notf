// Supabase Data Loader for Public Pages
// Loads data client-side from Supabase

const SUPABASE_URL = 'https://abblyaukkoxmgzwretvm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYmx5YXVra294bWd6d3JldHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzE4NTQsImV4cCI6MjA4MzgwNzg1NH0.neJmkUmGFPfXMC5PZNRhaXIGEefj_b79L_YceXl5jxU';

// Initialize Supabase client
const supabasePublic = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Load all solution providers
async function loadSolutionProviders() {
    const { data, error } = await supabasePublic
        .from('file_metadata')
        .select('*')
        .eq('file_type', 'solution-provider')
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error loading solution providers:', error);
        return [];
    }

    return (data || []).map(item => ({
        slug: item.slug,
        name: item.metadata?.name || item.slug,
        type: 'solution-provider',
        theme: item.metadata?.theme || '',
        location: item.metadata?.location || '',
        city: extractCity(item.metadata?.location),
        description: item.metadata?.description || '',
        contact: item.metadata?.contact || {},
        offers: item.metadata?.offers || [],
        asks: item.metadata?.asks || [],
        infrastructure_offers: item.metadata?.infrastructure_offers || [],
        stories: item.metadata?.stories || null
    }));
}

// Load all communities
async function loadCommunities(cityFilter = null) {
    let query = supabasePublic
        .from('file_metadata')
        .select('*')
        .eq('file_type', 'community')
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

    if (cityFilter) {
        query = query.eq('city', cityFilter);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error loading communities:', error);
        return [];
    }

    return (data || []).map(item => ({
        slug: item.slug,
        name: item.metadata?.name || item.slug,
        type: 'community',
        city: item.city || item.metadata?.city || '',
        state: item.metadata?.state || '',
        themes: item.metadata?.themes || [],
        description: item.metadata?.description || '',
        contact: item.metadata?.contact || {},
        offers: item.metadata?.offers || [],
        asks: item.metadata?.asks || [],
        stories: item.metadata?.stories || null
    }));
}

// Get unique cities from communities
async function getCities() {
    const { data, error } = await supabasePublic
        .from('file_metadata')
        .select('city')
        .eq('file_type', 'community')
        .eq('status', 'active')
        .not('city', 'is', null);

    if (error) {
        console.error('Error loading cities:', error);
        return [];
    }

    const cities = [...new Set(data.map(item => item.city).filter(c => c))];
    return cities.sort();
}

// Helper: Extract city from location string
function extractCity(location) {
    if (!location) return '';
    const parts = location.split(',');
    return parts[parts.length - 1].trim();
}

// Helper: Format date
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
}

// Helper: Format domains/themes
function formatDomains(domains) {
    if (!domains || !Array.isArray(domains)) return '';
    return domains.map(d => {
        if (typeof d === 'string') {
            return d.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
        return d;
    }).join(', ');
}

// Export for use in pages
window.dataLoader = {
    loadSolutionProviders,
    loadCommunities,
    getCities,
    formatDate,
    formatDomains,
    extractCity
};
