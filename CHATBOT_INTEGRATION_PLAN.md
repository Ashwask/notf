# NOTF Chatbot Integration Plan
## Integrating notf-cms Complaint System with notf Discovery Platform

---

## Executive Summary

Create a unified chatbot on the NOTF homepage that:
1. **Replaces the search bar** with conversational discovery
2. **Routes complaints** to the notf-cms database
3. **Detects intent upfront** via user selection (File Complaint vs. Find Resources)
4. **Auto-tags corporation** for Bengaluru complaints using point-in-polygon
5. **Handles multi-city** complaints with generic city boundaries

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  NOTF Homepage (index.njk)                                  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Chatbot Widget (Prominent Feature)                │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │ "How can I help you today?"                  │  │    │
│  │  │  [🔍 Find Communities/Resources]             │  │    │
│  │  │  [📝 File a Complaint]                       │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                         │
                         ├─────────────┬──────────────────────┐
                         ▼             ▼                      ▼
              ┌──────────────┐ ┌──────────────┐  ┌──────────────────┐
              │ DISCOVERY    │ │ COMPLAINT    │  │ LOCATION         │
              │ MODE         │ │ MODE         │  │ DETECTION        │
              └──────────────┘ └──────────────┘  └──────────────────┘
                         │             │                      │
                         │             │                      │
              ┌──────────▼──────────┐  │         ┌───────────▼────────┐
              │ NOTF Database       │  │         │ Point-in-Polygon   │
              │ (file_metadata)     │  │         │ Ward Maps          │
              │ - Communities       │  │         │ Corporation Tagging│
              │ - Organizations     │  │         └───────────┬────────┘
              │ - Asks/Offers       │  │                     │
              │ - Matcher Logic     │  │                     │
              └─────────────────────┘  │                     │
                                       ▼                     ▼
                            ┌──────────────────────────────────┐
                            │ NOTF-CMS Database                │
                            │ - complaints table               │
                            │ - complaint_attachments          │
                            │ - corporations (5 + more cities) │
                            │ - issue_categories               │
                            └──────────────────────────────────┘
```

---

## Phase 1: Core Chatbot Infrastructure

### 1.1 Create Chatbot Widget Component

**Files to Create:**
- `/website/src/assets/chat/unified-chatbot.js` - Main chatbot logic
- `/website/src/assets/chat/chat.css` - Styling (NOTF design system)
- `/website/src/_includes/chat-widget.njk` - HTML template

**Key Features:**
- Dual-mode state machine (Discovery Mode + Complaint Mode)
- Intent selection screen on load
- Message rendering system (bot/user messages)
- Context awareness (page location, user data)

**State Machine Design:**

```javascript
const ChatStates = {
  // Universal
  INTENT_SELECTION: 'intent_selection',

  // Discovery Mode States
  DISCOVERY_WELCOME: 'discovery_welcome',
  DISCOVERY_QUERY: 'discovery_query',
  DISCOVERY_RESULTS: 'discovery_results',
  DISCOVERY_REFINE: 'discovery_refine',

  // Complaint Mode States (adapted from notf-cms)
  COMPLAINT_WELCOME: 'complaint_welcome',
  COMPLAINT_DESCRIPTION: 'awaiting_description',
  COMPLAINT_TAGS: 'awaiting_tags',
  COMPLAINT_LOCATION: 'awaiting_location',
  COMPLAINT_CONTACT: 'awaiting_contact',
  COMPLAINT_NAME: 'awaiting_name',
  COMPLAINT_PHOTO: 'awaiting_photo',
  COMPLAINT_REVIEW: 'review',
  COMPLAINT_SUBMITTED: 'submitted'
};
```

### 1.2 Homepage Integration

**File to Modify:**
- `/website/src/index.njk` - Add chatbot widget as primary feature

**Placement Strategy:**
- **Hero Section**: Add chatbot prominently below hero headline
- **Feature Card**: Replace or supplement existing 4 feature cards
- **Sticky Widget**: Optional floating button for re-access after scrolling

**Design Alignment:**
- Use NOTF gradient-primary (teal-to-green)
- Match card styling from communities/matcher pages
- Responsive mobile layout

### 1.3 Remove/Repurpose Search Bar

**Files to Modify:**
- `/website/src/_layouts/base.njk` - Remove search icon from header OR make it open chatbot
- `/website/src/search.njk` - Archive or redirect to homepage chatbot

**Strategy:**
- Option A: Remove search entirely, chatbot is the only discovery method
- Option B: Keep search page but make search icon open chatbot modal

---

## Phase 2: Discovery Mode Implementation

### 2.1 Data Access Layer

**Query Interface:**
```javascript
class DiscoveryEngine {
  constructor(communities, members) {
    this.communities = communities;
    this.members = members;
    this.index = this.buildSearchIndex();
  }

