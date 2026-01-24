import {
    Body,
    Container,
    Head,
    Html,
    Preview,
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
        <EmailLayout theme="blue" title="Order Delivered! 🎉">
            <Html>
                <Head />
                <Preview>Your order {orderId} has been delivered successfully!</Preview>
                <Body style={main}>
                    <Container style={container}>
                        {/* Success Icon */}
                        <Section style={iconSection}>
                            <div style={successIconBox}>
                                <CheckCircle color="#ffffff" size={48} />
                            </div>
                        </Section>

                        {/* Main Content */}
                        <Section style={contentSection}>
                            <Text style={heading}>Delivery Confirmed!</Text>
                            <Text style={paragraph}>
                                Hi {customerName},
                            </Text>
                            <Text style={paragraph}>
                                Great news! Your order has been successfully delivered. We hope you love your purchase!
                            </Text>

                            {/* Delivery Details Card */}
                            <div style={detailsCard}>
                                <table style={{ width: '100%' }} cellPadding="0" cellSpacing="0">
                                    <tr>
                                        <td style={detailRow}>
                                            <div style={iconWrapper}>
                                                <Package color="#3b82f6" size={20} />
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
                                                <Calendar color="#3b82f6" size={20} />
                                            </div>
                                            <div style={detailContent}>
                                                <Text style={detailLabel}>Delivered On</Text>
                                                <Text style={detailValue}>{deliveryDate}</Text>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={detailRow}>
                                            <div style={iconWrapper}>
                                                <MapPin color="#3b82f6" size={20} />
                                            </div>
                                            <div style={detailContent}>
                                                <Text style={detailLabel}>Delivery Address</Text>
                                                <Text style={detailValue}>{deliveryAddress}</Text>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            {/* Feedback Section */}
                            <div style={feedbackSection}>
                                <Text style={feedbackHeading}>How was your experience?</Text>
                                <Text style={feedbackText}>
                                    We'd love to hear your feedback! Your opinion helps us improve our service.
                                </Text>
                            </div>

                            {/* Thank You */}
                            <Text style={thankYou}>
                                Thank you for shopping with Snippy Mart! We look forward to serving you again.
                            </Text>
                        </Section>

                        {/* Footer */}
                        <Section style={footer}>
                            <Text style={footerText}>
                                Need help? Contact us at{' '}
                                <a href="mailto:support@snippymart.com" style={link}>
                                    support@snippymart.com
                                </a>
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

export default OrderDelivered;

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

const successIconBox = {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    borderRadius: '50%',
    padding: '20px',
    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
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
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: '12px',
    padding: '24px',
    margin: '24px 0',
    border: '1px solid rgba(59, 130, 246, 0.1)',
};

const detailRow = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
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

const feedbackSection = {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: '12px',
    padding: '24px',
    margin: '24px 0',
    textAlign: 'center' as const,
    border: '2px dashed rgba(59, 130, 246, 0.2)',
};

const feedbackHeading = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0',
};

const feedbackText = {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
};

const thankYou = {
    fontSize: '16px',
    color: '#4b5563',
    textAlign: 'center' as const,
    margin: '24px 0 0 0',
    fontStyle: 'italic',
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

const link = {
    color: '#3b82f6',
    textDecoration: 'none',
};
