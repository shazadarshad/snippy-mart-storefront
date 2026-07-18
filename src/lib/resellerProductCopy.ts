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

  // Expand duration shorthand (12m → 12 Month)
  s = s
    .replace(/\b(\d+)\s*m\b/gi, '$1 Month')
    .replace(/\b(\d+)\s*mo(nth)?s?\b/gi, '$1 Month')
    .replace(/\b(\d+)\s*yr?s?\b/gi, '$1 Year')
    .replace(/\b(\d+)\s*d(ays?)?\b/gi, '$1 Day')
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
  const parts = s.split(/\s+/);
  s = parts
    .map((w, i) => {
      if (/^[A-Z0-9+.-]{2,}$/.test(w) && /[A-Z]/.test(w) && /[0-9+]/.test(w)) return w; // GPT-4, Disney+
      if (/^(ChatGPT|YouTube|Office|Midjourney|CapCut|GPT-4|Disney\+)$/i.test(w)) {
        return w.replace(/^chatgpt$/i, 'ChatGPT').replace(/^youtube$/i, 'YouTube');
      }
      const lower = w.toLowerCase();
      if (i > 0 && small.has(lower)) return lower;
      // Keep brand tokens already fixed
      if (/^[A-Z][a-z]+[A-Z]/.test(w) || w.includes('+')) return w;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Ensure useful suffix if too bare
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

/**
 * Prefer a generated branded card (with Auto Product subtitle).
 * If API image exists and looks usable, we still generate our card so
 * storefront stays consistent — set preferApiImage true to keep seller art.
 */
export function resolveCustomerProductImage(
  title: string,
  rp?: Record<string, unknown>,
  preferApiImage = false,
): string {
  if (preferApiImage && rp) {
    const api = pickApiImageField(rp);
    if (api) return api;
  }
  return buildAutoProductImageDataUrl(title);
}

export function buildCustomerFacingProduct(rp: {
  id?: string;
  name?: string;
  [key: string]: unknown;
}): { name: string; description: string; image_url: string } {
  const rawName = String(rp.name || 'Digital Product');
  const name = polishProductTitle(rawName);
  const apiDesc = pickApiDescriptionField(rp);
  const description = polishProductDescription({ title: name, apiDescription: apiDesc });
  // Always generate branded image with Auto Product subtitle for consistency
  const image_url = resolveCustomerProductImage(name, rp, false);
  return { name, description, image_url };
}
