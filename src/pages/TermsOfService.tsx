import { usePolicy } from '@/hooks/usePolicies';
import PolicyLayout from '@/components/layout/PolicyLayout';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
    const { data: policy, isLoading, error } = usePolicy('terms_of_service');

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
                title="Terms of"
                highlightedWord="Service"
                description="Read the Terms and Conditions for using Snippy Mart services. By accessing our website, you agree to these terms."
            >
                <h2>1. Terms</h2>
                <p>
                    By accessing this Website, accessible from https://snippymart.com, you are agreeing to be bound by these Website Terms and Conditions of Use and agree that you are responsible for the agreement with any applicable local laws. If you disagree with any of these terms, you are prohibited from accessing this site.
                </p>

                <h2>2. Use License</h2>
                <p>
                    Permission is granted to temporarily download one copy of the materials on Snippy Mart's Website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul>
                    <li>Modify or copy the materials</li>
                    <li>Use the materials for any commercial purpose or for any public display</li>
                    <li>Attempt to reverse engineer any software contained on Snippy Mart's Website</li>
                    <li>Remove any copyright or other proprietary notations from the materials</li>
                    <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                </ul>

                <h2>3. Disclaimer</h2>
                <p>
                    All the materials on Snippy Mart's Website are provided "as is". Snippy Mart makes no warranties, may it be expressed or implied, therefore negates all other warranties.
                </p>

                <h2>4. Limitations</h2>
                <p>
                    Snippy Mart or its suppliers will not be held accountable for any damages that will arise with the use or inability to use the materials on Snippy Mart's Website.
                </p>

                <h2>5. Revisions</h2>
                <p>
                    The materials appearing on Snippy Mart's Website may include technical, typographical, or photographic errors. Snippy Mart may change the materials contained on its Website at any time without notice.
                </p>

                <h2>6. Links</h2>
                <p>
                    Snippy Mart has not reviewed all of the sites linked to its Website and is not responsible for the contents of any such linked site.
                </p>

                <h2>7. Modifications</h2>
                <p>
                    Snippy Mart may revise these Terms of Use for its Website at any time without prior notice.
                </p>

                <h2>8. Privacy</h2>
                <p>
                    Please read our <Link to="/privacy-policy" className="text-primary hover:underline font-medium">Privacy Policy</Link>.
                </p>

                <h2>9. Governing Law</h2>
                <p>
                    Any claim related to Snippy Mart's Website shall be governed by the laws of Sri Lanka.
                </p>

                <h2>10. Delivery Policy</h2>
                <p>
                    All digital subscription products purchased from Snippy Mart will be delivered within <strong>1 to 24 hours</strong> from the time of order confirmation. Delivery is completed when:
                </p>
                <ul>
                    <li>Login credentials are sent to your registered WhatsApp number</li>
                    <li>Login credentials are sent to your email address (if provided)</li>
                    <li>Order status is updated to "Completed" in our system</li>
                </ul>
                <p>
                    In rare cases of high demand or technical issues, delivery may take up to 48 hours. If you haven't received your credentials within 24 hours, please contact our support team via WhatsApp.
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

export default TermsOfService;
