import {
  cartHasConsultationSku,
  parseConsultantMappingsResponse,
  resolveMappingIdForCheckout,
  validateCheckoutMapping,
} from '@/utils/clientShopCheckout';
import { SHOP_CHECKOUT_MAPPING_COPY } from '@/constants/clientShopConstants';

describe('cartHasConsultationSku', () => {
  const catalog = [
    { skuCode: 'CONS-1', catalogCategory: 'CONSULTATION' },
    { skuCode: 'ASSESS-1', catalogCategory: 'ASSESSMENT' },
  ];

  it('returns true when cart contains consultation sku', () => {
    expect(cartHasConsultationSku([{ skuCode: 'CONS-1' }], catalog)).toBe(true);
  });

  it('returns false when cart has only non-consultation sku', () => {
    expect(cartHasConsultationSku([{ skuCode: 'ASSESS-1' }], catalog)).toBe(false);
  });

  it('returns false for empty cart', () => {
    expect(cartHasConsultationSku([], catalog)).toBe(false);
  });
});

describe('parseConsultantMappingsResponse', () => {
  it('parses valid mapping rows', () => {
    const items = parseConsultantMappingsResponse([
      { mappingId: 10, consultantDisplayName: '김상담', label: '기본 패키지' },
      { mappingId: 'bad' },
    ]);
    expect(items).toEqual([
      {
        mappingId: 10,
        consultantDisplayName: '김상담',
        label: '기본 패키지',
      },
    ]);
  });

  it('returns empty array for non-array input', () => {
    expect(parseConsultantMappingsResponse(null)).toEqual([]);
  });
});

describe('validateCheckoutMapping', () => {
  it('requires selection when multiple mappings', () => {
    expect(validateCheckoutMapping(true, 2, '')).toBe(SHOP_CHECKOUT_MAPPING_COPY.REQUIRED);
  });

  it('blocks checkout when no mappings', () => {
    expect(validateCheckoutMapping(true, 0, '')).toBe(SHOP_CHECKOUT_MAPPING_COPY.NO_MAPPING);
  });

  it('passes for single mapping without explicit selection', () => {
    expect(validateCheckoutMapping(true, 1, '')).toBe('');
  });
});

describe('resolveMappingIdForCheckout', () => {
  it('returns number when consultation cart and id selected', () => {
    expect(resolveMappingIdForCheckout(true, '42')).toBe(42);
  });

  it('returns null when not consultation cart', () => {
    expect(resolveMappingIdForCheckout(false, '42')).toBeNull();
  });
});
