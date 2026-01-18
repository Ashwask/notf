# NOTF Chatbot Manual Testing Script

**Date:** 2026-01-18
**Production URL:** https://notf-one.vercel.app
**Tester:** _____________________

---

## Pre-Test Setup

1. Open the production site: https://notf-one.vercel.app
2. Open browser DevTools (F12)
   - Console tab: Monitor for errors
   - Network tab: Monitor API calls
3. Clear browser cache and localStorage
4. Test in Chrome (primary), then Firefox/Safari

---

## Discovery Mode Tests

### Test 1.2: Search by Theme (Waste Management)

**Objective:** Verify theme-based filtering works

**Steps:**
1. Click chatbot FAB (bottom-right corner)
2. Select "🔍 Find Communities/Resources"
3. Type in input: `waste management`
4. Press Enter or click Send

**Expected Results:**
- ✅ Results show communities with "waste" or "SWM" themes
- ✅ Community cards display: Name, Location, Theme tags
- ✅ At least 1-5 results displayed
- ✅ No JavaScript errors in console

**Actual Results:**
- Results count: _____
- Top result name: _____________________
- Themes shown: _____________________
- Pass/Fail: [ ] PASS [ ] FAIL

**Issues Found:**
_________________________________

---

### Test 1.3: Search by Neighborhood (Jayanagar)

**Objective:** Verify neighborhood-level search

**Steps:**
1. In discovery mode, type: `Jayanagar communities`
2. Press Enter

**Expected Results:**
- ✅ Results filtered to Jayanagar neighborhood only
- ✅ Each result shows "Jayanagar" in location or neighborhood field
- ✅ Match score > 0.5 for relevant results

**Actual Results:**
- Results count: _____
- Top result: _____________________
- Location shown: _____________________
- Pass/Fail: [ ] PASS [ ] FAIL

**Issues Found:**
_________________________________

---

### Test 1.4: No Results Handling

**Objective:** Verify graceful handling when no matches

**Steps:**
1. In discovery mode, type: `xyzzabc123randomtext`
2. Press Enter

**Expected Results:**
- ✅ Message displayed: "No communities found matching your search."
- ✅ Suggestion shown: "Try a different keyword or location"
- ✅ No JavaScript errors
- ✅ User can try a new search

**Actual Results:**
- Message shown: _____________________
- Pass/Fail: [ ] PASS [ ] FAIL

**Issues Found:**
_________________________________

---

## Complaint Mode Tests

### Test 2.1: Description Validation

**Objective:** Verify minimum 10 character requirement

**Steps:**
1. Click chatbot
2. Select "📝 File a Complaint"
3. **Sub-test A:** Type "test" (4 chars) → Try to proceed
4. **Sub-test B:** Type "Broken streetlight on MG Road" (30+ chars) → Try to proceed

**Expected Results:**

**Sub-test A (4 chars):**
- ✅ Error message: "Description must be at least 10 characters"
- ✅ Cannot proceed to next step
- ✅ Input field highlighted or shows error

**Sub-test B (30+ chars):**
- ✅ No error message
- ✅ Proceeds to category selection
- ✅ Description saved in form data

**Actual Results:**

Sub-test A:
- Error shown: _____________________
- Pass/Fail: [ ] PASS [ ] FAIL

Sub-test B:
- Proceeded: [ ] YES [ ] NO
- Next step: _____________________
- Pass/Fail: [ ] PASS [ ] FAIL

**Issues Found:**
_________________________________

---

### Test 2.2: Category Classification

**Objective:** Verify ML keyword matching for categories

**Steps:**
Test each description below and verify the suggested category:

| # | Description | Expected Category | Suggested? | Pass/Fail |
|---|-------------|-------------------|------------|-----------|
| 1 | "streetlight not working on 5th cross" | Street Light Not Working | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |
| 2 | "garbage not collected for 3 days" | Garbage Not Collected | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |
| 3 | "pothole on main road" | Pothole | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |
| 4 | "water pipe burst near my house" | Water Pipe Leakage | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |
| 5 | "drain blocked causing overflow" | Blocked Drain | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |
| 6 | "tree fallen on road" | Fallen Tree | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |
| 7 | "mosquito breeding in stagnant water" | Mosquito Breeding | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |
| 8 | "stray dogs menace" | Stray Dogs Menace | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |

**Expected Results:**
- ✅ Top 3 category suggestions shown
- ✅ User can select correct category
- ✅ Keywords highlighted in description (optional)

**Overall Pass/Fail:** [ ] PASS [ ] FAIL

