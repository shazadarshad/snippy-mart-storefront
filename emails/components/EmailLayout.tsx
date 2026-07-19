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
 * Apple-inspired email shell — compact on mobile, same clean UI.
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

/** Shared mobile-friendly content tokens (use in templates) */
export const emailPad = {
  top: { padding: '24px 18px 6px' },
  x: { padding: '6px 14px' },
  btn: { padding: '12px 18px 6px', textAlign: 'center' as const },
  bottom: { padding: '6px 18px 24px' },
};

export const emailType = {
  eyebrow: {
    margin: '0 0 6px',
    fontSize: '12px',
    fontWeight: '600' as const,
    letterSpacing: '0.02em',
    textTransform: 'uppercase' as const,
  },
  title: {
    margin: '0 0 10px',
    fontSize: '22px',
    fontWeight: '700' as const,
    color: '#1d1d1f',
    letterSpacing: '-0.4px',
    lineHeight: '1.2',
  },
  body: {
    margin: '0',
    fontSize: '15px',
    lineHeight: '22px',
    color: '#6e6e73',
  },
  rowLabel: {
    margin: '0 0 3px',
    fontSize: '11px',
    fontWeight: '600' as const,
    color: '#86868b',
    letterSpacing: '0.02em',
    textTransform: 'uppercase' as const,
  },
  rowValue: {
    margin: '0',
    fontSize: '15px',
    fontWeight: '500' as const,
    color: '#1d1d1f',
    lineHeight: '21px',
  },
  rowValueMono: {
    margin: '0',
    fontSize: '14px',
    fontWeight: '600' as const,
    color: '#1d1d1f',
    lineHeight: '21px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  },
  total: {
    margin: '0',
    fontSize: '18px',
    fontWeight: '700' as const,
    color: '#1d1d1f',
    letterSpacing: '-0.3px',
  },
  infoCard: {
    backgroundColor: '#f5f5f7',
    borderRadius: '12px',
    padding: '14px 14px',
    border: '1px solid #d2d2d7',
  },
  divider: {
    borderColor: '#d2d2d7',
    borderTop: '1px solid #d2d2d7',
    margin: '12px 0',
  },
  primaryBtn: {
    display: 'inline-block',
    backgroundColor: '#0071e3',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600' as const,
    textDecoration: 'none',
    padding: '12px 22px',
    borderRadius: '980px',
    lineHeight: '1.2',
  },
  fine: {
    margin: '0',
    fontSize: '12px',
    lineHeight: '18px',
    color: '#86868b',
    textAlign: 'center' as const,
  },
};

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
        <style>
          {`
            /* Mobile: keep UI, shrink type & padding */
            @media only screen and (max-width: 620px) {
              .email-container {
                padding: 14px 10px 24px !important;
                width: 100% !important;
                max-width: 100% !important;
              }
              .email-logo {
                width: 40px !important;
                height: 40px !important;
                max-width: 40px !important;
              }
              .email-brand {
                font-size: 15px !important;
              }
              .email-brand-bar {
                padding: 4px 0 12px !important;
              }
              .email-card {
                border-radius: 14px !important;
              }
              .email-footer {
                padding: 18px 8px 0 !important;
              }
              .sm-pad-top { padding: 18px 14px 4px !important; }
              .sm-pad-x { padding: 4px 12px !important; }
              .sm-pad-btn { padding: 10px 14px 4px !important; }
              .sm-pad-bottom { padding: 4px 14px 18px !important; }
              .sm-title { font-size: 20px !important; line-height: 1.2 !important; letter-spacing: -0.3px !important; }
              .sm-body { font-size: 14px !important; line-height: 20px !important; }
              .sm-eyebrow { font-size: 11px !important; }
              .sm-card { padding: 12px !important; border-radius: 10px !important; }
              .sm-label { font-size: 10px !important; }
              .sm-value { font-size: 14px !important; line-height: 20px !important; }
              .sm-mono { font-size: 13px !important; }
              .sm-total { font-size: 17px !important; }
              .sm-status-lg { font-size: 18px !important; }
              .sm-btn {
                font-size: 14px !important;
                padding: 11px 18px !important;
              }
              .sm-fine { font-size: 11px !important; line-height: 16px !important; }
              .sm-footer-link { font-size: 12px !important; }
              .sm-footer-fine { font-size: 11px !important; }
            }
          `}
        </style>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container} className="email-container">
          <Section style={brandBar} className="email-brand-bar">
            <table
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              border={0}
              width="100%"
            >
              <tr>
                <td align="center" style={{ padding: '0 0 6px' }}>
                  <Img
                    src="{{logo_url}}"
                    width="44"
                    height="44"
                    alt="Snippy Mart"
                    style={logoImg}
                    className="email-logo"
                  />
                </td>
              </tr>
              <tr>
                <td align="center">
                  <Text style={brandName} className="email-brand">
                    Snippy{' '}
                    <span style={{ color: accent, fontWeight: 600 }}>Mart</span>
                  </Text>
                </td>
              </tr>
            </table>
          </Section>

          <Section style={card} className="email-card">
            {children}
          </Section>

          <Section style={footer} className="email-footer">
            <Text style={footerLinks} className="sm-footer-link">
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
            <Text style={footerFine} className="sm-footer-fine">
              Snippy Mart · Premium digital subscriptions
            </Text>
            <Text style={footerFine} className="sm-footer-fine">
              © {new Date().getFullYear()} Snippy Mart
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

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
  maxWidth: '520px',
  width: '100%',
  padding: '20px 12px 32px',
};

const brandBar = {
  padding: '4px 0 14px',
  textAlign: 'center' as const,
};

const logoImg = {
  borderRadius: '12px',
  display: 'block',
  margin: '0 auto',
  objectFit: 'contain' as const,
  maxWidth: '44px',
  height: 'auto',
};

const brandName = {
  margin: '0',
  color: apple.text,
  fontSize: '17px',
  fontWeight: '600' as const,
  letterSpacing: '-0.3px',
  lineHeight: '1.2',
};

const card = {
  backgroundColor: apple.white,
  borderRadius: '16px',
  border: `1px solid ${apple.border}`,
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden' as const,
  padding: '0',
};

const footer = {
  padding: '20px 10px 0',
  textAlign: 'center' as const,
};

const footerLinks = {
  margin: '0 0 8px',
  fontSize: '12px',
  lineHeight: '18px',
  color: apple.secondary,
};

const footerLink = {
  color: apple.blue,
  textDecoration: 'none',
  fontWeight: '500' as const,
};

const footerDot = {
  color: apple.tertiary,
  padding: '0 6px',
};

const footerFine = {
  margin: '0 0 3px',
  fontSize: '11px',
  lineHeight: '16px',
  color: apple.tertiary,
};

export default EmailLayout;
