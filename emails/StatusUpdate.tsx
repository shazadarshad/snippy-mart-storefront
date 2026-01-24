import {
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
        <EmailLayout theme="purple" previewText={`Update on your order ${orderId} 📦`}>
            {/* Bell Icon */}
            <Section style={iconSection}>
                <div style={bellIconBox}>
                    <Bell color="#ffffff" size={48} />
                </div>
            </Section>

            {/* Heading */}
            <Section style={section}>
                <Text style={heading}>Order Update</Text>
                <Text style={paragraph}>
                    Hi <strong style={{ color: '#ffffff' }}>{customerName}</strong>,
                </Text>
                <Text style={paragraph}>
                    We have an update on your order <strong>{orderId}</strong>.
                </Text>
            </Section>

            {/* Status Card */}
            <Section style={section}>
                <div style={statusCard}>
                    <Text style={statusBadge}>{currentStatus}</Text>
                    <Text style={statusMessageText}>{statusMessage}</Text>
                </div>
            </Section>

            {/* Estimated Delivery */}
            <Section style={section}>
                <div style={deliveryCard}>
                    <div style={deliveryIconWrapper}>
                        <Clock color="#8b5cf6" size={24} />
                    </div>
                    <div>
                        <Text style={deliveryLabel}>Estimated Delivery</Text>
                        <Text style={deliveryDate}>{estimatedDelivery}</Text>
                    </div>
                </div>
            </Section>

            {/* Track Button */}
            <Section style={buttonSection}>
                <Button href={trackingUrl} style={button}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        Track Your Order
                    </span>
                </Button>
            </Section>

            {/* Thank You */}
            <Section style={section}>
                <Text style={thankYou}>
                    Thank you for your patience! We'll notify you when your order ships.
                </Text>
            </Section>
        </EmailLayout>
    );
};

export default StatusUpdate;

// Styles - Dark Mode Glassmorphism
const section = {
    padding: '0 24px 20px',
};

const iconSection = {
    textAlign: 'center' as const,
    padding: '0 0 24px',
};

const bellIconBox = {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    borderRadius: '50%',
    padding: '20px',
    boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)',
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

const statusCard = {
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center' as const,
    border: '1px solid rgba(139, 92, 246, 0.2)',
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

const statusMessageText = {
    fontSize: '18px',
    color: '#ffffff',
    fontWeight: '600',
    margin: '0',
};

const deliveryCard = {
    background: 'rgba(139, 92, 246, 0.1)',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    border: '1px solid rgba(139, 92, 246, 0.2)',
};

const deliveryIconWrapper = {
    marginRight: '16px',
    background: 'rgba(139, 92, 246, 0.2)',
    borderRadius: '50%',
    padding: '8px',
};

const deliveryLabel = {
    fontSize: '11px',
    color: '#94a3b8',
    margin: '0 0 4px 0',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    fontWeight: '600',
};

const deliveryDate = {
    fontSize: '18px',
    color: '#ffffff',
    fontWeight: '600',
    margin: '0',
};

const buttonSection = {
    textAlign: 'center' as const,
    margin: '12px 0 32px',
};

const button = {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '700',
    textDecoration: 'none',
    textAlign: 'center' as const,
    padding: '16px 36px',
    display: 'inline-block',
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
};

const thankYou = {
    fontSize: '14px',
    color: '#64748b',
    textAlign: 'center' as const,
    fontStyle: 'italic',
    margin: '0',
};
