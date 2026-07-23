import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import {
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  TWITTER_HANDLE,
  absoluteUrl,
  absoluteAsset,
  plainText,
} from '@/lib/seo';

export type SEOProps = {
  title?: string;
  description?: string;
  /** Path override for canonical (defaults to current pathname without query) */
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  /** Single or multiple JSON-LD graphs */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** noindex,nofollow for private / transactional pages */
  noindex?: boolean;
  keywords?: string;
  /** Product / article author */
  author?: string;
  /** ISO date for articles */
  publishedTime?: string;
  modifiedTime?: string;
  /** Extra robots directives e.g. max-image-preview:large */
  robotsExtra?: string;
};

const SEO = ({
  title,
  description,
  path,
  image,
  type = 'website',
  jsonLd,
  noindex = false,
  keywords,
  author,
  publishedTime,
  modifiedTime,
  robotsExtra,
}: SEOProps) => {
  const { pathname, search } = useLocation();
  const { data: settings } = useSiteSettings();

  const siteName = settings?.store_name || SITE_NAME;
  // Prefer production domain always for canonical/social (not vercel preview host)
  const canonicalPath = path ?? pathname;
  const url = absoluteUrl(canonicalPath);

  const fullTitle = title
    ? title.includes(siteName)
      ? title
      : `${title} | ${siteName}`
    : `${siteName} — Premium Digital Subscriptions | AI, Streaming & More`;

  const fullDescription = plainText(description || DEFAULT_DESCRIPTION, 160);
  const fullImage = absoluteAsset(image || DEFAULT_OG_IMAGE);
  const kw = keywords || DEFAULT_KEYWORDS;

  const robots = noindex
    ? 'noindex, nofollow, noarchive'
    : `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1${
        robotsExtra ? `, ${robotsExtra}` : ''
      }`;

  const graphs = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  // Avoid indexing query-parameter thin variants in canonical (search stays on path)
  void search;

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={kw} />
      <meta name="author" content={author || siteName} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      <meta name="bingbot" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:type" content={type === 'product' ? 'product' : type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:secure_url" content={fullImage} />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      <meta property="og:image:alt" content={fullTitle} />

      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content={fullTitle} />
      <meta name="twitter:url" content={url} />

      {/* App / brand */}
      <meta name="application-name" content={siteName} />
      <meta name="apple-mobile-web-app-title" content={siteName} />
      <meta name="theme-color" content="#0d9488" />
      <meta name="format-detection" content="telephone=no" />

      {/* Geo — primary market */}
      <meta name="geo.region" content="LK" />
      <meta name="geo.placename" content="Sri Lanka" />

      {/* Structured data */}
      {graphs.map((graph, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(graph)}
        </script>
      ))}

      {/* Hint site origin for crawlers */}
      <link rel="alternate" hrefLang="en" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />
    </Helmet>
  );
};

export default SEO;

// Re-export constants for pages that need SITE_URL without pulling helpers only
export { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION };
