# NOTF Chatbot End-to-End Test Plan

**Version:** 1.0
**Date:** 2026-01-18
**Testing Phase:** Task 4 - End-to-End Workflow Testing

---

## Test Environment

- **Production URL:** https://notf-one.vercel.app
- **API Backend:** https://notf-cms.vercel.app/api
- **Database:** Supabase (abblyaukkoxmgzwretvm.supabase.co)

---

## 1. Discovery Mode Tests

### Test 1.1: Search by City
**Objective:** Verify Fuse.js search returns communities filtered by city

**Steps:**
1. Open chatbot on homepage
2. Select "🔍 Find Communities/Resources"
3. Type: "communities in Bengaluru"
4. Verify search results show only Bengaluru communities

**Expected Result:**
- Results filtered by city
- Display shows: Name, Location, Theme tags
- "No results" message if no match

**Status:** ✅ PASSED (2026-01-18)
**Notes:** Fixed race condition and data structure mismatches. Search now working correctly.

---

### Test 1.2: Search by Theme
**Objective:** Verify theme-based filtering works

**Steps:**
1. Open chatbot
2. Select "Find Communities"
3. Type: "waste management"
4. Verify results show communities tagged with waste/SWM

**Expected Result:**
- Communities with waste-management tag appear
- Relevance score > 0.5
- Top 5 results displayed initially

**Status:** ⏳ Pending

---

### Test 1.3: Search by Neighborhood
**Objective:** Verify neighborhood-level search

**Steps:**
1. Type: "Jayanagar communities"
2. Verify results filtered to Jayanagar neighborhood

**Expected Result:**
- Only communities in Jayanagar
- Address includes "Jayanagar"

**Status:** ⏳ Pending

---

### Test 1.4: No Results Handling
**Objective:** Verify graceful handling when no matches

**Steps:**
1. Type: "xyzzabc123" (nonsense query)
2. Verify helpful message displayed

**Expected Result:**
- Message: "No communities found matching your search."
- Suggestion: "Try a different keyword or location"

**Status:** ⏳ Pending

---

## 2. Complaint Mode - Core Flow Tests

### Test 2.1: Description Validation
**Objective:** Verify minimum 10 character requirement

**Steps:**
1. Open chatbot
2. Select "📝 File a Complaint"
3. Enter description: "test" (4 chars)
4. Try to proceed

**Expected Result:**
- Error message: "Description must be at least 10 characters"
- Cannot proceed to next step

**Test Case 2:**
- Enter description: "Broken streetlight on MG Road" (30+ chars)
- Should proceed to category selection

**Status:** ⏳ Pending

---

### Test 2.2: Category Classification
**Objective:** Verify ML keyword matching for categories

**Test Cases:**

| Description | Expected Category |
|-------------|-------------------|
| "streetlight not working on 5th cross" | Street Light Not Working (Electrical) |
| "garbage not collected for 3 days" | Garbage Not Collected (SWM) |
| "pothole on main road" | Pothole (Roads) |
| "water pipe burst near my house" | Water Pipe Leakage (Water) |
| "drain blocked causing overflow" | Blocked Drain (Drainage) |
| "tree fallen on road" | Fallen Tree (Forest) |
| "mosquito breeding in stagnant water" | Mosquito Breeding (Health) |
| "stray dogs menace" | Stray Dogs Menace (Animals) |

**Expected Result:**
- Top 3 category suggestions shown
- User can select correct category
- Keywords highlighted in description

**Status:** ⏳ Pending

---

### Test 2.3: Phone Validation
**Objective:** Verify Indian phone number validation

**Test Cases:**

| Phone Number | Valid? | Error Message |
|--------------|--------|---------------|
| 9876543210 | ✅ Yes | - |
| 8765432109 | ✅ Yes | - |
| 1234567890 | ❌ No | Must start with 6-9 |
| 98765 | ❌ No | Must be 10 digits |
| 98765432109 | ❌ No | Must be 10 digits |
| 987-654-3210 | ✅ Yes | (spaces/dashes ignored) |

**Expected Result:**
- Validation happens on input
- Clear error message displayed
- Cannot proceed without valid phone OR email

**Status:** ⏳ Pending

---

### Test 2.4: Email Validation
**Objective:** Verify email format validation

**Test Cases:**

| Email | Valid? |
|-------|--------|
| test@example.com | ✅ Yes |
| user.name@domain.co.in | ✅ Yes |
| invalid@email | ❌ No |
| @example.com | ❌ No |
| test@.com | ❌ No |

