# NOTF-CMS Complaint Submission API Specification
## For NOTF Chatbot Integration

---

## Overview

The notf-cms already has a fully functional complaint submission API at `/api/submit-complaint`. This document outlines the existing API structure and the modifications needed to support complaints from the NOTF chatbot.

---

## Existing API Endpoint

**URL:** `https://notf-cms.vercel.app/api/submit-complaint`
**Method:** `POST`
**Content-Type:** `application/json`
**Authentication:** None (public endpoint)

---

## Current Implementation

### File Location
`/Users/sathya/Documents/GitHub/notf-cms/api/submit-complaint.js`

### Technology Stack
- **Runtime:** Vercel Serverless Functions (Node.js)
- **Database:** Supabase PostgreSQL
- **Module System:** CommonJS (`module.exports`)

### Environment Variables (Server-Side)
```bash
SUPABASE_URL=https://abblyaukkoxmgzwretvm.supabase.co
SUPABASE_SERVICE_KEY=<admin-key>  # Hidden from client
```

---

## Request Format

### Current Request Body Schema

```json
{
  "corporation_id": "north" | "<uuid>",
  "category_id": "<uuid>" | null,
  "department_id": "<uuid>" | null,
  "title": "string" | null,
  "description": "string (min 10 chars)",
  "address": "string",
  "landmark": "string" | null,
  "latitude": number | null,
  "longitude": number | null,
  "citizen_name": "string" | null,
  "citizen_phone": "string (10 digits)" | null,
  "citizen_email": "string (email)" | null,
  "priority": "critical" | "high" | "medium" | "low" | null
}
```

### Required Fields
- ✅ `description` (min 10 characters)
- ✅ `address`
- ✅ At least one of: `citizen_phone` OR `citizen_email`

### Optional Fields
- `corporation_id` - Can be code ("north") or UUID (auto-converted)
- `category_id` - Issue category UUID
- `department_id` - Department UUID
- `title` - Defaults to "Civic Issue"
- `landmark` - Additional location info
- `latitude`, `longitude` - GPS coordinates
- `citizen_name` - User's name (can be anonymous)
- `priority` - Urgency level

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "complaint": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "complaint_number": "NOR-25-000123",
    "corporation_id": "123e4567-e89b-12d3-a456-426614174000",
    "category_id": "789e4567-e89b-12d3-a456-426614174000",
    "title": "Civic Issue",
    "description": "Broken streetlight on MG Road",
    "address": "MG Road, Bengaluru North",
    "landmark": "Near City Center Mall",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "citizen_name": "John Doe",
    "citizen_phone": "9876543210",
    "citizen_email": "john@example.com",
    "status": "new",
    "priority": "medium",
    "created_at": "2025-01-18T10:30:00.000Z",
    "updated_at": "2025-01-18T10:30:00.000Z",
    "sla_deadline": "2025-01-20T10:30:00.000Z",
    "sla_breached": false
  },
  "message": "Complaint submitted successfully. Ticket: NOR-25-000123"
}
```

### Error Responses

**400 Bad Request - Validation Error:**
```json
{
  "error": "Description must be at least 10 characters long."
}
```

**400 Bad Request - Missing Contact:**
```json
{
  "error": "Please provide either a phone number or email address."
}
```

**400 Bad Request - Invalid Corporation:**
```json
{
  "error": "Invalid corporation code: invalid_code"
}
```

**400 Bad Request - Invalid Phone:**
```json
{
  "error": "Invalid phone number. Must be 10 digits starting with 6-9."
}
```

**400 Bad Request - Invalid Email:**
```json
{
  "error": "Invalid email address format."
}
```

**405 Method Not Allowed:**
```json
{
  "error": "Method not allowed. Use POST."
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to submit complaint. Please try again.",
  "details": "Detailed error message"
}
```

---

## Current CORS Configuration

```javascript
res.setHeader('Access-Control-Allow-Credentials', true);
res.setHeader('Access-Control-Allow-Origin', '*');  // ⚠️ Allows all origins
res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
```

**Issue:** Currently allows any origin (`*`)

---

## Modifications Needed for NOTF Chatbot

### 1. Add Metadata Field Support

**Purpose:** Store auto-tagging information from the NOTF chatbot (corporation detection, ward mapping, source tracking)

**Schema Extension:**

The `complaints` table already has a `metadata` JSONB column (not currently used by the API). We need to accept and store it.

**Modified Request Body:**
```json
{
  // ... existing fields ...

  "metadata": {
    "source": "notf-chatbot",
    "original_city": "Bengaluru",
    "corporation_code": "north",
    "ward": "Ward 42",
    "auto_tagged": true,
    "tagged_at": "2025-01-18T10:30:00.000Z",
    "tagging_method": "point-in-polygon",
    "confidence": 0.95
  }
}
```

**API Code Addition (Line 111):**
```javascript
// Add metadata if provided
if (complaint.metadata) {
    complaintData.metadata = complaint.metadata;
}
```

### 2. Restrict CORS to Specific Origins

**Purpose:** Security - only allow notf.vercel.app and localhost (for development)

**Modified CORS Headers:**
```javascript
// CORS headers - restrict to specific origins
const allowedOrigins = [
    'https://notf.vercel.app',
    'http://localhost:8080',  // Local development
    'http://127.0.0.1:8080'
];

