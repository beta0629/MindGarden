/**
 * 공개 상담 서비스 안내 뷰·테스트 상품 제외
 *
 * @author CoreSolution
 * @since 2026-10-01
 */

import { CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE } from '../../constants/legalPublic';
import {
  buildGuideView,
  filterPublicGuideProducts,
  formatGuideValidity,
  isExcludedPublicProduct
} from '../counselingServiceGuide';

describe('counselingServiceGuide', () => {
  test('테스트·샘플·isTest·publicVisible false 상품을 제외한다', () => {
    const kept = filterPublicGuideProducts([
      { name: '10회 패키지', price: 100000 },
      { name: '테스트 상품', price: 1000 },
      { name: '샘플 상담', price: 1000 },
      { name: '단회기', code: 'TEST_ONCE', price: 1000 },
      { name: '샘플코드', sku: 'SAMPLE-1', price: 1000 },
      { name: '숨김', publicVisible: false, price: 1000 },
      { name: '시험', isTest: true, price: 1000 }
    ]);
    expect(kept.map((row) => row.name)).toEqual(['10회 패키지']);
    expect(isExcludedPublicProduct({ name: '정상', extra: { isTest: 'true' } })).toBe(true);
    expect(isExcludedPublicProduct({ name: '1000원_테스트', price: 1000 })).toBe(true);
    expect(isExcludedPublicProduct({ name: '단회기', skuCode: 'SHOP-20260929-001', price: 90000 })).toBe(true);
    expect(isExcludedPublicProduct({ name: '숨김상품', catalogVisible: false, price: 90000 })).toBe(true);
    expect(isExcludedPublicProduct({ name: '중지', active: false, price: 90000 })).toBe(true);
  });

  test('상담 패키지 21개 목록은 쓰지 않고 샵 공개 상품만 남긴다', () => {
    const packages = Array.from({ length: 21 }, (_, index) => ({
      name: `패키지${index + 1}`,
      price: 10000
    }));
    const view = buildGuideView({
      tenant: {
        consultationPackages: packages,
        serviceGuide: {
          products: [
            { name: '10회기', sessions: 10, price: 850000, validityMonths: 3 },
            { name: '1000원_테스트', sessions: 1, price: 1000 },
            { name: '테스트SKU', skuCode: 'SHOP-20260929-001', sessions: 1, price: 1000 },
            { name: '비공개', publicVisible: false, sessions: 1, price: 90000 }
          ]
        }
      }
    });
    expect(view.products.map((row) => row.name)).toEqual(['10회기']);
  });

  test('validityMonths 와 1·10·20회기 폴백만 개월로 보이고 대시는 없다', () => {
    expect(formatGuideValidity({ validityMonths: 4, sessions: 8 })).toBe('결제일부터 4개월');
    expect(formatGuideValidity({ sessions: 1 })).toBe('결제일부터 2개월');
    expect(formatGuideValidity({ sessions: 10 })).toBe('결제일부터 3개월');
    expect(formatGuideValidity({ sessions: 20 })).toBe('결제일부터 6개월');
    expect(formatGuideValidity({ sessions: 5 })).toBe('5회기');
    expect(formatGuideValidity({ sessions: 5 })).not.toContain('—');
    expect(formatGuideValidity({})).toBe('');
  });

  test('종류·자격이 없으면 섹션을 숨기고 할부 문장을 쓴다', () => {
    const view = buildGuideView({ tenant: { name: '마음센터' } });
    expect(view.showCenter).toBe(true);
    expect(view.showTypes).toBe(true);
    expect(view.showCounselors).toBe(true);
    expect(view.paymentNote).toBe(CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE);
    expect(view.paymentNote).not.toContain('일시불만');
    expect(view.oneLiner).toContain('마음센터');
    expect(view.refundBody).toContain('문의해 주세요');
  });

  test('테넌트 상호가 없어도 고정 안내 섹션은 남긴다', () => {
    const view = buildGuideView({ tenant: {} });
    expect(view.showCenter).toBe(true);
    expect(view.pageTitle).toBe('상담 서비스 안내');
    expect(view.representativeName).toBe('');
    expect(view.businessRegistrationNumber).toBe('');
  });
});