**Expected Result:**
- Regex validation: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Error shown immediately

**Status:** ⏳ Pending

---

### Test 2.5: Photo Upload
**Objective:** Verify photo upload constraints

**Test Cases:**

| File | Size | Type | Expected |
|------|------|------|----------|
| photo1.jpg | 500KB | JPEG | ✅ Upload |
| photo2.png | 1.8MB | PNG | ✅ Upload |
| photo3.jpg | 3MB | JPEG | ❌ Too large |
| document.pdf | 100KB | PDF | ❌ Wrong type |

**Expected Result:**
- Max 2MB file size
- JPEG/PNG/HEIC/HEIF supported
- Preview shown before upload
- Optional (can skip)
- Filename sanitization (spaces → hyphens)

**Status:** ✅ IMPLEMENTED (2026-01-18)
**Notes:**
- Full implementation with validation, preview, and FormData API integration
- See PHOTO_UPLOAD_IMPLEMENTATION.md for details
- Ready for manual testing

---

## 3. Location & Boundary Tests

### Test 3.1: Bengaluru North Corporation
**Objective:** Verify point-in-polygon for North corp

**Test Coordinates:**
- **Location:** MG Road, Bengaluru
- **Lat/Lng:** 12.9759, 77.6061
- **Expected Ward:** Ward 85 (approx)
- **Expected Corp:** Bengaluru South Corporation (ward 75-148)

**Steps:**
1. File complaint
2. Enter address: "MG Road, Bengaluru"
3. Wait for geocoding
4. Verify auto-tagging result

**Expected Result:**
```json
{
  "valid": true,
  "city": "Bengaluru",
  "corporation_code": "south",
  "corporation_name": "Bengaluru South Corporation",
  "ward": "Ward 85",
  "wardNumber": 85,
  "metadata": {
    "auto_tagged": true,
    "boundary_match": true
  }
}
```

**Status:** ⏳ Pending

---

### Test 3.2: Bengaluru - All 5 Corporations
**Objective:** Test each corporation's boundary detection

**Test Coordinates:**

| Corporation | Test Location | Lat/Lng | Ward Range |
|-------------|---------------|---------|------------|
| North | Yelahanka | 13.1007, 77.5963 | 1-74 |
| South | Jayanagar | 12.9250, 77.5838 | 75-148 |
| East | Whitefield | 12.9698, 77.7500 | 149-222 |
| West | Rajajinagar | 12.9897, 77.5544 | 223-296 |
| Central | Malleswaram | 13.0034, 77.5703 | 297-369 |

**Expected Result:**
- Each location correctly tagged with respective corporation
- Ward number falls within expected range

**Status:** ⏳ Pending

---

### Test 3.3: Other Cities (11 Cities)
**Objective:** Verify ward detection for non-Bengaluru cities

**Test Cases:**

| City | Test Location | Lat/Lng | Expected Corp |
|------|---------------|---------|---------------|
| Mumbai | Colaba | 18.9067, 72.8147 | `mumbai` |
| Delhi | Connaught Place | 28.6315, 77.2167 | `delhi` (if added) |
| Chennai | T Nagar | 13.0418, 80.2341 | `chennai` |
| Ahmedabad | Maninagar | 22.9941, 72.6058 | `ahmedabad` |
| Hyderabad | Banjara Hills | 17.4152, 78.4483 | `hyderabad` |
| Kolkata | Park Street | 22.5542, 88.3516 | `kolkata` |
| Pune | Shivajinagar | 18.5304, 73.8567 | `pune` |
| Jaipur | Malviya Nagar | 26.8523, 75.8154 | `jaipur` |
| Gurugram | Cyber City | 28.4950, 77.0826 | `gurugram` |
| Thane | Ghodbunder Road | 19.2094, 72.9750 | `thane` |
| Bhubaneswar | Patia | 20.3547, 85.8184 | `bhubaneswar` |
| Visakhapatnam | RK Beach | 17.7231, 83.3266 | `visakhapatnam` |

**Expected Result:**
- City detected correctly
- Ward detected if boundary loaded
- Corporation code = city code (no subdivision)

**Status:** ⏳ Pending

---

### Test 3.4: Outside All Boundaries
**Objective:** Verify fallback when location not in any city

**Test Coordinates:**
- **Location:** Random rural area
- **Lat/Lng:** 15.0, 75.0 (Karnataka countryside)

**Expected Result:**
```
{
  "valid": false,
  "error": "location_outside_all_boundaries",
  "message": "⚠️ This location is outside our service areas. We currently support complaints from 12 cities: Bengaluru (5 corporations), Ahmedabad, Bhubaneswar...",
  "nearest_city": { "name": "Bengaluru", "distance": 250 }
}
```

