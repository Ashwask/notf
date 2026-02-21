// Escape HTML to prevent XSS
function esc(str) {
    return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Require authentication and load data
(async function() {
    const session = await authUtils.requireAuth();
    if (!session) return;

    await loadAndMatchData();
})();

// ==========================================
// SETTINGS MANAGEMENT
// ==========================================

const DEFAULT_SETTINGS = {
    model: 'Xenova/all-MiniLM-L6-v2',
    semanticThreshold: 0.4,
    weights: {
        tags: 40,
        keywords: 30,
        city: 15,
        theme: 15,
        semantic: 25,
        proximity: 30  // NEW: Geographical proximity
    },
    cityMatchMode: 'fuse',        // Default to Fuse.js for city matching (typo-tolerant)
    proximityEnabled: true,       // NEW: Enable proximity scoring
    maxDistanceKm: 50             // NEW: Max distance for proximity scoring
};

let currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); // Deep copy

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('matcher-settings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            currentSettings = { ...DEFAULT_SETTINGS, ...parsed };
            // Ensure weights exist
            if (!currentSettings.weights) {
                currentSettings.weights = DEFAULT_SETTINGS.weights;
            }
            return currentSettings;
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }
    return currentSettings;
}

// Save settings to localStorage
function saveSettings() {
    currentSettings.lastUpdated = new Date().toISOString();
    localStorage.setItem('matcher-settings', JSON.stringify(currentSettings));
}

// Apply settings to UI controls
function applySettingsToUI(settings) {
    document.getElementById('semantic-model').value = settings.model;
    document.getElementById('semantic-threshold').value = settings.semanticThreshold;
    document.getElementById('threshold-value').textContent = settings.semanticThreshold.toFixed(2);

    document.getElementById('weight-tags').value = settings.weights.tags;
    document.getElementById('weight-keywords').value = settings.weights.keywords;
    document.getElementById('weight-city').value = settings.weights.city;
    document.getElementById('weight-theme').value = settings.weights.theme;
    document.getElementById('weight-semantic').value = settings.weights.semantic;
    document.getElementById('weight-proximity').value = settings.weights.proximity || 30;

    document.getElementById('city-match-mode').value = settings.cityMatchMode;

    // Proximity settings
    document.getElementById('proximity-enabled').checked = settings.proximityEnabled !== false;
    document.getElementById('max-distance').value = settings.maxDistanceKm || 50;
    document.getElementById('max-distance-value').textContent = settings.maxDistanceKm || 50;

    updateWeightDisplays();
    updateTotalWeight();
}

// Update weight displays in real-time
function updateWeightDisplays() {
    const weights = ['tags', 'keywords', 'city', 'theme', 'semantic', 'proximity'];
    weights.forEach(w => {
        const value = document.getElementById(`weight-${w}`).value;
        document.getElementById(`weight-${w}-display`).textContent = `${value}%`;
    });
}

// Calculate and display total weight
function updateTotalWeight() {
    const weights = ['tags', 'keywords', 'city', 'theme', 'semantic', 'proximity'];
    const total = weights.reduce((sum, w) => {
        return sum + parseInt(document.getElementById(`weight-${w}`).value);
    }, 0);

    document.getElementById('total-weight').textContent = `${total}%`;

    const warning = document.getElementById('weight-warning');
    if (total > 100) {
        warning.style.display = 'block';
    } else {
        warning.style.display = 'none';
    }
}

// Toggle settings panel
function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('collapsed');
}

// Show status banner
function showStatusBanner(type, message, showProgress = false) {
    const container = document.getElementById('status-banner-container');
    container.innerHTML = ''; // Clear existing

    let icon = 'fa-circle-check';
    if (type === 'warning') icon = 'fa-triangle-exclamation';
    if (type === 'info') icon = 'fa-spinner fa-spin';

    const banner = document.createElement('div');
    banner.className = `status-banner ${esc(type)}`;
    banner.innerHTML = `
        <i class="fa-solid ${esc(icon)}"></i>
        <div style="flex: 1;">
            <strong>${esc(message)}</strong>
            ${showProgress ? '<div class="progress-bar"><div class="progress" id="model-progress" style="width: 0%"></div></div>' : ''}
        </div>
    `;

    container.appendChild(banner);
}

