/** Flip to true to restore UPI at checkout. */
export const UPI_CHECKOUT_ENABLED = false;

export type StorePaymentMethod =
  | 'bank_transfer'
  | 'upi'
  | 'binance_usdt'
  | 'crypto_onchain'
  | 'card'
  | string
  | null
  | undefined;

export function paymentMethodLabel(method: StorePaymentMethod): string {
  switch (method) {
    case 'card':
      return 'Card Payment';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'upi':
      return 'UPI';
    case 'binance_usdt':
      return 'Binance Pay';
    case 'crypto_onchain':
      return 'Crypto Wallet';
    case null:
    case undefined:
    case '':
      return 'Unpaid';
    default:
      return String(method).replace(/_/g, ' ');
  }
}

export function paymentMethodShort(method: StorePaymentMethod): string {
  switch (method) {
    case 'card':
      return 'CARD';
    case 'bank_transfer':
      return 'BANK';
    case 'upi':
      return 'UPI';
    case 'binance_usdt':
      return 'BINANCE';
    case 'crypto_onchain':
      return 'CRYPTO';
    case null:
    case undefined:
    case '':
      return 'UNPAID';
    default:
      return String(method).replace(/_/g, ' ').toUpperCase();
  }
}

export function isCardPayment(method: StorePaymentMethod): boolean {
  return method === 'card';
}
