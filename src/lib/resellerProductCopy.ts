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
  const keepExact: Record<string, string> = {
    ai: 'AI',
    chatgpt: 'ChatGPT',
    youtube: 'YouTube',
    gpt: 'GPT',
    'gpt-4': 'GPT-4',
    'disney+': 'Disney+',
    midjourney: 'Midjourney',
    capcut: 'CapCut',
    api: 'API',
    vpn: 'VPN',
    pro: 'Pro',
    plus: 'Plus',
  };
  const parts = s.split(/\s+/);
  s = parts
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (keepExact[lower]) return keepExact[lower];
      if (/^(Months?|Years?|Days?|Weeks?|Hours?)$/i.test(w)) {
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }
      if (/^[A-Z0-9+.-]{2,}$/.test(w) && /[A-Z]/.test(w) && /[0-9+]/.test(w)) return w;
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

/** Title-only emoji — never invent product-specific bullets from category. */
function titleEmoji(title: string): string {
  const t = title.toLowerCase();
  if (/netflix|disney|hulu|prime|streaming|youtube\s*prem/i.test(t)) return '🎬';
  if (/spotify|music|deezer|tidal/i.test(t)) return '🎵';
  if (/chatgpt|gpt|claude|gemini|ai|midjourney|cursor|copilot/i.test(t)) return '🤖';
  if (/canva|adobe|figma|design|capcut/i.test(t)) return '🎨';
  if (/office|microsoft|notion|grammarly|productivity/i.test(t)) return '💼';
  if (/vpn|nord|express|surfshark/i.test(t)) return '🛡️';
  if (/game|steam|xbox|playstation|psn/i.test(t)) return '🎮';
  return '⚡';
}

/**
 * Normalize each product's raw API description independently.
 * Keeps full wording; only fixes line breaks / HTML / Telegram junk / run-on labels.
 */
function normalizeApiDescription(raw: string): string {
  let s = String(raw || '');
  s = s
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  s = stripEntityJunk(s);

  // Split run-on blobs on bullets / notes / steps (works with or without existing newlines).
  // Use unicode-aware patterns so emoji + FE0F stay on the same line.
  s = s
    .replace(/\s*([✅✓✔•●▪▸])\s+/gu, '\n$1 ')
    // New line before section emoji only when glued to previous text (not mid-label)
    .replace(/(\S)(\s*)(❕|⚠️|❗|➡️|➤|👉)/gu, '$1\n$3')
    // Labeled fields (Duration:, Warranty:, …). Never split "Important Note:".
    .replace(
      /(\S)\s+(?=(?:Duration|Warranty|Type|Plan|Delivery|Region|Valid|Includes?|Stock|Quantity|Account|Login|Email|Password|Method|Access)\s*:)/gi,
      '$1\n',
    )
    // Standalone "Note:" only — lookbehind must sit BEFORE the spaces (not after)
    .replace(/(?<![Ii]mportant)(?<=\S)[ \t]+(?=Note\s*:)/g, '\n')
    .replace(/(\S)\s+(?=Official\s+Coupon\s+Code\b)/g, '$1\n')
    .replace(/(\S)\s+(?=No\s+Warranty\s+After\b)/g, '$1\n')
    .replace(/(\S)\s+(?=On\s+Your\s+(?:Own\s+)?Account\b)/g, '$1\n')
    .replace(/(\S)\s+(?=Instant\s+Deliver)/g, '$1\n')
    .replace(/(\S)\s+(?=Auto\s+Deliver)/g, '$1\n');

  s = stripEntityJunk(s);

  return s
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[|]{2,}/g, ' ')
    .trim();
}

/**
 * Light grammar / casing only — never invent or drop meaning.
 * Returns null for pure blank/junk so callers can preserve spacing.
 */