const origin = req.headers.origin;
if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
} else {
    res.setHeader('Access-Control-Allow-Origin', 'https://notf-cms.vercel.app');  // Default to CMS
}

res.setHeader('Access-Control-Allow-Credentials', true);
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');  // Only POST needed
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

### 3. Add Source Tracking

**Purpose:** Identify complaints from NOTF chatbot vs. notf-cms chatbot

**API Code Addition (Line 88):**
```javascript
// Auto-detect source if not provided in metadata
if (!complaint.metadata?.source) {
    const origin = req.headers.origin;
    const source = origin?.includes('notf.vercel.app') ? 'notf-chatbot' : 'notf-cms-chatbot';

    complaintData.metadata = {
        ...complaint.metadata,
        source,
        submitted_at: new Date().toISOString(),
        origin: origin
    };
}
```

### 4. Support Multi-City Corporation Codes

**Purpose:** Handle generic city codes like "delhi_generic" or "mumbai_generic"

**No Code Changes Needed:** The existing code already handles this via corporation code lookup (lines 48-65).

Just need to ensure the `corporations` table has entries for all cities:

```sql
INSERT INTO corporations (code, name, short_name, city, state, metadata) VALUES
  -- Bengaluru corporations (existing)
  ('north', 'Bengaluru North Corporation', 'North', 'Bengaluru', 'Karnataka', '{"has_boundaries": true}'),
  ('south', 'Bengaluru South Corporation', 'South', 'Bengaluru', 'Karnataka', '{"has_boundaries": true}'),
  ('east', 'Bengaluru East Corporation', 'East', 'Bengaluru', 'Karnataka', '{"has_boundaries": true}'),
  ('west', 'Bengaluru West Corporation', 'West', 'Bengaluru', 'Karnataka', '{"has_boundaries": true}'),
  ('central', 'Bengaluru Central Corporation', 'Central', 'Bengaluru', 'Karnataka', '{"has_boundaries": true}'),

  -- Other cities (new)
  ('ahmedabad', 'Ahmedabad Municipal Corporation', 'Ahmedabad', 'Ahmedabad', 'Gujarat', '{"has_boundaries": true, "ward_file": "ahmedabad-wards.kml"}'),
  ('bhubaneswar', 'Bhubaneswar Municipal Corporation', 'Bhubaneswar', 'Bhubaneswar', 'Odisha', '{"has_boundaries": true, "ward_file": "bhubaneshwar-wards.kml"}'),
  ('chennai', 'Chennai Municipal Corporation', 'Chennai', 'Chennai', 'Tamil Nadu', '{"has_boundaries": true, "ward_file": "chennai-wards.kml"}'),
  ('gurugram', 'Gurugram Municipal Corporation', 'Gurugram', 'Gurugram', 'Haryana', '{"has_boundaries": true, "ward_file": "gurugram-wards.kml"}'),
  ('hyderabad', 'Hyderabad Municipal Corporation', 'Hyderabad', 'Hyderabad', 'Telangana', '{"has_boundaries": true, "ward_file": "hyderabad-wards.kml"}'),
  ('jaipur', 'Jaipur Municipal Corporation', 'Jaipur', 'Jaipur', 'Rajasthan', '{"has_boundaries": true, "ward_file": "jaipur-wards.kml"}'),
  ('kolkata', 'Kolkata Municipal Corporation', 'Kolkata', 'Kolkata', 'West Bengal', '{"has_boundaries": true, "ward_file": "kolkata-wards.kml"}'),
  ('mumbai', 'Mumbai Municipal Corporation', 'Mumbai', 'Mumbai', 'Maharashtra', '{"has_boundaries": true, "ward_file": "mumbai-wards.kml"}'),
  ('pune', 'Pune Municipal Corporation', 'Pune', 'Pune', 'Maharashtra', '{"has_boundaries": true, "ward_file": "pune-wards.kml"}'),
  ('thane', 'Thane Municipal Corporation', 'Thane', 'Thane', 'Maharashtra', '{"has_boundaries": true, "ward_file": "thane-wards.kml"}'),
  ('visakhapatnam', 'Visakhapatnam Municipal Corporation', 'Visakhapatnam', 'Visakhapatnam', 'Andhra Pradesh', '{"has_boundaries": true, "ward_file": "vizag-wards.kml"}'),

  -- Fallback for unassigned
  ('unassigned', 'Unassigned Corporation', 'Unassigned', NULL, NULL, '{"has_boundaries": false}');
```

