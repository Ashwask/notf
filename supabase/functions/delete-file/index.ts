import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteFileRequest {
  file_path: string
  file_type: 'community' | 'solution-provider'
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
        version: '1.0',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }

  try {
    // Create Supabase admin client with service role for database operations
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

    // Create client with anon key for user JWT validation
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') ?? ''
          }
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
        const { data: { user: authUser }, error: authError } = await supabaseAnon.auth.getUser()
        if (!authError && authUser) {
          user = authUser
          console.log(`Authenticated user: ${user.email}`)
        }
      } catch (authErr) {
        console.log('Auth check error:', authErr)
      }
    }

    // Parse request body
    const { file_path, file_type }: DeleteFileRequest = await req.json()

    console.log(`Deleting file: ${file_path}`)

    // Delete file from Storage
    const { error: deleteError } = await supabaseAdmin
      .storage
      .from('notf')
      .remove([file_path])

    if (deleteError) {
      console.error('Storage delete error:', deleteError)
      throw new Error(`Failed to delete file from storage: ${deleteError.message}`)
    } else {
      console.log(`File deleted from storage: ${file_path}`)
    }

    // Delete from database
    const { error: dbError } = await supabaseAdmin
      .from('file_metadata')
      .delete()
      .eq('file_path', file_path)

    if (dbError) {
      throw new Error(`Failed to delete database record: ${dbError.message}`)
    }

    console.log(`Database record deleted for ${file_path}`)

    return new Response(
      JSON.stringify({
        success: true,
        file_path,
        message: 'File and database record deleted successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error deleting file:', error)

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