function polishDescriptionBody(raw: string): string {
  let t = stripEntityJunk(raw)
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    // leftover emoji VS16 after we strip a multi-codepoint emoji prefix
    .replace(/^[\uFE0F\u200D]+\s*/g, '')
    .trim();
  if (!t) return '';
  if (/^ce:\d+/i.test(t)) return '';
  // Only drop pure Telegram entity residue — never short feature chips
  if (hasSellerJunk(t) && !/[a-zA-Z]{3,}/.test(t)) return '';
  if (!/[a-zA-Z]/.test(t)) return '';

  // Phrase fixes (same meaning, better English)
  t = t
    .replace(/\bNon[- ]?Warranty\b/gi, 'No warranty')
    .replace(/\bNO\s+NEED\s+ANY\s+CARD\b/gi, 'No card required')
    .replace(/\bNo\s+Need\s+Any\s+Card\b/gi, 'No card required')
    .replace(/\bNo\s+Shared\b/gi, 'Not shared')
    .replace(/\b100%\s*Private\b/gi, '100% private')
    .replace(/\b100%\s*genuine\b/gi, '100% genuine')
    .replace(/\bIT['’]S\s+NOT\s+AN\s+INVITE\b/gi, "It's not an invite")
    .replace(/\bFULL\s+FAMILY\s+ACCOUNT\b/gi, 'Full family account')
    .replace(
      /\bWorks\s+in\s+any\s+country\s+no\s+verification\b/gi,
      'Works in any country — no verification',
    )
    .replace(/\bActivate\s+Offer\b/gi, 'Activate Offer')
    .replace(/(\d+)\s*(?:months?|mos?)(?![a-z])/gi, (_: string, n: string) =>
      `${n} ${Number(n) === 1 ? 'Month' : 'Months'}`,
    )
    .replace(/(\d+)\s*(?:years?|yrs?)(?![a-z])/gi, (_: string, n: string) =>
      `${n} ${Number(n) === 1 ? 'Year' : 'Years'}`,
    );

  // ALL CAPS slogans → sentence case (keep readability)
  const lettersOnly = t.replace(/[^a-zA-Z]/g, '');
  const isAllCaps =
    lettersOnly.length > 4 &&
    t === t.toUpperCase() &&
    /[A-Z]/.test(t) &&
    t.length < 160;

  if (isAllCaps) {
    t = t
      .toLowerCase()
      .replace(/(^|[.!?]\s+)([a-z])/g, (_m, p1, p2) => p1 + p2.toUpperCase())
      .replace(/^([a-z])/, (c) => c.toUpperCase())
      .replace(/\bai\b/g, 'AI')
      .replace(/\bgmail\b/g, 'Gmail')
      .replace(/\bid\b/g, 'ID');
  } else if (/^[a-z]/.test(t)) {
    t = t.charAt(0).toUpperCase() + t.slice(1);
  }

  // End full sentences with a period (not short feature chips)
  if (t.length > 45 && /[a-z)]$/i.test(t) && !/[.!?…:]$/.test(t)) {
    t += '.';
  }

  return t;
}

type LineKind = 'feature' | 'important' | 'step' | 'header' | 'plain';

function detectLineKind(raw: string): { kind: LineKind; body: string } {
  // Strip leftover VS16 only after we classify emoji prefixes
  const original = stripEntityJunk(raw)
    .replace(/[ \t]+/g, ' ')
    .replace(/^[\uFE0F\u200D]+/g, '')
    .trim();
  if (!original) return { kind: 'plain', body: '' };

  // Important note header (emoji and/or label) — body may be empty on this line
  // Require /u so multi-codepoint emoji (⚠️) does not false-match other lines
  const importantHeader = original.match(
    /^(?:❕|⚠️|❗|\*)\s*(?:important(?:\s+note)?\s*:?\s*)?(.*)$/iu,
  );
  const importantLabel = original.match(/^important(?:\s+note)?\s*:?\s*(.*)$/i);
  if (importantHeader && /^(?:❕|⚠️|❗|\*)/u.test(original)) {
    // Only treat as "important" section if label says so OR emoji is ❕/❗ (not every ⚠️ line)
    const rest = (importantHeader[1] || '').trim();
    const hasLabel = /^important(?:\s+note)?\b/i.test(
      original.replace(/^(?:❕|⚠️|❗|\*)\s*/u, ''),
    );
    if (hasLabel || /^(?:❕|❗)/u.test(original)) {
      const body = hasLabel
        ? original
            .replace(/^(?:❕|⚠️|❗|\*)\s*/u, '')
            .replace(/^important(?:\s+note)?\s*:?\s*/i, '')
            .trim()
        : rest;
      return { kind: 'important', body };
    }
  }
  if (importantLabel) {
    return { kind: 'important', body: (importantLabel[1] || '').trim() };
  }

  // How-to step (➡️ is often U+27A1 + FE0F)
  if (/^(?:➡️|➡|→|➤|👉)/u.test(original)) {
    return {
      kind: 'step',
      body: original.replace(/^(?:➡️|➡|→|➤|👉)\s*/u, '').trim(),
    };
  }

  // Feature bullet
  if (/^[✅✓✔•\-*☑️✔️]/u.test(original)) {
    return {
      kind: 'feature',
      body: original.replace(/^[✅✓✔•\-*☑️✔️]\s*/u, ''),
    };
  }

  // Section headers
  if (
    /^(what you get|features|includes|details|product details|how to|how it works)\s*:?\s*$/i.test(
      original.replace(/^[✨📦💡]\s*/u, ''),
    )
  ) {
    return {
      kind: 'header',
      body: original.replace(/^[✨📦💡]\s*/u, '').replace(/:$/, ''),
    };
  }

  return { kind: 'plain', body: original };
}

function formatPolishedLine(kind: LineKind, body: string): string {
  const t = polishDescriptionBody(body);
  if (!t && kind !== 'important' && kind !== 'header') return '';

  if (kind === 'important') {
    // Header alone — caller may attach following lines as the note body
    if (!t) return '❕ **Important note**';
    return `❕ **Important note:** ${t}`;
  }
  if (kind === 'step') {
    if (!t) return '';
    return `➡️ ${t}`;
  }
  if (kind === 'header') {
    return `✨ ${t || body.replace(/:$/, '')}`;
  }
  // Long prose from THIS product — keep as paragraph (full wording)
  if (kind === 'plain') {
    return t || '';
  }
  if (kind === 'feature') {
    if (!t) return '';
    // Bold strong ownership / privacy claims (still full original meaning)
    if (
      /full family|not an invite|100%\s*private|no warranty|no card required|on your own/i.test(
        t,
      )
    ) {
      return `✅ **${t}**`;
    }
    return `✅ ${t}`;
  }
  return t ? `✅ ${t}` : '';
}

/**
 * Keep EVERY useful line from THIS product's API description.
 * Only: strip ce: junk, fix grammar/casing, consistent emojis + formatting.
 * Never invent category boilerplate or drop another product's features.
 */
export function polishProductDescription(opts: {
  title: string;
  apiDescription?: string | null;
}): string {
  const title = polishProductTitle(opts.title);
  const emoji = titleEmoji(title);
  const text = normalizeApiDescription(String(opts.apiDescription || ''));

  const rawLines = text ? text.split('\n') : [];
  const contentLines: string[] = [];
  /** When API puts "Important Note:" on its own line, fold following paragraphs into it */
  let expectImportantBody = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = stripEntityJunk(line).replace(/[ \t]+/g, ' ').trim();

    // Preserve a single blank line between sections
    if (!trimmed) {
      expectImportantBody = false;
      if (contentLines.length > 0 && contentLines[contentLines.length - 1] !== '') {
        contentLines.push('');
      }
      continue;
    }

    // Skip our own title/footer if raw text was already polished (idempotent re-run)
    if (
      /delivery on snippy mart/i.test(trimmed) ||
      /^✨\s*product details\s*$/i.test(trimmed) ||
      /^track order with your order id/i.test(trimmed) ||
      /^please save your order id/i.test(trimmed) ||
      (trimmed === `${emoji} ${title}` || trimmed === title)
    ) {
      continue;
    }

    const { kind, body } = detectLineKind(trimmed);

    // "❕ Important Note:" alone → keep header, next non-empty lines are the note
    if (kind === 'important' && !polishDescriptionBody(body)) {
      contentLines.push('❕ **Important note**');
      expectImportantBody = true;
      continue;
    }

    if (expectImportantBody && kind === 'plain') {
      const t = polishDescriptionBody(body);
      // Skip orphan "Note:" label if a bad split separated it from "Important"
      if (t && !/^notes?:?$/i.test(t)) contentLines.push(t);
      continue;
    }

    if (expectImportantBody && kind !== 'plain') {
      expectImportantBody = false;
    }

    // How-to steps without arrow (common across products)
    let finalKind = kind;
    if (
      kind === 'plain' &&
      /^(paste the|open the|click on|go to|visit the|login to|sign in)\b/i.test(body) &&
      /redeem|activate|browser|link|account|password|email/i.test(body)
    ) {
      finalKind = 'step';
    }

    // Short chips / labeled fields → feature bullets; long multi-sentence prose stays a paragraph
    if (finalKind === 'plain') {
      const t = polishDescriptionBody(body);
      const isLabeled = /^[A-Za-z][A-Za-z0-9 /&-]{1,28}:\s+\S/.test(t);
      const sentenceBreaks = (t.match(/\.\s+/g) || []).length;
      const isShortChip = t.length > 0 && t.length <= 110 && sentenceBreaks <= 1;
      const isStrongClaim =
        /full family|not an invite|100%\s*(private|genuine)|no warranty|no card|on your own/i.test(
          t,
        );
      finalKind = isLabeled || isShortChip || isStrongClaim ? 'feature' : 'plain';
    }

    const formatted = formatPolishedLine(finalKind, body);
    if (formatted) contentLines.push(formatted);
  }

  while (contentLines.length && contentLines[contentLines.length - 1] === '') {
    contentLines.pop();
  }

  const out: string[] = [`${emoji} ${title}`, ''];

  if (contentLines.length > 0) {
    if (!/^✨\s/u.test(contentLines[0] || '')) {
      out.push('✨ Product details');
      out.push('');
    }
    out.push(...contentLines);
  } else if (String(opts.apiDescription || '').trim()) {
    // Had API text but only junk after strip — keep a minimal honest line, not fake features
    out.push('✅ Digital product delivered after payment confirmation.');
  } else {
    out.push(`✅ **${title}** — auto delivery after payment confirmation.`);
  }

  // Same store delivery footer for every Auto product (does not replace API content)
  out.push(
    '',
    '🚀 Delivery on Snippy Mart',
    '✅ After we confirm payment, open **Track Order** with your Order ID to get your code, link, or login.',
    '✅ Please save your Order ID from the success page.',
  );

  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

/**
 * Pull THIS product's description from whatever field the reseller API uses.
 * Prefers longer non-empty strings so each product keeps its own full copy.
 */
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
    'product_desc',
    'full_description',
    'content',
    'note',
    'notes',
    'specs',
    'specification',
    'features',
    'product_info',
    'product_details',
    'body',
    'text',
    'message',
  ];
  let best: string | null = null;
  for (const k of keys) {
    const v = rp[k];
    if (typeof v === 'string' && v.trim()) {
      const t = v.trim();
      if (!best || t.length > best.length) best = t;
    }
  }
  // Nested objects some panels use: { description: { en: "..." } }
  for (const k of keys) {
    const v = rp[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      for (const sub of ['en', 'text', 'value', 'html', 'content', 'default']) {
        const s = o[sub];
        if (typeof s === 'string' && s.trim()) {
          const t = s.trim();
          if (!best || t.length > best.length) best = t;
        }
      }
    }
  }
  return best;
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
  /** True when this product had its own API description field(s) */
  hasApiDescription: boolean;
  rawApiDescription: string | null;
}> {
  const rawName = String(rp.name || 'Digital Product');
  const name = polishProductTitle(rawName);
  // Always polish THIS product's own description — never reuse another product's text
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
    hasApiDescription: Boolean(apiDesc && apiDesc.trim()),
    rawApiDescription: apiDesc,
  };
}
