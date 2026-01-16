// Supabase Edge Function to trigger Vercel deployment on file changes
// Deploy with: supabase functions deploy trigger-vercel-deploy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VERCEL_DEPLOY_HOOK = Deno.env.get('VERCEL_DEPLOY_HOOK')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { operation, file_path, file_type } = await req.json()

    console.log(`File changed: ${operation} on ${file_path} (${file_type})`)

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Log deployment trigger
    const { data: logEntry, error: logError } = await supabase
      .from('deployment_log')
      .insert({
        trigger_type: operation,
        file_path: file_path,
        deployment_status: 'triggered'
      })
      .select()
      .single()

    if (logError) {
      console.error('Failed to log deployment:', logError)
    }

    // Trigger Vercel deployment via deploy hook
    const vercelResponse = await fetch(VERCEL_DEPLOY_HOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const vercelData = await vercelResponse.json()

    // Update deployment log with Vercel response
    if (logEntry) {
      await supabase
        .from('deployment_log')
        .update({
          deployment_status: vercelResponse.ok ? 'success' : 'failed',
          vercel_deployment_id: vercelData.job?.id || null,
          vercel_deployment_url: vercelData.job?.url || null,
          completed_at: new Date().toISOString(),
          error_message: vercelResponse.ok ? null : JSON.stringify(vercelData)
        })
        .eq('id', logEntry.id)
    }

    if (!vercelResponse.ok) {
      throw new Error(`Vercel deployment failed: ${JSON.stringify(vercelData)}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Deployment triggered successfully',
        vercel_job: vercelData.job
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error triggering deployment:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
