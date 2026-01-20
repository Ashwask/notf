/**
 * Excel Export Functionality
 * Exports communities and solution providers to Excel (.xlsx)
 */

// ==================== DATA FETCHING ====================

/**
 * Get filtered communities from current page state
 * @returns {Promise<Array>} Array of filtered community objects
 */
async function getFilteredCommunities() {
    // Check if we're on the communities page
    if (typeof window.communities === 'undefined') {
        console.log('Not on communities page, fetching all communities');
        return await fetchAllCommunities();
    }

    // Get the currently displayed communities (respects status filter)
    const filteredComms = window.communities || [];

    // Check if search is active
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.trim() : '';

    if (!searchTerm) {
        // No search active, return all filtered communities
        console.log(`Using ${filteredComms.length} filtered communities (status filter applied)`);
        return filteredComms;
    }

    // Search is active - need to re-apply Fuse.js filtering
    const fuseOptions = {
        keys: [
            { name: 'metadata.name', weight: 2.0 },
            { name: 'metadata.neighborhoods', weight: 1.5 },
            { name: 'metadata.wards', weight: 1.5 },
            { name: 'metadata.city', weight: 1.2 },
            { name: 'city', weight: 1.2 },
            { name: 'metadata.themes', weight: 1.0 },
            { name: 'metadata.state', weight: 0.8 },
            { name: 'slug', weight: 0.5 }
        ],
        threshold: 0.4,
        includeScore: true,
        ignoreLocation: true,
        shouldSort: true,
        minMatchCharLength: 2
    };

    const fuse = new Fuse(filteredComms, fuseOptions);
    const fuseResults = fuse.search(searchTerm);
    const searchFiltered = fuseResults.map(result => result.item);

    console.log(`Using ${searchFiltered.length} search-filtered communities (search: "${searchTerm}")`);
    return searchFiltered;
}

/**
 * Get filtered solution providers from current page state
 * @returns {Promise<Array>} Array of filtered provider objects
 */
async function getFilteredProviders() {
    // Check if we're on the organizations page
    if (typeof window.organizations === 'undefined') {
        console.log('Not on organizations page, fetching all providers');
        return await fetchAllProviders();
    }

    // Get the currently displayed organizations (respects status filter)
    const filteredOrgs = window.organizations || [];

    // Check if search is active
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.trim() : '';

    if (!searchTerm) {
        // No search active, return all filtered providers
        console.log(`Using ${filteredOrgs.length} filtered providers (status filter applied)`);
        return filteredOrgs;
    }

    // Search is active - need to re-apply Fuse.js filtering
    const fuseOptions = {
        keys: [
            { name: 'metadata.name', weight: 2.0 },
            { name: 'metadata.theme', weight: 1.5 },
            { name: 'metadata.focus_areas', weight: 1.5 },
            { name: 'metadata.domains', weight: 1.2 },
            { name: 'metadata.city', weight: 1.0 },
            { name: 'slug', weight: 0.5 }
        ],
        threshold: 0.4,
        includeScore: true,
        ignoreLocation: true,
        shouldSort: true,
        minMatchCharLength: 2
    };

    const fuse = new Fuse(filteredOrgs, fuseOptions);
    const fuseResults = fuse.search(searchTerm);
    const searchFiltered = fuseResults.map(result => result.item);

    console.log(`Using ${searchFiltered.length} search-filtered providers (search: "${searchTerm}")`);
    return searchFiltered;
}

/**
 * Get Supabase client (supports both window.supabaseClient and authUtils.supabase)
 * @returns {Object} Supabase client
 */
function getSupabaseClient() {
    // Check for authUtils.supabase first (used in newer admin pages)
    if (typeof authUtils !== 'undefined' && authUtils.supabase) {
        return authUtils.supabase;
    }

    // Fallback to window.supabaseClient (legacy)
    if (typeof window.supabaseClient !== 'undefined') {
        return window.supabaseClient;
    }

    throw new Error('Supabase client not found. Please ensure auth.js is loaded.');
}

/**
 * Fetch all communities from Supabase (from file_metadata table)
 * @returns {Promise<Array>} Array of community objects
 */
async function fetchAllCommunities() {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('file_metadata')
            .select('*')
            .eq('file_type', 'community')
            .order('slug', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching communities:', err);
        throw new Error('Failed to fetch communities: ' + err.message);
    }
}

/**
 * Fetch all solution providers from Supabase (from file_metadata table)
 * @returns {Promise<Array>} Array of provider objects
 */
async function fetchAllProviders() {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('file_metadata')
            .select('*')
            .eq('file_type', 'solution-provider')  // Fixed: hyphen, not underscore
            .order('slug', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching solution providers:', err);
        throw new Error('Failed to fetch solution providers: ' + err.message);
    }
}

