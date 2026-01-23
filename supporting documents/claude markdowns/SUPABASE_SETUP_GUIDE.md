# Supabase Integration Setup Guide

This guide walks you through migrating the NOTF website from GitHub-based YAML files to Supabase Storage with automatic Vercel deployments.

## Overview

**Benefits of Supabase Integration:**
- ✅ YAML files stored in private Supabase Storage (not public GitHub)
- ✅ Easy CRUD operations via Supabase Dashboard or API
- ✅ Automatic website deployment when files are created/updated/deleted
- ✅ Metadata tracking and versioning
- ✅ Row Level Security for controlled access

**Architecture:**
```
Supabase Storage (YAML files)
    ↓
file_metadata table (parsed data + metadata)
    ↓
Database Trigger (on INSERT/UPDATE/DELETE)
    ↓
Edge Function (trigger-vercel-deploy)
    ↓
Vercel Deploy Hook (rebuild website)
    ↓
Website fetches data from Supabase at build time
```

## Prerequisites

- Supabase project: https://abblyaukkoxmgzwretvm.supabase.co
- Vercel project: notf-one.vercel.app
- GitHub repo: urbanmorph/notf

## Step 1: Setup Supabase Database

### 1.1 Run the SQL Schema

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/abblyaukkoxmgzwretvm/sql/new)

2. Copy and paste the entire contents of `/scripts/setup-supabase-infrastructure.sql`

3. Click "Run" to execute the SQL

4. Verify tables created:
   - Go to Table Editor
   - Should see: `file_metadata` and `deployment_log`

### 1.2 Verify Storage Bucket

1. Go to Storage → Buckets
2. Verify `notf` bucket exists
3. Check that it's set to **public** (for read access)

## Step 2: Upload Files to Supabase

### 2.1 Get Your Service Role Key

1. Go to Project Settings → API
2. Copy the **service_role** key (⚠️ keep this secret!)
3. Do NOT use the anon key for this step

### 2.2 Install Python Dependencies

```bash
cd /Users/sathya/Documents/GitHub/notf
pip install requests pyyaml
```

### 2.3 Run the Sync Script

```bash
export SUPABASE_SERVICE_KEY='your-service-role-key-here'
python3 scripts/sync-to-supabase.py
```

This will:
- Upload all 53 solution provider YAML files
- Upload all 66 community MD files
- Parse and populate the `file_metadata` table

### 2.4 Verify Upload

1. Go to Storage → notf bucket
2. Should see folders:
   - `solution-providers/` (53 files)
   - `communities/bengaluru/` (66 files)

3. Go to Table Editor → file_metadata
4. Should see 119 rows (53 + 66)

## Step 3: Setup Vercel Deploy Hook

### 3.1 Create Deploy Hook in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: notf-one
3. Go to Settings → Git → Deploy Hooks
4. Click "Create Hook"
   - Name: `supabase-auto-deploy`
   - Branch: `main`
5. Copy the generated URL (looks like: `https://api.vercel.com/v1/integrations/deploy/...`)

### 3.2 Get Your Supabase Anon Key

1. Go to Supabase Project Settings → API
2. Copy the **anon/public** key

## Step 4: Install Supabase CLI (Optional but Recommended)

```bash
# macOS
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

## Step 5: Deploy Edge Function

### 5.1 Link Your Project

```bash
cd /Users/sathya/Documents/GitHub/notf
supabase link --project-ref abblyaukkoxmgzwretvm
```

### 5.2 Set Function Secrets

```bash
supabase secrets set VERCEL_DEPLOY_HOOK_URL='your-vercel-hook-url'
supabase secrets set SUPABASE_URL='https://abblyaukkoxmgzwretvm.supabase.co'
supabase secrets set SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'
```

### 5.3 Deploy the Edge Function

```bash
supabase functions deploy trigger-vercel-deploy
```

### 5.4 Create Database Webhook

1. Go to Supabase Dashboard → Database → Webhooks
2. Click "Create a new hook"
3. Configure:
   - **Name**: `trigger-deploy-on-file-change`
   - **Table**: `file_metadata`
   - **Events**: `INSERT`, `UPDATE`, `DELETE`
   - **Type**: `Supabase Edge Function`
   - **Edge Function**: `trigger-vercel-deploy`
4. Click "Create webhook"

## Step 6: Update Website Code

### 6.1 Install Supabase JS Client

```bash
cd /Users/sathya/Documents/GitHub/notf/website
npm install @supabase/supabase-js
```

### 6.2 Update Eleventy Config

Edit `.eleventy.js` to use the new loader:

```javascript
// Change this line:
const { loadMembers, loadCommunities, loadSolutionProviders } = require('./load-data.js');

