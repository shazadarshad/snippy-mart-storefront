import { render } from '@react-email/components';
import { OrderConfirmationEmail } from './OrderConfirmation';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Render email to HTML
const renderEmailTemplate = async () => {
    const html = render(
        OrderConfirmationEmail({
            customerName: '{{customer_name}}',
            orderId: '{{order_id}}',
            total: '{{total}}',
            items: '{{items}}',
            paymentMethod: '{{payment_method}}',
        })
    );

    // Generate SQL migration
    const sql = `-- ═══════════════════════════════════════════════════════════════════════════
-- SNIPPY MART - REACT EMAIL TEMPLATES v5.0
-- Modern Lucide Icons • Glassmorphism • TypeScript/React
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO email_templates (template_key, name, subject, html_content, description, variables, is_active)
VALUES 
(
    'order_confirmation', 
    'Order Confirmation', 
    '✅ Order Confirmed - Snippy Mart #{{order_id}}',
    '${html.replace(/'/g, "''")}',
    'Sent immediately after customer places an order. Built with React Email and modern Lucide-style icons.',
    '["customer_name", "order_id", "total", "items", "payment_method"]'::jsonb,
    true
)
ON CONFLICT (template_key) DO UPDATE 
SET subject = EXCLUDED.subject, 
    html_content = EXCLUDED.html_content, 
    variables = EXCLUDED.variables,
    description = EXCLUDED.description;
`;

    // Write SQL migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20260124_react_email_templates.sql');
    writeFileSync(migrationPath, sql);

    console.log('✅ Email template rendered successfully!');
    console.log(`📄 Migration file created: ${migrationPath}`);
    console.log('\n📧 Preview the email by running: npm run email:dev');
};

renderEmailTemplate().catch(console.error);
