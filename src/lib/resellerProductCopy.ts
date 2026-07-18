/**
 * Customer-facing copy & image for reseller API products.
 * Rewrites raw seller titles/descriptions into Snippy store style.
 */

/** Brand-friendly gradients for generated product art */
const GRADIENTS = [
  ['#0f766e', '#059669', '#34d399'], // emerald
  ['#1e3a5f', '#2563eb', '#60a5fa'], // blue
  ['#4c1d95', '#7c3aed', '#a78bfa'], // violet
  ['#9a3412', '#ea580c', '#fb923c'], // orange
  ['#831843', '#db2777', '#f472b6'], // pink
  ['#134e4a', '#0d9488', '#2dd4bf'], // teal
  ['#1e293b', '#475569', '#94a3b8'], // slate
  ['#713f12', '#ca8a04', '#facc15'], // amber
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapTitleLines(title: string, maxChars = 18, maxLines = 3): string[] {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxChars) {
      cur = next;
    } else {
      if (cur) lines.push(cur);
      cur = w.length > maxChars ? w.slice(0, maxChars - 1) + '…' : w;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines.length ? lines : ['Digital Product'];
}

/** Clean & title-case a product name for the storefront */
export function polishProductTitle(raw: string): string {
  let s = String(raw || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!s) return 'Digital Product';

  // Strip seller noise
  s = s
    .replace(/\b(wholesale|reseller|api only|private stock|test product)\b/gi, '')
    .replace(/[|_]{2,}/g, ' ')
    .replace(/\s*[-–—|]\s*auto\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Common brand fixes
  const brandMap: Array<[RegExp, string]> = [
    [/\bchatgpt\b/gi, 'ChatGPT'],
    [/\bgpt[-\s]?4o?\b/gi, 'GPT-4'],
    [/\bclaude\b/gi, 'Claude'],
    [/\bcursor\b/gi, 'Cursor'],
    [/\bnetflix\b/gi, 'Netflix'],
    [/\bspotify\b/gi, 'Spotify'],
    [/\byoutube\b/gi, 'YouTube'],
    [/\bcanva\b/gi, 'Canva'],
    [/\badobe\b/gi, 'Adobe'],
    [/\bmicrosoft\b/gi, 'Microsoft'],
    [/\boffice\s*365\b/gi, 'Office 365'],
    [/\bcopilot\b/gi, 'Copilot'],
    [/\bmotion\b/gi, 'Motion'],
    [/\bmidjourney\b/gi, 'Midjourney'],
    [/\bcapcut\b/gi, 'CapCut'],
    [/\bhulu\b/gi, 'Hulu'],
    [/\bdisney\+?\b/gi, 'Disney+'],
    [/\bprime\s*video\b/gi, 'Prime Video'],
    [/\bgrammarly\b/gi, 'Grammarly'],
    [/\bnotion\b/gi, 'Notion'],
    [/\bfigma\b/gi, 'Figma'],
  ];
  for (const [re, rep] of brandMap) s = s.replace(re, rep);

  // Expand duration shorthand BEFORE title-case
  // IMPORTANT: do NOT use \b between digit and unit letter — "12m" has no boundary there.
  // 12m / 12mo / 12mos → 12 Months | 1m → 1 Month
  const unit = (n: string, one: string, many: string) =>
    `${n} ${Number(n) === 1 ? one : many}`;

  s = s
    // months (longest first) — allow glued forms like 12m / Factory12m
    .replace(/(\d+)\s*(?:months?|mos?|m)(?![a-z])/gi, (_, n) => ` ${unit(n, 'Month', 'Months')} `)
    .replace(/(\d+)\s*(?:years?|yrs?|y)(?![a-z])/gi, (_, n) => ` ${unit(n, 'Year', 'Years')} `)
    .replace(/(\d+)\s*(?:weeks?|wks?|w)(?![a-z])/gi, (_, n) => ` ${unit(n, 'Week', 'Weeks')} `)
    .replace(/(\d+)\s*(?:days?|d)(?![a-z])/gi, (_, n) => ` ${unit(n, 'Day', 'Days')} `)
    .replace(/(\d+)\s*(?:hours?|hrs?|h)(?![a-z])/gi, (_, n) => ` ${unit(n, 'Hour', 'Hours')} `)
    .replace(/\s+/g, ' ')
    .trim();

  s = s
    .replace(/\bpremium\b/gi, 'Premium')
    .replace(/\bprem\b/gi, 'Premium')
    .replace(/\bpro\b/gi, 'Pro')
    .replace(/\bplus\b/gi, 'Plus')
    .replace(/\bbasic\b/gi, 'Basic')
    .replace(/\bshared\b/gi, 'Shared')
    .replace(/\bprivate\b/gi, 'Private')
    .replace(/\baccount\b/gi, 'Account')
    .replace(/\blicen[cs]e\b/gi, 'License')
    .replace(/\bsubscriptions?\b/gi, 'Subscription')
    .replace(/\bsubs\b/gi, 'Subscription')
    .replace(/\bfactory\b/gi, 'Factory');

  // Title case (keep small words lowercase unless first)
  const small = new Set(['a', 'an', 'and', 'or', 'the', 'of', 'for', 'to', 'in', 'on', 'with']);
  const keep = new Set([
    'ChatGPT',
    'YouTube',
    'Office',
    'Midjourney',
    'CapCut',
    'GPT-4',
    'Disney+',
    'Month',
    'Months',
    'Year',
    'Years',
    'Day',
    'Days',
    'Week',
    'Weeks',
    'Hour',
    'Hours',
  ]);
  const parts = s.split(/\s+/);
  s = parts
    .map((w, i) => {
      if (keep.has(w)) return w;
      if (/^[A-Z0-9+.-]{2,}$/.test(w) && /[A-Z]/.test(w) && /[0-9+]/.test(w)) return w;
      if (/^(ChatGPT|YouTube|Office|Midjourney|CapCut|GPT-4|Disney\+)$/i.test(w)) {
        return w.replace(/^chatgpt$/i, 'ChatGPT').replace(/^youtube$/i, 'YouTube');
      }
      // Preserve already expanded units
      if (/^(Months?|Years?|Days?|Weeks?|Hours?)$/i.test(w)) {
        const lower = w.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }
      const lower = w.toLowerCase();
      if (i > 0 && small.has(lower)) return lower;
      if (/^[A-Z][a-z]+[A-Z]/.test(w) || w.includes('+')) return w;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Fix "1 Months" → "1 Month" if any slipped through
  s = s
    .replace(/\b1 Months\b/g, '1 Month')
    .replace(/\b1 Years\b/g, '1 Year')
    .replace(/\b1 Days\b/g, '1 Day')
    .replace(/\b1 Weeks\b/g, '1 Week');

  if (s.length < 3) s = 'Digital Product';

  return s;
}

/**
 * Strip Telegram custom-emoji / seller panel junk:
 * {ce:5413879192267805083}, {ce:123:⚡}, leftover "ce:123}", etc.
 */
export function stripEntityJunk(s: string): string {
  return String(s || '')
    .replace(/\{ce:\d+(?::[^}]*)?\}/gi, ' ')
    .replace(/\{[a-z]{1,8}:\d+(?::[^}]*)?\}/gi, ' ')
    .replace(/ce:\d+\}?/gi, ' ')
    .replace(/\{ce:\d*/gi, ' ')
    .replace(/\{\d{6,}\}/g, ' ')
    .replace(/\{[^}]{0,80}\}/g, ' ')
    .replace(/\b\d{12,}\b/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ');
}

/** True if text still has seller/Telegram bluff junk */
export function hasSellerJunk(text: string): boolean {
  if (!text) return false;
  return (
    /ce:\d+/i.test(text) ||
    /\{[^}]{0,80}\}/.test(text) ||
    /\b\d{15,}\b/.test(text)
  );
}

function cleanApiText(raw: string): string {
  let s = String(raw || '');
  s = stripEntityJunk(s);
  s = s
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  s = stripEntityJunk(s);

  // Split glued seller phrases into separate lines
  s = s
    .replace(
      /\s*(?=(?:Duration|Warranty|Type|Plan|Account|Delivery|Region|Note|Valid|Includes?)\s*:)/gi,
      '\n',
    )
    .replace(/\s+(?=Official\s+Coupon)/gi, '\n')
    .replace(/\s+(?=No\s+Warranty)/gi, '\n')
    .replace(/\s+(?=On\s+Your\s+Account)/gi, '\n')
    .replace(/\s+(?=Instant\s+Deliver)/gi, '\n')
    .replace(/\s+(?=Auto\s+Deliver)/gi, '\n');

  s = stripEntityJunk(s);

  return s
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[|]{2,}/g, ' ')
    .trim();
}

