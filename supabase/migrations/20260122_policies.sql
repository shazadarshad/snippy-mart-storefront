-- =====================================================
-- POLICIES MANAGEMENT SYSTEM
-- Allows admin to edit policy pages from the panel
-- =====================================================

-- Create policies table
CREATE TABLE IF NOT EXISTS public.policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    highlighted_word TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- Public can read active policies
CREATE POLICY "Anyone can view active policies"
    ON public.policies FOR SELECT
    USING (is_active = true);

-- Only admins can manage policies
CREATE POLICY "Only admins can insert policies"
    ON public.policies FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update policies"
    ON public.policies FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete policies"
    ON public.policies FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Grant permissions
GRANT SELECT ON public.policies TO anon;
GRANT ALL ON public.policies TO authenticated;

-- Insert default policies
INSERT INTO public.policies (policy_key, title, highlighted_word, description, content)
VALUES 
(
    'privacy_policy',
    'Privacy',
    'Policy',
    'Learn how Snippy Mart collects, uses, and protects your personal information.',
    '<h2>1. Information We Collect</h2>
<p>We collect information you provide directly to us when making purchases, including your name, WhatsApp number, email address, and payment information.</p>

<h2>2. How We Use Your Information</h2>
<p>We use the information we collect to:</p>
<ul>
<li>Process and fulfill your orders</li>
<li>Send you order confirmations and updates via WhatsApp and email</li>
<li>Provide customer support</li>
<li>Improve our services</li>
</ul>

<h2>3. Information Sharing</h2>
<p>We do not sell, trade, or otherwise transfer your personal information to third parties. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you.</p>

<h2>4. Data Security</h2>
<p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>

<h2>5. Cookies</h2>
<p>We use cookies to enhance your experience on our website. You can choose to disable cookies through your browser settings.</p>

<h2>6. Third-Party Links</h2>
<p>Our website may contain links to third-party sites. We are not responsible for the privacy practices of these sites.</p>

<h2>7. Changes to This Policy</h2>
<p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>

<h2>8. Contact Us</h2>
<p>If you have questions about this Privacy Policy, please contact us via WhatsApp at +94 78 776 7869.</p>'
),
(
    'terms_of_service',
    'Terms of',
    'Service',
    'Read the Terms and Conditions for using Snippy Mart services. By accessing our website, you agree to these terms.',
    '<h2>1. Terms</h2>
<p>By accessing this Website, accessible from https://snippymart.com, you are agreeing to be bound by these Website Terms and Conditions of Use and agree that you are responsible for the agreement with any applicable local laws. If you disagree with any of these terms, you are prohibited from accessing this site.</p>

<h2>2. Use License</h2>
<p>Permission is granted to temporarily download one copy of the materials on Snippy Mart''s Website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
<ul>
<li>Modify or copy the materials</li>
<li>Use the materials for any commercial purpose or for any public display</li>
<li>Attempt to reverse engineer any software contained on Snippy Mart''s Website</li>
<li>Remove any copyright or other proprietary notations from the materials</li>
<li>Transfer the materials to another person or "mirror" the materials on any other server</li>
</ul>

<h2>3. Disclaimer</h2>
<p>All the materials on Snippy Mart''s Website are provided "as is". Snippy Mart makes no warranties, may it be expressed or implied, therefore negates all other warranties.</p>

<h2>4. Limitations</h2>
<p>Snippy Mart or its suppliers will not be held accountable for any damages that will arise with the use or inability to use the materials on Snippy Mart''s Website.</p>

<h2>5. Revisions</h2>
<p>The materials appearing on Snippy Mart''s Website may include technical, typographical, or photographic errors. Snippy Mart may change the materials contained on its Website at any time without notice.</p>

<h2>6. Links</h2>
<p>Snippy Mart has not reviewed all of the sites linked to its Website and is not responsible for the contents of any such linked site.</p>

<h2>7. Modifications</h2>
<p>Snippy Mart may revise these Terms of Use for its Website at any time without prior notice.</p>

<h2>8. Privacy</h2>
<p>Please read our Privacy Policy for information about how we handle your data.</p>

<h2>9. Governing Law</h2>
<p>Any claim related to Snippy Mart''s Website shall be governed by the laws of Sri Lanka.</p>

<h2>10. Delivery Policy</h2>
<p>All digital subscription products purchased from Snippy Mart will be delivered within <strong>1 to 24 hours</strong> from the time of order confirmation. Delivery is completed when:</p>
<ul>
<li>Login credentials are sent to your registered WhatsApp number</li>
<li>Login credentials are sent to your email address (if provided)</li>
<li>Order status is updated to "Completed" in our system</li>
</ul>
<p>In rare cases of high demand or technical issues, delivery may take up to 48 hours. If you haven''t received your credentials within 24 hours, please contact our support team via WhatsApp.</p>'
),
(
    'refund_policy',
    'Refund',
    'Policy',
    'Understand our refund and return policies for digital subscriptions. We aim for 100% customer satisfaction.',
    '<h2>1. Digital Products Nature</h2>
<p>At Snippy Mart, we strive to ensure that our customers are 100% satisfied with our digital subscription services. Since your purchase is a digital product, it is deemed "used" after download or opening, and all purchases are generally non-refundable.</p>
<p><strong>However, we do provide refunds in specific exceptional cases.</strong></p>

<h2>2. Delivery Timeframe</h2>
<p>All orders are processed and delivered within <strong>1 to 24 hours</strong>. In rare cases of high demand, delivery may take up to 48 hours. If you haven''t received your order within 24 hours, please contact us via WhatsApp for immediate assistance.</p>

<h2>3. Eligible Refund Cases</h2>
<p>We calculate refunds on a case-by-case basis. You are eligible for a full or partial refund if:</p>
<ul>
<li><strong>Non-Delivery of Product:</strong> If your order is not delivered within 48 hours of purchase, you are entitled to a full refund. Claims for non-delivery must be submitted via WhatsApp within 7 days from the order date.</li>
<li><strong>Major Defects:</strong> Although all products are thoroughly tested before release, unexpected errors may occur. We reserve the right to rectify the error within 72 hours. If we fail to correct it, a full refund will be issued.</li>
<li><strong>Product Not-As-Described:</strong> Such issues should be reported within 7 days of purchase with clear evidence proving the product is not as described on the website.</li>
<li><strong>Service Downtime:</strong> If the subscription service completely stops working within the warranty period and we cannot provide a replacement or fix within 48 hours.</li>
</ul>

<h2>4. Non-Eligible Refund Cases</h2>
<p>We do not issue refunds under the following circumstances:</p>
<ul>
<li>You simply changed your mind about the purchase</li>
<li>You allow someone else to use your account</li>
<li>You do not have sufficient technical knowledge to use the product</li>
<li>The service was terminated due to a violation of the provider''s Terms of Service by you</li>
</ul>

<h2>5. Processing Refunds</h2>
<p>If your refund is approved, we will initiate a refund to your original method of payment. You will receive the credit within 5-10 business days, depending on your card issuer''s policies.</p>

<h2>6. Contact Us</h2>
<p>If you have any questions about our Refund Policy, please contact us:</p>
<ul>
<li>By WhatsApp: +94 78 776 7869</li>
<li>By visiting our contact page</li>
</ul>'
)
ON CONFLICT (policy_key) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Policies table created successfully!';
    RAISE NOTICE '   - privacy_policy';
    RAISE NOTICE '   - terms_of_service';
    RAISE NOTICE '   - refund_policy';
END $$;
