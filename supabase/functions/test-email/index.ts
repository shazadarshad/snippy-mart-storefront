import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailBody {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_password: string;
    smtp_secure: boolean;
    from_email: string;
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const body: TestEmailBody = await req.json();

        // Create SMTP client
        const client = new SMTPClient({
            connection: {
                hostname: body.smtp_host,
                port: body.smtp_port,
                tls: body.smtp_secure,
                auth: {
                    username: body.smtp_user,
                    password: body.smtp_password,
                },
            },
        });

        // Try to connect and send a minimal test
        // This is a direct connection test
        await client.send({
            from: body.from_email,
            to: body.from_email, // Test send to self
            subject: "SMTP Connection Test",
            content: "Your SMTP settings are working correctly!",
            html: "<b>Success!</b> Your SMTP settings are working correctly.",
        });

        await client.close();

        return new Response(
            JSON.stringify({ success: true, message: "SMTP Connection verified successfully!" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : (typeof error === 'string' ? error : JSON.stringify(error));
        console.error("SMTP Test Error:", errorMsg);
        return new Response(
            JSON.stringify({ success: false, message: errorMsg }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
