import { describe, it, expect } from 'vitest';
import { convertLkrToDisplay, LKR_PER_USD, INR_PER_LKR } from '@/hooks/useCurrency';

describe('convertLkrToDisplay — never under-charge', () => {
  it('charms 1110 LKR display and never pays out less than catalog', () => {
    expect(convertLkrToDisplay(1110, 'LKR')).toBe(1110);
    expect(convertLkrToDisplay(1199, 'LKR')).toBe(1199);

    const usd = convertLkrToDisplay(1199, 'USD');
    expect(usd).toBe(3.25);
    expect(usd * LKR_PER_USD).toBeGreaterThanOrEqual(1199);

    const inr = convertLkrToDisplay(1199, 'INR');
    expect(inr).toBe(420);
    expect(inr / INR_PER_LKR).toBeGreaterThanOrEqual(1199);
  });

  it('exact $3 catalog (1110 LKR) still shows $3.00', () => {
    expect(convertLkrToDisplay(1110, 'USD')).toBe(3);
  });
});
