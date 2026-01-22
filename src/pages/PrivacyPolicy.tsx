import { usePolicy } from '@/hooks/usePolicies';
import PolicyLayout from '@/components/layout/PolicyLayout';
import { Loader2 } from 'lucide-react';

const PrivacyPolicy = () => {
    const { data: policy, isLoading, error } = usePolicy('privacy_policy');

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    // Fallback to static content if database not available
    if (error || !policy) {
        return (
            <PolicyLayout
                title="Privacy"
                highlightedWord="Policy"
                description="Learn how Snippy Mart collects, uses, and protects your personal information."
            >
                <h2>1. Information We Collect</h2>
                <p>
                    We collect information you provide directly to us when making purchases, including your name, WhatsApp number, email address, and payment information.
                </p>

                <h2>2. How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul>
                    <li>Process and fulfill your orders</li>
                    <li>Send you order confirmations and updates via WhatsApp and email</li>
                    <li>Provide customer support</li>
                    <li>Improve our services</li>
                </ul>

                <h2>3. Information Sharing</h2>
                <p>
                    We do not sell, trade, or otherwise transfer your personal information to third parties. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you.
                </p>

                <h2>4. Data Security</h2>
                <p>
                    We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
                </p>

                <h2>5. Cookies</h2>
                <p>
                    We use cookies to enhance your experience on our website. You can choose to disable cookies through your browser settings.
                </p>

                <h2>6. Third-Party Links</h2>
                <p>
                    Our website may contain links to third-party sites. We are not responsible for the privacy practices of these sites.
                </p>

                <h2>7. Changes to This Policy</h2>
                <p>
                    We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
                </p>

                <h2>8. Contact Us</h2>
                <p>
                    If you have questions about this Privacy Policy, please contact us via WhatsApp at +94 78 776 7869.
                </p>
            </PolicyLayout>
        );
    }

    return (
        <PolicyLayout
            title={policy.title}
            highlightedWord={policy.highlighted_word}
            description={policy.description}
            lastUpdated={new Date(policy.last_updated).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}
        >
            <div dangerouslySetInnerHTML={{ __html: policy.content }} />
        </PolicyLayout>
    );
};

export default PrivacyPolicy;