  // Natural language query processing
  processQuery(userMessage) {
    const intent = this.detectIntent(userMessage);
    // Returns: 'find_community', 'match_resource', 'location_search', 'theme_search'
  }

  // Community search
  searchCommunities(filters) {
    // Filter by: city, neighborhood, theme, status, ward
  }

  // Matcher integration
  matchAsksOffers(need, location, category) {
    // Reuse matcher scoring algorithm from matcher.njk
  }

  // Location-based discovery
  findNearby(city, neighborhood) {
    // Use map coordinate data
  }
}
```

**Data Sources (available at build time):**
- Communities: `{{ communities | dump | safe }}`
- Organizations: `{{ members | dump | safe }}`
- No additional API calls needed for MVP

### 2.2 Intent Detection for Discovery

**Keyword Classification:**

| Intent | Keywords | Response |
|--------|----------|----------|
| Find Community | find, search, community, neighborhood, working on | Search communities, show results |
| Match Resources | need, offer, funding, volunteers, space, help | Activate matcher logic |
| Location Query | near, in [city], [neighborhood], around | Filter by location |
| Theme Query | waste, education, water, health, women | Filter by theme tags |
| General Info | what is, about, how does | Provide explanations |

**Example Flows:**

**User:** "Find communities working on waste management in Bengaluru"
- Intent: `find_community` + `theme_search`
- Filters: city=Bengaluru, theme=waste-management
- Response: List of matching communities with confidence scores

**User:** "I need funding for my project"
- Intent: `match_resource`
- Extract: need=funding
- Response: Show offers tagged with 'funding', ask for more context (location, amount, project type)

**User:** "What's happening in Jayanagar?"
- Intent: `location_search`
- Extract: neighborhood=Jayanagar
- Response: Communities in Jayanagar, active projects, contact info

### 2.3 Conversational Search Flow

**State Transitions:**
```
INTENT_SELECTION (user chooses "Find Communities/Resources")
    ↓
DISCOVERY_WELCOME ("Great! What are you looking for?")
    ↓
DISCOVERY_QUERY (user describes need)
    ↓
DISCOVERY_RESULTS (show filtered communities/matches)
    ↓
DISCOVERY_REFINE (offer filters: city, theme, status)
    ↓
[Results or switch to MATCH mode or back to QUERY]
```

**Result Presentation:**
- Display as chat bubbles with community cards
- Show top 5 results initially, "Show more" button
- Include: Name, Location, Focus Areas, Contact Link
- For matcher results: Show match score, tags, "Connect" button

---

## Phase 3: Complaint Mode Implementation

### 3.1 Adapt notf-cms Complaint Flow

**Files to Reference:**
- `/Users/sathya/Documents/GitHub/notf-cms/js/chat-complaint-form.js` - State machine
- `/Users/sathya/Documents/GitHub/notf-cms/api/submit-complaint.js` - Submission API

**Key Adaptations:**

1. **No Corporation Pre-Selection**
   - notf-cms: User selects corporation via URL (`?corp=north`)
   - notf: Auto-detect corporation from location using point-in-polygon

2. **Multi-City Support**
   - notf-cms: Bengaluru only (5 corporations)
   - notf: All cities that notf serves (Bengaluru + others)

3. **Boundary Validation Changes**
   - notf-cms: Rejects out-of-boundary locations
   - notf: Accepts entire city, tags corporation, no rejection

4. **Database Routing**
   - Both modes share same Supabase project
   - Complaint mode writes to notf-cms tables (same database, different schema)

### 3.2 Location Detection & Corporation Tagging

**Strategy:**

**For Bengaluru:**
1. User provides location (address text, map click, or GPS)
2. Geocode to lat/lng (Nominatim API)
3. Load 5 corporation boundaries (from notf-cms GeoJSON)
4. Run point-in-polygon check against all 5 corporations
5. Tag complaint with matched corporation (`corporation_id`)
6. If no match: Accept anyway, tag as "Bengaluru - Unassigned"

**For Other Cities:**
1. Load city boundary from ward maps (if available on map page)
2. Check if location is within city boundary
3. Tag complaint with city name (no corporation subdivision)
4. If no ward map: Accept based on user-provided city selection

**Implementation:**

```javascript
class LocationTagger {
  constructor() {
    this.bengaluruBoundaries = null; // Load from notf-cms GeoJSON
    this.cityBoundaries = null;      // Load from notf map data
  }

