/**
 * NOTF-CMS API Client
 * Handles complaint submission to notf-cms backend
 * Supports Supabase direct insert and HTTP API endpoints
 */

class NotfCmsApi {
    constructor() {
        // API Configuration
        this.apiBaseUrl = 'https://notf-cms.vercel.app/api';
        this.supabaseUrl = 'https://abblyaukkoxmgzwretvm.supabase.co';
        this.supabaseAnonKey = null; // Will be loaded from environment or injected

        // Submission mode: 'api' or 'supabase'
        this.submissionMode = 'api'; // Default to API mode (more robust)
    }

    /**
     * Submit complaint to notf-cms
     * Returns: { success, complaint_number, message } or { success: false, error }
     */
    async submitComplaint(complaintData) {
        if (this.submissionMode === 'api') {
            return await this.submitViaApi(complaintData);
        } else {
            return await this.submitViaSupabase(complaintData);
        }
    }

    /**
     * Submit complaint via HTTP API (recommended)
     */
    async submitViaApi(complaintData) {
        try {
            const formattedData = this.formatForApi(complaintData);
            console.log('[API] Sending complaint data:', formattedData);

            const response = await fetch(`${this.apiBaseUrl}/submit-complaint`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': window.location.origin
                },
                body: JSON.stringify(formattedData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
            }

            const result = await response.json();

            return {
                success: true,
                complaint_number: result.complaint_number || result.id,
                complaint_id: result.id,
                message: result.message || 'Complaint submitted successfully',
                tracking_url: result.tracking_url || null,
                data: result
            };
        } catch (error) {
            console.error('API submission error:', error);

            // Check if it's a network error or CORS issue
            if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
                return {
                    success: false,
                    error: 'network_error',
                    message: 'Unable to connect to server. Please check your internet connection and try again.',
                    details: error.message
                };
            }

            return {
                success: false,
                error: 'submission_failed',
                message: error.message || 'Failed to submit complaint. Please try again.',
                details: error.message
            };
        }
    }

    /**
     * Submit complaint directly to Supabase (fallback)
     */
    async submitViaSupabase(complaintData) {
        try {
            // Check if Supabase client is available
            if (typeof supabase === 'undefined' || !supabase) {
                throw new Error('Supabase client not initialized');
            }

            const formattedData = this.formatForSupabase(complaintData);

            const { data, error } = await supabase
                .from('complaints')
                .insert([formattedData])
                .select()
                .single();

            if (error) {
                throw new Error(error.message);
            }

            return {
                success: true,
                complaint_number: data.complaint_number,
                complaint_id: data.id,
                message: 'Complaint submitted successfully',
                data
            };
        } catch (error) {
            console.error('Supabase submission error:', error);

            return {
                success: false,
                error: 'supabase_error',
                message: error.message || 'Failed to submit complaint via Supabase.',
                details: error.message
            };
        }
    }

    /**
     * Format complaint data for API submission
     */
    formatForApi(complaint) {
        const formatted = {
            description: complaint.description,
            category_id: complaint.category_id,

            // Location
            address: complaint.location.address,
            latitude: complaint.location.latitude,
            longitude: complaint.location.longitude,
            city: complaint.location.city,

            // Metadata
            metadata: complaint.metadata
        };

        // Add optional location fields only if they have values
        if (complaint.location.corporation_code) {
            formatted.corporation_code = complaint.location.corporation_code;
        }
        if (complaint.location.corporation_id) {
            formatted.corporation_id = complaint.location.corporation_id;
        }
        if (complaint.location.ward) {
            formatted.ward = complaint.location.ward;
        }
        if (complaint.location.wardNumber) {
            formatted.ward_number = complaint.location.wardNumber;
        }

        // Contact - only add if they have values (not null/undefined/empty)
        if (complaint.contact.phone) {
            formatted.phone = complaint.contact.phone;
        }
        if (complaint.contact.email) {
            formatted.email = complaint.contact.email;
        }
        if (complaint.contact.name) {
            formatted.name = complaint.contact.name;
        }

        // Photo (base64 or file)
        if (complaint.photo) {
            formatted.photo = complaint.photo;
        }

        return formatted;
    }

    /**
     * Format complaint data for direct Supabase insert
     */
    formatForSupabase(complaint) {
        return {
            description: complaint.description,
            category_id: complaint.category_id,

            // Location
            address: complaint.location.address,
            latitude: complaint.location.latitude,
            longitude: complaint.location.longitude,
            city: complaint.location.city,
            corporation_code: complaint.location.corporation_code,
            corporation_id: complaint.location.corporation_id,
            ward: complaint.location.ward,
            ward_number: complaint.location.wardNumber,

            // Contact
            phone: complaint.contact.phone,
            email: complaint.contact.email,
            reporter_name: complaint.contact.name,

            // Status
            status: 'new',

            // Metadata
            metadata: complaint.metadata,

            // Timestamps handled by database
            created_at: new Date().toISOString()
        };
    }

    /**
     * Upload photo to Supabase Storage
     */
    async uploadPhoto(file, complaintId) {
        try {
            if (typeof supabase === 'undefined') {
                throw new Error('Supabase client not available');
            }

            const fileName = `${complaintId}/${Date.now()}-${file.name}`;

            const { data, error } = await supabase.storage
                .from('notf-cms')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            return {
                success: true,
                file_path: data.path,
                file_name: file.name,
                file_size: file.size,
                file_type: file.type
            };
        } catch (error) {
            console.error('Photo upload error:', error);

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check API health
     */
    async checkApiHealth() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`, {
                method: 'GET',
                headers: {
                    'Origin': window.location.origin
                }
            });

            if (!response.ok) {
                return { healthy: false, mode: 'unavailable' };
            }

            const data = await response.json();

            return {
                healthy: true,
                mode: 'api',
                version: data.version || 'unknown'
            };
        } catch (error) {
            console.warn('API health check failed:', error.message);

            // Fall back to Supabase mode
            if (typeof supabase !== 'undefined') {
                return {
                    healthy: true,
                    mode: 'supabase',
                    fallback: true
                };
            }

            return {
                healthy: false,
                mode: 'unavailable',
                error: error.message
            };
        }
    }

    /**
     * Get complaint tracking info
     */
    async getComplaintStatus(complaintNumber) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/track/${complaintNumber}`, {
                method: 'GET',
                headers: {
                    'Origin': window.location.origin
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Tracking error:', error);

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Set submission mode
     */
    setSubmissionMode(mode) {
        if (mode !== 'api' && mode !== 'supabase') {
            throw new Error('Invalid submission mode. Use "api" or "supabase"');
        }

        this.submissionMode = mode;
    }

    /**
     * Configure Supabase client
     */
    configureSupabase(url, anonKey) {
        this.supabaseUrl = url;
        this.supabaseAnonKey = anonKey;
    }
}