// ==================== DATA FLATTENING ====================

/**
 * Flatten community object to Excel row format
 * @param {Object} comm - Community object from file_metadata table
 * @returns {Object} Flattened object for Excel
 */
function flattenCommunity(comm) {
    const { arrayToSemicolon, sanitizeForExcel } = window.ExcelCommon;

    // Extract metadata (file_metadata structure)
    const meta = comm.metadata || {};

    return {
        // Read-only identifiers
        'ID/Slug': sanitizeForExcel(comm.slug),
        'File Path': sanitizeForExcel(comm.file_path),

        // Basic info
        'Name': sanitizeForExcel(meta.name || comm.name),
        'City': sanitizeForExcel(meta.city || comm.city),
        'Neighborhoods': arrayToSemicolon(meta.neighborhoods),
        'Ward': sanitizeForExcel(meta.ward),

        // Contact info
        'Contact Person': sanitizeForExcel(meta.contact?.person),
        'Contact Email': sanitizeForExcel(meta.contact?.email),
        'Contact Phone': sanitizeForExcel(meta.contact?.phone),
        'Website': sanitizeForExcel(meta.website),

        // Location
        'Latitude': meta.location?.latitude || '',
        'Longitude': meta.location?.longitude || '',
        'Address': sanitizeForExcel(meta.location?.address),

        // Classification
        'Focus Areas': arrayToSemicolon(meta.focus_areas || meta.themes),
        'What They Offer': arrayToSemicolon(meta.what_they_offer || meta.offers),
        'What They Ask For': arrayToSemicolon(meta.what_they_ask_for || meta.asks),

        // Elected representatives
        'MLA Name': sanitizeForExcel(meta.elected_representatives?.mla?.name),
        'MLA Party': sanitizeForExcel(meta.elected_representatives?.mla?.party),
        'MP Name': sanitizeForExcel(meta.elected_representatives?.mp?.name),
        'MP Party': sanitizeForExcel(meta.elected_representatives?.mp?.party),
        'Corporator Name': sanitizeForExcel(meta.elected_representatives?.corporator?.name),
        'Corporator Party': sanitizeForExcel(meta.elected_representatives?.corporator?.party),

        // Organization details
        'Organization Type': sanitizeForExcel(meta.organization_type),
        'Registration Number': sanitizeForExcel(meta.registration_number),
        'Year Established': meta.year_established || '',
        'Team Size': meta.team_size || '',

        // Community characteristics
        'Neighborhood Size': meta.neighborhood_size || '',
        'Population Served': meta.population_served || '',

        // Metadata
        'Status': sanitizeForExcel(comm.status || 'active'),
        'Created At': comm.created_at || '',
        'Updated At': comm.updated_at || ''
    };
}

/**
 * Flatten solution provider object to Excel row format
 * @param {Object} org - Provider object from file_metadata table
 * @returns {Object} Flattened object for Excel
 */
function flattenProvider(org) {
    const { arrayToSemicolon, sanitizeForExcel } = window.ExcelCommon;

    // Extract metadata (file_metadata structure)
    const meta = org.metadata || {};

    return {
        // Read-only identifiers
        'ID/Slug': sanitizeForExcel(org.slug),
        'File Path': sanitizeForExcel(org.file_path),

        // Basic info
        'Name': sanitizeForExcel(meta.name || org.name),
        'Theme/Sector': sanitizeForExcel(meta.theme),
        'Focus Areas': arrayToSemicolon(meta.focus_areas),
        'Domains': arrayToSemicolon(meta.domains),

        // Contact info
        'Contact Email': sanitizeForExcel(meta.contact?.email),
        'Contact Phone': sanitizeForExcel(meta.contact?.phone),
        'Website': sanitizeForExcel(meta.website),

        // Classification
        'Organization Type': sanitizeForExcel(meta.organization_type),
        'City': sanitizeForExcel(meta.city || org.city),

        // Metadata
        'Status': sanitizeForExcel(org.status || 'active'),
        'Created At': org.created_at || '',
        'Updated At': org.updated_at || ''
    };
}

// ==================== EXCEL GENERATION ====================

/**
 * Create reference data sheet with valid values
 * @returns {Object} Sheet data
 */
