# NOTF-CMS Complaint Submission API
## REST API Documentation v1.0

---

## Overview

The NOTF-CMS Complaint Submission API enables civic organizations, chatbots, and applications to submit citizen complaints directly to municipal corporations. The API handles complaint validation, routing, and ticket generation automatically.

**Base URL:** `https://notf-cms.vercel.app/api`

**API Version:** 1.0
**Last Updated:** January 18, 2025
**Format:** JSON
**Protocol:** HTTPS

---

## Authentication

Currently, this is a **public API** with no authentication required. Rate limiting may apply in the future.

---

## Endpoints

### Submit Complaint

Submit a new civic complaint to the appropriate municipal corporation.

**Endpoint:** `POST /submit-complaint`

**Content-Type:** `application/json`

**Request Headers:**

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Content-Type` | string | Yes | Must be `application/json` |
| `Origin` | string | No | Cross-origin requests must come from allowed domains |

---

## Request Body

### Schema

```json
{
  "corporation_id": "string",
  "category_id": "string",
  "department_id": "string",
  "title": "string",
  "description": "string",
  "address": "string",
  "landmark": "string",
  "latitude": number,
  "longitude": number,
  "citizen_name": "string",
  "citizen_phone": "string",
  "citizen_email": "string",
  "priority": "string",
  "metadata": {
    "source": "string",
    "original_city": "string",
    "corporation_code": "string",
    "ward": "string",
    "auto_tagged": boolean,
    "tagged_at": "string",
    "tagging_method": "string"
  }
}
```

### Required Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `description` | string | min: 10 chars | Detailed description of the complaint |
| `address` | string | - | Location address where the issue exists |
| `citizen_phone` OR `citizen_email` | string | - | At least one contact method is required |

### Optional Fields

| Field | Type | Format/Values | Description |
|-------|------|---------------|-------------|
| `corporation_id` | string | Code or UUID | Corporation code (e.g., "north", "south") or UUID. Auto-converts codes to UUIDs. |
| `category_id` | string | UUID | Issue category identifier |
| `department_id` | string | UUID | Responsible department identifier |
| `title` | string | max: 255 chars | Brief title (defaults to "Civic Issue") |
| `landmark` | string | - | Nearby landmark for location reference |
| `latitude` | number | decimal | GPS latitude coordinate |
| `longitude` | number | decimal | GPS longitude coordinate |
| `citizen_name` | string | max: 100 chars | Name of the complainant (can be anonymous) |
| `citizen_phone` | string | 10 digits | Indian mobile number (must start with 6-9) |
| `citizen_email` | string | email format | Valid email address |
| `priority` | string | Enum | One of: `critical`, `high`, `medium`, `low` |
| `metadata` | object | JSON | Additional metadata for tracking and analytics |

### Metadata Object (Optional)

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | Source system (e.g., "notf-chatbot", "mobile-app") |
| `original_city` | string | City name where complaint originated |
| `corporation_code` | string | Corporation code for tracking |
| `ward` | string | Ward name or number |
| `auto_tagged` | boolean | Whether corporation was auto-detected |
| `tagged_at` | string (ISO 8601) | Timestamp of auto-tagging |
| `tagging_method` | string | Method used (e.g., "point-in-polygon", "manual") |

---

## Corporation Codes

### Bengaluru Corporations

| Code | Name | Coverage |
|------|------|----------|
| `north` | Bengaluru North Corporation | Northern zones and wards |
| `south` | Bengaluru South Corporation | Southern zones and wards |
| `east` | Bengaluru East Corporation | Eastern zones and wards |
| `west` | Bengaluru West Corporation | Western zones and wards |
| `central` | Bengaluru Central Corporation | Central zones and wards |

### Supported Cities (12 Cities Total)

All cities have ward boundary files in KML format for auto-tagging support.

| Code | Name | City | State | Ward File |
|------|------|------|-------|-----------|
| `ahmedabad` | Ahmedabad Municipal Corporation | Ahmedabad | Gujarat | ahmedabad-wards.kml |
| `bhubaneswar` | Bhubaneswar Municipal Corporation | Bhubaneswar | Odisha | bhubaneshwar-wards.kml |
| `chennai` | Chennai Municipal Corporation | Chennai | Tamil Nadu | chennai-wards.kml |
| `gurugram` | Gurugram Municipal Corporation | Gurugram | Haryana | gurugram-wards.kml |
| `hyderabad` | Hyderabad Municipal Corporation | Hyderabad | Telangana | hyderabad-wards.kml |
| `jaipur` | Jaipur Municipal Corporation | Jaipur | Rajasthan | jaipur-wards.kml |
| `kolkata` | Kolkata Municipal Corporation | Kolkata | West Bengal | kolkata-wards.kml |
| `mumbai` | Mumbai Municipal Corporation | Mumbai | Maharashtra | mumbai-wards.kml |
| `pune` | Pune Municipal Corporation | Pune | Maharashtra | pune-wards.kml |
| `thane` | Thane Municipal Corporation | Thane | Maharashtra | thane-wards.kml |
| `visakhapatnam` | Visakhapatnam Municipal Corporation | Visakhapatnam | Andhra Pradesh | vizag-wards.kml |

### Fallback

| Code | Name | Usage |
|------|------|-------|
| `unassigned` | Unassigned Corporation | When location cannot be determined |

---

## Auto-Tagging Support

### Bengaluru (Full Support)
- 5 corporations with 369 wards
- Point-in-polygon detection using GeoJSON boundaries
- Ward-to-corporation mapping available
- Automatic routing to specific corporation

### Other 11 Cities (Basic Support)
- Ward boundaries available in KML format
- Point-in-polygon detection possible
- Single municipal corporation per city
- Ward detection within city boundary

---

## Response Format

### Success Response

**HTTP Status:** `200 OK`

**Response Body:**

```json
{
  "success": true,
  "complaint": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "complaint_number": "NOR-25-000123",
    "corporation_id": "123e4567-e89b-12d3-a456-426614174000",
    "category_id": "789e4567-e89b-12d3-a456-426614174000",
    "department_id": null,
    "title": "Civic Issue",
    "description": "Broken streetlight on MG Road near City Center",
    "address": "MG Road, Bengaluru North",
    "landmark": "Near City Center Mall",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "citizen_name": "Ramesh Kumar",
    "citizen_phone": "9876543210",
    "citizen_email": "ramesh@example.com",
    "status": "new",
    "priority": "medium",
    "ml_department_id": null,
    "ml_category_id": null,
    "ml_confidence": null,
    "assigned_to": null,
    "assigned_at": null,
    "created_at": "2025-01-18T10:30:15.123Z",
    "updated_at": "2025-01-18T10:30:15.123Z",
    "resolved_at": null,
    "closed_at": null,
    "sla_deadline": "2025-01-20T10:30:15.123Z",
    "sla_breached": false,
    "metadata": {
      "source": "notf-chatbot",
      "original_city": "Bengaluru",
      "corporation_code": "north",
      "ward": "Ward 42",
      "auto_tagged": true,
      "tagged_at": "2025-01-18T10:30:00.000Z",
      "tagging_method": "point-in-polygon"
    }
  },
  "message": "Complaint submitted successfully. Ticket: NOR-25-000123"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` on success |
| `complaint` | object | Complete complaint object with auto-generated fields |
| `complaint.id` | string (UUID) | Unique complaint identifier |
| `complaint.complaint_number` | string | Human-readable ticket number (format: `{CORP}-{YY}-{XXXXXX}`) |
| `complaint.status` | string | Current status (always "new" on creation) |
| `complaint.created_at` | string (ISO 8601) | Timestamp when complaint was created |
| `complaint.sla_deadline` | string (ISO 8601) | Expected resolution deadline |
| `message` | string | Success message with ticket number |

---

## Error Responses

### Validation Errors

**HTTP Status:** `400 Bad Request`

#### Description Too Short

```json
{
  "error": "Description must be at least 10 characters long."
}
```

#### Missing Contact Information

```json
{
  "error": "Please provide either a phone number or email address."
}
```

#### Invalid Corporation Code

```json
{
  "error": "Invalid corporation code: invalid_code"
}
```

#### Invalid Phone Number

```json
{
  "error": "Invalid phone number. Must be 10 digits starting with 6-9."
}
```

**Example Invalid Phone Numbers:**
- `1234567890` (doesn't start with 6-9)
- `98765432` (less than 10 digits)
- `987654321012` (more than 10 digits)

#### Invalid Email Address

```json
{
  "error": "Invalid email address format."
}
```

**Example Invalid Emails:**
- `user@` (missing domain)
- `@example.com` (missing username)
- `user.example.com` (missing @)

### Method Not Allowed

**HTTP Status:** `405 Method Not Allowed`

```json
{
  "error": "Method not allowed. Use POST."
}
```

**Triggered when:** Using GET, PUT, DELETE, or other HTTP methods instead of POST.

### Server Errors

**HTTP Status:** `500 Internal Server Error`

```json
{
  "error": "Failed to submit complaint. Please try again.",
  "details": "Detailed error message for debugging"
}
```

---

## Code Examples

### JavaScript (Fetch API)

```javascript
const submitComplaint = async (complaintData) => {
  const response = await fetch('https://notf-cms.vercel.app/api/submit-complaint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: "Broken streetlight causing safety issues",
      address: "MG Road, Near City Center",
      landmark: "Opposite Metro Station",
      latitude: 12.9716,
      longitude: 77.5946,
      citizen_phone: "9876543210",
      citizen_name: "Ramesh Kumar",
      corporation_id: "north",
      category_id: "e8f47a9c-1234-5678-90ab-cdef12345678",
      priority: "high",
      metadata: {
        source: "web-app",
        original_city: "Bengaluru",
        corporation_code: "north"
      }
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error);
  }

  console.log('Ticket Number:', result.complaint.complaint_number);
  return result;
};
```

### JavaScript (Axios)

```javascript
const axios = require('axios');