  async tagLocation(lat, lng, userProvidedCity) {
    // For Bengaluru specifically
    if (userProvidedCity === 'Bengaluru' || this.isInBengaluru(lat, lng)) {
      const corp = this.detectCorporation(lat, lng);
      return {
        city: 'Bengaluru',
        corporation_code: corp?.code || 'unassigned',
        corporation_id: corp?.id || null,
        ward: corp?.ward || null
      };
    }

    // For other cities with ward maps
    const city = this.detectCity(lat, lng);
    if (city) {
      return {
        city: city.name,
        corporation_code: null,
        corporation_id: null,
        ward: this.detectWard(lat, lng, city)
      };
    }

    // Fallback: Trust user-provided city
    return {
      city: userProvidedCity,
      corporation_code: null,
      corporation_id: null,
      ward: null
    };
  }

  detectCorporation(lat, lng) {
    // Point-in-polygon using Turf.js
    for (const corp of this.bengaluruBoundaries.features) {
      if (turf.booleanPointInPolygon([lng, lat], corp)) {
        return {
          code: corp.properties.code, // north, south, east, west, central
          id: corp.properties.id,     // UUID from database
          name: corp.properties.name,
          ward: corp.properties.ward  // if available
        };
      }
    }
    return null; // Not in any corporation
  }
}
```

**Required Data Files:**
- **Bengaluru Boundaries**: Copy from `/Users/sathya/Documents/GitHub/notf-cms/files/gba_corporation.geojson`
- **City Boundaries**: Extract from notf map page data (cities with ward maps loaded)
- **Corporation Lookup**: Create mapping table in notf-cms database if not exists

### 3.3 Database Schema Extension

**Tables to Use (existing in notf-cms):**
- `complaints` - Main complaint table
- `corporations` - Extended to include non-Bengaluru cities
- `issue_categories` - Reuse existing categories
- `complaint_attachments` - Photo uploads

**New Corporations to Add:**

```sql
-- Extend corporations table
INSERT INTO corporations (code, name, short_name, city, state) VALUES
  -- Existing Bengaluru
  ('north', 'Bengaluru North Corporation', 'North', 'Bengaluru', 'Karnataka'),
  -- ... 4 more

  -- New cities from notf data
  ('delhi_generic', 'Delhi Municipal Corporation', 'Delhi', 'Delhi', 'Delhi'),
  ('mumbai_generic', 'Mumbai Municipal Corporation', 'Mumbai', 'Mumbai', 'Maharashtra'),
  -- Add more as needed based on notf cities

  -- Generic fallback
  ('unassigned', 'Unassigned Corporation', 'Unassigned', NULL, NULL);
```

**Complaint Tagging Logic:**

```javascript
// When submitting complaint
const complaintData = {
  // ... other fields
  corporation_id: locationTag.corporation_id,

  // Store original location tag in metadata
  metadata: {
    original_city: locationTag.city,
    corporation_code: locationTag.corporation_code,
    ward: locationTag.ward,
    auto_tagged: true,
    tagged_at: new Date().toISOString()
  }
};
```

### 3.4 Complaint Submission Flow

**Modified State Machine:**

```
INTENT_SELECTION (user chooses "File a Complaint")
    ↓
COMPLAINT_WELCOME ("I'll help you file a complaint. Please describe the issue.")
    ↓
COMPLAINT_DESCRIPTION (collect description, min 10 chars)
    ↓ (ML classification happens)
COMPLAINT_TAGS (show top 3 suggested categories, user selects)
    ↓
COMPLAINT_LOCATION (geocode, map click, or GPS)
    ↓ (auto-tag corporation using point-in-polygon - NO rejection)