**Issues Found:**
_________________________________

---

### Test 2.3: Phone Validation

**Objective:** Verify Indian phone number validation

**Steps:**
Test each phone number and verify validation:

| Phone Number | Valid? | Expected Error | Actual Result | Pass/Fail |
|--------------|--------|----------------|---------------|-----------|
| 9876543210 | ✅ YES | None | _________________ | [ ] ✅ [ ] ❌ |
| 8765432109 | ✅ YES | None | _________________ | [ ] ✅ [ ] ❌ |
| 1234567890 | ❌ NO | Must start with 6-9 | _________________ | [ ] ✅ [ ] ❌ |
| 98765 | ❌ NO | Must be 10 digits | _________________ | [ ] ✅ [ ] ❌ |
| 98765432109 | ❌ NO | Must be 10 digits | _________________ | [ ] ✅ [ ] ❌ |
| 987-654-3210 | ✅ YES | None (dashes ignored) | _________________ | [ ] ✅ [ ] ❌ |

**Expected Results:**
- ✅ Validation happens on input or submit
- ✅ Clear error message displayed for invalid numbers
- ✅ Cannot proceed without valid phone OR email

**Overall Pass/Fail:** [ ] PASS [ ] FAIL

**Issues Found:**
_________________________________

---

### Test 2.4: Email Validation

**Objective:** Verify email format validation

**Steps:**
Test each email and verify validation:

| Email | Valid? | Accepted? | Pass/Fail |
|-------|--------|-----------|-----------|
| test@example.com | ✅ YES | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |
| user.name@domain.co.in | ✅ YES | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |
| invalid@email | ❌ NO | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |
| @example.com | ❌ NO | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |
| test@.com | ❌ NO | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |

**Expected Results:**
- ✅ Regex validation: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- ✅ Error shown immediately or on submit
- ✅ User must provide valid email OR valid phone

**Overall Pass/Fail:** [ ] PASS [ ] FAIL

**Issues Found:**
_________________________________

---

### Test 2.5: Photo Upload

**Objective:** Verify photo upload constraints

**Steps:**
1. Proceed to photo upload step in complaint flow
2. Test each file upload scenario:

| File | Size | Type | Should Accept? | Accepted? | Pass/Fail |
|------|------|------|----------------|-----------|-----------|
| photo1.jpg | 500KB | JPEG | ✅ YES | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |
| photo2.png | 1.8MB | PNG | ✅ YES | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |
| photo3.jpg | 3MB | JPEG | ❌ NO (too large) | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |
| document.pdf | 100KB | PDF | ❌ NO (wrong type) | [ ] YES [ ] NO | [ ] ✅ [ ] ❌ |

**Expected Results:**
- ✅ Max 2MB file size enforced
- ✅ JPEG/PNG only (no PDF, GIF, etc.)
- ✅ Preview shown before upload
- ✅ Upload is optional (can skip)
- ✅ Error message for oversized files
- ✅ Error message for wrong file types

**Overall Pass/Fail:** [ ] PASS [ ] FAIL

**Issues Found:**
_________________________________

---

## DevTools Checks

### Console Errors
**Any JavaScript errors during testing?**
- [ ] NO ERRORS (Pass)
- [ ] ERRORS FOUND (list below):

Errors:
_________________________________
_________________________________

### Network Requests
**API calls successful?**
- [ ] All requests returned 200 OK
- [ ] Some requests failed (list below):

Failed requests:
_________________________________

### Performance
**Page load and responsiveness:**
- Discovery search response time: _____ ms
- Complaint submission time: _____ ms
- Any UI lag or freezing? [ ] YES [ ] NO

---

## Browser Compatibility

Test the same flows in:

| Browser | Version | Discovery Works? | Complaint Works? | Issues |
|---------|---------|------------------|------------------|--------|
| Chrome | _____ | [ ] YES [ ] NO | [ ] YES [ ] NO | _________________ |
| Firefox | _____ | [ ] YES [ ] NO | [ ] YES [ ] NO | _________________ |
| Safari | _____ | [ ] YES [ ] NO | [ ] YES [ ] NO | _________________ |
| Edge | _____ | [ ] YES [ ] NO | [ ] YES [ ] NO | _________________ |

---

## Summary

**Total Tests:** 8
**Passed:** _____
**Failed:** _____
**Pass Rate:** _____%

**Critical Issues:**
_________________________________
_________________________________

**Recommendations:**
_________________________________
_________________________________

**Sign-off:**
Tester: _____________________ Date: _____________________