function createReferenceSheet() {
    const { VALID_STATUSES, COMMON_THEMES, COMMON_FOCUS_AREAS, SAMPLE_WARDS } = window.ExcelCommon;

    // Create columns for each reference type
    const maxRows = Math.max(
        VALID_STATUSES.length,
        COMMON_THEMES.length,
        COMMON_FOCUS_AREAS.length,
        SAMPLE_WARDS.length
    );

    const data = [
        ['Valid Statuses', 'Common Themes', 'Focus Areas', 'Sample Wards']
    ];

    for (let i = 0; i < maxRows; i++) {
        data.push([
            VALID_STATUSES[i] || '',
            COMMON_THEMES[i] || '',
            COMMON_FOCUS_AREAS[i] || '',
            SAMPLE_WARDS[i] || ''
        ]);
    }

    return data;
}

/**
 * Apply column formatting to worksheet
 * @param {Object} worksheet - SheetJS worksheet
 * @param {Array<number>} readOnlyColumns - Column indices that are read-only
 */
function applyColumnFormatting(worksheet, readOnlyColumns = []) {
    const { autoSizeColumns, formatHeaders, markReadOnlyColumns } = window.ExcelCommon;

    // Auto-size columns
    autoSizeColumns(worksheet);

    // Format headers
    formatHeaders(worksheet);

    // Mark read-only columns
    markReadOnlyColumns(worksheet, readOnlyColumns);

    // Freeze header row
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };
}

/**
 * Detect which page we're on
 * @returns {string} 'communities' | 'organizations' | 'both'
 */
function detectCurrentPage() {
    // Check for page-specific global variables
    if (typeof window.communities !== 'undefined') {
        return 'communities';
    }
    if (typeof window.organizations !== 'undefined') {
        return 'organizations';
    }

    // Fallback: check URL
    const path = window.location.pathname;
    if (path.includes('communities.html')) {
        return 'communities';
    }
    if (path.includes('organizations.html')) {
        return 'organizations';
    }

    // Default: export both (for future combined pages)
    return 'both';
}

/**
 * Main export function
 * Exports filtered/searched data to Excel file
 * @param {boolean} exportAll - If true, export all records. If false, export only filtered/visible records.
 */
async function exportToExcel(exportAll = false) {
    try {
        // Show loading indicator
        if (window.showNotification) {
            window.showNotification('Preparing export...', 'info');
        }

        console.log('Starting Excel export...');

        // Check if SheetJS is loaded
        if (typeof XLSX === 'undefined') {
            throw new Error('SheetJS library not loaded. Please refresh the page.');
        }

        // Detect which page we're on
        const currentPage = detectCurrentPage();
        console.log(`Detected page: ${currentPage}`);

        // Fetch data based on current page
        let communities = [];
        let providers = [];

        if (currentPage === 'communities' || currentPage === 'both') {
            if (exportAll) {
                console.log('Fetching all communities...');
                communities = await fetchAllCommunities();
                console.log(`Fetched ${communities.length} communities`);
            } else {
                console.log('Exporting filtered communities...');
                communities = await getFilteredCommunities();
                console.log(`Exporting ${communities.length} filtered communities`);
            }
        }

        if (currentPage === 'organizations' || currentPage === 'both') {
            if (exportAll) {
                console.log('Fetching all solution providers...');
                providers = await fetchAllProviders();
                console.log(`Fetched ${providers.length} solution providers`);
            } else {
                console.log('Exporting filtered solution providers...');
                providers = await getFilteredProviders();
                console.log(`Exporting ${providers.length} filtered solution providers`);
            }
        }

        // Create workbook
        const wb = XLSX.utils.book_new();

        // ========== COMMUNITIES SHEET (only if on communities page or both) ==========
        if (currentPage === 'communities' || currentPage === 'both') {
            console.log('Creating Communities sheet...');
            const communitiesData = communities.map(flattenCommunity);

            if (communitiesData.length > 0) {
                const communitiesSheet = XLSX.utils.json_to_sheet(communitiesData);
                applyColumnFormatting(communitiesSheet, [0, 1]);
                XLSX.utils.book_append_sheet(wb, communitiesSheet, 'Communities');
                console.log('✅ Communities sheet created');
            } else {
                // Create empty sheet with headers
                const headers = [Object.keys(flattenCommunity({ contact: {}, location: {}, elected_representatives: { mla: {}, mp: {}, corporator: {} } }))];
                const emptySheet = XLSX.utils.aoa_to_sheet(headers);
                applyColumnFormatting(emptySheet, [0, 1]);
                XLSX.utils.book_append_sheet(wb, emptySheet, 'Communities');
                console.log('⚠️ No communities to export (empty sheet created)');
            }
        }

        // ========== SOLUTION PROVIDERS SHEET (only if on organizations page or both) ==========
        if (currentPage === 'organizations' || currentPage === 'both') {
            console.log('Creating Solution Providers sheet...');
            const providersData = providers.map(flattenProvider);

            if (providersData.length > 0) {
                const providersSheet = XLSX.utils.json_to_sheet(providersData);
                applyColumnFormatting(providersSheet, [0, 1]);
                XLSX.utils.book_append_sheet(wb, providersSheet, 'Solution Providers');
                console.log('✅ Solution Providers sheet created');
            } else {
                // Create empty sheet with headers
                const headers = [Object.keys(flattenProvider({ contact: {} }))];
                const emptySheet = XLSX.utils.aoa_to_sheet(headers);
                applyColumnFormatting(emptySheet, [0, 1]);
                XLSX.utils.book_append_sheet(wb, emptySheet, 'Solution Providers');
                console.log('⚠️ No solution providers to export (empty sheet created)');
            }
        }

        // ========== REFERENCE DATA SHEET ==========
        console.log('Creating Reference Data sheet...');
        const referenceData = createReferenceSheet();
        const referenceSheet = XLSX.utils.aoa_to_sheet(referenceData);
        applyColumnFormatting(referenceSheet, []);
        XLSX.utils.book_append_sheet(wb, referenceSheet, 'Reference Data');
        console.log('✅ Reference Data sheet created');

        // ========== GENERATE FILE ==========
        const { formatDate } = window.ExcelCommon;

        // Generate page-specific filename
        let filename;
        if (currentPage === 'communities') {
            filename = `NOTF_Communities_${formatDate()}.xlsx`;
        } else if (currentPage === 'organizations') {
            filename = `NOTF_Solution_Providers_${formatDate()}.xlsx`;
        } else {
            filename = `NOTF_Data_Export_${formatDate()}.xlsx`;
        }

        console.log(`Writing file: ${filename}`);
        XLSX.writeFile(wb, filename);

        console.log('✅ Export complete!');

        // Show success message
        const exportType = exportAll ? 'all' : 'filtered';
        let successMessage;

        if (currentPage === 'communities') {
            successMessage = `Successfully exported ${communities.length} communities (${exportType})`;
        } else if (currentPage === 'organizations') {
            successMessage = `Successfully exported ${providers.length} solution providers (${exportType})`;
        } else {
            successMessage = `Successfully exported ${communities.length} communities and ${providers.length} solution providers (${exportType})`;
        }

        if (window.showNotification) {
            window.showNotification(successMessage, 'success');
        }

    } catch (err) {
        console.error('Export error:', err);

        // Show error message
        if (window.showNotification) {
            window.showNotification('Export failed: ' + err.message, 'error');
        } else {
            alert('Export failed: ' + err.message);
        }
    }
}

