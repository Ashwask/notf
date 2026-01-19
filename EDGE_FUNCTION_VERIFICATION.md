# Edge Function Verification & Testing Guide

## 🔴 CRITICAL: Problems From Last Time

### Issue #1: JWT Verification Error
**Problem:** Edge Functions returned "Invalid JWT" errors when called from admin interface

**Root Cause:** By default, Supabase Edge Functions verify JWT tokens using the service role key, but admin interface sends JWT tokens signed with the anon key.

**Solution:** Create `config.toml` file in each function directory with:
```toml
# Disable JWT verification to allow the function to handle auth internally
verify_jwt = false
```

**Files Needed:**
- ✅ `/supabase/functions/update-file/config.toml` (already exists)
- ✅ `/supabase/functions/delete-file/config.toml` (already exists)
- ✅ `/supabase/functions/sync-storage-to-db/config.toml` (just created)

### Issue #2: Two Supabase Clients Required
**Problem:** Can't use service role key to validate user JWTs

**Solution:** Edge Functions need TWO Supabase clients:
1. **supabaseAnon** - For validating user JWT tokens (uses anon key)
2. **supabaseAdmin** - For database operations (uses service role key)

**Implementation:** Already done in update-file/index.ts:
```typescript
// Client with anon key for user JWT validation
const supabaseAnon = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    global: {
      headers: {
        Authorization: req.headers.get('Authorization') ?? ''
      }
    }
  }
)

// Client with service role for database operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)
```

### Issue #3: Missing Environment Variables
**Problem:** Functions need both ANON_KEY and SERVICE_ROLE_KEY but only SERVICE_ROLE_KEY is available by default

**Solution:** Manually add SUPABASE_ANON_KEY to Edge Function secrets

---

## ✅ Pre-Deployment Checklist

### 1. Verify config.toml Files Exist
```bash
cd /Users/sathya/Documents/GitHub/notf/supabase/functions

# Check all config.toml files exist
ls -l */config.toml

# Should show:
# delete-file/config.toml
# sync-storage-to-db/config.toml
# update-file/config.toml
```

### 2. Verify Environment Variables in Supabase Dashboard

**Go to:** Supabase Dashboard → Project Settings → Edge Functions → Secrets

**Required secrets:**
- ✅ `SUPABASE_URL` (auto-set by Supabase)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (auto-set by Supabase)
- ⚠️ `SUPABASE_ANON_KEY` (MUST BE ADDED MANUALLY)

**How to add SUPABASE_ANON_KEY:**
```bash
# Get your anon key from Supabase Dashboard → Project Settings → API
# Then add it:
supabase secrets set SUPABASE_ANON_KEY=your-anon-key-here
```

Or via dashboard:
1. Go to Project Settings → API
2. Copy "anon" / "public" key
3. Go to Edge Functions → Secrets
4. Click "New Secret"
5. Name: `SUPABASE_ANON_KEY`
6. Value: paste the key

### 3. Check Supabase CLI is Logged In
```bash
# Check if logged in
supabase status

# If not logged in:
supabase login

# Link to project
cd /Users/sathya/Documents/GitHub/notf/supabase
supabase link --project-ref abblyaukkoxmgzwretvm
```

---

## 🚀 Deployment Steps

### Step 1: Deploy Edge Functions
```bash
cd /Users/sathya/Documents/GitHub/notf/supabase

# Deploy updated update-file function
supabase functions deploy update-file

# Deploy new sync script
supabase functions deploy sync-storage-to-db

# Verify deployment
supabase functions list
```

**Expected output:**
```
┌──────────────────────┬──────────┬─────────────────────────────┐
│ NAME                 │ VERSION  │ CREATED AT                  │
├──────────────────────┼──────────┼─────────────────────────────┤
│ update-file          │ vX       │ 2026-01-19 ...              │
│ delete-file          │ vX       │ 2026-01-18 ...              │
│ sync-storage-to-db   │ v1       │ 2026-01-19 ...              │
└──────────────────────┴──────────┴─────────────────────────────┘
```

