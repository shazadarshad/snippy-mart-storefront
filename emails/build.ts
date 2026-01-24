import { render } from '@react-email/components';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { OrderConfirmationEmail } from './OrderConfirmation';
import OrderDelivered from './OrderDelivered';
import PaymentRejected from './PaymentRejected';
import StatusUpdate from './StatusUpdate';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildAllTemplates() {
    console.log('🎨 Building ALL email templates...\n');

    // Define all templates with their props
    const templates = [
        {
            key: 'order_confirmation',
            name: 'Order Confirmation',
            subject: '✅ Order Confirmed - Snippy Mart #{{order_id}}',
            component: OrderConfirmationEmail({
                customerName: '{{customer_name}}',
                orderId: '{{order_id}}',
                total: '{{total}}',
                items: '{{items}}',
                paymentMethod: '{{payment_method}}',
            }),
            description: 'Sent immediately after customer places an order',
            variables: '["customer_name", "order_id", "total", "items", "payment_method", "logo_url"]',
        },
        {
            key: 'order_delivered',
            name: 'Order Delivered',
            subject: '🎉 Your Order Has Been Delivered - {{order_id}}',
            component: OrderDelivered({
                customerName: '{{customer_name}}',
                orderId: '{{order_id}}',
                deliveryDate: '{{delivery_date}}',
                deliveryAddress: '{{delivery_address}}',
                trackingNumber: '{{tracking_number}}',
            }),
            description: 'Sent when order status changes to completed/delivered',
            variables: '["customer_name", "order_id", "delivery_date", "delivery_address", "tracking_number", "logo_url"]',
        },
        {
            key: 'payment_rejected',
            name: 'Payment Rejected',
            subject: '⚠️ Payment Issue - Action Required for {{order_id}}',
            component: PaymentRejected({
                customerName: '{{customer_name}}',
                orderId: '{{order_id}}',
                rejectionReason: '{{rejection_reason}}',
                orderTotal: '{{order_total}}',
                retryUrl: '{{retry_url}}',
            }),
            description: 'Sent when payment is declined or rejected',
            variables: '["customer_name", "order_id", "rejection_reason", "order_total", "retry_url", "logo_url"]',
        },
        {
            key: 'status_update',
            name: 'Status Update',
            subject: '📦 Order Update - {{order_id}}',
            component: StatusUpdate({
                customerName: '{{customer_name}}',
                orderId: '{{order_id}}',
                currentStatus: '{{current_status}}',
                statusMessage: '{{status_message}}',
                estimatedDelivery: '{{estimated_delivery}}',
                trackingUrl: '{{tracking_url}}',
            }),
            description: 'Sent when order status changes (processing, shipped, etc)',
            variables: '["customer_name", "order_id", "current_status", "status_message", "estimated_delivery", "tracking_url", "logo_url"]',
        },
    ];

    // Generate SQL for all templates
    let sqlStatements = `-- ═══════════════════════════════════════════════════════════════════════════
-- SNIPPY MART - COMPLETE EMAIL TEMPLATE SUITE
-- Modern React Email • Lucide Icons • Glassmorphism • Mobile Responsive
-- Generated: ${new Date().toISOString()}
-- ═══════════════════════════════════════════════════════════════════════════

`;

    for (const template of templates) {
        console.log(`📧 Rendering ${template.name}...`);
        let html = await render(template.component);

        // Strip invisible unicode characters that cause SQL errors
        html = html.replace(/[\u200B-\u200D\u2060\uFEFF]/g, ''); // Zero-width spaces
        html = html.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Control characters

        // Use dollar-quoted strings to avoid escaping issues
        sqlStatements += `
-- ${template.name.toUpperCase()}
INSERT INTO email_templates (template_key, name, subject, html_content, description, variables, is_active)
VALUES 
(
    '${template.key}', 
    '${template.name}', 
    '${template.subject}',
    $$${html}$$,
    '${template.description}',
    '${template.variables}'::jsonb,
    true
)
ON CONFLICT (template_key) DO UPDATE 
SET subject = EXCLUDED.subject, 
    html_content = EXCLUDED.html_content, 
    variables = EXCLUDED.variables,
    description = EXCLUDED.description,
    updated_at = NOW();

`;
        console.log(`✅ ${template.name} rendered successfully`);
    }

    // Write SQL file
    const sqlPath = join(__dirname, '../supabase/migrations/20260124_all_email_templates.sql');
    writeFileSync(sqlPath, sqlStatements);

    console.log('\n✅ ALL EMAIL TEMPLATES BUILT SUCCESSFULLY!');
    console.log(`📄 SQL migration: ${sqlPath}`);
    console.log('\n📝 Next steps:');
    console.log('1. Copy the ENTIRE SQL file content');
    console.log('2. Run it in Supabase SQL Editor');
    console.log('3. All 4 templates will be deployed at once');
    console.log('4. Test by placing an order\n');
}

buildAllTemplates().catch(console.error);