// ==================== EXPORT PROMPT ====================

// Save reference to original export function BEFORE reassigning
const _exportToExcelOriginal = exportToExcel;

/**
 * Show export options dialog and execute export
 */
async function promptExportOptions() {
    // Detect current page
    const currentPage = detectCurrentPage();

    // Check if we're on a page with data
    const hasPageData = (currentPage === 'communities' && typeof window.communities !== 'undefined') ||
                        (currentPage === 'organizations' && typeof window.organizations !== 'undefined');

    if (!hasPageData) {
        // No data loaded yet, export all from database
        console.log('No page data loaded, exporting all from database');
        await _exportToExcelOriginal(true);
        return;
    }

    // Check if there are active filters
    const searchInput = document.getElementById('searchInput');
    const hasSearch = searchInput && searchInput.value.trim().length > 0;
    const hasStatusFilter = (typeof window.currentStatusFilter !== 'undefined' && window.currentStatusFilter !== 'all');

    // Always ask user if they want filtered or all data
    let message;
    if (hasSearch || hasStatusFilter) {
        // Filters are active
        const filterDesc = hasSearch ? `search results` : `"${window.currentStatusFilter}" records`;
        message = `Export Options:\n\n✓ Visible Records - Export only ${filterDesc} currently shown\n✗ All Records - Export everything from database`;
    } else {
        // No filters, but still ask
        message = `Export Options:\n\n✓ Visible Records - Export what's currently displayed on screen\n✗ All Records - Export everything from database`;
    }

    const exportVisible = confirm(message);

    // exportVisible=true → exportAll=false (export filtered)
    // exportVisible=false → exportAll=true (export all)
    await _exportToExcelOriginal(!exportVisible);
}

// ==================== EXPORTS ====================

// Export to global scope
window.exportToExcel = promptExportOptions; // Use the prompt wrapper as the main export function
window.exportToExcelDirect = _exportToExcelOriginal;  // Keep direct access for advanced use

// Enable export button once module is loaded
const exportBtn = document.getElementById('exportBtn');
if (exportBtn) {
    exportBtn.disabled = false;
    exportBtn.title = 'Export to Excel';
    console.log('✅ Excel Export button enabled');
}

console.log('✅ Excel Export module loaded');
