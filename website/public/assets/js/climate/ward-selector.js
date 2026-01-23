/**
 * Ward Selector Component
 * Dropdown with search and filter for selecting wards
 */

class WardSelector {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Ward selector container not found: ${containerId}`);
            return;
        }

        this.options = {
            placeholder: options.placeholder || 'Select a ward to view details',
            sector: options.sector || 'energy',
            onSelect: options.onSelect || null,
            ...options
        };

        this.allWards = [];
        this.filteredWards = [];
        this.selectedCorp = null;
        this.searchQuery = '';

        this.init();
    }

    async init() {
        try {
            // Load ward index
            const wardIndex = await window.climateData.loadWardIndex();
            this.allWards = wardIndex.wards;
            this.filteredWards = [...this.allWards];

            // Render component
            this.render();
            this.attachEventListeners();
        } catch (error) {
            console.error('Failed to initialize ward selector:', error);
            this.renderError();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="ward-selector-wrapper">
                <div class="ward-selector-header">
                    <h3>
                        <i class="fa-solid fa-map-location-dot"></i>
                        Explore Ward-Level Data
                    </h3>
                </div>

                <div class="ward-selector-button">
                    <input
                        type="text"
                        class="ward-selector-input"
                        placeholder="${this.options.placeholder}"
                        readonly
                    />
                    <i class="fa-solid fa-chevron-down ward-selector-icon"></i>

                    <div class="ward-selector-dropdown">
                        <div class="ward-search-box">
                            <i class="fa-solid fa-magnifying-glass ward-search-icon"></i>
                            <input
                                type="text"
                                class="ward-search-input"
                                placeholder="Search by ward name..."
                            />
                        </div>

                        <div class="ward-filter-chips">
                            <button class="filter-chip active" data-corp="all">All (${this.allWards.length})</button>
                            ${this.renderCorpFilters()}
                        </div>

                        <div class="ward-list">
                            ${this.renderWardList()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCorpFilters() {
        const corps = ['Central', 'East', 'West', 'North', 'South'];
        return corps.map(corp => {
            const count = this.allWards.filter(w => w.corporation === corp).length;
            return `<button class="filter-chip" data-corp="${corp}">${corp} (${count})</button>`;
        }).join('');
    }

    renderWardList() {
        if (this.filteredWards.length === 0) {
            return `
                <div class="ward-list-empty">
                    <i class="fa-solid fa-circle-xmark"></i>
                    <p>No wards found</p>
                </div>
            `;
        }

        return this.filteredWards.map(ward => `
            <div class="ward-list-item" data-slug="${ward.slug}">
                <div>
                    <div class="ward-name">${ward.name}</div>
                    <div class="ward-local">${ward.name_local}</div>
                </div>
                <span class="ward-corp-badge">${ward.corporation}</span>
            </div>
        `).join('');
    }

    renderError() {
        this.container.innerHTML = `
            <div class="ward-selector-wrapper">
                <div class="ward-selector-loading">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <p>Failed to load ward data. Please refresh the page.</p>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Toggle dropdown
        const input = this.container.querySelector('.ward-selector-input');
        const dropdown = this.container.querySelector('.ward-selector-dropdown');
        const button = this.container.querySelector('.ward-selector-button');

        input.addEventListener('click', () => {
            dropdown.classList.toggle('active');
            button.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                dropdown.classList.remove('active');
                button.classList.remove('active');
            }
        });

        // Search input
        const searchInput = this.container.querySelector('.ward-search-input');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.filterWards();
        });

        // Corporation filters
        const filterChips = this.container.querySelectorAll('.filter-chip');
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                // Update active state
                filterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                // Update filter
                const corp = chip.dataset.corp;
                this.selectedCorp = corp === 'all' ? null : corp;
                this.filterWards();
            });
        });

        // Ward selection
        this.attachWardClickListeners();
    }

    attachWardClickListeners() {
        const wardItems = this.container.querySelectorAll('.ward-list-item');
        wardItems.forEach(item => {
            item.addEventListener('click', () => {
                const slug = item.dataset.slug;
                this.selectWard(slug);
            });
        });
    }

    async filterWards() {
        // Start with all wards
        let filtered = [...this.allWards];

        // Filter by corporation
        if (this.selectedCorp) {
            filtered = filtered.filter(w => w.corporation === this.selectedCorp);
        }

        // Filter by search query
        if (this.searchQuery.trim()) {
            if (typeof Fuse !== 'undefined') {
                // Use Fuse.js for fuzzy search
                const fuse = new Fuse(filtered, {
                    keys: ['name', 'name_local'],
                    threshold: 0.4,
                    minMatchCharLength: 2
                });
                const results = fuse.search(this.searchQuery);
                filtered = results.map(r => r.item);
            } else {
                // Fallback to simple search
                const query = this.searchQuery.toLowerCase();
                filtered = filtered.filter(w =>
                    w.name.toLowerCase().includes(query) ||
                    w.name_local.includes(this.searchQuery)
                );
            }
        }

        this.filteredWards = filtered;

        // Re-render ward list
        const wardList = this.container.querySelector('.ward-list');
        wardList.innerHTML = this.renderWardList();

        // Re-attach click listeners
        this.attachWardClickListeners();
    }

    selectWard(slug) {
        const ward = this.allWards.find(w => w.slug === slug);
        if (!ward) {
            console.error(`Ward not found: ${slug}`);
            return;
        }

        // Call custom onSelect if provided
        if (this.options.onSelect) {
            this.options.onSelect(ward);
            return;
        }

        // Default: navigate to ward page
        const url = `/cities/bengaluru/climate/${this.options.sector}/wards/${slug}/`;
        window.location.href = url;
    }
}

// Export as global
window.WardSelector = WardSelector;
