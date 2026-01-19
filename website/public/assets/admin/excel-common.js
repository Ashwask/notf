/**
 * Excel Common Utilities
 * Shared functions for Excel export/import functionality
 */

// ==================== CONSTANTS ====================

const VALID_STATUSES = ['active', 'pending', 'archived'];

const COMMON_THEMES = [
    'Water Management',
    'Waste Management',
    'Energy & Climate',
    'Mobility & Transport',
    'Public Spaces',
    'Housing',
    'Governance',
    'Health & Wellbeing',
    'Education',
    'Livelihoods'
];

const COMMON_FOCUS_AREAS = [
    'Water',
    'Waste',
    'Energy',
    'Mobility',
    'Spaces',
    'Housing',
    'Governance',
    'Health',
    'Education',
    'Livelihoods'
];

// Sample BBMP Wards (Bengaluru)
const SAMPLE_WARDS = [
    'Malleshwaram', 'Rajajinagar', 'Gandhinagar', 'Shanthinagar',
    'Basavanagudi', 'Chamarajpet', 'Chickpet', 'Jayanagar',
    'Koramangala', 'HSR Layout', 'BTM Layout', 'JP Nagar',
    'Indiranagar', 'Ulsoor', 'Vasanth Nagar', 'Shivajinagar'
];

// ==================== ARRAY UTILITIES ====================

/**
 * Convert array to semicolon-separated string
 * @param {Array|string|null} arr - Array to convert
 * @returns {string} Semicolon-separated string
 */
function arrayToSemicolon(arr) {
    if (!arr) return '';
    if (typeof arr === 'string') return arr;
    if (!Array.isArray(arr)) return String(arr);

    // Filter out empty values and join with semicolon
    return arr
        .filter(item => item && String(item).trim())
        .map(item => String(item).trim())
        .join(';');
}

/**
 * Convert semicolon-separated string to array
 * @param {string} str - Semicolon-separated string
 * @returns {Array} Array of trimmed non-empty strings
 */
function semicolonToArray(str) {
    if (!str) return [];
    if (Array.isArray(str)) return str;

    return String(str)
        .split(';')
        .map(item => item.trim())
        .filter(item => item.length > 0);
}

// ==================== VALIDATION UTILITIES ====================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
    if (!email) return true; // Empty is ok (not required)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate coordinate (latitude or longitude)
 * @param {number|string} coord - Coordinate to validate
 * @param {string} type - 'latitude' or 'longitude'
 * @returns {boolean} True if valid coordinate
 */
function isValidCoordinate(coord, type = 'latitude') {
    if (!coord && coord !== 0) return true; // Empty is ok

    const num = parseFloat(coord);
    if (isNaN(num)) return false;

    if (type === 'latitude') {
        return num >= -90 && num <= 90;
    } else {
        return num >= -180 && num <= 180;
    }
}

/**
 * Validate status value
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid status
 */
function isValidStatus(status) {
    if (!status) return true; // Empty is ok (will use default)
    return VALID_STATUSES.includes(status.toLowerCase());
}

/**
 * Parse coordinate to 6 decimal places
 * @param {number|string} coord - Coordinate to parse
 * @returns {number|null} Parsed coordinate or null
 */
function parseCoordinate(coord) {
    if (!coord && coord !== 0) return null;
    const num = parseFloat(coord);
    if (isNaN(num)) return null;
    return parseFloat(num.toFixed(6));
}

// ==================== FILE UTILITIES ====================

/**
 * Check if file exists in Supabase Storage
 * @param {string} filePath - File path to check
 * @returns {Promise<boolean>} True if file exists
 */
async function checkFileExists(filePath) {
    if (!filePath) return false;

    try {
        // Determine bucket based on file path
        const bucket = filePath.startsWith('communities/')
            ? 'communities'
            : 'solution-providers';

        const { data, error } = await window.supabaseClient
            .storage
            .from(bucket)
            .list(filePath.substring(0, filePath.lastIndexOf('/')), {
                search: filePath.substring(filePath.lastIndexOf('/') + 1)
            });

        if (error) return false;
        return data && data.length > 0;
    } catch (err) {
        console.error('Error checking file existence:', err);
        return false;
    }
}

/**
 * Extract city and slug from file path
 * @param {string} filePath - File path (e.g., communities/bengaluru/cifos.md)
 * @returns {Object} { city, slug }
 */
