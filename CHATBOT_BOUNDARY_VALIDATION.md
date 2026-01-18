# NOTF Chatbot - Strict Boundary Validation
## Critical Requirement: No Unassigned Complaints

---

## Overview

The NOTF chatbot must enforce **strict boundary validation**. Unlike some systems that accept all complaints and route to "unassigned", this chatbot will **reject complaints** that fall outside known municipal boundaries.

---

## Validation Logic

### Step 1: Geocode User Location

User provides location via:
- Address text input (geocode via Nominatim API)
- Map click (direct lat/lng)
- GPS location (direct lat/lng)

**Result:** `{lat, lng, address_string}`

---

### Step 2: Boundary Detection

```javascript
class BoundaryValidator {
  constructor() {
    this.bengaluruBoundaries = null;  // 5 corporation GeoJSONs
    this.cityBoundaries = null;        // 11 city KML boundaries
  }

  async validateLocation(lat, lng, userProvidedCity) {
    // Check Bengaluru first (5 corporations)
    if (userProvidedCity === 'Bengaluru' || this.isProbablyBengaluru(lat, lng)) {
      const corporation = this.detectBengaluruCorporation(lat, lng);

      if (corporation) {
        return {
          valid: true,
          city: 'Bengaluru',
          corporation_code: corporation.code,
          corporation_id: corporation.id,
          corporation_name: corporation.name,
          ward: corporation.ward || null
        };
      } else {
        return {
          valid: false,
          error: 'location_outside_bengaluru',
          message: 'This location is outside Bengaluru corporation boundaries. Please verify the address.',
          suggested_action: 'try_different_address'
        };
      }
    }

    // Check other 11 cities
    const cityMatch = this.detectCity(lat, lng);

    if (cityMatch) {
      return {
        valid: true,
        city: cityMatch.name,
        corporation_code: cityMatch.code,
        corporation_id: cityMatch.id,
        corporation_name: cityMatch.name + ' Municipal Corporation',
        ward: cityMatch.ward || null
      };
    }

    // Location is outside all known boundaries
    return {
      valid: false,
      error: 'location_outside_all_boundaries',
      message: this.getOutOfBoundsMessage(lat, lng),
      suggested_action: 'view_coverage_map',
      nearest_city: this.findNearestCity(lat, lng)  // Helpful hint
    };
  }

  detectBengaluruCorporation(lat, lng) {
    // Point-in-polygon check against all 5 corporations
    for (const corp of this.bengaluruBoundaries.features) {
      if (turf.booleanPointInPolygon([lng, lat], corp.geometry)) {
        return {
          code: corp.properties.code,      // 'north', 'south', etc.
          id: corp.properties.id,          // UUID from database
          name: corp.properties.name,      // 'Bengaluru North Corporation'
          ward: corp.properties.ward       // Ward number if available
        };
      }
    }

    return null;  // Outside all 5 corporations
  }

  detectCity(lat, lng) {
    // Point-in-polygon check against 11 city boundaries (KML converted to GeoJSON)
    for (const city of this.cityBoundaries.features) {
      if (turf.booleanPointInPolygon([lng, lat], city.geometry)) {
        return {
          code: city.properties.code,      // 'mumbai', 'chennai', etc.
          id: city.properties.id,          // UUID from database
          name: city.properties.name,      // 'Mumbai'
          ward: city.properties.ward       // Ward if available
        };
      }
    }

    return null;  // Outside all 11 cities
  }

  getOutOfBoundsMessage(lat, lng) {
    const nearest = this.findNearestCity(lat, lng);

    if (nearest) {
      return `⚠️ This location appears to be outside our service areas.

The nearest supported city is ${nearest.name} (${nearest.distance}km away).

Supported areas:
• Bengaluru (5 corporations)
• Mumbai, Chennai, Ahmedabad, Bhubaneswar, Gurugram, Hyderabad, Jaipur, Kolkata, Pune, Thane, Visakhapatnam

Please verify the address or try selecting a different location.`;
    }

    return `⚠️ This location is outside our service areas.

We currently support complaints from:
• Bengaluru (5 corporations)
• Mumbai, Chennai, Ahmedabad, Bhubaneswar, Gurugram, Hyderabad, Jaipur, Kolkata, Pune, Thane, Visakhapatnam

Please verify the address is within one of these cities.`;
  }

  findNearestCity(lat, lng) {
    // Calculate distance to all city centers
    // Return nearest city with distance
    // Helpful for suggesting correct location
  }
}
```

---

### Step 3: Chatbot Response

#### ✅ Valid Location (Inside Boundary)

