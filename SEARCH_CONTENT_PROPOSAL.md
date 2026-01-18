# Proposal: Deep Content Search for Communities

**Problem:** Discovery search only looks at metadata (name, themes, neighborhood), not the actual markdown content stored in Supabase Storage.

**User Request:** "how do we make it go after the community markdown files in supabase and search?"

---

## Current Situation

**Data Structure:**
```javascript
// Currently loaded from file_metadata table
{
  name: "Malleswaram Residents Welfare",
  city: "Bengaluru",
  neighborhood: "Malleswaram",
  themes: ["waste-management", "parks"],
  description: "Short description...",  // ← Only this brief text is searchable
  // ... but the full markdown story is in Storage, not searched
}
```

**Markdown Content:** Lives in Supabase Storage bucket, fetched separately when viewing community details.

---

## Options for Content Search

### Option 1: Pre-Index Content in Metadata (Recommended)

**How it works:**
1. At content creation/update time, extract searchable content from markdown
2. Store it in `file_metadata.metadata.searchable_content` field
3. Discovery engine searches this field along with others

**Pros:**
- ✅ Fast search (no file fetching needed)
- ✅ Low bandwidth (content already in database)
- ✅ Works offline after initial load
- ✅ Easy to implement

**Cons:**
- ❌ Requires database migration to add searchable_content
- ❌ Needs content re-processing when markdown changes

**Implementation:**

```sql
-- Add searchable_content to metadata JSONB
-- (No migration needed - JSONB is flexible)

-- Example updated record:
UPDATE file_metadata
SET metadata = jsonb_set(
  metadata,
  '{searchable_content}',
  '"waste management cleanup drive parks maintenance community meeting schedule volunteers needed"'::jsonb
)
WHERE file_type = 'community';
```

```javascript
// In discovery-engine.js - add to search keys
const fuseOptions = {
  keys: [
    { name: 'name', weight: 2.0 },
    { name: 'themes', weight: 1.5 },
    { name: 'neighborhood', weight: 1.2 },
    { name: 'city', weight: 1.0 },
    { name: 'metadata.searchable_content', weight: 0.8 },  // ← NEW
    { name: 'description', weight: 0.5 }
  ],
  // ...
};
```

**Content Extraction Logic:**
```javascript
// Extract searchable text from markdown
function extractSearchableContent(markdownText) {
  // Remove markdown syntax
  let text = markdownText
    .replace(/^#+\s+/gm, '')           // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1')     // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Extract link text
    .replace(/```[\s\S]*?```/g, '')    // Remove code blocks
    .replace(/`([^`]+)`/g, '$1');      // Remove inline code

  // Extract keywords (nouns, important words)
  const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'with'];
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.includes(w));

  // Deduplicate and limit to ~200 most important words
  const uniqueWords = [...new Set(words)].slice(0, 200);

  return uniqueWords.join(' ');
}

// Example usage when creating/updating community
async function saveCommunity(slug, markdownContent, metadata) {
  const searchableContent = extractSearchableContent(markdownContent);

  await supabase
    .from('file_metadata')
    .update({
      metadata: {
        ...metadata,
        searchable_content: searchableContent
      }
    })
    .eq('slug', slug);
}
```

---

### Option 2: Fetch and Search Content On-Demand

**How it works:**
1. User types search query
2. Fetch all markdown files from Storage
3. Search through full content
4. Return matching communities

**Pros:**
- ✅ Always searches latest content
- ✅ No database changes needed

**Cons:**
- ❌ Very slow (fetch 50+ files on every search)
- ❌ High bandwidth usage
- ❌ Doesn't work offline
- ❌ Poor user experience

**Not recommended due to performance issues.**

---

### Option 3: Hybrid Approach

**How it works:**
1. Quick search using metadata (Option 1)
2. If < 5 results, fetch and search full content for those files only
3. Merge results

**Pros:**
- ✅ Fast for most queries
- ✅ Deep search when needed

**Cons:**
- ❌ Complex implementation
- ❌ Still slow for broad queries

---

## Recommendation: Option 1 (Pre-Index)

**Why:**
1. **Performance:** Instant search, no file fetching
2. **User Experience:** Fast results, works offline
3. **Scalability:** Works with 1,000+ communities
4. **Simple:** Just add one field to metadata

**Implementation Plan:**

### Step 1: Create Content Extraction Script

```javascript
// scripts/index-community-content.js
// Run this once to populate searchable_content for all communities