const submitComplaint = async (complaintData) => {
  try {
    const response = await axios.post(
      'https://notf-cms.vercel.app/api/submit-complaint',
      {
        description: "Garbage not collected for 3 days",
        address: "Jayanagar 4th Block, Bengaluru",
        citizen_email: "citizen@example.com",
        corporation_id: "south",
        priority: "medium"
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.response.data.error);
    }
    throw error;
  }
};
```

### Python (Requests)

```python
import requests

def submit_complaint(complaint_data):
    url = "https://notf-cms.vercel.app/api/submit-complaint"

    payload = {
        "description": "Pothole on main road causing accidents",
        "address": "Whitefield Main Road, Bengaluru",
        "latitude": 12.9698,
        "longitude": 77.7499,
        "citizen_phone": "9876543210",
        "corporation_id": "east",
        "priority": "high"
    }

    headers = {
        "Content-Type": "application/json"
    }

    response = requests.post(url, json=payload, headers=headers)

    if response.status_code == 200:
        result = response.json()
        print(f"Ticket Number: {result['complaint']['complaint_number']}")
        return result
    else:
        error = response.json()
        raise Exception(error.get('error', 'Unknown error'))
```

### cURL

```bash
curl -X POST https://notf-cms.vercel.app/api/submit-complaint \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Street light not working for past week",
    "address": "Koramangala 5th Block, Bengaluru",
    "landmark": "Near Forum Mall",
    "latitude": 12.9352,
    "longitude": 77.6245,
    "citizen_email": "citizen@example.com",
    "corporation_id": "south",
    "priority": "medium",
    "metadata": {
      "source": "mobile-app"
    }
  }'