COMPLAINT_CONTACT (phone OR email, validated)
    ↓
COMPLAINT_NAME (optional, can skip)
    ↓
COMPLAINT_PHOTO (optional, max 2MB)
    ↓
COMPLAINT_REVIEW (show summary with auto-tagged corporation)
    ↓
COMPLAINT_SUBMITTED (show ticket number, corporation info)
```

**Key Differences from notf-cms:**
- No boundary rejection - all locations within city accepted
- Auto-tagging displayed in review screen: "Your complaint will be routed to: Bengaluru North Corporation"
- Ticket number includes city code: `BLR-NOR-25-000001` or `DEL-25-000001`

### 3.5 API Integration

**Options:**

**Option A: Direct Supabase Insert (Simple)**
```javascript
// In complaint submission handler
const { data, error } = await supabase
  .from('complaints')
  .insert({
    ...complaintData,
    complaint_number: generateTicketNumber(), // Client-side or trigger
    corporation_id: locationTag.corporation_id,
    status: 'new'
  });
```

**Option B: Call notf-cms API Endpoint (Cleaner)**
```javascript
// Reuse existing notf-cms API
fetch('https://notf-cms.vercel.app/api/submit-complaint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...complaintData,
    corporation_code: locationTag.corporation_code,
    tagged_metadata: locationTag
  })
});
```

**Recommendation: Option B** - Reuse notf-cms API
- **Pros**: Centralized validation, SLA calculation, ticket number generation, database triggers
- **Cons**: Cross-origin request (requires CORS), network dependency
- **Solution**: Configure CORS in notf-cms to allow notf.vercel.app origin

---

## Phase 4: Multi-City & Scalability

### 4.1 City Boundary Loading

**Data Source:**
- notf map page already has coordinate data for neighborhoods
- Ward maps are loaded for cities on map page

**Strategy:**
1. Extract city boundary polygons from map page data
2. Create GeoJSON files for each city (similar to Bengaluru corporations)
3. Load dynamically based on user's selected city or detected location
4. Cache boundaries in localStorage for performance

**Files to Create:**
- `/website/src/assets/data/city-boundaries.json` - Multi-city GeoJSON
- `/website/src/assets/chat/boundary-loader.js` - Dynamic boundary loading

### 4.2 Corporation Management

**For Bengaluru:**
- Use existing 5 corporations from notf-cms
- Point-in-polygon against all 5 boundaries
- Tag with specific corporation

**For Other Cities:**
- Create single generic corporation per city
- Example: "Delhi Municipal Corporation", "Mumbai Municipal Corporation"
- No internal subdivision (no ward/zone unless data available)

**Database Update:**
```sql
-- Add metadata column to corporations table
ALTER TABLE corporations ADD COLUMN metadata JSONB;

-- Store city-specific config
UPDATE corporations
SET metadata = '{"has_boundaries": true, "boundary_file": "gba_corporation.geojson"}'
WHERE code IN ('north', 'south', 'east', 'west', 'central');

UPDATE corporations
SET metadata = '{"has_boundaries": false, "generic": true}'
WHERE code LIKE '%_generic';
```

### 4.3 Fallback Handling

**When Location Detection Fails:**

1. **User provides city name but coordinates fail:**
   - Ask: "Which city/neighborhood is this in?"
   - Manual city selection dropdown
   - Route to generic corporation for that city

2. **Location is outside all known boundaries:**
   - Message: "We couldn't auto-tag this location. Please select your city."
   - Manual selection
   - Tag as "unassigned" with user-selected city

3. **User doesn't provide location (edge case):**
   - Make location mandatory for complaints
   - Provide helpful prompts: "Type your address, click on map, or use GPS"

---

## Phase 5: UI/UX Design

### 5.1 Chatbot Widget Design

**Layout:**

```
┌─────────────────────────────────────────┐
│  🤖 NOTF Assistant              [✕]     │ (Header)
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────┐      │
│  │ Bot: How can I help you?     │      │
│  └──────────────────────────────┘      │
│                                         │
│  ┌─────────────┐  ┌─────────────┐      │
│  │ 🔍 Find     │  │ 📝 File a   │      │
│  │ Communities │  │ Complaint   │      │
│  └─────────────┘  └─────────────┘      │
│                                         │
│  (Messages appear here as conversation │
│   progresses)                           │
│                                         │
├─────────────────────────────────────────┤
│  Type your message...          [Send]   │ (Input)
└─────────────────────────────────────────┘
```

**Color Scheme:**
- Primary: NOTF teal gradient (`gradient-primary`)
- Bot messages: Light teal background
- User messages: White with teal border
- Buttons: NOTF green (`color-primary`)
- Error messages: Pink (`color-accent`)

**Responsive:**
- Desktop: Modal overlay (600px width, centered)
- Mobile: Full-screen modal (100vw/100vh)
- Tablet: 80vw modal

### 5.2 Intent Selection Screen

**Welcome Message:**
```
"👋 Hello! I'm the NOTF Assistant. I can help you:

