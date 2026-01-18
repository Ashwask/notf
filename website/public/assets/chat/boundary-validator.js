/**
 * Boundary Validator
 * Strict boundary validation - rejects complaints outside known boundaries
 * Uses point-in-polygon algorithm with city/corporation boundaries
 */

class BoundaryValidator {
    constructor() {
        this.bengaluruBoundaries = null;
        this.cityBoundaries = new Map();
        this.loadingPromises = new Map();

        // Supported cities
        this.supportedCities = [
            { code: 'ahmedabad', name: 'Ahmedabad', file: 'ahmedabad-wards.geojson' },
            { code: 'bhubaneswar', name: 'Bhubaneswar', file: 'bhubaneshwar-wards.geojson' },
            { code: 'chennai', name: 'Chennai', file: 'chennai-wards.geojson' },
            { code: 'gurugram', name: 'Gurugram', file: 'gurugram-wards.geojson' },
            { code: 'hyderabad', name: 'Hyderabad', file: 'hyderabad-wards.geojson' },
            { code: 'jaipur', name: 'Jaipur', file: 'jaipur-wards.geojson' },
            { code: 'kolkata', name: 'Kolkata', file: 'kolkata-wards.geojson' },
            { code: 'mumbai', name: 'Mumbai', file: 'mumbai-wards.geojson' },
            { code: 'pune', name: 'Pune', file: 'pune-wards.geojson' },
            { code: 'thane', name: 'Thane', file: 'thane-wards.geojson' },
            { code: 'visakhapatnam', name: 'Visakhapatnam', file: 'vizag-wards.geojson' }
        ];
    }

    async validateLocation(lat, lng, userProvidedCity) {
        // Check if it's Bengaluru first (most detailed - 5 corporations)
        if (this.isProbablyBengaluru(lat, lng, userProvidedCity)) {
            return await this.validateBengaluruLocation(lat, lng);
        }

        // Check other 11 cities
        return await this.validateOtherCityLocation(lat, lng, userProvidedCity);
    }

    isProbablyBengaluru(lat, lng, userProvidedCity) {
        // Rough bounding box for Bengaluru
        const bengaluruBox = {
            minLat: 12.7342,
            maxLat: 13.1736,
            minLng: 77.3766,
            maxLng: 77.8826
        };

        const inBBox = lat >= bengaluruBox.minLat && lat <= bengaluruBox.maxLat &&
                       lng >= bengaluruBox.minLng && lng <= bengaluruBox.maxLng;

        const cityMatch = userProvidedCity?.toLowerCase().includes('bengaluru') ||
                         userProvidedCity?.toLowerCase().includes('bangalore');

        return inBBox || cityMatch;
    }

    async validateBengaluruLocation(lat, lng) {
        // Load Bengaluru boundaries if not loaded
        if (!this.bengaluruBoundaries) {
            try {
                const response = await fetch('/assets/data/bengaluru-corporations.geojson');
                if (!response.ok) throw new Error('Failed to load boundaries');
                this.bengaluruBoundaries = await response.json();
            } catch (error) {
                console.error('Failed to load Bengaluru boundaries:', error);
                return {
                    valid: false,
                    error: 'boundary_loading_failed',
                    message: 'Unable to load boundary data. Please try again or select your corporation manually.'
                };
            }
        }

        // Point-in-polygon check against all 5 corporations
        for (const feature of this.bengaluruBoundaries.features) {
            if (this.pointInPolygon([lng, lat], feature.geometry)) {
                return {
                    valid: true,
                    city: 'Bengaluru',
                    corporation_code: feature.properties.code,
                    corporation_id: feature.properties.id,
                    corporation_name: feature.properties.name,
                    ward: feature.properties.ward || null
                };
            }
        }

        // Location is outside all 5 corporations
        return {
            valid: false,
            error: 'location_outside_bengaluru',
            message: 'This location is outside Bengaluru corporation boundaries. Please verify the address.',
            suggested_action: 'try_different_address',
            nearest_city: await this.findNearestCity(lat, lng)
        };
    }

    async validateOtherCityLocation(lat, lng, userProvidedCity) {
        // Try to determine which city based on coordinates or user input
        let targetCity = null;

        if (userProvidedCity) {
            targetCity = this.supportedCities.find(city =>
                userProvidedCity.toLowerCase().includes(city.name.toLowerCase())
            );
        }

        if (!targetCity) {
            // Try all cities (expensive but necessary)
            for (const city of this.supportedCities) {
                const inCity = await this.checkCityBoundary(lat, lng, city);
                if (inCity) {
                    targetCity = city;
                    break;
                }
            }
        }

        if (!targetCity) {
            // Location is outside all known cities
            return {
                valid: false,
                error: 'location_outside_all_boundaries',
                message: this.getOutOfBoundsMessage(lat, lng),
                suggested_action: 'view_coverage_map',
                nearest_city: await this.findNearestCity(lat, lng)
            };
        }

        // Load city boundary and validate
        const cityData = await this.loadCityBoundary(targetCity.code);

        if (!cityData) {
            return {
                valid: false,
                error: 'boundary_loading_failed',
                message: 'Unable to load boundary data for ' + targetCity.name
            };
        }

        // Fallback mode: boundary file not available (KML not yet converted)
        if (cityData === 'fallback') {
            console.warn(`Using fallback mode for ${targetCity.name} - boundary validation skipped`);
            return {
                valid: true,
                city: targetCity.name,
                corporation_code: targetCity.code,
                corporation_id: null, // Will be resolved by API
                corporation_name: targetCity.name + ' Municipal Corporation',
                ward: null,
                fallback_mode: true,
                note: 'Boundary validation unavailable - location accepted based on user input'
            };
        }

        // Check if point is within city boundary
        const isInside = this.pointInPolygon([lng, lat], cityData.geometry);

        if (isInside) {
            return {
                valid: true,
                city: targetCity.name,
                corporation_code: targetCity.code,
                corporation_id: cityData.properties?.id || null,
                corporation_name: targetCity.name + ' Municipal Corporation',
                ward: this.detectWard(lat, lng, cityData)
            };
        } else {
            return {
                valid: false,
                error: 'location_outside_city',
                message: `This location is outside ${targetCity.name} municipal boundaries. Please verify the address.`,
                suggested_action: 'try_different_address',
                nearest_city: await this.findNearestCity(lat, lng)
            };
        }
    }

