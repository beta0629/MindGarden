import {
  formatShopDateTime,
  formatShopMoney,
  formatShopPoints,
} from '@/utils/clientShopFormat';

describe('formatShopMoney', () => {
  it('formats KRW minor units with locale', () => {
    expect(formatShopMoney(100000)).toBe('100,000원');
  });

  it('handles zero', () => {
    expect(formatShopMoney(0)).toBe('0원');
  });

  it('uses currency suffix for non-KRW', () => {
    expect(formatShopMoney(500, 'USD')).toBe('500 USD');
  });
});

describe('formatShopDateTime', () => {
  it('formats ISO datetime for display', () => {
    expect(formatShopDateTime('2026-05-19T14:30:00')).toBe('2026-05-19 14:30');
  });

  it('returns empty string for missing value', () => {
    expect(formatShopDateTime()).toBe('');
    expect(formatShopDateTime(null)).toBe('');
  });
});

describe('formatShopPoints', () => {
  it('formats points with P suffix', () => {
    expect(formatShopPoints(15000)).toBe('15,000 P');
  });

  it('handles nullish as zero', () => {
    expect(formatShopPoints(0)).toBe('0 P');
  });
});