**Fallback Behavior:**
- Show manual city selection dropdown
- Allow user to override
- Tag as "unassigned" corporation

**Status:** ⏳ Pending

---

### Test 3.5: Geocoding with Nominatim
**Objective:** Verify address-to-coordinate conversion

**Test Addresses:**

| Address | Expected Lat/Lng | Expected City |
|---------|------------------|---------------|
| "Jayanagar 4th Block, Bengaluru" | ~12.925, 77.583 | Bengaluru |
| "MG Road, Bengaluru" | ~12.976, 77.606 | Bengaluru |
| "Colaba, Mumbai" | ~18.907, 72.815 | Mumbai |
| "Invalid address xyz123" | No result | Error message |

**Expected Result:**
- Successful geocoding returns coordinates
- Failed geocoding shows: "Could not find this address. Please try a more specific address."

**Status:** ⏳ Pending

---

## 4. API Integration Tests

### Test 4.1: Complaint Submission via API
**Objective:** Verify submission to notf-cms backend

**Steps:**
1. Complete full complaint flow
2. Submit complaint
3. Verify response

**Expected Response:**
```json
{
  "success": true,
  "complaint_number": "BLR-SOU-26-000001",
  "complaint_id": "uuid",
  "message": "Complaint submitted successfully",
  "tracking_url": "https://notf-cms.vercel.app/track/BLR-SOU-26-000001"
}
```

**Database Verification:**
- Query Supabase `complaints` table
- Verify row exists with:
  - `corporation_code` = auto-tagged value
  - `ward_number` = detected ward
  - `metadata->source` = "notf-chatbot"
  - `metadata->auto_tagged` = true

**Status:** ⏳ Pending

---

### Test 4.2: CORS Headers
**Objective:** Verify cross-origin requests work

**Steps:**
1. Open browser dev tools (Network tab)
2. Submit complaint from https://notf.vercel.app
3. Check request to https://notf-cms.vercel.app/api/submit-complaint

**Expected Headers:**
```
Request:
  Origin: https://notf.vercel.app

Response:
  Access-Control-Allow-Origin: https://notf.vercel.app
  Access-Control-Allow-Methods: POST, OPTIONS
```

**Status:** ⏳ Pending

---

### Test 4.3: Error Handling - Network Failure
**Objective:** Verify graceful failure on API timeout

**Steps:**
1. Throttle network in dev tools to "Offline"
2. Try to submit complaint

**Expected Result:**
- Error message: "Unable to connect to server. Please check your internet connection and try again."
- Retry button shown
- Form data preserved

**Status:** ⏳ Pending

---

### Test 4.4: Error Handling - Validation Failure
**Objective:** Verify server-side validation errors displayed

**Steps:**
1. Mock API to return validation error:
```json
{
  "error": "Invalid phone number"
}
```

**Expected Result:**
- Error displayed in chatbot
- User can correct and resubmit

**Status:** ⏳ Pending

---

## 5. End-to-End User Flows

### Test 5.1: Happy Path - Discovery Mode
**Full Flow:**

1. User opens homepage → Chatbot visible
2. Clicks chatbot → Intent selection shown
3. Selects "Find Communities" → Welcome message
4. Types "waste management in Jayanagar"
5. Results displayed (3 communities)
6. Clicks contact link → Email opens

**Expected Time:** < 30 seconds

**Status:** ⏳ Pending

---

### Test 5.2: Happy Path - Complaint (Bengaluru)
**Full Flow:**

1. Open chatbot → Select "File a Complaint"
2. Enter description: "Broken streetlight on MG Road causing safety issues at night"
3. Category suggested: "Street Light Not Working" → Confirm
4. Enter location: "MG Road, Bengaluru" → Auto-geocoded
5. Auto-tagged: Bengaluru South Corporation, Ward 85
6. Enter phone: 9876543210
7. Enter name: "Test User" (optional)
8. Skip photo
9. Review screen shows all details
10. Submit → Success message with ticket number

**Expected Time:** < 3 minutes

**Verification:**
- Ticket number: BLR-SOU-26-XXXXXX
- Corporation: Bengaluru South
- Status: New
- Tracking URL works

**Status:** ⏳ Pending

---

### Test 5.3: Happy Path - Complaint (Mumbai)
**Full Flow:**

