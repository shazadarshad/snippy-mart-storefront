/**
 * Central SEO helpers for Snippy Mart (canonical domain, schemas, meta text).
 */

export const SITE_URL = 'https://snippymart.com';
export const SITE_NAME = 'Snippy Mart';
/** Prefer a real hosted asset (og-image.png may not exist on all deploys). */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/android-chrome-512x512.png`;
export const DEFAULT_LOGO = `${SITE_URL}/android-chrome-512x512.png`;
export const TWITTER_HANDLE = '@SnippyMart';
export const SUPPORT_PHONE = '+94-78-776-7869';
export const SUPPORT_WHATSAPP = 'https://wa.me/94787767869';

export const DEFAULT_DESCRIPTION =
  'Buy premium digital subscriptions at fair prices — AI tools, streaming, design software & more. Secure checkout, live order tracking, and WhatsApp support. Instant-ready delivery from Snippy Mart (Sri Lanka).';

export const DEFAULT_KEYWORDS = [
  'Snippy Mart',
  'digital subscriptions',
  'premium accounts',
  'Netflix',
  'Spotify',
  'Adobe',
  'ChatGPT',
  'Claude',
  'Canva Pro',
  'Coursera',
  'AI tools',
  'Sri Lanka',
  'instant delivery',
  'WhatsApp support',
  'cheap subscriptions',
].join(', ');

/** Absolute URL for a path (strips query/hash for canonicals). */
export function absoluteUrl(path = '/'): string {
  if (!path || path === '/') return `${SITE_URL}/`;
  if (path.startsWith('http')) {
    try {
      const u = new URL(path);
      return `${SITE_URL}${u.pathname === '/' ? '/' : u.pathname.replace(/\/$/, '') || '/'}`;
    } catch {
      return SITE_URL;
    }
  }
  const clean = path.split('?')[0].split('#')[0];
  const normalized = clean.startsWith('/') ? clean : `/${clean}`;
  if (normalized === '/') return `${SITE_URL}/`;
  return `${SITE_URL}${normalized.replace(/\/$/, '')}`;
}

export function absoluteAsset(url?: string | null): string {
  if (!url) return DEFAULT_OG_IMAGE;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  return `${SITE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

/** Plain text for meta / schema from HTML or emoji-heavy descriptions. */
export function plainText(input?: string | null, max = 160): string {
  if (!input) return '';
  const text = input
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

export function productPath(product: { slug?: string | null; id: string }): string {
  const slug = (product.slug || product.id || '').trim();
  return `/product/${encodeURIComponent(slug)}`;
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: DEFAULT_LOGO,
      width: 512,
      height: 512,
    },
    image: DEFAULT_OG_IMAGE,
    description: DEFAULT_DESCRIPTION,
    sameAs: [SUPPORT_WHATSAPP],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: SUPPORT_PHONE,
        contactType: 'customer service',
        availableLanguage: ['English', 'Sinhala'],
        areaServed: 'Worldwide',
      },
    ],
  };
}

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildStoreJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${SITE_URL}/#store`,
    name: SITE_NAME,
    image: DEFAULT_OG_IMAGE,
    url: SITE_URL,
    telephone: SUPPORT_PHONE,
    priceRange: '$$',
    currenciesAccepted: 'LKR, USD, INR',
    paymentAccepted: 'Bank Transfer, Cryptocurrency, UPI',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'LK',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      opens: '00:00',
      closes: '23:59',
    },
    parentOrganization: { '@id': `${SITE_URL}/#organization` },
  };
}

export type BreadcrumbItem = { name: string; path: string };

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildProductJsonLd(product: {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  price: number;
  old_price?: number | null;
  image_url?: string | null;
  category?: string | null;
  stock_status?: string | null;
}) {
  const url = absoluteUrl(productPath(product));
  const availability =
    product.stock_status === 'out_of_stock'
      ? 'https://schema.org/OutOfStock'
      : product.stock_status === 'limited'
        ? 'https://schema.org/LimitedAvailability'
        : 'https://schema.org/InStock';

  const offers: Record<string, unknown> = {
    '@type': 'Offer',
    url,
    priceCurrency: 'LKR',
    price: Number(product.price) || 0,
    availability,
    itemCondition: 'https://schema.org/NewCondition',
    seller: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  if (product.old_price && product.old_price > product.price) {
    // price is current; old_price is list price
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    description: plainText(product.description, 5000) || product.name,
    image: [absoluteAsset(product.image_url)],
    sku: product.id,
    mpn: product.slug || product.id,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    category: product.category || 'Digital Subscription',
    url,
    offers,
  };
}

export function buildItemListJsonLd(
  products: Array<{ id: string; name: string; slug?: string | null }>,
  listName = 'Featured products',
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    itemListElement: products.slice(0, 24).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.name,
      url: absoluteUrl(productPath(p)),
    })),
  };
}

export function buildFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
}