---

## Complete Modified API Code

### File: `/api/submit-complaint.js` (Updated Version)

```javascript
// Serverless function to submit complaints
// Updated for NOTF chatbot integration - 2025-01-18

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    // CORS headers - restrict to specific origins for security
    const allowedOrigins = [
        'https://notf.vercel.app',
        'https://notf-cms.vercel.app',
        'http://localhost:8080',
        'http://127.0.0.1:8080'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        // Initialize Supabase with server-side credentials
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        // Parse complaint data
        const complaint = req.body;

        // Server-side validation
        if (!complaint.description || complaint.description.length < 10) {
            return res.status(400).json({
                error: 'Description must be at least 10 characters long.'
            });
        }

        if (!complaint.citizen_phone && !complaint.citizen_email) {
            return res.status(400).json({
                error: 'Please provide either a phone number or email address.'
            });
        }

        // Convert corporation code to UUID
        let corporationId = complaint.corporation_id;
        if (typeof complaint.corporation_id === 'string' && !complaint.corporation_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            const { data: corpData, error: corpError } = await supabase
                .from('corporations')
                .select('id')
                .eq('code', complaint.corporation_id.toLowerCase())
                .single();

            if (corpError || !corpData) {
                return res.status(400).json({
                    error: 'Invalid corporation code: ' + complaint.corporation_id
                });
            }

            corporationId = corpData.id;
        }

        // Validate phone number format
        if (complaint.citizen_phone) {
            const phoneRegex = /^[6-9]\d{9}$/;
            if (!phoneRegex.test(complaint.citizen_phone)) {
                return res.status(400).json({
                    error: 'Invalid phone number. Must be 10 digits starting with 6-9.'
                });
            }
        }

        // Validate email format
        if (complaint.citizen_email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(complaint.citizen_email)) {
                return res.status(400).json({
                    error: 'Invalid email address format.'
                });
            }
        }

        // Build complaint object
        const complaintData = {
            corporation_id: corporationId,
            category_id: complaint.category_id || null,
            title: complaint.title || 'Civic Issue',
            description: complaint.description,
            address: complaint.address,
            landmark: complaint.landmark || '',
            citizen_name: complaint.citizen_name || null,
            citizen_phone: complaint.citizen_phone || null,
            citizen_email: complaint.citizen_email || null,
            status: 'new'
        };

        // Add optional location fields
        if (complaint.latitude && complaint.longitude) {
            complaintData.latitude = complaint.latitude;
            complaintData.longitude = complaint.longitude;
        }
        if (complaint.department_id) {
            complaintData.department_id = complaint.department_id;
        }
        if (complaint.priority) {
            complaintData.priority = complaint.priority;
        }

        // Add metadata with source tracking
        const metadata = complaint.metadata || {};
        if (!metadata.source) {
            metadata.source = origin?.includes('notf.vercel.app') ? 'notf-chatbot' : 'notf-cms-chatbot';
            metadata.submitted_at = new Date().toISOString();
            metadata.origin = origin;
        }
        complaintData.metadata = metadata;

        // Insert complaint into database
        const { data, error } = await supabase
            .from('complaints')
            .insert(complaintData)
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({
                error: 'Failed to submit complaint. Please try again.',
                details: error.message
            });
        }

        // Success! Return the created complaint with ticket number
        return res.status(200).json({
            success: true,
            complaint: data,
            message: `Complaint submitted successfully. Ticket: ${data.complaint_number}`
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            error: 'Internal server error. Please try again later.',
            details: error.message
        });
    }
}
```

