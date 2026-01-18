/**
 * Load data from Supabase
 * This file loads communities and solution providers from Supabase database
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://abblyaukkoxmgzwretvm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

let supabase = null;

function getSupabaseClient() {
    if (!supabase && SUPABASE_ANON_KEY) {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabase;
}

async function loadCommunities() {
    const client = getSupabaseClient();

    if (!client) {
        console.warn('Supabase client not configured. Returning empty communities array.');
        return [];
    }

    try {
        const { data, error } = await client
            .from('file_metadata')
            .select('*')
            .eq('type', 'community')
            .order('name');

        if (error) {
            console.error('Error loading communities:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Failed to load communities:', error);
        return [];
    }
}

async function loadSolutionProviders() {
    const client = getSupabaseClient();

    if (!client) {
        console.warn('Supabase client not configured. Returning empty solution providers array.');
        return [];
    }

    try {
        const { data, error } = await client
            .from('file_metadata')
            .select('*')
            .eq('type', 'solution-provider')
            .order('name');

        if (error) {
            console.error('Error loading solution providers:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Failed to load solution providers:', error);
        return [];
    }
}

async function loadMembers() {
    // Legacy support - members now maps to solution providers
    return loadSolutionProviders();
}

module.exports = {
    loadCommunities,
    loadSolutionProviders,
    loadMembers
};
