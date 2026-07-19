import { Section, Text, Link, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, apple, emailPad, emailType } from './components/EmailLayout';

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
      <Section style={emailPad.top} className="sm-pad-top">
        <Text style={{ ...emailType.eyebrow, color: apple.green }} className="sm-eyebrow">
          Order confirmed
        </Text>
        <Text style={emailType.title} className="sm-title">
          Thanks, {customerName}.
        </Text>
        <Text style={emailType.body} className="sm-body">
          We received your order and will process it after payment verification. You’ll get
          updates by email and WhatsApp.
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
            Items
          </Text>
          <Text style={emailType.rowValue} className="sm-value">
            {items}
          </Text>
          <Hr style={emailType.divider} />
          <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0}>
            <tr>
              <td width="50%" style={{ verticalAlign: 'top', paddingRight: '6px' }}>
                <Text style={emailType.rowLabel} className="sm-label">
                  Total
                </Text>
                <Text style={emailType.total} className="sm-total">
                  {total}
                </Text>
              </td>
              <td width="50%" style={{ verticalAlign: 'top', paddingLeft: '6px' }}>
                <Text style={emailType.rowLabel} className="sm-label">
                  Payment
                </Text>
                <Text style={emailType.rowValue} className="sm-value">
                  {paymentMethod}
                </Text>
              </td>
            </tr>
          </table>
          <Hr style={emailType.divider} />
          <Text style={emailType.rowLabel} className="sm-label">
            Status
          </Text>
          <Text style={statusPill}>Pending review</Text>
        </Section>
      </Section>

      <Section style={emailPad.btn} className="sm-pad-btn">
        <Link
          href={`https://snippymart.com/track-order?orderId=${orderId}`}
          style={emailType.primaryBtn}
          className="sm-btn"
        >
          Track your order
        </Link>
      </Section>

      <Section style={emailPad.bottom} className="sm-pad-bottom">
        <Text style={emailType.fine} className="sm-fine">
          Questions? Message us on WhatsApp — we’re happy to help.
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default OrderConfirmationEmail;

const statusPill = {
  margin: '0',
  display: 'inline-block' as const,
  backgroundColor: 'rgba(52, 199, 89, 0.12)',
  color: '#248a3d',
  fontSize: '12px',
  fontWeight: '600' as const,
  padding: '5px 10px',
  borderRadius: '980px',
};