---

## Database Schema Requirements

### Corporations Table

Must include all city corporations that NOTF serves:

```sql
CREATE TABLE corporations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,  -- "north", "delhi_generic", etc.
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    metadata JSONB,  -- Store config like has_boundaries
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast code lookups
CREATE INDEX idx_corporations_code ON corporations(code);
```

### Complaints Table

Already has the required structure. Key field:

```sql
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Index for querying by source
CREATE INDEX idx_complaints_metadata_source ON complaints ((metadata->>'source'));
```

---

## Example Request from NOTF Chatbot

### JavaScript Fetch Example

```javascript
// From notf chatbot (complaint-engine.js)
async function submitComplaint(formData, locationTag) {
    const response = await fetch('https://notf-cms.vercel.app/api/submit-complaint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            // Required fields
            description: formData.description,
            address: formData.address,
            citizen_phone: formData.citizen_phone || null,
            citizen_email: formData.citizen_email || null,

            // Optional fields
            corporation_id: locationTag.corporation_code || 'unassigned',
            category_id: formData.category_id,
            title: formData.title || 'Civic Issue',
            landmark: formData.landmark,
            latitude: formData.latitude,
            longitude: formData.longitude,
            citizen_name: formData.citizen_name,
            priority: formData.priority || 'medium',

            // Metadata for tracking and tagging
            metadata: {
                source: 'notf-chatbot',
                original_city: locationTag.city,
                corporation_code: locationTag.corporation_code,
                ward: locationTag.ward,
                auto_tagged: true,
                tagged_at: new Date().toISOString(),
                tagging_method: 'point-in-polygon',
                confidence: locationTag.confidence || 1.0,
                user_agent: navigator.userAgent,
                referrer: document.referrer
            }
        })
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Failed to submit complaint');
    }

    return result;
}
```

### Example Success Flow

**Request:**
```json
POST https://notf-cms.vercel.app/api/submit-complaint

{
  "description": "Broken streetlight causing safety issues at night",
  "address": "MG Road, Near City Center",
  "landmark": "Opposite Metro Station",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "citizen_phone": "9876543210",
  "citizen_name": "Ramesh Kumar",
  "corporation_id": "north",
  "category_id": "e8f47a9c-1234-5678-90ab-cdef12345678",
  "priority": "high",
  "metadata": {
    "source": "notf-chatbot",
    "original_city": "Bengaluru",
    "corporation_code": "north",
    "ward": "Ward 42",
    "auto_tagged": true,
    "tagged_at": "2025-01-18T10:30:00.000Z",
    "tagging_method": "point-in-polygon"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "complaint": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "complaint_number": "NOR-25-000456",
    "corporation_id": "123e4567-e89b-12d3-a456-426614174000",
    "category_id": "e8f47a9c-1234-5678-90ab-cdef12345678",
    "title": "Civic Issue",
    "description": "Broken streetlight causing safety issues at night",
    "address": "MG Road, Near City Center",
    "landmark": "Opposite Metro Station",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "citizen_name": "Ramesh Kumar",
    "citizen_phone": "9876543210",
    "citizen_email": null,
    "status": "new",
    "priority": "high",
    "metadata": {
      "source": "notf-chatbot",
      "original_city": "Bengaluru",
      "corporation_code": "north",
      "ward": "Ward 42",
      "auto_tagged": true,
      "tagged_at": "2025-01-18T10:30:00.000Z",
      "tagging_method": "point-in-polygon"
    },
    "created_at": "2025-01-18T10:30:15.123Z",
    "updated_at": "2025-01-18T10:30:15.123Z",
    "sla_deadline": "2025-01-20T10:30:15.123Z",
    "sla_breached": false
  },
  "message": "Complaint submitted successfully. Ticket: NOR-25-000456"
}
```

