/**
 * SMS Parser utility for DF-Alert payment confirmation SMS messages.
 */

export interface ParsedBankSms {
  isDfAlert: boolean;
  amount: number | null;
  rawText: string;
  sender: string;
  timestamp: Date;
  referenceNumber?: string | null;
}

/**
 * Checks if the SMS comes from DF-Alert (or variants) and extracts the payment amount.
 * Example DF-Alert SMS formats:
 * - "Received LKR 499.00 on 07/08 at 14:55 to Acct ending 1234. Ref: 987654"
 * - "Your account credited with LKR 350.00 from Bank Transfer"
 * - "Payment of Rs 499.00 received"
 */
export function parseDfAlertSms(sender: string = '', body: string = ''): ParsedBankSms {
  const cleanSender = (sender || '').trim();
  const cleanBody = (body || '').trim();

  // Check sender or text content for DF-Alert identity
  const isDfAlert =
    /df[-_]?alert/i.test(cleanSender) ||
    /df[-_]?alert/i.test(cleanBody) ||
    /dfb[-_]?alert/i.test(cleanSender);

  if (!cleanBody) {
    return { isDfAlert, amount: null, rawText: body, sender, timestamp: new Date() };
  }

  // 1. Strip out Account Balance trailing text to prevent matching balance instead of transfer amount
  const bodyWithoutBalance = cleanBody.split(/account\s+balance|balance\s*[:-]/i)[0];

  // Regex patterns tailored for DF-Alert (e.g. "Inward CEFTS of LKR 499.00 was performed...")
  const patterns = [
    /Inward\s+(?:CEFTS|transfer|remittance|deposit)?\s+(?:of\s+)?(?:LKR|Rs\.?|SLR)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:LKR|Rs\.?|SLR)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:credited|received|deposited)\s+(?:with\s+)?(?:LKR|Rs\.?|SLR)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:LKR|Rs\.?|SLR)/i,
  ];

  let extractedAmount: number | null = null;

  for (const pattern of patterns) {
    const match = bodyWithoutBalance.match(pattern) || cleanBody.match(pattern);
    if (match && match[1]) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) {
        extractedAmount = num;
        break;
      }
    }
  }

  // Extract optional reference number
  const refMatch = cleanBody.match(/(?:ref|trx|txn|id)[:\s]*([a-z0-9]+)/i);
  const referenceNumber = refMatch ? refMatch[1] : null;

  return {
    isDfAlert,
    amount: extractedAmount,
    rawText: cleanBody,
    sender: cleanSender,
    timestamp: new Date(),
    referenceNumber,
  };
}
