import {
    Section,
    Text,
    Link,
    Row,
    Column,
    Heading,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';

interface OrderConfirmationEmailProps {
    customerName: string;
    orderId: string;
    total: string;
    items: string;
    paymentMethod: string;
}

// Icons (keep existing icons)
const CheckCircleIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const PackageIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
);

const ShoppingCartIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
);

const DollarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

const CreditCardIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
);

const ClockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

export const OrderConfirmationEmail = ({
    customerName = 'Valued Customer',
    orderId = 'SNIP-2026-123456',
    total = '$99.99',
    items = 'Netflix Premium x1, Spotify Premium x1',
    paymentMethod = 'Card Payment 💳',
}: OrderConfirmationEmailProps) => {
    return (
        <EmailLayout
            theme="green"
            previewText={`Your order #${orderId} has been confirmed! 🎉`}
        >
            {/* Success Badge */}
            <Section style={successBadge}>
                <Row>
                    <Column style={{ width: '40px', paddingRight: '12px' }}>
                        <div style={{ color: '#ffffff' }}>
                            <CheckCircleIcon />
                        </div>
                    </Column>
                    <Column>
                        <Heading style={successText}>Order Confirmed!</Heading>
                    </Column>
                </Row>
            </Section>

            {/* Greeting */}
            <Section style={section}>
                <Text style={greeting}>
                    Hey <strong style={{ color: '#ffffff' }}>{customerName}</strong>! 👋
                </Text>
                <Text style={paragraph}>
                    Thank you for your purchase. We've received your order and our team is preparing your subscription. You'll receive your login details shortly!
                </Text>
            </Section>

            {/* Order Details Card */}
            <Section style={section}>
                <div style={detailsCard}>

                    {/* Order Number */}
                    <div style={detailRow}>
                        <Row>
                            <Column style={{ width: '20px', paddingRight: '8px' }}>
                                <div style={{ color: '#94a3b8' }}>
                                    <PackageIcon />
                                </div>
                            </Column>
                            <Column>
                                <Text style={label}>Order Number</Text>
                                <Text style={value}>#{orderId}</Text>
                            </Column>
                        </Row>
                    </div>

                    {/* Items */}
                    <div style={detailRow}>
                        <Row>
                            <Column style={{ width: '20px', paddingRight: '8px' }}>
                                <div style={{ color: '#94a3b8' }}>
                                    <ShoppingCartIcon />
                                </div>
                            </Column>
                            <Column>
                                <Text style={label}>Items Purchased</Text>
                                <Text style={itemsText}>{items}</Text>
                            </Column>
                        </Row>
                    </div>

                    {/* Total & Payment */}
                    <div style={detailRow}>
                        <Row>
                            <Column style={{ width: '50%', verticalAlign: 'top' }}>
                                <Row>
                                    <Column style={{ width: '20px', paddingRight: '8px' }}>
                                        <div style={{ color: '#94a3b8' }}>
                                            <DollarIcon />
                                        </div>
                                    </Column>
                                    <Column>
                                        <Text style={label}>Total Amount</Text>
                                        <Text style={totalAmount}>{total}</Text>
                                    </Column>
                                </Row>
                            </Column>
                            <Column style={{ width: '50%', verticalAlign: 'top', textAlign: 'right' }}>
                                <Row>
                                    <Column style={{ width: '20px', paddingRight: '8px' }}>
                                        <div style={{ color: '#94a3b8' }}>
                                            <CreditCardIcon />
                                        </div>
                                    </Column>
                                    <Column>
                                        <Text style={label}>Payment</Text>
                                        <Text style={paymentText}>{paymentMethod}</Text>
                                    </Column>
                                </Row>
                            </Column>
                        </Row>
                    </div>

                    {/* Status */}
                    <div style={{ paddingTop: '15px' }}>
                        <Row>
                            <Column style={{ width: '20px', paddingRight: '8px' }}>
                                <div style={{ color: '#94a3b8' }}>
                                    <ClockIcon />
                                </div>
                            </Column>
                            <Column>
                                <Text style={label}>Status</Text>
                                <span style={statusBadge}>Processing</span>
                            </Column>
                        </Row>
                    </div>

                </div>
            </Section>

            {/* CTA Button */}
            <Section style={buttonSection}>
                <Link href={`https://snippymart.com/track-order?orderId=${orderId}`} style={button}>
                    <Row>
                        <Column style={{ paddingRight: '8px' }}>
                            Track Your Order
                        </Column>
                        <Column style={{ width: '20px' }}>
                            <div style={{ color: '#ffffff' }}>
                                <ArrowRightIcon />
                            </div>
                        </Column>
                    </Row>
                </Link>
            </Section>

        </EmailLayout>
    );
};

export default OrderConfirmationEmail;

// Styles with Glassmorphism & Modern Design
// Styles with Glassmorphism & Modern Design

const successBadge = {
    padding: '0 24px 28px',
    textAlign: 'center' as const,
};

const successText = {
    margin: '0',
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '700',
};

const section = {
    padding: '0 24px 28px',
};

const greeting = {
    margin: '0 0 12px',
    color: '#e2e8f0',
    fontSize: '16px',
    lineHeight: '24px',
};

const paragraph = {
    margin: '0',
    color: '#cbd5e1',
    fontSize: '15px',
    lineHeight: '24px',
};

const detailsCard = {
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '24px',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
};

const detailRow = {
    paddingBottom: '18px',
    marginBottom: '18px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
};

const label = {
    margin: '0 0 6px',
    color: '#94a3b8',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    fontWeight: '600',
};

const value = {
    margin: '0',
    color: '#10b981',
    fontSize: '17px',
    fontWeight: '700',
    fontFamily: 'monospace',
};

const itemsText = {
    margin: '0',
    color: '#ffffff',
    fontSize: '14px',
    lineHeight: '22px',
};

const totalAmount = {
    margin: '0',
    color: '#10b981',
    fontSize: '22px',
    fontWeight: '800',
};

const paymentText = {
    margin: '0',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
};

const statusBadge = {
    display: 'inline-block',
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid rgba(16, 185, 129, 0.3)',
};

const buttonSection = {
    padding: '0 24px 32px',
    textAlign: 'center' as const,
};

const button = {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    padding: '16px 36px',
    borderRadius: '14px',
    fontWeight: '700',
    textDecoration: 'none',
    fontSize: '15px',
    boxShadow: '0 12px 32px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
};


