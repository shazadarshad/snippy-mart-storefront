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
import { Bell, Package, Truck, Clock, CheckCircle } from './components/icons';

interface StatusUpdateEmailProps {
    customerName?: string;
    orderId?: string;
    currentStatus?: string;
    statusMessage?: string;
    estimatedDelivery?: string;
    trackingUrl?: string;
}

export const StatusUpdate = ({
    customerName = 'Valued Customer',
    orderId = 'ORD-12345',
    currentStatus = 'Processing',
    statusMessage = 'Your order is being prepared for shipment',
    estimatedDelivery = 'January 28, 2026',
    trackingUrl = 'https://snippymart.com/track',
}: StatusUpdateEmailProps) => {
    return (
        <EmailLayout theme="purple" title="Order Status Update">
            <Html>
                <Head />
                <Preview>Update on your order {orderId}</Preview>
                <Body style={main}>
                    <Container style={container}>
                        {/* Bell Icon */}
                        <Section style={iconSection}>
                            <div style={bellIconBox}>
                                <Bell color="#ffffff" size={48} />
                            </div>
                        </Section>

                        {/* Main Content */}
                        <Section style={contentSection}>
                            <Text style={heading}>Order Update</Text>
                            <Text style={paragraph}>
                                Hi {customerName},
                            </Text>
                            <Text style={paragraph}>
                                We have an update on your order <strong>{orderId}</strong>.
                            </Text>

                            {/* Status Card */}
                            <div style={statusCard}>
                                <Text style={statusBadge}>{currentStatus}</Text>
                                <Text style={statusMessage}>{statusMessage}</Text>
                            </div>

                            {/* Timeline */}
                            <div style={timeline}>
                                <div style={timelineItem}>
                                    <div style={timelineIconActive}>
                                        <CheckCircle color="#8b5cf6" size={20} />
                                    </div>
                                    <div style={timelineContent}>
                                        <Text style={timelineTitle}>Order Placed</Text>
                                        <Text style={timelineDesc}>Your order has been confirmed</Text>
                                    </div>
                                </div>

                                <div style={timelineItem}>
                                    <div style={timelineIconActive}>
                                        <Package color="#8b5cf6" size={20} />
                                    </div>
                                    <div style={timelineContent}>
                                        <Text style={timelineTitle}>Processing</Text>
                                        <Text style={timelineDesc}>We're preparing your items</Text>
                                    </div>
                                </div>

                                <div style={timelineItem}>
                                    <div style={timelineIconInactive}>
                                        <Truck color="#d1d5db" size={20} />
                                    </div>
                                    <div style={timelineContent}>
                                        <Text style={timelineTitleInactive}>Shipped</Text>
                                        <Text style={timelineDesc}>On the way to you</Text>
                                    </div>
                                </div>

                                <div style={timelineItem}>
                                    <div style={timelineIconInactive}>
                                        <CheckCircle color="#d1d5db" size={20} />
                                    </div>
                                    <div style={timelineContent}>
                                        <Text style={timelineTitleInactive}>Delivered</Text>
                                        <Text style={timelineDesc}>Arrives at your doorstep</Text>
                                    </div>
                                </div>
                            </div>

                            {/* Estimated Delivery */}
                            <div style={deliveryCard}>
                                <div style={deliveryIconWrapper}>
                                    <Clock color="#8b5cf6" size={24} />
                                </div>
                                <div>
                                    <Text style={deliveryLabel}>Estimated Delivery</Text>
                                    <Text style={deliveryDate}>{estimatedDelivery}</Text>
                                </div>
                            </div>

                            {/* Track Button */}
                            <Section style={buttonSection}>
                                <Button href={trackingUrl} style={button}>
                                    <Package color="#ffffff" size={20} />
                                    <span style={{ marginLeft: '8px' }}>Track Your Order</span>
                                </Button>
                            </Section>

                            {/* Thank You */}
                            <Text style={thankYou}>
                                Thank you for your patience! We'll notify you when your order ships.
                            </Text>
                        </Section>

                        {/* Footer */}
                        <Section style={footer}>
                            <Text style={footerText}>
                                Questions? Contact us at{' '}
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

export default StatusUpdate;

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

const bellIconBox = {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    borderRadius: '50%',
    padding: '20px',
    boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)',
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

const statusCard = {
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: '12px',
    padding: '24px',
    margin: '24px 0',
    textAlign: 'center' as const,
    border: '1px solid rgba(139, 92, 246, 0.1)',
};

const statusBadge = {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: '#ffffff',
    padding: '8px 20px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 12px 0',
};

const statusMessage = {
    fontSize: '18px',
    color: '#1f2937',
    fontWeight: '600',
    margin: '0',
};

const timeline = {
    margin: '32px 0',
    padding: '0 20px',
};

const timelineItem = {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '24px',
    position: 'relative' as const,
};

const timelineIconActive = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '16px',
    flexShrink: 0,
};

const timelineIconInactive = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '16px',
    flexShrink: 0,
};

const timelineContent = {
    flex: 1,
};

const timelineTitle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0',
};

const timelineTitleInactive = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#9ca3af',
    margin: '0 0 4px 0',
};

const timelineDesc = {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
};

const deliveryCard = {
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: '12px',
    padding: '20px',
    margin: '24px 0',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid rgba(139, 92, 246, 0.1)',
};

const deliveryIconWrapper = {
    marginRight: '16px',
};

const deliveryLabel = {
    fontSize: '12px',
    color: '#6b7280',
    margin: '0 0 4px 0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
};

const deliveryDate = {
    fontSize: '18px',
    color: '#1f2937',
    fontWeight: '600',
    margin: '0',
};

const buttonSection = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const button = {
    backgroundColor: '#8b5cf6',
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
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
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
    color: '#8b5cf6',
    textDecoration: 'none',
};