🔍 Discover communities and resources in your area
📝 File a complaint about civic issues

What would you like to do today?"

[🔍 Find Communities/Resources]  [📝 File a Complaint]
```

**After Selection:**
- Discovery: "Great! Tell me what you're looking for..."
- Complaint: "I'll help you file a complaint. Please describe the issue you're facing."

### 5.3 Result Presentation

**Discovery Results (Community Cards):**
```
┌─────────────────────────────────────┐
│ 🏘️ Jayanagar Residents Welfare    │
│ 📍 Jayanagar, Bengaluru             │
│ 🏷️ Waste Management, Water          │
│ 👥 200 members                      │
│ [Contact] [Learn More]              │
└─────────────────────────────────────┘
```

**Complaint Review:**
```
📋 Complaint Summary:

📝 Issue: Broken streetlight on MG Road
🏷️ Category: Electrical / Street Lighting
📍 Location: MG Road, Bengaluru North
🏢 Corporation: Bengaluru North Corporation
📞 Contact: 9876543210
👤 Name: (Anonymous)
📸 Photo: Attached

[Edit] [Submit Complaint]
```

**Complaint Submitted:**
```
✅ Complaint Filed Successfully!

Your Ticket Number: BLR-NOR-25-000123

Your complaint has been routed to:
🏢 Bengaluru North Corporation

Expected Response: Within 48 hours
Status Updates: Track at notf-cms.vercel.app/track/BLR-NOR-25-000123

[File Another Complaint] [Close]
```

---

## Phase 6: Technical Implementation Details

### 6.1 File Structure

```
/website/
├── src/
│   ├── index.njk                        # Modified: Add chatbot widget
│   ├── _layouts/base.njk                # Modified: Remove/redirect search icon
│   ├── _includes/
│   │   └── chat-widget.njk              # NEW: Chatbot HTML template
│   ├── assets/
│   │   ├── css/
│   │   │   └── main.css                 # Modified: Add chat styles
│   │   └── chat/
│   │       ├── unified-chatbot.js       # NEW: Main chatbot logic
│   │       ├── discovery-engine.js      # NEW: Discovery mode handler
│   │       ├── complaint-engine.js      # NEW: Complaint mode handler
│   │       ├── location-tagger.js       # NEW: Corp/city detection
│   │       ├── boundary-loader.js       # NEW: Load city boundaries
│   │       └── chat.css                 # NEW: Chatbot styling
│   └── assets/data/
│       ├── bengaluru-corp-boundaries.geojson  # NEW: Copy from notf-cms
│       └── city-boundaries.json         # NEW: Multi-city boundaries
│
├── .eleventy.js                         # Modified: Passthrough copy for chat assets
└── package.json                         # Modified: Add dependencies

/supabase/
└── functions/
    └── submit-complaint-proxy/          # NEW: Optional proxy to notf-cms API
        └── index.ts
```

### 6.2 Dependencies

**Add to package.json:**
```json
{
  "dependencies": {
    "@turf/turf": "^6.5.0",           // Point-in-polygon for boundaries
    "leaflet": "^1.9.4"                 // Already exists, reuse for maps
  }
}
```

**CDN Scripts (add to chat-widget.njk):**
```html
<script src="https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

### 6.3 Eleventy Configuration

**Modify .eleventy.js:**

