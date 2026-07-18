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
  // 12m / 12mo / 12mos → 12 Months | 1m → 1 Month
  const unit = (n: string, one: string, many: string) =>
    `${n} ${Number(n) === 1 ? one : many}`;

  s = s
    .replace(/\b(\d+)\s*mos?\b/gi, (_, n) => unit(n, 'Month', 'Months'))
    .replace(/\b(\d+)\s*m\b/gi, (_, n) => unit(n, 'Month', 'Months'))
    .replace(/\b(\d+)\s*months?\b/gi, (_, n) => unit(n, 'Month', 'Months'))
    .replace(/\b(\d+)\s*yrs?\b/gi, (_, n) => unit(n, 'Year', 'Years'))
    .replace(/\b(\d+)\s*y\b/gi, (_, n) => unit(n, 'Year', 'Years'))
    .replace(/\b(\d+)\s*years?\b/gi, (_, n) => unit(n, 'Year', 'Years'))
    .replace(/\b(\d+)\s*days?\b/gi, (_, n) => unit(n, 'Day', 'Days'))
    .replace(/\b(\d+)\s*d\b/gi, (_, n) => unit(n, 'Day', 'Days'))
    .replace(/\b(\d+)\s*wks?\b/gi, (_, n) => unit(n, 'Week', 'Weeks'))
    .replace(/\b(\d+)\s*weeks?\b/gi, (_, n) => unit(n, 'Week', 'Weeks'))
    .replace(/\b(\d+)\s*hrs?\b/gi, (_, n) => unit(n, 'Hour', 'Hours'))
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
function stripEntityJunk(s: string): string {
  return s
    // Full {ce:id} or {ce:id:emoji} or {any:digits...}
    .replace(/\{ce:\d+(?::[^}]*)?\}/gi, ' ')
    .replace(/\{[a-z]{1,8}:\d+(?::[^}]*)?\}/gi, ' ')
    // Broken leftovers after partial strip: ce:5413...} or {ce:123
    .replace(/\bce:\d+\}?/gi, ' ')
    .replace(/\{ce:\d*/gi, ' ')
    .replace(/\{\d{6,}\}/g, ' ')
    // Random long digit blobs in braces
    .replace(/\{[^}]{0,40}\d{8,}[^}]{0,40}\}/g, ' ')
    // Zero-width / special spaces
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ');
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

