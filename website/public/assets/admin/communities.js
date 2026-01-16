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

async function loadCommunities() {
    const supabase = authUtils.supabase;
    const statusFilter = document.getElementById('statusFilter').value;

    let query = supabase
        .from('file_metadata')
        .select('*')
        .eq('file_type', 'community')
        .order('updated_at', { ascending: false });

    if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
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

function renderCommunities(comms) {
    const container = document.getElementById('communitiesList');

    if (comms.length === 0) {
        container.innerHTML = '<p class="empty-state">No communities found. Click "Add New" to create one.</p>';
        return;
    }

    container.innerHTML = comms.map(comm => {
        const name = comm.metadata?.name || comm.slug;
        const city = comm.metadata?.city || comm.city || 'City not specified';
        const themes = comm.metadata?.themes || [];
        const themesText = Array.isArray(themes) ? themes.join(', ') : themes || 'No themes specified';
        const description = comm.metadata?.description || '';
        const truncatedDesc = description.length > 150 ? description.substring(0, 150) + '...' : description;

        return `
            <div class="org-card">
                <div class="org-header">
                    <h3>${name}</h3>
                    <span class="status-badge status-${comm.status}">${comm.status}</span>
                </div>
                <div class="org-body">
                    <p class="org-theme">${themesText}</p>
                    <p class="org-location">📍 ${city}</p>
                    ${description ? `<p class="org-description">${truncatedDesc}</p>` : ''}
                </div>
                <div class="org-footer">
                    <button onclick="editCommunity('${comm.id}')" class="btn-sm btn-secondary">✏️ Edit</button>
                    <button onclick="deleteCommunity('${comm.id}', '${name.replace(/'/g, "\\\'")}')" class="btn-sm btn-danger">🗑️ Delete</button>
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
    document.getElementById('searchInput').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = communities.filter(comm => {
            const name = (comm.metadata?.name || '').toLowerCase();
            const city = (comm.metadata?.city || comm.city || '').toLowerCase();
            const themes = (comm.metadata?.themes || []).join(' ').toLowerCase();
            return name.includes(searchTerm) || city.includes(searchTerm) || themes.includes(searchTerm);
        });
        renderCommunities(filtered);
    });

    // Status filter
    document.getElementById('statusFilter').addEventListener('change', loadCommunities);

    // Form submission
    document.getElementById('communityForm').addEventListener('submit', handleFormSubmit);

    // Auto-populate ward when neighborhood changes
    document.getElementById('commNeighborhood').addEventListener('blur', function() {
        const neighborhood = this.value.trim();
        const wardSelect = document.getElementById('commWard');

        if (neighborhood && wardSelect) {
            const ward = matchNeighborhoodToWard(neighborhood);
            if (ward) {
                // Set the selected option in the dropdown
                wardSelect.value = ward;
            }
        }
    });

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
    populateWardDropdown();
    document.getElementById('formModal').style.display = 'flex';

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
    document.getElementById('commNeighborhood').value = comm.neighborhood || comm.metadata?.neighborhood || '';

    // Populate ward dropdown and set current value
    populateWardDropdown();
    document.getElementById('commWard').value = comm.ward || '';

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

    document.getElementById('formModal').style.display = 'flex';

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

    const neighborhood = document.getElementById('commNeighborhood').value.trim();
    const contactPhone = document.getElementById('commContactPhone').value.trim();
    const stories = document.getElementById('commStories').value.trim();

    const metadata = {
        name: name,
        type: 'community',
        city: city,
        state: document.getElementById('commState').value.trim(),
        neighborhood: neighborhood,
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

    const status = document.getElementById('commStatus').value;
    const latitude = document.getElementById('commLatitude').value ? parseFloat(document.getElementById('commLatitude').value) : null;
    const longitude = document.getElementById('commLongitude').value ? parseFloat(document.getElementById('commLongitude').value) : null;
    const filePath = isEditing ? document.getElementById('commFilePath').value : `communities/${slug}.md`;

    const supabase = authUtils.supabase;

    try {
        if (isEditing) {
            // Update existing
            const updateData = {
                metadata,
                status,
                city: city,
                neighborhood: neighborhood || null,
                updated_at: new Date().toISOString()
            };

            if (latitude !== null) updateData.latitude = latitude;
            if (longitude !== null) updateData.longitude = longitude;

            // Get ward from form
            const ward = document.getElementById('commWard').value.trim();
            if (ward) updateData.ward = ward;

            const { error } = await supabase
                .from('file_metadata')
                .update(updateData)
                .eq('id', editingId);

            if (error) throw error;
        } else {
            // Create new
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

            // Get ward from form
            const ward = document.getElementById('commWard').value.trim();
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
    document.getElementById('commLatitude').value = lat;
    document.getElementById('commLongitude').value = lng;
    document.getElementById('currentCoords').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    // Handle marker drag
    locationMarker.on('dragend', function(e) {
        const newLatLng = e.target.getLatLng();
        document.getElementById('commLatitude').value = newLatLng.lat;
        document.getElementById('commLongitude').value = newLatLng.lng;
        document.getElementById('currentCoords').textContent = `${newLatLng.lat.toFixed(6)}, ${newLatLng.lng.toFixed(6)}`;
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
