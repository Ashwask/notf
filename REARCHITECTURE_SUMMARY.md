# NOTF Website Re-Architecture Summary

## Completed Changes

### 1. Data Structure Reorganization ✅

**New Directory Structure:**
```
/data/
├── solution-providers/          (53 YAML files)
│   ├── atree.yaml
│   ├── biome-environmental-solutions.yaml
│   ├── bpac.yaml
│   └── ... (research orgs, NGOs, service providers)
│
└── communities/
    └── bengaluru/               (66 Markdown files)
        ├── whitefield-rising.md
        ├── hsr-layout-rwa.md
        └── ... (RWAs, forums, neighborhood groups)
```

**Data Sources:**
- **Excel Conversion**: 25 Community Orgs + 23 Solution Providers from "NOTF directory.xlsx"
- **Existing YAML Migration**: 20 Community Orgs + 34 Solution Providers from old structure
- **Total**: 66 Communities + 53 Solution Providers

### 2. Excel to YAML Conversion Script ✅

**Location:** `/scripts/excel-to-yaml.py`

**Features:**
- Converts "Community Orgs" sheet → Markdown files with YAML frontmatter
- Converts "Solution Providers" sheet → YAML files
- Parses list fields (Gives/Asks) intelligently
- Maps status values (active/pending)
- Adds `stories` field to all entries (empty, ready for content)
- Generates slugs from organization names

### 3. Categorization Script ✅

**Location:** `/scripts/categorize-existing-yamls.py`

**Features:**
- Analyzes existing YAML files from `/data/members/organizations/`
- Categorizes based on type, name patterns, and indicators
- Adds `stories` field to legacy files
- Converts Community Orgs to Markdown format
- Keeps Solution Providers as YAML

**Categorization Logic:**
- **Community Orgs**: RWAs, forums, neighborhood groups, citizens' initiatives
- **Solution Providers**: Research institutions, NGOs, consultancies, service providers

### 4. Application Code Updates ✅

#### load-data.js
- New `loadSolutionProviders()` function
- Updated `loadCommunities()` to support new structure
- `loadMembers()` now returns solution providers (backwards compatible)
- Added slug generation for all entries

#### .eleventy.js (Eleventy Config)
- Added `solutionProviders` global data
- Maintained backwards compatibility:
  - `members` → maps to solution providers
  - `organizations` → maps to solution providers
  - `individuals` → empty array
- All existing filters preserved

#### Templates
- **NEW**: `/src/solution-providers.njk` - dedicated page for solution providers
- **Updated**: `/src/_layouts/base.njk` - navigation updated
  - "Members" → "Solution Providers"
- **Kept**: `/src/members.njk` - legacy support (shows same data as solution-providers)
- **Kept**: `/src/communities.njk` - unchanged

### 5. YAML Schema ✅

#### Community Orgs (Markdown with Frontmatter)
```yaml
---
name: Organization Name
type: community-org
description: What they do
city: State/City
neighborhood: Location/Geography
ward: Ward/Constituency
contact:
  person: Name
  email: email@example.com
  phone: phone number
offers:
  - List of what they provide
asks:
  - List of what they need
status: active|pending
notes: Additional notes
rainmatters_partner: true|false
stories: null  # Free text, markdown format
---

<!-- Markdown content for stories goes here -->
```

#### Solution Providers (YAML)
```yaml
name: Organization Name
type: solution-provider
theme: Category/Theme
description: What they do
location: State/City
geography: Location/Geography
contact:
  person: Name
  email: email@example.com
  phone: phone number
offers:
  - Services/expertise they provide
asks:
  - What they're looking for
infrastructure:
  offers:
    - Infrastructure they can provide
  asks:
    - Infrastructure they need
status: active|pending
aspirational_geography: Where they want to work
notes: Additional information
rainmatters_partner: true|false
stories: null  # Free text, markdown format
```

### 6. Build & Deployment ✅

