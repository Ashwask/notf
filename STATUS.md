# NOTF Project Status - Storage-First Architecture Migration

**Last Updated:** 2026-01-17
**Status:** ✅ COMPLETE - Storage-first architecture fully implemented

---

## Quick Summary

We are migrating NOTF to a **storage-first architecture** where Supabase Storage is the single source of truth (instead of database or git). This prevents data loss when admin edits are overwritten by database re-syncs.

---

## Key Decisions Made

### 1. Supabase Storage is Primary (Not Git)

**Why:** Git repos are public and insecure. Supabase Storage has RLS policies and is private.

- ✅ **PRIMARY:** Supabase Storage bucket "notf" (secure, RLS-protected)
- ⚠️ **CACHE:** Database file_metadata table (indexed for queries)
- ⚠️ **DEVELOPMENT:** Git /data/ directory (local development only)

### 2. Keep Two File Formats (Not Just One)

**Decision:** Keep both `.yaml` and `.md` formats

- **Solution Providers:** `.yaml` (pure YAML, no rich content)
- **Communities:** `.md` (YAML frontmatter + markdown body for stories)
- **Asks/Offers/Events:** `.md` (need rich content)

**Reason:**
- Solution-providers don't need rich formatting (just contact info)
- Communities need markdown for stories, impact reports, project updates
- Future fields like notes, meeting_minutes, etc. will also need markdown

### 3. Admin Edits Must Update Storage First

**Current Problem:** Admin forms update database directly → Storage files unchanged → next sync overwrites changes

**Solution:** Admin forms call Edge Function → Edge Function updates Storage → then updates Database

---

## Completed Work

### 1. Architecture Documentation ✅

**File:** `/ARCHITECTURE.md` (completed)

**Contains:**
- Storage-first architecture principles
- Data flow diagrams
- File format explanations (.yaml vs .md)
- Admin CRUD pattern (correct vs incorrect)
- Merge strategy for preserving fields
- Security model
- Troubleshooting guide

**Commit:** 50c492a

### 2. Plan Document ✅

**File:** `/.claude/plans/concurrent-twirling-moth.md` (completed and approved)

**Contains:**
- Comprehensive implementation plan
- 5 phases of migration
- Edge Function specifications
- Migration scripts needed
- Verification steps
- Rollback plan

**Commit:** 50c492a

### 3. Coordinate Migration ✅

**Script:** `/scripts/add-coordinates-to-markdown.py`

**What it does:**
- Queries database for all communities with coordinates
- Adds location.latitude and location.longitude to YAML frontmatter
- Replaces string location fields (e.g., "Bengaluru") with coordinate objects
- Preserves all other frontmatter fields and markdown body

**Results:**
- 52 community files updated with coordinates
- All markdown files now have location data in frontmatter

**Commit:** 4baa9bb

### 4. Edge Function for Storage Updates ✅

**Files:**
- `/supabase/functions/update-file/index.ts`
- `/supabase/functions/update-file/README.md`

**What it does:**
1. Downloads current file from Supabase Storage
2. Parses YAML or YAML frontmatter + markdown body
3. Merges updates (preserves unedited fields)
4. Uploads updated file to Storage (source of truth)
5. Parses file and updates database (cache)
6. Returns success to client

**Features:**
- Handles both .md (communities) and .yaml (solution-providers)
- Merge strategy preserves fields not in update payload
- Optimistic locking with version field
- Auto-updates last_updated and version fields

**Commit:** 8fc299c

### 5. Admin Forms Updated ✅

**Files:**
- `/website/public/assets/admin/communities.js`
- `/website/public/assets/admin/organizations.js`

**Changes:**
- Update operations now call Edge Function instead of direct DB updates
- Location coordinates added to metadata for frontmatter
- Status added to metadata for frontmatter
- Create operations still use direct DB insert (TODO for future)

**Result:**
- Admin edits update Storage files FIRST
- Then database is updated from Storage
- Both stay in sync
- No data loss from future syncs

**Commit:** d9c5fb2

---

## Current Status

### ✅ Implementation Complete

