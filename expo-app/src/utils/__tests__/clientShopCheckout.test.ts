import {
  buildConsultantPickerOptions,
  cartHasConsultationSku,
  countDistinctConsultants,
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
  it('parses valid mapping rows including preselected and consultantId', () => {
    const items = parseConsultantMappingsResponse([
      {
        mappingId: 10,
        consultantId: 7,
        consultantDisplayName: '김상담',
        label: '기본 패키지',
        preselected: true,
      },
      { mappingId: 'bad' },
    ]);
    expect(items).toEqual([
      {
        mappingId: 10,
        consultantId: 7,
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
    const mappings = [{ mappingId: 7, consultantId: 1, consultantDisplayName: 'A' }];
    expect(resolveInitialMappingId(mappings)).toBe('7');
    expect(shouldShowConsultantMappingPicker(mappings)).toBe(false);
  });

  it('hides picker for same consultant multiple packages', () => {
    const mappings = [
      { mappingId: 1, consultantId: 5, consultantDisplayName: 'A', label: '무료1회', preselected: true },
      { mappingId: 2, consultantId: 5, consultantDisplayName: 'A', label: 'E2E', preselected: false },
    ];
    expect(countDistinctConsultants(mappings)).toBe(1);
    expect(shouldShowConsultantMappingPicker(mappings)).toBe(false);
    expect(buildConsultantPickerOptions(mappings).every((o) => !o.label.includes('—'))).toBe(true);
  });

  it('shows picker and empty initial id for distinct consultants', () => {
    const mappings = [
      { mappingId: 1, consultantId: 10, consultantDisplayName: 'A', preselected: true },
      { mappingId: 2, consultantId: 20, consultantDisplayName: 'B', label: '소진', preselected: false },
    ];
    expect(resolveInitialMappingId(mappings)).toBe('');
    expect(shouldShowConsultantMappingPicker(mappings)).toBe(true);
  });

  it('shows picker when many distinct consultants without selection', () => {
    const mappings = [
      { mappingId: 1, consultantId: 10, consultantDisplayName: 'A', preselected: false },
      { mappingId: 2, consultantId: 20, consultantDisplayName: 'B', preselected: false },
    ];
    expect(resolveInitialMappingId(mappings)).toBe('');
    expect(shouldShowConsultantMappingPicker(mappings)).toBe(true);
  });

  it('binds cart title to package label for same consultant', () => {
    const mappings = [
      { mappingId: 1, consultantId: 5, consultantDisplayName: 'A', label: '무료1회' },
      { mappingId: 2, consultantId: 5, consultantDisplayName: 'A', label: 'E2E-1125' },
    ];
    expect(resolveInitialMappingId(mappings, ['E2E-1125'])).toBe('2');
  });
});

describe('validateCheckoutMapping', () => {
  const twoConsultants = [
    { mappingId: 1, consultantId: 10, consultantDisplayName: 'A' },
    { mappingId: 2, consultantId: 20, consultantDisplayName: 'B' },
  ];

  it('requires selection when multiple distinct consultants', () => {
    expect(validateCheckoutMapping(true, twoConsultants, '')).toBe(
      SHOP_CHECKOUT_MAPPING_COPY.REQUIRED,
    );
  });

  it('blocks checkout when no mappings', () => {
    expect(validateCheckoutMapping(true, [], '')).toBe(SHOP_CHECKOUT_MAPPING_COPY.NO_MAPPING);
  });

  it('passes for single consultant without explicit selection', () => {
    const oneConsultantTwoRows = [
      { mappingId: 1, consultantId: 5, consultantDisplayName: 'A', label: 'p1' },
      { mappingId: 2, consultantId: 5, consultantDisplayName: 'A', label: 'p2' },
    ];
    expect(validateCheckoutMapping(true, oneConsultantTwoRows, '')).toBe('');
  });

  it('passes when multiple consultants already selected', () => {
    expect(validateCheckoutMapping(true, twoConsultants, '42')).toBe('');
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
