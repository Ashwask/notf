// Supabase Edge Function to trigger Vercel deployment on file changes
// Deploy this function using: supabase functions deploy trigger-vercel-deploy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VERCEL_DEPLOY_HOOK_URL = Deno.env.get('VERCEL_DEPLOY_HOOK_URL')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    )

    // Parse incoming request
    const { type, table, record, old_record } = await req.json()

    console.log('File change detected:', { type, table, record })

    // Only trigger deployment for file_metadata changes
    if (table !== 'file_metadata') {
      return new Response(
        JSON.stringify({ message: 'Not a file_metadata change' }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Trigger Vercel deployment
    const deployResponse = await fetch(VERCEL_DEPLOY_HOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trigger: 'supabase-file-change',
        metadata: {
          operation: type,
          file_path: record?.file_path || old_record?.file_path,
          timestamp: new Date().toISOString()
        }
      })
    })

    const deployData = await deployResponse.json()

    // Update deployment_log table
    await supabase
      .from('deployment_log')
      .insert({
        trigger_type: type,
        file_path: record?.file_path || old_record?.file_path,
        deployment_status: deployResponse.ok ? 'triggered' : 'failed',
        vercel_deployment_id: deployData.job?.id,
        vercel_deployment_url: deployData.job?.url,
        error_message: deployResponse.ok ? null : JSON.stringify(deployData)
      })

    return new Response(
      JSON.stringify({
        success: true,
        deployment: deployData,
        message: 'Vercel deployment triggered'
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error triggering deployment:', error)

    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