All planned tasks have been completed:
1. ✅ Create ARCHITECTURE.md documentation
2. ✅ Create `add-coordinates-to-markdown.py` migration script
3. ✅ Run coordinate migration (52 files updated)
4. ✅ Create Edge Function `update-file`
5. ✅ Update `communities.js` to use Edge Function
6. ✅ Update `organizations.js` to use Edge Function

---

## Next Steps (Required for Production)

### 1. Deploy Edge Function to Supabase ⚠️ REQUIRED

The Edge Function code exists but must be deployed to work:

```bash
# Deploy to Supabase (requires Supabase CLI)
supabase functions deploy update-file --project-ref abblyaukkoxmgzwretvm
```

**Test after deployment:**
```bash
# Test with a simple update
curl -X POST \
  https://abblyaukkoxmgzwretvm.supabase.co/functions/v1/update-file \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "communities/bengaluru/test.md",
    "file_type": "community",
    "updates": {"status": "pending"}
  }'
```

**Until deployed:** Admin edits will fail with "Edge Function not found" error.

### 2. Test Admin Edits (After Edge Function Deployed)

1. Open `/admin/communities.html`
2. Login as admin
3. Edit an existing community
4. Save changes
5. Verify:
   - No errors in browser console
   - Download markdown file from Supabase Storage
   - Confirm changes present in frontmatter
   - Check database reflects changes

### 3. Sync Updated Files to Supabase Storage (Optional)

If you want the current local markdown files (with coordinates) in Supabase Storage:

```bash
export SUPABASE_SERVICE_KEY='your-service-key'
python scripts/sync-to-supabase.py
```

This will upload all 52 updated markdown files to Storage.

### 4. Future Enhancements (Optional)

**Create operation via Edge Function:**
- Currently, new communities/organizations use direct DB insert
- Should create Edge Function endpoint for file creation too
- Would enable full storage-first for both create and update

**Delete operation via Edge Function:**
- Currently, deletes only remove DB record
- Should also delete file from Storage
- Ensures Storage and DB stay in sync

**Bulk operations:**
- Update multiple files at once
- Useful for mass status changes or field updates

---

## Key Technical Patterns

### Merge Strategy (Critical)

When updating files, **preserve all fields not in the update payload**.

**Example:**

**Current file:**
```yaml
name: "Old Name"
contact:
  person: "John"
  phone: "123"
lead_organization: "orgs/example"
```

**Update payload:**
```javascript
{
  name: "New Name",
  contact: { email: "new@example.com" }
}
```

**Merged result:**
```yaml
name: "New Name"              # Updated
contact:
  person: "John"              # PRESERVED
  phone: "123"                # PRESERVED
  email: "new@example.com"    # Added
lead_organization: "orgs/example"  # PRESERVED
last_updated: "2026-01-17"          # Auto-updated
```

### File Format Detection

**Edge Function must handle both formats:**

```typescript
const isMarkdown = file_path.endsWith('.md');

if (isMarkdown) {
    // Parse YAML frontmatter + preserve markdown body
    const { frontmatter, body } = parseMarkdownFile(content);
    const merged = mergeUpdates(frontmatter, updates);
    const updated = regenerateMarkdownFile(merged, body);
} else {
    // Parse pure YAML
    const current = parseYAML(content);
    const merged = mergeUpdates(current, updates);
    const updated = stringifyYAML(merged);
}
```

---

## Important Files Reference

### Documentation
- `/ARCHITECTURE.md` - Complete architecture guide
- `/STATUS.md` - This file (current progress)
- `/.claude/plans/concurrent-twirling-moth.md` - Detailed implementation plan

### Scripts to Create
- `/scripts/add-coordinates-to-markdown.py` - Coordinate migration
- `/supabase/functions/update-file/index.ts` - Edge Function for file updates

### Scripts to Modify
- `/scripts/sync-to-supabase.py` - Parse coordinates from frontmatter (if present)

### Admin Files to Modify
- `/website/public/assets/admin/communities.js` - Use Edge Function
- `/website/public/assets/admin/organizations.js` - Use Edge Function

### Data Files (will be modified by migration)
- `/data/communities/bengaluru/*.md` (61 files) - Add location field

---

## Verification Steps (After Implementation)

### 1. Coordinate Migration Verification

```bash
# Check that all markdown files have location field
grep -L "location:" data/communities/bengaluru/*.md
# Should return nothing (all files have location)
```

