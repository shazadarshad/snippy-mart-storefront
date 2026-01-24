import {
    Section,
    Text,
    Row,
    Column,
} from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/EmailLayout';
import { CheckCircle, Package, MapPin, Calendar } from './components/icons';

interface OrderDeliveredEmailProps {
    customerName?: string;
    orderId?: string;
    deliveryDate?: string;
    deliveryAddress?: string;
    trackingNumber?: string;
}

export const OrderDelivered = ({
    customerName = 'Valued Customer',
    orderId = 'ORD-12345',
    deliveryDate = 'January 24, 2026',
    deliveryAddress = '123 Main Street, Colombo, Sri Lanka',
    trackingNumber = 'TRK-67890',
}: OrderDeliveredEmailProps) => {
    return (
        <EmailLayout theme="blue" previewText={`Your order ${orderId} has been delivered! 🎉`}>
            {/* Success Icon */}
            <Section style={iconSection}>
                <div style={successIconBox}>
                    <CheckCircle color="#ffffff" size={48} />
                </div>
            </Section>

            {/* Heading */}
            <Section style={section}>
                <Text style={heading}>Delivery Confirmed!</Text>
                <Text style={paragraph}>
                    Hi <strong style={{ color: '#ffffff' }}>{customerName}</strong>,
                </Text>
                <Text style={paragraph}>
                    Great news! Your order has been successfully delivered. We hope you love your purchase!
                </Text>
            </Section>

            {/* Delivery Details Card */}
            <Section style={section}>
                <div style={detailsCard}>
                    <Section style={detailRow}>
                        <Row>
                            <Column style={{ width: '32px' }}>
                                <Package color="#3b82f6" size={20} />
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
                                <Calendar color="#3b82f6" size={20} />
                            </Column>
                            <Column>
                                <Text style={detailLabel}>Delivered On</Text>
                                <Text style={detailValue}>{deliveryDate}</Text>
                            </Column>
                        </Row>
                    </Section>
                    <Section>
                        <Row>
                            <Column style={{ width: '32px' }}>
                                <MapPin color="#3b82f6" size={20} />
                            </Column>
                            <Column>
                                <Text style={detailLabel}>Delivery Address</Text>
                                <Text style={detailValue}>{deliveryAddress}</Text>
                            </Column>
                        </Row>
                    </Section>
                </div>
            </Section>

            {/* Feedback Section */}
            <Section style={feedbackSection}>
                <Text style={feedbackHeading}>How was your experience?</Text>
                <Text style={feedbackText}>
                    We'd love to hear your feedback! Your opinion helps us improve our service.
                </Text>
            </Section>

            {/* Thank You */}
            <Section style={section}>
                <Text style={thankYou}>
                    Thank you for shopping with Snippy Mart!
                </Text>
            </Section>
        </EmailLayout>
    );
};

export default OrderDelivered;

// Styles - Dark Mode Glassmorphism
const section = {
    padding: '0 24px 20px',
    textAlign: 'center' as const,
};

const iconSection = {
    textAlign: 'center' as const,
    padding: '0 0 24px',
};

const successIconBox = {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    borderRadius: '50%',
    padding: '20px',
    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
};

const heading = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 16px 0',
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#cbd5e1',
    margin: '0 0 16px 0',
};

const detailsCard = {
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    textAlign: 'left' as const,
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

const feedbackSection = {
    margin: '0 24px 24px',
    padding: '20px',
    background: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '12px',
    textAlign: 'center' as const,
    border: '1px dashed rgba(59, 130, 246, 0.3)',
};

const feedbackHeading = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 8px 0',
};

const feedbackText = {
    fontSize: '14px',
    color: '#94a3b8',
    margin: '0',
};

const thankYou = {
    fontSize: '14px',
    color: '#64748b',
    textAlign: 'center' as const,
    fontStyle: 'italic',
    margin: '0',
};