// To this:
const { loadMembers, loadCommunities, loadSolutionProviders } = require('./load-data-supabase.js');
```

## Step 7: Add Environment Variables to Vercel

### 7.1 Add Supabase Credentials

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables

2. Add these variables (for **all environments**: Production, Preview, Development):

   ```
   SUPABASE_URL = https://abblyaukkoxmgzwretvm.supabase.co
   SUPABASE_ANON_KEY = your-anon-key-here
   ```

3. Click "Save"

## Step 8: Test and Deploy

### 8.1 Test Local Build

```bash
cd /Users/sathya/Documents/GitHub/notf/website
export SUPABASE_URL='https://abblyaukkoxmgzwretvm.supabase.co'
export SUPABASE_ANON_KEY='your-anon-key'
npm run build
```

Should see: "✅ Loaded data from Supabase"

### 8.2 Commit and Push

```bash
cd /Users/sathya/Documents/GitHub/notf
git add .
git commit -m "Integrate Supabase: Fetch data from Supabase Storage

- Add Supabase data loader
- Create Edge Function for auto-deployment
- Add sync script for uploading files
- Update build process to use Supabase"

git push origin main
```

### 8.3 Verify Deployment

1. Watch deployment at Vercel Dashboard
2. Once complete, visit: https://notf-one.vercel.app
3. Verify that communities and solution providers load correctly

## Step 9: Test Auto-Deployment

### 9.1 Update a File via Supabase

1. Go to Table Editor → file_metadata
2. Select any row
3. Click "Edit"
4. Modify the `metadata` field (e.g., change name)
5. Click "Save"

### 9.2 Verify Deployment Triggered

1. Check Table Editor → deployment_log
2. Should see a new row with status `triggered`
3. Check Vercel Dashboard → Deployments
4. Should see a new deployment started

### 9.3 Verify Changes Live

Once deployment completes, visit the website and verify the changes appear.

## Managing Files

### Option A: Via Supabase Dashboard (Easiest)

**To Update a File:**
1. Table Editor → file_metadata
2. Find the row
3. Edit the `metadata` JSONB field
4. Save → Auto-deploys!

**To Add a New File:**
1. Upload file to Storage → notf bucket
2. Insert row in file_metadata table
3. Save → Auto-deploys!

**To Delete a File:**
1. Table Editor → file_metadata
2. Delete the row
3. Optionally delete from Storage
4. Save → Auto-deploys!

### Option B: Via API (Programmatic)

Use the Supabase REST API or client libraries to perform CRUD operations.

Example (JavaScript):
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Update metadata
await supabase
  .from('file_metadata')
  .update({ metadata: { name: 'New Name', ... } })
  .eq('slug', 'organization-slug')
```

### Option C: Re-run Sync Script

To bulk update from local files:
```bash
python3 scripts/sync-to-supabase.py
```

## Troubleshooting

### Build Fails with "Supabase not initialized"

- Check Vercel environment variables are set
- Verify SUPABASE_ANON_KEY is correct
- Check Supabase project is not paused

### Deployment Not Triggering

- Verify webhook is created in Database → Webhooks
- Check Edge Function logs in Supabase Dashboard
- Verify VERCEL_DEPLOY_HOOK_URL is set correctly
- Check deployment_log table for errors

### Data Not Loading

- Run SQL: `SELECT * FROM get_active_solution_providers();`
- Check RLS policies are correct
- Verify file_metadata table has data
- Check functions have proper permissions

## Rollback Plan

If you need to rollback to local file loading:

1. Edit `.eleventy.js`:
   ```javascript
   const { loadMembers, loadCommunities, loadSolutionProviders } = require('./load-data.js');
   ```

2. Commit and push

The website will fall back to loading from local `/data` directory.

## Security Notes

- ⚠️  **Never commit** the service_role key to GitHub
- ✅ The anon key is safe for client-side use
- ✅ Row Level Security (RLS) protects data access
- ✅ Storage bucket is public for read, protected for write

## Next Steps

Once setup is complete:
1. Remove YAML files from GitHub (optional, for security)
2. Update `.gitignore` to exclude `/data` directory
3. Create admin UI for easier file management (future enhancement)
4. Add file versioning and history tracking (future enhancement)

## Support

If you encounter issues:
1. Check Supabase logs: Dashboard → Logs
2. Check Vercel logs: Dashboard → Deployments → View Function Logs
3. Check GitHub Issues: urbanmorph/notf
