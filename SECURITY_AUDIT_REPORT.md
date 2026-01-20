# NOTF Website Security Audit Report

**Date:** January 19, 2026
**Auditor:** Claude Sonnet 4.5
**Scope:** Full website security audit including client-side code, Edge Functions, and infrastructure

---

## Executive Summary

This security audit identified **3 CRITICAL**, **3 HIGH**, **2 MEDIUM**, and **2 LOW** severity vulnerabilities across the NOTF website. Immediate attention is required for the critical vulnerabilities, particularly authentication bypass and XSS vulnerabilities that could compromise user data and admin access.

**Risk Level:** **HIGH** ⚠️

---

## Critical Vulnerabilities (🔴 CRITICAL)

### 1. Authentication Not Enforced on Edge Functions

**File:** `/supabase/functions/update-file/index.ts:89`
**Severity:** 🔴 CRITICAL
**CVSS Score:** 9.1 (Critical)

**Issue:**
```typescript
// Line 89: Auth is currently optional
console.log('Processing request', user ? `for user ${user.email}` : 'without auth')
```

The `update-file` Edge Function processes requests **without requiring authentication**. There's a TODO comment stating "make auth required after testing" but it's currently in production.

**Impact:**
- **Unauthorized users can modify community/provider data**
- **Data integrity compromise**
- **Potential for malicious data injection**

**Affected Endpoints:**
- POST `/functions/v1/update-file`
- All admin CRUD operations rely on this function

**Proof of Concept:**
```bash
curl -X POST https://abblyaukkoxmgzwretvm.supabase.co/functions/v1/update-file \
  -H "Content-Type: application/json" \
  -d '{"file_path":"communities/bengaluru/test.md","file_type":"community","updates":{"name":"Hacked Community"}}'
```

**Recommendation:**
```typescript
// Line 73-90: Replace with strict auth check
if (!authHeader) {
    return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}

const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
if (authError || !user) {
    return new Response(
        JSON.stringify({ error: 'Invalid or expired authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}

// Check if user has admin role
// TODO: Implement role-based access control
```

---

### 2. Cross-Site Scripting (XSS) in Admin CRUD Interfaces

**Files:**
- `/website/public/assets/admin/communities.js:85-155`
- `/website/public/assets/admin/organizations.js` (similar pattern)

**Severity:** 🔴 CRITICAL
**CVSS Score:** 8.8 (High)

**Issue:**
User-supplied data is rendered directly into HTML without sanitization:

```javascript
// Line 130-141: No escaping applied
container.innerHTML = comms.map(comm => {
    const name = comm.metadata?.name || comm.slug;
    const description = comm.metadata?.description || '';
    const truncatedDesc = description.length > 100 ? description.substring(0, 100) + '...' : description;

    return `
        <h3>${name}</h3>  <!-- XSS VULNERABILITY -->
        <p>${truncatedDesc}</p>  <!-- XSS VULNERABILITY -->
        <span>${city}${state ? ', ' + state : ''}</span>  <!-- XSS VULNERABILITY -->
    `;
});
```

**Impact:**
- **Stored XSS attack** - malicious script persists in database
- **Session hijacking** - steal admin session tokens
- **Admin account takeover**
- **Data exfiltration**

**Proof of Concept:**
1. Create community with name: `<img src=x onerror=alert(document.cookie)>`
2. Script executes when any admin views the communities list
3. Session token can be exfiltrated to attacker's server

**Affected Areas:**
- Community name, description, themes, location fields
- Solution provider name, description, focus areas
- Admin dashboard displays

**Recommendation:**
```javascript
// Add HTML escaping function
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Use escaping in templates
container.innerHTML = comms.map(comm => {
    const name = escapeHtml(comm.metadata?.name || comm.slug);
    const description = escapeHtml(comm.metadata?.description || '');
    const truncatedDesc = description.length > 100 ? description.substring(0, 100) + '...' : description;

    return `
        <h3>${name}</h3>
        <p>${truncatedDesc}</p>
    `;
}).join('');
```

