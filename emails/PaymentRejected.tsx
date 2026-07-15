import { Section, Text, Link, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, apple } from './components/EmailLayout';

interface PaymentRejectedEmailProps {
  customerName?: string;
  orderId?: string;
  rejectionReason?: string;
  orderTotal?: string;
  retryUrl?: string;
}

export const PaymentRejected = ({
  customerName = 'Valued Customer',
  orderId = 'SNIP-2026-123456',
  rejectionReason = 'We could not verify payment',
  orderTotal = 'Rs. 1,099',
  retryUrl = 'https://snippymart.com/checkout',
}: PaymentRejectedEmailProps) => {
  return (
    <EmailLayout theme="red" previewText={`Payment issue for order ${orderId}`}>
      <Section style={padTop}>
        <Text style={eyebrow}>Action needed</Text>
        <Text style={title}>Payment couldn’t be verified</Text>
        <Text style={body}>
          Hi {customerName}, we couldn’t confirm payment for order{' '}
          <strong style={{ color: apple.text }}>{orderId}</strong>. Your order is held for a short
          time so you can try again.
        </Text>
      </Section>

      <Section style={padX}>
        <Section style={infoCard}>
          <Text style={rowLabel}>Order ID</Text>
          <Text style={rowValueMono}>{orderId}</Text>
          <Hr style={divider} />
          <Text style={rowLabel}>Amount</Text>
          <Text style={rowValue}>{orderTotal}</Text>
          <Hr style={divider} />
          <Text style={rowLabel}>Reason</Text>
          <Text style={rowValue}>{rejectionReason}</Text>
        </Section>
      </Section>

      <Section style={padX}>
        <Section style={tipsCard}>
          <Text style={tipsTitle}>What you can do</Text>
          <Text style={tipLine}>· Double-check the transfer amount and Order ID note</Text>
          <Text style={tipLine}>· Upload a clear payment screenshot</Text>
          <Text style={tipLine}>· Try another method (bank or crypto)</Text>
          <Text style={tipLine}>· Message us on WhatsApp if you need help</Text>
        </Section>
      </Section>

      <Section style={padBtn}>
        <Link href={retryUrl} style={primaryBtn}>
          Retry payment
        </Link>
      </Section>

      <Section style={padBottom}>
        <Text style={fine}>
          WhatsApp:{' '}
          <Link href="https://wa.me/94787767869" style={link}>
            +94 78 776 7869
          </Link>
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default PaymentRejected;

const padTop = { padding: '32px 28px 8px' };
const padX = { padding: '8px 20px' };
const padBtn = { padding: '16px 28px 8px', textAlign: 'center' as const };
const padBottom = { padding: '8px 28px 32px' };

const eyebrow = {
  margin: '0 0 8px',
  fontSize: '13px',
  fontWeight: '600' as const,
  color: apple.red,
  letterSpacing: '0.02em',
  textTransform: 'uppercase' as const,
};

const title = {
  margin: '0 0 12px',
  fontSize: '26px',
  fontWeight: '700' as const,
  color: apple.text,
  letterSpacing: '-0.5px',
  lineHeight: '1.2',
};

const body = {
  margin: '0',
  fontSize: '16px',
  lineHeight: '24px',
  color: apple.secondary,
};

const infoCard = {
  backgroundColor: apple.surface,
  borderRadius: '14px',
  padding: '20px 18px',
  border: `1px solid ${apple.border}`,
};

const tipsCard = {
  backgroundColor: 'rgba(255, 59, 48, 0.06)',
  borderRadius: '14px',
  padding: '18px',
  border: '1px solid rgba(255, 59, 48, 0.15)',
};

const tipsTitle = {
  margin: '0 0 10px',
  fontSize: '14px',
  fontWeight: '700' as const,
  color: apple.text,
};

const tipLine = {
  margin: '0 0 6px',
  fontSize: '14px',
  lineHeight: '20px',
  color: apple.secondary,
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
  fontWeight: '500' as const,
  color: apple.text,
};

const rowValueMono = {
  ...rowValue,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontWeight: '600' as const,
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

const link = {
  color: apple.blue,
  textDecoration: 'none',
  fontWeight: '600' as const,
};