```javascript
module.exports = function(eleventyConfig) {
  // ... existing config

  // Passthrough copy for chatbot assets
  eleventyConfig.addPassthroughCopy("src/assets/chat");
  eleventyConfig.addPassthroughCopy("src/assets/data");

  // Global data: Add notf-cms corporations lookup
  eleventyConfig.addGlobalData("corporations", async () => {
    // Fetch from Supabase or hardcode
    return [
      { code: 'north', name: 'Bengaluru North Corporation', city: 'Bengaluru' },
      // ... 4 more
    ];
  });
};
```

### 6.4 State Management

**Local Storage Schema:**

```javascript
{
  "chat_session_id": "uuid-v4",
  "current_mode": "discovery" | "complaint",
  "current_state": "discovery_query" | "complaint_location",
  "conversation_history": [
    { role: "bot", message: "...", timestamp: "..." },
    { role: "user", message: "...", timestamp: "..." }
  ],
  "form_data": {
    // For complaint mode
    "description": "...",
    "category_id": "...",
    "location": { lat: ..., lng: ..., address: "..." },
    // ...
  },
  "cached_boundaries": {
    "bengaluru": { ... }, // GeoJSON
    "delhi": { ... }
  }
}
```

**Persistence:**
- Save after every message
- Clear on submit or explicit reset
- Restore on page reload (show "Continue previous conversation?" prompt)

---

## Phase 7: Integration with notf-cms

### 7.1 API Endpoint Configuration

**Option 1: Direct Supabase Access (Same Project)**
```javascript
// In unified-chatbot.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://abblyaukkoxmgzwretvm.supabase.co',
  process.env.SUPABASE_ANON_KEY
);

// Submit complaint directly to notf-cms tables
await supabase.from('complaints').insert(complaintData);
```

**Option 2: Proxy via notf-cms API**
```javascript
// Call notf-cms endpoint
const response = await fetch('https://notf-cms.vercel.app/api/submit-complaint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://notf.vercel.app'
  },
  body: JSON.stringify(complaintData)
});
```

**Recommendation: Option 2 (Proxy via API)**
- Centralizes business logic in notf-cms
- Reuses existing validation, triggers, ticket generation
- Requires CORS configuration on notf-cms

### 7.2 CORS Configuration for notf-cms

**Modify notf-cms API endpoints:**

**File: `/api/submit-complaint.js` (in notf-cms)**
```javascript
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://notf.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ... existing complaint submission logic
}
```

**OR: Use Vercel CORS middleware**

**Create: `/middleware.js` (in notf-cms)**
```javascript
export const config = {
  matcher: '/api/:path*',
};

export function middleware(req) {
  const origin = req.headers.get('origin');

  if (origin === 'https://notf.vercel.app' || origin === 'http://localhost:8080') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
}
```

### 7.3 Photo Upload Handling

**notf-cms uses Supabase Storage for photos.**

**Strategy:**
1. User selects photo in notf chatbot
2. Upload to Supabase Storage bucket: `notf-cms` (same as notf-cms uses)
3. Store file path in `complaint_attachments` table
4. Associate with complaint via `complaint_id`

**Implementation:**

