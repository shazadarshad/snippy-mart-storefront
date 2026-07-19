import { Section, Text, Link, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, apple, emailPad, emailType } from './components/EmailLayout';

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
      <Section style={emailPad.top} className="sm-pad-top">
        <Text style={{ ...emailType.eyebrow, color: apple.purple }} className="sm-eyebrow">
          Order update
        </Text>
        <Text style={emailType.title} className="sm-title">
          Hi {customerName},
        </Text>
        <Text style={emailType.body} className="sm-body">
          There’s a new status on your order{' '}
          <strong style={{ color: apple.text }}>{orderId}</strong>.
        </Text>
      </Section>

      <Section style={emailPad.x} className="sm-pad-x">
        <Section style={statusCard} className="sm-card">
          <Text style={statusLabel} className="sm-label">
            Current status
          </Text>
          <Text style={statusValue} className="sm-status-lg">
            {currentStatus}
          </Text>
          <Text style={statusMsg} className="sm-body">
            {statusMessage}
          </Text>
        </Section>
      </Section>

      <Section style={emailPad.x} className="sm-pad-x">
        <Section style={emailType.infoCard} className="sm-card">
          <Text style={emailType.rowLabel} className="sm-label">
            Estimated delivery
          </Text>
          <Text style={emailType.rowValue} className="sm-value">
            {estimatedDelivery}
          </Text>
          <Hr style={emailType.divider} />
          <Text style={emailType.rowLabel} className="sm-label">
            Order ID
          </Text>
          <Text style={emailType.rowValueMono} className="sm-mono">
            {orderId}
          </Text>
        </Section>
      </Section>

      <Section style={emailPad.btn} className="sm-pad-btn">
        <Link href={trackingUrl} style={emailType.primaryBtn} className="sm-btn">
          Track your order
        </Link>
      </Section>

      <Section style={emailPad.bottom} className="sm-pad-bottom">
        <Text style={emailType.fine} className="sm-fine">
          We’ll message you again when something changes.
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default StatusUpdate;

const statusCard = {
  backgroundColor: 'rgba(175, 82, 222, 0.08)',
  borderRadius: '12px',
  padding: '16px 14px',
  border: '1px solid rgba(175, 82, 222, 0.2)',
  textAlign: 'center' as const,
};

const statusLabel = {
  margin: '0 0 4px',
  fontSize: '11px',
  fontWeight: '600' as const,
  color: apple.tertiary,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
};

const statusValue = {
  margin: '0 0 6px',
  fontSize: '18px',
  fontWeight: '700' as const,
  color: apple.text,
  letterSpacing: '-0.2px',
};

const statusMsg = {
  margin: '0',
  fontSize: '14px',
  lineHeight: '20px',
  color: apple.secondary,
};
