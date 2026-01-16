// Admin Authentication Utilities
// Uses Supabase Auth for login/logout

const SUPABASE_URL = 'https://abblyaukkoxmgzwretvm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYmx5YXVra294bWd6d3JldHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzE4NTQsImV4cCI6MjA4MzgwNzg1NH0.neJmkUmGFPfXMC5PZNRhaXIGEefj_b79L_YceXl5jxU';

// Initialize Supabase client (use different variable name to avoid global conflict)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if user is authenticated
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
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
    const { data, error } = await supabaseClient.auth.signInWithPassword({
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
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('Logout error:', error);
    }
    window.location.href = '/admin/login.html';
}

// Get current user
async function getCurrentUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
}

// Export functions
window.authUtils = {
    checkAuth,
    requireAuth,
    login,
    logout,
    getCurrentUser,
    supabase: supabaseClient  // Export as 'supabase' for compatibility
};
