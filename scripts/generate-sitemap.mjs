/**
 * Build public/sitemap.xml with static routes + live product URLs from Supabase.
 * Run: node scripts/generate-sitemap.mjs
 * Also hooked via npm prebuild when env is available.
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const SITE = 'https://snippymart.com';
const today = new Date().toISOString().slice(0, 10);

// Load Vite-style .env without extra deps
for (const name of ['.env.local', '.env']) {
  const p = resolve(root, name);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/products', priority: '0.95', changefreq: 'daily' },
  { path: '/claude', priority: '0.9', changefreq: 'weekly' },
  { path: '/affiliate', priority: '0.8', changefreq: 'weekly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/track-order', priority: '0.65', changefreq: 'weekly' },
  { path: '/download', priority: '0.55', changefreq: 'monthly' },
  { path: '/privacy-policy', priority: '0.35', changefreq: 'yearly' },
  { path: '/terms-of-service', priority: '0.35', changefreq: 'yearly' },
  { path: '/refund-policy', priority: '0.35', changefreq: 'yearly' },
];

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function urlEntry({ loc, lastmod, changefreq, priority, image }) {
  let body = `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>`;
  if (image) {
    body += `
    <image:image>
      <image:loc>${xmlEscape(image)}</image:loc>
    </image:image>`;
  }
  body += `
  </url>`;
  return body;
}

async function fetchProducts() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('[sitemap] No Supabase env — writing static routes only');
    return [];
  }

  try {
    const endpoint = `${url.replace(/\/$/, '')}/rest/v1/products?select=id,slug,name,image_url,updated_at,created_at&is_active=eq.true&order=display_order.asc.nullslast`;
    const res = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    if (!res.ok) {
      console.warn('[sitemap] Product fetch failed', res.status);
      return [];
    }
    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    console.warn('[sitemap] Product fetch error', e.message);
    return [];
  }
}

async function main() {
  const products = await fetchProducts();

  const urls = [
    ...staticRoutes.map((r) =>
      urlEntry({
        loc: r.path === '/' ? `${SITE}/` : `${SITE}${r.path}`,
        lastmod: today,
        changefreq: r.changefreq,
        priority: r.priority,
      }),
    ),
  ];

  for (const p of products) {
    const slug = (p.slug || p.id || '').trim();
    if (!slug) continue;
    const lastmod = (p.updated_at || p.created_at || today).toString().slice(0, 10);
    const image =
      p.image_url && String(p.image_url).startsWith('http')
        ? p.image_url
        : p.image_url
          ? `${SITE}${p.image_url.startsWith('/') ? '' : '/'}${p.image_url}`
          : null;
    urls.push(
      urlEntry({
        loc: `${SITE}/product/${encodeURIComponent(slug)}`,
        lastmod,
        changefreq: 'weekly',
        priority: '0.85',
        image,
      }),
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`;

  const out = resolve(root, 'public/sitemap.xml');
  writeFileSync(out, xml, 'utf8');
  console.log(`[sitemap] Wrote ${urls.length} URLs → public/sitemap.xml (${products.length} products)`);
}

main();
