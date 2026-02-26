// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Ensure storage bucket exists
        const { error: bucketError } = await supabaseClient
            .storage
            .createBucket('ad-creatives', {
                public: true,
                allowedMimeTypes: ['image/png', 'image/jpeg', 'video/mp4'],
                fileSizeLimit: 52428800 // 50MB
            });

        // 2. Apply Policies via RPC 'exec_sql' if available, otherwise we assume the user applies migrations.
        // But we actually have 'exec_sql' in the DB (based on previous logs).
        const sql = `
            DO $$
            BEGIN
                -- Policies for storage.objects are trickier via RPC if they already exist, so we use IF NOT EXISTS logic
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to upload creatives') THEN
                    CREATE POLICY "Allow authenticated users to upload creatives" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ad-creatives');
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public to read creatives') THEN
                    CREATE POLICY "Allow public to read creatives" ON storage.objects FOR SELECT TO public USING (bucket_id = 'ad-creatives');
                END IF;
            END
            $$;
        `;

        const { error: sqlError } = await supabaseClient.rpc('exec_sql', { sql_text: sql });

        return new Response(JSON.stringify({
            success: true,
            bucketReady: !bucketError || bucketError.message.includes('already exists'),
            policiesApplied: !sqlError
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (e) {
        return new Response(e.message, { status: 500 })
    }
})
