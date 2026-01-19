// Consolidated App - Hash Routing, Global Search, and Data Management

let allCommunities = [];
let allProviders = [];
let filteredCommunities = [];
let filteredProviders = [];
let map = null;
let mapInitialized = false;

// City and neighborhood coordinates
const cityCoordinates = {
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Bengaluru': { lat: 12.9716, lng: 77.5946 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Delhi': { lat: 28.6139, lng: 77.2090 },
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'Bhubaneswar': { lat: 20.2961, lng: 85.8245 },
    'Pune': { lat: 18.5204, lng: 73.8567 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 }
};

let neighborhoodCoordinates = {};

// Initialize app on load
(async function init() {
    await dataLoader.waitForSupabase();

    // Load data
    [allCommunities, allProviders] = await Promise.all([
        dataLoader.loadCommunities(),
        dataLoader.loadSolutionProviders()
    ]);

    filteredCommunities = [...allCommunities];
    filteredProviders = [...allProviders];

    // Update counts
    updateCounts();

    // Setup event listeners
    setupTabNavigation();
    setupGlobalSearch();

    // Handle initial hash or default to overview
    const hash = window.location.hash.substring(1) || 'overview';
    switchTab(hash);

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
        const newHash = window.location.hash.substring(1) || 'overview';
        switchTab(newHash);
    });
})();

// Update all count placeholders
function updateCounts() {
    const orgCount = allProviders.length;
    const commCount = allCommunities.length;

    document.getElementById('orgCount').textContent = orgCount;
    document.getElementById('commCount').textContent = commCount;
    document.getElementById('mapCommCount').textContent = commCount;
    document.getElementById('dirCommCount').textContent = commCount;
    document.getElementById('orgNetCount').textContent = orgCount;
    document.getElementById('ctaOrgCount').textContent = orgCount;
    document.getElementById('ctaCommCount').textContent = commCount;
    document.getElementById('commTabCount').textContent = `(${commCount})`;
    document.getElementById('provTabCount').textContent = `(${orgCount})`;
}

// Tab navigation
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-pill');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            window.location.hash = tabName;
        });
    });
}

function switchTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-pill').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to selected tab
    const activeButton = document.querySelector(`.tab-pill[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);

    if (activeButton && activeContent) {
        activeButton.classList.add('active');
        activeContent.classList.add('active');

        // Load content based on tab
        if (tabName === 'communities') {
            renderCommunities(filteredCommunities);
        } else if (tabName === 'providers') {
            renderProviders(filteredProviders);
        } else if (tabName === 'map') {
            initializeMap();
        }
    }
}

// Global search
function setupGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();

        if (!searchTerm) {
            filteredCommunities = [...allCommunities];
            filteredProviders = [...allProviders];
        } else {
            // Search communities
            filteredCommunities = allCommunities.filter(comm => {
                const name = (comm.name || '').toLowerCase();
                const city = (comm.city || '').toLowerCase();
                const description = (comm.description || '').toLowerCase();
                const themes = (comm.themes || []).join(' ').toLowerCase();

                return name.includes(searchTerm) ||
                       city.includes(searchTerm) ||
                       description.includes(searchTerm) ||
                       themes.includes(searchTerm);
            });

            // Search providers
            filteredProviders = allProviders.filter(prov => {
                const name = (prov.name || '').toLowerCase();
                const location = (prov.location || '').toLowerCase();
                const description = (prov.description || '').toLowerCase();
                const theme = (prov.theme || '').toLowerCase();

                return name.includes(searchTerm) ||
                       location.includes(searchTerm) ||
                       description.includes(searchTerm) ||
                       theme.includes(searchTerm);
            });
        }

        // Re-render current tab
        const currentTab = document.querySelector('.tab-content.active').id.replace('-tab', '');
        if (currentTab === 'communities') {
            renderCommunities(filteredCommunities);
        } else if (currentTab === 'providers') {
            renderProviders(filteredProviders);
        }
    });
}

// Render communities with minimalist cards
function renderCommunities(communities) {
    const container = document.getElementById('communitiesList');

    if (communities.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-magnifying-glass"></i>
                <h3>No communities found</h3>
                <p>Try adjusting your search or filters.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = communities.map(comm => {
        const themes = comm.themes && comm.themes.length > 0
            ? comm.themes.slice(0, 3).map(t => `<span class="theme-pill">${t}</span>`).join('')
            : '';

        const description = comm.description || '';
        const truncatedDesc = description.length > 150
            ? description.substring(0, 150) + '...'
            : description;

        const offersCount = (comm.offers || []).length;
        const asksCount = (comm.asks || []).length;

        return `
            <div class="listing-card">
                <div class="listing-header">
                    <div>
                        <h3 class="listing-title">${comm.name}</h3>
                    </div>
                </div>

                <div class="listing-meta">
                    ${comm.city ? `<span><i class="fa-solid fa-location-dot"></i> ${comm.city}${comm.state ? ', ' + comm.state : ''}</span>` : ''}
                    ${comm.neighborhood ? `<span><i class="fa-solid fa-house"></i> ${comm.neighborhood}</span>` : ''}
                    ${comm.ward ? `<span><i class="fa-solid fa-map"></i> Ward ${comm.ward}</span>` : ''}
                </div>

                ${themes ? `<div class="listing-themes">${themes}</div>` : ''}

                ${truncatedDesc ? `<p class="listing-description">${truncatedDesc}</p>` : ''}

                <div class="listing-counts">
                    <span class="count-badge">
                        <i class="fa-solid fa-gift"></i>
                        ${offersCount} Offers
                    </span>
                    <span class="count-badge">
                        <i class="fa-solid fa-hand"></i>
                        ${asksCount} Asks
                    </span>
                </div>

                ${comm.contact && comm.contact.email ? `
                    <div class="listing-actions">
                        <a href="mailto:${comm.contact.email}" class="listing-btn" title="Contact via email">
                            <i class="fa-solid fa-envelope"></i>
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Render providers with minimalist cards
function renderProviders(providers) {
    const container = document.getElementById('providersList');

    if (providers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-magnifying-glass"></i>
                <h3>No solution providers found</h3>
                <p>Try adjusting your search or filters.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = providers.map(prov => {
        const theme = prov.theme
            ? `<span class="theme-pill">${prov.theme}</span>`
            : '';

        const description = prov.description || '';
        const truncatedDesc = description.length > 150
            ? description.substring(0, 150) + '...'
            : description;

        const offersCount = (prov.offers || []).length;
        const asksCount = (prov.asks || []).length;

        return `
            <div class="listing-card">
                <div class="listing-header">
                    <div>
                        <h3 class="listing-title">${prov.name}</h3>
                    </div>
                </div>

                <div class="listing-meta">
                    ${prov.location ? `<span><i class="fa-solid fa-location-dot"></i> ${prov.location}</span>` : ''}
                </div>

                ${theme ? `<div class="listing-themes">${theme}</div>` : ''}

                ${truncatedDesc ? `<p class="listing-description">${truncatedDesc}</p>` : ''}

                <div class="listing-counts">
                    <span class="count-badge">
                        <i class="fa-solid fa-gift"></i>
                        ${offersCount} Offers
                    </span>
                    <span class="count-badge">
                        <i class="fa-solid fa-hand"></i>
                        ${asksCount} Asks
                    </span>
                </div>

                ${prov.contact && prov.contact.email ? `
                    <div class="listing-actions">
                        <a href="mailto:${prov.contact.email}" class="listing-btn" title="Contact via email">
                            <i class="fa-solid fa-envelope"></i>
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Map functions
function findNeighborhoodCoords(neighborhoodName) {
    if (!neighborhoodName) return null;

    const normalized = neighborhoodName.toLowerCase().trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '');

    // Try exact match first
    for (const [ward, coords] of Object.entries(neighborhoodCoordinates)) {
        const normalizedWard = ward.toLowerCase().trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '');

        if (normalized === normalizedWard) {
            return coords;
        }
    }

    // Try partial match
    for (const [ward, coords] of Object.entries(neighborhoodCoordinates)) {
        const normalizedWard = ward.toLowerCase().trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '');

        if (normalizedWard.includes(normalized) || normalized.includes(normalizedWard)) {
            return coords;
        }
    }

    return null;
}

function getCoordinates(location, neighborhood) {
    if (!location) return null;

    // Try neighborhood first
    if (neighborhood) {
        const coords = findNeighborhoodCoords(neighborhood);
        if (coords) {
            const offset = Math.random() * 0.005 - 0.0025;
            return {
                lat: coords.lat + offset,
                lng: coords.lng + offset
            };
        }
    }

    // Normalize location string
    const cityName = location.split(',')[0].trim();

    // Try location as neighborhood
    const locationCoords = findNeighborhoodCoords(cityName);
    if (locationCoords) {
        const offset = Math.random() * 0.005 - 0.0025;
        return {
            lat: locationCoords.lat + offset,
            lng: locationCoords.lng + offset
        };
    }

    // Fall back to city coordinates
    for (const [city, coords] of Object.entries(cityCoordinates)) {
        if (city.toLowerCase() === cityName.toLowerCase()) {
            const offset = Math.random() * 0.02 - 0.01;
            return {
                lat: coords.lat + offset,
                lng: coords.lng + offset
            };
        }
    }

    return null;
}

function createPopupContent(item, type) {
    const typeLabel = type === 'community' ? 'Community' : 'Solution Provider';

    let html = `
        <div style="min-width: 200px;">
            <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 0.5rem;">${item.name}</div>
            <div style="display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-bottom: 0.5rem; background: ${type === 'community' ? '#667eea' : '#f56565'}; color: white;">${typeLabel}</div>
    `;

    if (type === 'community') {
        html += `<div style="margin: 0.5rem 0; font-size: 0.9rem; display: flex; align-items: center; gap: 0.25rem;"><i class="fa-solid fa-location-dot" style="color: var(--notf-teal);"></i> ${item.city}${item.state ? ', ' + item.state : ''}</div>`;
        if (item.themes && item.themes.length > 0) {
            html += `<div style="margin: 0.5rem 0; font-size: 0.9rem;"><strong>Focus:</strong> ${item.themes.slice(0, 3).join(', ')}</div>`;
        }
    } else {
        html += `<div style="margin: 0.5rem 0; font-size: 0.9rem; display: flex; align-items: center; gap: 0.25rem;"><i class="fa-solid fa-location-dot" style="color: var(--notf-teal);"></i> ${item.location || 'Location not specified'}</div>`;
        if (item.theme) {
            html += `<div style="margin: 0.5rem 0; font-size: 0.9rem;"><strong>Focus:</strong> ${item.theme}</div>`;
        }
    }

    if (item.description) {
        const shortDesc = item.description.length > 100
            ? item.description.substring(0, 100) + '...'
            : item.description;
        html += `<div style="margin: 0.5rem 0; font-size: 0.9rem;">${shortDesc}</div>`;
    }

    if (item.contact && item.contact.email) {
        html += `<div style="margin-top: 0.5rem; font-size: 0.85rem;"><a href="mailto:${item.contact.email}" style="color: #667eea; text-decoration: none;" title="Contact via email"><i class="fa-solid fa-envelope"></i></a></div>`;
    }

    html += '</div>';
    return html;
}

async function initializeMap() {
    if (mapInitialized) return;

    // Initialize map
    map = L.map('map').setView([12.9716, 77.5946], 12);

    // Add tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(map);

    // Load neighborhood coordinates
    try {
        const response = await fetch('/assets/geodata/bangalore-neighborhoods.json');
        neighborhoodCoordinates = await response.json();
    } catch (error) {
        console.warn('Could not load neighborhood coordinates:', error);
    }

    // Create layer groups
    const corporationLayer = L.layerGroup();
    const wardLayer = L.layerGroup();

    // Load GeoJSON corporation boundaries
    try {
        const response = await fetch('/assets/geodata/gba_corporation.geojson');
        const data = await response.json();
        const corpGeoJSON = L.geoJSON(data, {
            style: {
                color: '#ff6b6b',
                weight: 3,
                fillOpacity: 0.05,
                fillColor: '#ff6b6b',
                opacity: 0.8
            }
        });
        corporationLayer.addLayer(corpGeoJSON);
    } catch (error) {
        console.warn('Could not load corporation boundaries:', error);
    }

    // Load KML ward boundaries
    if (typeof omnivore !== 'undefined') {
        const wardKML = omnivore.kml('/assets/geodata/gba-369-wards-december-2025.kml')
            .on('ready', function() {
                this.setStyle({
                    color: '#667eea',
                    weight: 1,
                    fillOpacity: 0.03,
                    fillColor: '#667eea',
                    opacity: 0.6
                });
            });
        wardLayer.addLayer(wardKML);
    }

    // Add layer control
    const overlays = {
        "Corporation Boundaries": corporationLayer,
        "Ward Boundaries": wardLayer
    };

    L.control.layers(null, overlays, {
        collapsed: false,
        position: 'topright'
    }).addTo(map);

    // Add layers by default
    corporationLayer.addTo(map);
    wardLayer.addTo(map);

    // Custom icons
    const communityIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #667eea; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    // Add community markers
    allCommunities.forEach(comm => {
        const neighborhood = comm.neighborhood || comm.name;
        const coords = getCoordinates(comm.city, neighborhood);
        if (coords) {
            L.marker([coords.lat, coords.lng], { icon: communityIcon })
                .addTo(map)
                .bindPopup(createPopupContent(comm, 'community'));
        }
    });

    mapInitialized = true;
}
