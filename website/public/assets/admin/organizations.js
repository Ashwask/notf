// Organizations CRUD Management

let organizations = [];
let isEditing = false;
let editingId = null;
let currentStatusFilter = 'active';

// Require authentication and load data
(async function() {
    const session = await authUtils.requireAuth();
    if (!session) return;

    await loadOrganizations();
    setupEventListeners();
})();

async function loadOrganizations() {
    const supabase = authUtils.supabase;

    let query = supabase
        .from('file_metadata')
        .select('*')
        .eq('file_type', 'solution-provider')
        .order('updated_at', { ascending: false });

    if (currentStatusFilter !== 'all') {
        query = query.eq('status', currentStatusFilter);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error loading organizations:', error);
        document.getElementById('organizationsList').innerHTML = '<p class="error">Failed to load organizations</p>';
        return;
    }

    organizations = data || [];
    renderOrganizations(organizations);
}

function setStatusFilter(status, chipElement) {
    currentStatusFilter = status;

    // Update active chip
    document.querySelectorAll('.filter-chips .chip').forEach(chip => {
        chip.classList.remove('active');
    });
    chipElement.classList.add('active');

    // Reload organizations
    loadOrganizations();
}

function renderOrganizations(orgs) {
    const container = document.getElementById('organizationsList');

    if (orgs.length === 0) {
        container.innerHTML = '<p class="empty-state">No organizations found. Click "Add New" to create one.</p>';
        return;
    }

    container.innerHTML = orgs.map(org => {
        const name = org.metadata?.name || org.slug;
        const theme = org.metadata?.theme || '';
        const focusAreas = org.metadata?.focus_areas || [];
        const focusText = Array.isArray(focusAreas) ? focusAreas.slice(0, 3).join(', ') : theme;
        const location = org.metadata?.location || '';
        const description = org.metadata?.description || '';
        const truncatedDesc = description.length > 100 ? description.substring(0, 100) + '...' : description;

        const statusIcon = org.status === 'active' ? 'fa-circle-check' : org.status === 'pending' ? 'fa-clock' : 'fa-circle';

        return `
            <div class="org-card minimal ${org.status === 'pending' ? 'pending-highlight' : ''}">
                <div class="org-info">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                        <h3>${name}</h3>
                        <span class="status-indicator ${org.status}">
                            <i class="fa-solid ${statusIcon}"></i>
                            ${org.status}
                        </span>
                    </div>
                    ${focusText ? `<p style="color: #666; font-size: 0.875rem; margin-bottom: 0.5rem;">${focusText}</p>` : ''}
                    ${description ? `<p style="color: #888; font-size: 0.875rem; margin-bottom: 0.5rem;">${truncatedDesc}</p>` : ''}
                    <div class="org-meta">
                        ${location ? `<span><i class="fa-solid fa-location-dot"></i> ${location}</span>` : ''}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="mini-icon-btn edit" title="Edit" onclick="editOrganization('${org.id}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="mini-icon-btn delete" title="Delete" onclick="deleteOrganization('${org.id}', '${name.replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    ${org.status === 'pending' ?
                        `<button class="mini-icon-btn activate" title="Activate" onclick="updateStatus('${org.id}', 'active')">
                            <i class="fa-solid fa-check"></i>
                        </button>` :
                        `<button class="mini-icon-btn deactivate" title="Deactivate" onclick="updateStatus('${org.id}', 'inactive')">
                            <i class="fa-solid fa-ban"></i>
                        </button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

function setupEventListeners() {
    // Search
    document.getElementById('searchInput').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = organizations.filter(org => {
            const name = (org.metadata?.name || '').toLowerCase();
            const theme = (org.metadata?.theme || '').toLowerCase();
            const location = (org.metadata?.location || '').toLowerCase();
            return name.includes(searchTerm) || theme.includes(searchTerm) || location.includes(searchTerm);
        });
        renderOrganizations(filtered);
    });

    // Status filter
    document.getElementById('statusFilter').addEventListener('change', loadOrganizations);

    // Form submission
    document.getElementById('organizationForm').addEventListener('submit', handleFormSubmit);

    // Check if URL has ?action=new
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
        showCreateForm();
    }
}