```
Bot: "Great! I've verified your location.

📍 Location: MG Road, Bengaluru
🏢 Corporation: Bengaluru North Corporation
🗺️ Ward: Ward 42 (auto-detected)

Your complaint will be routed to the Bengaluru North Corporation.

Is this correct?"

[Yes, Continue] [No, Change Location]
```

#### ❌ Invalid Location (Outside Boundary)

```
Bot: "⚠️ Location Validation Error

I couldn't verify this location within our service areas.

📍 You provided: [Address or coordinates]
❌ Issue: Location is outside Bengaluru corporation boundaries

This might happen if:
• The address is in a neighboring area
• The address needs more details (landmark, area name)
• There's a geocoding error

What would you like to do?"

[Try Different Address] [View Coverage Map] [Use Map Picker] [Contact Support]
```

---

## User Recovery Options

### Option 1: Try Different Address
- Allow user to re-enter address
- Provide examples: "Try adding area name: 'MG Road, Indiranagar, Bengaluru'"
- Show address format tips

### Option 2: View Coverage Map
- Display interactive map showing all 12 city boundaries
- Highlight the area they selected (outside boundaries)
- Show nearest supported area
- Allow clicking on map to select valid location

### Option 3: Use Map Picker
- Show Leaflet map with corporation/city boundaries overlaid
- User clicks directly on map to select location
- Instant boundary validation feedback
- Visual confirmation of which corporation/city

### Option 4: Contact Support
- Provide contact information
- Option to submit feedback about missing area
- Suggest alternative channels (email, phone)

---

## Boundary Data Loading

### Bengaluru Corporation Boundaries

**Source:** `/Users/sathya/Documents/GitHub/notf-cms/files/gba_corporation.geojson`

**Structure:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "code": "north",
        "id": "uuid-here",
        "name": "Bengaluru North Corporation",
        "ward": 42
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], ...]]
      }
    },
    // ... 4 more corporations
  ]
}
```

**Loading:**
```javascript
// Copy to /website/src/assets/data/bengaluru-corporations.geojson
const response = await fetch('/assets/data/bengaluru-corporations.geojson');
const bengaluruBoundaries = await response.json();
```

---

### 11 City Ward Boundaries

**Source:** `/Users/sathya/Documents/GitHub/notf/supporting documents/{city-name}/{city-name}-wards.kml`

**Files:**
- `ahmedabad/ahmedabad-wards.kml`
- `bhubaneshwar/bhubaneshwar-wards.kml`
- `chennai/chennai-wards.kml`
- `gurugram/gurugram-wards.kml`
- `hyderabad/hyderabad-wards.kml`
- `jaipur/jaipur-wards.kml`
- `kolkata/kolkata-wards.kml`
- `mumbai/mumbai-wards.kml`
- `pune/pune-wards.kml`
- `thane/thane-wards.kml`
- `vizag/vizag-wards.kml`

**Conversion Required:** KML → GeoJSON

```bash
# Using ogr2ogr (GDAL tool) or togeojson library
npm install -g @mapbox/togeojson
togeojson mumbai-wards.kml > mumbai-wards.geojson
```

**Loading:**
```javascript
// Lazy load city boundaries on demand
async function loadCityBoundary(cityName) {
  const response = await fetch(`/assets/data/cities/${cityName}-wards.geojson`);
  return await response.json();
}

// Or load all at once (might be slow)
const cityBoundaries = await Promise.all([
  fetch('/assets/data/cities/mumbai-wards.geojson').then(r => r.json()),
  fetch('/assets/data/cities/chennai-wards.geojson').then(r => r.json()),
  // ... etc
]);
```

---

## Performance Optimization

### Caching Strategy

```javascript
class BoundaryCache {
  constructor() {
    this.cache = new Map();
  }

  async getBoundaries(cityName) {
    // Check localStorage first
    const cached = localStorage.getItem(`boundaries_${cityName}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Check if cache is fresh (e.g., < 7 days old)
      if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
        return parsed.data;
      }
    }

    // Fetch from server
    const data = await fetch(`/assets/data/cities/${cityName}-wards.geojson`).then(r => r.json());

    // Cache for next time
    localStorage.setItem(`boundaries_${cityName}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));

    return data;
  }
}
```

### Lazy Loading

```javascript
// Only load boundaries when needed
async function validateLocation(lat, lng, cityHint) {
  // Load only relevant boundaries
  if (cityHint === 'Bengaluru') {
    const boundaries = await loadBengaluruBoundaries();
    return validateAgainstBengaluru(lat, lng, boundaries);
  } else if (cityHint === 'Mumbai') {
    const boundaries = await loadCityBoundary('mumbai');
    return validateAgainstCity(lat, lng, boundaries, 'Mumbai');
  }
  // ... etc
}
```

### Web Workers

```javascript
// Offload heavy computation to web worker
const boundaryWorker = new Worker('/assets/chat/boundary-worker.js');

