import {
    Section,
    Text,
    Button,
    Row,
    Column,
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
        <EmailLayout theme="red" previewText={`Payment for order ${orderId} was declined ⚠️`}>
            {/* Alert Icon */}
            <Section style={iconSection}>
                <div style={alertIconBox}>
                    <AlertCircle color="#ffffff" size={48} />
                </div>
            </Section>

            {/* Heading */}
            <Section style={section}>
                <Text style={heading}>Payment Declined</Text>
                <Text style={paragraph}>
                    Hi <strong style={{ color: '#ffffff' }}>{customerName}</strong>,
                </Text>
                <Text style={paragraph}>
                    We were unable to process your payment for order <strong>{orderId}</strong>.
                    Don't worry - your order is still reserved for the next 24 hours.
                </Text>
            </Section>

            {/* Payment Details Card */}
            <Section style={section}>
                <div style={detailsCard}>
                    <Section style={detailRow}>
                        <Row>
                            <Column style={{ width: '32px' }}>
                                <CreditCard color="#ef4444" size={20} />
                            </Column>
                            <Column>
                                <Text style={detailLabel}>Order ID</Text>
                                <Text style={detailValue}>{orderId}</Text>
                            </Column>
                        </Row>
                    </Section>
                    <Section style={detailRow}>
                        <Row>
                            <Column style={{ width: '32px' }}>
                                <AlertCircle color="#ef4444" size={20} />
                            </Column>
                            <Column>
                                <Text style={detailLabel}>Reason</Text>
                                <Text style={detailValue}>{rejectionReason}</Text>
                            </Column>
                        </Row>
                    </Section>
                    <Section>
                        <Row>
                            <Column style={{ width: '32px' }}>
                                <CreditCard color="#ef4444" size={20} />
                            </Column>
                            <Column>
                                <Text style={detailLabel}>Amount</Text>
                                <Text style={detailValue}>{orderTotal}</Text>
                            </Column>
                        </Row>
                    </Section>
                </div>
            </Section>

            {/* Action Button */}
            <Section style={buttonSection}>
                <Button href={retryUrl} style={button}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        Retry Payment Now
                    </span>
                </Button>
            </Section>

            {/* Help Section */}
            <Section style={section}>
                <div style={helpSection}>
                    <Section style={{ textAlign: 'center', marginBottom: '12px' }}>
                        <HelpCircle color="#ef4444" size={24} />
                    </Section>
                    <Text style={helpHeading}>Common Solutions</Text>
                    <ul style={helpList}>
                        <li style={helpItem}>Verify your card has sufficient funds</li>
                        <li style={helpItem}>Check if your card is activated for online payments</li>
                        <li style={helpItem}>Try a different payment method</li>
                        <li style={helpItem}>Contact your bank if the issue persists</li>
                    </ul>
                </div>
            </Section>

            {/* Support */}
            <Section style={section}>
                <Text style={supportText}>
                    Need assistance? Our support team is here to help!
                </Text>
                <Text style={{ textAlign: 'center', margin: '8px 0 0' }}>
                    <a href="mailto:support@snippymart.com" style={link}>support@snippymart.com</a>
                </Text>
            </Section>

            {/* Footer Text */}
            <Section style={footer}>
                <Text style={footerText}>
                    This order will be automatically cancelled if payment is not received within 24 hours.
                </Text>
            </Section>
        </EmailLayout>
    );
};

export default PaymentRejected;

// Styles - Dark Mode Glassmorphism
const section = {
    padding: '0 24px 20px',
};

const iconSection = {
    textAlign: 'center' as const,
    padding: '0 0 24px',
};

const alertIconBox = {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    borderRadius: '50%',
    padding: '20px',
    boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)',
};

const heading = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 16px 0',
    textAlign: 'center' as const,
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#cbd5e1',
    margin: '0 0 16px 0',
    textAlign: 'center' as const,
};

const detailsCard = {
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
};

const detailRow = {
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
};

const detailLabel = {
    fontSize: '11px',
    color: '#94a3b8',
    margin: '0 0 4px 0',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    fontWeight: '600',
};

const detailValue = {
    fontSize: '15px',
    color: '#ffffff',
    fontWeight: '600',
    margin: '0',
};

const buttonSection = {
    textAlign: 'center' as const,
    margin: '12px 0 32px',
};

const button = {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '700',
    textDecoration: 'none',
    textAlign: 'center' as const,
    padding: '16px 36px',
    display: 'inline-block',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
};

const helpSection = {
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px dashed rgba(239, 68, 68, 0.3)',
};

const helpHeading = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 12px 0',
    textAlign: 'center' as const,
};

const helpList = {
    margin: '0',
    padding: '0 0 0 20px',
    color: '#cbd5e1',
};

const helpItem = {
    fontSize: '14px',
    lineHeight: '24px',
    marginBottom: '8px',
};

const supportText = {
    fontSize: '15px',
    color: '#94a3b8',
    textAlign: 'center' as const,
    margin: '0',
};

const link = {
    color: '#ef4444',
    textDecoration: 'none',
    fontWeight: '600',
};

const footer = {
    marginTop: '20px',
    textAlign: 'center' as const,
    padding: '0 24px',
};

const footerText = {
    fontSize: '13px',
    color: '#64748b',
    margin: '0',
};
