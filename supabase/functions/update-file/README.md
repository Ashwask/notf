# Update File Edge Function

This Edge Function implements the **storage-first architecture** for NOTF by updating Supabase Storage files (the source of truth) and then syncing changes to the database.

## Purpose

When admin users edit communities or solution-providers via the CRUD interface, this function:

1. ✅ Downloads the current file from Supabase Storage
2. ✅ Parses YAML (or YAML frontmatter + markdown body)
3. ✅ Merges updates (preserves fields not in the payload)
4. ✅ Uploads updated file back to Storage (**SOURCE OF TRUTH UPDATED**)
5. ✅ Parses file and updates database (**CACHE UPDATED**)
6. ✅ Returns success to client

## Why This Matters

**Without this function:** Admin edits only update the database → Storage files unchanged → next sync from Storage overwrites changes (DATA LOSS)

**With this function:** Admin edits update Storage FIRST → then database → both stay in sync → no data loss

## API

### Endpoint

```
POST https://{project-ref}.supabase.co/functions/v1/update-file
```

### Request Body

```typescript
{
  file_path: string        // e.g., "communities/bengaluru/shanthinagar.md"
  file_type: string        // "community" or "solution-provider"
  updates: object          // Fields to update (merged with existing)
  markdown_body?: string   // For .md files only (stories content)
  version?: number         // For optimistic locking (optional)
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "file_path": "communities/bengaluru/shanthinagar.md",
  "slug": "shanthinagar",
  "version": 2,
  "message": "File and database updated successfully"
}
```

**Conflict (409):**
```json
{
  "error": "Conflict detected",
  "message": "This file was modified by another user. Please refresh and try again.",
  "currentVersion": 2
}
```

**Error (500):**
```json
{
  "error": "Error message here"
}
```

## Example Usage

### From Admin JavaScript

```javascript
const { data, error } = await supabase.functions.invoke('update-file', {
  body: {
    file_path: 'communities/bengaluru/shanthinagar.md',
    file_type: 'community',
    updates: {
      name: 'Shanthinagar',
      city: 'Bengaluru',
      neighborhood: 'Shanthinagar',
      elected_representatives: {
        mla: {
          name: 'N.A. Haris',
          party: 'INC',
          constituency: 'Shanti Nagar'
        },
        mp: {
          name: 'P.C. Mohan',
          party: 'BJP',
          constituency: 'Bangalore Central'
        },
        corporator: {
          name: '',
          party: '',
          ward: ''
        }
      },
      location: {
        latitude: 12.9611159,
        longitude: 77.6362214
      },
      contact: {
        person: 'Shobha Rander',
        phone: '9845111117'
      },
      status: 'active'
    },
    markdown_body: '## About Shanthinagar\n\nA vibrant community...'
  }
})

if (error) {
  console.error('Update failed:', error)
} else {
  console.log('Update successful:', data)
}
```

### From cURL (Testing)

```bash
curl -X POST \
  https://abblyaukkoxmgzwretvm.supabase.co/functions/v1/update-file \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "communities/bengaluru/test.md",
    "file_type": "community",
    "updates": {
      "name": "Test Community",
      "status": "pending"
    }
  }'
```

## Merge Strategy

The function uses a **merge strategy** to preserve fields not included in the update payload.

### Example

**Current file:**
```yaml
name: "Old Name"
contact:
  person: "John Doe"
  phone: "1234567890"
lead_organization: "organizations/example"
status: "active"
```

**Update payload:**
```json
{
  "name": "New Name",
  "contact": {
    "email": "new@example.com"
  }
}
```

**Result (merged):**
```yaml
name: "New Name"              # Updated
contact:
  person: "John Doe"          # PRESERVED (not in payload)
  phone: "1234567890"         # PRESERVED (not in payload)
  email: "new@example.com"    # Added
lead_organization: "organizations/example"  # PRESERVED (not in payload)
status: "active"                            # PRESERVED (not in payload)
last_updated: "2026-01-17"                  # Auto-updated
version: 2                                   # Auto-incremented
```

## File Formats Supported

### Communities (`.md` files)

**Structure:** YAML frontmatter + Markdown body

**Example:**
```markdown
---
name: "Community Name"
city: "Bengaluru"
# ... other frontmatter fields
---

## About Community

Rich markdown content with **formatting**, lists, links, etc.
```

**Handling:**
- Parses frontmatter separately from markdown body
- Updates frontmatter fields
- Preserves or replaces markdown body (based on `markdown_body` parameter)

### Solution Providers (`.yaml` files)

**Structure:** Pure YAML

**Example:**
```yaml
name: "Organization Name"
type: "solution-provider"
location: "Bengaluru"
# ... other fields
```

**Handling:**
- Parses entire file as YAML
- Merges updates with existing fields
- No markdown body

## Optimistic Locking

To prevent concurrent edit conflicts, the function supports **optimistic locking** using the `version` field.

### How it works:

1. Client includes current `version` in request
2. Function checks if file's `version` matches
3. If mismatch → returns 409 Conflict
4. If match → updates file and increments `version`

### Example:

```javascript
// Client loads community with version 5
const community = await loadCommunity('shanthinagar')
// community.version = 5

// User edits, client sends version in update
await supabase.functions.invoke('update-file', {
  body: {
    file_path: 'communities/bengaluru/shanthinagar.md',
    updates: { name: 'Updated Name' },
    version: 5  // Current version
  }
})

// If another user updated to version 6 meanwhile:
// Returns 409 Conflict: "Please refresh and try again"
```

## Auto-Updated Fields

These fields are automatically set by the function:

- `last_updated`: Current date in YYYY-MM-DD format
- `version`: Incremented by 1 on each update

## Database Sync

After updating the Storage file, the function extracts metadata and updates the `file_metadata` table:

**Indexed columns (for fast queries):**
- `slug` (from filename)
- `file_type` (from request)
- `file_path` (from request)
- `city` (from path for communities)
- `status` (from frontmatter)
- `neighborhood` (from frontmatter)
- `latitude`, `longitude` (from frontmatter.location)

**JSONB metadata column:**
- Complete frontmatter object (for flexible queries)

## Deployment

```bash
# Deploy to Supabase
supabase functions deploy update-file --project-ref abblyaukkoxmgzwretvm

# Test deployment
supabase functions invoke update-file \
  --body '{"file_path":"communities/bengaluru/test.md","file_type":"community","updates":{"status":"pending"}}'
```

## Environment Variables

The function requires these Supabase environment variables (automatically set):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (has full access)

## Error Handling

The function handles these errors:

1. **Unsupported file extension** - Only `.md`, `.yaml`, `.yml` allowed
2. **File not found in Storage** - Returns 500 error
3. **YAML parse error** - Returns 500 error
4. **Storage upload failure** - Returns 500 error
5. **Database update failure** - Returns 500 error (but Storage already updated)
6. **Version conflict** - Returns 409 Conflict

## Security

- Uses **service role key** (full access) - only callable by authenticated users
- Should add RLS policies to restrict who can call this function
- Validates file paths to prevent directory traversal

## See Also

- `/ARCHITECTURE.md` - Complete architecture documentation
- `/STATUS.md` - Current project status
- `/scripts/sync-to-supabase.py` - One-way sync from local to Supabase
