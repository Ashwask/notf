// Organizations CRUD Management

let organizations = [];
let isEditing = false;
let editingId = null;

// Require authentication and load data
(async function() {
    const session = await authUtils.requireAuth();
    if (!session) return;

    await loadOrganizations();
    setupEventListeners();
})();

async function loadOrganizations() {
    const supabase = authUtils.supabase;
    const statusFilter = document.getElementById('statusFilter').value;

    let query = supabase
        .from('file_metadata')
        .select('*')
        .eq('file_type', 'solution-provider')
        .order('updated_at', { ascending: false });

    if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
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

function renderOrganizations(orgs) {
    const container = document.getElementById('organizationsList');

    if (orgs.length === 0) {
        container.innerHTML = '<p class="empty-state">No organizations found. Click "Add New" to create one.</p>';
        return;
    }

    container.innerHTML = orgs.map(org => {
        const name = org.metadata?.name || org.slug;
        const theme = org.metadata?.theme || 'No theme specified';
        const location = org.metadata?.location || 'Location not specified';
        const description = org.metadata?.description || '';
        const truncatedDesc = description.length > 150 ? description.substring(0, 150) + '...' : description;

        return `
            <div class="org-card">
                <div class="org-header">
                    <h3>${name}</h3>
                    <span class="status-badge status-${org.status}">${org.status}</span>
                </div>
                <div class="org-body">
                    <p class="org-theme">${theme}</p>
                    <p class="org-location">📍 ${location}</p>
                    ${description ? `<p class="org-description">${truncatedDesc}</p>` : ''}
                </div>
                <div class="org-footer">
                    <button onclick="editOrganization('${org.id}')" class="btn-sm btn-secondary">✏️ Edit</button>
                    <button onclick="deleteOrganization('${org.id}', '${name.replace(/'/g, "\\\'")}')" class="btn-sm btn-danger">🗑️ Delete</button>
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

    const supabase = authUtils.supabase;

    try {
        if (isEditing) {
            // Update existing
            const { error } = await supabase
                .from('file_metadata')
                .update({ metadata, status, updated_at: new Date().toISOString() })
                .eq('id', editingId);

            if (error) throw error;
        } else {
            // Create new
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

function closeModal() {
    document.getElementById('formModal').style.display = 'none';
    document.getElementById('organizationForm').reset();
    isEditing = false;
    editingId = null;
}