    async checkCityBoundary(lat, lng, city) {
        const cityData = await this.loadCityBoundary(city.code);
        if (!cityData) return false;

        return this.pointInPolygon([lng, lat], cityData.geometry);
    }

    async loadCityBoundary(cityCode) {
        // Check cache first
        if (this.cityBoundaries.has(cityCode)) {
            return this.cityBoundaries.get(cityCode);
        }

        // Check if already loading
        if (this.loadingPromises.has(cityCode)) {
            return await this.loadingPromises.get(cityCode);
        }

        // Start loading
        const loadPromise = (async () => {
            try {
                const city = this.supportedCities.find(c => c.code === cityCode);
                if (!city) return null;

                const response = await fetch(`/assets/data/cities/${city.file}`);
                if (!response.ok) {
                    console.warn(`Boundary file not found for ${cityCode}. Using fallback mode.`);
                    throw new Error('Boundary file not available');
                }

                const geojson = await response.json();

                // Assume the GeoJSON has a single feature for city boundary
                // Or merge all wards into single boundary
                const cityBoundary = geojson.features ? geojson.features[0] : geojson;

                // Cache it
                this.cityBoundaries.set(cityCode, cityBoundary);
                this.loadingPromises.delete(cityCode);

                return cityBoundary;
            } catch (error) {
                console.warn(`Failed to load ${cityCode} boundary:`, error.message);
                console.warn(`Fallback mode: Accepting location without strict boundary validation`);
                this.loadingPromises.delete(cityCode);

                // Return a fallback "boundary" that accepts the location
                // This is used when GeoJSON files are not yet converted from KML
                return 'fallback';
            }
        })();

        this.loadingPromises.set(cityCode, loadPromise);
        return await loadPromise;
    }

    pointInPolygon(point, geometry) {
        // Simple ray casting algorithm for point-in-polygon
        // point is [lng, lat]
        // geometry is GeoJSON geometry object

        if (geometry.type === 'Polygon') {
            return this.pointInPolygonRing(point, geometry.coordinates[0]);
        } else if (geometry.type === 'MultiPolygon') {
            for (const polygon of geometry.coordinates) {
                if (this.pointInPolygonRing(point, polygon[0])) {
                    return true;
                }
            }
            return false;
        }

        return false;
    }

    pointInPolygonRing(point, ring) {
        const [x, y] = point;
        let inside = false;

        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    }

    detectWard(lat, lng, cityData) {
        // If city data has ward information, detect it
        // For now, return null - can be enhanced later
        return null;
    }

    getOutOfBoundsMessage(lat, lng) {
        return `⚠️ This location is outside our service areas.

We currently support complaints from:
• Bengaluru (5 corporations)
• Mumbai, Chennai, Ahmedabad, Bhubaneswar, Gurugram, Hyderabad, Jaipur, Kolkata, Pune, Thane, Visakhapatnam

Please verify the address is within one of these cities.`;
    }

    async findNearestCity(lat, lng) {
        // Calculate distance to all city centers
        const cityCenters = {
            'Bengaluru': { lat: 12.9716, lng: 77.5946 },
            'Mumbai': { lat: 19.0760, lng: 72.8777 },
            'Chennai': { lat: 13.0827, lng: 80.2707 },
            'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
            'Hyderabad': { lat: 17.3850, lng: 78.4867 },
            'Kolkata': { lat: 22.5726, lng: 88.3639 },
            'Pune': { lat: 18.5204, lng: 73.8567 },
            'Jaipur': { lat: 26.9124, lng: 75.7873 },
            'Gurugram': { lat: 28.4595, lng: 77.0266 },
            'Thane': { lat: 19.2183, lng: 72.9781 },
            'Bhubaneswar': { lat: 20.2961, lng: 85.8245 },
            'Visakhapatnam': { lat: 17.6869, lng: 83.2185 }
        };

        let nearest = null;
        let minDistance = Infinity;

        for (const [cityName, coords] of Object.entries(cityCenters)) {
            const distance = this.calculateDistance(lat, lng, coords.lat, coords.lng);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = { name: cityName, distance: Math.round(distance) };
            }
        }

        return nearest;
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        // Haversine formula for distance in km
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * Math.PI / 180;
    }
}