function looksDirty(text: string): boolean {
  if (!text || text.length < 8) return true;
  if (/\{?ce:\d+/i.test(text)) return true;
  if (/\{[^}]{6,}\}/.test(text)) return true;
  // Too many digits in braces residue
  if ((text.match(/\d{10,}/g) || []).length >= 1) return true;
  // Mostly symbols / garbage ratio
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  if (letters < 12) return true;
  return false;
}

function sentenceCase(line: string): string {
  const t = line.trim();
  if (!t) return '';
  if (t.length < 40 && t === t.toUpperCase() && /[A-Z]/.test(t)) {
    return t.charAt(0) + t.slice(1).toLowerCase();
  }
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Pull ONLY whitelisted facts from seller text.
 * Never paste free-form API lines (they often contain ce: junk).
 */
function extractFacts(text: string): string[] {
  const facts: string[] = [];
  // Work on stripped text only — still match keywords even if junk sat between words
  const src = stripEntityJunk(String(text || '')).replace(/\s+/g, ' ');

  const dur = src.match(/duration\s*:?\s*(\d+)\s*(months?|years?|days?|mo|m|yrs?|y|d)?/i)
    || src.match(/(\d+)\s*(months?|years?|days?)\b/i);
  if (dur) {
    const n = dur[1];
    const unitRaw = (dur[2] || 'month').toLowerCase();
    let unit = Number(n) === 1 ? 'Month' : 'Months';
    if (/^y/.test(unitRaw)) unit = Number(n) === 1 ? 'Year' : 'Years';
    else if (/^d/.test(unitRaw)) unit = Number(n) === 1 ? 'Day' : 'Days';
    else if (/^m/.test(unitRaw)) unit = Number(n) === 1 ? 'Month' : 'Months';
    facts.push(`Duration: **${n} ${unit}**.`);
  }

  if (/coupon/i.test(src)) {
    facts.push('Includes an **official coupon / activation code**.');
  }
  if (/no\s+warranty/i.test(src)) {
    facts.push('**No warranty after activation** — follow the product rules carefully.');
  }
  if (/on\s+your\s+(own\s+)?account/i.test(src)) {
    facts.push('Activated **on your own account** (you keep ownership).');
  }
  if (/\bprivate\b/i.test(src) && /account/i.test(src)) {
    facts.push('**Private account** access where applicable.');
  }
  if (/instant|auto\s*deliver/i.test(src)) {
    facts.push('**Instant auto delivery** after payment confirmation.');
  }

  // NO free-form line pasting — seller blobs are too dirty
  return facts.slice(0, 6);
}

function guessCategoryHints(title: string): { emoji: string; kind: string; benefits: string[] } {
  const t = title.toLowerCase();
  if (/netflix|disney|hulu|prime|streaming|youtube\s*prem/i.test(t)) {
    return {
      emoji: '🎬',
      kind: 'streaming subscription',
      benefits: [
        'Premium streaming access as described for this plan.',
        'Watch on supported devices after delivery.',
        'Ideal for entertainment without long wait times.',
      ],
    };
  }
  if (/spotify|music|deezer|tidal/i.test(t)) {
    return {
      emoji: '🎵',
      kind: 'music subscription',
      benefits: [
        'Ad-free listening experience where included in the plan.',
        'Access on mobile and desktop apps after activation.',
        'Perfect for daily listening and offline use when supported.',
      ],
    };
  }
  if (/chatgpt|gpt|claude|gemini|ai|midjourney|cursor|copilot/i.test(t)) {
    return {
      emoji: '🤖',
      kind: 'AI tool access',
      benefits: [
        'Access advanced AI features included with this plan.',
        'Faster workflows for writing, coding, and creative work.',
        'Credentials delivered automatically after payment confirmation.',
      ],
    };
  }
  if (/canva|adobe|figma|design|capcut/i.test(t)) {
    return {
      emoji: '🎨',
      kind: 'design tool',
      benefits: [
        'Premium design tools and templates where included.',
        'Create professional visuals without extra waiting.',
        'Great for creators, students, and small businesses.',
      ],
    };
  }
  if (/office|microsoft|notion|grammarly|productivity/i.test(t)) {
    return {
      emoji: '💼',
      kind: 'productivity suite',
      benefits: [
        'Work-ready tools for documents, notes, and collaboration.',
        'Use on supported devices after delivery.',
        'A practical upgrade for school or professional work.',
      ],
    };
  }
  return {
    emoji: '⚡',
    kind: 'digital product',
    benefits: [
      'Genuine digital access for the plan you selected.',
      'Delivered automatically after we confirm your payment.',
      'Track your order anytime for credentials and status.',
    ],
  };
}

/**
 * Build a polished storefront description (works with FormattedDescription).
 * 100% our template — never pastes raw seller/Telegram text.
 */
export function polishProductDescription(opts: {
  title: string;
  apiDescription?: string | null;
}): string {
  const title = polishProductTitle(opts.title);
  const hints = guessCategoryHints(title);

  // Only whitelisted keyword facts (duration, coupon, warranty…) — never raw blobs
  const facts = extractFacts(opts.apiDescription || '');

  const intro = `Get **${title}** — a premium ${hints.kind} from Snippy Mart with fast auto delivery after payment confirmation.`;

  const whatYouGet =
    facts.length > 0
      ? facts
      : hints.benefits.map((b) => (b.endsWith('.') ? b : `${b}.`));

  const lines = [
    `${hints.emoji} ${title}`,
    '',
    intro,
    '',
    '✨ What you get',
    ...whatYouGet.map((b) => {
      const body = String(b)
        .replace(/^(?:✅|✓|✔|•)\s+/, '')
        .trim();
      return `✅ ${body}`;
    }),
    '',
    '🚀 How it works',
    '✅ Place your order and complete payment on Snippy Mart.',
    '✅ We verify payment, then delivery runs automatically.',
    '✅ Open Track Order to view your product credentials instantly.',
    '',
    '💡 Important',
    '✅ This is an **Auto Product** — fulfilled by our automated system.',
    '✅ Keep your Order ID ready if you contact WhatsApp support.',
    '✅ Delivery details appear on your Track Order page when ready.',
  ];

  let out = lines.join('\n');

  // Nuclear safety: if any junk leaked, fall back to pure template (no API facts)
  if (hasSellerJunk(out) || /ce:\d+/i.test(out)) {
    out = [
      `${hints.emoji} ${title}`,
      '',
      intro,
      '',
      '✨ What you get',
      ...hints.benefits.map((b) => `✅ ${b.endsWith('.') ? b : `${b}.`}`),
      '',
      '🚀 How it works',
      '✅ Place your order and complete payment on Snippy Mart.',
      '✅ We verify payment, then delivery runs automatically.',
      '✅ Open Track Order to view your product credentials instantly.',
      '',
      '💡 Important',
      '✅ This is an **Auto Product** — fulfilled by our automated system.',
      '✅ Keep your Order ID ready if you contact WhatsApp support.',
      '✅ Delivery details appear on your Track Order page when ready.',
    ].join('\n');
  }

  return out.replace(/\n{3,}/g, '\n\n').trim();
}

/** Derive dark brand-v2 background pair from accent hex (matches store brand-v2 tiles). */
function darkBrandBackground(accentHex: string): [string, string] {
  const h = accentHex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) || 16;
  const g = parseInt(h.slice(2, 4), 16) || 16;
  const b = parseInt(h.slice(4, 6), 16) || 24;
  const c1 = `#${[r, g, b]
    .map((v) => Math.max(8, Math.round(v * 0.12)).toString(16).padStart(2, '0'))
    .join('')}`;
  const c2 = `#${[r, g, b]
    .map((v) => Math.max(14, Math.round(v * 0.22)).toString(16).padStart(2, '0'))
    .join('')}`;
  return [c1, c2];
}

