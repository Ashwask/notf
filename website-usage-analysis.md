# NOTF Website Usage Analysis

## ✅ ACTIVE HTML Pages (Keep)

### Public Pages
- `/index.html` - Homepage ✅ KEEP
- `/communities/index.html` - Community directory ✅ KEEP
- `/solution-providers/index.html` - Provider directory ✅ KEEP
- `/map/index.html` - Interactive map ✅ KEEP
- `/join/index.html` - Join form ✅ KEEP
- `/search/index.html` - Search page ✅ KEEP

### Admin Pages
- `/admin/login.html` - Admin login ✅ KEEP (referenced from main nav)
- `/admin/index.html` - Main admin dashboard ✅ KEEP (consolidated single-page app)
- `/admin/communities.html` - Community CRUD ✅ KEEP (loaded in iframe)
- `/admin/organizations.html` - Provider CRUD ✅ KEEP (loaded in iframe)
- `/admin/matcher.html` - Matcher feature ✅ KEEP (loaded in iframe from dashboard)
- `/admin/geocode-tool.html` - Geocoding tool ✅ KEEP (loaded in iframe from dashboard)

---

## 🗑️ UNUSED/REDIRECT Pages (Delete)

### Admin Pages
- `/admin/dashboard.html` ❌ DELETE - Just redirects to index.html

### Public Pages
- `/members/index.html` ❌ DELETE - Empty "Coming Soon" placeholder, not linked in nav

---

## 📜 JavaScript Files Analysis

### ✅ KEEP - Actively Used
- `/assets/admin/auth.js` - Authentication utilities ✅ KEEP
- `/assets/admin/communities.js` - Community CRUD logic ✅ KEEP
- `/assets/admin/organizations.js` - Provider CRUD logic ✅ KEEP
- `/assets/js/data-loader.js` - Check if used
- `/assets/js/join-form.js` - Join form logic ✅ KEEP
- `/assets/js/consolidated-app.js` - Main app logic ✅ KEEP

### ❌ DELETE - Not Referenced
- `website/load-data-supabase.js` ❌ DELETE - Not referenced anywhere

---

## 🔍 Data Directories Analysis

### ✅ KEEP - Active Features
- `data/communities/` - Community markdown files ✅ KEEP (66 files)
- `data/solution-providers/` - Provider YAML files ✅ KEEP (55 files)

### ❓ QUESTIONABLE - Need User Decision
- `data/asks-offers/` - 4 files (2 asks, 2 offers, templates)
  - Question: Is asks/offers feature still active?
  - Referenced in: matcher.html, match_asks_offers.py

- `data/docs/` - 2 files (CONTRIBUTING.md, GOVERNANCE.md)
  - Question: Keep for community guidelines?

---

## 📦 Supabase Functions

### ✅ DEPLOYED & ACTIVE
- `supabase/functions/update-file/` ✅ KEEP - Storage-first CRUD (deployed)

### ❓ QUESTIONABLE
- `supabase/functions/trigger-vercel-deploy/`
  - Question: Is this deployed or used?

---

## 🛠️ Scripts Analysis

### ✅ KEEP - Utility Scripts (Still Useful)
- `scripts/add-coordinates-to-markdown.py` ✅ KEEP - May need again
- `scripts/geocode-communities.py` ✅ KEEP - Geocoding utility
- `scripts/check-community-locations.py` ✅ KEEP - Location verification
- `scripts/assign-wards-from-kml.py` ✅ KEEP - Ward assignment
- `scripts/sync-to-supabase.py` ✅ KEEP - Sync local → Storage
- `scripts/upload-to-supabase.py` ✅ KEEP - Upload to Storage
- `download-from-storage.sh` ✅ KEEP - Download from Storage (workaround for Dashboard cache)

### ❓ QUESTIONABLE - Need User Decision
- `scripts/match_asks_offers.py` - Related to asks/offers feature
- `scripts/weekly_digest.py` - Is this automated?
- `scripts/validate_data.py` - Useful for CI/CD?
- `scripts/test-geocoding.py` - One-time test or ongoing?

### ❌ DELETE - Duplicates/Unused
- `scripts/upload-to-supabase.sh` - Duplicate of .py version?

---

## Summary

### Can Delete Immediately (5 files)
1. `/admin/dashboard.html` - Just a redirect
2. `/members/index.html` - Empty placeholder
3. `website/load-data-supabase.js` - Not referenced
4. `scripts/upload-to-supabase.sh` - Duplicate

### Need User Decision (8 items)
1. `data/asks-offers/` directory - Is feature active?
2. `data/docs/` directory - Keep guidelines?
3. `supabase/functions/trigger-vercel-deploy/` - Deployed?
4. `scripts/match_asks_offers.py` - Still needed?
5. `scripts/weekly_digest.py` - Automated?
6. `scripts/validate_data.py` - Keep for testing?
7. `scripts/test-geocoding.py` - Still needed?
