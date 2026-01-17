// Communities CRUD Management

let communities = [];
let isEditing = false;
let editingId = null;
let wardMapping = null;
let locationMap = null;
let locationMarker = null;

// Require authentication and load data
(async function() {
    const session = await authUtils.requireAuth();
    if (!session) return;

    // Load ward mapping
    try {
        const response = await fetch('/assets/geodata/ward-mapping.json');
        wardMapping = await response.json();
        console.log('Loaded ward mapping');
    } catch (error) {
        console.warn('Could not load ward mapping:', error);
    }

    await loadCommunities();
    setupEventListeners();
})();

let currentStatusFilter = 'all';

async function loadCommunities() {
    const supabase = authUtils.supabase;

    let query = supabase
        .from('file_metadata')
        .select('*')
        .eq('file_type', 'community')
        .order('slug', { ascending: true });

    if (currentStatusFilter !== 'all') {
        query = query.eq('status', currentStatusFilter);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error loading communities:', error);
        document.getElementById('communitiesList').innerHTML = '<p class="error">Failed to load communities</p>';
        return;
    }

    communities = data || [];
    renderCommunities(communities);
}

function setStatusFilter(status, chipElement) {
    currentStatusFilter = status;

    // Update active chip
    document.querySelectorAll('.filter-chips .chip').forEach(chip => {
        chip.classList.remove('active');
    });
    chipElement.classList.add('active');

    // Reload communities
    loadCommunities();
}

function renderCommunities(comms) {
    const container = document.getElementById('communitiesList');

    if (comms.length === 0) {
        container.innerHTML = '<p class="empty-state">No communities found. Click "Add New" to create one.</p>';
        return;
    }

    container.innerHTML = comms.map(comm => {
        const name = comm.metadata?.name || comm.slug;
        const city = comm.metadata?.city || comm.city || 'City not specified';
        const state = comm.metadata?.state || '';

        // Display neighborhoods with "First +N" format
        const neighborhoods = comm.metadata?.neighborhoods ||
                             (comm.neighborhood ? [comm.neighborhood] : []);
        const neighborhoodDisplay = neighborhoods.length > 0
            ? neighborhoods[0] + (neighborhoods.length > 1 ? ` +${neighborhoods.length - 1}` : '')
            : '';

        // Display wards with "First +N" format
        const wards = comm.metadata?.wards || (comm.ward ? [comm.ward] : []);
        const wardDisplay = wards.length > 0
            ? wards[0] + (wards.length > 1 ? ` +${wards.length - 1}` : '')
            : '';

        const themes = comm.metadata?.themes || [];
        const themesText = Array.isArray(themes) ? themes.slice(0, 3).join(', ') : themes || '';
        const description = comm.metadata?.description || '';
        const truncatedDesc = description.length > 100 ? description.substring(0, 100) + '...' : description;

        // Check for missing data
        const missing = [];
        if (!comm.latitude || !comm.longitude) missing.push('Location');
        if (wards.length === 0) missing.push('Ward');
        if (neighborhoods.length === 0) missing.push('Neighborhood');
        if (!themes || themes.length === 0) missing.push('Themes');
        if (!description) missing.push('Description');

        const missingBadge = missing.length > 0 ?
            `<div class="org-meta">
                <span style="color: #f59e0b;">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Missing: ${missing.join(', ')}
                </span>
            </div>` : '';

        const statusIcon = comm.status === 'active' ? 'fa-circle-check' : comm.status === 'pending' ? 'fa-clock' : 'fa-circle';

        return `
            <div class="org-card minimal ${comm.status === 'pending' ? 'pending-highlight' : ''}">
                <div class="org-info">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                        <h3>${name}</h3>
                        <span class="status-indicator ${comm.status}">
                            <i class="fa-solid ${statusIcon}"></i>
                            ${comm.status}
                        </span>
                    </div>
                    ${themesText ? `<p style="color: #666; font-size: 0.875rem; margin-bottom: 0.5rem;">${themesText}</p>` : ''}
                    ${description ? `<p style="color: #888; font-size: 0.875rem; margin-bottom: 0.5rem;">${truncatedDesc}</p>` : ''}
                    <div class="org-meta">
                        ${city ? `<span><i class="fa-solid fa-location-dot"></i> ${city}${state ? ', ' + state : ''}</span>` : ''}
                        ${neighborhoodDisplay ? `<span><i class="fa-solid fa-house"></i> ${neighborhoodDisplay}</span>` : ''}
                        ${wardDisplay ? `<span><i class="fa-solid fa-map"></i> ${wardDisplay}</span>` : ''}
                    </div>
                    ${missingBadge}
                </div>
                <div class="card-actions">
                    <button class="mini-icon-btn view" title="View Details" onclick="viewCommunity('${comm.id}')">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="mini-icon-btn edit" title="Edit" onclick="editCommunity('${comm.id}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="mini-icon-btn delete" title="Delete" onclick="deleteCommunity('${comm.id}', '${name.replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    ${comm.status === 'pending' ?
                        `<button class="mini-icon-btn activate" title="Activate" onclick="updateStatus('${comm.id}', 'active')">
                            <i class="fa-solid fa-check"></i>
                        </button>` :
                        `<button class="mini-icon-btn deactivate" title="Deactivate" onclick="updateStatus('${comm.id}', 'inactive')">
                            <i class="fa-solid fa-ban"></i>
                        </button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

function matchNeighborhoodToWard(neighborhood) {
    if (!neighborhood || !wardMapping) return null;

    const normalized = neighborhood.toLowerCase().trim();

    // Try exact match first
    if (wardMapping.mapping[normalized]) {
        return wardMapping.mapping[normalized];
    }

    // Try partial match
    for (const [key, value] of Object.entries(wardMapping.mapping)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value;
        }
    }

    return null;
}

function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = communities.filter(comm => {
                const name = (comm.metadata?.name || '').toLowerCase();
                const city = (comm.metadata?.city || comm.city || '').toLowerCase();
                const themes = (comm.metadata?.themes || []).join(' ').toLowerCase();
                return name.includes(searchTerm) || city.includes(searchTerm) || themes.includes(searchTerm);
            });
            renderCommunities(filtered);
        });
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', loadCommunities);
    }

    // Form submission
    const communityForm = document.getElementById('communityForm');
    if (communityForm) {
        communityForm.addEventListener('submit', handleFormSubmit);
    } else {
        console.error('communityForm not found! Form submit handler not attached.');
    }

    // Auto-populate ward when neighborhood changes (initial setup)
    setupNeighborhoodWardAutofill();

    // Check if URL has ?action=new
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
        showCreateForm();
    }
}