boundaryWorker.postMessage({
  type: 'validate',
  lat,
  lng,
  boundaries: bengaluruBoundaries
});

boundaryWorker.onmessage = (e) => {
  const result = e.data;  // {valid: true/false, corporation: ...}
  handleValidationResult(result);
};
```

---

## Error Handling

### Geocoding Failures

```javascript
async function geocodeAddress(address) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    );
    const results = await response.json();

    if (results.length === 0) {
      return {
        success: false,
        error: 'address_not_found',
        message: 'Could not find this address. Please try adding more details (area, landmark, city).'
      };
    }

    return {
      success: true,
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
      display_name: results[0].display_name
    };
  } catch (error) {
    return {
      success: false,
      error: 'geocoding_failed',
      message: 'Unable to verify address. Please try using the map picker instead.'
    };
  }
}
```

### Boundary Loading Failures

```javascript
async function loadBoundaries() {
  try {
    const response = await fetch('/assets/data/bengaluru-corporations.geojson');
    if (!response.ok) throw new Error('Failed to load');
    return await response.json();
  } catch (error) {
    // Fallback: Allow manual corporation selection
    return {
      error: true,
      message: 'Unable to load boundary data. Please select your corporation manually.',
      fallback_mode: 'manual_selection'
    };
  }
}
```

---

## Testing Plan

### Test Cases

1. ✅ **Valid Bengaluru Location (North Corp)**
   - Address: "MG Road, Bengaluru"
   - Expected: Corporation = north, Valid = true

2. ✅ **Valid Bengaluru Location (South Corp)**
   - Address: "Jayanagar, Bengaluru"
   - Expected: Corporation = south, Valid = true

3. ✅ **Valid Mumbai Location**
   - Address: "Marine Drive, Mumbai"
   - Expected: Corporation = mumbai, Valid = true

4. ❌ **Invalid Location (Outside Bengaluru)**
   - Address: "Whitefield, Bengaluru" (might be outside corporation boundary)
   - Expected: Valid = false, Error message shown

5. ❌ **Invalid Location (Different City)**
   - Address: "New Delhi, Delhi"
   - Expected: Valid = false (Delhi not in supported cities list)

6. ❌ **Invalid Location (Random coordinates)**
   - Lat/Lng: 0, 0 (middle of ocean)
   - Expected: Valid = false, Helpful error message

7. ✅ **Boundary Edge Case**
   - Coordinates very close to boundary line
   - Expected: Correctly detected as inside/outside

---

## UI/UX Mockup

### Validation Success

```
┌─────────────────────────────────────────┐
│ ✅ Location Verified                    │
├─────────────────────────────────────────┤
│ 📍 MG Road, Bengaluru North             │
│ 🏢 Bengaluru North Corporation          │
│ 🗺️ Ward 42                              │
│                                         │
│ [Map showing location with boundary]    │
│                                         │
│ [✓ Correct] [Change Location]          │
└─────────────────────────────────────────┘
```

### Validation Failure

```
┌─────────────────────────────────────────┐
│ ⚠️ Location Validation Error            │
├─────────────────────────────────────────┤
│ We couldn't verify this location        │
│ within our service areas.               │
│                                         │
│ 📍 You entered:                         │
│ "Electronic City, Bengaluru"            │
│                                         │
│ ❌ This location appears to be outside  │
│ Bengaluru corporation boundaries.       │
│                                         │
│ Nearest supported area:                 │
│ Bengaluru South Corporation (5km)       │
│                                         │
│ [Try Different Address]                 │
│ [Use Map Picker] 🗺️                    │
│ [View Coverage Areas]                   │
│ [Contact Support] 📞                    │
└─────────────────────────────────────────┘
```

---

## Database Note

The `unassigned` corporation in the database (code: 'unassigned') is for:
- Admin manual entries
- Backend system use
- Testing purposes

**The chatbot will NEVER use it.** All complaints must be validated and tagged with a specific corporation or rejected.

---

## Summary

**Core Principle:** Strict boundary validation ensures data quality and proper routing.

**User Experience:** Clear, helpful error messages with recovery options.

**Technical Approach:** Point-in-polygon validation using Turf.js and GeoJSON boundaries.

**No Compromises:** If location can't be verified, don't accept the complaint.

---

**Last Updated:** 2026-01-18
**Status:** Requirement clarification for Phase C implementation
