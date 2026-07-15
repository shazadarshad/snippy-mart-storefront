import { Section, Text, Link, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, apple } from './components/EmailLayout';

interface OrderConfirmationEmailProps {
  customerName: string;
  orderId: string;
  total: string;
  items: string;
  paymentMethod: string;
}

export const OrderConfirmationEmail = ({
  customerName = 'Valued Customer',
  orderId = 'SNIP-2026-123456',
  total = 'Rs. 1,099',
  items = 'ChatGPT Plus - 1 Month ×1',
  paymentMethod = 'Bank Transfer',
}: OrderConfirmationEmailProps) => {
  return (
    <EmailLayout theme="green" previewText={`Order ${orderId} confirmed — Snippy Mart`}>
      <Section style={padTop}>
        <Text style={eyebrow}>Order confirmed</Text>
        <Text style={title}>Thanks, {customerName}.</Text>
        <Text style={body}>
          We received your order and will process it after payment verification. You’ll get
          updates by email and WhatsApp.
        </Text>
      </Section>

      <Section style={padX}>
        <Section style={infoCard}>
          <Text style={rowLabel}>Order ID</Text>
          <Text style={rowValueMono}>{orderId}</Text>
          <Hr style={divider} />
          <Text style={rowLabel}>Items</Text>
          <Text style={rowValue}>{items}</Text>
          <Hr style={divider} />
          <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
            <tr>
              <td width="50%" style={{ verticalAlign: 'top', paddingRight: '8px' }}>
                <Text style={rowLabel}>Total</Text>
                <Text style={totalValue}>{total}</Text>
              </td>
              <td width="50%" style={{ verticalAlign: 'top', paddingLeft: '8px' }}>
                <Text style={rowLabel}>Payment</Text>
                <Text style={rowValue}>{paymentMethod}</Text>
              </td>
            </tr>
          </table>
          <Hr style={divider} />
          <Text style={rowLabel}>Status</Text>
          <Text style={statusPill}>Pending review</Text>
        </Section>
      </Section>

      <Section style={padBtn}>
        <Link
          href={`https://snippymart.com/track-order?orderId=${orderId}`}
          style={primaryBtn}
        >
          Track your order
        </Link>
      </Section>

      <Section style={padBottom}>
        <Text style={fine}>
          Questions? Message us on WhatsApp — we’re happy to help.
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default OrderConfirmationEmail;

const padTop = { padding: '32px 28px 8px' };
const padX = { padding: '8px 20px 8px' };
const padBtn = { padding: '16px 28px 8px', textAlign: 'center' as const };
const padBottom = { padding: '8px 28px 32px' };

const eyebrow = {
  margin: '0 0 8px',
  fontSize: '13px',
  fontWeight: '600' as const,
  color: apple.green,
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
  letterSpacing: '0.02em',
  textTransform: 'uppercase' as const,
};

const rowValue = {
  margin: '0 0 0',
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

const totalValue = {
  margin: '0',
  fontSize: '22px',
  fontWeight: '700' as const,
  color: apple.text,
  letterSpacing: '-0.4px',
};

const divider = {
  borderColor: apple.border,
  borderTop: `1px solid ${apple.border}`,
  margin: '14px 0',
};

const statusPill = {
  margin: '0',
  display: 'inline-block' as const,
  backgroundColor: 'rgba(52, 199, 89, 0.12)',
  color: '#248a3d',
  fontSize: '13px',
  fontWeight: '600' as const,
  padding: '6px 12px',
  borderRadius: '980px',
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
  lineHeight: '1.2',
};

const fine = {
  margin: '0',
  fontSize: '13px',
  lineHeight: '20px',
  color: apple.tertiary,
  textAlign: 'center' as const,
};