**Alternative:** Use `textContent` instead of `innerHTML` where possible, or adopt a templating library that auto-escapes by default.

---

### 3. Hardcoded Supabase Anon Key in Client-Side Code

**Files:**
- `/website/public/assets/admin/auth.js:5`
- `/website/public/assets/js/data-loader.js`
- `/website/public/assets/js/join-form.js`

**Severity:** 🔴 CRITICAL
**CVSS Score:** 7.5 (High)

**Issue:**
```javascript
// Line 4-5: Exposed credentials
const SUPABASE_URL = 'https://abblyaukkoxmgzwretvm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYmx5YXVra294bWd6d3JldHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzE4NTQsImV4cCI6MjA4MzgwNzg1NH0.neJmkUmGFPfXMC5PZNRhaXIGEefj_b79L_YceXl5jxU';
```

**Impact:**
- **API key exposed to public** (anyone can view source)
- **Potential for abuse** if RLS policies are misconfigured
- **Database access** for read operations
- **Rate limiting bypass** (if not properly configured)

**Note:** While Supabase anon keys are designed to be somewhat public-facing (used in client apps), hardcoding them in source code:
1. Makes key rotation difficult
2. Exposes them in git history
3. Makes abuse easier if RLS is weak

**Recommendation:**

**Option 1: Use Environment Variables (Recommended)**
```javascript
// Use build-time environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

**Option 2: Configuration Endpoint**
```javascript
// Fetch config from secure endpoint
const config = await fetch('/api/config').then(r => r.json());
const supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
```

**Option 3: Accept Current Risk with Strong RLS**
- If keeping anon key public, ensure **Row Level Security (RLS)** policies are extremely strict
- Verify RLS on all tables (communities, solution-providers, file_metadata)
- Implement rate limiting on Supabase
- Monitor for abuse

---

## High Severity Vulnerabilities (🟠 HIGH)

### 4. Overly Permissive CORS Configuration

**File:** `/supabase/functions/update-file/index.ts:6`
**Severity:** 🟠 HIGH
**CVSS Score:** 7.1

**Issue:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // Allows ANY origin
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

**Impact:**
- **Any website can call your Edge Functions**
- **CSRF attacks possible**
- **Data exfiltration from third-party sites**

**Recommendation:**
```typescript
// Whitelist specific origins
const ALLOWED_ORIGINS = [
    'https://notf.vercel.app',
    'https://www.notf.org',
    'http://localhost:3000'  // Dev only
];

function getCorsHeaders(req: Request) {
    const origin = req.headers.get('Origin');
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        return {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Credentials': 'true'
        };
    }
    return {}; // Reject CORS for unknown origins
}
```

---

### 5. Missing Input Validation in Edge Functions

**File:** `/supabase/functions/update-file/index.ts:93-150`
**Severity:** 🟠 HIGH
**CVSS Score:** 6.8

**Issue:**
No validation on `updates` payload before merging:

```typescript
// Line 93: No validation
const { file_path, file_type, updates, markdown_body, version } = await req.json();

// Line 152: Direct merge without sanitization
const mergedData = mergeUpdates(currentData, updates);
```

**Impact:**
- **Malicious data injection**
- **Prototype pollution attacks**
- **Denial of service via large payloads**

**Recommendation:**
```typescript
// Add validation schema
import { z } from 'zod';

const CommunityUpdateSchema = z.object({
    name: z.string().max(200).optional(),
    description: z.string().max(5000).optional(),
    city: z.string().max(100).optional(),
    neighborhoods: z.array(z.string()).max(20).optional(),
    themes: z.array(z.string()).max(10).optional(),
    // ... other fields
}).strict(); // Reject unknown fields

// Validate before processing
try {
    const validatedUpdates = CommunityUpdateSchema.parse(updates);
    const mergedData = mergeUpdates(currentData, validatedUpdates);
} catch (error) {
    return new Response(
        JSON.stringify({ error: 'Invalid input data', details: error.errors }),
        { status: 400, headers: corsHeaders }
    );
}
```

---

### 6. Insufficient Admin Authorization Checks

**Files:**
- `/website/public/assets/admin/communities.js`
- `/website/public/assets/admin/organizations.js`

**Severity:** 🟠 HIGH
**CVSS Score:** 6.5

**Issue:**
Authentication check but no **role-based authorization**:

```javascript
// Line 9: Only checks if user is logged in
const session = await authUtils.requireAuth();
if (!session) return;

