# NOTF Data Management Scripts

This directory contains utility scripts for managing NOTF data.

## Scripts Overview

### 1. excel-to-yaml.py

Converts the NOTF Directory Excel file to YAML/Markdown files.

**Usage:**
```bash
python3 excel-to-yaml.py
```

**What it does:**
- Reads `/supporting documents/NOTF directory.xlsx`
- Converts "Community Orgs" sheet → Markdown files in `/data/communities/bengaluru/`
- Converts "Solution Providers" sheet → YAML files in `/data/solution-providers/`
- Adds `stories` field to all entries
- Generates URL-friendly slugs

**Output:**
- Community Orgs: Markdown files with YAML frontmatter
- Solution Providers: Pure YAML files

### 2. categorize-existing-yamls.py

Categorizes existing YAML files from the old structure.

**Usage:**
```bash
python3 categorize-existing-yamls.py
```

**What it does:**
- Reads YAML files from `/data/members/organizations/`
- Analyzes organization type, name, and description
- Categorizes as either:
  - **Community Org** → Converts to Markdown in `/data/communities/bengaluru/`
  - **Solution Provider** → Keeps as YAML in `/data/solution-providers/`
- Adds `stories` field to all files

**Categorization Logic:**
- Community indicators: RWA, residents, welfare, forum, layout, rising
- Solution indicators: research, institute, foundation, trust, consultancy

### 3. upload-to-supabase.sh

Uploads data files to Supabase Storage bucket.

**⚠️ Prerequisites:**
- Supabase service role key (not the anon key!)
- Supabase bucket `notf` must exist (already created)

**Usage:**
```bash
./upload-to-supabase.sh <SUPABASE_SERVICE_ROLE_KEY>
```

**What it does:**
- Uploads all YAML files from `/data/solution-providers/` → `notf/solution-providers/`
- Uploads all MD files from `/data/communities/bengaluru/` → `notf/communities/bengaluru/`
- Creates placeholder `.gitkeep` files for other cities
- Skips template files (starting with `_`)

**To get your service role key:**
1. Go to Supabase Dashboard → Project Settings → API
2. Copy the "service_role" key (⚠️ keep this secret!)

## Workflow

### Initial Setup (One-time)

1. **Convert Excel data:**
   ```bash
   python3 excel-to-yaml.py
   ```

2. **Categorize existing YAMLs:**
   ```bash
   python3 categorize-existing-yamls.py
   ```

3. **Review generated files:**
   ```bash
   ls -l ../data/communities/bengaluru/
   ls -l ../data/solution-providers/
   ```

### Uploading to Supabase (Optional)

If you want to use Supabase Storage instead of GitHub:

1. **Get your service role key** from Supabase Dashboard

2. **Upload files:**
   ```bash
   ./upload-to-supabase.sh YOUR_SERVICE_ROLE_KEY
   ```

3. **Update application code** to fetch from Supabase:
   - Modify `website/load-data.js`
   - Add Supabase client
   - Fetch from Storage API instead of filesystem

4. **Add env vars to Vercel:**
   - `SUPABASE_URL=https://abblyaukkoxmgzwretvm.supabase.co`
   - `SUPABASE_ANON_KEY=<your-anon-key>`

### Regular Updates

**To add new organizations from Excel:**

1. Update the Excel file at `/supporting documents/NOTF directory.xlsx`

2. Run conversion:
   ```bash
   python3 excel-to-yaml.py
   ```

3. Review and commit:
   ```bash
   cd ..
   git add data/
   git commit -m "Add new organizations from Excel"
   git push
   ```

**To manually add a new solution provider:**

1. Create a YAML file in `/data/solution-providers/`:
   ```bash
   cd ../data/solution-providers
   nano my-new-org.yaml
   ```

2. Use this template:
   ```yaml
   name: Organization Name
   type: solution-provider
   description: What they do
   location: City, State
   contact:
     person: Contact Name
     email: email@example.com
     phone: "+91-XXX-XXX-XXXX"
   offers:
     - Service 1
     - Service 2
   asks:
     - Need 1
     - Need 2
   status: active
   stories: null
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "Add [Organization Name] as solution provider"
   git push
   ```

**To manually add a new community:**

1. Create a Markdown file in `/data/communities/bengaluru/`:
   ```bash
   cd ../data/communities/bengaluru
   nano my-community.md
   ```

2. Use this template:
   ```markdown
   ---
   name: Community Name
   type: community-org
   description: What they do
   city: Bengaluru
   neighborhood: Area Name
   contact:
     person: Contact Name
     email: email@example.com
   offers:
     - What they provide
   asks:
     - What they need
   status: active
   stories: null
   ---

   ## Community Stories

   Add community updates, success stories, and news here in Markdown format.
   ```

3. Commit and push

## Data Schema

### Community Org (Markdown with Frontmatter)

```yaml
---
name: string (required)
type: "community-org" (required)
description: string
city: string
neighborhood: string
ward: string
contact:
  person: string
  email: string
  phone: string
offers: array of strings
asks: array of strings
status: "active" | "pending"
notes: string
rainmatters_partner: boolean
stories: null | string (markdown)
---

<!-- Markdown content below frontmatter -->
```

### Solution Provider (YAML)

```yaml
name: string (required)
type: "solution-provider" (required)
theme: string
description: string
location: string
geography: string
contact:
  person: string
  email: string
  phone: string
offers: array of strings
asks: array of strings
infrastructure:
  offers: array of strings
  asks: array of strings
status: "active" | "pending"
aspirational_geography: string
notes: string
rainmatters_partner: boolean
stories: null | string (markdown)
```

## Troubleshooting

### Python dependencies not found

```bash
pip install pandas openpyxl pyyaml
```

### Excel file not found

Make sure you have:
- `/Users/sathya/Documents/GitHub/notf/supporting documents/NOTF directory.xlsx`

### Permission denied on upload script

```bash
chmod +x upload-to-supabase.sh
```

### Supabase upload fails

- Verify your service role key (not anon key!)
- Check bucket exists: `notf` in Supabase Dashboard → Storage
- Ensure bucket is public or has proper policies
