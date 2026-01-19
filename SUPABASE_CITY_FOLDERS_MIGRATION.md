# Supabase Community Files City Folder Migration

## Overview

This guide explains how to migrate community files from the flat structure (`notf/communities/*.md`) to the city-based folder structure (`notf/communities/<city>/*.md`).

## Changes Made

### 1. **Edge Function: sync-storage-to-db**
   - **File:** `/supabase/functions/sync-storage-to-db/index.ts`
   - **Change:** Now recursively scans city subfolders in `communities/` instead of just the root
   - **Behavior:**
     - Lists all folders in `communities/` (e.g., `bengaluru`, `mumbai`)
     - For each city folder, lists all `.md`, `.yaml`, `.yml` files
     - Syncs each file to database with full path: `communities/bengaluru/cifos.md`

### 2. **New Edge Function: cleanup-root-community-files**
   - **File:** `/supabase/functions/cleanup-root-community-files/index.ts`
   - **Purpose:** Deletes incorrectly placed `.md/.yaml/.yml` files from root `communities/` folder
   - **Safety:** Has dry-run mode (default) to preview deletions before executing

### 3. **Admin UI: communities.js**
   - **File:** `/website/public/assets/admin/communities.js`
   - **Change:** When creating new communities, files are saved to `communities/<city>/<slug>.md`
   - **City Normalization:** City names are lowercase with spaces replaced by hyphens
     - Example: "Bengaluru" → `communities/bengaluru/`
     - Example: "New Delhi" → `communities/new-delhi/`

## File Structure

### Before (Incorrect)
```
notf/
└── communities/
    ├── cifos.md
    ├── malleshwaram-social.md
    ├── hsr-layout.md
    └── ... (all files in root)
```

### After (Correct)
```
notf/
└── communities/
    ├── bengaluru/
    │   ├── cifos.md
    │   ├── malleshwaram-social.md
    │   └── hsr-layout.md
    ├── mumbai/
    │   ├── dharavi-community.md
    │   └── ...
    └── delhi/
        └── ...
```

## Deployment Steps

### Step 1: Deploy Edge Functions

```bash
# Deploy both functions
supabase functions deploy sync-storage-to-db
supabase functions deploy cleanup-root-community-files
```

### Step 2: Run Cleanup (Dry Run First!)

**Dry run to see what would be deleted:**

```bash
curl -X POST \
  'https://<your-project-ref>.supabase.co/functions/v1/cleanup-root-community-files' \
  -H 'Authorization: Bearer <your-anon-key>' \
  -H 'Content-Type: application/json' \
  -d '{"dry_run": true}'
```

**Review the output** to ensure only root-level `.md/.yaml/.yml` files will be deleted (NOT folders).

### Step 3: Run Cleanup (Actual Deletion)

Once you've verified the dry run output:

```bash
curl -X POST \
  'https://<your-project-ref>.supabase.co/functions/v1/cleanup-root-community-files' \
  -H 'Authorization: Bearer <your-anon-key>' \
  -H 'Content-Type: application/json' \
  -d '{"dry_run": false}'
```

### Step 4: Run Sync to Update Database

```bash
curl -X POST \
  'https://<your-project-ref>.supabase.co/functions/v1/sync-storage-to-db' \
  -H 'Authorization: Bearer <your-anon-key>' \
  -H 'Content-Type: application/json' \
  -d '{"file_type": "community"}'
```

This will:
- Scan all city folders in `communities/`
- Read each `.md` file
- Update the `file_metadata` table with correct paths

### Step 5: Verify in Admin Dashboard

1. Open admin dashboard: `/admin/index.html`
2. Navigate to **Communities** page
3. Verify all communities are displaying correctly
4. Check that the file paths in the database show the city subfolder structure

## Expected Supabase Storage Structure

After migration, your Supabase Storage should look like this:

**Bucket:** `notf`

```
notf/
├── communities/
│   ├── bengaluru/           (folder)
│   │   ├── cifos.md
│   │   ├── malleshwaram-social.md
│   │   ├── hsr-layout.md
│   │   └── ... (other Bengaluru communities)
│   ├── mumbai/              (folder)
│   │   └── ... (Mumbai communities)
│   ├── delhi/               (folder)
│   │   └── ... (Delhi communities)
│   └── ... (other cities)
├── solution-providers/      (unchanged - flat structure is fine)
│   ├── biome.yaml
│   ├── janaagraha.yaml
│   └── ...
└── geodata/
    └── ... (unchanged)
```

## Database Structure

**Table:** `file_metadata`

Key columns affected:
- `file_path`: Now includes city folder (e.g., `communities/bengaluru/cifos.md`)
- `city`: Pulled from metadata (not from file path)
- `slug`: File name without extension (e.g., `cifos`)

Example row:
```json
{
  "id": "uuid",
  "slug": "cifos",
  "file_path": "communities/bengaluru/cifos.md",
  "file_type": "community",
  "city": "Bengaluru",
  "metadata": { ... }
}
```

## Troubleshooting

### Communities Not Showing in Admin

**Check:**
1. Run sync function again
2. Verify city folders exist in Storage
3. Check browser console for errors
4. Query database directly:
   ```sql
   SELECT file_path, city, name FROM file_metadata WHERE file_type = 'community';
   ```

### Files in Wrong Location

**If you accidentally created files in root:**
1. Manually move them to city subfolders in Supabase Storage UI
2. Re-run sync function
3. Or use the cleanup script to delete and recreate

### City Folder Naming

Cities are normalized to lowercase with hyphens:
- "Bengaluru" → `bengaluru`
- "New Delhi" → `new-delhi`
- "Navi Mumbai" → `navi-mumbai`

## Important Notes

⚠️ **DO NOT delete files from city subfolders** (`communities/bengaluru/*.md`)
⚠️ **ONLY delete files from root** (`communities/*.md`)

✅ Files in city subfolders are the correct location
✅ The cleanup script only removes root-level files
✅ Admin UI will create new communities in city subfolders going forward

## Verification Checklist

- [ ] Edge Functions deployed successfully
- [ ] Dry run completed and reviewed
- [ ] Root-level community files deleted
- [ ] Sync function executed successfully
- [ ] Database shows correct file paths with city folders
- [ ] Admin dashboard displays all communities
- [ ] Creating new community saves to city subfolder
- [ ] Editing existing community preserves city subfolder path

## Rollback (If Needed)

If something goes wrong:

1. **Restore files from backup** (Supabase Storage versioning or git history)
2. **Revert code changes:**
   ```bash
   git revert 8a0ad1c
   git push
   ```
3. **Redeploy old Edge Function:**
   ```bash
   supabase functions deploy sync-storage-to-db
   ```
4. **Re-run sync to restore database**

## Support

If you encounter issues:
1. Check Supabase function logs: Supabase Dashboard → Edge Functions → Logs
2. Check browser console for frontend errors
3. Verify file paths in Supabase Storage UI
4. Query `file_metadata` table to see actual data

---

**Commit:** `8a0ad1c`
**Date:** 2026-01-19
**Status:** Ready for deployment
