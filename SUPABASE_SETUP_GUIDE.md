# NOTF Supabase Integration Setup Guide

This guide walks you through setting up Supabase for dynamic YAML file management with automatic Vercel deployments.

## Architecture Overview

```
┌─────────────────┐
│  Administrator  │
│   (You/Team)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         Supabase Dashboard              │
│  - Storage: YAML/MD files               │
│  - Database: file_metadata table        │
│  - Triggers: Auto-deployment on CRUD    │
└────────┬────────────────────────────────┘
         │
         │ (On file change)
         ▼
┌─────────────────────────────────────────┐
│    Supabase Edge Function               │
│  trigger-vercel-deploy                  │
│  - Logs change                          │
│  - Calls Vercel deploy hook             │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         Vercel                          │
│  - Rebuilds website                     │
│  - Fetches data from Supabase           │
│  - Deploys to production                │
└─────────────────────────────────────────┘
```

## Step 1: Get Supabase Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `abblyaukkoxmgzwretvm`
3. Click **Project Settings** (gear icon)
4. Go to **API** section
5. Copy the **service_role** key (⚠️ keep this secret!)

## Step 2: Set Up Database Structure

The database tables have already been created! You can verify by running:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('file_metadata', 'deployment_log');
```

Tables created:
- `file_metadata` - Stores metadata for all YAML/MD files
- `deployment_log` - Logs all deployment triggers

## Step 3: Upload Files to Supabase

Run the upload script with your service role key:

```bash
cd /Users/sathya/Documents/GitHub/notf/scripts

# Set your service role key
export SUPABASE_SERVICE_KEY='your-service-role-key-here'

# Run the upload script
python3 upload-and-sync-supabase.py
```

This will:
- ✅ Upload 53 solution provider YAML files
- ✅ Upload 66 community Markdown files
- ✅ Populate the `file_metadata` table
- ✅ Create placeholder directories for other cities

## Step 4: Get Vercel Deploy Hook

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **notf**
3. Go to **Settings** → **Git**
4. Scroll to **Deploy Hooks**
5. Click **Create Hook**
   - Name: `Supabase File Change`
   - Branch: `main`
6. Copy the generated webhook URL

## Step 5: Deploy Supabase Edge Function

### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref abblyaukkoxmgzwretvm

# Set environment variables
supabase secrets set VERCEL_DEPLOY_HOOK='your-vercel-hook-url'

# Deploy the Edge Function
supabase functions deploy trigger-vercel-deploy
```

### Option B: Using Supabase Dashboard

1. Go to **Edge Functions** in Supabase Dashboard
2. Click **Create a new function**
3. Name: `trigger-vercel-deploy`
4. Copy the code from `/supabase/functions/trigger-vercel-deploy/index.ts`
5. Set environment variables:
   - `VERCEL_DEPLOY_HOOK` = your Vercel hook URL
6. Deploy

## Step 6: Create Database Webhook

We need to trigger the Edge Function when files change.

Run this SQL in Supabase SQL Editor:

```sql
-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to call Edge Function on file changes
CREATE OR REPLACE FUNCTION notify_file_change()
RETURNS TRIGGER AS $$
DECLARE
    operation_type TEXT;
    edge_function_url TEXT;
BEGIN
    -- Determine operation
    IF TG_OP = 'INSERT' THEN
        operation_type := 'create';
    ELSIF TG_OP = 'UPDATE' THEN
        operation_type := 'update';
    ELSIF TG_OP = 'DELETE' THEN
        operation_type := 'delete';
    END IF;

    -- Edge Function URL
    edge_function_url := 'https://abblyaukkoxmgzwretvm.supabase.co/functions/v1/trigger-vercel-deploy';

    -- Call Edge Function asynchronously
    PERFORM net.http_post(
        url := edge_function_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
            'operation', operation_type,
            'file_path', COALESCE(NEW.file_path, OLD.file_path),
            'file_type', COALESCE(NEW.file_type, OLD.file_type)
        )
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_on_insert ON public.file_metadata;
CREATE TRIGGER trigger_notify_on_insert
    AFTER INSERT ON public.file_metadata
    FOR EACH ROW
    EXECUTE FUNCTION notify_file_change();

DROP TRIGGER IF EXISTS trigger_notify_on_update ON public.file_metadata;
CREATE TRIGGER trigger_notify_on_update
    AFTER UPDATE ON public.file_metadata
    FOR EACH ROW
    WHEN (OLD.metadata IS DISTINCT FROM NEW.metadata)
    EXECUTE FUNCTION notify_file_change();

DROP TRIGGER IF EXISTS trigger_notify_on_delete ON public.file_metadata;
CREATE TRIGGER trigger_notify_on_delete
    AFTER DELETE ON public.file_metadata
    FOR EACH ROW
    EXECUTE FUNCTION notify_file_change();
```

