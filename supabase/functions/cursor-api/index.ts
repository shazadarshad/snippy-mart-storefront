import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const url = new URL(req.url)
        const { email } = await req.json()

        if (!email) {
            throw new Error('Email is required')
        }

        let result;

        // Route: /restore
        if (url.pathname.includes('/restore')) {
            const { data, error } = await supabase.rpc('claim_invite_transaction', { user_email: email })
            if (error) throw error
            result = data

            // Handle custom error codes from RPC
            if (result?.error) {
                return new Response(JSON.stringify(result), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: result.error === 'maintenance_mode' ? 503 : 409
                })
            }
        }

        // Route: /removed
        else if (url.pathname.includes('/removed')) {
            console.log("Removing user:", email)
            const { data, error } = await supabase.rpc('handle_user_removal_transaction', { user_email: email })
            if (error) throw error
            result = data
        }

        // Route: /joined
        else if (url.pathname.includes('/joined')) {
            const { data, error } = await supabase.rpc('handle_invite_joined', { user_email: email })
            if (error) throw error
            result = data
        } else {
            return new Response("Not Found", { status: 404 })
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
