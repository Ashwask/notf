/**
 * Climate Data Map Overlay
 * Adds choropleth climate visualization to Bengaluru ward map
 */

class ClimateMapOverlay {
    constructor(map, wardBoundaries) {
        this.map = map;
        this.wardBoundaries = wardBoundaries;
        this.climateData = null;
        this.wardIndex = null;
        this.currentSector = 'energy_buildings';
        this.currentMetric = 'clean_cooking';
        this.climateLayer = null;
        this.isActive = false;
    }

    async loadClimateData() {
        try {
            // Load city climate data
            const cityResponse = await fetch('/assets/data/climate/bengaluru/city_climate.json');
            this.climateData = await cityResponse.json();

            // Load ward index
            const indexResponse = await fetch('/assets/data/climate/bengaluru/ward_index.json');
            this.wardIndex = await indexResponse.json();

            console.log('✅ Climate data loaded:', this.climateData.total_wards, 'wards');
            return true;
        } catch (error) {
            console.error('❌ Error loading climate data:', error);
            return false;
        }
    }

    async loadWardClimateData(wardSlug) {
        // Find ward's corporation
        const ward = this.wardIndex.wards.find(w => w.slug === wardSlug);
        if (!ward) return null;

        const corp = ward.corporation.toLowerCase();

        try {
            const response = await fetch(`/assets/data/climate/bengaluru/climate_${corp}.json`);
            const data = await response.json();
            const wardData = data.wards.find(w => w.slug === wardSlug);
            return wardData;
        } catch (error) {
            console.error(`Error loading ward data for ${wardSlug}:`, error);
            return null;
        }
    }

    getColorForValue(value, metric, inverted = false) {
        if (value === null || value === undefined) {
            return '#CCCCCC'; // Gray for no data
        }

        // Determine color based on value thresholds
        let threshold1, threshold2;

        if (inverted) {
            // Lower is better (e.g., pollution, waste)
            threshold1 = 30;
            threshold2 = 70;
            if (value < threshold1) return '#2F4A2C'; // Dark green (good)
            if (value < threshold2) return '#F5B82E'; // Yellow (medium)
            return '#C45A2A'; // Terracotta (poor)
        } else {
            // Higher is better (e.g., renewable energy, recycling)
            threshold1 = 30;
            threshold2 = 70;
            if (value >= threshold2) return '#2F4A2C'; // Dark green (good)
            if (value >= threshold1) return '#F5B82E'; // Yellow (medium)
            return '#C45A2A'; // Terracotta (poor)
        }
    }

    async renderClimateLayer() {
        if (this.climateLayer) {
            this.map.removeLayer(this.climateLayer);
        }

        if (!this.climateData) {
            await this.loadClimateData();
        }

        // Load ward boundaries GeoJSON
        const response = await fetch('/assets/data/boundaries/bengaluru-wards.geojson');
        const geojson = await response.json();

        // Create choropleth layer
        this.climateLayer = L.geoJSON(geojson, {
            style: (feature) => {
                const wardName = feature.properties.name || feature.properties.Name || feature.properties.WARD_NAME;

                // For now, use dummy data - actual metric matching would need ward name normalization
                const value = Math.random() * 100; // Replace with actual data lookup
                const color = this.getColorForValue(value, this.currentMetric, false);

                return {
                    color: '#333',
                    weight: 1,
                    fillOpacity: 0.6,
                    fillColor: color,
                    opacity: 0.8
                };
            },
            onEachFeature: (feature, layer) => {
                const wardName = feature.properties.name || feature.properties.Name || feature.properties.WARD_NAME;

                // Bind popup with climate data
                layer.on('click', async (e) => {
                    // Find matching ward in index
                    const matchingWard = this.wardIndex.wards.find(w =>
                        w.name.toLowerCase() === wardName.toLowerCase()
                    );

                    if (matchingWard) {
                        const wardData = await this.loadWardClimateData(matchingWard.slug);
                        if (wardData) {
                            const popupContent = this.createClimatePopup(wardData, matchingWard);
                            layer.bindPopup(popupContent).openPopup();
                        }
                    } else {
                        layer.bindPopup(`
                            <div class="popup-title">${wardName}</div>
                            <p style="color: #999; font-size: 0.9rem;">Climate data loading...</p>
                        `).openPopup();
                    }
                });

                // Tooltip on hover
                layer.bindTooltip(`
                    <strong>${wardName}</strong><br>
                    Click to view climate data
                `, {
                    className: 'ward-tooltip'
                });
            }
        });

        if (this.isActive) {
            this.climateLayer.addTo(this.map);
        }

        return this.climateLayer;
    }

    createClimatePopup(wardData, wardMeta) {
        const sector = wardData[this.currentSector] || {};

        let metricsHtml = '';
        Object.keys(sector).forEach(metricKey => {
            if (metricKey === 'total_households') return;

            const metric = sector[metricKey];
            if (metric && metric.value !== undefined) {
                const value = metric.percentage || metric.value;
                const unit = metric.percentage !== undefined ? '%' : '';

                metricsHtml += `
                    <div style="margin: 0.5rem 0;">
                        <strong>${metricKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong>
                        ${value}${unit}
                    </div>
                `;
            }
        });

        return `
            <div class="popup-title">${wardData.ward_name}</div>
            <div class="popup-subtitle" style="color: #666; font-size: 0.85rem; margin-bottom: 0.5rem;">
                ${wardMeta.corporation} Corporation | Pop: ${wardMeta.population.toLocaleString()}
            </div>
            ${metricsHtml || '<p style="color: #999;">No data available for this sector</p>'}
            <div style="margin-top: 0.75rem;">
                <a href="/cities/bengaluru/climate/energy/wards/${wardData.slug}/"
                   style="color: #2F4A2C; text-decoration: none; font-weight: 600; font-size: 0.85rem;">
                    <i class="fa-solid fa-arrow-right"></i> View Full Ward Profile
                </a>
            </div>
        `;
    }

    toggleClimateLayer(show) {
        this.isActive = show;

        if (show) {
            if (!this.climateLayer) {
                this.renderClimateLayer();
            } else {
                this.climateLayer.addTo(this.map);
            }
        } else {
            if (this.climateLayer) {
                this.map.removeLayer(this.climateLayer);
            }
        }
    }

    async changeSector(sector) {
        this.currentSector = sector;
        await this.renderClimateLayer();
    }

    async changeMetric(metric) {
        this.currentMetric = metric;
        await this.renderClimateLayer();
    }
}

// Export for use in main map script
window.ClimateMapOverlay = ClimateMapOverlay;
