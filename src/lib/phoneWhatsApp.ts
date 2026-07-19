/**
 * WhatsApp-safe phone normalization (Sri Lanka–first, multi-country tolerant).
 *
 * Examples:
 *   0776512486  → digits 94776512486, display +94776512486
 *   +94 77 651 2486 → same
 *   771234567   → 94771234567
 */

export type WhatsAppPhoneResult = {
  /** Digits only for wa.me (no +) */
  digits: string;
  /** Human display with + */
  e164Display: string;
  /** Valid enough to open WhatsApp */
  ok: boolean;
  /** We applied LK default / local-format fix */
  fixed: boolean;
  reason?: string;
};

const LK_CC = '94';

function digitsOnly(raw: string): string {
  return String(raw || '').replace(/\D/g, '');
}

/**
 * Normalize a customer-entered WhatsApp number for wa.me.
 * Soft Sri Lanka defaults: local 0XXXXXXXXX → 94XXXXXXXXX.
 */
export function toWhatsAppDigits(
  raw: string,
  opts?: {
    /** Default when number looks local (no country code). Default LK. */
    defaultCountry?: 'LK';
    /** Unused for force — only soft hint if needed later */
    countryHint?: string | null;
  },
): WhatsAppPhoneResult {
  const defaultCountry = opts?.defaultCountry ?? 'LK';
  let digits = digitsOnly(raw);
  let fixed = false;

  if (!digits) {
    return {
      digits: '',
      e164Display: '',
      ok: false,
      fixed: false,
      reason: 'Missing phone number',
    };
  }

  // Already starts with 00 international prefix
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
    fixed = true;
  }

  // Sri Lanka local mobile: 07XXXXXXXX (10 digits) or 7XXXXXXXX (9 digits)
  if (defaultCountry === 'LK') {
    if (digits.startsWith('0') && digits.length === 10 && digits[1] === '7') {
      // 0776512486 → 94776512486
      digits = LK_CC + digits.slice(1);
      fixed = true;
    } else if (digits.length === 9 && digits.startsWith('7')) {
      // 776512486 → 94776512486
      digits = LK_CC + digits;
      fixed = true;
    } else if (digits.startsWith('0') && digits.length >= 9 && digits.length <= 11) {
      // Other local formats starting with 0 → strip 0, prepend 94
      digits = LK_CC + digits.slice(1);
      fixed = true;
    }
  }

  // Too short even after fix
  if (digits.length < 10) {
    return {
      digits,
      e164Display: digits ? `+${digits}` : '',
      ok: false,
      fixed,
      reason: 'Number too short for WhatsApp',
    };
  }

  // Too long (garbage)
  if (digits.length > 15) {
    return {
      digits,
      e164Display: `+${digits}`,
      ok: false,
      fixed,
      reason: 'Number too long',
    };
  }

  return {
    digits,
    e164Display: `+${digits}`,
    ok: true,
    fixed,
  };
}

/** Build https://wa.me/{digits}?text=... */
export function buildWhatsAppUrl(digitsOrRaw: string, text?: string): string | null {
  const { digits, ok } = toWhatsAppDigits(digitsOrRaw);
  if (!ok || !digits) return null;
  const base = `https://wa.me/${digits}`;
  if (text && text.trim()) {
    return `${base}?text=${encodeURIComponent(text.trim())}`;
  }
  return base;
}

/** Format for admin UI: +94 77 651 2486 style-ish (keep simple +digits) */
export function formatWhatsAppDisplay(raw: string): string {
  const r = toWhatsAppDigits(raw);
  return r.e164Display || raw || '—';
}
