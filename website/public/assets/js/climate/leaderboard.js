/**
 * Ward Leaderboard Component
 * Sortable table of all wards with climate metrics
 */

class WardLeaderboard {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Leaderboard container not found: ${containerId}`);
            return;
        }

        this.options = {
            sector: options.sector || 'energy_buildings',
            sectorSlug: options.sectorSlug || 'energy',
            defaultMetric: options.defaultMetric || 'clean_cooking',
            metrics: options.metrics || [],
            ...options
        };

        this.allWards = [];
        this.filteredWards = [];
        this.selectedCorp = 'all';
        this.selectedMetric = this.options.defaultMetric;
        this.sortField = 'rank';
        this.sortDirection = 'asc';

        this.init();
    }

    async init() {
        this.renderLoading();

        try {
            // Load all corporation data
            const corporations = ['Central', 'East', 'West', 'North', 'South'];
            const promises = corporations.map(corp =>
                window.climateData.loadCorporationData(corp)
            );

            const corpData = await Promise.all(promises);

            // Flatten all wards
            this.allWards = corpData.flatMap(data => data.wards);

            // Calculate rankings for current metric
            this.calculateRankings();

            // Render leaderboard
            this.render();
            this.attachEventListeners();
        } catch (error) {
            console.error('Failed to load leaderboard data:', error);
            this.renderError();
        }
    }

    renderLoading() {
        this.container.innerHTML = `
            <div class="leaderboard-loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Loading ward data...</p>
            </div>
        `;
    }

    renderError() {
        this.container.innerHTML = `
            <div class="leaderboard-empty">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>Failed to load leaderboard data. Please refresh the page.</p>
            </div>
        `;
    }

    calculateRankings() {
        const metricDef = this.options.metrics.find(m => m.key === this.selectedMetric);
        if (!metricDef) return;

        // Extract values
        const values = [];
        this.allWards.forEach(ward => {
            const value = this.getMetricValue(ward, metricDef);
            if (value !== null && value !== undefined) {
                values.push({ ward, value });
            }
        });

        // Sort values (handle inverted metrics)
        values.sort((a, b) => {
            if (metricDef.inverted) {
                return a.value - b.value; // Lower is better
            } else {
                return b.value - a.value; // Higher is better
            }
        });

        // Assign ranks
        values.forEach((item, index) => {
            item.ward._rank = index + 1;
            item.ward._value = item.value;
        });

        // Wards without data get last rank
        this.allWards.forEach(ward => {
            if (ward._rank === undefined) {
                ward._rank = this.allWards.length;
                ward._value = null;
            }
        });
    }

    getMetricValue(ward, metricDef) {
        try {
            const sector = ward[this.options.sector];
            if (!sector) return null;

            const metric = sector[metricDef.key];
            if (!metric) return null;

            if (typeof metric === 'object') {
                return metric[metricDef.path];
            }

            return metric;
        } catch (e) {
            return null;
        }
    }

    filterWards() {
        let filtered = [...this.allWards];

        // Filter by corporation
        if (this.selectedCorp !== 'all') {
            filtered = filtered.filter(w => w.corporation === this.selectedCorp);
        }

        this.filteredWards = filtered;
    }

    sortWards() {
        this.filteredWards.sort((a, b) => {
            let aVal, bVal;

            switch (this.sortField) {
                case 'rank':
                    aVal = a._rank || 999;
                    bVal = b._rank || 999;
                    break;
                case 'name':
                    aVal = a.ward_name;
                    bVal = b.ward_name;
                    break;
                case 'corporation':
                    aVal = a.corporation;
                    bVal = b.corporation;
                    break;
                case 'value':
                    aVal = a._value !== null ? a._value : -999;
                    bVal = b._value !== null ? b._value : -999;
                    break;
                default:
                    return 0;
            }

            if (typeof aVal === 'string') {
                return this.sortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            return this.sortDirection === 'asc'
                ? aVal - bVal
                : bVal - aVal;
        });
    }

    render() {
        this.filterWards();
        this.sortWards();

        const metricDef = this.options.metrics.find(m => m.key === this.selectedMetric);

        this.container.innerHTML = `
            <div class="leaderboard-table-wrapper">
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th class="sortable ${this.sortField === 'rank' ? 'sort-' + this.sortDirection : ''}"
                                data-sort="rank">
                                Rank
                            </th>
                            <th class="sortable ${this.sortField === 'name' ? 'sort-' + this.sortDirection : ''}"
                                data-sort="name">
                                Ward
                            </th>
                            <th class="sortable ${this.sortField === 'corporation' ? 'sort-' + this.sortDirection : ''}"
                                data-sort="corporation">
                                Corporation
                            </th>
                            <th class="sortable ${this.sortField === 'value' ? 'sort-' + this.sortDirection : ''}"
                                data-sort="value">
                                ${metricDef ? metricDef.name : 'Value'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderRows()}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderRows() {
        if (this.filteredWards.length === 0) {
            return `
                <tr>
                    <td colspan="4" style="text-align: center; padding: var(--space-2xl);">
                        <div class="leaderboard-empty">
                            <i class="fa-solid fa-circle-xmark"></i>
                            <p>No wards found</p>
                        </div>
                    </td>
                </tr>
            `;
        }

        return this.filteredWards.map(ward => this.renderRow(ward)).join('');
    }