```javascript
async function uploadPhoto(file, complaintId) {
  const fileName = `${complaintId}/${Date.now()}-${file.name}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('notf-cms')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Create attachment record
  await supabase.from('complaint_attachments').insert({
    complaint_id: complaintId,
    file_name: file.name,
    file_path: data.path,
    file_type: file.type,
    file_size: file.size
  });

  return data.path;
}
```

### 7.4 Real-time Status Updates (Future Enhancement)

**Allow users to track complaints:**

```javascript
// Subscribe to complaint status changes
const subscription = supabase
  .channel(`complaint:${ticketNumber}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'complaints',
    filter: `complaint_number=eq.${ticketNumber}`
  }, payload => {
    // Show notification: "Your complaint status updated to: In Progress"
    showNotification(payload.new.status);
  })
  .subscribe();
```

---

## Phase 8: Testing & Validation

### 8.1 Unit Tests

**Test Scenarios:**

**Discovery Mode:**
- ✅ Search for communities by city
- ✅ Search by theme (waste, education, etc.)
- ✅ Match asks/offers with scoring
- ✅ Location-based filtering
- ✅ No results handling

**Complaint Mode:**
- ✅ Description validation (min 10 chars)
- ✅ Category classification (ML keywords)
- ✅ Location geocoding (Nominatim API)
- ✅ Point-in-polygon for Bengaluru corporations
- ✅ Phone/email validation
- ✅ Photo upload (2MB limit, JPEG/PNG)
- ✅ Complaint submission to database

**Location Tagging:**
- ✅ Bengaluru North Corp boundary detection
- ✅ Bengaluru South Corp boundary detection
- ✅ All 5 corporations tested
- ✅ Outside Bengaluru but within other city
- ✅ Completely outside all known boundaries
- ✅ Fallback to manual city selection

### 8.2 Integration Tests

**End-to-End Flows:**

1. **Discovery Flow:**
   - User selects "Find Communities"
   - Queries: "waste management in Jayanagar"
   - Receives: List of 3 communities
   - Clicks: Contact link → Opens email

2. **Complaint Flow (Bengaluru):**
   - User selects "File a Complaint"
   - Describes: "Broken streetlight on MG Road"
   - Auto-tagged: Electrical category
   - Provides location: MG Road coordinates
   - Auto-tagged: Bengaluru North Corporation
   - Provides contact: 9876543210
   - Reviews and submits
   - Receives: Ticket number BLR-NOR-25-000123

3. **Complaint Flow (Other City):**
   - Same as above but location in Delhi
   - Auto-tagged: Delhi Municipal Corporation
   - Receives: Ticket number DEL-25-000001

### 8.3 User Acceptance Testing

**Test with Real Users:**
- 5 users test discovery mode (search for communities)
- 5 users test complaint mode (file test complaints)
- Collect feedback on:
  - Clarity of intent selection
  - Ease of location input
  - Understandability of auto-tagging
  - Overall satisfaction

---

## Phase 9: Deployment & Rollout

### 9.1 Deployment Checklist

**notf Repository:**
- ✅ Create chatbot assets (JS, CSS, Nunjucks)
- ✅ Modify homepage to include chatbot widget
- ✅ Remove or redirect search bar
- ✅ Add city boundary GeoJSON files
- ✅ Configure Eleventy passthrough copy
- ✅ Add Turf.js dependency
- ✅ Test build locally (`npm run build`)
- ✅ Deploy to Vercel (automatic on git push)

**notf-cms Repository:**
- ✅ Add CORS headers to API endpoints
- ✅ Extend corporations table with new cities
- ✅ Test API endpoint from notf.vercel.app origin
- ✅ Verify Supabase Storage permissions
- ✅ Deploy to Vercel

**Database (Supabase):**
- ✅ Run migration to add new corporations
- ✅ Verify RLS policies allow notf.vercel.app access
- ✅ Test complaint insertion from notf chatbot
- ✅ Verify ticket number generation trigger works

### 9.2 Rollout Strategy

**Phase 1: Soft Launch (Week 1)**
- Deploy chatbot to notf homepage
- Monitor for errors (Sentry/LogRocket)
- Collect initial user feedback
- Keep search bar as backup (hidden but accessible)

**Phase 2: Full Launch (Week 2)**
- Remove search bar entirely
- Promote chatbot via homepage banner
- Monitor complaint submission rate
- Track discovery mode usage analytics

**Phase 3: Optimization (Week 3-4)**
- Analyze most common queries
- Improve intent detection rules
- Add more category keywords
- Expand city boundaries

---

## Critical Files Reference

### NOTF Repository
| File | Purpose |
|------|---------|
| `/website/src/index.njk` | Homepage - add chatbot widget |
| `/website/src/_layouts/base.njk` | Remove search icon |
| `/website/src/_includes/chat-widget.njk` | Chatbot HTML template |
| `/website/src/assets/chat/unified-chatbot.js` | Main chatbot logic |
| `/website/src/assets/chat/discovery-engine.js` | Discovery mode handler |
| `/website/src/assets/chat/complaint-engine.js` | Complaint mode handler |
| `/website/src/assets/chat/location-tagger.js` | Corporation tagging |
| `/website/src/assets/data/bengaluru-corp-boundaries.geojson` | Bengaluru boundaries |
| `/website/.eleventy.js` | Build config |

### NOTF-CMS Repository
| File | Purpose |
|------|---------|
| `/api/submit-complaint.js` | Complaint submission endpoint (add CORS) |
| `/database/schema.sql` | Database schema reference |
| `/files/gba_corporation.geojson` | Bengaluru corporation boundaries (copy to notf) |
| `/js/chat-complaint-form.js` | Reference for complaint flow logic |

### Supabase Database
| Table | Usage |
|-------|-------|
| `complaints` | Store all complaints from notf chatbot |
| `corporations` | Extend with new cities |
| `issue_categories` | Reuse for categorization |
| `complaint_attachments` | Photo uploads |
| `file_metadata` | notf communities/organizations data |

---

## Success Metrics

**Discovery Mode:**
- Search queries per day: Target 50+
- Communities found per query: Avg 3-5
- Click-through to contact: >20%
- User satisfaction: >4/5 stars

**Complaint Mode:**
- Complaints filed per day: Target 10+
- Auto-tagging accuracy: >90%
- Successful submissions: >95%
- Avg time to file: <3 minutes

**Overall:**
- Chatbot engagement rate: >40% of homepage visitors
- Search bar removal: No significant drop in discovery activity
- Multi-city complaints: Track Delhi, Mumbai, etc.

---

## Future Enhancements

1. **AI-Powered Intent Detection**
   - Replace keyword matching with NLU model (Anthropic Claude API, GPT-4)
   - Better understanding of complex queries

2. **Real-time Status Tracking**
   - Users can track complaint progress in chatbot
   - Supabase real-time subscriptions

3. **Multi-language Support**
   - Kannada, Hindi, Tamil for local users
   - Translation API integration

4. **Voice Input**
   - Speech-to-text for description entry
   - Better accessibility

5. **Admin Dashboard Integration**
   - notf-cms admins can see source of complaint (notf chatbot vs. notf-cms chatbot)
   - Analytics on chatbot usage

6. **Smart Suggestions**
   - "Other users searching for X also looked at Y"
   - Personalized community recommendations

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| CORS issues with notf-cms API | Test thoroughly, add localhost for dev testing |
| Point-in-polygon performance | Cache boundaries, use web workers for heavy computation |
| Geocoding API rate limits | Implement caching, fallback to manual entry |
| User confusion between modes | Clear intent selection screen, allow mode switching |
| Database write failures | Implement retry logic, show clear error messages |
| Photo upload size | Validate client-side, compress before upload |
| Missing city boundaries | Graceful fallback to manual city selection |

---

## Implementation Timeline

**Week 1: Core Infrastructure**
- Day 1-2: Create chatbot widget component
- Day 3-4: Implement intent selection and state machine
- Day 5: Integrate into homepage

**Week 2: Discovery Mode**
- Day 1-2: Build discovery engine and search logic
- Day 3: Implement result presentation
- Day 4-5: Testing and refinement

**Week 3: Complaint Mode**
- Day 1-2: Adapt complaint flow from notf-cms
- Day 3: Implement location tagging and point-in-polygon
- Day 4-5: API integration and photo uploads

**Week 4: Multi-City & Testing**
- Day 1-2: Add city boundaries and multi-city support
- Day 3-4: End-to-end testing, bug fixes
- Day 5: Deployment and monitoring

**Week 5: Optimization & Rollout**
- Day 1-2: User feedback collection
- Day 3-4: Performance optimization
- Day 5: Full launch

---

## Verification Plan

After implementation, verify:

1. **Chatbot appears on homepage** - Prominent feature, clear intent selection
2. **Discovery mode works** - Search queries return relevant communities
3. **Complaint mode works** - Can file complaint end-to-end
4. **Location tagging works** - Bengaluru correctly tags corporation
5. **Multi-city works** - Delhi complaint gets routed correctly
6. **Database integration** - Complaints appear in notf-cms database
7. **Search bar removed** - No longer accessible (or redirects to chatbot)
8. **Mobile responsive** - Works on phone, tablet, desktop
9. **Performance** - Page load time <3s, chatbot opens <500ms
10. **Error handling** - Graceful failures with user-friendly messages

---

## Conclusion

This integration plan creates a **unified, intelligent chatbot** that:
- Replaces the search bar with conversational discovery
- Routes complaints to notf-cms database with auto-tagging
- Handles multi-city complaints with generic boundaries
- Provides seamless UX with clear intent separation
- Scales to all cities that notf serves

The architecture reuses notf-cms's proven complaint flow while adding discovery capabilities unique to notf's community network. By leveraging the same Supabase project, we avoid data duplication while maintaining clear separation of concerns between civic complaints (notf-cms) and community discovery (notf).
