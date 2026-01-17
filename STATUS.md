# NOTF Project Status - Storage-First Architecture Migration

**Last Updated:** 2026-01-17
**Status:** In Progress - Architecture documentation complete, implementation pending

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

### 2. Plan Document ✅

**File:** `/.claude/plans/concurrent-twirling-moth.md` (completed and approved)

**Contains:**
- Comprehensive implementation plan
- 5 phases of migration
- Edge Function specifications
- Migration scripts needed
- Verification steps
- Rollback plan

---

## Current Status

### In Progress

**Current Task:** Creating migration scripts and Edge Function

**Todo List:**
1. ✅ Create ARCHITECTURE.md documentation
2. ⏳ Create `add-coordinates-to-markdown.py` migration script
3. ⏳ Run coordinate migration
4. ⏳ Create Edge Function `update-file`
5. ⏳ Update `communities.js` to use Edge Function
6. ⏳ Update `organizations.js` to use Edge Function

---

## Next Steps

### Immediate (Phase 1): Coordinate Migration

**Problem:** Coordinates (latitude, longitude) currently only in database, not in markdown frontmatter.

**Solution:** Create and run migration script.

**Script to create:** `/scripts/add-coordinates-to-markdown.py`

**What it does:**
1. Query database for all communities with coordinates
2. Read each markdown file
3. Add `location` section to frontmatter:
   ```yaml
   location:
     latitude: 12.9611159
     longitude: 77.6362214
   ```
4. Write updated file

**Expected changes:** 61 markdown files in `/data/communities/bengaluru/`

### Phase 2: Edge Function

**File to create:** `/supabase/functions/update-file/index.ts`

**What it does:**
1. Receive update payload from admin form
2. Download current file from Supabase Storage
3. Parse YAML (or YAML frontmatter + markdown body)
4. Merge updates (preserve unedited fields)
5. Upload updated file to Storage
6. Parse file and update database
7. Return success

**Key features:**
- Handles both `.md` and `.yaml` files
- Merge strategy (doesn't overwrite unrelated fields)
- Preserves markdown body
- Optimistic locking (version field)

### Phase 3: Admin Form Updates

**Files to modify:**
- `/website/public/assets/admin/communities.js`
- `/website/public/assets/admin/organizations.js`

**Change:**

**Before (WRONG):**
```javascript
const { data, error } = await supabase
    .from('file_metadata')
    .update({ metadata: updatedMetadata })
    .eq('id', id);
```

**After (CORRECT):**
```javascript
const { data, error } = await supabase.functions.invoke('update-file', {
    body: {
        file_path: 'communities/bengaluru/shanthinagar.md',
        file_type: 'community',
        updates: {
            name: '...',
            elected_representatives: { ... },
            location: { latitude: ..., longitude: ... },
            // ... all other fields
        },
        markdown_body: '## About...'  // For .md files only
    }
});
```

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
