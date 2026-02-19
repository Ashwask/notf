// Stories CRUD Management

let stories = [];
let allCommunities = [];
let isEditing = false;
let editingId = null;
let currentStatusFilter = 'all';

// SECURITY: HTML escaping function to prevent XSS attacks
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Require authentication and load data
(async function() {
    const session = await authUtils.requireAuth();
    if (!session) return;

    await Promise.all([loadStories(), loadCommunityList()]);
    setupEventListeners();
    setupModalDrag('formModalHeader', 'formModal');
    setupModalDrag('editorModalHeader', 'editorModal');
    setupModalDrag('viewModalHeader', 'viewModal');
})();

async function loadStories() {
    const supabase = authUtils.supabase;

    let query = supabase
        .from('file_metadata')
        .select('*')
        .eq('file_type', 'story')
        .order('created_at', { ascending: false });

    if (currentStatusFilter !== 'all') {
        query = query.eq('status', currentStatusFilter);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error loading stories:', error);
        document.getElementById('storiesList').innerHTML = '<p class="error">Failed to load stories</p>';
        return;
    }

    stories = data || [];
    renderStories(stories);
}

async function loadCommunityList() {
    const supabase = authUtils.supabase;

    const { data, error } = await supabase
        .from('file_metadata')
        .select('slug, metadata, city')
        .eq('file_type', 'community')
        .eq('status', 'active')
        .order('slug', { ascending: true });

    if (error) {
        console.warn('Could not load communities for dropdown:', error);
        return;
    }

    allCommunities = data || [];

    // Populate datalist
    const datalist = document.getElementById('communityList');
    if (datalist) {
        datalist.innerHTML = allCommunities.map(c => {
            const name = c.metadata?.name || c.slug;
            const city = c.city || c.metadata?.city || '';
            return `<option value="${escapeHtml(name)}">${escapeHtml(name)}${city ? ' (' + escapeHtml(city) + ')' : ''}</option>`;
        }).join('');
    }
}

function setStatusFilter(status, chipElement) {
    currentStatusFilter = status;
    document.querySelectorAll('.filter-chips .chip').forEach(chip => {
        chip.classList.remove('active');
    });
    chipElement.classList.add('active');
    loadStories();
}

