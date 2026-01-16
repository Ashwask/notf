// Admin Authentication Utilities
// Uses Supabase Auth for login/logout

const SUPABASE_URL = 'https://abblyaukkoxmgzwretvm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYmx5YXVra294bWd6d3JldHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzE4NTQsImV4cCI6MjA4MzgwNzg1NH0.neJmkUmGFPfXMC5PZNRhaXIGEefj_b79L_YceXl5jxU';

// Lazy initialization of Supabase client
let supabaseClient = null;
function getSupabaseAuthClient() {
    if (!supabaseClient && window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabaseClient;
}

// Check if user is authenticated
async function checkAuth() {
    const client = getSupabaseAuthClient();
    const { data: { session } } = await client.auth.getSession();
    return session;
}

// Redirect to login if not authenticated
async function requireAuth() {
    const session = await checkAuth();
    if (!session) {
        window.location.href = '/admin/login.html';
        return null;
    }
    return session;
}

// Login with email and password
async function login(email, password) {
    const client = getSupabaseAuthClient();
    const { data, error } = await client.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        throw error;
    }

    return data;
}

// Logout
async function logout() {
    const client = getSupabaseAuthClient();
    const { error } = await client.auth.signOut();
    if (error) {
        console.error('Logout error:', error);
    }
    // Redirect to home page
    window.location.href = '/';
}

// Get current user
async function getCurrentUser() {
    const client = getSupabaseAuthClient();
    const { data: { user } } = await client.auth.getUser();
    return user;
}

// Export functions
window.authUtils = {
    checkAuth,
    requireAuth,
    login,
    logout,
    getCurrentUser,
    get supabase() { return getSupabaseAuthClient(); }  // Export as lazy getter
};
