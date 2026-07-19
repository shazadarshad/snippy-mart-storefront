import { Section, Text, Link, Hr } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, apple, emailPad, emailType } from './components/EmailLayout';

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
      <Section style={emailPad.top} className="sm-pad-top">
        <Text style={{ ...emailType.eyebrow, color: apple.blue }} className="sm-eyebrow">
          Delivered
        </Text>
        <Text style={emailType.title} className="sm-title">
          You’re all set, {customerName}.
        </Text>
        <Text style={emailType.body} className="sm-body">
          Your order is complete. Enjoy your product — and keep your login details private.
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
            Delivered on
          </Text>
          <Text style={emailType.rowValue} className="sm-value">
            {deliveryDate}
          </Text>
          <Hr style={emailType.divider} />
          <Text style={emailType.rowLabel} className="sm-label">
            Delivery
          </Text>
          <Text style={emailType.rowValue} className="sm-value">
            {deliveryAddress}
          </Text>
          {trackingNumber && trackingNumber !== '—' && (
            <>
              <Hr style={emailType.divider} />
              <Text style={emailType.rowLabel} className="sm-label">
                Reference
              </Text>
              <Text style={emailType.rowValueMono} className="sm-mono">
                {trackingNumber}
              </Text>
            </>
          )}
        </Section>
      </Section>

      <Section style={emailPad.btn} className="sm-pad-btn">
        <Link href="https://snippymart.com/products" style={emailType.primaryBtn} className="sm-btn">
          Browse more products
        </Link>
      </Section>

      <Section style={emailPad.bottom} className="sm-pad-bottom">
        <Text style={emailType.fine} className="sm-fine">
          Need help? Reply on WhatsApp — we’re here for you.
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default OrderDelivered;