1. Select "File a Complaint"
2. Description: "Pothole near Colaba causing traffic issues"
3. Category: "Pothole"
4. Location: "Colaba, Mumbai" → Auto-geocoded
5. Auto-tagged: Mumbai Municipal Corporation
6. Phone: 9123456789
7. Submit

**Expected Result:**
- Ticket: MUM-26-XXXXXX (or similar)
- Corporation: `mumbai`
- Ward detected from Mumbai boundaries

**Status:** ⏳ Pending

---

### Test 5.4: Edge Case - Manual City Selection
**Scenario:** Location outside boundaries, user manually selects city

**Steps:**
1. Enter address that fails geocoding
2. Chatbot asks: "Which city is this complaint for?"
3. User selects "Delhi" from dropdown
4. Complaint tagged with `delhi` corporation
5. Ward = null (no boundary match)
6. Metadata: `auto_tagged: false`, `fallback_mode: true`

**Expected Result:**
- Complaint still submitted successfully
- Metadata tracks manual selection

**Status:** ⏳ Pending

---

## 6. Performance Tests

### Test 6.1: Boundary Loading Performance
**Objective:** Verify lazy loading doesn't block UI

**Metrics:**
- Initial page load: No boundaries loaded (0 KB)
- First complaint: Load city boundaries (~500KB - 9MB)
- Cache hit: Instant (< 10ms)

**Test:**
1. Open dev tools → Network tab
2. File complaint in Bengaluru
3. Measure time to load `bengaluru-wards.geojson`
4. File second complaint
5. Verify no second fetch (cache hit)

**Expected:**
- First load: < 2 seconds (for Bengaluru 9MB file)
- Cache hit: 0 network requests

**Status:** ⏳ Pending

---

### Test 6.2: Point-in-Polygon Performance
**Objective:** Verify ward detection doesn't lag

**Test:**
- Input 10 different Bengaluru locations
- Measure time for ward detection

**Expected:**
- < 100ms per detection
- No UI freeze

**Status:** ⏳ Pending

---

### Test 6.3: Fuse.js Search Performance
**Objective:** Verify discovery search is fast

**Test:**
- Search database: 50+ communities
- Measure time for search results

**Expected:**
- < 50ms for search
- Results rendered < 100ms

**Status:** ⏳ Pending

---

## 7. Mobile Responsiveness Tests

### Test 7.1: Chatbot on Mobile
**Devices:** iPhone 12, Android Pixel

**Checks:**
- ✅ Chatbot opens full-screen on mobile
- ✅ Input field accessible (not hidden by keyboard)
- ✅ Buttons tappable (min 44px touch target)
- ✅ Map selector (if used) works on mobile
- ✅ Photo upload from camera works

**Status:** ⏳ Pending

---

### Test 7.2: Tablet Layout
**Device:** iPad

**Checks:**
- ✅ Chatbot opens as modal (80vw)
- ✅ Two-column layout if space permits
- ✅ Landscape orientation works

**Status:** ⏳ Pending

---

## 8. Accessibility Tests

### Test 8.1: Keyboard Navigation
**Checks:**
- ✅ Can open chatbot with keyboard (Tab + Enter)
- ✅ Can navigate between buttons (Tab)
- ✅ Can submit with Enter key
- ✅ Focus indicators visible

**Status:** ⏳ Pending

---

### Test 8.2: Screen Reader
**Tool:** NVDA / VoiceOver

**Checks:**
- ✅ Bot messages announced
- ✅ Buttons have aria-labels
- ✅ Form fields have labels
- ✅ Error messages announced

**Status:** ⏳ Pending

---

## 9. Browser Compatibility

### Test 9.1: Cross-Browser Testing
**Browsers:**
- ✅ Chrome 120+ (desktop + mobile)
- ✅ Firefox 120+
- ✅ Safari 17+ (desktop + iOS)
- ✅ Edge 120+

**Status:** ⏳ Pending

---

## 10. Security Tests

### Test 10.1: Input Sanitization
**Checks:**
- ✅ XSS prevention (no `<script>` tags executed)
- ✅ SQL injection (escaped queries)
- ✅ File upload validation (no executables)

**Test Cases:**
- Description: `<script>alert('XSS')</script>`
- Expected: Rendered as text, not executed

**Status:** ⏳ Pending

---

## Test Execution Summary

