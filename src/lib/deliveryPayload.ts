/**
 * Parse reseller API `delivered_data` into a clear customer-facing type
 * (coupon code, redeem link, login, multi-line, etc.) with how-to steps.
 */

export type DeliveryKind =
  | 'url'
  | 'coupon'
  | 'login'
  | 'email_only'
  | 'json'
  | 'multiline'
  | 'code'
  | 'text'
  | 'empty'
  /** Coursera Premium Readymade API pack only */
  | 'coursera_api';

export type ParsedField = {
  label: string;
  value: string;
  copyable?: boolean;
  isSecret?: boolean;
  isUrl?: boolean;
};

/** Structured layout used only by kind === 'coursera_api' */
export type CourseraApiAccount = {
  email: string;
  emailPassword: string;
  courseraEmail: string;
  courseraPassword: string;
};

export type CourseraApiLayout = {
  accounts: CourseraApiAccount[];
  orgLinks: string[];
  deliveredAt?: string | null;
  /** Post-login safety checklist (this product only) */
  setupInstructions: string[];
};

export type ParsedDelivery = {
  kind: DeliveryKind;
  title: string;
  /** Primary value to highlight (code or link) */
  primary?: string;
  fields: ParsedField[];
  /** Numbered how-to steps */
  steps: string[];
  /** Extra tip under the card */
  tip?: string;
  /** No usable payload */
  incomplete?: boolean;
  /** Present only for Coursera Premium Readymade API deliveries */
  courseraApi?: CourseraApiLayout;
};

const URL_RE = /https?:\/\/[^\s<>"']+/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function cleanUrl(u: string): string {
  return u.replace(/[),.\]}'"]+$/g, '').trim();
}

function looksLikeUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim()) || URL_RE.test(s.trim());
}