// No check if user has 'admin' role
```

**Impact:**
- **Any authenticated user can access admin panel**
- **Regular users can modify data**
- **Privilege escalation risk**

**Recommendation:**
```javascript
// In auth.js, add role check
async function requireAdmin() {
    const session = await checkAuth();
    if (!session) {
        window.location.href = '/admin/login.html';
        return null;
    }

    // Check user metadata for admin role
    const { data: { user } } = await getSupabaseAuthClient().auth.getUser();

    if (!user?.user_metadata?.role || user.user_metadata.role !== 'admin') {
        alert('Access denied. Admin privileges required.');
        window.location.href = '/';
        return null;
    }

    return session;
}

// In admin pages
const session = await authUtils.requireAdmin();
if (!session) return;
```

**Database Setup:**
```sql
-- Add role to user metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"admin"')
WHERE email = 'admin@notf.org';

-- Enable RLS on file_metadata table
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can update
CREATE POLICY "Admin write access" ON file_metadata
FOR ALL
USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
);
```

---

## Medium Severity Vulnerabilities (🟡 MEDIUM)

### 7. Sensitive Data in LocalStorage (Chatbot)

**File:** `/website/public/assets/chat/unified-chatbot.js:1523`
**Severity:** 🟡 MEDIUM
**CVSS Score:** 5.3

**Issue:**
```javascript
// Line 1512-1523: Storing conversation history in plain text
saveSession() {
    const session = {
        sessionId: this.sessionId,
        mode: this.mode,
        state: this.state,
        conversationHistory: this.conversationHistory,  // May contain PII
        formData: this.formData,  // May contain complaint details
        timestamp: Date.now()
    };

    localStorage.setItem('notf_chatbot_session', JSON.stringify(session));
}
```

**Impact:**
- **PII stored in browser localStorage** (accessible to XSS)
- **Complaint details persisted** (may include personal info)
- **No expiration** (data persists until manually cleared)

**Recommendation:**

**Option 1: Use SessionStorage (Session-Scoped)**
```javascript
sessionStorage.setItem('notf_chatbot_session', JSON.stringify(session));
```

**Option 2: Encrypt Sensitive Data**
```javascript
import CryptoJS from 'crypto-js';

saveSession() {
    const session = { /* ... */ };
    const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(session),
        'secret-key'  // Use per-session key
    ).toString();
    localStorage.setItem('notf_chatbot_session', encrypted);
}
```

**Option 3: Don't Store Sensitive Data Client-Side**
```javascript
// Only store non-sensitive metadata
saveSession() {
    const session = {
        sessionId: this.sessionId,
        mode: this.mode,
        state: this.state,
        // Don't store conversationHistory or formData
        timestamp: Date.now()
    };
    localStorage.setItem('notf_chatbot_session', JSON.stringify(session));
}
```

---

### 8. No Rate Limiting on Edge Functions

**Files:** All Edge Functions
**Severity:** 🟡 MEDIUM
**CVSS Score:** 5.0

**Issue:**
No rate limiting implemented on API endpoints.

**Impact:**
- **Denial of Service (DoS) attacks**
- **API abuse**
- **Resource exhaustion**
- **Cost escalation** (Supabase billing)

**Recommendation:**

**Option 1: Supabase Rate Limiting (if available)**
Check Supabase dashboard for rate limiting settings.

**Option 2: Implement Custom Rate Limiting**
```typescript
// Add to Edge Function
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

const rateLimitMap = new Map();

function checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const userRequests = rateLimitMap.get(identifier) || [];

    // Remove old requests outside window
    const recentRequests = userRequests.filter((time: number) => now - time < RATE_WINDOW);

    if (recentRequests.length >= RATE_LIMIT) {
        return false; // Rate limit exceeded
    }

    recentRequests.push(now);
    rateLimitMap.set(identifier, recentRequests);
    return true;
}