function parseFilePath(filePath) {
    if (!filePath) return { city: null, slug: null };

    const parts = filePath.split('/');

    if (filePath.startsWith('communities/')) {
        // communities/bengaluru/cifos.md
        return {
            city: parts[1] || null,
            slug: parts[2] ? parts[2].replace('.md', '') : null
        };
    } else if (filePath.startsWith('solution-providers/')) {
        // solution-providers/biome.yaml
        return {
            city: null,
            slug: parts[1] ? parts[1].replace('.yaml', '') : null
        };
    }

    return { city: null, slug: null };
}

// ==================== FORMATTING UTILITIES ====================

/**
 * Format date as YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Sanitize text for Excel (remove problematic characters)
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeForExcel(text) {
    if (!text) return '';
    return String(text)
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '') // Remove control characters
        .trim();
}

/**
 * Truncate text to max length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 32767) {
    if (!text) return '';
    const str = String(text);
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

// ==================== EXCEL UTILITIES ====================

/**
 * Auto-size worksheet columns based on content
 * @param {Object} worksheet - SheetJS worksheet object
 */
function autoSizeColumns(worksheet) {
    if (!worksheet || !worksheet['!ref']) return;

    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const colWidths = [];

    // Calculate max width for each column
    for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxWidth = 10; // Minimum width

        for (let R = range.s.r; R <= range.e.r; ++R) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = worksheet[cellAddress];

            if (!cell || !cell.v) continue;

            const cellValue = String(cell.v);
            const cellWidth = cellValue.length;

            if (cellWidth > maxWidth) {
                maxWidth = Math.min(cellWidth, 50); // Cap at 50 characters
            }
        }

        colWidths.push({ wch: maxWidth });
    }

    worksheet['!cols'] = colWidths;
}

/**
 * Apply header formatting to worksheet
 * @param {Object} worksheet - SheetJS worksheet object
 */
function formatHeaders(worksheet) {
    if (!worksheet || !worksheet['!ref']) return;

    const range = XLSX.utils.decode_range(worksheet['!ref']);

    // Format first row (headers)
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        const cell = worksheet[cellAddress];

        if (!cell) continue;

        cell.s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "B9C98A" } }, // Olive Green
            alignment: { vertical: 'center', horizontal: 'center' }
        };
    }
}

/**
 * Mark read-only columns with gray background
 * @param {Object} worksheet - SheetJS worksheet object
 * @param {Array<number>} readOnlyColumns - Array of column indices
 */
function markReadOnlyColumns(worksheet, readOnlyColumns = []) {
    if (!worksheet || !worksheet['!ref']) return;

    const range = XLSX.utils.decode_range(worksheet['!ref']);

    readOnlyColumns.forEach(colIndex => {
        for (let R = range.s.r + 1; R <= range.e.r; ++R) { // Skip header
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: colIndex });
            const cell = worksheet[cellAddress];

            if (!cell) continue;

            cell.s = {
                fill: { fgColor: { rgb: "E0E0E0" } }, // Gray
                alignment: { horizontal: 'left' }
            };
        }
    });
}

// ==================== ERROR HANDLING ====================

/**
 * Create validation error object
 * @param {number} rowIndex - Row index (0-based)
 * @param {string} field - Field name with error
 * @param {string} message - Error message
 * @param {*} value - Invalid value
 * @returns {Object} Error object
 */
function createValidationError(rowIndex, field, message, value) {
    return {
        row: rowIndex + 2, // +2 because Excel is 1-based and has header row
        field,
        message,
        value: value || '(empty)',
        type: 'validation'
    };
}

/**
 * Create API error object
 * @param {number} rowIndex - Row index (0-based)
 * @param {string} message - Error message
 * @param {*} details - Additional error details
 * @returns {Object} Error object
 */
function createApiError(rowIndex, message, details) {
    return {
        row: rowIndex + 2,
        field: 'API',
        message,
        value: details || '',
        type: 'api'
    };
}

// ==================== EXPORTS ====================

// Export all utilities to global scope for use in other files
window.ExcelCommon = {
    // Constants
    VALID_STATUSES,
    COMMON_THEMES,
    COMMON_FOCUS_AREAS,
    SAMPLE_WARDS,

    // Array utilities
    arrayToSemicolon,
    semicolonToArray,

    // Validation utilities
    isValidEmail,
    isValidCoordinate,
    isValidStatus,
    parseCoordinate,

    // File utilities
    checkFileExists,
    parseFilePath,

    // Formatting utilities
    formatDate,
    sanitizeForExcel,
    truncateText,

    // Excel utilities
    autoSizeColumns,
    formatHeaders,
    markReadOnlyColumns,

    // Error handling
    createValidationError,
    createApiError
};

console.log('✅ Excel Common utilities loaded');