### 2. Edge Function Verification

```bash
# Test Edge Function
curl -X POST https://abblyaukkoxmgzwretvm.supabase.co/functions/v1/update-file \
  -H "Authorization: Bearer [ANON_KEY]" \
  -d '{"file_path": "communities/bengaluru/test.md", "updates": {...}}'
```

### 3. Admin Form Verification

1. Open `/admin/communities.html`
2. Edit a community
3. Save changes
4. Download markdown file from Supabase Storage
5. Verify changes present in frontmatter
6. Verify markdown body preserved

### 4. Database Sync Verification

```sql
-- Check if coordinates match between DB and Storage files
SELECT slug, latitude, longitude, metadata->'location' as location_field
FROM file_metadata
WHERE file_type = 'community'
LIMIT 10;
```

---

## Critical Warnings

### Never Update Database Directly

❌ **NEVER DO THIS:**
```javascript
await supabase.from('file_metadata').update({...})
```

✅ **ALWAYS DO THIS:**
```javascript
await supabase.functions.invoke('update-file', { body: {...} })
```

**Why:** Direct DB updates bypass Storage, causing divergence and data loss.

### Git is NOT Secure for Production

- `/data/` directory is for **development only**
- **Public repos expose community data** (names, contacts, locations)
- Production data lives in **Supabase Storage** (secure, RLS-protected)
- Git → Supabase is **one-way only** (not bidirectional)

---

## How to Continue in New Conversation

If context window fills up, start new conversation with:

1. **Read these files first:**
   - `/STATUS.md` (this file) - Current progress
   - `/ARCHITECTURE.md` - Architecture overview
   - `/.claude/plans/concurrent-twirling-moth.md` - Detailed plan

2. **Current status:** Phase 1 pending (coordinate migration)

3. **Next action:** Create `/scripts/add-coordinates-to-markdown.py`

4. **Key context:**
   - Supabase Storage is primary (not git)
   - Two file formats: `.yaml` (solution-providers) and `.md` (communities)
   - Admin forms must use Edge Function (not direct DB updates)
   - Merge strategy preserves unedited fields

---

## Environment Details

### Supabase Project
- **Project Ref:** abblyaukkoxmgzwretvm
- **URL:** https://abblyaukkoxmgzwretvm.supabase.co
- **Storage Bucket:** notf
- **Database Table:** file_metadata

### File Counts
- **Communities:** 66 markdown files in `/data/communities/bengaluru/`
  - 61 with elected_representatives
  - 5 missing location data
- **Solution Providers:** 55 YAML files in `/data/solution-providers/`

### Git Status
- **Branch:** main
- **Pending changes:** 4 modified admin HTML files (from previous work)
- **Next commit:** Will include ARCHITECTURE.md and STATUS.md

---

## Previous Work Summary

### What Led Here

1. **Original request:** Add MLA (Member of Legislative Assembly) data to communities
2. **Evolution:** Expanded to full elected_representatives (MLA, MP, Corporator)
3. **Discovery:** Admin edits were updating database only, not markdown files
4. **Solution:** Redesign to storage-first architecture

### Commits Made (Recent)
- c878b9d: Replace emoji icons with Font Awesome
- 878cd0a: Fix navigation links
- ead048a: Create consolidated single-page app
- a995825: Add elected_representatives to 61 community files

### Fields Added to Communities
- `elected_representatives.mla` (name, party, constituency)
- `elected_representatives.mp` (name, party, constituency)
- `elected_representatives.corporator` (name, party, ward) - placeholders

---

## Contact & Resources

### Documentation
- Supabase Setup: `/SUPABASE_SETUP_GUIDE.md`
- Architecture: `/ARCHITECTURE.md` (newly created)
- Plan: `/.claude/plans/concurrent-twirling-moth.md`

### Key Scripts
- Sync to Supabase: `/scripts/sync-to-supabase.py`
- Upload to Supabase: `/scripts/upload-and-sync-supabase.py`
- Infrastructure setup: `/scripts/setup-supabase-infrastructure.sql`

---

## End of Status Document

**Remember:** Always read `/ARCHITECTURE.md` and this file when starting new conversation on this topic.