// In serve handler
const identifier = user?.id || req.headers.get('CF-Connecting-IP') || 'anonymous';
if (!checkRateLimit(identifier)) {
    return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: corsHeaders }
    );
}
```

**Option 3: Use Cloudflare Rate Limiting**
If using Cloudflare, configure rate limiting rules in the dashboard.

---

## Low Severity Vulnerabilities (🟢 LOW)

### 9. Missing Security Headers

**Files:** All HTML pages
**Severity:** 🟢 LOW
**CVSS Score:** 3.1

**Issue:**
No security headers configured (CSP, X-Frame-Options, etc.)

**Impact:**
- **Clickjacking risk**
- **XSS via CDN compromise**
- **Mixed content issues**

**Recommendation:**

Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://cdn.sheetjs.com https://abblyaukkoxmgzwretvm.supabase.co; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://cdnjs.cloudflare.com; connect-src 'self' https://abblyaukkoxmgzwretvm.supabase.co https://nominatim.openstreetmap.org; frame-ancestors 'none';"
        }
      ]
    }
  ]
}
```

---

### 10. Excel Import Accepts Arbitrary File Paths

**File:** `/website/public/assets/admin/excel-import.js`
**Severity:** 🟢 LOW
**CVSS Score:** 3.5

**Issue:**
Excel import uses `file_path` from uploaded file without validation:

```javascript
// User can specify arbitrary paths in Excel
const filePath = row['File Path'];
await updateFile(filePath, updates);
```

**Impact:**
- **Path traversal risk** (limited by storage permissions)
- **Overwriting unintended files**

**Recommendation:**
```javascript
// Validate file path matches expected pattern
function validateFilePath(filePath, fileType) {
    const validPatterns = {
        'community': /^communities\/[a-z-]+\/[a-z0-9-]+\.md$/,
        'provider': /^solution-providers\/[a-z0-9-]+\.(yaml|yml)$/
    };

    const pattern = validPatterns[fileType];
    if (!pattern || !pattern.test(filePath)) {
        throw new Error(`Invalid file path format: ${filePath}`);
    }

    return true;
}

// In import validation
validateFilePath(row['File Path'], fileType);
```

---

## Positive Security Findings ✅

### What's Working Well:

1. **✅ SQL Injection Protection:** Using Supabase client library with parameterized queries
2. **✅ File Upload Validation:** Photo uploads have proper type and size checks (`complaint-engine.js:validatePhoto`)
3. **✅ Excel Import Validation:** Required fields and data types validated before import
4. **✅ User Input Escaping (Partial):** Chatbot user messages are escaped with `escapeHtml()` (line 1376)
5. **✅ File Upload Restrictions:** Photos limited to 2MB, specific formats only (JPEG, PNG, HEIC, HEIF)
6. **✅ HTTPS Enforced:** All production endpoints use HTTPS
7. **✅ Minimal Dependencies:** Only 1 npm dependency (`@supabase/supabase-js`)

---

## Recommendations Priority Matrix

| Priority | Vulnerability | Estimated Effort | Impact |
|----------|---------------|------------------|--------|
| 🔴 **P0** | Enforce authentication on Edge Functions | 2 hours | CRITICAL |
| 🔴 **P0** | Fix XSS vulnerabilities in admin CRUD | 4 hours | CRITICAL |
| 🔴 **P0** | Implement admin role-based authorization | 3 hours | HIGH |
| 🟠 **P1** | Restrict CORS to specific origins | 1 hour | HIGH |
| 🟠 **P1** | Add input validation to Edge Functions | 3 hours | HIGH |
| 🟠 **P1** | Move Supabase keys to env variables | 2 hours | MEDIUM |
| 🟡 **P2** | Add rate limiting to Edge Functions | 4 hours | MEDIUM |
| 🟡 **P2** | Switch chatbot storage to sessionStorage | 1 hour | MEDIUM |
| 🟢 **P3** | Add security headers to Vercel config | 30 mins | LOW |
| 🟢 **P3** | Validate Excel import file paths | 1 hour | LOW |

