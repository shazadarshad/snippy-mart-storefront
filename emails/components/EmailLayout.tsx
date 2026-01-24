import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Section,
    Text,
    Img,
    Row,
    Column,
} from '@react-email/components';
import * as React from 'react';
// Icon import removed as we use logo image now

export type EmailTheme = 'green' | 'purple' | 'red' | 'blue' | 'cyan' | 'orange';

interface ThemeColors {
    primary: string;
    primaryDark: string;
    shadow: string;
}

const themeColors: Record<EmailTheme, ThemeColors> = {
    green: {
        primary: '#10b981',
        primaryDark: '#059669',
        shadow: 'rgba(16, 185, 129, 0.4)',
    },
    purple: {
        primary: '#8b5cf6',
        primaryDark: '#7c3aed',
        shadow: 'rgba(139, 92, 246, 0.4)',
    },
    red: {
        primary: '#ef4444',
        primaryDark: '#dc2626',
        shadow: 'rgba(239, 68, 68, 0.4)',
    },
    blue: {
        primary: '#3b82f6',
        primaryDark: '#2563eb',
        shadow: 'rgba(59, 130, 246, 0.4)',
    },
    cyan: {
        primary: '#06b6d4',
        primaryDark: '#0891b2',
        shadow: 'rgba(6, 182, 212, 0.4)',
    },
    orange: {
        primary: '#f97316',
        primaryDark: '#ea580c',
        shadow: 'rgba(249, 115, 22, 0.4)',
    },
};

interface EmailLayoutProps {
    children: React.ReactNode;
    theme: EmailTheme;
    previewText: string;
}

export const EmailLayout = ({ children, theme, previewText }: EmailLayoutProps) => {
    const colors = themeColors[theme];

    return (
        <Html>
            <Head />
            <Body style={main}>
                <Container style={container}>
                    <Section style={card}>

                        {/* Logo Header */}
                        <Section style={header}>
                            <table align="center" border={0} cellPadding={0} cellSpacing={0} role="presentation">
                                <tr>
                                    <td style={{ paddingRight: '12px' }}>
                                        <Img
                                            src="{{logo_url}}"
                                            width="48"
                                            height="48"
                                            alt="Snippy Mart"
                                            style={{ borderRadius: '12px', objectFit: 'contain' }}
                                        />
                                    </td>
                                    <td>
                                        <Heading style={{ ...logoText, margin: 0 }}>
                                            Snippy <span style={{ color: colors.primary }}>Mart</span>
                                        </Heading>
                                    </td>
                                </tr>
                            </table>
                        </Section>

                        {/* Content */}
                        {children}

                        {/* Footer */}
                        <Section style={footer}>
                            <Row>
                                <Column align="center" style={{ paddingBottom: '15px' }}>
                                    <table role="presentation" border={0} cellPadding={0} cellSpacing={0}>
                                        <tr>
                                            <td style={{ padding: '0 6px' }}>
                                                <a href="https://snippymart.com" style={socialLink}>🌐</a>
                                            </td>
                                            <td style={{ padding: '0 6px' }}>
                                                <a href="https://wa.me/94787767869" style={{ ...socialLink, background: 'rgba(37, 211, 102, 0.2)' }}>💬</a>
                                            </td>
                                            <td style={{ padding: '0 6px' }}>
                                                <a href="https://instagram.com/snippymart" style={{ ...socialLink, background: 'rgba(228, 64, 95, 0.2)' }}>📸</a>
                                            </td>
                                        </tr>
                                    </table>
                                </Column>
                            </Row>
                            <Row>
                                <Column align="center">
                                    <Text style={footerText}>
                                        Snippy Mart • Premium Digital Subscriptions
                                    </Text>
                                    <Text style={copyright}>
                                        © 2026 All rights reserved
                                    </Text>
                                </Column>
                            </Row>
                        </Section>

                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Styles
const main = {
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    padding: '20px 0',
};

const container = {
    margin: '0 auto',
    padding: '0 10px',
    maxWidth: '600px',
};

const card = {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
};

const header = {
    padding: '32px 24px 24px',
    textAlign: 'center' as const,
};

const logoImage = {
    margin: '0 auto 12px',
    height: '48px',
    display: 'block',
    borderRadius: '12px',
};

const logoText = {
    margin: '0',
    color: '#ffffff',
    fontSize: '26px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
};

const logo = {
    margin: '0',
    color: '#ffffff',
    fontSize: '26px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
};

const footer = {
    padding: '28px 24px',
    background: 'rgba(15, 23, 42, 0.5)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    textAlign: 'center' as const,
};

const socialLink = {
    display: 'inline-block',
    width: '36px',
    height: '36px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    textAlign: 'center' as const,
    lineHeight: '36px',
    textDecoration: 'none',
    fontSize: '16px',
};

const footerText = {
    margin: '0 0 6px',
    color: '#94a3b8',
    fontSize: '12px',
};

const copyright = {
    margin: '0',
    color: '#64748b',
    fontSize: '11px',
};
