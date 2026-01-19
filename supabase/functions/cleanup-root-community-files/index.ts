import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * One-time cleanup script: Deletes all MD/YAML files from root communities/ folder
 * Files should be in communities/<city>/ subfolders instead
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse request body for options
    const body = req.method === 'POST' ? await req.json() : {}
    const dryRun = body.dry_run !== false // Default to dry run for safety

    console.log(`Starting cleanup (dry_run=${dryRun})...`)

    const results = {
      deleted: 0,
      errors: [],
      files: []
    }

    // List all files in root communities folder
    const { data: files, error: listError } = await supabaseAdmin
      .storage
      .from('notf')
      .list('communities', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (listError) {
      throw new Error(`Failed to list files: ${listError.message}`)
    }

    // Filter for MD/YAML files only (not folders)
    const filesToDelete = (files || []).filter(file =>
      file.name.endsWith('.md') ||
      file.name.endsWith('.yaml') ||
      file.name.endsWith('.yml')
    )

    console.log(`Found ${filesToDelete.length} files in root communities/ folder`)

    for (const file of filesToDelete) {
      const filePath = `communities/${file.name}`

      if (dryRun) {
        console.log(`[DRY RUN] Would delete: ${filePath}`)
        results.files.push({ path: filePath, status: 'would_delete' })
      } else {
        try {
          const { error: deleteError } = await supabaseAdmin
            .storage
            .from('notf')
            .remove([filePath])

          if (deleteError) {
            console.error(`Failed to delete ${filePath}:`, deleteError.message)
            results.errors.push({ path: filePath, error: deleteError.message })
          } else {
            console.log(`✓ Deleted ${filePath}`)
            results.deleted++
            results.files.push({ path: filePath, status: 'deleted' })
          }
        } catch (error) {
          console.error(`Error deleting ${filePath}:`, error.message)
          results.errors.push({ path: filePath, error: error.message })
        }
      }
    }

    console.log(`Cleanup complete: deleted=${results.deleted}, errors=${results.errors.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        dry_run: dryRun,
        results,
        message: dryRun
          ? `Dry run complete - found ${filesToDelete.length} files that would be deleted`
          : `Cleanup complete - deleted ${results.deleted} files`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Cleanup error:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