/** Pull useful facts from messy seller text */
function extractFacts(text: string): string[] {
  const facts: string[] = [];
  const cleaned = cleanApiText(text);
  const src = stripEntityJunk(cleaned || text);

  // Duration: only the number + unit (never the rest of the blob)
  const dur = src.match(
    /duration\s*:\s*(\d+)\s*(months?|years?|days?|mo|m|yrs?|y|d)?\b/i,
  );
  if (dur) {
    const n = dur[1];
    const unitRaw = (dur[2] || 'month').toLowerCase();
    let unit = 'Month';
    if (/^y/.test(unitRaw)) unit = Number(n) === 1 ? 'Year' : 'Years';
    else if (/^d/.test(unitRaw)) unit = Number(n) === 1 ? 'Day' : 'Days';
    else unit = Number(n) === 1 ? 'Month' : 'Months';
    facts.push(`Duration: **${n} ${unit}**.`);
  } else {
    const dur2 = src.match(/\b(\d+)\s*(months?|years?|days?)\b/i);
    if (dur2) {
      facts.push(`Duration: **${dur2[1]} ${sentenceCase(dur2[2])}**.`);
    }
  }

  if (/(?:official\s+)?coupon\s*code/i.test(src)) {
    facts.push('Includes an **official coupon / activation code**.');
  }
  if (/no\s+warranty\s+after\s+activation/i.test(src)) {
    facts.push('**No warranty after activation** — follow the product rules carefully.');
  } else if (/warranty\s*:\s*([^\n{]+)/i.test(src)) {
    const w = src.match(/warranty\s*:\s*([^\n{]+)/i);
    if (w?.[1]) {
      const v = stripEntityJunk(w[1]).split(/\n/)[0].trim().slice(0, 80);
      if (v && !looksDirty(v)) facts.push(`Warranty: **${sentenceCase(v)}**.`);
    }
  }
  if (/on\s+your\s+(own\s+)?account/i.test(src)) {
    facts.push('Activated **on your own account** (you keep ownership).');
  }
  if (/\bprivate\b/i.test(src) && /account/i.test(src)) {
    facts.push('**Private account** style access where applicable.');
  }
  if (/instant|auto\s*deliver/i.test(src)) {
    facts.push('**Instant auto delivery** after payment confirmation.');
  }

  // Short clean lines only (never paste dirty blobs)
  for (const line of src.split('\n')) {
    const t = stripEntityJunk(line).replace(/\s+/g, ' ').trim();
    if (looksDirty(t) || t.length < 14 || t.length > 120) continue;
    if (/^(duration|warranty|plan|type|region)\s*:/i.test(t)) continue;
    if (/coupon|no warranty|on your account/i.test(t)) continue;
    const m = t.match(/^(?:[-*•✅✓✔▪▸●◦·]|\d+[.)])\s*(.+)$/);
    if (m?.[1] && !looksDirty(m[1])) {
      let b = sentenceCase(stripEntityJunk(m[1]));
      if (!/[.!?]$/.test(b)) b += '.';
      if (!facts.some((f) => f.toLowerCase().includes(b.toLowerCase().slice(0, 18)))) {
        facts.push(b);
      }
    }
  }

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
 * Never dumps raw seller/Telegram text — only extracted clean facts + our copy.
 */
export function polishProductDescription(opts: {
  title: string;
  apiDescription?: string | null;
}): string {
  const title = opts.title;
  const hints = guessCategoryHints(title);
  const apiRaw = opts.apiDescription || '';
  const facts = apiRaw ? extractFacts(apiRaw) : [];

  // Always write our own intro (API intros are often full of junk)
  const intro = `Get **${title}** — a premium ${hints.kind} from Snippy Mart with fast auto delivery after payment confirmation.`;

  // Prefer extracted facts; fall back to category benefits
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
      // Strip leading bullet markers only — never eat markdown **bold**
      const body = b
        .replace(/^(?:✅|✓|✔|•|-|\*(?!\*))\s+/, '')
        .replace(/^✅\s*/, '')
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

  // Final safety: never leave ce: junk in output
  return stripEntityJunk(lines.join('\n'))
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Generate a store-style product card image (SVG data URL)
 * with main title + "Auto Product" subtitle — matches card aspect ratio feel.
 */
export function buildAutoProductImageDataUrl(title: string): string {
  const polished = polishProductTitle(title);
  const [c1, c2, c3] = GRADIENTS[hashStr(polished) % GRADIENTS.length];
  const lines = wrapTitleLines(polished, 16, 3);
  const initial = (polished.replace(/[^A-Za-z0-9]/g, '').charAt(0) || 'A').toUpperCase();

  const titleSvg = lines
    .map((line, i) => {
      const y = 210 + i * 36;
      return `<text x="40" y="${y}" fill="white" font-family="system-ui,Segoe UI,sans-serif" font-size="28" font-weight="800">${escapeXml(line)}</text>`;
    })
    .join('');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="640" viewBox="0 0 800 640">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="55%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="24" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="800" height="640" fill="url(#bg)"/>
  <circle cx="640" cy="120" r="160" fill="#ffffff" fill-opacity="0.08"/>
  <circle cx="120" cy="520" r="200" fill="#000000" fill-opacity="0.12"/>
  <rect width="800" height="640" fill="url(#shine)"/>

  <!-- Badge -->
  <rect x="40" y="40" rx="20" ry="20" width="148" height="40" fill="#000000" fill-opacity="0.28"/>
  <text x="60" y="66" fill="#ffffff" font-family="system-ui,Segoe UI,sans-serif" font-size="15" font-weight="700" letter-spacing="0.5">⚡ AUTO</text>

  <!-- Icon circle -->
  <circle cx="400" cy="130" r="52" fill="#ffffff" fill-opacity="0.16"/>
  <circle cx="400" cy="130" r="44" fill="#ffffff" fill-opacity="0.92"/>
  <text x="400" y="146" text-anchor="middle" fill="${c1}" font-family="system-ui,Segoe UI,sans-serif" font-size="40" font-weight="800">${escapeXml(initial)}</text>

  ${titleSvg}

  <!-- Subtitle -->
  <text x="40" y="${210 + lines.length * 36 + 28}" fill="#ffffff" fill-opacity="0.92" font-family="system-ui,Segoe UI,sans-serif" font-size="18" font-weight="600" letter-spacing="1.5">AUTO PRODUCT</text>
  <text x="40" y="${210 + lines.length * 36 + 56}" fill="#ffffff" fill-opacity="0.7" font-family="system-ui,Segoe UI,sans-serif" font-size="15" font-weight="500">Instant delivery · Snippy Mart</text>

  <!-- Bottom bar -->
  <rect x="0" y="580" width="800" height="60" fill="#000000" fill-opacity="0.22"/>
  <text x="40" y="616" fill="#ffffff" fill-opacity="0.85" font-family="system-ui,Segoe UI,sans-serif" font-size="14" font-weight="600">snippymart.com</text>
</svg>`;

  // Use encodeURIComponent for reliable data URL (UTF-8 safe)
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

/** Official logo URL (SVG) from Simple Icons CDN */
export function officialLogoUrl(brand: BrandLogo): string {
  return `https://cdn.simpleicons.org/${brand.slug}/${brand.color}`;
}

async function fetchLogoAsDataUri(brand: BrandLogo): Promise<string | null> {
  try {
    const url = officialLogoUrl(brand);
    const res = await fetch(url);
    if (!res.ok) return null;
    const svgText = await res.text();
    // Inline as base64 so it works inside data: SVG used as <img src>
    const b64 =
      typeof btoa === 'function'
        ? btoa(unescape(encodeURIComponent(svgText)))
        : Buffer.from(svgText, 'utf-8').toString('base64');
    return `data:image/svg+xml;base64,${b64}`;
  } catch {
    return null;
  }
}

/**
 * Product tile like store cards: soft bg, official logo center, title, Auto Product subtitle.
 */
export function buildOfficialLogoProductImage(
  title: string,
  brand: BrandLogo,
  logoDataUri: string | null,
): string {
  const polished = polishProductTitle(title);
  const lines = wrapTitleLines(polished, 22, 2);
  const titleSvg = lines
    .map((line, i) => {
      const y = 420 + i * 32;
      return `<text x="400" y="${y}" text-anchor="middle" fill="#0f172a" font-family="system-ui,Segoe UI,sans-serif" font-size="26" font-weight="800">${escapeXml(line)}</text>`;
    })
    .join('');

  const logoBlock = logoDataUri
    ? `<image href="${logoDataUri}" xlink:href="${logoDataUri}" x="330" y="190" width="140" height="140" preserveAspectRatio="xMidYMid meet"/>`
    : `<text x="400" y="270" text-anchor="middle" fill="#${brand.color}" font-family="system-ui,Segoe UI,sans-serif" font-size="48" font-weight="800">${escapeXml(brand.label.slice(0, 1))}</text>`;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="800" height="640" viewBox="0 0 800 640">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#0f172a" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect width="800" height="640" fill="url(#bg)"/>
  <circle cx="700" cy="80" r="140" fill="#${brand.color}" fill-opacity="0.08"/>
  <circle cx="80" cy="560" r="120" fill="#${brand.color}" fill-opacity="0.06"/>

  <rect x="40" y="36" rx="18" ry="18" width="132" height="36" fill="#059669"/>
  <text x="106" y="60" text-anchor="middle" fill="#ffffff" font-family="system-ui,Segoe UI,sans-serif" font-size="14" font-weight="800" letter-spacing="0.5">AUTO</text>

  <rect x="260" y="120" width="280" height="280" rx="40" fill="#ffffff" filter="url(#shadow)"/>
  <rect x="260" y="120" width="280" height="280" rx="40" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  ${logoBlock}

  ${titleSvg}
  <text x="400" y="${420 + lines.length * 32 + 28}" text-anchor="middle" fill="#059669" font-family="system-ui,Segoe UI,sans-serif" font-size="16" font-weight="700" letter-spacing="2">AUTO PRODUCT</text>
  <text x="400" y="${420 + lines.length * 32 + 52}" text-anchor="middle" fill="#64748b" font-family="system-ui,Segoe UI,sans-serif" font-size="14" font-weight="500">Instant delivery · Snippy Mart</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Resolve product image (async so we can inline official logos):
 * 1) Official brand logo card
 * 2) API image if present
 * 3) Generated gradient fallback
 */
export async function resolveCustomerProductImage(
  title: string,
  rp?: Record<string, unknown>,
): Promise<string> {
  const brand = detectBrandLogo(title);
  if (brand) {
    const logoData = await fetchLogoAsDataUri(brand);
    return buildOfficialLogoProductImage(title, brand, logoData);
  }

  const api = rp ? pickApiImageField(rp) : null;
  if (api) return api;

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
