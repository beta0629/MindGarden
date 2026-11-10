/**
 * MerchantLegalFooter 헬퍼 — 공개 /legal/* 4링크 SSOT · caption lineHeight
 *
 * @author MindGarden
 * @since 2026-09-09
 */
import {
  buildMerchantLegalPublicFooterLinks,
  CLOSED_GUIDE_MODAL,
  MERCHANT_LEGAL_FOOTER_CAPTION_FONT_SIZE,
  MERCHANT_LEGAL_FOOTER_LINE_HEIGHT_NORMAL,
  MERCHANT_LEGAL_FOOTER_MAX_FONT_SIZE_MULTIPLIER,
  MERCHANT_LEGAL_FOOTER_TITLE_FONT_SIZE,
  openMerchantLegalGuideModal,
  resolveMerchantLegalFooterCaptionLineStyle,
  resolveMerchantLegalFooterFontScale,
  resolveMerchantLegalFooterTitleLineHeight,
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

describe('resolveMerchantLegalFooterCaptionLineStyle', () => {
  test('기본(scale=1) lineHeight >= fontSize × lineHeight.normal (caption 토큰)', () => {
    const style = resolveMerchantLegalFooterCaptionLineStyle();
    const minLineHeight =
      MERCHANT_LEGAL_FOOTER_CAPTION_FONT_SIZE *
      MERCHANT_LEGAL_FOOTER_LINE_HEIGHT_NORMAL;
    expect(style.fontSize).toBe(MERCHANT_LEGAL_FOOTER_CAPTION_FONT_SIZE);
    expect(style.lineHeight).toBeGreaterThanOrEqual(minLineHeight);
    expect(style.lineHeight).toBe(minLineHeight);
  });

  test('fontScale 이 MAX 까지 커져도 lineHeight >= scaledFontSize × normal', () => {
    const max = MERCHANT_LEGAL_FOOTER_MAX_FONT_SIZE_MULTIPLIER;
    for (const scale of [1, 1.2, 1.5, max, max + 0.5, 3]) {
      const style = resolveMerchantLegalFooterCaptionLineStyle({
        fontScale: scale,
        maxFontSizeMultiplier: max,
        fontSize: MERCHANT_LEGAL_FOOTER_CAPTION_FONT_SIZE,
        lineHeightMultiplier: MERCHANT_LEGAL_FOOTER_LINE_HEIGHT_NORMAL,
      });
      const capped = resolveMerchantLegalFooterFontScale(scale, max);
      const scaledFontSize = MERCHANT_LEGAL_FOOTER_CAPTION_FONT_SIZE * capped;
      expect(style.lineHeight).toBeGreaterThanOrEqual(
        scaledFontSize * MERCHANT_LEGAL_FOOTER_LINE_HEIGHT_NORMAL,
      );
      expect(capped).toBeLessThanOrEqual(max);
    }
  });

  test('theme.textStyles.caption 입력을 그대로 반영한다', () => {
    const caption = {
      fontFamily: 'Pretendard-Regular',
      fontSize: 12,
      lineHeight: 18,
    };
    const style = resolveMerchantLegalFooterCaptionLineStyle({
      fontScale: 1,
      fontSize: caption.fontSize,
      lineHeightMultiplier: caption.lineHeight / caption.fontSize,
      fontFamily: caption.fontFamily,
    });
    expect(style.fontFamily).toBe(caption.fontFamily);
    expect(style.fontSize).toBe(caption.fontSize);
    expect(style.lineHeight).toBe(caption.lineHeight);
  });

  test('title lineHeight 도 sm × normal × cappedScale 이상', () => {
    const max = MERCHANT_LEGAL_FOOTER_MAX_FONT_SIZE_MULTIPLIER;
    const titleLh = resolveMerchantLegalFooterTitleLineHeight({
      fontScale: max,
      maxFontSizeMultiplier: max,
      fontSize: MERCHANT_LEGAL_FOOTER_TITLE_FONT_SIZE,
      lineHeightMultiplier: MERCHANT_LEGAL_FOOTER_LINE_HEIGHT_NORMAL,
    });
    expect(titleLh).toBeGreaterThanOrEqual(
      MERCHANT_LEGAL_FOOTER_TITLE_FONT_SIZE *
        MERCHANT_LEGAL_FOOTER_LINE_HEIGHT_NORMAL *
        max,
    );
  });
});
