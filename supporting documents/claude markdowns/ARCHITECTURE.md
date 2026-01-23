# NOTF Architecture Documentation

## Storage-First Architecture

### Core Principle

**Supabase Storage is the single source of truth** for all content data. The database (`file_metadata` table) is a **query cache and index** that is automatically regenerated from Storage files.

---

## Why Supabase Storage (Not Git)?

### Security Concerns

- ✅ **Supabase Storage is Secure:** RLS (Row Level Security) policies control access
- ✅ **Supabase Storage is Private:** Not exposed in public repositories
- ❌ **Git is Insecure for Production Data:** Public repos expose sensitive community information

### Storage Hierarchy

```
PRIMARY: Supabase Storage (notf bucket)
  ├── Secure with RLS policies
  ├── Production data lives here
  └── Admin edits write here FIRST

CACHE: Supabase Database (file_metadata table)
  ├── Indexed for fast queries
  ├── Auto-regenerated from Storage
  └── Never edited directly by admin

DEVELOPMENT: Git Repo (/data directory)
  ├── Local development only
  ├── One-way sync TO Supabase
  └── NOT for production data
```

---

## File Formats: Why Two Extensions?

### Solution Providers: `.yaml` (Pure Structured Data)

**Use case:** Organizations that provide services but don't need rich content.

**Example:** `solution-providers/atree.yaml`

```yaml
name: Ashoka Trust for Research in Ecology and the Environment
type: solution-provider
location: Bengaluru
neighborhoods: [Srirampura, Jakkur]
website: https://atree.org
contact:
  email: info@atree.org
  phone: +91-80-2363-5555
  person: Dr. Nitin Rai
domains: [research, biodiversity, water, climate]
offers:
  - Ecological research and monitoring expertise
  - Climate vulnerability assessments
asks:
  - Long-term monitoring sites in urban areas
status: active
joined: 2024-02-05
last_updated: 2025-01-09
social:
  twitter: ATIKIREE
  instagram: atree_india
notes: Leading environmental research organization.
stories: null
```

**Why YAML?**
- Pure structured data
- No rich formatting needed
- Compact and readable
- All content in one file

### Communities: `.md` (YAML Frontmatter + Markdown Body)

**Use case:** Communities that need rich content with formatting (stories, impact reports, project updates).

**Example:** `communities/bengaluru/shanthinagar.md`

```yaml
---
name: "Shanthinagar"
city: "Bengaluru"
neighborhood: "Shanthinagar"
location:
  latitude: 12.9611159
  longitude: 77.6362214
elected_representatives:
  mla:
    name: "N.A. Haris"
    party: "INC"
    constituency: "Shanti Nagar"
  mp:
    name: "P.C. Mohan"
    party: "BJP"
    constituency: "Bangalore Central"
contact:
  person: "Shobha Rander"
  phone: "9845111117"
status: "active"
started: "2026-01-08"
last_updated: "2026-01-17"
---

## About Shanthinagar

A vibrant community in **Bengaluru** working on neighborhood-level transformation.

### Community Achievements

- Restored 3 traditional water tanks
- Planted 500+ native trees
- Reduced waste by 40%

## Current Initiatives

### Solar Rooftop Project

Installing solar panels on 50 houses in Church Road.

[Learn more](https://example.com)

## Get Involved

Contact the lead organization to learn more.
```

**Why Markdown?**
- YAML frontmatter for structured fields
- **Markdown body for rich content** (stories, impact reports, etc.)
- Supports:
  - Headings, lists, links, images
  - Bold, italic, code formatting
  - Tables, blockquotes
- **Future-proof:** Can add more rich content fields without format changes

### File Format Decision Matrix

| Content Type | Extension | Reason |
|--------------|-----------|--------|
| Solution Provider | `.yaml` | Structured data only, no rich content |
| Community | `.md` | Needs rich content (stories, projects, reports) |
| Ask | `.md` | Needs detailed descriptions with formatting |
| Offer | `.md` | Needs detailed descriptions with formatting |
| Event | `.md` | Needs agenda, notes, and formatted content |

---

## Data Flow Architecture

### Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ SUPABASE STORAGE (Single Source of Truth - PRIMARY)        │
│ Bucket: "notf" (RLS-secured)                               │
│ ├── communities/bengaluru/*.md  (YAML + Markdown)          │
│ └── solution-providers/*.yaml   (Pure YAML)                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Edge Function parses on upload/update
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ SUPABASE DATABASE (Query Cache / Index)                    │
│ Table: file_metadata                                        │
│ ├── Indexed fields (status, city, neighborhood, lat/long)  │
│ └── metadata JSONB (complete frontmatter for queries)      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Admin CRUD reads from DB, writes via Edge Function
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ ADMIN INTERFACE                                             │
│ ├── Reads from Database (fast queries)                     │
│ ├── Edits call Edge Function (NOT direct DB update)        │
│ └── Edge Function updates Storage FIRST, then DB           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ GIT REPO (Development Only - NOT SECURE)                   │
│ /data/ directory                                            │
│ ├── For local development and initial data creation        │
│ ├── One-way sync TO Supabase Storage                       │
│ └── NOT the source of truth for production                 │
└─────────────────────────────────────────────────────────────┘
```

### Data Lifecycle

1. **Initial Upload** (Development → Production)
   ```
   Developer creates file in /data/
   → Commits to git
   → Runs sync-to-supabase.py
   → File uploaded to Storage
   → Parsed and indexed in Database
   ```

2. **Admin Edit** (Production Updates)
   ```
   Admin edits via CRUD form
   → Form calls Edge Function (update-file)
   → Edge Function downloads file from Storage
   → Merges updates (preserves unedited fields)
   → Uploads updated file to Storage ✅ SOURCE UPDATED
   → Parses file and updates Database ✅ CACHE UPDATED
   → Returns success to admin
   ```

3. **Public Access** (Reading Data)
   ```
   User visits website
   → Eleventy builds static site
   → Queries Database (fast access to indexed data)
   → Renders community/solution-provider pages
   ```

---

## Admin CRUD Pattern (CRITICAL)

### ❌ WRONG - Never Do This

```javascript
// WRONG: Direct database update
const { data, error } = await supabase
    .from('file_metadata')
    .update({
        metadata: updatedMetadata,
        status: 'active'
    })
    .eq('id', communityId);
```

**Why this is wrong:**
- ❌ Only updates database (cache)
- ❌ Storage file (source of truth) unchanged
- ❌ Next sync from Storage → data loss
- ❌ Creates divergence between Storage and DB

### ✅ CORRECT - Always Do This

```javascript
// CORRECT: Edge Function updates Storage FIRST, then DB
const { data, error } = await supabase.functions.invoke('update-file', {
    body: {
        file_path: 'communities/bengaluru/shanthinagar.md',
        file_type: 'community',
        updates: {
            name: 'Shanthinagar',
            city: 'Bengaluru',
            neighborhood: 'Shanthinagar',
            elected_representatives: {
                mla: { name: 'N.A. Haris', party: 'INC', constituency: 'Shanti Nagar' },
                mp: { name: 'P.C. Mohan', party: 'BJP', constituency: 'Bangalore Central' },
                corporator: { name: '', party: '', ward: '' }
            },
            location: {
                latitude: 12.9611159,
                longitude: 77.6362214
            },
            contact: { person: 'Shobha Rander', phone: '9845111117' },
            status: 'active'
        },
        markdown_body: '## About...\n\n...'  // For .md files only
    }
});
```

**Why this is correct:**
- ✅ Updates Storage file (source of truth) FIRST
- ✅ Then updates Database (cache) automatically
- ✅ Both systems stay in sync
- ✅ Future syncs won't cause data loss
- ✅ Preserves fields not in the update payload

---

## Data Storage Principles

### What Goes WHERE

#### Supabase Storage Files (Source of Truth)

**All user-editable content:**
- name, type, city, state, neighborhood
- elected_representatives (MLA, MP, Corporator)
- location (latitude, longitude)
- contact (email, phone, person)
- website, social media links
- domains, offers, asks
- notes, stories (rich markdown content)
- status, dates (joined, last_updated)

#### Database Table (Query Cache)

**Indexed columns (for fast filtering):**
- file_path, file_type, slug
- city, neighborhood, ward
- status (active/pending/archived)
- latitude, longitude (for map queries)

**System/audit fields (generated, not in files):**
- id (UUID)
- created_at, updated_at
- created_by, updated_by
- version (for optimistic locking)

**metadata JSONB column:**
- Complete copy of frontmatter
- Enables flexible queries without predefined schema

---

## Why This Matters: The Divergence Problem

### Without Storage-First Architecture

```
Day 1: Developer creates community.md
       → Syncs to Storage
       → Indexed in Database
       ✅ All in sync

Day 2: Admin edits via form
       → Direct DB update
       ❌ Storage file unchanged

Day 3: Developer updates another field in community.md
       → Re-syncs to Storage
       → Re-indexes in Database
       ❌ Admin's changes from Day 2 are LOST
```

### With Storage-First Architecture

```
Day 1: Developer creates community.md
       → Syncs to Storage
       → Indexed in Database
       ✅ All in sync

Day 2: Admin edits via form
       → Edge Function updates Storage file
       → Edge Function updates Database
       ✅ All in sync

Day 3: Developer updates another field in community.md
       → Re-syncs to Storage
       → Re-indexes in Database
       ✅ Admin's changes from Day 2 are PRESERVED
```

---

## Merge Strategy: Preserve Unedited Fields

When updating files, we use a **merge strategy** to preserve data not sent in the update payload.

### Example

**Current file:**
```yaml
---
name: "Old Name"
contact:
  person: "John Doe"
  phone: "1234567890"
lead_organization: "organizations/example"
status: "active"
---
```

**Update payload from admin form:**
```javascript
{
  name: "New Name",
  contact: {
    email: "new@example.com"
  }
}
```

**Merged result (what gets written to Storage):**
```yaml
---
name: "New Name"              # Updated
contact:
  person: "John Doe"          # Preserved (not in payload)
  phone: "1234567890"         # Preserved (not in payload)
  email: "new@example.com"    # Added
lead_organization: "organizations/example"  # Preserved (not in payload)
status: "active"                            # Preserved (not in payload)
last_updated: "2026-01-17"                  # Auto-updated
---
```

**Key principle:** Only update fields explicitly sent in the payload. Preserve everything else.

---

## Implementation Files

### Edge Function

**File:** `/supabase/functions/update-file/index.ts`

**Responsibilities:**
1. Receive update payload from admin forms
2. Download current file from Storage
3. Parse content (YAML or YAML frontmatter + markdown)
4. Merge updates with existing data
5. Upload updated file to Storage
6. Parse and update Database
7. Return success to client

**Supports:**
- `.md` files (communities, asks, offers, events)
- `.yaml` files (solution-providers)
- Merge strategy (preserve unedited fields)
- Optimistic locking (version field)

### Admin JavaScript Files

**Files to modify:**
- `/website/public/assets/admin/communities.js`
- `/website/public/assets/admin/organizations.js`

**Change:** Replace all direct DB updates with Edge Function calls.

### Sync Scripts

**File:** `/scripts/sync-to-supabase.py`

**Purpose:** One-way sync from local `/data/` to Supabase Storage and Database.

**Use cases:**
- Initial data upload
- Bulk updates from development
- Migration scripts

**Note:** Does NOT sync from Supabase back to local (one-way only).

---

## Security Model

### Supabase Storage RLS Policies

```sql
-- Admins can read/write all files
CREATE POLICY "Admins full access"
ON storage.objects FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Public users can only read active files
CREATE POLICY "Public read active"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'notf');
```

### Database RLS Policies

```sql
-- Public users see only active records
CREATE POLICY "Public select active"
ON file_metadata FOR SELECT
TO anon
USING (status = 'active');

-- Authenticated users see all records
CREATE POLICY "Authenticated full select"
ON file_metadata FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can modify"
ON file_metadata FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
```

---

## Best Practices

### For Developers

1. **Never edit Storage files manually** - always use admin interface or sync scripts
2. **Local changes go through sync script** - use `sync-to-supabase.py`
3. **Test locally first** - use local dev server before syncing to production
4. **Document field changes** - update this ARCHITECTURE.md when adding new fields

### For Admins

1. **Always use the admin interface** - never edit database directly
2. **Check "stories" content** - use markdown editor for rich formatting
3. **Verify coordinates** - use map picker, don't type lat/long manually
4. **Review before saving** - admin edits are immediate (no draft mode)

### For System Administrators

1. **Monitor Edge Function logs** - check for errors in file updates
2. **Backup Supabase Storage** - export files periodically
3. **Test sync scripts** - validate before running on production
4. **Review RLS policies** - ensure security rules are correct

---

## Troubleshooting

### Problem: Admin edit didn't save

**Symptoms:** Changes appear to save but don't show up after refresh.

**Diagnosis:**
1. Check Edge Function logs for errors
2. Verify RLS policies allow the user to write
3. Check if file_path is correct

**Solution:** Check browser console for Edge Function error messages.

### Problem: Sync script overwrites admin changes

**Symptoms:** Admin edits disappear after running sync script.

**Diagnosis:** Check if admin form is using Edge Function or direct DB update.

**Solution:**
- If admin form uses direct DB updates: Update to use Edge Function
- If sync script runs with old local files: Pull latest from Storage first

### Problem: Database and Storage out of sync

**Symptoms:** Database shows different data than Storage file.

**Diagnosis:** Someone edited database directly (bypassing Edge Function).

**Solution:**
1. Download correct file from Storage
2. Re-run sync script to update database from Storage
3. Update admin code to prevent direct DB edits

---

## Future Enhancements

### Possible Improvements

1. **Two-way sync** - Download from Storage back to local `/data/`
2. **Version history** - Track all changes to files over time
3. **Draft mode** - Allow admins to preview changes before saving
4. **Bulk edit** - Update multiple communities at once
5. **Markdown sections** - Parse markdown body into sections (About, Projects, Impact)

### Adding New Fields

When adding new fields to communities or solution-providers:

1. **Update templates** in `/data/` directory
2. **Update admin forms** in `/website/public/admin/`
3. **Update Edge Function** (if special parsing needed)
4. **Update this ARCHITECTURE.md** with field purpose
5. **Run migration script** to add field to existing files

---

## Summary

- **Supabase Storage = Source of Truth** (secure, RLS-protected)
- **Database = Query Cache** (fast, indexed, auto-regenerated)
- **Git = Development Only** (not secure for production)
- **Admin edits → Edge Function → Storage → Database** (never direct DB)
- **Two formats:** `.yaml` (structured) vs `.md` (rich content)
- **Merge strategy:** Preserve unedited fields
- **Security:** RLS policies on Storage and Database
