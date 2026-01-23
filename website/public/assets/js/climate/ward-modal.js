/**
 * Ward Modal Component
 * Displays detailed ward information in a modal overlay
 * Supports dynamic loading of ward data from zone files
 */

class WardModal {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container element not found: ${containerId}`);
        }

        this.city = options.city || 'bengaluru';
        this.dataLoader = options.dataLoader || new ClimateDataLoader(this.city);
        this.currentWard = null;
        this.currentTab = 'energy';
        this.isOpen = false;

        this.init();
    }

    /**
     * Initialize modal structure and event listeners
     */
    init() {
        // Create modal HTML structure
        this.container.innerHTML = `
            <div class="ward-modal-overlay" id="wardModalOverlay">
                <div class="ward-modal-content">
                    <div class="ward-modal-header">
                        <h2 id="wardModalTitle"></h2>
                        <button class="ward-modal-close" id="wardModalClose" aria-label="Close">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="ward-modal-meta" id="wardModalMeta"></div>
                    <div class="ward-modal-tabs">
                        <button class="ward-tab active" data-tab="energy" id="tabEnergy">
                            <i class="fa-solid fa-bolt"></i>
                            <span data-i18n="climate.sectors.energy">Energy & Buildings</span>
                        </button>
                        <button class="ward-tab" data-tab="waste" id="tabWaste">
                            <i class="fa-solid fa-recycle"></i>
                            <span data-i18n="climate.sectors.waste">Waste Management</span>
                        </button>
                    </div>
                    <div class="ward-modal-body" id="wardModalBody">
                        <div class="ward-modal-loading">
                            <i class="fa-solid fa-spinner fa-spin"></i>
                            <p>Loading ward data...</p>
                        </div>
                    </div>
                    <div class="ward-modal-footer" id="wardModalFooter">
                        <button class="btn-secondary" id="btnViewOnMap">
                            <i class="fa-solid fa-map-location-dot"></i>
                            View on Map
                        </button>
                        <button class="btn-tertiary" id="btnDataSources">
                            <i class="fa-solid fa-database"></i>
                            Data Sources
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Set up event listeners
        this.attachEventListeners();
    }

    /**
     * Attach event listeners to modal controls
     */
    attachEventListeners() {
        // Close button
        const closeBtn = document.getElementById('wardModalClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Overlay click (close if clicking outside content)
        const overlay = document.getElementById('wardModalOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });
        }

        // Tab buttons
        const tabButtons = this.container.querySelectorAll('.ward-tab');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Browser back button
        window.addEventListener('popstate', (e) => {
            if (!location.hash.startsWith('#ward-') && this.isOpen) {
                this.close(false); // Don't modify history
            } else if (location.hash.startsWith('#ward-')) {
                const slug = location.hash.replace('#ward-', '');
                if (slug !== this.currentWard?.slug) {
                    this.open(slug);
                }
            }
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // View on Map button
        const mapBtn = document.getElementById('btnViewOnMap');
        if (mapBtn) {
            mapBtn.addEventListener('click', () => {
                if (this.currentWard) {
                    window.location.href = `/cities/${this.city}/map/#ward-${this.currentWard.slug}`;
                }
            });
        }

        // Data Sources button
        const sourcesBtn = document.getElementById('btnDataSources');
        if (sourcesBtn) {
            sourcesBtn.addEventListener('click', () => this.showDataSources());
        }
    }

    /**
     * Open modal with ward data
     * @param {string} wardSlug - Ward URL slug
     */
    async open(wardSlug) {
        this.isOpen = true;
        const overlay = document.getElementById('wardModalOverlay');
        if (overlay) {
            overlay.classList.add('active');
        }

        // Update URL hash
        if (location.hash !== `#ward-${wardSlug}`) {
            history.pushState({ ward: wardSlug }, '', `#ward-${wardSlug}`);
        }

        // Show loading state
        this.showLoading();

        try {
            // Load ward data
            const ward = await this.dataLoader.getWardBySlug(wardSlug);
            this.currentWard = ward;

            // Render ward info
            this.renderWardHeader(ward);
            this.renderWardMeta(ward);
            this.renderWardData(ward, this.currentTab);

        } catch (error) {
            console.error('Failed to load ward data:', error);
            this.showError(error.message);
        }
    }

    /**
     * Close modal
     * @param {boolean} updateHistory - Whether to update browser history
     */
    close(updateHistory = true) {
        this.isOpen = false;
        const overlay = document.getElementById('wardModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }

        // Update URL (remove hash)
        if (updateHistory && location.hash.startsWith('#ward-')) {
            history.pushState({}, '', location.pathname);
        }

        this.currentWard = null;
    }

    /**
     * Switch between tabs
     * @param {string} tab - Tab name ('energy' or 'waste')
     */
    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        const tabButtons = this.container.querySelectorAll('.ward-tab');
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Re-render data for new tab
        if (this.currentWard) {
            this.renderWardData(this.currentWard, tab);
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        const body = document.getElementById('wardModalBody');
        if (body) {
            body.innerHTML = `
                <div class="ward-modal-loading">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <p>Loading ward data...</p>
                </div>
            `;
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const body = document.getElementById('wardModalBody');
        if (body) {
            body.innerHTML = `
                <div class="ward-modal-error">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <p>Failed to load ward data</p>
                    <p class="error-detail">${message}</p>
                </div>
            `;
        }
    }

    /**
     * Render ward header (name and close button)
     * @param {Object} ward - Ward data
     */
    renderWardHeader(ward) {
        const title = document.getElementById('wardModalTitle');
        if (title) {
            title.textContent = ward.name;
            if (ward.name_local && ward.name_local !== ward.name) {
                title.innerHTML = `${ward.name} <span class="name-local">${ward.name_local}</span>`;
            }
        }
    }

    /**
     * Render ward metadata (zone, population, etc.)
     * @param {Object} ward - Ward data
     */
    renderWardMeta(ward) {
        const meta = document.getElementById('wardModalMeta');
        if (meta) {
            const zone = ward.zone || ward.corporation || 'Unknown';
            const population = ward.population ? ward.population.toLocaleString() : 'N/A';
            const households = ward.households ? ward.households.toLocaleString() : 'N/A';

            meta.innerHTML = `
                <div class="meta-item">
                    <i class="fa-solid fa-map-pin"></i>
                    <span><strong>Zone:</strong> ${zone}</span>
                </div>
                <div class="meta-item">
                    <i class="fa-solid fa-users"></i>
                    <span><strong>Population:</strong> ${population}</span>
                </div>
                <div class="meta-item">
                    <i class="fa-solid fa-house"></i>
                    <span><strong>Households:</strong> ${households}</span>
                </div>
            `;
        }
    }

    /**
     * Render ward data for specific sector
     * @param {Object} ward - Ward data
     * @param {string} sector - Sector name ('energy' or 'waste')
     */
    async renderWardData(ward, sector) {
        const body = document.getElementById('wardModalBody');
        if (!body) return;

        const sectorKey = sector === 'energy' ? 'energy_buildings' : 'waste_management';
        const sectorData = ward[sectorKey];

        if (!sectorData) {
            body.innerHTML = `<p class="no-data">No ${sector} data available for this ward.</p>`;
            return;
        }

        // Load city summary for comparisons
        let citySummary;
        try {
            citySummary = await this.dataLoader.loadCitySummary();
        } catch (error) {
            console.warn('Failed to load city summary:', error);
        }

        let html = '<div class="ward-metrics">';

        // Render each metric
        for (const [metricKey, metricData] of Object.entries(sectorData)) {
            if (typeof metricData === 'object' && metricData.value !== undefined) {
                const cityAvg = citySummary?.sectors?.[sectorKey]?.[metricKey]?.avg || null;
                html += this.renderMetric(metricKey, metricData, cityAvg);
            }
        }

        html += '</div>';
        body.innerHTML = html;
    }

    /**
     * Render single metric card
     * @param {string} key - Metric key
     * @param {Object} data - Metric data
     * @param {number} cityAvg - City average for comparison
     * @returns {string} HTML string
     */
    renderMetric(key, data, cityAvg) {
        const name = this.formatMetricName(key);
        const value = data.value;
        const unit = data.unit || '';
        const confidence = data.confidence || 0;
        const rank = data.rank || null;
        const total = data.total_wards || null;

        // Calculate progress (simple: value / target if target exists, or normalized confidence)
        const progress = Math.min(100, (confidence * 100));
        const progressClass = progress > 70 ? 'high' : progress > 40 ? 'medium' : 'low';

        // Format confidence stars
        const stars = this.renderConfidenceStars(confidence);

        return `
            <div class="metric-card">
                <h4>${name}</h4>
                <div class="metric-value">${value} ${unit}</div>
                <div class="metric-progress">
                    <div class="progress-bar ${progressClass}" style="width: ${progress}%"></div>
                </div>
                ${rank && total ? `<div class="metric-rank">Rank: #${rank} of ${total} wards</div>` : ''}
                ${cityAvg !== null ? `<div class="metric-comparison">City Average: ${cityAvg} ${unit}</div>` : ''}
                <div class="metric-confidence">Confidence: ${stars} (${Math.round(confidence * 100)}%)</div>
            </div>
        `;
    }

    /**
     * Format metric key to readable name
     * @param {string} key - Metric key (e.g., 'clean_cooking')
     * @returns {string} Formatted name
     */
    formatMetricName(key) {
        return key.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Render confidence stars
     * @param {number} confidence - Confidence value (0-1)
     * @returns {string} HTML string with stars
     */
    renderConfidenceStars(confidence) {
        const filledStars = Math.round(confidence * 5);
        let html = '';
        for (let i = 0; i < 5; i++) {
            if (i < filledStars) {
                html += '<i class="fa-solid fa-star"></i>';
            } else {
                html += '<i class="fa-regular fa-star"></i>';
            }
        }
        return html;
    }

    /**
     * Show data sources modal
     */
    showDataSources() {
        alert('Data sources information will be displayed here.\n\nSources:\n- Census 2011\n- OpenCity.in\n- Municipal Records\n- Estimated baselines');
    }
}

// Export as global
window.WardModal = WardModal;
