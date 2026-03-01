import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { query } = await req.json()

        console.log('Executing debug query:', query)

        const { data, error } = await supabaseClient.rpc('exec_sql', { sql_text: query })

        return new Response(JSON.stringify({ data, error }), {
            headers: { 'Content-Type': 'application/json' },
            status: error ? 400 : 200,
        })
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