**Build Test Results:**
- ✅ Clean build with no errors
- ✅ 10 pages generated successfully
- ✅ 34 solution providers displayed
- ✅ 44 communities displayed (Bengaluru only, filtered for active status)

**Current Deployment:**
- Platform: Vercel
- URL: https://notf-one.vercel.app
- Auto-deploys from: GitHub main branch
- Project ID: prj_9qpiHjvpGLQwIDA1O50lEG6dHpkM

## Pending Tasks

### 1. Supabase Storage Migration 🔄

The Supabase bucket `notf` exists and is configured, but file migration is pending.

**Next Steps:**
1. Get Supabase service role key (for file uploads)
2. Upload solution providers to: `notf/solution-providers/*.yaml`
3. Upload communities to: `notf/communities/bengaluru/*.md`
4. Update `load-data.js` to fetch from Supabase Storage API instead of filesystem

**Migration Script Needed:**
```bash
# Upload to Supabase Storage
for file in data/solution-providers/*.yaml; do
  # Upload via Supabase Storage API
done
```

### 2. Vercel Environment Variables 🔄

Add Supabase credentials to Vercel:
- `SUPABASE_URL`: https://abblyaukkoxmgzwretvm.supabase.co
- `SUPABASE_ANON_KEY`: (available)
- `SUPABASE_SERVICE_ROLE_KEY`: (needed for uploads)

### 3. Matcher Enhancement 🔄

Update matcher logic to work with new structure:
- Match `offers` from Solution Providers → `asks` from Communities
- Match `offers` from Communities → `asks` from Solution Providers
- Display matches grouped by community

## Summary Statistics

- **Communities**: 66 (all in Bengaluru)
  - From Excel: 25
  - From existing YAMLs: 20
  - From existing communities folder: 21
- **Solution Providers**: 53
  - From Excel: 23
  - From existing YAMLs: 34
- **Build Status**: ✅ Successful
- **Pages Generated**: 10
- **Deployment**: Ready (pending git commit)

## File Changes

### Created:
- `/scripts/excel-to-yaml.py` - Excel conversion utility
- `/scripts/categorize-existing-yamls.py` - Categorization utility
- `/data/solution-providers/` - 53 YAML files
- `/data/communities/bengaluru/` - 66 Markdown files (merged from multiple sources)
- `/website/src/solution-providers.njk` - New template

### Modified:
- `/website/load-data.js` - Data loading logic
- `/website/.eleventy.js` - Configuration
- `/website/src/_layouts/base.njk` - Navigation

### Deprecated (but kept for compatibility):
- `/data/members/organizations/` - Old structure (can be removed after verification)
- `/website/src/members.njk` - Old template (redirects to solution-providers)

## Next Deployment Steps

1. **Commit changes to Git:**
   ```bash
   git add .
   git commit -m "Re-architect: Separate communities and solution providers

   - Convert Excel data to YAML/Markdown
   - Reorganize data structure
   - Update templates and navigation
   - Add stories field for future content"
   ```

2. **Push to GitHub:**
   ```bash
   git push origin main
   ```

3. **Vercel will auto-deploy** (monitoring at https://vercel.com)

4. **Future: Migrate to Supabase Storage** (optional, for dynamic updates)

## Breaking Changes

### URL Changes:
- `/notf/members/` → `/notf/solution-providers/` (old URL still works for now)

### Data Field Changes:
- `type: "anchor"` → `type: "solution-provider"`
- `type: "CBO"` → `type: "community-org"`
- Added: `stories` field to all entries

## Benefits of New Architecture

1. **Clear Separation**: Communities vs Solution Providers
2. **Scalability**: Easy to add new cities
3. **Rich Content**: Stories field enables narrative content
4. **Better Matching**: Structured offers/asks enable automated matching
5. **Excel Integration**: Easy to bulk import/update from Excel
6. **Future-Ready**: Prepared for Supabase migration
