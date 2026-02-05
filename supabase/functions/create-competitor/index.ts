import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Verify user is authenticated
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { projectId, platform, handle } = await req.json()

    if (!projectId || !platform || !handle) {
      throw new Error('Missing required fields')
    }

    // 2. Initialize admin client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Ensure user is project member
    const { data: member } = await supabaseAdmin
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!member) {
      // Fetch project to get organization_id
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('organization_id')
        .eq('id', projectId)
        .single()
      
      const memberPayload: any = {
        project_id: projectId,
        user_id: user.id,
        role: 'owner' // Default role
      }

      if (project?.organization_id) {
        memberPayload.organization_id = project.organization_id
      }

      const { error: joinError } = await supabaseAdmin
        .from('project_members')
        .insert([memberPayload])

      if (joinError) {
        console.error('Error joining project:', joinError)
        // We continue, as the error might be benign or we want to try inserting competitor anyway
      }
    }

    // 4. Insert competitor
    const { data, error } = await supabaseAdmin
      .from('competitor_monitoring')
      .insert([{
        project_id: projectId,
        platform,
        handle,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
