import { Section, Text, Link, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, apple } from './components/EmailLayout';

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
  orderId = 'SNIP-2026-123456',
  currentStatus = 'Processing',
  statusMessage = 'Your order is being prepared.',
  estimatedDelivery = 'Within 24 hours',
  trackingUrl = 'https://snippymart.com/track-order',
}: StatusUpdateEmailProps) => {
  return (
    <EmailLayout theme="purple" previewText={`Order update: ${orderId} is ${currentStatus}`}>
      <Section style={padTop}>
        <Text style={eyebrow}>Order update</Text>
        <Text style={title}>Hi {customerName},</Text>
        <Text style={body}>
          There’s a new status on your order <strong style={{ color: apple.text }}>{orderId}</strong>.
        </Text>
      </Section>

      <Section style={padX}>
        <Section style={statusCard}>
          <Text style={statusLabel}>Current status</Text>
          <Text style={statusValue}>{currentStatus}</Text>
          <Text style={statusMsg}>{statusMessage}</Text>
        </Section>
      </Section>

      <Section style={padX}>
        <Section style={infoCard}>
          <Text style={rowLabel}>Estimated delivery</Text>
          <Text style={rowValue}>{estimatedDelivery}</Text>
          <Hr style={divider} />
          <Text style={rowLabel}>Order ID</Text>
          <Text style={rowValueMono}>{orderId}</Text>
        </Section>
      </Section>

      <Section style={padBtn}>
        <Link href={trackingUrl} style={primaryBtn}>
          Track your order
        </Link>
      </Section>

      <Section style={padBottom}>
        <Text style={fine}>We’ll message you again when something changes.</Text>
      </Section>
    </EmailLayout>
  );
};

export default StatusUpdate;

const padTop = { padding: '32px 28px 8px' };
const padX = { padding: '8px 20px' };
const padBtn = { padding: '16px 28px 8px', textAlign: 'center' as const };
const padBottom = { padding: '8px 28px 32px' };

const eyebrow = {
  margin: '0 0 8px',
  fontSize: '13px',
  fontWeight: '600' as const,
  color: apple.purple,
  letterSpacing: '0.02em',
  textTransform: 'uppercase' as const,
};

const title = {
  margin: '0 0 12px',
  fontSize: '28px',
  fontWeight: '700' as const,
  color: apple.text,
  letterSpacing: '-0.6px',
  lineHeight: '1.15',
};

const body = {
  margin: '0',
  fontSize: '16px',
  lineHeight: '24px',
  color: apple.secondary,
};

const statusCard = {
  backgroundColor: 'rgba(175, 82, 222, 0.08)',
  borderRadius: '14px',
  padding: '22px 18px',
  border: '1px solid rgba(175, 82, 222, 0.2)',
  textAlign: 'center' as const,
};

const statusLabel = {
  margin: '0 0 6px',
  fontSize: '12px',
  fontWeight: '600' as const,
  color: apple.tertiary,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
};

const statusValue = {
  margin: '0 0 8px',
  fontSize: '22px',
  fontWeight: '700' as const,
  color: apple.text,
  letterSpacing: '-0.3px',
};

const statusMsg = {
  margin: '0',
  fontSize: '15px',
  lineHeight: '22px',
  color: apple.secondary,
};

const infoCard = {
  backgroundColor: apple.surface,
  borderRadius: '14px',
  padding: '18px',
  border: `1px solid ${apple.border}`,
};

const rowLabel = {
  margin: '0 0 4px',
  fontSize: '12px',
  fontWeight: '600' as const,
  color: apple.tertiary,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.02em',
};

const rowValue = {
  margin: '0',
  fontSize: '16px',
  fontWeight: '600' as const,
  color: apple.text,
};

const rowValueMono = {
  ...rowValue,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '15px',
};

const divider = {
  borderColor: apple.border,
  borderTop: `1px solid ${apple.border}`,
  margin: '14px 0',
};

const primaryBtn = {
  display: 'inline-block',
  backgroundColor: apple.blue,
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  padding: '14px 28px',
  borderRadius: '980px',
};

const fine = {
  margin: '0',
  fontSize: '13px',
  lineHeight: '20px',
  color: apple.tertiary,
  textAlign: 'center' as const,
};
