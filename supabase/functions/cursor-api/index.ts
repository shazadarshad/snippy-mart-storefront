import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
        let email: string | undefined;

        // Only parse body if method is POST/PUT
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            try {
                const body = await req.json()
                email = body.email
            } catch (e) {
                // Body parsing failed or empty
                console.warn("Body parsing failed:", e)
            }
        }

        // For GET requests, maybe allow query param?
        if (!email && url.searchParams.has('email')) {
            email = url.searchParams.get('email') || undefined;
        }

        // Email is required for most routes except 'config'
        if (!email && !url.pathname.includes('/config')) {
            return new Response(JSON.stringify({ error: 'Email is required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        }

        let result;

        // Route: /restore
        if (url.pathname.includes('/restore')) {
            console.log("Restoring:", email);
            const { data, error } = await supabase.rpc('claim_invite_transaction', { user_email: email })
            if (error) {
                console.error("RPC Error:", error);
                throw error;
            }
            result = data

            // Log result for debugging
            // console.log("Restore Result:", result);

            // Handle custom error codes from RPC
            // Handle custom error codes from RPC
            if (result?.error) {
                const status = result.error === 'maintenance_mode' ? 503 :
                    result.error === 'no_invites_available' ? 503 :
                        result.error === 'already_active' ? 409 : 400;

                const body = {
                    ...result,
                    message: result.error === 'no_invites_available'
                        ? `No invites found (Active in DB: ${result.debug_count ?? '?'})`
                        : result.error
                };

                return new Response(JSON.stringify(body), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: status
                })
            }
        }

        // Route: /removed
        else if (url.pathname.includes('/removed')) {
            // console.log("Removing user:", email)
            const { data, error } = await supabase.rpc('handle_user_removal_transaction', { user_email: email })
            if (error) throw error
            result = data
        }

        // Route: /joined
        else if (url.pathname.includes('/joined')) {
            const { data, error } = await supabase.rpc('handle_invite_joined', { user_email: email })
            if (error) throw error
            result = data
        }

        // Route: /failed (Invites Expired/Revoked)
        else if (url.pathname.includes('/failed')) {
            let reason = 'unknown';
            try {
                const body = await req.json();
                if (body.reason) reason = body.reason;
            } catch (e) { }

            const { data, error } = await supabase.rpc('handle_invite_failure_transaction', { user_email: email, reason: reason })
            if (error) throw error
            result = data
        }

        // Route: /status
        else if (url.pathname.includes('/status')) {
            const { data, error } = await supabase.rpc('get_cursor_user_details', { user_email: email })
            if (error) throw error
            result = data
        }

        // Route: /config (Remote Extension Updates & Version Control)
        else if (url.pathname.includes('/config')) {
            const { data, error } = await supabase
                .from('cursor_system_settings')
                .select('key, value')
                .in('key', ['extension_config', 'extension_min_version', 'extension_latest_version', 'extension_download_url']);

            if (error) throw error;

            // Map to object
            const settings = {};
            data.forEach(row => settings[row.key] = row.value);

            result = {
                config: JSON.parse(settings['extension_config'] || '{}'),
                version: {
                    min: settings['extension_min_version'] || '1.0.0',
                    latest: settings['extension_latest_version'] || '1.0.0',
                    download_url: settings['extension_download_url'] || '#'
                }
            };
        }

        // Route: /ping (Health Check)
        else if (url.pathname.includes('/ping')) {
            result = { pong: true, time: new Date().toISOString() };
        }

        else {
            return new Response("Not Found", { status: 404 })
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error("Handler Error:", error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