---

## Testing the API

### Using cURL

```bash
# Test complaint submission
curl -X POST https://notf-cms.vercel.app/api/submit-complaint \
  -H "Content-Type: application/json" \
  -H "Origin: https://notf.vercel.app" \
  -d '{
    "description": "Test complaint from NOTF chatbot",
    "address": "Test Address, Bengaluru",
    "citizen_phone": "9876543210",
    "corporation_id": "north",
    "metadata": {
      "source": "notf-chatbot",
      "test": true
    }
  }'
```

### Using JavaScript (Browser Console)

```javascript
fetch('https://notf-cms.vercel.app/api/submit-complaint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Test from browser console',
    address: '123 Test Street',
    citizen_email: 'test@example.com',
    corporation_id: 'north'
  })
})
.then(r => r.json())
.then(data => console.log(data));
```

---

## Security Considerations

### Current Security Measures

1. ✅ Server-side API key protection (SUPABASE_SERVICE_KEY hidden)
2. ✅ Input validation (length, format, required fields)
3. ✅ SQL injection protection (Supabase parameterized queries)
4. ✅ CORS headers (soon to be restricted)

### Additional Security Recommendations

1. **Rate Limiting** (Future enhancement):
   ```javascript
   // Add rate limiting middleware
   // Limit: 10 complaints per IP per hour
   ```

2. **Request Size Limit**:
   ```javascript
   // Vercel defaults to 4.5MB
   // Suitable for complaint + small photo metadata
   ```

3. **Honeypot Fields** (Anti-spam):
   ```javascript
   // Add hidden field in form, reject if filled
   if (complaint.honeypot) {
     return res.status(400).json({ error: 'Invalid submission' });
   }
   ```

4. **CAPTCHA** (Future enhancement):
   - Add hCaptcha or reCAPTCHA for public submissions
   - Validate token server-side

---

## Deployment Checklist

### notf-cms Repository Changes

- [ ] Update `/api/submit-complaint.js` with metadata support
- [ ] Update CORS to restrict origins
- [ ] Add source tracking logic
- [ ] Test locally with `vercel dev`
- [ ] Deploy to Vercel: `git push` (automatic deployment)
- [ ] Verify environment variables in Vercel dashboard

### Database Changes

- [ ] Add new corporations to `corporations` table
- [ ] Verify `metadata` column exists on `complaints` table
- [ ] Create index on `metadata->>'source'`
- [ ] Test complaint insertion with metadata

### Testing

- [ ] Test with valid corporation codes (north, south, mumbai, delhi, ahmedabad)
- [ ] Test with invalid corporation code
- [ ] Test CORS from https://notf.vercel.app
- [ ] Test CORS from localhost:8080
- [ ] Test metadata storage and retrieval
- [ ] Test error responses (validation failures)
- [ ] Test ticket number generation

---

## Summary

**What Already Works:**
- ✅ Complete API endpoint structure
- ✅ Server-side validation
- ✅ Corporation code lookup
- ✅ Database insertion
- ✅ Auto-generated ticket numbers
- ✅ CORS support (needs restriction)

**What Needs to be Added:**
1. Metadata field support (1 line of code)
2. Restricted CORS headers (10 lines of code)
3. Source tracking (5 lines of code)
4. New corporation entries in database