/**
 * Exact brand-v2 layout used by normal store products:
 * 800×800 · dark gradient · radial glow · logo rings · title · SNIPPY MART
 */
function buildBrandV2Svg(opts: {
  title: string;
  accent: string;
  uid: string;
  /** Inner logo markup already sized for 24×24 viewBox, or null for monogram */
  logoInner: string | null;
}): string {
  const polished = polishProductTitle(opts.title);
  // Prefer splitting duration onto second line (like "Canva Pro" / "1 Year")
  let lines = wrapTitleLines(polished, 22, 2);
  const durMatch = polished.match(/^(.*?)(\d+\s+(?:Months?|Years?|Days?|Weeks?|Hours?))$/i);
  if (durMatch?.[1]?.trim() && durMatch[2]) {
    lines = [durMatch[1].trim(), durMatch[2].trim()];
  }

  const [bg1, bg2] = darkBrandBackground(opts.accent);
  const accent = opts.accent.replace('#', '');
  const id = opts.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'x';

  const titleSvg = lines
    .map((line, i) => {
      const y = 560 + i * 44;
      return `<text x="400" y="${y}" text-anchor="middle" fill="#FFFFFF" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="34" font-weight="700" letter-spacing="-0.4">${escapeXml(line)}</text>`;
    })
    .join('\n  ');

  const monogram = (polished.replace(/[^A-Za-z0-9]/g, '').charAt(0) || 'A').toUpperCase();
  const logoGroup = opts.logoInner
    ? `<g transform="translate(-70,-70) scale(5.833)">${opts.logoInner}</g>`
    : `<text text-anchor="middle" dominant-baseline="central" fill="#${accent}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="64" font-weight="800">${escapeXml(monogram)}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg-${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <radialGradient id="glow-${id}" cx="50%" cy="32%" r="50%">
      <stop offset="0%" stop-color="#${accent}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${bg1}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg-${id})"/>
  <rect width="800" height="800" fill="url(#glow-${id})"/>
  <g transform="translate(400, 300)">
    <circle r="110" fill="#FFFFFF" fill-opacity="0.08"/>
    <circle r="96" fill="#FFFFFF" fill-opacity="0.06" stroke="#${accent}" stroke-opacity="0.45" stroke-width="2"/>
    ${logoGroup}
  </g>
  ${titleSvg}
  <text x="400" y="730" text-anchor="middle" fill="#FFFFFF" fill-opacity="0.4" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="16" font-weight="600" letter-spacing="4">SNIPPY MART</text>
</svg>`;
}

