import {
    Body,
    Container,
    Head,
    Html,
    Preview,
    Section,
    Text,
    Button,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { AlertCircle, CreditCard, HelpCircle, RefreshCw } from './components/icons';

interface PaymentRejectedEmailProps {
    customerName?: string;
    orderId?: string;
    rejectionReason?: string;
    orderTotal?: string;
    retryUrl?: string;
}

export const PaymentRejected = ({
    customerName = 'Valued Customer',
    orderId = 'ORD-12345',
    rejectionReason = 'Insufficient funds',
    orderTotal = '$99.99',
    retryUrl = 'https://snippymart.com/retry-payment',
}: PaymentRejectedEmailProps) => {
    return (
        <EmailLayout theme="red" title="Payment Issue - Action Required">
            <Html>
                <Head />
                <Preview>Payment for order {orderId} was declined - Please retry</Preview>
                <Body style={main}>
                    <Container style={container}>
                        {/* Alert Icon */}
                        <Section style={iconSection}>
                            <div style={alertIconBox}>
                                <AlertCircle color="#ffffff" size={48} />
                            </div>
                        </Section>

                        {/* Main Content */}
                        <Section style={contentSection}>
                            <Text style={heading}>Payment Declined</Text>
                            <Text style={paragraph}>
                                Hi {customerName},
                            </Text>
                            <Text style={paragraph}>
                                We were unable to process your payment for order <strong>{orderId}</strong>.
                                Don't worry - your order is still reserved for the next 24 hours.
                            </Text>

                            {/* Payment Details Card */}
                            <div style={detailsCard}>
                                <table style={{ width: '100%' }} cellPadding="0" cellSpacing="0">
                                    <tr>
                                        <td style={detailRow}>
                                            <div style={iconWrapper}>
                                                <CreditCard color="#ef4444" size={20} />
                                            </div>
                                            <div style={detailContent}>
                                                <Text style={detailLabel}>Order ID</Text>
                                                <Text style={detailValue}>{orderId}</Text>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={detailRow}>
                                            <div style={iconWrapper}>
                                                <AlertCircle color="#ef4444" size={20} />
                                            </div>
                                            <div style={detailContent}>
                                                <Text style={detailLabel}>Reason</Text>
                                                <Text style={detailValue}>{rejectionReason}</Text>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={detailRow}>
                                            <div style={iconWrapper}>
                                                <CreditCard color="#ef4444" size={20} />
                                            </div>
                                            <div style={detailContent}>
                                                <Text style={detailLabel}>Amount</Text>
                                                <Text style={detailValue}>{orderTotal}</Text>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            {/* Action Button */}
                            <Section style={buttonSection}>
                                <Button href={retryUrl} style={button}>
                                    <RefreshCw color="#ffffff" size={20} />
                                    <span style={{ marginLeft: '8px' }}>Retry Payment Now</span>
                                </Button>
                            </Section>

                            {/* Help Section */}
                            <div style={helpSection}>
                                <div style={helpIconWrapper}>
                                    <HelpCircle color="#ef4444" size={24} />
                                </div>
                                <Text style={helpHeading}>Common Solutions</Text>
                                <ul style={helpList}>
                                    <li style={helpItem}>Verify your card has sufficient funds</li>
                                    <li style={helpItem}>Check if your card is activated for online payments</li>
                                    <li style={helpItem}>Try a different payment method</li>
                                    <li style={helpItem}>Contact your bank if the issue persists</li>
                                </ul>
                            </div>

                            {/* Support */}
                            <Text style={supportText}>
                                Need assistance? Our support team is here to help!<br />
                                <a href="mailto:support@snippymart.com" style={link}>support@snippymart.com</a>
                            </Text>
                        </Section>

                        {/* Footer */}
                        <Section style={footer}>
                            <Text style={footerText}>
                                This order will be automatically cancelled if payment is not received within 24 hours.
                            </Text>
                            <Text style={footerText}>
                                © 2026 Snippy Mart. All rights reserved.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Html>
        </EmailLayout>
    );
};

export default PaymentRejected;

// Styles
const main = {
    backgroundColor: '#f3f4f6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0',
    maxWidth: '600px',
};

const iconSection = {
    textAlign: 'center' as const,
    padding: '20px 0',
};

const alertIconBox = {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    borderRadius: '50%',
    padding: '20px',
    boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)',
};

const contentSection = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
};

const heading = {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 20px 0',
    textAlign: 'center' as const,
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#4b5563',
    margin: '0 0 16px 0',
};

const detailsCard = {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: '12px',
    padding: '24px',
    margin: '24px 0',
    border: '1px solid rgba(239, 68, 68, 0.1)',
};

const detailRow = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(239, 68, 68, 0.1)',
};

const iconWrapper = {
    marginRight: '12px',
    display: 'flex',
    alignItems: 'center',
};

const detailContent = {
    flex: 1,
};

const detailLabel = {
    fontSize: '12px',
    color: '#6b7280',
    margin: '0 0 4px 0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
};

const detailValue = {
    fontSize: '16px',
    color: '#1f2937',
    fontWeight: '600',
    margin: '0',
};

const buttonSection = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const button = {
    backgroundColor: '#ef4444',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    padding: '14px 32px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
};

const helpSection = {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: '12px',
    padding: '24px',
    margin: '24px 0',
    border: '1px solid rgba(239, 68, 68, 0.1)',
};

const helpIconWrapper = {
    textAlign: 'center' as const,
    marginBottom: '12px',
};

const helpHeading = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 16px 0',
    textAlign: 'center' as const,
};

const helpList = {
    margin: '0',
    padding: '0 0 0 20px',
    color: '#4b5563',
};

const helpItem = {
    fontSize: '14px',
    lineHeight: '24px',
    marginBottom: '8px',
};

const supportText = {
    fontSize: '16px',
    color: '#4b5563',
    textAlign: 'center' as const,
    margin: '24px 0 0 0',
};

const link = {
    color: '#ef4444',
    textDecoration: 'none',
    fontWeight: '600',
};

const footer = {
    marginTop: '32px',
    textAlign: 'center' as const,
};

const footerText = {
    fontSize: '14px',
    color: '#6b7280',
    margin: '8px 0',
};