// Hide status banner
function hideStatusBanner() {
    const container = document.getElementById('status-banner-container');
    container.innerHTML = '';
}

// Initialize settings event listeners
function initializeSettingsListeners() {
    // Settings panel toggle
    document.getElementById('settings-toggle-btn')?.addEventListener('click', toggleSettings);
    document.getElementById('toggle-settings-close')?.addEventListener('click', toggleSettings);

    // Threshold slider
    document.getElementById('semantic-threshold')?.addEventListener('input', (e) => {
        document.getElementById('threshold-value').textContent = parseFloat(e.target.value).toFixed(2);
    });

    // Weight sliders
    ['tags', 'keywords', 'city', 'theme', 'semantic', 'proximity'].forEach(w => {
        document.getElementById(`weight-${w}`)?.addEventListener('input', () => {
            updateWeightDisplays();
            updateTotalWeight();
        });
    });

    // Proximity enabled toggle
    document.getElementById('proximity-enabled')?.addEventListener('change', (e) => {
        const distanceSettings = document.getElementById('proximity-distance-settings');
        distanceSettings.style.opacity = e.target.checked ? '1' : '0.5';
        document.getElementById('max-distance').disabled = !e.target.checked;
    });

    // Max distance slider
    document.getElementById('max-distance')?.addEventListener('input', (e) => {
        document.getElementById('max-distance-value').textContent = e.target.value;
    });

    // Action buttons (will be wired up later when matching context is available)
    // Note: applySettings and resetSettings require access to the matching state
}

async function loadAndMatchData() {
    const supabase = authUtils.supabase;

    // Load communities and solution providers
    const { data: communities, error: commError } = await supabase
        .from('file_metadata')
        .select('*')
        .eq('file_type', 'community')
        .eq('status', 'active');

    const { data: solutionProviders, error: spError } = await supabase
        .from('file_metadata')
        .select('*')
        .eq('file_type', 'solution-provider')
        .eq('status', 'active');

    if (commError || spError) {
        console.error('Error loading data:', commError || spError);
        return;
    }

    // Convert to format expected by matcher
    const members = (solutionProviders || []).map(sp => ({
        name: sp.metadata?.name || sp.slug,
        type: 'solution-provider',
        location: sp.metadata?.location || '',
        theme: sp.metadata?.theme || '',
        contact: sp.metadata?.contact || {},
        offers: sp.metadata?.offers || [],
        asks: sp.metadata?.asks || []
    })).concat((communities || []).map(c => ({
        name: c.metadata?.name || c.slug,
        type: 'community',
        location: c.city || c.metadata?.city || '',
        theme: (c.metadata?.themes || []).join(', '),
        contact: c.metadata?.contact || {},
        offers: c.metadata?.offers || [],
        asks: c.metadata?.asks || []
    })));

    initMatcher(members);
}

