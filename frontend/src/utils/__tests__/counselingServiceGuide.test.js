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
  });

  test('종류·자격이 없으면 섹션을 숨기고 할부 문장을 쓴다', () => {
    const view = buildGuideView({ tenant: { name: '마음센터' } });
    expect(view.showCenter).toBe(true);
    expect(view.showTypes).toBe(false);
    expect(view.showCounselors).toBe(false);
    expect(view.paymentNote).toBe(CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE);
    expect(view.paymentNote).not.toContain('일시불만');
    expect(view.oneLiner).toContain('마음센터');
    expect(view.refundBody).toContain('문의해 주세요');
  });

  test('상호·주소·연락처가 모두 없으면 센터 섹션을 숨긴다', () => {
    const view = buildGuideView({ tenant: {} });
    expect(view.showCenter).toBe(false);
    expect(view.pageTitle).toBe('상담 서비스 안내');
  });
});
