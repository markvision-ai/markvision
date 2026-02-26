// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: policies } = await supabaseClient.rpc('execute_sql', {
            sql_query: "SELECT tablename, policyname, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clients_config';"
        }).catch(e => ({ data: null, error: e }));

        // Fallback if rpc fails
        const { data: tableInfo } = await supabaseClient.rpc('execute_sql', {
            sql_query: "SELECT relname, relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'clients_config';"
        }).catch(e => ({ data: null, error: e }));

        return new Response(JSON.stringify({ policies, tableInfo }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (e) {
        return new Response(e.message, { status: 500 })
    }
})