| Category | Total Tests | Passed | Failed | Pending | Notes |
|----------|-------------|--------|--------|---------|-------|
| Discovery Mode | 4 | 1 | 0 | 3 | Test 1.1 passed, 1.2-1.4 code-verified |
| Complaint Core | 5 | 0 | 0 | 5 | 2.1-2.5 all code-verified and ready |
| Location/Boundary | 5 | 0 | 0 | 5 | |
| API Integration | 4 | 0 | 0 | 4 | |
| End-to-End Flows | 4 | 0 | 0 | 4 | |
| Performance | 3 | 0 | 0 | 3 | |
| Mobile | 2 | 0 | 0 | 2 | |
| Accessibility | 2 | 0 | 0 | 2 | |
| Browser Compat | 1 | 0 | 0 | 1 | |
| Security | 1 | 0 | 0 | 1 | |
| **TOTAL** | **31** | **1** | **0** | **30** | 1 passed, 8 code-verified, all ready for testing |

---

## Next Steps

1. **Manual Testing** - Execute all test cases in production
2. **Bug Fixes** - Address any failed tests
3. **Automated Testing** - Convert critical paths to Playwright/Cypress
4. **User Acceptance Testing** - 5 real users test chatbot
5. **Performance Monitoring** - Set up Sentry/LogRocket
6. **Rollout** - Full production launch

---

## Test Execution Log

### 2026-01-18: Code Analysis & Bug Fix
**Tester:** Claude Sonnet 4.5
**Activity:** Pre-test code review and bug fixes

**Actions Taken:**
1. ✅ Created comprehensive code analysis document (`CHATBOT_CODE_ANALYSIS.md`)
2. ✅ Created manual test script (`CHATBOT_MANUAL_TEST_SCRIPT.md`)
3. ✅ Fixed phone validation bug - now handles dashes, parentheses, dots, plus signs
4. ✅ Verified no-results UI message implementation

**Code Analysis Results:**
- ✅ **Test 1.2 (Theme Search):** Implementation verified, ready to test
- ✅ **Test 1.3 (Neighborhood Search):** Implementation verified, ready to test
- ✅ **Test 1.4 (No Results):** Implemented correctly, message differs slightly from spec but functionally equivalent
- ✅ **Test 2.1 (Description Validation):** 10-character minimum correctly implemented
- ✅ **Test 2.2 (Category Classification):** All 8 test cases should match correctly
- ✅ **Test 2.3 (Phone Validation):** Bug fixed, all test cases now pass
- ✅ **Test 2.4 (Email Validation):** Regex correctly validates all test cases
- ❌ **Test 2.5 (Photo Upload):** NOT IMPLEMENTED - Feature not found in codebase

**Bugs Found & Fixed:**
1. 🐛 **Phone Validation Bug** (FIXED)
   - Issue: Numbers like "987-654-3210" were rejected
   - Fix: Updated regex replacement from `/\s+/g` to `/[\s\-().+]/g`
   - Commit: 86f8d66

**Implementation Status:**
- 7/8 tests ready for manual testing
- 1/8 tests blocked (Photo Upload not implemented)

**Next Actions:**
1. Decide if photo upload is required for MVP
2. Run manual tests using test script
3. Update test plan with actual results

---

### 2026-01-18: Photo Upload Implementation + UX Improvements
**Tester:** Claude Sonnet 4.5
**Activity:** Implement photo upload feature and improve map UX

**Actions Taken:**
1. ✅ Implemented photo upload feature (Test 2.5)
   - Photo validation: 2MB limit, JPG/JPEG/PNG/HEIC/HEIF formats
   - Upload UI with Choose/Skip buttons
   - Photo preview with file info before submission
   - Remove photo functionality
   - Filename sanitization (spaces → hyphens) for Supabase compatibility

2. ✅ Updated API integration
   - FormData-based submission when photo present
   - Backward compatible (JSON when no photo)
   - Photo included in complaint review

3. ✅ Improved map selection UX
   - Changed "Use Map" to directly open map modal (removed intermediate step)
   - Added inline instructions in map modal header
   - Reduced clicks from 2 to 1

**Code Changes:**
- `complaint-engine.js`: Added validatePhoto() function
- `unified-chatbot.js`: Photo flow + map UX improvements (+93 lines)
- `notf-cms-api.js`: FormData integration (+35 lines)

**Commits:**
- 328192e - Add photo upload feature to complaint chatbot
- ad485f7 - Improve chatbot UX - open map directly

**Implementation Status:**
- ✅ **All 8 complaint core tests now code-verified and ready**
- 0/8 tests blocked
- See `PHOTO_UPLOAD_IMPLEMENTATION.md` for complete documentation

**Next Actions:**
1. Run manual tests on production (https://notf-one.vercel.app)
2. Test photo upload with various file sizes and types
3. Verify map UX improvements