/** Fallback brand-v2 tile when no official logo is available */
export function buildAutoProductImageDataUrl(title: string): string {
  const polished = polishProductTitle(title);
  const [, , accent] = GRADIENTS[hashStr(polished) % GRADIENTS.length];
  const svg = buildBrandV2Svg({
    title: polished,
    accent: accent.replace('#', ''),
    uid: hashStr(polished).toString(16),
    logoInner: null,
  });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function pickApiDescriptionField(rp: Record<string, unknown>): string | null {
  const keys = [
    'description',
    'desc',
    'details',
    'detail',
    'info',
    'about',
    'product_description',
    'long_description',
  ];
  for (const k of keys) {
    const v = rp[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

export function pickApiImageField(rp: Record<string, unknown>): string | null {
  const keys = ['image_url', 'image', 'img', 'thumbnail', 'thumb', 'icon', 'cover', 'photo', 'logo'];
  for (const k of keys) {
    const v = rp[k];
    if (typeof v === 'string' && v.trim()) {
      const u = v.trim();
      if (/^https?:\/\//i.test(u)) return u;
      if (u.startsWith('//')) return `https:${u}`;
    }
  }
  return null;
}

/** Brand → official logo (Simple Icons CDN) + brand color */
type BrandLogo = { slug: string; color: string; label: string; match: RegExp };

const BRAND_LOGOS: BrandLogo[] = [
  { slug: 'netflix', color: 'E50914', label: 'Netflix', match: /\bnetflix\b/i },
  { slug: 'spotify', color: '1DB954', label: 'Spotify', match: /\bspotify\b/i },
  { slug: 'youtube', color: 'FF0000', label: 'YouTube', match: /\byoutube\b/i },
  { slug: 'disneyplus', color: '113CCF', label: 'Disney+', match: /\bdisney\+?\b/i },
  { slug: 'primevideo', color: '00A8E1', label: 'Prime Video', match: /\bprime\b/i },
  { slug: 'hulu', color: '1CE783', label: 'Hulu', match: /\bhulu\b/i },
  { slug: 'openai', color: '412991', label: 'ChatGPT', match: /\bchatgpt\b|\bgpt\b|\bopenai\b/i },
  { slug: 'anthropic', color: 'D4A27F', label: 'Claude', match: /\bclaude\b|\banthropic\b/i },
  { slug: 'google', color: '4285F4', label: 'Google', match: /\bgoogle\b|\bgemini\b/i },
  { slug: 'cursor', color: '000000', label: 'Cursor', match: /\bcursor\b/i },
  { slug: 'canva', color: '00C4CC', label: 'Canva', match: /\bcanva\b/i },
  { slug: 'adobe', color: 'FF0000', label: 'Adobe', match: /\badobe\b|\bphotoshop\b|\bpremiere\b/i },
  { slug: 'figma', color: 'F24E1E', label: 'Figma', match: /\bfigma\b/i },
  { slug: 'microsoft', color: '5E5E5E', label: 'Microsoft', match: /\bmicrosoft\b|\boffice\b|\bcopilot\b/i },
  { slug: 'notion', color: '000000', label: 'Notion', match: /\bnotion\b/i },
  { slug: 'grammarly', color: '15C39A', label: 'Grammarly', match: /\bgrammarly\b/i },
  { slug: 'capcut', color: '000000', label: 'CapCut', match: /\bcapcut\b/i },
  { slug: 'midjourney', color: '000000', label: 'Midjourney', match: /\bmidjourney\b/i },
  { slug: 'github', color: '181717', label: 'GitHub', match: /\bgithub\b|\bcopilot\b/i },
  { slug: 'steam', color: '000000', label: 'Steam', match: /\bsteam\b/i },
  { slug: 'playstation', color: '003791', label: 'PlayStation', match: /\bplaystation\b|\bpsn\b|\bps\s?[45]\b/i },
  { slug: 'xbox', color: '107C10', label: 'Xbox', match: /\bxbox\b|\bgame\s*pass\b/i },
  { slug: 'apple', color: '000000', label: 'Apple', match: /\bapple\b|\bicloud\b|\bapple\s*music\b/i },
  { slug: 'duolingo', color: '58CC02', label: 'Duolingo', match: /\bduolingo\b/i },
  { slug: 'linkedin', color: '0A66C2', label: 'LinkedIn', match: /\blinkedin\b/i },
  { slug: 'instagram', color: 'E4405F', label: 'Instagram', match: /\binstagram\b|\big\b/i },
  { slug: 'telegram', color: '26A5E4', label: 'Telegram', match: /\btelegram\b/i },
  { slug: 'whatsapp', color: '25D366', label: 'WhatsApp', match: /\bwhatsapp\b/i },
];

export function detectBrandLogo(title: string): BrandLogo | null {
  for (const b of BRAND_LOGOS) {
    if (b.match.test(title)) return b;
  }
  return null;
}

/** Official logo URL (SVG) from Simple Icons via jsDelivr (stable) */
export function officialLogoUrl(brand: BrandLogo): string {
  return `https://cdn.jsdelivr.net/npm/simple-icons@11.15.0/icons/${brand.slug}.svg`;
}

/** Logo path fill — pure black logos need white on dark brand-v2 tiles */
function logoPathFill(brand: BrandLogo): string {
  const c = brand.color.toLowerCase().replace('#', '');
  if (c === '000000' || c === '000' || c === '181717') return 'FFFFFF';
  return brand.color.replace('#', '');
}

/** Ring/glow accent — avoid pure black on dark backgrounds */
function brandAccentForTile(brand: BrandLogo): string {
  const c = brand.color.toLowerCase().replace('#', '');
  if (c === '000000' || c === '000' || c === '181717') return '94A3B8';
  return brand.color.replace('#', '');
}

/** Fetch Simple Icons SVG and return inner path markup (24×24) for brand-v2 embedding */
async function fetchLogoInnerPaths(brand: BrandLogo): Promise<string | null> {
  try {
    const res = await fetch(officialLogoUrl(brand));
    if (!res.ok) return null;
    const svgText = await res.text();
    const paths = [...svgText.matchAll(/<path\b[^>]*>/gi)].map((m) => m[0]);
    if (!paths.length) return null;
    const fill = logoPathFill(brand);
    return paths
      .map((p) => {
        if (/\sfill=/i.test(p)) {
          return p.replace(/\sfill="[^"]*"/i, ` fill="#${fill}"`);
        }
        return p.replace(/<path\b/i, `<path fill="#${fill}"`);
      })
      .join('');
  } catch {
    return null;
  }
}

/**
 * brand-v2 tile with official logo (same structure as Canva/NordVPN/Claude store images).
 */
export function buildOfficialLogoProductImage(
  title: string,
  brand: BrandLogo,
  logoInner: string | null,
): string {
  const svg = buildBrandV2Svg({
    title,
    accent: brandAccentForTile(brand),
    uid: brand.slug + hashStr(title).toString(16).slice(0, 4),
    logoInner,
  });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Resolve product image:
 * 1) brand-v2 official logo tile (matches normal products)
 * 2) API image if present
 * 3) brand-v2 monogram fallback
 */
export async function resolveCustomerProductImage(
  title: string,
  rp?: Record<string, unknown>,
): Promise<string> {
  const brand = detectBrandLogo(title);
  if (brand) {
    const logoInner = await fetchLogoInnerPaths(brand);
    return buildOfficialLogoProductImage(title, brand, logoInner);
  }

  // Prefer API image only if it looks like a real hosted asset (not junk)
  const api = rp ? pickApiImageField(rp) : null;
  if (api && !api.startsWith('data:')) return api;

  return buildAutoProductImageDataUrl(title);
}

/** Parse API stock into count + status */
export function parseRemoteStock(rp: Record<string, unknown>): {
  stock_status: 'in_stock' | 'limited' | 'out_of_stock';
  reseller_stock: number | null;
} {
  const keys = ['stock', 'quantity', 'qty', 'available', 'available_stock', 'stock_count', 'inventory'];
  let raw: unknown = null;
  for (const k of keys) {
    if (rp[k] != null && rp[k] !== '') {
      raw = rp[k];
      break;
    }
  }

  if (raw == null) {
    // manual_delivery products may still be orderable
    if (rp.manual_delivery === true) {
      return { stock_status: 'in_stock', reseller_stock: null };
    }
    return { stock_status: 'in_stock', reseller_stock: null };
  }

  if (typeof raw === 'boolean') {
    return {
      stock_status: raw ? 'in_stock' : 'out_of_stock',
      reseller_stock: raw ? null : 0,
    };
  }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const n = Math.max(0, Math.floor(raw));
    if (n <= 0) return { stock_status: 'out_of_stock', reseller_stock: 0 };
    if (n <= 5) return { stock_status: 'limited', reseller_stock: n };
    return { stock_status: 'in_stock', reseller_stock: n };
  }

  const s = String(raw).trim().toLowerCase();
  if (!s || s === 'null' || s === 'undefined') {
    return { stock_status: 'in_stock', reseller_stock: null };
  }
  if (
    s === '0' ||
    s.includes('out') ||
    s === 'sold' ||
    s === 'unavailable' ||
    s === 'false' ||
    s === 'no'
  ) {
    return { stock_status: 'out_of_stock', reseller_stock: 0 };
  }
  if (s.includes('limit') || s.includes('low') || s.includes('few')) {
    const n = parseInt(s.replace(/\D/g, ''), 10);
    return {
      stock_status: 'limited',
      reseller_stock: Number.isFinite(n) && n > 0 ? n : null,
    };
  }
  if (s.includes('in stock') || s === 'yes' || s === 'true' || s === 'available') {
    return { stock_status: 'in_stock', reseller_stock: null };
  }

  const n = parseInt(s.replace(/,/g, ''), 10);
  if (Number.isFinite(n)) {
    if (n <= 0) return { stock_status: 'out_of_stock', reseller_stock: 0 };
    if (n <= 5) return { stock_status: 'limited', reseller_stock: n };
    return { stock_status: 'in_stock', reseller_stock: n };
  }

  return { stock_status: 'in_stock', reseller_stock: null };
}

export async function buildCustomerFacingProduct(rp: {
  id?: string;
  name?: string;
  [key: string]: unknown;
}): Promise<{
  name: string;
  description: string;
  image_url: string;
  stock_status: 'in_stock' | 'limited' | 'out_of_stock';
  reseller_stock: number | null;
}> {
  const rawName = String(rp.name || 'Digital Product');
  const name = polishProductTitle(rawName);
  const apiDesc = pickApiDescriptionField(rp);
  const description = polishProductDescription({ title: name, apiDescription: apiDesc });
  const image_url = await resolveCustomerProductImage(name, rp);
  const stock = parseRemoteStock(rp);
  return {
    name,
    description,
    image_url,
    stock_status: stock.stock_status,
    reseller_stock: stock.reseller_stock,
  };
}