**Total Estimated Effort:** ~21.5 hours

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
- [ ] Enforce authentication on `update-file` Edge Function
- [ ] Add role-based authorization checks to admin pages
- [ ] Fix XSS vulnerabilities in communities.js and organizations.js
- [ ] Add HTML escaping utility function

### Phase 2: High Priority (Week 2)
- [ ] Restrict CORS to whitelisted origins
- [ ] Add input validation schema to Edge Functions
- [ ] Move Supabase credentials to environment variables
- [ ] Update deployment pipeline for env variables

### Phase 3: Medium Priority (Week 3)
- [ ] Implement rate limiting on Edge Functions
- [ ] Switch chatbot to sessionStorage
- [ ] Add logging for security events

### Phase 4: Low Priority & Hardening (Week 4)
- [ ] Add security headers via Vercel config
- [ ] Validate file paths in Excel import
- [ ] Security testing and penetration testing
- [ ] Documentation updates

---

## Testing Recommendations

### Security Testing Checklist:
- [ ] **Manual XSS Testing:** Try injecting `<script>alert(1)</script>` in all form fields
- [ ] **Authentication Bypass Testing:** Try accessing admin pages without login
- [ ] **Authorization Testing:** Create non-admin user, verify they can't access admin functions
- [ ] **CORS Testing:** Use `curl` to test CORS from unauthorized origin
- [ ] **Rate Limit Testing:** Script to send 100 requests/second, verify throttling
- [ ] **Input Validation Testing:** Send malformed JSON to Edge Functions
- [ ] **File Path Traversal:** Try uploading Excel with paths like `../../../etc/passwd`

### Automated Tools:
- [ ] Run OWASP ZAP scan
- [ ] Run npm audit for dependency vulnerabilities
- [ ] Run Snyk security scan
- [ ] Use Lighthouse for security best practices

---

## Compliance & Best Practices

### OWASP Top 10 Coverage:
- ✅ A01:2021 – Broken Access Control (Addressed with auth fixes)
- ✅ A02:2021 – Cryptographic Failures (No sensitive data in transit issues)
- ✅ A03:2021 – Injection (SQL injection protected, need XSS fix)
- ⚠️ A05:2021 – Security Misconfiguration (CORS, headers need fixing)
- ✅ A06:2021 – Vulnerable Components (Only 1 dependency, up to date)
- ✅ A07:2021 – Identification/Authentication Failures (Need role checks)

### CWE Coverage:
- CWE-79 (XSS) – Found and documented
- CWE-89 (SQL Injection) – Protected via ORM
- CWE-200 (Information Exposure) – Found (API keys)
- CWE-284 (Improper Access Control) – Found and documented
- CWE-352 (CSRF) – CORS misconfiguration allows this

---

## Appendix

### Files Audited:
- `/website/public/assets/admin/auth.js`
- `/website/public/assets/admin/communities.js`
- `/website/public/assets/admin/organizations.js`
- `/website/public/assets/admin/excel-import.js`
- `/website/public/assets/admin/excel-export.js`
- `/website/public/assets/chat/unified-chatbot.js`
- `/website/public/assets/chat/complaint-engine.js`
- `/supabase/functions/update-file/index.ts`
- `/supabase/functions/delete-file/index.ts`

### External Dependencies Audited:
- `@supabase/supabase-js@^2.78.0` – No known vulnerabilities
- SheetJS (CDN: xlsx-0.20.1) – Check for latest version
- Font Awesome (CDN: 6.5.1) – No security issues
- Fuse.js (CDN: 7.0.0) – No security issues
- Marked.js (CDN: 11.1.1) – Check for latest version (XSS risk in markdown parsers)

---

## Contact

For questions about this audit or to report new vulnerabilities, contact:
- **Security Email:** security@notf.org (if available)
- **GitHub Issues:** https://github.com/urbanmorph/notf/issues (mark as security)

---

**End of Security Audit Report**