function extractUrls(s: string): string[] {
  return (s.match(/https?:\/\/[^\s<>"']+/gi) || []).map(cleanUrl).filter(Boolean);
}

function tryParseJson(raw: string): Record<string, unknown> | null {
  const t = raw.trim();
  if (!t.startsWith('{') && !t.startsWith('[')) return null;
  try {
    const v = JSON.parse(t);
    if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
    if (Array.isArray(v) && v[0] && typeof v[0] === 'object') return v[0] as Record<string, unknown>;
  } catch {
    /* ignore */
  }
  return null;
}

function mapKeyLabel(k: string): string {
  const low = k.toLowerCase();
  if (/pass/.test(low)) return 'Password';
  if (/email|user|login/.test(low)) return 'Username / email';
  if (/code|coupon|voucher|pin/.test(low)) return 'Code';
  if (/url|link|redeem/.test(low)) return 'Redeem link';
  return k.replace(/_/g, ' ');
}

/** Flatten one level of nested objects into fields */
function fieldsFromObject(obj: Record<string, unknown>, prefix = ''): ParsedField[] {
  const fields: ParsedField[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    if (typeof v === 'object' && !Array.isArray(v)) {
      fields.push(...fieldsFromObject(v as Record<string, unknown>, prefix ? `${prefix} ${k}` : k));
      continue;
    }
    if (typeof v === 'object') continue;
    const value = String(v).trim();
    if (!value) continue;
    const label = mapKeyLabel(prefix ? `${prefix}_${k}` : k);
    const low = label.toLowerCase();
    fields.push({
      label,
      value,
      copyable: true,
      isSecret: /pass|pin|secret|token|key/i.test(low),
      isUrl: looksLikeUrl(value),
    });
  }
  return fields;
}

function splitLogin(line: string): { user: string; pass: string } | null {
  const t = line.trim();
  // email:pass | user|pass
  const m =
    t.match(/^([^\s:|/]+@[^\s:|/]+)\s*[:|/]\s*(.+)$/) ||
    t.match(/^([^\s:|/]+)\s*[:|/]\s*(.{4,})$/);
  if (m) return { user: m[1].trim(), pass: m[2].trim() };

  // labeled single field is not a full login pair
  return null;
}

function parseKeyValueLines(text: string): ParsedField[] {
  const fields: ParsedField[] = [];
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const m = t.match(/^([A-Za-z][A-Za-z0-9 _-]{0,30})\s*[:=]\s*(.+)$/);
    if (m) {
      const label = m[1].trim();
      const value = m[2].trim();
      const low = label.toLowerCase();
      fields.push({
        label,
        value,
        copyable: true,
        isSecret: /pass|pin|secret|token|key/i.test(low),
        isUrl: looksLikeUrl(value),
      });
    }
  }
  return fields;
}

function emptyResult(product: string): ParsedDelivery {
  return {
    kind: 'empty',
    title: product,
    fields: [],
    incomplete: true,
    steps: [
      'Nothing usable was found in this delivery.',
      'Contact support with your Order ID so we can re-check or reissue.',
    ],
    tip: 'Save your Order ID — support needs it to help you.',
  };
}

/**
 * STRICT: only Coursera Premium Readymade API deliveries.
 * Must look like this product AND its API envelope — never other Coursera
 * products, other API lines, coupons, links, or inventory assignments.
 * Seller brand names are never shown to customers.
 */
function isCourseraApiReadymadeDelivery(data: string): boolean {
  // Product identity (any one of these Coursera-readymade markers)
  const isThisProduct =
    /Coursera\s+Premium\s+Readymade/i.test(data) ||
    /Coursera_Delivery_\S+\.txt/i.test(data) ||
    (/Coursera\s+Delivery/i.test(data) &&
      /Email\s+Password\s*:/i.test(data) &&
      /Coursera\s+Password\s*:/i.test(data));

  if (!isThisProduct) return false;

  // API pack envelope (not a hand-typed note)
  const hasEnvelope =
    /VEX-[A-Z0-9]+/i.test(data) ||
    /[╔╚╗╝║]/.test(data) ||
    /[═━─]{8,}/.test(data) ||
    /ACCOUNT\s+\d+\s+of\s+\d+/i.test(data) ||
    /Total accounts:\s*\d+/i.test(data) ||
    /End of delivery/i.test(data);

  return hasEnvelope;
}

/** Collapse box-art so credentials can be regex-matched even if newlines were lost. */
function normalizeCourseraApiText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[╔╚╗╝]/g, '\n')
    .replace(/║/g, '\n')
    .replace(/[═━─]{4,}/g, '\n')
    .replace(/✅/g, '\n')
    // Drop API seller brand if it appears in the payload text
    .replace(/\bVexoran\b/gi, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/** Password / token tokens (allow @ inside, stop at next label or URL). */
function extractTokenAfterLabel(block: string, labelRe: string): string | null {
  const re = new RegExp(
    `${labelRe}\\s*:\\s*(\\S+?)(?=\\s+(?:Email|Coursera|If\\b|ACCOUNT|Total|Delivered|VEX-|End\\s+of|https?:\\/\\/)|\\s*$|\\n)`,
    'i',
  );
  const m = block.match(re);
  if (!m?.[1]) return null;
  const v = m[1].trim();
  if (!v || /^(Login|Password)?$/i.test(v)) return null;
  return v;
}

function extractCourseraApiEmail(block: string): string | null {
  // "Email: user@host" — not "Email Password:" (\bEmail\s*: won't match that)
  const m = block.match(/(?:^|[\s|║])Email\s*:\s*([^\s@]+@[^\s]+)/i);
  return m?.[1]?.replace(/[),.;]+$/, '').trim() || null;
}

function parseCourseraApiReadymadeDelivery(
  data: string,
  productName: string,
): ParsedDelivery | null {
  if (!isCourseraApiReadymadeDelivery(data)) return null;

  const normalized = normalizeCourseraApiText(data);
  const deliveredAt =
    normalized.match(/Delivered:\s*([0-9]{4}-[0-9]{2}-[0-9]{2}[^\n]*)/i)?.[1]?.trim() ||
    null;
  const totalAccountsRaw = normalized.match(/Total accounts:\s*(\d+)/i)?.[1];
  const totalAccounts = totalAccountsRaw ? Number(totalAccountsRaw) : null;

  let headerTitle =
    productName && productName !== 'Your product'
      ? productName
      : 'Coursera Premium Readymade';
  if (!/coursera/i.test(headerTitle)) {
    const titleLine = normalized
      .split('\n')
      .map((l) => l.trim())
      .find((l) => /coursera.*readymade|premium\s+readymade/i.test(l));
    if (titleLine) headerTitle = titleLine.replace(/\s+/g, ' ').trim();
  }

  const accountParts = normalized.split(/ACCOUNT\s+\d+\s+of\s+\d+/i);
  const accountBodies = accountParts.length > 1 ? accountParts.slice(1) : [normalized];

  const accounts: CourseraApiAccount[] = [];
  const allUrls = extractUrls(normalized);
  const orgLinks = allUrls.filter(
    (u) =>
      !/mail\.tm|temp-mail|guerrillamail|10minutemail/i.test(u) &&
      !/^https?:\/\/(www\.)?coursera\.org\/?$/i.test(u),
  );

  for (const body of accountBodies) {
    const email = extractCourseraApiEmail(body);
    const emailPass =
      extractTokenAfterLabel(body, 'Email\\s+Password') ||
      extractTokenAfterLabel(body, 'Mail\\s+Password');
    let courseraLogin = extractTokenAfterLabel(body, 'Coursera\\s+Login');
    if (
      courseraLogin &&
      !EMAIL_RE.test(courseraLogin) &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(courseraLogin)
    ) {
      courseraLogin = null;
    }
    const courseraPass = extractTokenAfterLabel(body, 'Coursera\\s+Password');
    const courseraEmail = courseraLogin || email || '';
    if (!email && !courseraEmail && !emailPass && !courseraPass) continue;

    accounts.push({
      email: email || courseraEmail,
      emailPassword: emailPass || '',
      courseraEmail: courseraEmail || email || '',
      courseraPassword: courseraPass || emailPass || '',
    });
  }

  // Fallback: if ACCOUNT split failed but whole blob has email
  if (accounts.length === 0) {
    const email = extractCourseraApiEmail(normalized);
    const emailPass = extractTokenAfterLabel(normalized, 'Email\\s+Password');
    const courseraPass = extractTokenAfterLabel(normalized, 'Coursera\\s+Password');
    if (email || emailPass || courseraPass) {
      accounts.push({
        email: email || '',
        emailPassword: emailPass || '',
        courseraEmail: email || '',
        courseraPassword: courseraPass || emailPass || '',
      });
    }
  }

  if (accounts.length === 0) return null;
  if (totalAccounts != null && totalAccounts > 0 && accounts.length === 0) return null;

  const incomplete = accounts.every((a) => !a.email && !a.courseraEmail);

  // Fields kept for copy-all / generic fallbacks (card uses courseraApi layout)
  const fields: ParsedField[] = [];
  accounts.forEach((a, i) => {
    const p = accounts.length > 1 ? `Account ${i + 1} · ` : '';
    if (a.email) fields.push({ label: `${p}Temp-mail email`, value: a.email, copyable: true });
    if (a.emailPassword)
      fields.push({
        label: `${p}Temp-mail password`,
        value: a.emailPassword,
        copyable: true,
        isSecret: true,
      });
    if (a.courseraEmail)
      fields.push({ label: `${p}Coursera email`, value: a.courseraEmail, copyable: true });
    if (a.courseraPassword)
      fields.push({
        label: `${p}Coursera password`,
        value: a.courseraPassword,
        copyable: true,
        isSecret: true,
      });
  });
  orgLinks.forEach((u, i) => {
    fields.push({
      label: orgLinks.length > 1 ? `Org link ${i + 1}` : 'Org access link',
      value: u,
      copyable: true,
      isUrl: true,
    });
  });

  /** Only shown for this Coursera API product */
  const setupInstructions = [
    'Log in to Coursera using the provided login details.',
    'Change your name and password after your first login.',
    'Add a recovery email.',
    'Connect your Google or Facebook account (recommended).',
  ];

  return {
    kind: 'coursera_api',
    title: headerTitle || 'Coursera Premium Readymade',
    primary: accounts[0]?.email,
    fields,
    incomplete,
    courseraApi: {
      accounts,
      orgLinks,
      deliveredAt,
      setupInstructions,
    },
    steps: [
      'Open mail.tm and log in with the temp-mail email + password.',
      'Open coursera.org and log in with the Coursera email + password.',
      orgLinks.length > 0
        ? 'If your organization or courses are missing, open the org access link while still logged into Coursera.'
        : 'If your organization or courses are missing, message support with your Order ID.',
      ...setupInstructions,
    ],
    tip: 'Do not share these passwords. Check mail.tm if Coursera sends a verification code.',
  };
}

/**
 * Turn raw API delivery string into structured UI model.
 */
export function parseDeliveryPayload(
  raw: string | null | undefined,
  productName?: string | null,
): ParsedDelivery {
  const data = String(raw || '').trim();
  const product = productName || 'Your product';

  if (!data) return emptyResult(product);

  // Coursera Premium Readymade API envelope only (not other Coursera products)
  const courseraApi = parseCourseraApiReadymadeDelivery(data, product);
  if (courseraApi) return courseraApi;

  // JSON object from API
  const json = tryParseJson(data);
  if (json) {
    const fields = fieldsFromObject(json);
    if (fields.length === 0) return emptyResult(product);

    const hasUrl = fields.some((f) => f.isUrl);
    const hasLogin = fields.some((f) => /user|email|login/i.test(f.label));
    const hasPass = fields.some((f) => /pass/i.test(f.label));
    const hasCode = fields.some((f) => /code|coupon/i.test(f.label));
    return {
      kind: hasUrl ? 'url' : hasLogin || hasPass ? 'login' : hasCode ? 'coupon' : 'json',
      title: product,
      primary:
        fields.find((f) => f.isUrl)?.value || fields.find((f) => /code/i.test(f.label))?.value,
      fields,
      steps: hasUrl
        ? [
            'Copy or open the redeem / invite link below.',
            'Sign in or complete the page as prompted.',
            'If the link expires, contact support with your Order ID.',
          ]
        : hasLogin || hasPass
          ? [
              'Copy the username/email and password.',
              'Open the service website or app and sign in.',
              'Change the password if the service allows (recommended).',
            ]
          : [
              'Copy the code carefully (no extra spaces).',
              'Open the service redeem / apply-coupon page.',
              'Paste the code and confirm.',
            ],
      tip: 'Save your Order ID — you can reopen Track Order anytime to see this delivery again.',
    };
  }

  const urls = extractUrls(data);
  const onlyUrl = urls.length === 1 && data.replace(urls[0], '').trim().length < 8;

  // Pure URL / redeem link
  if (onlyUrl || (urls.length === 1 && data.length < 200 && looksLikeUrl(data))) {
    const url = cleanUrl(urls[0] || data.trim());
    return {
      kind: 'url',
      title: product,
      primary: url,
      fields: [{ label: 'Redeem / invite link', value: url, copyable: true, isUrl: true }],
      steps: [
        'Tap Open link (or copy and paste into your browser).',
        'Follow the on-screen steps to redeem or join.',
        'If you need to log in, use your own account when the page asks.',
        'Link used up or expired? Message support with your Order ID.',
      ],
      tip: 'Save your Order ID so you can return to Track Order if you lose this page.',
    };
  }

  // URL + surrounding text
  if (urls.length >= 1) {
    const fields: ParsedField[] = urls.map((u, i) => ({
      label: urls.length > 1 ? `Link ${i + 1}` : 'Redeem / invite link',
      value: u,
      copyable: true,
      isUrl: true,
    }));
    const rest = data
      .replace(/https?:\/\/[^\s<>"']+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (rest.length > 3) {
      fields.push({ label: 'Notes', value: rest, copyable: true });
    }
    return {
      kind: 'url',
      title: product,
      primary: urls[0],
      fields,
      steps: [
        'Open the link below first.',
        'Use any extra notes as instructions if shown.',
        'Keep your Order ID saved for support or re-checking Track Order.',
      ],
      tip: 'Bookmark Track Order or save your Order ID.',
    };
  }

  // email:password on one line
  const login = splitLogin(data.split(/\n/)[0]);
  if (login && data.split(/\n/).filter(Boolean).length <= 2) {
    return {
      kind: 'login',
      title: product,
      fields: [
        { label: 'Username / email', value: login.user, copyable: true },
        { label: 'Password', value: login.pass, copyable: true, isSecret: true },
      ],
      steps: [
        'Copy the username/email.',
        'Copy the password.',
        'Open the official app or website and sign in.',
        'Change the password after first login if possible.',
      ],
      tip: 'Never share these details. Save your Order ID to recover this page later.',
    };
  }

  // Single email only
  if (EMAIL_RE.test(data) && !data.includes('\n')) {
    return {
      kind: 'email_only',
      title: product,
      fields: [{ label: 'Email / account', value: data, copyable: true }],
      steps: [
        'Copy this email/account identifier.',
        'Use it as instructed for this product.',
        'Contact support with your Order ID if something is missing (e.g. password).',
      ],
      tip: 'Save your Order ID to reopen Track Order later.',
    };
  }

  // Multi-line key: value
  const kv = parseKeyValueLines(data);
  if (kv.length >= 2) {
    const hasLogin = kv.some((f) => /email|user|login/i.test(f.label));
    const hasPass = kv.some((f) => /pass/i.test(f.label));
    const hasCode = kv.some((f) => /code|coupon|voucher|pin/i.test(f.label));
    return {
      kind: hasLogin || hasPass ? 'login' : hasCode ? 'coupon' : 'multiline',
      title: product,
      fields: kv,
      steps:
        hasLogin || hasPass
          ? [
              'Copy each field below.',
              'Sign in on the official service site or app.',
              'Update your password when you can.',
            ]
          : [
              'Copy the code or details exactly.',
              'Redeem them in the official service.',
              'Contact support with your Order ID if redemption fails.',
            ],
      tip: 'Save your Order ID — Track Order is where this delivery lives.',
    };
  }

  // Short code / coupon (no spaces or few)
  const compact = data.replace(/\s+/g, '');
  if (data.length <= 64 && !/\s{2,}/.test(data) && !looksLikeUrl(data)) {
    const isCoupon =
      data.length <= 40 ||
      /coupon|code|voucher|redeem/i.test(product) ||
      /^[A-Z0-9][A-Z0-9\-_]+$/i.test(compact);
    return {
      kind: isCoupon ? 'coupon' : 'code',
      title: product,
      primary: data,
      fields: [
        {
          label: isCoupon ? 'Coupon / redeem code' : 'Your code',
          value: data,
          copyable: true,
        },
      ],
      steps: [
        'Tap Copy code.',
        'Open the official redeem or “apply coupon” page for this service.',
        'Paste the code and confirm.',
        'If it says already used or invalid, message support with your Order ID.',
      ],
      tip: 'Screenshot this page or save your Order ID so you can find the code again on Track Order.',
    };
  }

  // Multi-line free text
  if (data.includes('\n')) {
    return {
      kind: 'multiline',
      title: product,
      primary: data,
      fields: [{ label: 'Delivery details', value: data, copyable: true }],
      steps: [
        'Read all lines carefully.',
        'Copy any codes or passwords shown.',
        'Follow any steps written in the delivery text.',
      ],
      tip: 'Save your Order ID to reopen Track Order later.',
    };
  }

  // Fallback plain text
  return {
    kind: 'text',
    title: product,
    primary: data,
    fields: [{ label: 'Delivery', value: data, copyable: true }],
    steps: [
      'Copy the delivery details below.',
      'Use them as instructed for this product.',
      'Need help? Contact support with your Order ID.',
    ],
    tip: 'Always save your Order ID — it’s the only way to load this delivery again.',
  };
}

export function deliveryKindBadge(kind: DeliveryKind): string {
  switch (kind) {
    case 'url':
      return 'Redeem link';
    case 'coupon':
      return 'Coupon code';
    case 'login':
      return 'Login details';
    case 'coursera_api':
      return 'Coursera account';
    case 'email_only':
      return 'Account email';
    case 'code':
      return 'Access code';
    case 'empty':
      return 'Incomplete';
    case 'json':
    case 'multiline':
      return 'Delivery details';
    default:
      return 'Delivery';
  }
}
