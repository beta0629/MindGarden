/**
 * MerchantLegalFooter 헬퍼 — 공개 /legal/* 4링크 SSOT
 *
 * @author MindGarden
 * @since 2026-09-09
 */
import {
  buildMerchantLegalPublicFooterLinks,
  CLOSED_GUIDE_MODAL,
  openMerchantLegalGuideModal,
} from '@/components/molecules/merchantLegalFooterHelpers';
import { LEGAL_PUBLIC_PATHS } from '@/constants/legalPublic';

describe('buildMerchantLegalPublicFooterLinks', () => {
  test('웹과 동일하게 terms·privacy·products·refund 4링크를 항상 노출한다', () => {
    const links = buildMerchantLegalPublicFooterLinks();
    expect(links).toHaveLength(4);
    expect(links.map((l) => l.path)).toEqual([
      LEGAL_PUBLIC_PATHS.TERMS,
      LEGAL_PUBLIC_PATHS.PRIVACY,
      LEGAL_PUBLIC_PATHS.PRODUCTS,
      LEGAL_PUBLIC_PATHS.REFUND,
    ]);
    expect(links.map((l) => l.testID)).toEqual([
      'legal-public-link-terms',
      'legal-public-link-privacy',
      'legal-public-link-products',
      'legal-public-link-refund',
    ]);
    expect(links.find((l) => l.key === 'refund')?.openNativeRefund).toBe(true);
  });

  test('환불 링크는 모달이 아니라 /legal/refund 네이티브 공개 경로다', () => {
    const refund = buildMerchantLegalPublicFooterLinks().find(
      (l) => l.key === 'refund',
    );
    expect(refund?.path).toBe('/legal/refund');
    expect(refund?.openNativeRefund).toBe(true);
  });
});

describe('openMerchantLegalGuideModal', () => {
  test('등록 본문으로 모달을 연다 (consent disclosure 전용)', () => {
    const state = openMerchantLegalGuideModal(
      '환불·취소·청약철회',
      '청약철회는 14일 이내.\n부분 환불 가능.',
    );
    expect(state.isOpen).toBe(true);
    expect(state.title).toBe('환불·취소·청약철회');
    expect(state.body).toContain('청약철회는 14일 이내.');
  });

  test('빈 본문이면 모달을 열지 않는다 (/terms 폴백 금지)', () => {
    expect(openMerchantLegalGuideModal('상품·가격', '  ')).toEqual(
      CLOSED_GUIDE_MODAL,
    );
    expect(openMerchantLegalGuideModal('환불', '')).toEqual(CLOSED_GUIDE_MODAL);
  });
});