function showCreateForm() {
    isEditing = false;
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Add Solution Provider';
    document.getElementById('organizationForm').reset();
    document.getElementById('formModal').style.display = 'flex';
}

async function editOrganization(id) {
    const org = organizations.find(o => o.id === id);
    if (!org) return;

    isEditing = true;
    editingId = id;

    document.getElementById('modalTitle').textContent = 'Edit Solution Provider';
    document.getElementById('orgId').value = org.id;
    document.getElementById('orgFilePath').value = org.file_path;
    document.getElementById('orgName').value = org.metadata?.name || '';
    document.getElementById('orgTheme').value = org.metadata?.theme || '';
    document.getElementById('orgLocation').value = org.metadata?.location || '';
    document.getElementById('orgDescription').value = org.metadata?.description || '';
    document.getElementById('orgContactPerson').value = org.metadata?.contact?.person || '';
    document.getElementById('orgContactEmail').value = org.metadata?.contact?.email || '';
    document.getElementById('orgOffers').value = (org.metadata?.offers || []).join('\n');
    document.getElementById('orgAsks').value = (org.metadata?.asks || []).join('\n');
    document.getElementById('orgStatus').value = org.status || 'active';

    document.getElementById('formModal').style.display = 'flex';
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const submitBtnLoader = document.getElementById('submitBtnLoader');

    submitBtn.disabled = true;
    submitBtnText.style.display = 'none';
    submitBtnLoader.style.display = 'inline-block';

    const name = document.getElementById('orgName').value.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const metadata = {
        name: name,
        type: 'solution-provider',
        theme: document.getElementById('orgTheme').value.trim(),
        location: document.getElementById('orgLocation').value.trim(),
        description: document.getElementById('orgDescription').value.trim(),
        contact: {
            person: document.getElementById('orgContactPerson').value.trim(),
            email: document.getElementById('orgContactEmail').value.trim()
        },
        offers: document.getElementById('orgOffers').value.split('\n').map(s => s.trim()).filter(s => s),
        asks: document.getElementById('orgAsks').value.split('\n').map(s => s.trim()).filter(s => s),
        stories: null
    };

    const status = document.getElementById('orgStatus').value;
    const filePath = isEditing ? document.getElementById('orgFilePath').value : `solution-providers/${slug}.yaml`;

    // Add status to metadata
    metadata.status = status;

    const supabase = authUtils.supabase;

    try {
        if (isEditing) {
            // Update existing using Edge Function (storage-first architecture)
            console.log('Updating via Edge Function:', { file_path: filePath, updates: metadata });

            const { data, error } = await supabase.functions.invoke('update-file', {
                body: {
                    file_path: filePath,
                    file_type: 'solution-provider',
                    updates: metadata
                    // No markdown_body for .yaml files
                }
            });

            if (error) throw error;

            console.log('Edge Function response:', data);

            if (data?.error) {
                throw new Error(data.error);
            }
        } else {
            // Create new - still use direct DB insert for now
            // TODO: Create Edge Function endpoint for new file creation
            const { error } = await supabase
                .from('file_metadata')
                .insert({
                    file_path: filePath,
                    file_type: 'solution-provider',
                    slug: slug,
                    status: status,
                    metadata: metadata
                });

            if (error) throw error;
        }

        closeModal();
        await loadOrganizations();
        alert(`✅ Organization ${isEditing ? 'updated' : 'created'} successfully!`);
    } catch (error) {
        alert('❌ Error: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtnText.style.display = 'inline';
        submitBtnLoader.style.display = 'none';
    }
}

async function deleteOrganization(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
        return;
    }

    const supabase = authUtils.supabase;

    try {
        const { error} = await supabase
            .from('file_metadata')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await loadOrganizations();
        alert('✅ Organization deleted successfully!');
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

        await loadOrganizations();
    } catch (error) {
        alert('❌ Error updating status: ' + error.message);
    }
}

function closeModal() {
    document.getElementById('formModal').style.display = 'none';
    document.getElementById('organizationForm').reset();
    isEditing = false;
    editingId = null;
}
