import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parse as parseYAML, stringify as stringifyYAML } from 'https://deno.land/std@0.168.0/encoding/yaml.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdateFileRequest {
  file_path: string
  file_type: 'community' | 'solution-provider'
  updates: Record<string, any>
  markdown_body?: string  // For .md files only
  version?: number  // For optimistic locking
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Health check endpoint
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'ok',
        version: '3.0-auth-optional',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }

  try {
    // Create Supabase client with service role for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header for user tracking
    const authHeader = req.headers.get('Authorization')
    console.log('Authorization header:', authHeader ? 'present' : 'missing')

    // Try to get authenticated user (optional for now)
    let user = null
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(token)
        if (!authError && authUser) {
          user = authUser
          console.log(`Authenticated user: ${user.email}`)
        } else {
          console.log('Auth verification failed:', authError?.message)
        }
      } catch (authErr) {
        console.log('Auth check error:', authErr)
      }
    }

    // Continue without auth for now (TODO: make auth required after testing)
    console.log('Processing request', user ? `for user ${user.email}` : 'without auth')

    // Parse request body
    const { file_path, file_type, updates, markdown_body, version }: UpdateFileRequest = await req.json()

    console.log(`Updating file: ${file_path}`)

    // Determine file extension
    const isMarkdown = file_path.endsWith('.md')
    const isYAML = file_path.endsWith('.yaml') || file_path.endsWith('.yml')

    if (!isMarkdown && !isYAML) {
      throw new Error(`Unsupported file extension: ${file_path}`)
    }

    // Try to download current file from Storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('notf')
      .download(file_path)

    let currentData: Record<string, any> = {}
    let existingMarkdownBody = ''
    let fileExists = false

    if (!downloadError && fileData) {
      // File exists - parse it
      fileExists = true
      const currentContent = await fileData.text()

      // Parse file based on format
      if (isMarkdown) {
        // Parse YAML frontmatter + markdown body
        const result = parseMarkdownFile(currentContent)
        currentData = result.frontmatter
        existingMarkdownBody = result.body
      } else {
        // Parse pure YAML
        currentData = parseYAML(currentContent) as Record<string, any> || {}
      }
    } else {
      // File doesn't exist yet - this is a create operation
      console.log(`File doesn't exist yet, will create: ${file_path}`)
      currentData = {}
    }

    // Optimistic locking: Check version if provided
    if (version !== undefined && currentData.version !== version) {
      return new Response(
        JSON.stringify({
          error: 'Conflict detected',
          message: 'This file was modified by another user. Please refresh and try again.',
          currentVersion: currentData.version
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Merge updates with existing data (preserves unedited fields)
    const mergedData = mergeUpdates(currentData, updates)

    // Auto-update metadata
    mergedData.last_updated = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    mergedData.version = (currentData.version || 0) + 1

    // Regenerate file content
    let updatedContent: string

    if (isMarkdown) {
      // Use provided markdown_body or preserve existing
      const bodyToUse = markdown_body !== undefined ? markdown_body : existingMarkdownBody
      updatedContent = generateMarkdownFile(mergedData, bodyToUse)
    } else {
      updatedContent = stringifyYAML(mergedData)
    }

    // Upload updated file to Storage
    const { error: uploadError } = await supabaseClient
      .storage
      .from('notf')
      .upload(file_path, updatedContent, {
        contentType: isMarkdown ? 'text/markdown' : 'application/x-yaml',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    console.log(`File uploaded successfully: ${file_path}`)

    // Extract metadata for database
    const slug = file_path.split('/').pop()?.replace(/\.(md|yaml|yml)$/, '') || ''
    const city = file_path.includes('communities/') ? file_path.split('/')[1] : null

    // Build database update
    const dbUpdate: Record<string, any> = {
      slug,
      file_type,
      file_path,
      metadata: mergedData,
      status: mergedData.status || 'active',
      version: mergedData.version,
      updated_at: new Date().toISOString()
    }

    // Add user tracking if authenticated
    if (user) {
      dbUpdate.updated_by = user.id
      if (!fileExists) {
        dbUpdate.created_by = user.id
      }
    }

    // Add indexed fields
    if (city) dbUpdate.city = city
    // Note: neighborhood and ward are now stored as arrays in metadata.neighborhoods and metadata.wards
    if (mergedData.location?.latitude) dbUpdate.latitude = mergedData.location.latitude
    if (mergedData.location?.longitude) dbUpdate.longitude = mergedData.location.longitude

    // Upsert to database
    const { error: dbError } = await supabaseClient
      .from('file_metadata')
      .upsert(dbUpdate, {
        onConflict: 'file_path'
      })

    if (dbError) {
      throw new Error(`Failed to update database: ${dbError.message}`)
    }

    console.log(`Database updated successfully for ${slug}`)

    return new Response(
      JSON.stringify({
        success: true,
        file_path,
        slug,
        version: mergedData.version,
        message: 'File and database updated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error updating file:', error)

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

/**
 * Parse markdown file with YAML frontmatter
 */
function parseMarkdownFile(content: string): { frontmatter: Record<string, any>, body: string } {
  if (!content.startsWith('---')) {
    return { frontmatter: {}, body: content }
  }

  const parts = content.split('---', 3)
  if (parts.length < 3) {
    return { frontmatter: {}, body: content }
  }

  const yamlContent = parts[1]
  const body = parts[2]

  try {
    const frontmatter = parseYAML(yamlContent) as Record<string, any> || {}
    return { frontmatter, body }
  } catch (e) {
    console.error('YAML parse error:', e)
    return { frontmatter: {}, body: content }
  }
}

/**
 * Generate markdown file with YAML frontmatter
 */
function generateMarkdownFile(frontmatter: Record<string, any>, body: string): string {
  const yamlStr = stringifyYAML(frontmatter)
  return `---\n${yamlStr}---${body}`
}

/**
 * Merge updates with existing data (preserves unedited fields)
 */
function mergeUpdates(current: Record<string, any>, updates: Record<string, any>): Record<string, any> {
  const merged = { ...current }

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined) {
      // Don't overwrite with null/undefined
      continue
    }

    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      // Deep merge objects (e.g., elected_representatives, contact)
      if (typeof merged[key] === 'object' && !Array.isArray(merged[key]) && merged[key] !== null) {
        merged[key] = { ...merged[key], ...value }
      } else {
        merged[key] = value
      }
    } else {
      // Simple assignment for primitives and arrays
      merged[key] = value
    }
  }

  return merged
}
