/**
 * MerchantLegalFooter 헬퍼 — 빈 안내 숨김 · 모달 본문 열기
 *
 * @author MindGarden
 * @since 2026-09-09
 */
import {
  buildMerchantLegalFooterGuides,
  CLOSED_GUIDE_MODAL,
  openMerchantLegalGuideModal,
} from '@/components/molecules/merchantLegalFooterHelpers';
import { EMPTY_MERCHANT_LEGAL } from '@/utils/merchantLegal';

const LABELS = { refund: '환불·취소·청약철회', price: '상품·가격 안내' };

describe('buildMerchantLegalFooterGuides', () => {
  test('등록된 환불·상품만 노출하고 /terms 대체용 빈 항목은 없다', () => {
    const guides = buildMerchantLegalFooterGuides(
      {
        ...EMPTY_MERCHANT_LEGAL,
        refundPolicyText: '환불은 7일 이내 가능합니다.',
        productPriceGuideText: '기본 상담 5만원',
      },
      LABELS,
    );
    expect(guides).toHaveLength(2);
    expect(guides[0]).toMatchObject({
      kind: 'refund',
      label: LABELS.refund,
      body: '환불은 7일 이내 가능합니다.',
      testID: 'counseling-guide-refund',
    });
    expect(guides[1]).toMatchObject({
      kind: 'price',
      testID: 'counseling-guide-pricing',
      body: '기본 상담 5만원',
    });
  });

  test('공백 안내면 컨트롤 없음', () => {
    const guides = buildMerchantLegalFooterGuides(
      {
        ...EMPTY_MERCHANT_LEGAL,
        refundPolicyText: '',
        productPriceGuideText: '   ',
      },
      LABELS,
    );
    expect(guides).toEqual([]);
  });
});

describe('openMerchantLegalGuideModal', () => {
  test('등록 본문으로 모달을 연다', () => {
    const state = openMerchantLegalGuideModal(
      LABELS.refund,
      '청약철회는 14일 이내.\n부분 환불 가능.',
    );
    expect(state.isOpen).toBe(true);
    expect(state.title).toBe(LABELS.refund);
    expect(state.body).toContain('청약철회는 14일 이내.');
    expect(state.body).toContain('부분 환불 가능.');
  });

  test('빈 본문이면 모달을 열지 않는다 (/terms 폴백 금지)', () => {
    expect(openMerchantLegalGuideModal(LABELS.price, '  ')).toEqual(CLOSED_GUIDE_MODAL);
    expect(openMerchantLegalGuideModal(LABELS.refund, '')).toEqual(CLOSED_GUIDE_MODAL);
  });
});