    renderRow(ward) {
        const rank = ward._rank || this.allWards.length;
        const value = ward._value;
        const metricDef = this.options.metrics.find(m => m.key === this.selectedMetric);

        // Determine rank badge class
        let rankClass = 'middle';
        if (rank <= 3) rankClass = 'top-3';
        else if (rank <= 10) rankClass = 'top-10';
        else if (rank > this.allWards.length - 20) rankClass = 'bottom';

        // Determine value bar status
        let barStatus = 'medium';
        let barWidth = 50;

        if (value !== null && metricDef) {
            if (metricDef.inverted) {
                // Lower is better
                if (value < 30) {
                    barStatus = 'high';
                    barWidth = 100 - value;
                } else if (value < 70) {
                    barStatus = 'medium';
                    barWidth = 100 - value;
                } else {
                    barStatus = 'low';
                    barWidth = 100 - value;
                }
            } else {
                // Higher is better
                if (value >= 70) {
                    barStatus = 'high';
                    barWidth = value;
                } else if (value >= 30) {
                    barStatus = 'medium';
                    barWidth = value;
                } else {
                    barStatus = 'low';
                    barWidth = value;
                }
            }
        }

        const valueDisplay = value !== null
            ? `${value.toFixed(1)}${metricDef?.unit || ''}`
            : 'No data';

        const corpClass = ward.corporation.toLowerCase();

        return `
            <tr>
                <td>
                    <span class="rank-badge ${rankClass}">${rank}</span>
                </td>
                <td>
                    <div class="ward-name-cell">
                        <a href="/cities/bengaluru/climate/${this.options.sectorSlug}/wards/${ward.slug}/"
                           class="ward-link">
                            ${ward.ward_name}
                        </a>
                        <span class="ward-name-local">${ward.ward_name_local}</span>
                    </div>
                </td>
                <td>
                    <span class="corp-badge ${corpClass}">${ward.corporation}</span>
                </td>
                <td>
                    <div class="value-cell">
                        <span class="value-number">${valueDisplay}</span>
                        ${value !== null ? `
                            <div class="value-bar">
                                <div class="value-bar-fill ${barStatus}" style="width: ${barWidth}%"></div>
                            </div>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    attachEventListeners() {
        // Sort by column
        const headers = this.container.querySelectorAll('th.sortable');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const field = header.dataset.sort;

                if (this.sortField === field) {
                    // Toggle direction
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    // New field, default to asc
                    this.sortField = field;
                    this.sortDirection = 'asc';
                }

                this.render();
                this.attachEventListeners();
            });
        });
    }

    updateMetric(metricKey) {
        this.selectedMetric = metricKey;
        this.calculateRankings();
        this.render();
        this.attachEventListeners();
    }

    updateCorporation(corp) {
        this.selectedCorp = corp;
        this.render();
        this.attachEventListeners();
    }
}

// Export as global
window.WardLeaderboard = WardLeaderboard;
