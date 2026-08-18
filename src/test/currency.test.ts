import { describe, it, expect } from 'vitest';
import {
  convertLkrToDisplay,
  LKR_PER_USD,
  INR_PER_LKR,
  charmUsd,
  charmInr,
} from '@/hooks/useCurrency';

describe('convertLkrToDisplay — equal shop prices, never under-charge', () => {
  const samples = [299, 1110, 1199, 1999, 3999, 4999, 13999];

  it('LKR stays the catalog integer', () => {
    expect(convertLkrToDisplay(4999, 'LKR')).toBe(4999);
    expect(convertLkrToDisplay(1199, 'LKR')).toBe(1199);
  });

  it('USD is a .99 shop price and covers the LKR catalog', () => {
    const usd = convertLkrToDisplay(4999, 'USD');
    expect(usd).toBe(16.99);
    expect(usd * LKR_PER_USD).toBeGreaterThanOrEqual(4999);
    expect(Number.isInteger(Math.round(usd * 100) % 100 === 99 ? 1 : 0)).toBe(true);
    expect(Math.round(usd * 100) % 100).toBe(99);
  });

  it('INR is an xx99 shop price and covers the LKR catalog', () => {
    const inr = convertLkrToDisplay(4999, 'INR');
    expect(inr).toBe(1499);
    expect(inr / INR_PER_LKR).toBeGreaterThanOrEqual(4999);
    expect(inr % 100).toBe(99);
  });

  it('never quotes below catalog for common prices', () => {
    for (const lkr of samples) {
      const usd = convertLkrToDisplay(lkr, 'USD');
      const inr = convertLkrToDisplay(lkr, 'INR');
      expect(usd * LKR_PER_USD).toBeGreaterThanOrEqual(lkr);
      expect(inr / INR_PER_LKR).toBeGreaterThanOrEqual(lkr);
      expect(Math.round(usd * 100) % 100).toBe(99);
      expect(inr % 100).toBe(99);
    }
  });

  it('charm helpers snap up, not down', () => {
    expect(charmUsd(16.01)).toBe(16.99);
    expect(charmUsd(16.99)).toBe(16.99);
    expect(charmUsd(17)).toBe(17.99);
    expect(charmInr(1432)).toBe(1499);
    expect(charmInr(1499)).toBe(1499);
  });
});