async function indexAllCommunities() {
  const communities = await supabase
    .from('file_metadata')
    .select('*')
    .eq('file_type', 'community');

  for (const community of communities.data) {
    // Fetch markdown from Storage
    const { data: markdown } = await supabase.storage
      .from('notf')
      .download(`communities/${community.slug}.md`);

    const markdownText = await markdown.text();

    // Extract searchable content
    const searchableContent = extractSearchableContent(markdownText);

    // Update metadata
    await supabase
      .from('file_metadata')
      .update({
        metadata: {
          ...community.metadata,
          searchable_content: searchableContent
        }
      })
      .eq('id', community.id);

    console.log(`✓ Indexed: ${community.slug}`);
  }
}
```

### Step 2: Update Discovery Engine

Already prepared above - just add `metadata.searchable_content` to search keys.

### Step 3: Update Content Creation Workflow

When admins create/edit communities, automatically extract and save searchable_content.

---

## Alternative: Full-Text Search with Postgres

**Option 4: Use Supabase Full-Text Search**

Postgres has built-in full-text search capabilities:

```sql
-- Create text search column
ALTER TABLE file_metadata ADD COLUMN searchable_text tsvector;

-- Create index
CREATE INDEX idx_searchable_text ON file_metadata USING GIN(searchable_text);

-- Update searchable text (run once)
UPDATE file_metadata
SET searchable_text = to_tsvector('english',
  coalesce(metadata->>'name', '') || ' ' ||
  coalesce(metadata->>'description', '') || ' ' ||
  coalesce(metadata->>'searchable_content', '')
)
WHERE file_type = 'community';

-- Search query
SELECT *
FROM file_metadata
WHERE searchable_text @@ to_tsquery('english', 'malleshwaram & waste')
ORDER BY ts_rank(searchable_text, to_tsquery('english', 'malleshwaram & waste')) DESC;
```

**Pros:**
- ✅ Very fast (indexed)
- ✅ Supports relevance ranking
- ✅ Supports stemming (search "parks" finds "park")

**Cons:**
- ❌ Requires database migration
- ❌ Search happens server-side (need API endpoint)
- ❌ Can't use Fuse.js fuzzy matching

---

## Proposed Implementation: Hybrid Client-Side + Pre-Indexed

**Best of Both Worlds:**

1. **Pre-index searchable content** in `metadata.searchable_content` (Option 1)
2. **Use Fuse.js** for fuzzy search on client side
3. **Keep existing fast workflow** - no API calls needed

**Changes Required:**

### File 1: `/scripts/index-community-content.js` (NEW)
- One-time script to populate searchable_content for existing communities
- Run via: `node scripts/index-community-content.js`

### File 2: `/website/public/assets/chat/discovery-engine.js` (UPDATE)
- Add `metadata.searchable_content` to Fuse.js keys

### File 3: Admin community editor (FUTURE)
- When saving community, extract and save searchable_content

---

## Example Search Results After Implementation

**Query:** "communities in malleshwaram working on waste management"

**Before (metadata only):**
- Searches: name, themes, neighborhood, city, description
- Results: 0-2 communities (if name/themes match exactly)

**After (with indexed content):**
- Searches: name, themes, neighborhood, city, description, **searchable_content**
- Results: 5-10 communities
  - ✅ Communities in Malleshwaram (neighborhood match)
  - ✅ Communities with "waste management" in markdown content
  - ✅ Communities with "cleanup drive" in stories
  - ✅ Communities with "volunteers needed for waste" in posts

---

## Decision Needed

Which option do you prefer?

1. **Quick Fix:** Just add searchable_content to existing communities manually (2 hours)
2. **Automated:** Build indexing script to populate all communities (1 day)
3. **Full Solution:** Add to admin workflow + build indexing script (2 days)

I recommend starting with option 2 (automated script) to populate existing communities, then add to admin workflow later.
