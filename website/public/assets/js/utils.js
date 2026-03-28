/**
 * Shared utility functions used across NOTF website.
 */

/** Generate a URL-safe slug from text */
function generateSlug(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Validate email address */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Generate a reference number (NOTF-YYYY-NNNN) */
function generateRefNumber() {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `NOTF-${year}-${rand}`;
}

/**
 * Build a standardized join record for Supabase file_metadata table.
 * Used by both the join form and chatbot onboarding.
 */
function buildJoinRecord(data) {
    const slug = generateSlug(data.name);
    return {
        file_path: `${data.type === 'community' ? 'communities' : 'solution-providers'}/${slug}.md`,
        file_type: data.type === 'community' ? 'community' : 'solution-provider',
        slug: slug,
        city: data.city || null,
        neighborhood: data.neighborhood || null,
        status: 'pending',
        metadata: {
            name: data.name,
            city: data.city || '',
            neighborhood: data.neighborhood || '',
            description: data.description || '',
            themes: data.themes || [],
            contact: {
                person: data.contactPerson || '',
                email: data.email || '',
                phone: data.phone || ''
            },
            website: data.website || '',
            offers: data.offers ? (Array.isArray(data.offers) ? data.offers : [data.offers]) : [],
            asks: data.asks ? (Array.isArray(data.asks) ? data.asks : [data.asks]) : [],
            submitted_via: data.source || 'join_form',
            submitted_at: new Date().toISOString()
        }
    };
}