```

### Node.js (Native HTTPS)

```javascript
const https = require('https');

const submitComplaint = (complaintData) => {
  const data = JSON.stringify({
    description: "Drainage overflow during rain",
    address: "Indiranagar, Bengaluru",
    citizen_phone: "9876543210",
    corporation_id: "east"
  });

  const options = {
    hostname: 'notf-cms.vercel.app',
    port: 443,
    path: '/api/submit-complaint',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        const result = JSON.parse(body);

        if (res.statusCode === 200) {
          resolve(result);
        } else {
          reject(new Error(result.error));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
};
```

---

## Use Cases

### 1. Civic Complaint Chatbot

A chatbot that guides users through complaint submission with natural language processing.

**Flow:**
1. User describes issue in natural language
2. Chatbot extracts: description, location, category
3. Chatbot geocodes location and auto-tags corporation
4. Submits complaint via API with metadata
5. Returns ticket number to user

**Example Request:**
```json
{
  "description": "The park's water fountain has been broken for 2 weeks",
  "address": "Cubbon Park, Bengaluru",
  "latitude": 12.9762,
  "longitude": 77.5929,
  "citizen_phone": "9876543210",
  "corporation_id": "central",
  "category_id": "amenities-uuid",
  "metadata": {
    "source": "notf-chatbot",
    "auto_tagged": true,
    "tagging_method": "point-in-polygon",
    "conversation_id": "conv-123456"
  }
}
```

### 2. Mobile Application

A mobile app for citizens to report civic issues with photos and GPS location.

**Flow:**
1. User takes photo of issue
2. App captures GPS coordinates
3. User provides description
4. App auto-detects corporation based on coordinates
5. Submits complaint with location metadata

**Example Request:**
```json
{
  "description": "Large pothole causing traffic jam",
  "address": "Outer Ring Road, Marathahalli",
  "latitude": 12.9591,
  "longitude": 77.7011,
  "citizen_email": "user@example.com",
  "citizen_name": "Priya Sharma",
  "corporation_id": "east",
  "priority": "high",
  "metadata": {
    "source": "mobile-app-android",
    "app_version": "1.2.3",
    "device_model": "Samsung Galaxy S21"
  }
}
```

### 3. Web Portal Integration

A civic engagement website that allows users to submit and track complaints.

**Flow:**
1. User fills out complaint form on website
2. Form validates inputs client-side
3. Submits to API on form submission
4. Displays ticket number and tracking link

**Example Request:**
```json
{
  "description": "Street cleaning not done for a month",
  "address": "BTM Layout 2nd Stage, Bengaluru",
  "citizen_phone": "9876543210",
  "citizen_email": "resident@example.com",
  "corporation_id": "south",
  "category_id": "sanitation-uuid",
  "metadata": {
    "source": "web-portal",
    "referrer": "https://civic-portal.example.com"
  }
}
```

### 4. Bulk Import System

An admin tool to import complaints from offline surveys or field data collection.

**Flow:**
1. Field workers collect complaint data offline
2. System processes CSV/Excel file
3. Batch submits complaints via API
4. Generates report with ticket numbers

**Example Batch Request (Loop):**
```javascript
const complaints = [
  {
    description: "Water supply irregular in mornings",
    address: "HSR Layout Sector 1",
    citizen_phone: "9876543210",
    corporation_id: "south"
  },
  {
    description: "Garbage bins overflowing",
    address: "Koramangala 7th Block",
    citizen_phone: "9123456789",
    corporation_id: "south"
  }
];

for (const complaint of complaints) {
  await submitComplaint(complaint);
  await sleep(1000); // Rate limiting
}
```

---

## Rate Limiting

**Current Status:** No rate limiting implemented
**Future Plans:** May implement rate limiting based on IP address or API key

**Recommended Client-Side Rate Limiting:**
- Maximum 10 requests per minute
- Implement exponential backoff on errors

---

## CORS (Cross-Origin Resource Sharing)

### Allowed Origins

The API accepts requests from the following origins:

- `https://notf.vercel.app` - NOTF web application
- `https://notf-cms.vercel.app` - NOTF CMS
- `http://localhost:8080` - Local development
- `http://127.0.0.1:8080` - Local development

### CORS Headers

**Request Headers Allowed:**
- `Content-Type`
- `X-Requested-With`

**Methods Allowed:**
- `POST`
- `OPTIONS` (preflight)

**Credentials:** Enabled

---

## Best Practices

### 1. Input Validation

Always validate data client-side before sending to the API:

```javascript
function validateComplaint(data) {
  const errors = [];

  if (!data.description || data.description.length < 10) {
    errors.push('Description must be at least 10 characters');
  }

  if (!data.citizen_phone && !data.citizen_email) {
    errors.push('Either phone or email is required');
  }

  if (data.citizen_phone && !/^[6-9]\d{9}$/.test(data.citizen_phone)) {
    errors.push('Invalid phone number format');
  }

  if (data.citizen_email && !/@/.test(data.citizen_email)) {
    errors.push('Invalid email format');
  }

  return errors;
}
```

### 2. Error Handling

Implement proper error handling with user-friendly messages:

```javascript
try {
  const result = await submitComplaint(data);
  showSuccess(`Ticket created: ${result.complaint.complaint_number}`);
} catch (error) {
  if (error.response?.status === 400) {
    showError(error.response.data.error);
  } else if (error.response?.status === 500) {
    showError('Server error. Please try again later.');
  } else {
    showError('Network error. Check your connection.');
  }
}
```

### 3. Metadata Tracking

Include useful metadata for analytics and debugging:

```javascript
const metadata = {
  source: 'your-app-name',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  user_agent: navigator.userAgent,
  referrer: document.referrer,
  session_id: getSessionId()
};
```

### 4. Privacy Considerations

- **Anonymous Complaints:** `citizen_name` is optional
- **Contact Info:** Only one contact method required
- **Location Data:** GPS coordinates are optional
- **Metadata:** Avoid storing sensitive personal information

### 5. Retry Logic

Implement exponential backoff for failed requests:

```javascript
async function submitWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await submitComplaint(data);
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## Ticket Number Format

Ticket numbers are auto-generated in the format:

```
{CORPORATION_CODE}-{YEAR}-{SEQUENCE}
```

**Examples:**
- `NOR-25-000001` - First complaint of 2025 in North Corporation
- `SOU-25-000456` - 456th complaint of 2025 in South Corporation
- `DEL-25-000123` - 123rd complaint of 2025 in Delhi

**Sequence:**
- Resets annually (starts at 000001 each year)
- Increments per corporation
- Zero-padded to 6 digits

---

## SLA (Service Level Agreement)

Complaints are assigned an SLA deadline based on the department:

| Department | Default SLA | Description |
|------------|-------------|-------------|
| Electrical | 24 hours | Street lights, power issues |
| SWM (Solid Waste Management) | 48 hours | Garbage collection |
| Roads | 72 hours | Potholes, road repairs |
| Water Supply | 24 hours | Water supply issues |
| Drainage | 48 hours | Drainage problems |
| Default | 48 hours | Other issues |

**SLA Tracking:**
- `sla_deadline` - Calculated automatically
- `sla_breached` - Auto-updated if deadline passes

---

## Status Workflow

Complaints go through the following statuses:

```
new → assigned → in_progress → resolved → closed
                             → rejected
```

| Status | Description |
|--------|-------------|
| `new` | Complaint just submitted, awaiting assignment |
| `assigned` | Assigned to a field officer |
| `in_progress` | Work has started on the complaint |
| `resolved` | Issue has been fixed |
| `closed` | Complaint closed (by admin or auto-closure) |
| `rejected` | Complaint was invalid or duplicate |

---

## Priority Levels

| Priority | Response Time | Use Case |
|----------|--------------|----------|
| `critical` | Immediate | Life-threatening issues (gas leaks, building collapse) |
| `high` | < 24 hours | Safety issues (broken streetlights, open manholes) |
| `medium` | < 48 hours | Standard civic issues (garbage, potholes) |
| `low` | < 7 days | Minor issues (cosmetic repairs, suggestions) |

---

## Testing

### Test Endpoint

Use the following test data to verify your integration:

```json
{
  "description": "Test complaint for API integration testing",
  "address": "Test Address, Bengaluru",
  "citizen_phone": "9876543210",
  "corporation_id": "north",
  "metadata": {
    "source": "api-test",
    "test": true
  }
}
```

### Sandbox Environment

**Coming Soon:** A sandbox environment will be available for testing without creating real complaints.

---

## Changelog

### Version 1.0 (January 18, 2025)

- Initial public release
- Support for Bengaluru corporations (5 zones)
- Multi-city support (Delhi, Mumbai, Pune)
- Metadata field for tracking
- Auto-generated ticket numbers
- SLA deadline calculation
- CORS support for web applications

---

## Support

### Documentation

- **Integration Guide:** See `CHATBOT_INTEGRATION_PLAN.md`
- **API Specification:** See `API_SPECIFICATION.md`

### Contact

For API support, integration questions, or bug reports:

- **GitHub Issues:** [notf-cms repository](https://github.com/your-org/notf-cms/issues)
- **Email:** support@notf.example.com

### Response Times

- **Bug Reports:** Within 48 hours
- **Feature Requests:** Reviewed weekly
- **Integration Support:** Within 24 hours

---

## Legal

### Terms of Use

- This API is provided for civic engagement purposes
- Do not submit fake or spam complaints
- Rate limiting may be enforced without notice
- Service availability is not guaranteed (99.9% uptime target)

### Privacy Policy

- Complaint data is stored securely in Supabase
- Personal information (name, phone, email) is used only for complaint follow-up
- Data may be shared with municipal corporations for resolution
- Location data is used only for routing and mapping

### Data Retention

- Active complaints: Retained indefinitely
- Resolved complaints: Retained for 5 years
- Personal data: Anonymized after 1 year (if complaint is closed)

---

## Appendix

### A. HTTP Status Codes

| Code | Meaning | When It Occurs |
|------|---------|----------------|
| 200 | OK | Complaint submitted successfully |
| 400 | Bad Request | Validation error in request data |
| 405 | Method Not Allowed | Using wrong HTTP method (not POST) |
| 500 | Internal Server Error | Server or database error |

### B. Complaint Number Prefixes

| Prefix | Corporation |
|--------|-------------|
| NOR | Bengaluru North |
| SOU | Bengaluru South |
| EAS | Bengaluru East |
| WES | Bengaluru West |
| CEN | Bengaluru Central |
| AHM | Ahmedabad |
| BHU | Bhubaneswar |
| CHE | Chennai |
| GUR | Gurugram |
| HYD | Hyderabad |
| JAI | Jaipur |
| KOL | Kolkata |
| MUM | Mumbai |
| PUN | Pune |
| THA | Thane |
| VIS | Visakhapatnam |
| UNA | Unassigned |

### C. Common Error Scenarios

| Scenario | Error Message | Solution |
|----------|---------------|----------|
| Description too short | "Description must be at least 10 characters long." | Provide detailed description (min 10 chars) |
| Missing contact | "Please provide either a phone number or email address." | Include `citizen_phone` OR `citizen_email` |
| Invalid phone | "Invalid phone number. Must be 10 digits starting with 6-9." | Use Indian mobile format: 9876543210 |
| Invalid email | "Invalid email address format." | Use valid email: user@example.com |
| Wrong corp code | "Invalid corporation code: xyz" | Use valid code from list above |
| Network timeout | Various | Check internet connection, retry with backoff |

---

**End of Documentation**

*Last Updated: January 18, 2025*
*API Version: 1.0*
*Document Version: 1.0*