function renderStories(items) {
    const container = document.getElementById('storiesList');
    const countEl = document.getElementById('adminStoryCount');
    if (countEl) {
        countEl.textContent = `(${items.length})`;
    }

    if (items.length === 0) {
        container.innerHTML = '<p class="empty-state">No stories found. Click "Add New" to create one.</p>';
        return;
    }

    container.innerHTML = items.map(story => {
        const title = escapeHtml(story.metadata?.title || story.slug);
        const city = escapeHtml(story.metadata?.city || story.city || '');
        const community = escapeHtml(story.metadata?.community || '');
        const location = escapeHtml(story.metadata?.location || '');
        const themes = story.metadata?.themes || [];
        const themesText = Array.isArray(themes) ? themes.slice(0, 3).map(t => escapeHtml(t)).join(', ') : escapeHtml(themes || '');
        const excerpt = escapeHtml(story.metadata?.excerpt || '');
        const truncatedExcerpt = excerpt.length > 120 ? excerpt.substring(0, 120) + '...' : excerpt;
        const youtubeUrl = story.metadata?.youtube_url || '';
        const statusIcon = story.status === 'active' ? 'fa-circle-check' : story.status === 'draft' ? 'fa-file' : 'fa-circle';
        const statusEscaped = escapeHtml(story.status);

        return `
            <div class="org-card minimal ${story.status === 'draft' ? 'pending-highlight' : ''}">
                <div class="org-info">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                        <h3>${title}</h3>
                        <span class="status-indicator ${statusEscaped}">
                            <i class="fa-solid ${statusIcon}"></i>
                            ${statusEscaped}
                        </span>
                        ${youtubeUrl ? '<span style="color: #C45A2A; font-size: 0.8rem;"><i class="fa-brands fa-youtube"></i> Video</span>' : ''}
                    </div>
                    ${themesText ? `<p style="color: #666; font-size: 0.875rem; margin-bottom: 0.5rem;">${themesText}</p>` : ''}
                    ${truncatedExcerpt ? `<p style="color: #888; font-size: 0.875rem; margin-bottom: 0.5rem;">${truncatedExcerpt}</p>` : ''}
                    <div class="org-meta">
                        ${city ? `<span><i class="fa-solid fa-location-dot"></i> ${city}</span>` : ''}
                        ${community ? `<span><i class="fa-solid fa-house-user"></i> ${community}</span>` : ''}
                        ${location ? `<span><i class="fa-solid fa-map-pin"></i> ${location}</span>` : ''}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="mini-icon-btn view" title="View Details" onclick="viewStory('${escapeHtml(story.id)}')">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="mini-icon-btn edit" title="Edit" onclick="editStory('${escapeHtml(story.id)}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="mini-icon-btn delete" title="Delete" onclick="deleteStory('${escapeHtml(story.id)}', '${escapeHtml(story.metadata?.title || story.slug)}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function setupEventListeners() {
    // Search with Fuse.js
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();
            if (!searchTerm) {
                renderStories(stories);
                return;
            }

            const fuseOptions = {
                keys: [
                    { name: 'metadata.title', weight: 2.0 },
                    { name: 'metadata.community', weight: 1.5 },
                    { name: 'metadata.city', weight: 1.2 },
                    { name: 'metadata.themes', weight: 1.0 },
                    { name: 'metadata.location', weight: 0.8 },
                    { name: 'metadata.excerpt', weight: 0.5 }
                ],
                threshold: 0.4,
                includeScore: true,
                ignoreLocation: true,
                shouldSort: true,
                minMatchCharLength: 2
            };

            const fuse = new Fuse(stories, fuseOptions);
            const results = fuse.search(searchTerm);
            renderStories(results.map(r => r.item));
        });
    }

    // Form submission
    const storyForm = document.getElementById('storyForm');
    if (storyForm) {
        storyForm.addEventListener('submit', handleFormSubmit);
    }
}

function showCreateForm() {
    isEditing = false;
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Add Story';
    document.getElementById('storyForm').reset();
    document.getElementById('formModal').style.display = 'flex';
}

async function editStory(id) {
    const story = stories.find(s => s.id === id);
    if (!story) return;

    isEditing = true;
    editingId = id;

    document.getElementById('modalTitle').textContent = 'Edit Story';
    document.getElementById('storyId').value = story.id;
    document.getElementById('storyFilePath').value = story.file_path;
    document.getElementById('storyTitle').value = story.metadata?.title || '';
    document.getElementById('storyCity').value = story.metadata?.city || story.city || '';
    document.getElementById('storyCommunity').value = story.metadata?.community || '';
    document.getElementById('storyLocation').value = story.metadata?.location || '';
    document.getElementById('storyThemes').value = (story.metadata?.themes || []).join(', ');
    document.getElementById('storyYoutubeUrl').value = story.metadata?.youtube_url || '';
    document.getElementById('storyStatus').value = story.status || 'active';
    document.getElementById('storyExcerpt').value = story.metadata?.excerpt || '';
    document.getElementById('storyContent').value = story.metadata?.content || '';

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

    const title = document.getElementById('storyTitle').value.trim();
    const city = document.getElementById('storyCity').value.trim();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    const content = document.getElementById('storyContent').value.trim();

    const metadata = {
        title: title,
        type: 'story',
        city: city,
        community: document.getElementById('storyCommunity').value.trim(),
        location: document.getElementById('storyLocation').value.trim(),
        themes: document.getElementById('storyThemes').value.split(',').map(s => s.trim()).filter(s => s),
        youtube_url: document.getElementById('storyYoutubeUrl').value.trim() || null,
        excerpt: document.getElementById('storyExcerpt').value.trim(),
        content: content,
        status: document.getElementById('storyStatus').value,
        last_updated: new Date().toISOString().split('T')[0]
    };

    const status = metadata.status;
    const filePath = isEditing
        ? document.getElementById('storyFilePath').value
        : `stories/${citySlug}/${slug}.md`;

    const supabase = authUtils.supabase;

    try {
        const { data, error } = await supabase.functions.invoke('update-file', {
            body: {
                file_path: filePath,
                file_type: 'story',
                updates: metadata,
                markdown_body: content || ''
            }
        });

        if (error) {
            throw new Error(error.message || 'Edge Function failed');
        }

        if (data?.error) {
            throw new Error(data.error);
        }

        closeModal();
        await loadStories();
        alert(`Story ${isEditing ? 'updated' : 'created'} successfully!`);
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtnText.style.display = 'inline';
        submitBtnLoader.style.display = 'none';
    }
}

async function deleteStory(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
        return;
    }

    const supabase = authUtils.supabase;
    const story = stories.find(s => s.id === id);
    if (!story) {
        alert('Story not found');
        return;
    }

    try {
        const { data, error } = await supabase.functions.invoke('delete-file', {
            body: {
                file_path: story.file_path,
                file_type: 'story'
            }
        });

        if (error) {
            throw new Error(error.message || 'Delete failed');
        }

        if (data?.error) {
            throw new Error(data.error);
        }

        await loadStories();
        alert('Story deleted successfully!');
    } catch (error) {
        alert('Error deleting story: ' + error.message);
    }
}

function viewStory(id) {
    const story = stories.find(s => s.id === id);
    if (!story) return;

    const title = escapeHtml(story.metadata?.title || story.slug);
    const statusIcon = story.status === 'active' ? 'fa-circle-check' : 'fa-file';
    const statusClass = story.status === 'active' ? 'active' : 'pending';

    document.getElementById('viewTitle').textContent = title;
    const viewStatus = document.getElementById('viewStatus');
    viewStatus.className = `status-indicator ${statusClass}`;
    viewStatus.innerHTML = `<i class="fa-solid ${statusIcon}"></i> ${escapeHtml(story.status)}`;

    const themes = story.metadata?.themes || [];
    const content = story.metadata?.content || '';
    const renderedContent = content && window.marked ? marked.parse(content) : escapeHtml(content);
    const youtubeEmbed = getYoutubeEmbed(story.metadata?.youtube_url);

    document.getElementById('viewBody').innerHTML = `
        <div class="detail-section">
            <h3 class="section-title"><i class="fa-solid fa-info-circle"></i> Story Information</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">City</span>
                    <span class="detail-value">${escapeHtml(story.metadata?.city || story.city || '-')}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Community</span>
                    <span class="detail-value">${escapeHtml(story.metadata?.community || '-')}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Location</span>
                    <span class="detail-value">${escapeHtml(story.metadata?.location || '-')}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Themes</span>
                    <span class="detail-value">
                        ${themes.length > 0 ? `<div class="tag-list">${themes.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : '-'}
                    </span>
                </div>
            </div>
        </div>
        ${story.metadata?.excerpt ? `
        <div class="detail-section">
            <h3 class="section-title"><i class="fa-solid fa-quote-left"></i> Excerpt</h3>
            <p style="color: #666; line-height: 1.6; font-style: italic;">${escapeHtml(story.metadata.excerpt)}</p>
        </div>` : ''}
        ${youtubeEmbed ? `
        <div class="detail-section">
            <h3 class="section-title"><i class="fa-brands fa-youtube"></i> Video</h3>
            ${youtubeEmbed}
        </div>` : ''}
        ${content ? `
        <div class="detail-section">
            <h3 class="section-title"><i class="fa-solid fa-book-open"></i> Full Story</h3>
            <div style="line-height: 1.7; color: #333;">${renderedContent}</div>
        </div>` : ''}
    `;

    document.getElementById('viewModal').style.display = 'flex';
}

function getYoutubeEmbed(url) {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (!match) return '';
    return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;">
        <iframe src="https://www.youtube.com/embed/${escapeHtml(match[1])}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe>
    </div>`;
}

function closeModal() {
    document.getElementById('formModal').style.display = 'none';
    isEditing = false;
    editingId = null;
}

function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}

// Story Editor (full-screen markdown)
function openStoryEditor() {
    const content = document.getElementById('storyContent').value;
    document.getElementById('editorText').value = content;
    updateEditorPreview();
    document.getElementById('editorModal').style.display = 'flex';

    // Live preview
    document.getElementById('editorText').addEventListener('input', updateEditorPreview);
}

function updateEditorPreview() {
    const text = document.getElementById('editorText').value;
    const preview = document.getElementById('editorPreview');
    if (text && window.marked) {
        preview.innerHTML = marked.parse(text);
    } else {
        preview.innerHTML = '<p style="color: #999; font-style: italic;">Preview will appear here...</p>';
    }
}

function saveEditorContent() {
    document.getElementById('storyContent').value = document.getElementById('editorText').value;
    document.getElementById('editorModal').style.display = 'none';
}

function closeStoryEditor() {
    document.getElementById('editorModal').style.display = 'none';
}

// Modal drag functionality
function setupModalDrag(headerId, modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const modalContent = modal.querySelector('.modal-content');
    const header = document.getElementById(headerId);
    if (!header) return;

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.addEventListener('mousedown', function(e) {
        if (e.target.closest('.btn-close') || e.target.closest('button')) return;
        isDragging = true;
        const rect = modalContent.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = rect.left;
        initialTop = rect.top;
        modalContent.style.position = 'fixed';
        modalContent.style.margin = '0';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        modalContent.style.left = (initialLeft + dx) + 'px';
        modalContent.style.top = (initialTop + dy) + 'px';
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
    });

    // Resize handle
    const resizeHandle = modalContent.querySelector('.resize-handle');
    if (resizeHandle) {
        let isResizing = false;
        let resizeStartX, resizeStartY, initialWidth, initialHeight;

        resizeHandle.addEventListener('mousedown', function(e) {
            isResizing = true;
            resizeStartX = e.clientX;
            resizeStartY = e.clientY;
            initialWidth = modalContent.offsetWidth;
            initialHeight = modalContent.offsetHeight;
            e.preventDefault();
            e.stopPropagation();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            const dx = e.clientX - resizeStartX;
            const dy = e.clientY - resizeStartY;
            modalContent.style.width = Math.max(400, initialWidth + dx) + 'px';
            modalContent.style.height = Math.max(300, initialHeight + dy) + 'px';
        });

        document.addEventListener('mouseup', function() {
            isResizing = false;
        });
    }
}
