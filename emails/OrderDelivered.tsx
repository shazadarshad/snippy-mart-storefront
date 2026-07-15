import { Section, Text, Link, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, apple } from './components/EmailLayout';

interface OrderDeliveredEmailProps {
  customerName?: string;
  orderId?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  trackingNumber?: string;
}

export const OrderDelivered = ({
  customerName = 'Valued Customer',
  orderId = 'SNIP-2026-123456',
  deliveryDate = 'Today',
  deliveryAddress = 'Digital delivery via WhatsApp / email',
  trackingNumber = '—',
}: OrderDeliveredEmailProps) => {
  return (
    <EmailLayout theme="blue" previewText={`Your order ${orderId} has been delivered`}>
      <Section style={padTop}>
        <Text style={eyebrow}>Delivered</Text>
        <Text style={title}>You’re all set, {customerName}.</Text>
        <Text style={body}>
          Your order is complete. Enjoy your product — and keep your login details private.
        </Text>
      </Section>

      <Section style={padX}>
        <Section style={infoCard}>
          <Text style={rowLabel}>Order ID</Text>
          <Text style={rowValueMono}>{orderId}</Text>
          <Hr style={divider} />
          <Text style={rowLabel}>Delivered on</Text>
          <Text style={rowValue}>{deliveryDate}</Text>
          <Hr style={divider} />
          <Text style={rowLabel}>Delivery</Text>
          <Text style={rowValue}>{deliveryAddress}</Text>
          {trackingNumber && trackingNumber !== '—' && (
            <>
              <Hr style={divider} />
              <Text style={rowLabel}>Reference</Text>
              <Text style={rowValueMono}>{trackingNumber}</Text>
            </>
          )}
        </Section>
      </Section>

      <Section style={padBtn}>
        <Link href="https://snippymart.com/products" style={primaryBtn}>
          Browse more products
        </Link>
      </Section>

      <Section style={padBottom}>
        <Text style={fine}>
          Need help? Reply on WhatsApp — we’re here for you.
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default OrderDelivered;

const padTop = { padding: '32px 28px 8px' };
const padX = { padding: '8px 20px' };
const padBtn = { padding: '16px 28px 8px', textAlign: 'center' as const };
const padBottom = { padding: '8px 28px 32px' };

const eyebrow = {
  margin: '0 0 8px',
  fontSize: '13px',
  fontWeight: '600' as const,
  color: apple.blue,
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

const infoCard = {
  backgroundColor: apple.surface,
  borderRadius: '14px',
  padding: '20px 18px',
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
  fontWeight: '500' as const,
  color: apple.text,
  lineHeight: '22px',
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