**Total Code Changes:** ~20 lines in `/api/submit-complaint.js`

The API is **production-ready** and requires minimal modifications to support the NOTF chatbot!

---

## Categories API Endpoint

**Added:** 2026-01-18

### Endpoint: GET /api/categories

**URL:** `https://notf-cms.vercel.app/api/categories`
**Method:** `GET`
**Authentication:** None (public endpoint)
**Purpose:** Fetch all issue categories from database for dynamic chatbot initialization

---

### Response Format

**Success Response (200 OK):**

```json
{
  "success": true,
  "categories": [
    {
      "id": "streetlight_not_working",
      "uuid": "e8f47a9c-1234-5678-90ab-cdef12345678",
      "name": "Street Light Not Working",
      "department": "Electrical",
      "departmentCode": "electrical",
      "keywords": ["streetlight", "street light", "light not working", "lamp", "dark street", "no light"]
    },
    {
      "id": "garbage_not_collected",
      "uuid": "a1b2c3d4-5678-90ab-cdef-123456789abc",
      "name": "Garbage Not Collected",
      "department": "SWM",
      "departmentCode": "swm",
      "keywords": ["garbage", "waste", "not collected", "rubbish", "trash", "no pickup"]
    }
    // ... more categories
  ],
  "count": 29,
  "cached_at": "2026-01-18T10:30:00.000Z"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Category code (used as ID for API calls) |
| `uuid` | string | Database UUID (actual primary key) |
| `name` | string | Display name of the category |
| `department` | string | Department name (e.g., "Electrical", "SWM") |
| `departmentCode` | string | Department code (e.g., "electrical", "swm") |
| `keywords` | array | Keywords for ML-based categorization |

### Error Responses

**500 Internal Server Error:**
```json
{
  "error": "Internal server error. Please try again later.",
  "details": "Detailed error message"
}
```

---

### Usage in Chatbot

**JavaScript Fetch Example:**

```javascript
// In complaint-engine.js
async fetchCategoriesFromAPI() {
    try {
        const response = await fetch('https://notf-cms.vercel.app/api/categories', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.categories) {
            return result.categories;
        }

        throw new Error('Invalid API response format');
    } catch (error) {
        console.error('API fetch error:', error);
        // Fall back to hardcoded categories
        return this.loadCategories();
    }
}
```

**Integration Pattern:**

1. Chatbot initializes with hardcoded categories (instant load)
2. Async API call fetches latest categories from database
3. Categories updated in background when API responds
4. Falls back to hardcoded if API fails
5. User sees categories immediately, gets latest data when available

**Benefits:**
- ✅ Categories stay in sync with database
- ✅ No code deployment needed to add/update categories
- ✅ Instant fallback if API is down
- ✅ Single source of truth (database)
- ✅ Supports dynamic category changes

---

### CORS Configuration

Same as submit-complaint endpoint:

```javascript
const allowedOrigins = [
    'https://notf.vercel.app',
    'https://notf-one.vercel.app',
    'https://notf-cms.vercel.app',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
];
```

---

### Testing

**Using cURL:**

```bash
curl -X GET https://notf-cms.vercel.app/api/categories \
  -H "Content-Type: application/json" \
  -H "Origin: https://notf.vercel.app"
```

**Using JavaScript (Browser Console):**

```javascript
fetch('https://notf-cms.vercel.app/api/categories')
  .then(r => r.json())
  .then(data => {
    console.log('Categories:', data.categories.length);
    console.log('First category:', data.categories[0]);
  });
```

---

### Implementation File

**File:** `/Users/sathya/Documents/GitHub/notf-cms/api/categories.js`

**Database Query:**

```javascript
const { data: categories } = await supabase
    .from('issue_categories')
    .select(`
        id,
        code,
        name,
        keywords,
        department:departments(
            id,
            code,
            name
        )
    `)
    .order('name');
```

**Performance:**
- Query time: ~50-100ms
- Response size: ~5-10KB (29 categories)
- Cacheable: Yes (can add Cache-Control headers)

---
