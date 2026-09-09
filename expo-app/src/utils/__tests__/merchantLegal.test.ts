/**
 * merchantLegal 추출·안내 숨김 헬퍼 단위 테스트
 *
 * @author MindGarden
 * @since 2026-09-09
 */
import {
  EMPTY_MERCHANT_LEGAL,
  extractMerchantLegalFromTenantPayload,
  hasMerchantLegalGuideText,
  listVisibleMerchantLegalGuides,
  pickTenantFromBySubdomainResponse,
} from '@/utils/merchantLegal';

describe('extractMerchantLegalFromTenantPayload', () => {
  test('null/비객체 → 빈 필드', () => {
    expect(extractMerchantLegalFromTenantPayload(null)).toEqual(EMPTY_MERCHANT_LEGAL);
    expect(extractMerchantLegalFromTenantPayload(undefined)).toEqual(EMPTY_MERCHANT_LEGAL);
    expect(extractMerchantLegalFromTenantPayload('x')).toEqual(EMPTY_MERCHANT_LEGAL);
  });

  test('merchantLegal 필드 추출', () => {
    const legal = extractMerchantLegalFromTenantPayload({
      tenantId: 't1',
      name: '센터',
      merchantLegal: {
        businessRegistrationNumber: '120-81-47521',
        representativeName: '김대표',
        businessLandline: '02-111-2222',
        businessAddress: '서울',
        mailOrderReportNumber: '제2024-0001호',
        refundPolicyText: '환불 7일',
        productPriceGuideText: '기본 5만원',
      },
    });
    expect(legal.businessRegistrationNumber).toBe('120-81-47521');
    expect(legal.representativeName).toBe('김대표');
    expect(legal.refundPolicyText).toBe('환불 7일');
    expect(legal.productPriceGuideText).toBe('기본 5만원');
  });

  test('merchantLegal 누락·비문자 → 빈 문자열', () => {
    const legal = extractMerchantLegalFromTenantPayload({
      merchantLegal: { refundPolicyText: 123, productPriceGuideText: null },
    });
    expect(legal.refundPolicyText).toBe('');
    expect(legal.productPriceGuideText).toBe('');
  });
});

describe('listVisibleMerchantLegalGuides', () => {
  test('등록 문구만 노출하고 공백은 숨김', () => {
    const guides = listVisibleMerchantLegalGuides({
      ...EMPTY_MERCHANT_LEGAL,
      refundPolicyText: '청약철회 14일',
      productPriceGuideText: '   ',
    });
    expect(guides).toEqual([{ kind: 'refund', body: '청약철회 14일' }]);
  });

  test('둘 다 비면 빈 배열', () => {
    expect(
      listVisibleMerchantLegalGuides({
        ...EMPTY_MERCHANT_LEGAL,
        refundPolicyText: '',
        productPriceGuideText: '\n\t',
      }),
    ).toEqual([]);
  });
});

describe('hasMerchantLegalGuideText', () => {
  test('공백·null 은 false', () => {
    expect(hasMerchantLegalGuideText(null)).toBe(false);
    expect(hasMerchantLegalGuideText('  ')).toBe(false);
    expect(hasMerchantLegalGuideText('본문')).toBe(true);
  });
});

describe('pickTenantFromBySubdomainResponse', () => {
  test('data.found + tenant 추출', () => {
    const tenant = pickTenantFromBySubdomainResponse({
      success: true,
      data: { found: true, tenant: { name: 'A', merchantLegal: {} } },
    });
    expect(tenant).toEqual({ name: 'A', merchantLegal: {} });
  });

  test('found false → null', () => {
    expect(
      pickTenantFromBySubdomainResponse({ data: { found: false, tenant: null } }),
    ).toBeNull();
  });
});
