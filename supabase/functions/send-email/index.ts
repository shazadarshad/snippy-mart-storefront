import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
    to: string;
    subject?: string;
    html?: string;
    templateId?: string;
    variables?: Record<string, string>;
    orderId?: string;
    isPreview?: boolean;
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const body: EmailRequest = await req.json();
        const { to, subject, html, templateId, variables = {}, orderId, isPreview } = body;

        console.log(`[send-email] Request received for: ${to}`);
        console.log(`[send-email] Template ID: ${templateId || 'none (custom email)'}`);
        console.log(`[send-email] Order ID: ${orderId || 'none'}`);

        // Get email settings
        console.log(`[send-email] Fetching email settings...`);
        const { data: settings, error: settingsError } = await supabase
            .from("email_settings")
            .select("*")
            .single();

        if (settingsError) {
            console.error(`[send-email] Settings error:`, settingsError);
            return new Response(
                JSON.stringify({ error: `Email settings error: ${settingsError.message}` }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!settings?.is_configured) {
            console.error(`[send-email] Email not configured!`);
            return new Response(
                JSON.stringify({ error: "Email not configured. Please set up SMTP in admin panel." }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`[send-email] ✅ Email settings found: ${settings.smtp_host}:${settings.smtp_port}`);

        let emailSubject = subject || "";
        let emailHtml = html || "";

        // If templateId provided, fetch template
        if (templateId) {
            console.log(`[send-email] Fetching template with ID: ${templateId}...`);
            const { data: template, error: templateError } = await supabase
                .from("email_templates")
                .select("*")
                .eq("id", templateId)
                .single();

            if (templateError) {
                console.error(`[send-email] Error fetching template:`, templateError);
                return new Response(
                    JSON.stringify({ error: `Template fetch error: ${templateError.message}` }),
                    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            if (!template) {
                console.error(`[send-email] Template not found with ID: ${templateId}`);
                return new Response(
                    JSON.stringify({ error: "Template not found" }),
                    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            console.log(`[send-email] ✅ Template found: ${template.name}`);
            emailSubject = template.subject;
            emailHtml = template.html_content;

            // Replace variables
            console.log(`[send-email] Replacing ${Object.keys(variables).length} variables...`);
            for (const [key, value] of Object.entries(variables)) {
                const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
                emailSubject = emailSubject.replace(regex, value);
                emailHtml = emailHtml.replace(regex, value);
            }

            // If preview, add sample data
            if (isPreview) {
                emailHtml = emailHtml
                    .replace(/\{\{customer_name\}\}/g, "John Doe")
                    .replace(/\{\{order_id\}\}/g, "ORD-PREVIEW")
                    .replace(/\{\{total\}\}/g, "$29.99")
                    .replace(/\{\{product_name\}\}/g, "Sample Product")
                    .replace(/\{\{items\}\}/g, "<div>Sample Item - $14.99</div>")
                    .replace(/\{\{credentials\}\}/g, "Email: sample@example.com<br>Password: SamplePass123")
                    .replace(/\{\{expiry_date\}\}/g, "December 31, 2026")
                    .replace(/\{\{status\}\}/g, "Processing")
                    .replace(/\{\{message\}\}/g, "This is a preview email.");

                emailSubject = emailSubject
                    .replace(/\{\{.*?\}\}/g, "PREVIEW");
            }
        }

        // Create SMTP client
        console.log(`[send-email] Creating SMTP client for ${settings.smtp_host}:${settings.smtp_port} (TLS: ${settings.smtp_secure})...`);
        const client = new SMTPClient({
            connection: {
                hostname: settings.smtp_host,
                port: settings.smtp_port,
                tls: settings.smtp_secure,
                auth: {
                    username: settings.smtp_user,
                    password: settings.smtp_password,
                },
            },
        });

        try {
            // Send email
            console.log(`[send-email] Sending email to ${to}...`);
            console.log(`[send-email] Subject: ${emailSubject}`);
            await client.send({
                from: `${settings.from_name} <${settings.from_email}>`,
                to: to,
                replyTo: settings.reply_to_email || settings.from_email,
                subject: emailSubject,
                content: "Please view this email in an HTML-compatible email client.",
                html: emailHtml,
            });
            console.log(`[send-email] ✅ Email sent successfully to ${to}`);
        } finally {
            try {
                await client.close();
            } catch (e) {
                console.error("Error closing SMTP client:", e);
            }
        }

        // Log email
        await supabase.from("email_logs").insert({
            order_id: orderId || null,
            template_key: templateId ? "template" : "custom",
            to_email: to,
            subject: emailSubject,
            status: "sent",
            sent_at: new Date().toISOString(),
        });

        return new Response(
            JSON.stringify({ success: true, message: "Email sent successfully" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : (typeof error === 'string' ? error : JSON.stringify(error));
        console.error("Email error:", errorMsg);

        // Log failed email
        try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY")!;
            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            // Use the already parsed body if available, or try to parse again safely
            let bodyToLog = body;
            if (!bodyToLog) {
                try {
                    bodyToLog = await req.clone().json();
                } catch {
                    bodyToLog = { to: "unknown" };
                }
            }

            await supabase.from("email_logs").insert({
                to_email: bodyToLog.to || "unknown",
                subject: bodyToLog.subject || "unknown",
                status: "failed",
                error_message: errorMsg,
            });
        } catch (e: any) {
            console.error("Failed to log email error:", e);
        }

        return new Response(
            JSON.stringify({ error: errorMsg }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
