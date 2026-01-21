import PolicyLayout from '@/components/layout/PolicyLayout';

const RefundPolicy = () => {
    return (
        <PolicyLayout
            title="Refund"
            highlightedWord="Policy"
            description="Understand our refund and return policies for digital subscriptions. We aim for 100% customer satisfaction."
        >
            <p>
                At Snippy Mart, we strive to ensure that our customers are 100% satisfied with our digital subscription services. However, we understand that there may be circumstances where you might require a refund. Please read our policy below to understand your rights and our obligations.
            </p>

            <h2>1. Digital Products Nature</h2>
            <p>
                Since your purchase is a digital product, it is deemed "used" after download or opening, and all purchases made on www.snippymart.vercel.app are generally non-refundable or exchangeable. Since the products made available here are intangible, there is a strict no refund policy.
            </p>
            <p>
                <strong>However, we do provide refunds in specific exceptional cases.</strong>
            </p>

            <h2>2. Eligible Refund Cases</h2>
            <p>
                We calculate refunds on a case-by-case basis. You are eligible for a full or partial refund if:
            </p>
            <ul>
                <li><strong>Non-Delivery of Product:</strong> Due to some mailing issues of your e-mail provider or your own mail server, you might not receive a delivery e-mail from us. In this case, we recommend contacting us for assistance. Claims for non-delivery must be submitted to our Billing department in writing within 7 days from the order placing date.</li>
                <li><strong>Major Defects:</strong> Although all the products are thoroughly tested before release, unexpected errors may occur. You should contact us for such issues. We reserve the right to rectify the error or defect within 72 hours. If any deficiency is approved and we fail to correct it within 72 hours from the date of the initial complaint letter or any other notification provided by a Customer, the refund will be issued to the customer in full without any compensations or reimbursements.</li>
                <li><strong>Product Not-As-Described:</strong> Such issues should be reported to our Technical Support Department within 7 days from the date of the purchase. Clear evidence must be provided proving that the purchased product is not as it is described on the website. Complaints which are based merely on the customer's false expectations or wishes are not honored.</li>
                <li><strong>Service Downtime:</strong> If the subscription service you purchased completely stops working within the warranty period and we are unable to provide a replacement account or fix the issue within 48 hours.</li>
            </ul>

            <h2>3. Non-Eligible Refund Cases</h2>
            <p>
                We do not issue refunds under the following circumstances:
            </p>
            <ul>
                <li>You simply changed your mind about the purchase.</li>
                <li>You allow someone else to use your account.</li>
                <li>You do not have the sufficient technical knowledge to use the product (although we will do our best to guide you).</li>
                <li>The service was terminated due to a violation of the service provider's Terms of Service by you (e.g., sharing a personal account).</li>
            </ul>

            <h2>4. Processing Refunds</h2>
            <p>
                If your refund is approved, we will initiate a refund to your credit card (or original method of payment). You will receive the credit within a certain amount of days, depending on your card issuer's policies (usually 5-10 business days).
            </p>

            <h2>5. Contact Us</h2>
            <p>
                If you have any questions about our Refund Policy, please contact us:
            </p>
            <ul>
                <li>By WhatsApp: +94 78 776 7869</li>
                <li>By visiting our <a href="/contact">contact page</a></li>
            </ul>
        </PolicyLayout>
    );
};

export default RefundPolicy;
