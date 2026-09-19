import {
  cartHasConsultationSku,
  parseConsultantMappingsResponse,
  resolveInitialMappingId,
  resolveMappingIdForCheckout,
  shouldShowConsultantMappingPicker,
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
  it('parses valid mapping rows including preselected', () => {
    const items = parseConsultantMappingsResponse([
      {
        mappingId: 10,
        consultantDisplayName: '김상담',
        label: '기본 패키지',
        preselected: true,
      },
      { mappingId: 'bad' },
    ]);
    expect(items).toEqual([
      {
        mappingId: 10,
        consultantDisplayName: '김상담',
        label: '기본 패키지',
        preselected: true,
      },
    ]);
  });

  it('defaults preselected to false when absent', () => {
    const items = parseConsultantMappingsResponse([
      { mappingId: 3, consultantDisplayName: 'A' },
    ]);
    expect(items[0]?.preselected).toBe(false);
  });

  it('returns empty array for non-array input', () => {
    expect(parseConsultantMappingsResponse(null)).toEqual([]);
  });
});

describe('resolveInitialMappingId / shouldShowConsultantMappingPicker', () => {
  it('hides picker and selects id for single mapping', () => {
    const mappings = [{ mappingId: 7, consultantDisplayName: 'A' }];
    expect(resolveInitialMappingId(mappings)).toBe('7');
    expect(shouldShowConsultantMappingPicker(mappings)).toBe(false);
  });

  it('hides picker when unique preselected among many', () => {
    const mappings = [
      { mappingId: 1, consultantDisplayName: 'A', preselected: true },
      { mappingId: 2, consultantDisplayName: 'B', label: '소진', preselected: false },
    ];
    expect(resolveInitialMappingId(mappings)).toBe('1');
    expect(shouldShowConsultantMappingPicker(mappings)).toBe(false);
  });

  it('shows picker when many without unique preselected', () => {
    const mappings = [
      { mappingId: 1, consultantDisplayName: 'A', preselected: false },
      { mappingId: 2, consultantDisplayName: 'B', preselected: false },
    ];
    expect(resolveInitialMappingId(mappings)).toBe('');
    expect(shouldShowConsultantMappingPicker(mappings)).toBe(true);
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

  it('passes when multiple mappings already selected (preselected auto)', () => {
    expect(validateCheckoutMapping(true, 2, '42')).toBe('');
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