function showCreateForm() {
    isEditing = false;
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Add Community';
    document.getElementById('communityForm').reset();
    document.getElementById('formModal').style.display = 'flex';

    // Initialize ward autocomplete
    setupWardAutocomplete();

    // Setup neighborhood-to-ward autofill
    setTimeout(() => {
        setupNeighborhoodWardAutofill();
    }, 50);

    // Initialize map
    setTimeout(() => {
        initLocationMap();
    }, 100);
}

async function editCommunity(id) {
    const comm = communities.find(c => c.id === id);
    if (!comm) return;

    isEditing = true;
    editingId = id;

    document.getElementById('modalTitle').textContent = 'Edit Community';
    document.getElementById('commId').value = comm.id;
    document.getElementById('commFilePath').value = comm.file_path;
    document.getElementById('commName').value = comm.metadata?.name || '';
    document.getElementById('commCity').value = comm.metadata?.city || comm.city || '';
    document.getElementById('commState').value = comm.metadata?.state || '';

    // Load neighborhoods - try plural first, fall back to singular for backward compatibility
    const neighborhoods = comm.metadata?.neighborhoods ||
                         (comm.neighborhood ? [comm.neighborhood] :
                         (comm.metadata?.neighborhood ? [comm.metadata.neighborhood] : []));
    document.getElementById('commNeighborhoods').value = neighborhoods.join('\n');

    // Load wards as chips - try plural first, fall back to singular
    const wards = comm.metadata?.wards ||
                 (comm.ward ? [comm.ward] : []);
    setSelectedWards(wards);

    document.getElementById('commDescription').value = comm.metadata?.description || '';
    document.getElementById('commPopulation').value = comm.metadata?.population || '';
    document.getElementById('commGeography').value = comm.metadata?.geography || '';
    document.getElementById('commThemes').value = (comm.metadata?.themes || comm.metadata?.focus_areas || []).join('\n');
    document.getElementById('commLeadOrg').value = comm.metadata?.lead_organization || '';
    document.getElementById('commLeadOrgName').value = comm.metadata?.lead_organization_name || '';
    document.getElementById('commContactPerson').value = comm.metadata?.contact?.person || '';
    document.getElementById('commContactEmail').value = comm.metadata?.contact?.email || '';
    document.getElementById('commContactPhone').value = comm.metadata?.contact?.phone || '';
    document.getElementById('commOffers').value = (comm.metadata?.offers || []).join('\n');
    document.getElementById('commAsks').value = (comm.metadata?.asks || []).join('\n');
    document.getElementById('commStories').value = comm.metadata?.stories || '';
    document.getElementById('commStatus').value = comm.status || 'active';
    document.getElementById('commCollabStatus').value = comm.metadata?.collaboration_status || '';
    document.getElementById('commStarted').value = comm.metadata?.started || '';
    document.getElementById('commLastUpdated').value = comm.metadata?.last_updated || '';
    document.getElementById('commLatitude').value = comm.latitude || '';
    document.getElementById('commLongitude').value = comm.longitude || '';

    // Populate Elected Representatives fields
    document.getElementById('commMlaName').value = comm.metadata?.elected_representatives?.mla?.name || comm.metadata?.mla?.name || '';
    document.getElementById('commMlaParty').value = comm.metadata?.elected_representatives?.mla?.party || comm.metadata?.mla?.party || '';
    document.getElementById('commMlaConstituency').value = comm.metadata?.elected_representatives?.mla?.constituency || comm.metadata?.mla?.constituency || '';

    document.getElementById('commMpName').value = comm.metadata?.elected_representatives?.mp?.name || '';
    document.getElementById('commMpParty').value = comm.metadata?.elected_representatives?.mp?.party || '';
    document.getElementById('commMpConstituency').value = comm.metadata?.elected_representatives?.mp?.constituency || '';

    document.getElementById('commCorporatorName').value = comm.metadata?.elected_representatives?.corporator?.name || '';
    document.getElementById('commCorporatorParty').value = comm.metadata?.elected_representatives?.corporator?.party || '';
    document.getElementById('commCorporatorWard').value = comm.metadata?.elected_representatives?.corporator?.ward || '';

    document.getElementById('formModal').style.display = 'flex';

    // Initialize ward autocomplete
    setupWardAutocomplete();

    // Setup neighborhood-to-ward autofill
    setTimeout(() => {
        setupNeighborhoodWardAutofill();
    }, 50);

    // Initialize map and set marker if coordinates exist
    setTimeout(() => {
        initLocationMap();
        if (comm.latitude && comm.longitude) {
            setLocation(comm.latitude, comm.longitude);
        }
    }, 100);
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const submitBtnLoader = document.getElementById('submitBtnLoader');

    submitBtn.disabled = true;
    submitBtnText.style.display = 'none';
    submitBtnLoader.style.display = 'inline-block';

    const name = document.getElementById('commName').value.trim();
    const city = document.getElementById('commCity').value.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Parse neighborhoods (one per line from textarea)
    const neighborhoods = document.getElementById('commNeighborhoods').value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s);

    // Get wards from chips (managed by chip functions)
    const wards = getSelectedWards();

    // For backward compatibility: store first value in singular fields
    const neighborhood = neighborhoods.length > 0 ? neighborhoods[0] : '';
    const ward = wards.length > 0 ? wards[0] : '';

    const contactPhone = document.getElementById('commContactPhone').value.trim();
    const stories = document.getElementById('commStories').value.trim();

    const metadata = {
        name: name,
        type: 'community',
        city: city,
        state: document.getElementById('commState').value.trim(),
        neighborhoods: neighborhoods,  // Array of neighborhoods
        wards: wards,                   // Array of wards
        description: document.getElementById('commDescription').value.trim(),
        population: document.getElementById('commPopulation').value.trim(),
        geography: document.getElementById('commGeography').value.trim(),
        themes: document.getElementById('commThemes').value.split('\n').map(s => s.trim()).filter(s => s),
        focus_areas: document.getElementById('commThemes').value.split('\n').map(s => s.trim()).filter(s => s),
        lead_organization: document.getElementById('commLeadOrg').value.trim(),
        lead_organization_name: document.getElementById('commLeadOrgName').value.trim(),
        contact: {
            person: document.getElementById('commContactPerson').value.trim(),
            email: document.getElementById('commContactEmail').value.trim(),
            phone: contactPhone
        },
        offers: document.getElementById('commOffers').value.split('\n').map(s => s.trim()).filter(s => s),
        asks: document.getElementById('commAsks').value.split('\n').map(s => s.trim()).filter(s => s),
        stories: stories || null,
        collaboration_status: document.getElementById('commCollabStatus').value.trim(),
        started: document.getElementById('commStarted').value,
        last_updated: new Date().toISOString().split('T')[0]
    };

    // Add Elected Representatives information
    const mlaName = document.getElementById('commMlaName').value.trim();
    const mlaParty = document.getElementById('commMlaParty').value.trim();
    const mlaConstituency = document.getElementById('commMlaConstituency').value.trim();
    const mpName = document.getElementById('commMpName').value.trim();
    const mpParty = document.getElementById('commMpParty').value.trim();
    const mpConstituency = document.getElementById('commMpConstituency').value.trim();
    const corporatorName = document.getElementById('commCorporatorName').value.trim();
    const corporatorParty = document.getElementById('commCorporatorParty').value.trim();
    const corporatorWard = document.getElementById('commCorporatorWard').value.trim();

    if (mlaName || mlaParty || mlaConstituency || mpName || mpParty || mpConstituency || corporatorName || corporatorParty || corporatorWard) {
        metadata.elected_representatives = {
            mla: {
                name: mlaName,
                party: mlaParty,
                constituency: mlaConstituency
            },
            mp: {
                name: mpName,
                party: mpParty,
                constituency: mpConstituency
            },
            corporator: {
                name: corporatorName,
                party: corporatorParty,
                ward: corporatorWard
            }
        };
    }

    const status = document.getElementById('commStatus').value;

    // Debug: Log raw field values before parsing
    const latFieldValue = document.getElementById('commLatitude').value;
    const lngFieldValue = document.getElementById('commLongitude').value;
    console.log('Form submit - Raw field values:', {
        latFieldValue,
        lngFieldValue,
        latFieldExists: !!document.getElementById('commLatitude'),
        lngFieldExists: !!document.getElementById('commLongitude')
    });

    const latitude = latFieldValue ? parseFloat(latFieldValue) : null;
    const longitude = lngFieldValue ? parseFloat(lngFieldValue) : null;
    const filePath = isEditing ? document.getElementById('commFilePath').value : `communities/${slug}.md`;

    console.log('Form submit - Parsed coordinates:', { latitude, longitude });

    // Add location coordinates to metadata (for frontmatter)
    if (latitude !== null && longitude !== null) {
        metadata.location = {
            latitude: latitude,
            longitude: longitude
        };
    }

    // Add status to metadata
    metadata.status = status;

    const supabase = authUtils.supabase;

    try {
        if (isEditing) {
            // Update existing using Edge Function (storage-first architecture)
            console.log('Updating via Edge Function:', { file_path: filePath, updates: metadata });

            // Get current session
            const { data: { session } } = await supabase.auth.getSession();
            console.log('Session status:', session ? 'active' : 'none');

            // Call Edge Function directly with fetch for better control
            const functionUrl = 'https://abblyaukkoxmgzwretvm.supabase.co/functions/v1/update-file';
            const headers = {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYmx5YXVra294bWd6d3JldHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzE4NTQsImV4cCI6MjA4MzgwNzg1NH0.neJmkUmGFPfXMC5PZNRhaXIGEefj_b79L_YceXl5jxU'
            };

            // Add auth token if session exists
            if (session) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    file_path: filePath,
                    file_type: 'community',
                    updates: metadata,
                    markdown_body: stories || ''
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Edge Function HTTP error:', response.status, errorText);
                throw new Error(`Edge Function returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Edge Function response:', data);

            if (data?.error) {
                throw new Error(data.error);
            }
        } else {
            // Create new - still use direct DB insert for now
            // TODO: Create Edge Function endpoint for new file creation
            const insertData = {
                file_path: filePath,
                file_type: 'community',
                slug: slug,
                city: city,
                neighborhood: neighborhood || null,
                status: status,
                metadata: metadata
            };

            if (latitude !== null) insertData.latitude = latitude;
            if (longitude !== null) insertData.longitude = longitude;

            // Ward already extracted above (first ward from chips)
            if (ward) insertData.ward = ward;

            const { error } = await supabase
                .from('file_metadata')
                .insert(insertData);

            if (error) throw error;
        }

        closeModal();
        await loadCommunities();
        alert(`✅ Community ${isEditing ? 'updated' : 'created'} successfully!`);
    } catch (error) {
        alert('❌ Error: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtnText.style.display = 'inline';
        submitBtnLoader.style.display = 'none';
    }
}

async function deleteCommunity(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
        return;
    }

    const supabase = authUtils.supabase;

    try {
        const { error } = await supabase
            .from('file_metadata')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await loadCommunities();
        alert('✅ Community deleted successfully!');
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

async function updateStatus(id, newStatus) {
    const supabase = authUtils.supabase;

    try {
        const { error } = await supabase
            .from('file_metadata')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) throw error;

        await loadCommunities();
    } catch (error) {
        alert('❌ Error updating status: ' + error.message);
    }
}

function closeModal() {
    document.getElementById('formModal').style.display = 'none';
    document.getElementById('communityForm').reset();
    isEditing = false;
    editingId = null;

    // Clean up map
    if (locationMap) {
        locationMap.remove();
        locationMap = null;
        locationMarker = null;
    }
}

// Populate ward dropdown
function populateWardDropdown() {
    const wardSelect = document.getElementById('commWard');
    if (!wardMapping || !wardMapping.wards) {
        console.warn('Ward mapping not loaded');
        return;
    }

    // Clear existing options except the first one
    wardSelect.innerHTML = '<option value="">Select Ward...</option>';

    // Add all wards as options
    wardMapping.wards.sort().forEach(ward => {
        const option = document.createElement('option');
        option.value = ward;
        option.textContent = ward;
        wardSelect.appendChild(option);
    });
}

// Story Editor Functions
function openStoryEditor() {
    const currentStory = document.getElementById('commStories').value;
    const storyModal = document.getElementById('storyModal');
    const storyEditor = document.getElementById('storyEditorText');

    storyEditor.value = currentStory;
    updateStoryPreview();
    storyModal.style.display = 'flex';

    // Setup live preview
    storyEditor.addEventListener('input', updateStoryPreview);
}

function updateStoryPreview() {
    const markdown = document.getElementById('storyEditorText').value;
    const preview = document.getElementById('storyPreview');

    if (!markdown.trim()) {
        preview.innerHTML = '<p style="color: #999; font-style: italic;">Preview will appear here...</p>';
        return;
    }

    // Use marked.js to parse markdown
    if (typeof marked !== 'undefined') {
        preview.innerHTML = marked.parse(markdown);
    } else {
        // Fallback to plain text if marked isn't loaded
        preview.innerHTML = '<pre>' + markdown + '</pre>';
    }
}

function saveStoryContent() {
    const storyContent = document.getElementById('storyEditorText').value;
    document.getElementById('commStories').value = storyContent;
    closeStoryEditor();
}

function closeStoryEditor() {
    const storyModal = document.getElementById('storyModal');
    storyModal.style.display = 'none';
}

// Map Picker Functions
function initLocationMap() {
    const mapContainer = document.getElementById('locationMap');
    if (!mapContainer) return;

    // Initialize map centered on Bangalore
    locationMap = L.map('locationMap').setView([12.9716, 77.5946], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(locationMap);

    // Click handler for placing marker
    locationMap.on('click', function(e) {
        setLocation(e.latlng.lat, e.latlng.lng);
    });

    // Fix map size after modal opens
    setTimeout(() => {
        locationMap.invalidateSize();
    }, 100);
}

function setLocation(lat, lng) {
    // Remove existing marker if any
    if (locationMarker) {
        locationMap.removeLayer(locationMarker);
    }

    // Add new marker
    locationMarker = L.marker([lat, lng], {
        draggable: true
    }).addTo(locationMap);

    // Update form fields
    const latField = document.getElementById('commLatitude');
    const lngField = document.getElementById('commLongitude');

    if (latField && lngField) {
        latField.value = lat;
        lngField.value = lng;
        console.log('Map picker - Set coordinates:', { lat, lng });
        console.log('Hidden fields after update:', {
            latValue: latField.value,
            lngValue: lngField.value
        });
    } else {
        console.error('Could not find hidden lat/lng fields!');
    }

    document.getElementById('currentCoords').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    // Handle marker drag
    locationMarker.on('dragend', function(e) {
        const newLatLng = e.target.getLatLng();
        latField.value = newLatLng.lat;
        lngField.value = newLatLng.lng;
        document.getElementById('currentCoords').textContent = `${newLatLng.lat.toFixed(6)}, ${newLatLng.lng.toFixed(6)}`;
        console.log('Map picker - Marker dragged to:', { lat: newLatLng.lat, lng: newLatLng.lng });
    });

    // Center map on marker
    locationMap.setView([lat, lng], 15);
}

function clearLocation() {
    if (locationMarker) {
        locationMap.removeLayer(locationMarker);
        locationMarker = null;
    }
    document.getElementById('commLatitude').value = '';
    document.getElementById('commLongitude').value = '';
    document.getElementById('currentCoords').textContent = 'No location set';
    locationMap.setView([12.9716, 77.5946], 12);
}

// View Community Details
function viewCommunity(id) {
    const comm = communities.find(c => c.id === id);
    if (!comm) return;

    const meta = comm.metadata || {};
    const name = meta.name || comm.slug;
    const city = meta.city || comm.city || '';
    const state = meta.state || '';
    const neighborhood = comm.neighborhood || meta.neighborhood || '';
    const themes = meta.themes || [];
    const description = meta.description || '';
    const contact = meta.contact || {};
    const offers = meta.offers || [];
    const asks = meta.asks || [];
    const stories = meta.stories || '';
    const population = meta.population || '';
    const geography = meta.geography || '';
    const leadOrg = meta.lead_organization_name || meta.lead_organization || '';
    const collabStatus = meta.collab_status || '';
    const elected_reps = meta.elected_representatives || {};

    // Update modal header
    document.getElementById('viewTitle').textContent = name;
    const statusIcon = comm.status === 'active' ? 'fa-circle-check' : comm.status === 'pending' ? 'fa-clock' : 'fa-circle';
    document.getElementById('viewStatus').innerHTML = `<i class="fa-solid ${statusIcon}"></i> ${comm.status}`;
    document.getElementById('viewStatus').className = `status-indicator ${comm.status}`;

    // Build view content
    let html = '';

    // Basic Info Section
    html += `
        <div class="detail-section">
            <h3 class="section-title">Basic Information</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">City</span>
                    <span class="detail-value">${city || '<span class="empty">Not specified</span>'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">State</span>
                    <span class="detail-value">${state || '<span class="empty">Not specified</span>'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Neighborhood</span>
                    <span class="detail-value">${neighborhood || '<span class="empty">Not specified</span>'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Ward</span>
                    <span class="detail-value">${comm.ward || '<span class="empty">Not specified</span>'}</span>
                </div>
                ${population ? `
                <div class="detail-item">
                    <span class="detail-label">Population</span>
                    <span class="detail-value">${population}</span>
                </div>` : ''}
                ${geography ? `
                <div class="detail-item">
                    <span class="detail-label">Geography</span>
                    <span class="detail-value">${geography}</span>
                </div>` : ''}
            </div>
            ${description ? `<p style="margin-top: 1rem; color: #555; line-height: 1.6;">${description}</p>` : ''}
        </div>
    `;

    // Location Section
    if (comm.latitude && comm.longitude) {
        html += `
            <div class="detail-section">
                <h3 class="section-title">Location</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Latitude</span>
                        <span class="detail-value">${comm.latitude}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Longitude</span>
                        <span class="detail-value">${comm.longitude}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Themes Section
    if (themes.length > 0) {
        html += `
            <div class="detail-section">
                <h3 class="section-title">Focus Areas / Themes</h3>
                <div class="tag-list">
                    ${themes.map(theme => `<span class="tag">${theme}</span>`).join('')}
                </div>
            </div>
        `;
    }

    // Elected Representatives
    if (elected_reps && Object.keys(elected_reps).length > 0) {
        html += `
            <div class="detail-section">
                <h3 class="section-title">Elected Representatives</h3>
        `;
        if (elected_reps.mla) {
            html += `
                <div style="margin-bottom: 1rem;">
                    <div style="font-weight: 600; color: #667eea; margin-bottom: 0.5rem;">MLA</div>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Name</span>
                            <span class="detail-value">${elected_reps.mla.name || '<span class="empty">Not specified</span>'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Party</span>
                            <span class="detail-value">${elected_reps.mla.party || '<span class="empty">Not specified</span>'}</span>
                        </div>
                        <div class="detail-item" style="grid-column: 1 / -1;">
                            <span class="detail-label">Constituency</span>
                            <span class="detail-value">${elected_reps.mla.constituency || '<span class="empty">Not specified</span>'}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        if (elected_reps.mp) {
            html += `
                <div style="margin-bottom: 1rem;">
                    <div style="font-weight: 600; color: #667eea; margin-bottom: 0.5rem;">MP</div>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Name</span>
                            <span class="detail-value">${elected_reps.mp.name || '<span class="empty">Not specified</span>'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Party</span>
                            <span class="detail-value">${elected_reps.mp.party || '<span class="empty">Not specified</span>'}</span>
                        </div>
                        <div class="detail-item" style="grid-column: 1 / -1;">
                            <span class="detail-label">Constituency</span>
                            <span class="detail-value">${elected_reps.mp.constituency || '<span class="empty">Not specified</span>'}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        if (elected_reps.corporator) {
            html += `
                <div>
                    <div style="font-weight: 600; color: #667eea; margin-bottom: 0.5rem;">Corporator</div>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Name</span>
                            <span class="detail-value">${elected_reps.corporator.name || '<span class="empty">Not specified</span>'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Party</span>
                            <span class="detail-value">${elected_reps.corporator.party || '<span class="empty">Not specified</span>'}</span>
                        </div>
                        <div class="detail-item" style="grid-column: 1 / -1;">
                            <span class="detail-label">Ward</span>
                            <span class="detail-value">${elected_reps.corporator.ward || '<span class="empty">Not specified</span>'}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        html += `</div>`;
    }

    // Lead Organization
    if (leadOrg) {
        html += `
            <div class="detail-section">
                <h3 class="section-title">Lead Organization</h3>
                <div class="detail-grid">
                    <div class="detail-item" style="grid-column: 1 / -1;">
                        <span class="detail-value">${leadOrg}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Contact Section
    if (contact && (contact.person || contact.email || contact.phone)) {
        html += `
            <div class="detail-section">
                <h3 class="section-title">Contact Information</h3>
                <div class="detail-grid">
                    ${contact.person ? `
                    <div class="detail-item">
                        <span class="detail-label">Contact Person</span>
                        <span class="detail-value">${contact.person}</span>
                    </div>` : ''}
                    ${contact.email ? `
                    <div class="detail-item">
                        <span class="detail-label">Email</span>
                        <span class="detail-value"><a href="mailto:${contact.email}">${contact.email}</a></span>
                    </div>` : ''}
                    ${contact.phone ? `
                    <div class="detail-item">
                        <span class="detail-label">Phone</span>
                        <span class="detail-value"><a href="tel:${contact.phone}">${contact.phone}</a></span>
                    </div>` : ''}
                </div>
            </div>
        `;
    }

    // Offers Section
    if (offers.length > 0) {
        html += `
            <div class="detail-section">
                <h3 class="section-title">What They Offer</h3>
                <ul style="margin: 0; padding-left: 1.5rem;">
                    ${offers.map(offer => `<li style="margin-bottom: 0.5rem;">${offer}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Asks Section
    if (asks.length > 0) {
        html += `
            <div class="detail-section">
                <h3 class="section-title">What They Need</h3>
                <ul style="margin: 0; padding-left: 1.5rem;">
                    ${asks.map(ask => `<li style="margin-bottom: 0.5rem;">${ask}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Stories Section (Markdown formatted)
    if (stories && stories.trim()) {
        html += `
            <div class="detail-section">
                <h3 class="section-title">Stories & Impact</h3>
                <div class="markdown-content">
                    ${typeof marked !== 'undefined' ? marked.parse(stories) : '<pre>' + stories + '</pre>'}
                </div>
            </div>
        `;
    }

    // Collaboration Status
    if (collabStatus) {
        html += `
            <div class="detail-section">
                <h3 class="section-title">Collaboration Status</h3>
                <div class="detail-value">${collabStatus}</div>
            </div>
        `;
    }

    document.getElementById('viewBody').innerHTML = html;
    document.getElementById('viewModal').style.display = 'flex';
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}

// BBMP Wards List (Complete list of all 243 wards + 15 upcoming wards)
const BBMP_WARDS = [
    "Ward 1 - Yeshwanthpura",
    "Ward 2 - Doddabommasandra",
    "Ward 3 - Vishwanathapura",
    "Ward 4 - Nagashettyhalli",
    "Ward 5 - Chowdeshwari",
    "Ward 6 - Laggere",
    "Ward 7 - Radhakrishna Temple",
    "Ward 8 - Nandini Layout",
    "Ward 9 - Peenya Industrial Area",
    "Ward 10 - Lakshmi Devi Nagar",
    "Ward 11 - Peenya",
    "Ward 12 - Jalahalli",
    "Ward 13 - Radhakrishna Nagar",
    "Ward 14 - Kodigehalli",
    "Ward 15 - Vidyaranyapura",
    "Ward 16 - Dodda Bommasandra",
    "Ward 17 - Kuvempu Layout",
    "Ward 18 - Hebbal",
    "Ward 19 - Vishwanath Nagenahalli",
    "Ward 20 - Nagavara",
    "Ward 21 - HBR Layout",
    "Ward 22 - Horamavu",
    "Ward 23 - Ramamurthy Nagar",
    "Ward 24 - Banasavadi",
    "Ward 25 - Kammanahalli",
    "Ward 26 - Kacharkanahalli",
    "Ward 27 - Kadugondanahalli",
    "Ward 28 - Kushal Nagar",
    "Ward 29 - Kaval Byrasandra",
    "Ward 30 - Jayachamarajapura",
    "Ward 31 - Manorayanapalya",
    "Ward 32 - Ganganagar",
    "Ward 33 - Sagayapura",
    "Ward 34 - Shantala Nagar",
    "Ward 35 - Bharathi Nagar",
    "Ward 36 - Pulakeshi Nagar",
    "Ward 37 - Sarvagnanagar",
    "Ward 38 - DJ Halli",
    "Ward 39 - Varthuru",
    "Ward 40 - Maruthi Seva Nagar",
    "Ward 41 - Benniganahalli",
    "Ward 42 - Vannarpet",
    "Ward 43 - R.T. Nagar",
    "Ward 44 - Malleshwaram",
    "Ward 45 - Jayamahal",
    "Ward 46 - Rajaji Nagar",
    "Ward 47 - Prakashnagar",
    "Ward 48 - Basaveshwara Nagar",
    "Ward 49 - Rajaji Nagar(CMC)",
    "Ward 50 - Kaveripura",
    "Ward 51 - Govindaraja Nagar",
    "Ward 52 - Subramanya Nagar",
    "Ward 53 - Atturu",
    "Ward 54 - Chikka Banaswadi",
    "Ward 55 - Muneshwara Nagar",
    "Ward 56 - Pattabhirama Nagar",
    "Ward 57 - Nagarabhavi",
    "Ward 58 - Herohalli",
    "Ward 59 - Kottegepalya",
    "Ward 60 - Kengeri",
    "Ward 61 - RajaRajeshwari Nagar",
    "Ward 62 - Hosahalli",
    "Ward 63 - Giri Nagar",
    "Ward 64 - Katriguppe",
    "Ward 65 - Viswaneedam",
    "Ward 66 - Srinagar",
    "Ward 67 - Pattanagere",
    "Ward 68 - Chandra Layout",
    "Ward 69 - Shrinivasa Nagar",
    "Ward 70 - Banasavadi",
    "Ward 71 - Yediyur",
    "Ward 72 - Pattanagere",
    "Ward 73 - Rajarajeshwari Nagar",
    "Ward 74 - Uttarahalli",
    "Ward 75 - Kengeri Satellite Town",
    "Ward 76 - Jaraganahalli",
    "Ward 77 - Puttenahalli",
    "Ward 78 - Bilekhalli",
    "Ward 79 - Ganesha Mandira",
    "Ward 80 - Koramangala",
    "Ward 81 - Adugodi",
    "Ward 82 - Eajipura",
    "Ward 83 - Varthuru",
    "Ward 84 - Hongasandra",
    "Ward 85 - Bommanahalli",
    "Ward 86 - Arekere",
    "Ward 87 - Madiwala",
    "Ward 88 - BTM Layout",
    "Ward 89 - Koramangala",
    "Ward 90 - Hombe Gowda Nagar",
    "Ward 91 - JP Nagar",
    "Ward 92 - Sarakki",
    "Ward 93 - Shakambari Nagar",
    "Ward 94 - Banashankari Temple",
    "Ward 95 - Kumaraswamy Layout",
    "Ward 96 - Padmanabha Nagar",
    "Ward 97 - Chickpet",
    "Ward 98 - Shanthinagar",
    "Ward 99 - Sudham Nagar",
    "Ward 100 - Dharmaraja Koil",
    "Ward 101 - Vishveshwara Puram",
    "Ward 102 - Bhashyam Circle",
    "Ward 103 - Basavanagudi",
    "Ward 104 - Hanumanth Nagar",
    "Ward 105 - Sri Nagar",
    "Ward 106 - Katriguppe",
    "Ward 107 - Jayanagar",
    "Ward 108 - Vikasa Soudha",
    "Ward 109 - Jayanagar East",
    "Ward 110 - Gurappana Palya",
    "Ward 111 - Madivala",
    "Ward 112 - Jayanagar",
    "Ward 113 - Ragigudda",
    "Ward 114 - HSR Layout",
    "Ward 115 - Bommanahalli",
    "Ward 116 - Arakere Mico Layout",
    "Ward 117 - BTM Layout",
    "Ward 118 - Koramangala",
    "Ward 119 - Koramangala 4th Block",
    "Ward 120 - Shanthi Nagar",
    "Ward 121 - Jogupalya",
    "Ward 122 - Halsuru",
    "Ward 123 - Ulsoor",
    "Ward 124 - Bharathi Nagar",
    "Ward 125 - Shivaji Nagar",
    "Ward 126 - Vasanth Nagar",
    "Ward 127 - Gandhinagar",
    "Ward 128 - Subhash Nagar",
    "Ward 129 - Okalipuram",
    "Ward 130 - Yeshwanthpura",
    "Ward 131 - TP Kere",
    "Ward 132 - Goraguntepalya",
    "Ward 133 - Seshadripuram",
    "Ward 134 - Mahalakshmipuram",
    "Ward 135 - Rajajinagar",
    "Ward 136 - Malleshwaram",
    "Ward 137 - Gayathri Nagar",
    "Ward 138 - Aramane Nagar",
    "Ward 139 - Mathikere",
    "Ward 140 - Yeshwanthpura",
    "Ward 141 - Marappana Palya",
    "Ward 142 - Mallasandra",
    "Ward 143 - Nandini Layout",
    "Ward 144 - Sanjaynagar",
    "Ward 145 - Ganga Nagar",
    "Ward 146 - RT Nagar",
    "Ward 147 - Jayachamarajapuram",
    "Ward 148 - Kaval Byrasandra",
    "Ward 149 - Pulikeshinagar",
    "Ward 150 - Sri Rama Mandir",
    "Ward 151 - Domlur",
    "Ward 152 - Koramangala",
    "Ward 153 - Agara",
    "Ward 154 - Vannar Pet",
    "Ward 155 - Nilasandra",
    "Ward 156 - Shanthi Nagar",
    "Ward 157 - Sudham Nagar",
    "Ward 158 - Hosahalii",
    "Ward 159 - Amruthnagar",
    "Ward 160 - Hoysala Nagar",
    "Ward 161 - Lakkasandra",
    "Ward 162 - Adugodi",
    "Ward 163 - Ejipura",
    "Ward 164 - Neelasandra",
    "Ward 165 - Konena Agrahara",
    "Ward 166 - Shanthi Nagar",
    "Ward 167 - Dharmarajakoil",
    "Ward 168 - Channasandra",
    "Ward 169 - Kadugodi",
    "Ward 170 - Hagadur",
    "Ward 171 - Doddanekundi",
    "Ward 172 - Marathahalli",
    "Ward 173 - HAL Airport",
    "Ward 174 - Jeevan Bhima Nagar",
    "Ward 175 - Jogupalya",
    "Ward 176 - Halsoor",
    "Ward 177 - Bharathinagar",
    "Ward 178 - Shivaji Nagar",
    "Ward 179 - Vasanthanagar",
    "Ward 180 - Gandhi Nagar",
    "Ward 181 - Subhash Nagar",
    "Ward 182 - Cleveland Town",
    "Ward 183 - Shreeram Nagar",
    "Ward 184 - Ayappa Swamy Temple",
    "Ward 185 - Binnamangala",
    "Ward 186 - Bapuji Nagar",
    "Ward 187 - Kodichikkanhalli",
    "Ward 188 - Hudi",
    "Ward 189 - Singasandra",
    "Ward 190 - Begur",
    "Ward 191 - Arakere Mico Layout",
    "Ward 192 - Gottigere",
    "Ward 193 - Konankunte",
    "Ward 194 - Anjanpura",
    "Ward 195 - Vasanthpura",
    "Ward 196 - Marenahalli",
    "Ward 197 - Kalkere",
    "Ward 198 - Varthuru",
    "Ward 199 - Bellanduru",
    "Ward 200 - Koramangala",
    "Ward 201 - Agara",
    "Ward 202 - Hongasandra",
    "Ward 203 - Mangammanapalya",
    "Ward 204 - Singasandra",
    "Ward 205 - Begur",
    "Ward 206 - Bommanahalli",
    "Ward 207 - Koramangala 1st Block",
    "Ward 208 - Jakkasandra",
    "Ward 209 - HSR Layout",
    "Ward 210 - Bannerghatta",
    "Ward 211 - JP Nagar",
    "Ward 212 - Puttenahalli",
    "Ward 213 - Chikkalsandra",
    "Ward 214 - Uttarahalli",
    "Ward 215 - Yelachenahalli",
    "Ward 216 - Jaraganahalli",
    "Ward 217 - Rajarajeshwari Nagar",
    "Ward 218 - Kengeri",
    "Ward 219 - Jnana Bharathi",
    "Ward 220 - JP Park",
    "Ward 221 - Banashankari 2nd Stage",
    "Ward 222 - Kumaraswamy Layout",
    "Ward 223 - Padmanabhanagar",
    "Ward 224 - Chikkallasandra",
    "Ward 225 - Uttarahalli",
    "Ward 226 - Yelachenahalli",
    "Ward 227 - Kathriguppe",
    "Ward 228 - Thalaghattapura",
    "Ward 229 - Konanakunte",
    "Ward 230 - Anjanapura",
    "Ward 231 - Bangalore University",
    "Ward 232 - Yeshwanthpura",
    "Ward 233 - Nagashettyhalli",
    "Ward 234 - Makali",
    "Ward 235 - Dodda Bommasandra",
    "Ward 236 - JP Nagar",
    "Ward 237 - Padmanabhanagar",
    "Ward 238 - Banashankari Temple Ward",
    "Ward 239 - Sri Nagar",
    "Ward 240 - Kalkere",
    "Ward 241 - Hongasandra",
    "Ward 242 - Bommanahalli",
    "Ward 243 - Koramangala",
    "New Ward 1 - Anekal (Upcoming)",
    "New Ward 2 - Bommasandra (Upcoming)",
    "New Ward 3 - Sarjapur (Upcoming)",
    "New Ward 4 - Jigani (Upcoming)",
    "New Ward 5 - Attibele (Upcoming)",
    "New Ward 6 - Hennagara (Upcoming)",
    "New Ward 7 - Ragihalli (Upcoming)",
    "New Ward 8 - Kasavanahalli (Upcoming)",
    "New Ward 9 - Deverabi Sana Halli (Upcoming)",
    "New Ward 10 - Kaggalipura (Upcoming)",
    "New Ward 11 - Harohalli (Upcoming)",
    "New Ward 12 - Haragadde (Upcoming)",
    "New Ward 13 - Kalkere (Upcoming)",
    "New Ward 14 - Avalahalli (Upcoming)",
    "New Ward 15 - Chandapura (Upcoming)"
];

// Ward Chips State and Management Functions
let selectedWards = [];

// Add ward chip
function addWardChip(ward) {
    // Check for duplicates
    if (selectedWards.includes(ward)) {
        return;
    }

    selectedWards.push(ward);
    renderWardChips();

    // Clear autocomplete input
    const wardInput = document.getElementById('commWardInput');
    if (wardInput) {
        wardInput.value = '';
    }

    // Load elected representatives for first ward
    if (selectedWards.length === 1) {
        loadElectedRepresentatives(ward);
    }
}

// Remove ward chip
function removeWardChip(ward) {
    selectedWards = selectedWards.filter(w => w !== ward);
    renderWardChips();

    // If removed the first ward, reload representatives for new first ward
    if (selectedWards.length > 0) {
        loadElectedRepresentatives(selectedWards[0]);
    }
}

// Render ward chips HTML
function renderWardChips() {
    const container = document.getElementById('commWardChips');
    if (!container) return;

    if (selectedWards.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = selectedWards.map(ward => `
        <div class="ward-chip">
            <span>${ward}</span>
            <button type="button" onclick="removeWardChip('${ward.replace(/'/g, "\\'")}')">×</button>
        </div>
    `).join('');
}

// Get wards array (for form submission)
function getSelectedWards() {
    return selectedWards;
}

// Set wards array (for form loading)
function setSelectedWards(wards) {
    selectedWards = wards || [];
    renderWardChips();
}

// Ward Autocomplete functionality
let wardAutocomplete = {
    input: null,
    dropdown: null,
    filtered: [],
    selectedIndex: -1
};

function setupWardAutocomplete() {
    wardAutocomplete.input = document.getElementById('commWard');
    wardAutocomplete.dropdown = document.getElementById('wardDropdown');

    if (!wardAutocomplete.input || !wardAutocomplete.dropdown) return;

    // Input event
    wardAutocomplete.input.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase().trim();

        if (!query) {
            wardAutocomplete.dropdown.style.display = 'none';
            return;
        }

        // Filter wards
        wardAutocomplete.filtered = BBMP_WARDS.filter(ward =>
            ward.toLowerCase().includes(query)
        );

        if (wardAutocomplete.filtered.length === 0) {
            wardAutocomplete.dropdown.innerHTML = '<div class="autocomplete-no-results">No wards found</div>';
            wardAutocomplete.dropdown.style.display = 'block';
            return;
        }

        // Render dropdown
        wardAutocomplete.dropdown.innerHTML = wardAutocomplete.filtered
            .slice(0, 10) // Show max 10 results
            .map((ward, index) => `
                <div class="autocomplete-item" data-index="${index}" data-ward="${ward}">
                    ${ward.replace(new RegExp(query, 'gi'), match => `<strong>${match}</strong>`)}
                </div>
            `)
            .join('');

        wardAutocomplete.dropdown.style.display = 'block';
        wardAutocomplete.selectedIndex = -1;

        // Click handlers for items
        wardAutocomplete.dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', function() {
                selectWard(this.dataset.ward);
            });
            item.addEventListener('mouseenter', function() {
                wardAutocomplete.selectedIndex = parseInt(this.dataset.index);
                updateActiveItem();
            });
        });
    });

    // Keyboard navigation
    wardAutocomplete.input.addEventListener('keydown', function(e) {
        if (!wardAutocomplete.dropdown.style.display || wardAutocomplete.dropdown.style.display === 'none') return;

        const items = wardAutocomplete.dropdown.querySelectorAll('.autocomplete-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            wardAutocomplete.selectedIndex = Math.min(wardAutocomplete.selectedIndex + 1, items.length - 1);
            updateActiveItem();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            wardAutocomplete.selectedIndex = Math.max(wardAutocomplete.selectedIndex - 1, 0);
            updateActiveItem();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (wardAutocomplete.selectedIndex >= 0 && items[wardAutocomplete.selectedIndex]) {
                selectWard(items[wardAutocomplete.selectedIndex].dataset.ward);
            }
        } else if (e.key === 'Escape') {
            wardAutocomplete.dropdown.style.display = 'none';
        }
    });

    // Click outside to close
    document.addEventListener('click', function(e) {
        if (e.target !== wardAutocomplete.input && !wardAutocomplete.dropdown.contains(e.target)) {
            wardAutocomplete.dropdown.style.display = 'none';
        }
    });
}

function updateActiveItem() {
    const items = wardAutocomplete.dropdown.querySelectorAll('.autocomplete-item');
    items.forEach((item, index) => {
        if (index === wardAutocomplete.selectedIndex) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('active');
        }
    });
}

function selectWard(ward) {
    wardAutocomplete.input.value = ward;
    wardAutocomplete.dropdown.style.display = 'none';

    // Trigger elected representatives lookup when ward is selected
    loadElectedRepresentatives(ward);
}

// Neighborhood-to-Ward and Elected Representatives Autofill
function setupNeighborhoodWardAutofill() {
    const neighborhoodField = document.getElementById('commNeighborhood');
    if (!neighborhoodField) return;

    // Remove any existing listeners to avoid duplicates
    const newNeighborhoodField = neighborhoodField.cloneNode(true);
    neighborhoodField.parentNode.replaceChild(newNeighborhoodField, neighborhoodField);

    newNeighborhoodField.addEventListener('blur', function() {
        const neighborhood = this.value.trim();
        const wardField = document.getElementById('commWard');

        if (neighborhood && wardField) {
            const ward = matchNeighborhoodToWard(neighborhood);
            if (ward) {
                // Set the ward value in the input field
                wardField.value = ward;
                console.log(`Auto-populated ward: ${ward} for neighborhood: ${neighborhood}`);

                // Also trigger elected representatives lookup
                loadElectedRepresentatives(ward);
            }
        }
    });

    // Also add listener to ward field to lookup elected representatives
    const wardField = document.getElementById('commWard');
    if (wardField) {
        const newWardField = wardField.cloneNode(true);
        wardField.parentNode.replaceChild(newWardField, wardField);

        newWardField.addEventListener('blur', function() {
            const ward = this.value.trim();
            if (ward) {
                loadElectedRepresentatives(ward);
            }
        });

        // Re-setup autocomplete since we cloned the field
        setTimeout(() => setupWardAutocomplete(), 0);
    }
}

// Load elected representatives based on ward
async function loadElectedRepresentatives(ward) {
    if (!ward) return;

    console.log(`Looking up elected representatives for ward: ${ward}`);

    try {
        // Try to load elected representatives mapping
        const response = await fetch('/assets/geodata/elected-representatives.json');
        if (!response.ok) {
            console.log('Elected representatives mapping not found - will need to be populated manually');
            return;
        }

        const electrepsData = await response.json();
        const normalized = ward.toLowerCase().trim();

        // Try to find a match
        const reps = electrepsData[ward] || electrepsData[normalized];

        if (reps) {
            // Populate MLA fields
            if (reps.mla) {
                const mlaNameField = document.getElementById('commMlaName');
                const mlaPartyField = document.getElementById('commMlaParty');
                const mlaConstituencyField = document.getElementById('commMlaConstituency');

                if (mlaNameField && !mlaNameField.value) mlaNameField.value = reps.mla.name || '';
                if (mlaPartyField && !mlaPartyField.value) mlaPartyField.value = reps.mla.party || '';
                if (mlaConstituencyField && !mlaConstituencyField.value) mlaConstituencyField.value = reps.mla.constituency || '';
            }

            // Populate MP fields
            if (reps.mp) {
                const mpNameField = document.getElementById('commMpName');
                const mpPartyField = document.getElementById('commMpParty');
                const mpConstituencyField = document.getElementById('commMpConstituency');

                if (mpNameField && !mpNameField.value) mpNameField.value = reps.mp.name || '';
                if (mpPartyField && !mpPartyField.value) mpPartyField.value = reps.mp.party || '';
                if (mpConstituencyField && !mpConstituencyField.value) mpConstituencyField.value = reps.mp.constituency || '';
            }

            // Populate Corporator fields
            if (reps.corporator) {
                const corpNameField = document.getElementById('commCorporatorName');
                const corpPartyField = document.getElementById('commCorporatorParty');
                const corpWardField = document.getElementById('commCorporatorWard');

                if (corpNameField && !corpNameField.value) corpNameField.value = reps.corporator.name || '';
                if (corpPartyField && !corpPartyField.value) corpPartyField.value = reps.corporator.party || '';
                if (corpWardField && !corpWardField.value) corpWardField.value = reps.corporator.ward || ward;
            }

            console.log('Auto-populated elected representatives:', reps);
        } else {
            console.log(`No elected representatives data found for ward: ${ward}`);
        }
    } catch (error) {
        console.log('Could not load elected representatives:', error.message);
    }
}
