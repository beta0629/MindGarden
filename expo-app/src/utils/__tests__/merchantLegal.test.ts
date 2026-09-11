/**
 * merchantLegal 추출·안내 숨김 헬퍼 단위 테스트
 *
 * @author MindGarden
 * @since 2026-09-09
 */
import fs from 'fs';
import path from 'path';
import {
  EMPTY_MERCHANT_LEGAL,
  extractMerchantLegalFromTenantPayload,
  formatMerchantLegalDisclosureText,
  hasMerchantLegalDisclosureText,
  hasMerchantLegalGuideText,
  listVisibleMerchantLegalGuides,
  pickTenantFromBySubdomainResponse,
  sanitizeMerchantLegalGuideText,
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

describe('sanitizeMerchantLegalGuideText', () => {
  test('[분] 자리표시자를 회기당 시간 문구로 바꿈', () => {
    expect(sanitizeMerchantLegalGuideText('- 1회기 시간: [분] 분')).toBe(
      '- 1회기 시간: 회기당 시간(분 단위)',
    );
  });
});

describe('formatMerchantLegalDisclosureText', () => {
  test('빈 필드·안내 → 빈 문자열', () => {
    expect(formatMerchantLegalDisclosureText('', EMPTY_MERCHANT_LEGAL)).toBe('');
    expect(formatMerchantLegalDisclosureText('  ', EMPTY_MERCHANT_LEGAL)).toBe('');
    expect(hasMerchantLegalDisclosureText(null, EMPTY_MERCHANT_LEGAL)).toBe(false);
  });

  test('사업자 필드만 있으면 라벨·값 줄 구성 (빈 필드 생략)', () => {
    const text = formatMerchantLegalDisclosureText('마음정원', {
      ...EMPTY_MERCHANT_LEGAL,
      businessRegistrationNumber: '120-81-47521',
      representativeName: '김대표',
      businessAddress: '  ',
    });
    expect(text).toContain('마음정원');
    expect(text).toContain('사업자등록번호: 120-81-47521');
    expect(text).toContain('대표: 김대표');
    expect(text).not.toContain('주소:');
    expect(text).not.toContain('유선:');
    expect(
      hasMerchantLegalDisclosureText('마음정원', {
        ...EMPTY_MERCHANT_LEGAL,
        businessRegistrationNumber: '120-81-47521',
      }),
    ).toBe(true);
  });

  test('환불·상품 안내는 sanitize 후 섹션으로 붙임', () => {
    const text = formatMerchantLegalDisclosureText('센터A', {
      ...EMPTY_MERCHANT_LEGAL,
      refundPolicyText: '환불 7일',
      productPriceGuideText: '시간: [분] 분',
    });
    expect(text).toContain('센터A');
    expect(text).toContain('[환불·취소·청약철회]');
    expect(text).toContain('환불 7일');
    expect(text).toContain('[상품·가격 안내]');
    expect(text).toContain('회기당 시간(분 단위)');
    expect(text).not.toContain('[분]');
  });

  test('센터명만 있고 사업자·안내 없으면 빈 문자열', () => {
    expect(formatMerchantLegalDisclosureText('단독센터', EMPTY_MERCHANT_LEGAL)).toBe(
      '',
    );
    expect(hasMerchantLegalDisclosureText('단독센터', EMPTY_MERCHANT_LEGAL)).toBe(
      false,
    );
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

describe('social-signup consent 보기 SSOT (소스 정적)', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../../../app/(auth)/social-signup.tsx'),
    'utf8',
  );

  test('플랫폼 privacy URL·resolvePlatformPrivacyUrl·legal-webview 경로 없음', () => {
    expect(source).not.toMatch(/resolvePlatformPrivacyUrl/);
    expect(source).not.toMatch(/EXPO_PUBLIC_PRIVACY_URL/);
    expect(source).not.toMatch(/EXPO_PUBLIC_TERMS_URL/);
    expect(source).not.toMatch(/\$\{origin\}\/privacy/);
    expect(source).not.toMatch(/\$\{origin\}\/terms/);
    expect(source).not.toMatch(/\/\(auth\)\/legal-webview/);
    expect(source).not.toMatch(/pathname:\s*['"]\/\(auth\)\/legal-webview/);
    expect(source).not.toMatch(/['"`]\/privacy['"`]/);
    expect(source).not.toMatch(/['"`]\/terms['"`]/);
  });

  test('테넌트 merchantLegal disclosure 오프너 사용', () => {
    expect(source).toMatch(/formatMerchantLegalDisclosureText/);
    expect(source).toMatch(/openTenantMerchantLegalDisclosure/);
    expect(source).toMatch(/등록된 사업자·약관 안내가 없습니다/);
  });
});

describe('MerchantLegalFooter 공개 /legal/refund 패리티 (소스 정적)', () => {
  const footerSource = fs.readFileSync(
    path.join(__dirname, '../../components/molecules/MerchantLegalFooter.tsx'),
    'utf8',
  );

  test('환불은 모달이 아니라 /legal/refund 네이티브 경로로 연다', () => {
    expect(footerSource).toMatch(/LEGAL_PUBLIC_PATHS\.REFUND/);
    expect(footerSource).toMatch(/buildMerchantLegalPublicFooterLinks/);
    expect(footerSource).not.toMatch(/counseling-guide-refund/);
    expect(footerSource).not.toMatch(/UnifiedModal/);
    expect(footerSource).not.toMatch(/openMerchantLegalGuideModal/);
  });
});