### Step 2: Test Health Checks
```bash
# Test update-file health check
curl https://abblyaukkoxmgzwretvm.supabase.co/functions/v1/update-file

# Expected response:
# {"status":"ok","version":"3.0-auth-optional","timestamp":"2026-01-19T..."}

# Test sync-storage-to-db health check
curl https://abblyaukkoxmgzwretvm.supabase.co/functions/v1/sync-storage-to-db

# Expected response (should be OK or similar)
```

---

## 🧪 Verification Steps

### Test 1: Verify update-file Function Works

**Test A: Simple Status Update (via cURL)**
```bash
# Get your anon key from Supabase Dashboard → Project Settings → API
export ANON_KEY="your-anon-key-here"
export FUNCTION_URL="https://abblyaukkoxmgzwretvm.supabase.co/functions/v1/update-file"

# Test with a simple status update (won't actually change anything if file doesn't exist)
curl -X POST $FUNCTION_URL \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "communities/test-verification.md",
    "file_type": "community",
    "updates": {
      "name": "Test Community",
      "city": "Bengaluru",
      "status": "pending"
    }
  }'
```

**Expected:** Success response with file_path, slug, version

**Test B: Edit Real Community via Admin UI**
1. Go to `/admin/communities.html`
2. Click edit on any community (e.g., "CIFOS")
3. Change city from "bengaluru" to "Bengaluru" (fix casing)
4. Add a neighborhood: "Malleshwaram"
5. Click Save

**What to verify:**
- ✅ No console errors in browser
- ✅ Success message shows
- ✅ List refreshes with updated data

### Test 2: Verify MD/YAML File Updated

**Check Storage:**
1. Go to Supabase Dashboard → Storage → notf bucket
2. Navigate to `communities/` folder
3. Find the file you edited (e.g., `cifos.md`)
4. Download and open it
5. Verify:
   - ✅ `city: Bengaluru` (proper casing)
   - ✅ `neighborhoods:` array includes "Malleshwaram"
   - ✅ `last_updated:` is today's date
   - ✅ `version:` incremented

**Via cURL:**
```bash
# Download the file
curl "https://abblyaukkoxmgzwretvm.supabase.co/storage/v1/object/public/notf/communities/cifos.md" \
  -o /tmp/cifos.md

# Check content
cat /tmp/cifos.md | head -30
```

### Test 3: Verify Database Updated

**Via Supabase Dashboard:**
1. Go to Table Editor → file_metadata
2. Find the row with `slug = 'cifos'`
3. Verify columns:
   - ✅ `city` = "Bengaluru" (matches MD)
   - ✅ `neighborhood` = "Malleshwaram" (first from array)
   - ✅ `name` = "CIFOS" (from metadata)
   - ✅ `metadata` JSONB contains all fields
   - ✅ `updated_at` is recent timestamp

**Via SQL:**
```sql
-- Check the record
SELECT
  slug,
  city,
  neighborhood,
  name,
  metadata->>'city' as metadata_city,
  metadata->>'neighborhoods' as metadata_neighborhoods,
  updated_at
FROM file_metadata
WHERE slug = 'cifos';
```

### Test 4: Run Sync Script (Dry Run First)

**Dry run to preview changes:**
```bash
export ANON_KEY="your-anon-key-here"
export SYNC_URL="https://abblyaukkoxmgzwretvm.supabase.co/functions/v1/sync-storage-to-db"

# Test with dry run (no changes made)
curl -X POST $SYNC_URL \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": true}'
```

**Expected response:**
```json
{
  "success": true,
  "dry_run": true,
  "results": {
    "processed": 50,
    "updated": 0,
    "created": 0,
    "errors": [],
    "files": [
      {"path": "communities/cifos.md", "status": "synced", "action": "updated"},
      ...
    ]
  },
  "message": "Dry run complete - no changes made"
}
```

**Actual sync (updates database):**
```bash
# Run actual sync for communities only
curl -X POST $SYNC_URL \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": false, "file_type": "community"}'
```

**What to check:**
- ✅ `results.processed` > 0 (files were processed)
- ✅ `results.errors` is empty or minimal
- ✅ No 500 errors returned

### Test 5: Verify Sync Fixed Database