## Step 7: Update Website to Use Supabase

Replace the current `load-data.js` with the Supabase version:

```bash
cd /Users/sathya/Documents/GitHub/notf/website
mv load-data.js load-data-filesystem.js.backup
mv load-data-supabase.js load-data.js
```

## Step 8: Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **notf**
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `SUPABASE_URL` | `https://abblyaukkoxmgzwretvm.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | (from Supabase Dashboard → API) | Production, Preview, Development |
| `DATA_SOURCE` | `supabase` | Production, Preview, Development |

## Step 9: Deploy and Test

### Commit and Push Changes

```bash
cd /Users/sathya/Documents/GitHub/notf

git add .
git commit -m "Add Supabase integration with auto-deployment

- Create database tables for file metadata
- Add Edge Function for Vercel webhook
- Update load-data.js to fetch from Supabase
- Add upload scripts and documentation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push origin main
```

### Test the Workflow

1. **Manual deployment test:**
   - Go to Vercel dashboard
   - Check that the new deployment uses Supabase data

2. **CRUD operation test:**
   - Go to Supabase Dashboard → Table Editor
   - Open `file_metadata` table
   - Edit a record (change `metadata` field)
   - Check `deployment_log` table for new entry
   - Wait 1-2 minutes
   - Verify new Vercel deployment triggered

3. **File upload test:**
   - Upload a new YAML file to Supabase Storage
   - Add corresponding entry to `file_metadata` table
   - Verify automatic deployment

## Managing Files

### Adding a New Solution Provider

1. Go to Supabase Dashboard → Storage → `notf` bucket
2. Upload YAML file to `solution-providers/` folder
3. Go to Table Editor → `file_metadata`
4. Click **Insert** → **Insert row**
5. Fill in:
   ```
   file_path: solution-providers/new-org.yaml
   file_type: solution-provider
   slug: new-org
   status: active
   metadata: { "name": "Organization Name", "type": "solution-provider", ... }
   ```
6. Save → Website automatically rebuilds!

### Editing an Organization

1. Go to Table Editor → `file_metadata`
2. Find the record
3. Edit the `metadata` JSON field
4. Save → Automatic deployment!

### Deleting an Organization

**Option 1: Soft Delete (Recommended)**
1. Set `status` to `archived`
2. Organization hidden from website

**Option 2: Hard Delete**
1. Delete row from `file_metadata`
2. Delete file from Storage
3. Automatic deployment triggered

## Troubleshooting

### Files Not Loading

Check:
1. Vercel environment variables set correctly
2. `DATA_SOURCE=supabase` in Vercel
3. Supabase anon key is valid
4. RLS policies allow public read access

### Deployment Not Triggering

Check:
1. Edge Function deployed successfully
2. Vercel deploy hook URL correct
3. `deployment_log` table for error messages
4. Database triggers created

### Build Fails

1. Check Vercel build logs
2. Verify Supabase connection works
3. Test with `DATA_SOURCE=filesystem` as fallback

## Benefits of This Setup

✅ **No GitHub commits needed** - Update files via Supabase Dashboard
✅ **Automatic deployments** - Changes trigger rebuilds instantly
✅ **Version control** - All changes logged in database
✅ **Easy management** - Non-technical admins can update content
✅ **Secure** - Service keys not in public repo
✅ **Fallback** - Can switch to filesystem if needed
✅ **Audit trail** - Track who changed what and when

## Next Steps

1. Create admin UI for easier file management
2. Add file validation before deployment
3. Implement preview deployments for pending changes
4. Set up notifications for deployment failures
5. Create backup system for file versions