async function initMatcher(members) {
    // Store members for filter population
    window.allMembers = members;

    // Load settings from localStorage
    loadSettings();
    applySettingsToUI(currentSettings);

    // Initialize event listeners for settings
    initializeSettingsListeners();

    // Initialize semantic matcher
    let askEmbeddings = [];
    let offerEmbeddings = [];
    let semanticReady = false;

    if (window.semanticMatcher) {
        console.log('[Matcher] Initializing semantic matcher...');
        showStatusBanner('info', `Loading semantic model (${currentSettings.model})...`, true);

        const progressCallback = (progress) => {
            if (progress.status === 'progress' && progress.progress) {
                const progressBar = document.getElementById('model-progress');
                if (progressBar) {
                    progressBar.style.width = `${progress.progress}%`;
                }
            }
        };

        const initialized = await window.semanticMatcher.initialize(currentSettings.model, progressCallback);
        if (initialized) {
            semanticReady = true;
            console.log('[Matcher] Semantic matcher ready!');
            showStatusBanner('success', `Semantic matching active - Using ${currentSettings.model} model`);
        } else {
            console.warn('[Matcher] Semantic matcher failed to initialize');
            showStatusBanner('warning', 'Semantic matching unavailable - Using tag-based matching only. Text similarity component (25%) disabled.');
        }
    } else {
        showStatusBanner('warning', 'Semantic matching unavailable - Using tag-based matching only. Text similarity component (25%) disabled.');
    }

    // Extract all asks
    function extractAsks() {
        const asks = [];

        members.forEach(m => {
            if (m.asks && Array.isArray(m.asks)) {
                m.asks.forEach((ask, idx) => {
                    asks.push({
                        id: `${m.name}-ask-${idx}`,
                        text: ask,
                        from: m.name,
                        type: m.type || 'organization',
                        location: m.location || '',
                        city: extractCity(m.location),
                        theme: m.theme || '',
                        contact: m.contact || {},
                        tags: extractTags(ask),
                        keywords: extractKeywords(ask)
                    });
                });
            }
        });

        return asks;
    }

    // Extract all offers
    function extractOffers() {
        const offers = [];

        members.forEach(m => {
            if (m.offers && Array.isArray(m.offers)) {
                m.offers.forEach((offer, idx) => {
                    offers.push({
                        id: `${m.name}-offer-${idx}`,
                        text: offer,
                        from: m.name,
                        type: m.type || 'organization',
                        location: m.location || '',
                        city: extractCity(m.location),
                        theme: m.theme || '',
                        contact: m.contact || {},
                        tags: extractTags(offer),
                        keywords: extractKeywords(offer)
                    });
                });
            }

            // Infrastructure offers
            if (m.infrastructure_offers && Array.isArray(m.infrastructure_offers)) {
                m.infrastructure_offers.forEach((offer, idx) => {
                    offers.push({
                        id: `${m.name}-infra-${idx}`,
                        text: offer + ' (Infrastructure)',
                        from: m.name,
                        type: m.type || 'organization',
                        location: m.location || '',
                        city: extractCity(m.location),
                        theme: m.theme || '',
                        contact: m.contact || {},
                        tags: extractTags(offer).concat(['infrastructure']),
                        keywords: extractKeywords(offer)
                    });
                });
            }
        });

        return offers;
    }

    // Extract city from location string
    function extractCity(location) {
        if (!location) return '';
        const parts = location.split(',');
        return parts[parts.length - 1].trim();
    }

    // Extract tags from text
    function extractTags(text) {
        const tags = [];
        const lower = text.toLowerCase();

        const categories = {
            funding: ['funding', 'fund', 'money', 'financial', 'grant', 'investment', 'donate'],
            volunteers: ['volunteer', 'volunteers', 'help', 'support', 'manpower', 'people'],
            space: ['space', 'venue', 'room', 'hall', 'office', 'land', 'building'],
            expertise: ['expertise', 'expert', 'knowledge', 'training', 'skill', 'mentor', 'guidance', 'consulting'],
            equipment: ['equipment', 'tool', 'machine', 'device', 'hardware', 'material'],
            network: ['network', 'connection', 'connect', 'partnership', 'collaboration', 'contact']
        };

        Object.keys(categories).forEach(category => {
            if (categories[category].some(keyword => lower.includes(keyword))) {
                tags.push(category);
            }
        });

        // Domain-specific tags
        if (lower.match(/waste|compost|recycle|garbage/)) tags.push('waste-management');
        if (lower.match(/solar|renewable|energy/)) tags.push('energy');
        if (lower.match(/water|rain/)) tags.push('water');
        if (lower.match(/education|school|learn|teach/)) tags.push('education');
        if (lower.match(/health|medical|clinic/)) tags.push('health');
        if (lower.match(/women|girl/)) tags.push('women');
        if (lower.match(/child|youth|student/)) tags.push('youth');

        return [...new Set(tags)];
    }

    // Extract keywords from text
    function extractKeywords(text) {
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'being'];
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopWords.includes(w));
        return [...new Set(words)];
    }

    // Normalize common city name variations
    function normalizeCity(cityName) {
        const normalized = {
            'bengaluru': 'bengaluru',
            'bangalore': 'bengaluru',
            'mumbai': 'mumbai',
            'bombay': 'mumbai',
            'kolkata': 'kolkata',
            'calcutta': 'kolkata',
            'chennai': 'chennai',
            'madras': 'chennai',
            'thiruvananthapuram': 'thiruvananthapuram',
            'trivandrum': 'thiruvananthapuram',
            'kochi': 'kochi',
            'cochin': 'kochi'
        };

        const lower = cityName.toLowerCase().trim();
        return normalized[lower] || lower;
    }

    // Calculate city score based on mode
    async function calculateCityScore(city1, city2) {
        if (!city1 || !city2) return 0;

        const mode = currentSettings.cityMatchMode;

        if (mode === 'exact') {
            return city1.toLowerCase() === city2.toLowerCase() ? 1 : 0;
        }

        if (mode === 'normalized') {
            return normalizeCity(city1) === normalizeCity(city2) ? 1 : 0;
        }

        if (mode === 'fuse') {
            // Use Fuse.js fuzzy matching for cities
            if (city1.toLowerCase() === city2.toLowerCase()) return 1; // Shortcut for exact match

            if (typeof Fuse !== 'undefined') {
                const fuse = new Fuse([city2], {
                    threshold: 0.3,  // Stricter for city matching
                    ignoreLocation: true
                });
                const results = fuse.search(city1);
                if (results.length > 0) {
                    // Fuse returns score where 0 = perfect match, 1 = no match
                    // Convert to similarity: 1 - score
                    return 1 - results[0].score;
                }
            }
            return 0;
        }

        if (mode === 'semantic') {
            // Use semantic matching for cities
            if (city1.toLowerCase() === city2.toLowerCase()) return 1; // Shortcut for exact match

            // Use semantic matcher if available
            if (semanticReady && window.semanticMatcher.embedCity) {
                try {
                    const embedding1 = await window.semanticMatcher.embedCity(city1);
                    const embedding2 = await window.semanticMatcher.embedCity(city2);
                    if (embedding1 && embedding2) {
                        const similarity = window.semanticMatcher.cosineSimilarity(embedding1, embedding2);
                        return similarity > 0.7 ? similarity : 0; // Only count if >70% similar
                    }
                } catch (e) {
                    console.warn('City semantic matching failed:', e);
                    return 0;
                }
            }
        }

        return 0;
    }

    // Initialize SmartMatcher with current settings
    let smartMatcher = null;

    function initializeSmartMatcher() {
        if (typeof SmartMatcher === 'undefined') {
            console.warn('[Matcher] SmartMatcher not loaded. Using fallback.');
            return null;
        }

        smartMatcher = new SmartMatcher({
            weights: currentSettings.weights,
            cityMatchMode: currentSettings.cityMatchMode,
            semanticThreshold: currentSettings.semanticThreshold,
            minMatchScore: 0.5,
            proximityEnabled: currentSettings.proximityEnabled,
            maxDistanceKm: currentSettings.maxDistanceKm
        });

        console.log('[Matcher] SmartMatcher initialized with settings:', currentSettings);
        return smartMatcher;
    }

    // Calculate match score using SmartMatcher
    async function calculateMatchScore(ask, offer) {
        if (!smartMatcher) {
            console.error('[Matcher] SmartMatcher not initialized');
            return { score: 0, details: {}, matchedTags: [], matchedKeywords: [] };
        }

        return await smartMatcher.calculateMatchScore(ask, offer);
    }

    // Find all matches (batched for performance)
    async function findMatches(asks, offers, minConfidence = 0.5) {
        const matches = [];
        const BATCH_SIZE = 50; // Process 50 pairs concurrently

        // Build all valid pairs first (skip self-matches)
        const pairs = [];
        for (const ask of asks) {
            for (const offer of offers) {
                if (ask.from !== offer.from) {
                    pairs.push({ ask, offer });
                }
            }
        }

        // Process in batches for concurrent execution without blocking UI
        for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
            const batch = pairs.slice(i, i + BATCH_SIZE);
            const results = await Promise.all(
                batch.map(({ ask, offer }) => calculateMatchScore(ask, offer).then(result => ({ ask, offer, result })))
            );

            for (const { ask, offer, result } of results) {
                if (result.score >= minConfidence) {
                    matches.push({
                        id: `${ask.id}-${offer.id}`,
                        ask,
                        offer,
                        score: result.score,
                        details: result.details,
                        confidenceLevel: getConfidenceLevel(result.score),
                        matchedTags: result.matchedTags,
                        matchedKeywords: result.matchedKeywords
                    });
                }
            }
        }

        return matches.sort((a, b) => b.score - a.score);
    }

    // Get confidence level
    function getConfidenceLevel(score) {
        if (score >= 0.85) return 'excellent';
        if (score >= 0.70) return 'good';
        return 'potential';
    }

    // Toggle breakdown display
    window.toggleBreakdown = function(matchId) {
        const breakdown = document.getElementById(`breakdown-${matchId}`);
        const button = document.querySelector(`[data-match-id="${matchId}"]`);
        if (breakdown && button) {
            if (breakdown.style.display === 'none' || !breakdown.style.display) {
                breakdown.style.display = 'block';
                button.innerHTML = '<i class="fa-solid fa-chart-bar"></i> Hide Details';
            } else {
                breakdown.style.display = 'none';
                button.innerHTML = '<i class="fa-solid fa-chart-bar"></i> Show Details';
            }
        }
    };

    // Render match card with scoring breakdown
    function renderMatchCard(match) {
        const scorePercent = Math.round(match.score * 100);
        const confidenceClass = match.confidenceLevel;
        const confidenceIcon = {
            'excellent': '<i class="fa-solid fa-circle-check" style="color:#10b981"></i>',
            'good': '<i class="fa-solid fa-circle-check" style="color:#f59e0b"></i>',
            'potential': '<i class="fa-solid fa-circle-half-stroke" style="color:#f97316"></i>'
        }[match.confidenceLevel];

        // Calculate city match description
        let cityMatchDesc = `${esc(match.ask.city || 'N/A')} ${match.details.city > 0 ? '≈' : '≠'} ${esc(match.offer.city || 'N/A')}`;
        if (match.details.city > 0.99) cityMatchDesc = `${esc(match.ask.city)} = ${esc(match.offer.city)} (exact)`;

        return `
            <div class="match-card ${confidenceClass}">
                <div class="match-header">
                    <span class="match-score">${confidenceIcon} ${scorePercent}% Match</span>
                    ${match.details && match.details.distance !== null && match.details.distance !== undefined ?
                        `<span class="match-distance-badge">
                            <i class="fa-solid fa-location-dot"></i> ${match.details.distance.toFixed(1)} km
                        </span>` : ''}
                    <span class="match-level">${match.confidenceLevel.toUpperCase()}</span>
                    <button class="btn-link" data-match-id="${esc(match.id)}" onclick="toggleBreakdown('${esc(match.id)}')">
                        <i class="fa-solid fa-chart-bar"></i> Show Details
                    </button>
                </div>

                <!-- Collapsible Breakdown -->
                <div id="breakdown-${esc(match.id)}" class="score-breakdown" style="display:none">
                    <table class="breakdown-table">
                        <thead>
                            <tr>
                                <th>Component</th>
                                <th>Details</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><i class="fa-solid fa-tags"></i> Tags</td>
                                <td>${match.matchedTags.length > 0 ? match.matchedTags.map(t => esc(t)).join(', ') : 'No match'}</td>
                                <td class="score-value">+${(match.details.tags * 100).toFixed(0)}%</td>
                            </tr>
                            <tr>
                                <td><i class="fa-solid fa-key"></i> Keywords</td>
                                <td>${match.matchedKeywords.length} common words</td>
                                <td class="score-value">+${(match.details.keywords * 100).toFixed(0)}%</td>
                            </tr>
                            <tr>
                                <td><i class="fa-solid fa-location-dot"></i> City</td>
                                <td>${cityMatchDesc}</td>
                                <td class="score-value">+${(match.details.city * 100).toFixed(0)}%</td>
                            </tr>
                            <tr>
                                <td><i class="fa-solid fa-palette"></i> Theme</td>
                                <td>${esc(match.ask.theme || 'N/A')} ${match.details.theme > 0 ? '=' : '≠'} ${esc(match.offer.theme || 'N/A')}</td>
                                <td class="score-value">+${(match.details.theme * 100).toFixed(0)}%</td>
                            </tr>
                            <tr>
                                <td><i class="fa-solid fa-brain"></i> Semantic</td>
                                <td>${match.details.rawSemantic ? `Cosine: ${match.details.rawSemantic.toFixed(3)} ${match.details.rawSemantic < currentSettings.semanticThreshold ? '(below threshold)' : ''}` : 'N/A'}</td>
                                <td class="score-value">+${(match.details.semantic * 100).toFixed(0)}%</td>
                            </tr>
                            <tr>
                                <td><i class="fa-solid fa-map-location-dot"></i> Proximity</td>
                                <td>${match.details.distance !== null && match.details.distance !== undefined ? `${match.details.distance.toFixed(1)} km away` : 'No location data'}</td>
                                <td class="score-value">+${(match.details.proximity * 100).toFixed(0)}%</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td colspan="2"><strong>Total Score</strong></td>
                                <td class="score-value"><strong>${scorePercent}%</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div class="match-body">
                    <div class="match-side ask-side">
                        <div class="side-label">ASK</div>
                        <h3>${esc(match.ask.from)}</h3>
                        <p class="match-location"><i class="fa-solid fa-location-dot"></i> ${esc(match.ask.city || match.ask.location || 'Location not specified')}</p>
                        <div class="match-text">${esc(match.ask.text)}</div>
                        ${match.ask.contact && (match.ask.contact.email || match.ask.contact.phone) ? `
                            <div class="contact-info">
                                ${match.ask.contact.person ? `<p><strong>${esc(match.ask.contact.person)}</strong></p>` : ''}
                                ${match.ask.contact.email ? `<p><i class="fa-solid fa-envelope"></i> <a href="mailto:${esc(match.ask.contact.email)}">${esc(match.ask.contact.email)}</a></p>` : ''}
                                ${match.ask.contact.phone ? `<p><i class="fa-solid fa-phone"></i> <a href="tel:${esc(match.ask.contact.phone)}">${esc(match.ask.contact.phone)}</a></p>` : ''}
                            </div>
                        ` : ''}
                    </div>

                    <div class="match-connector">
                        <div class="connector-line"></div>
                        <div class="connector-icon"><i class="fa-solid fa-arrows-left-right"></i></div>
                        <div class="connector-line"></div>
                    </div>

                    <div class="match-side offer-side">
                        <div class="side-label">OFFER</div>
                        <h3>${esc(match.offer.from)}</h3>
                        <p class="match-location"><i class="fa-solid fa-location-dot"></i> ${esc(match.offer.city || match.offer.location || 'Location not specified')}</p>
                        <div class="match-text">${esc(match.offer.text)}</div>
                        ${match.offer.contact && (match.offer.contact.email || match.offer.contact.phone) ? `
                            <div class="contact-info">
                                ${match.offer.contact.person ? `<p><strong>${esc(match.offer.contact.person)}</strong></p>` : ''}
                                ${match.offer.contact.email ? `<p><i class="fa-solid fa-envelope"></i> <a href="mailto:${esc(match.offer.contact.email)}">${esc(match.offer.contact.email)}</a></p>` : ''}
                                ${match.offer.contact.phone ? `<p><i class="fa-solid fa-phone"></i> <a href="tel:${esc(match.offer.contact.phone)}">${esc(match.offer.contact.phone)}</a></p>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>

                ${match.matchedTags.length > 0 ? `
                    <div class="match-tags">
                        <strong>Matched on:</strong>
                        ${match.matchedTags.map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}
                    </div>
                ` : ''}

                <div class="match-actions">
                    <a href="mailto:${esc(match.ask.contact?.email || '')}?cc=${esc(match.offer.contact?.email || '')}&subject=NOTF Connection: ${encodeURIComponent(match.ask.from + ' + ' + match.offer.from)}" class="btn-primary">
                        <i class="fa-solid fa-envelope"></i> Connect Them
                    </a>
                </div>
            </div>
        `;
    }

    // Initialize SmartMatcher
    initializeSmartMatcher();

    // Initialize
    const allAsks = extractAsks();
    const allOffers = extractOffers();

    // Precompute embeddings if semantic matcher is ready
    if (semanticReady) {
        console.log('[Matcher] Precomputing embeddings for', allAsks.length, 'asks and', allOffers.length, 'offers...');

        // Embed all asks
        for (const ask of allAsks) {
            ask.embedding = await window.semanticMatcher.embed(ask.text);
        }

        // Embed all offers
        for (const offer of allOffers) {
            offer.embedding = await window.semanticMatcher.embed(offer.text);
        }

        console.log('[Matcher] Embeddings precomputed! Using semantic matching for text similarity.');
    }

    let allMatches = await findMatches(allAsks, allOffers, 0.5);
    let filteredMatches = allMatches;

    // Apply Settings function - re-runs matching with new settings
    async function applySettingsAndRematch() {
        // Capture current settings from UI
        currentSettings.model = document.getElementById('semantic-model').value;
        currentSettings.semanticThreshold = parseFloat(document.getElementById('semantic-threshold').value);
        currentSettings.weights = {
            tags: parseInt(document.getElementById('weight-tags').value),
            keywords: parseInt(document.getElementById('weight-keywords').value),
            city: parseInt(document.getElementById('weight-city').value),
            theme: parseInt(document.getElementById('weight-theme').value),
            semantic: parseInt(document.getElementById('weight-semantic').value),
            proximity: parseInt(document.getElementById('weight-proximity').value)
        };
        currentSettings.cityMatchMode = document.getElementById('city-match-mode').value;
        currentSettings.proximityEnabled = document.getElementById('proximity-enabled').checked;
        currentSettings.maxDistanceKm = parseInt(document.getElementById('max-distance').value);

        // Save to localStorage with unified key
        localStorage.setItem('matchingSettings', JSON.stringify(currentSettings));

        // Also save to old key for backwards compatibility
        saveSettings();

        // Broadcast change to other windows/tabs (for chatbot)
        window.dispatchEvent(new CustomEvent('matchingSettingsChanged', {
            detail: currentSettings
        }));

        // Reinitialize SmartMatcher with new settings
        initializeSmartMatcher();
        console.log('[Matcher] SmartMatcher reinitialized with new settings');

        // Check if model changed
        if (currentSettings.model !== window.semanticMatcher?.modelName) {
            // Need to reload model
            showStatusBanner('info', `Loading new model (${currentSettings.model})...`, true);
            try {
                const progressCallback = (progress) => {
                    if (progress.status === 'progress' && progress.progress) {
                        const progressBar = document.getElementById('model-progress');
                        if (progressBar) {
                            progressBar.style.width = `${progress.progress}%`;
                        }
                    }
                };

                await window.semanticMatcher.loadModel(currentSettings.model, progressCallback);

                // Re-compute all embeddings with new model
                console.log('[Matcher] Re-computing embeddings with new model...');
                for (const ask of allAsks) {
                    ask.embedding = await window.semanticMatcher.embed(ask.text);
                }
                for (const offer of allOffers) {
                    offer.embedding = await window.semanticMatcher.embed(offer.text);
                }

                showStatusBanner('success', `Semantic matching active - Using ${currentSettings.model} model`);
            } catch (error) {
                console.error('Failed to load model:', error);
                showStatusBanner('warning', 'Semantic matching unavailable - Using tag-based matching only');
            }
        }

        // Re-run matching with new settings
        console.log('[Matcher] Re-matching with new settings...');
        allMatches = await findMatches(allAsks, allOffers, 0.5);
        filteredMatches = allMatches;

        // Update stats
        document.getElementById('totalMatches').textContent = allMatches.length;
        document.getElementById('highConfidence').textContent = allMatches.filter(m => m.score >= 0.85).length;

        // Re-display matches
        applyFilters();

        alert('Settings applied successfully! Matches have been recalculated.');
    }

    // Reset Settings function
    function resetSettingsToDefaults() {
        if (confirm('Reset all settings to defaults? This will reload the page.')) {
            currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
            saveSettings();
            location.reload();
        }
    }

    // Wire up Apply and Reset buttons
    document.getElementById('apply-settings')?.addEventListener('click', applySettingsAndRematch);
    document.getElementById('reset-settings')?.addEventListener('click', resetSettingsToDefaults);

    // Update stats
    document.getElementById('totalAsks').textContent = allAsks.length;
    document.getElementById('totalOffers').textContent = allOffers.length;
    document.getElementById('totalMatches').textContent = allMatches.length;
    document.getElementById('highConfidence').textContent = allMatches.filter(m => m.score >= 0.85).length;

    // Populate autocomplete datalists
    // Get ALL member names from the members array (not just those with asks/offers)
    const allNames = [...new Set(window.allMembers.map(m => m.name))].sort();

    // All unique cities/locations from asks and offers
    const allCities = [...new Set(
        allAsks.map(a => a.city).concat(allOffers.map(o => o.city))
        .filter(c => c && c.trim())
    )].sort();

    console.log('[Matcher] Populated name filter with', allNames.length, 'members');
    console.log('[Matcher] Populated location filter with', allCities.length, 'cities');

    const nameList = document.getElementById('nameList');
    const locationList = document.getElementById('locationList');

    allNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        nameList.appendChild(option);
    });

    allCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        locationList.appendChild(option);
    });

    // Autocomplete filter inputs
    const nameFilter = document.getElementById('nameFilter');
    const locationFilter = document.getElementById('locationFilter');
    const clearName = document.getElementById('clearName');
    const clearLocation = document.getElementById('clearLocation');

    // Show/hide clear buttons
    nameFilter.addEventListener('input', function() {
        clearName.style.display = this.value ? 'block' : 'none';
        applyFilters();
    });

    locationFilter.addEventListener('input', function() {
        clearLocation.style.display = this.value ? 'block' : 'none';
        applyFilters();
    });

    // Clear button handlers
    clearName.addEventListener('click', function() {
        nameFilter.value = '';
        this.style.display = 'none';
        applyFilters();
    });

    clearLocation.addEventListener('click', function() {
        locationFilter.value = '';
        this.style.display = 'none';
        applyFilters();
    });

    // Display matches
    function displayMatches(matches) {
        const excellentGrid = document.getElementById('excellentMatchesGrid');
        const goodGrid = document.getElementById('goodMatchesGrid');
        const potentialGrid = document.getElementById('potentialMatchesGrid');

        const excellentSection = document.getElementById('excellentMatches');
        const goodSection = document.getElementById('goodMatches');
        const potentialSection = document.getElementById('potentialMatches');
        const noMatches = document.getElementById('noMatches');

        excellentGrid.innerHTML = '';
        goodGrid.innerHTML = '';
        potentialGrid.innerHTML = '';

        const excellent = matches.filter(m => m.confidenceLevel === 'excellent');
        const good = matches.filter(m => m.confidenceLevel === 'good');
        const potential = matches.filter(m => m.confidenceLevel === 'potential');

        if (excellent.length > 0) {
            excellentSection.style.display = 'block';
            excellentGrid.innerHTML = excellent.map(renderMatchCard).join('');
        } else {
            excellentSection.style.display = 'none';
        }

        if (good.length > 0) {
            goodSection.style.display = 'block';
            goodGrid.innerHTML = good.map(renderMatchCard).join('');
        } else {
            goodSection.style.display = 'none';
        }

        if (potential.length > 0) {
            potentialSection.style.display = 'block';
            potentialGrid.innerHTML = potential.map(renderMatchCard).join('');
        } else {
            potentialSection.style.display = 'none';
        }

        noMatches.style.display = matches.length === 0 ? 'block' : 'none';
    }

    // Event listeners
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const category = this.dataset.category;

            if (category === 'all') {
                filteredMatches = allMatches;
            } else {
                filteredMatches = allMatches.filter(m =>
                    m.matchedTags.includes(category)
                );
            }

            applyFilters();
        });
    });

    document.getElementById('sortSelect').addEventListener('change', function() {
        const sortBy = this.value;

        if (sortBy === 'score') {
            filteredMatches.sort((a, b) => b.score - a.score);
        } else if (sortBy === 'location') {
            filteredMatches.sort((a, b) => {
                const aMatch = a.ask.city === a.offer.city ? 1 : 0;
                const bMatch = b.ask.city === b.offer.city ? 1 : 0;
                return bMatch - aMatch || b.score - a.score;
            });
        }

        displayMatches(filteredMatches);
    });

    document.getElementById('confidenceSelect').addEventListener('change', function() {
        applyFilters();
    });

    function applyFilters() {
        const minConfidence = parseInt(document.getElementById('confidenceSelect').value) / 100;
        const selectedName = nameFilter.value.trim();
        const selectedLocation = locationFilter.value.trim();

        let filtered = filteredMatches.filter(m => m.score >= minConfidence);

        // Filter by name if selected
        if (selectedName) {
            filtered = filtered.filter(m =>
                m.ask.from === selectedName || m.offer.from === selectedName
            );
        }

        // Filter by location if selected
        if (selectedLocation) {
            filtered = filtered.filter(m =>
                m.ask.city === selectedLocation || m.offer.city === selectedLocation
            );
        }

        displayMatches(filtered);

        // Update match count display
        document.getElementById('totalMatches').textContent = filtered.length;
        document.getElementById('highConfidence').textContent = filtered.filter(m => m.score >= 0.85).length;
    }

    // Initial display
    displayMatches(filteredMatches);
}