**Check a few random communities:**
```sql
-- Check if city is now synced properly
SELECT
  slug,
  city,
  metadata->>'city' as metadata_city,
  CASE
    WHEN city = (metadata->>'city') THEN '✓ Match'
    ELSE '✗ Mismatch'
  END as sync_status
FROM file_metadata
WHERE file_type = 'community'
LIMIT 10;
```

**Expected:** All rows show "✓ Match"

### Test 6: Edit Another Community (End-to-End Test)

1. Go to `/admin/communities.html`
2. Click edit on a different community
3. Make multiple changes:
   - Update city
   - Add/remove neighborhoods
   - Change contact email
   - Update description
4. Save

5. Verify in THREE places:
   - ✅ **Admin UI:** Changes appear immediately in list
   - ✅ **Storage:** Download MD file, verify all changes present
   - ✅ **Database:** Check file_metadata table, verify columns synced

---

## 🔍 Troubleshooting

### Error: "Invalid JWT"

**Cause:** `config.toml` missing or `verify_jwt = false` not set

**Fix:**
```bash
cd /Users/sathya/Documents/GitHub/notf/supabase/functions

# Check config files exist
ls -l */config.toml

# If missing, create them:
echo "verify_jwt = false" > update-file/config.toml
echo "verify_jwt = false" > sync-storage-to-db/config.toml

# Redeploy
supabase functions deploy update-file
supabase functions deploy sync-storage-to-db
```

### Error: "SUPABASE_ANON_KEY is not defined"

**Cause:** Anon key not added to Edge Function secrets

**Fix:**
```bash
# Get anon key from dashboard (Project Settings → API)
supabase secrets set SUPABASE_ANON_KEY=your-anon-key-here

# Redeploy functions to pick up new secret
supabase functions deploy update-file
supabase functions deploy sync-storage-to-db
```

### Error: "Failed to upload file: Storage not found"

**Cause:** Storage bucket doesn't exist or permissions wrong

**Fix:**
1. Go to Supabase Dashboard → Storage
2. Verify "notf" bucket exists
3. Check bucket is PUBLIC (or service role has access)
4. Verify folders exist: `communities/`, `solution-providers/`

### Error: "Database update failed: column does not exist"

**Cause:** Database schema missing expected columns

**Fix:**
```sql
-- Add missing columns if needed
ALTER TABLE file_metadata
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS ward TEXT;
```

### Changes Not Appearing in Admin UI

**Possible causes:**
1. **Browser cache:** Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. **Old data in memory:** Reload the page completely
3. **Database not synced:** Run sync script again
4. **Function not deployed:** Redeploy Edge Functions

**Debug steps:**
```bash
# Check function logs
supabase functions logs update-file --follow

# Make edit in admin UI while watching logs
# Should see: "Updating file: communities/..."
```

---

## 📊 Success Criteria

After completing all verification steps, you should have:

- ✅ All three Edge Functions deployed successfully
- ✅ config.toml files in place for all functions
- ✅ SUPABASE_ANON_KEY set in Edge Function secrets
- ✅ Health checks return "ok" status
- ✅ Admin edits update BOTH MD/YAML and database
- ✅ Sync script successfully processes all files
- ✅ Database columns match metadata (city, name, etc.)
- ✅ No "Invalid JWT" errors
- ✅ No console errors in admin UI
- ✅ Changes persist across page refreshes

---

## 🎯 Final Validation

**Test the complete workflow:**

1. **Create** a new community via admin UI
2. Verify it creates MD file in Storage
3. Verify it creates DB record
4. **Edit** the community (change multiple fields)
5. Verify MD file updated in Storage
6. Verify DB record updated
7. **Run sync script** for that community
8. Verify no changes (already in sync)
9. **Manually edit** the MD file in Storage (via dashboard)
10. **Run sync script** again
11. Verify DB now reflects manual MD changes

**Result:** MD/YAML is source of truth, database stays in sync!

---

## 📚 Reference

- Edge Function URL: `https://abblyaukkoxmgzwretvm.supabase.co/functions/v1/`
- Project Ref: `abblyaukkoxmgzwretvm`
- Storage Bucket: `notf`
- Database Table: `file_metadata`

**Documentation:**
- `/supabase/functions/update-file/README.md` - Detailed Edge Function docs
- `/ARCHITECTURE.md` - Storage-first architecture
- `/STATUS.md` - Project status and deployment history
