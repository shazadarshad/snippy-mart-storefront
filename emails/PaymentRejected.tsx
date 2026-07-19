import { Section, Text, Link, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, apple, emailPad, emailType } from './components/EmailLayout';

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
      <Section style={emailPad.top} className="sm-pad-top">
        <Text style={{ ...emailType.eyebrow, color: apple.red }} className="sm-eyebrow">
          Action needed
        </Text>
        <Text style={emailType.title} className="sm-title">
          Payment couldn’t be verified
        </Text>
        <Text style={emailType.body} className="sm-body">
          Hi {customerName}, we couldn’t confirm payment for order{' '}
          <strong style={{ color: apple.text }}>{orderId}</strong>. Your order is held for a short
          time so you can try again.
        </Text>
      </Section>

      <Section style={emailPad.x} className="sm-pad-x">
        <Section style={emailType.infoCard} className="sm-card">
          <Text style={emailType.rowLabel} className="sm-label">
            Order ID
          </Text>
          <Text style={emailType.rowValueMono} className="sm-mono">
            {orderId}
          </Text>
          <Hr style={emailType.divider} />
          <Text style={emailType.rowLabel} className="sm-label">
            Amount
          </Text>
          <Text style={emailType.rowValue} className="sm-value">
            {orderTotal}
          </Text>
          <Hr style={emailType.divider} />
          <Text style={emailType.rowLabel} className="sm-label">
            Reason
          </Text>
          <Text style={emailType.rowValue} className="sm-value">
            {rejectionReason}
          </Text>
        </Section>
      </Section>

      <Section style={emailPad.x} className="sm-pad-x">
        <Section style={tipsCard} className="sm-card">
          <Text style={tipsTitle}>What you can do</Text>
          <Text style={tipLine}>· Double-check the transfer amount and Order ID note</Text>
          <Text style={tipLine}>· Upload a clear payment screenshot</Text>
          <Text style={tipLine}>· Try another method (bank or crypto)</Text>
          <Text style={tipLine}>· Message us on WhatsApp if you need help</Text>
        </Section>
      </Section>

      <Section style={emailPad.btn} className="sm-pad-btn">
        <Link href={retryUrl} style={emailType.primaryBtn} className="sm-btn">
          Retry payment
        </Link>
      </Section>

      <Section style={emailPad.bottom} className="sm-pad-bottom">
        <Text style={emailType.fine} className="sm-fine">
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

const tipsCard = {
  backgroundColor: 'rgba(255, 59, 48, 0.06)',
  borderRadius: '12px',
  padding: '14px',
  border: '1px solid rgba(255, 59, 48, 0.15)',
};

const tipsTitle = {
  margin: '0 0 8px',
  fontSize: '13px',
  fontWeight: '700' as const,
  color: apple.text,
};

const tipLine = {
  margin: '0 0 5px',
  fontSize: '13px',
  lineHeight: '18px',
  color: apple.secondary,
};

const link = {
  color: apple.blue,
  textDecoration: 'none',
  fontWeight: '600' as const,
};
