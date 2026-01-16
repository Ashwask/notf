// Communities CRUD Management

let communities = [];
let isEditing = false;
let editingId = null;

// Require authentication and load data
(async function() {
    const session = await authUtils.requireAuth();
    if (!session) return;

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
    document.getElementById('commDescription').value = comm.metadata?.description || '';
    document.getElementById('commThemes').value = (comm.metadata?.themes || []).join('\n');
    document.getElementById('commContactPerson').value = comm.metadata?.contact?.person || '';
    document.getElementById('commContactEmail').value = comm.metadata?.contact?.email || '';
    document.getElementById('commOffers').value = (comm.metadata?.offers || []).join('\n');
    document.getElementById('commAsks').value = (comm.metadata?.asks || []).join('\n');
    document.getElementById('commStatus').value = comm.status || 'active';

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

    const name = document.getElementById('commName').value.trim();
    const city = document.getElementById('commCity').value.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const metadata = {
        name: name,
        type: 'community',
        city: city,
        state: document.getElementById('commState').value.trim(),
        description: document.getElementById('commDescription').value.trim(),
        themes: document.getElementById('commThemes').value.split('\n').map(s => s.trim()).filter(s => s),
        contact: {
            person: document.getElementById('commContactPerson').value.trim(),
            email: document.getElementById('commContactEmail').value.trim()
        },
        offers: document.getElementById('commOffers').value.split('\n').map(s => s.trim()).filter(s => s),
        asks: document.getElementById('commAsks').value.split('\n').map(s => s.trim()).filter(s => s),
        stories: null
    };

    const status = document.getElementById('commStatus').value;
    const filePath = isEditing ? document.getElementById('commFilePath').value : `communities/${slug}.md`;

    const supabase = authUtils.supabase;

    try {
        if (isEditing) {
            // Update existing
            const { error } = await supabase
                .from('file_metadata')
                .update({
                    metadata,
                    status,
                    city: city,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingId);

            if (error) throw error;
        } else {
            // Create new
            const { error } = await supabase
                .from('file_metadata')
                .insert({
                    file_path: filePath,
                    file_type: 'community',
                    slug: slug,
                    city: city,
                    status: status,
                    metadata: metadata
                });

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
}
