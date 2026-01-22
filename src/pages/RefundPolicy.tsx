import { usePolicy } from '@/hooks/usePolicies';
import PolicyLayout from '@/components/layout/PolicyLayout';
import { Loader2 } from 'lucide-react';

const RefundPolicy = () => {
    const { data: policy, isLoading, error } = usePolicy('refund_policy');

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
                title="Refund"
                highlightedWord="Policy"
                description="Understand our refund and return policies for digital subscriptions. We aim for 100% customer satisfaction."
            >
                <h2>1. Digital Products Nature</h2>
                <p>
                    At Snippy Mart, we strive to ensure that our customers are 100% satisfied with our digital subscription services. Since your purchase is a digital product, it is deemed "used" after download or opening, and all purchases are generally non-refundable.
                </p>
                <p>
                    <strong>However, we do provide refunds in specific exceptional cases.</strong>
                </p>

                <h2>2. Delivery Timeframe</h2>
                <p>
                    All orders are processed and delivered within <strong>1 to 24 hours</strong>. In rare cases of high demand, delivery may take up to 48 hours. If you haven't received your order within 24 hours, please contact us via WhatsApp for immediate assistance.
                </p>

                <h2>3. Eligible Refund Cases</h2>
                <p>
                    We calculate refunds on a case-by-case basis. You are eligible for a full or partial refund if:
                </p>
                <ul>
                    <li><strong>Non-Delivery of Product:</strong> If your order is not delivered within 48 hours of purchase, you are entitled to a full refund. Claims for non-delivery must be submitted via WhatsApp within 7 days from the order date.</li>
                    <li><strong>Major Defects:</strong> Although all products are thoroughly tested before release, unexpected errors may occur. We reserve the right to rectify the error within 72 hours. If we fail to correct it, a full refund will be issued.</li>
                    <li><strong>Product Not-As-Described:</strong> Such issues should be reported within 7 days of purchase with clear evidence proving the product is not as described on the website.</li>
                    <li><strong>Service Downtime:</strong> If the subscription service completely stops working within the warranty period and we cannot provide a replacement or fix within 48 hours.</li>
                </ul>

                <h2>4. Non-Eligible Refund Cases</h2>
                <p>
                    We do not issue refunds under the following circumstances:
                </p>
                <ul>
                    <li>You simply changed your mind about the purchase</li>
                    <li>You allow someone else to use your account</li>
                    <li>You do not have sufficient technical knowledge to use the product</li>
                    <li>The service was terminated due to a violation of the provider's Terms of Service by you</li>
                </ul>

                <h2>5. Processing Refunds</h2>
                <p>
                    If your refund is approved, we will initiate a refund to your original method of payment. You will receive the credit within 5-10 business days, depending on your card issuer's policies.
                </p>

                <h2>6. Contact Us</h2>
                <p>
                    If you have any questions about our Refund Policy, please contact us:
                </p>
                <ul>
                    <li>By WhatsApp: +94 78 776 7869</li>
                    <li>By visiting our contact page</li>
                </ul>
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

export default RefundPolicy;
