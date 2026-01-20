import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    type?: 'website' | 'article' | 'product';
    jsonLd?: Record<string, any>;
}

const SEO = ({
    title,
    description,
    image,
    type = 'website',
    jsonLd
}: SEOProps) => {
    const { pathname } = useLocation();
    const { data: settings } = useSiteSettings();

    const siteUrl = 'https://snippymart.vercel.app';
    const siteName = settings?.store_name || 'Snippy Mart';
    const defaultDescription = "Get the best deals on premium digital subscriptions and services with instant WhatsApp confirmation. Snippy Mart is your trusted source for digital products.";

    const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - Premium Digital Subscriptions`;
    const fullDescription = description || defaultDescription;
    const fullImage = image ? (image.startsWith('http') ? image : `${siteUrl}${image}`) : `${siteUrl}/og-image.png`;
    const url = `${siteUrl}${pathname}`;

    return (
        <Helmet>
            {/* Basic Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={fullDescription} />
            <link rel="canonical" href={url} />

            {/* OpenGraph */}
            <meta property="og:site_name" content={siteName} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={fullDescription} />
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={fullImage} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={fullDescription} />
            <meta name="twitter:image" content={fullImage} />

            {/* Structured Data (JSON-LD) */}
            {jsonLd && (
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
