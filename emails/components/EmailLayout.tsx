import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

/**
 * Apple-inspired email shell:
 * - System fonts (SF / -apple-system)
 * - Soft light canvas, generous space
 * - Fluid width for every client
 * - Table-safe structure, no heavy glass/blur
 */
export type EmailTheme = 'green' | 'purple' | 'red' | 'blue' | 'cyan' | 'orange';

const accentByTheme: Record<EmailTheme, string> = {
  green: '#34c759',
  purple: '#af52de',
  red: '#ff3b30',
  blue: '#0071e3',
  cyan: '#32ade6',
  orange: '#ff9500',
};

interface EmailLayoutProps {
  children: React.ReactNode;
  theme?: EmailTheme;
  previewText: string;
}

export const EmailLayout = ({
  children,
  theme = 'blue',
  previewText,
}: EmailLayoutProps) => {
  const accent = accentByTheme[theme] || accentByTheme.blue;

  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Brand bar */}
          <Section style={brandBar}>
            <table
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              border={0}
              width="100%"
            >
              <tr>
                <td align="center" style={{ padding: '0 0 8px' }}>
                  <Img
                    src="{{logo_url}}"
                    width="56"
                    height="56"
                    alt="Snippy Mart"
                    style={logoImg}
                  />
                </td>
              </tr>
              <tr>
                <td align="center">
                  <Text style={brandName}>
                    Snippy{' '}
                    <span style={{ color: accent, fontWeight: 600 }}>Mart</span>
                  </Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* White content card */}
          <Section style={card}>{children}</Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerLinks}>
              <Link href="https://snippymart.com" style={footerLink}>
                Website
              </Link>
              <span style={footerDot}>·</span>
              <Link href="https://wa.me/94787767869" style={footerLink}>
                WhatsApp
              </Link>
              <span style={footerDot}>·</span>
              <Link href="https://snippymart.com/track-order" style={footerLink}>
                Track order
              </Link>
            </Text>
            <Text style={footerFine}>
              Snippy Mart · Premium digital subscriptions
            </Text>
            <Text style={footerFine}>© {new Date().getFullYear()} Snippy Mart</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Shared Apple-like tokens (exported for templates)
export const apple = {
  text: '#1d1d1f',
  secondary: '#6e6e73',
  tertiary: '#86868b',
  border: '#d2d2d7',
  surface: '#f5f5f7',
  white: '#ffffff',
  blue: '#0071e3',
  green: '#34c759',
  red: '#ff3b30',
  orange: '#ff9500',
  purple: '#af52de',
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const main = {
  backgroundColor: '#f5f5f7',
  fontFamily: apple.font,
  margin: '0',
  padding: '0',
  width: '100%',
  WebkitTextSizeAdjust: '100%' as const,
};

const container = {
  margin: '0 auto',
  maxWidth: '560px',
  width: '100%',
  padding: '32px 16px 48px',
};

const brandBar = {
  padding: '8px 0 20px',
  textAlign: 'center' as const,
};

const logoImg = {
  borderRadius: '14px',
  display: 'block',
  margin: '0 auto',
  objectFit: 'contain' as const,
  maxWidth: '56px',
  height: 'auto',
};

const brandName = {
  margin: '0',
  color: apple.text,
  fontSize: '20px',
  fontWeight: '600' as const,
  letterSpacing: '-0.4px',
  lineHeight: '1.2',
};

const card = {
  backgroundColor: apple.white,
  borderRadius: '18px',
  border: `1px solid ${apple.border}`,
  // Subtle depth that works in most clients
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
  overflow: 'hidden' as const,
  padding: '0',
};

const footer = {
  padding: '28px 12px 0',
  textAlign: 'center' as const,
};

const footerLinks = {
  margin: '0 0 10px',
  fontSize: '13px',
  lineHeight: '20px',
  color: apple.secondary,
};

const footerLink = {
  color: apple.blue,
  textDecoration: 'none',
  fontWeight: '500' as const,
};

const footerDot = {
  color: apple.tertiary,
  padding: '0 8px',
};

const footerFine = {
  margin: '0 0 4px',
  fontSize: '12px',
  lineHeight: '18px',
  color: apple.tertiary,
};

export default EmailLayout;
