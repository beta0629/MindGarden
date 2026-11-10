/**
 * MerchantLegalFooter 순수 헬퍼 — Jest(node)에서 렌더 없이 검증
 * 공개 법적 문서는 /legal/* 링크 (Modal-only 금지, 웹 SSOT 패리티)
 *
 * @author MindGarden
 * @since 2026-09-09
 */
import { LEGAL_PUBLIC_FOOTER_LINKS } from '@/constants/legalPublic';
import { hasMerchantLegalGuideText } from '@/utils/merchantLegal';

export type MerchantLegalGuideModalState = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly body: string;
};

export const CLOSED_GUIDE_MODAL: MerchantLegalGuideModalState = Object.freeze({
  isOpen: false,
  title: '',
  body: '',
});

export type MerchantLegalPublicLinkItem = {
  readonly key: string;
  readonly path: string;
  readonly label: string;
  readonly testID: string;
  readonly openNativeRefund: boolean;
};

/** Text maxFontSizeMultiplier — 푸터 전역과 동일 */
export const MERCHANT_LEGAL_FOOTER_MAX_FONT_SIZE_MULTIPLIER = 1.6;

/**
 * textStyles.caption / typography 토큰 기본값 (Jest-node · expo-font 회피).
 * 컴포넌트에서는 theme.textStyles.caption · theme.fontSize 를 넘겨 덮어쓴다.
 */
export const MERCHANT_LEGAL_FOOTER_CAPTION_FONT_SIZE = 12;
export const MERCHANT_LEGAL_FOOTER_TITLE_FONT_SIZE = 14;
export const MERCHANT_LEGAL_FOOTER_LINE_HEIGHT_NORMAL = 1.5;
export const MERCHANT_LEGAL_FOOTER_CAPTION_FONT_FAMILY = 'Pretendard-Regular';

export type MerchantLegalFooterCaptionLineStyle = {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly lineHeight: number;
};

export type ResolveMerchantLegalFooterCaptionLineStyleOptions = {
  /** PixelRatio.getFontScale() 등. 미지정 시 1 */
  readonly fontScale?: number;
  /** maxFontSizeMultiplier 상한. 기본 MERCHANT_LEGAL_FOOTER_MAX_FONT_SIZE_MULTIPLIER */
  readonly maxFontSizeMultiplier?: number;
  /** textStyles.caption.fontSize 등 */
  readonly fontSize?: number;
  /** lineHeight.normal 배수 (caption.lineHeight / caption.fontSize) */
  readonly lineHeightMultiplier?: number;
  /** textStyles.caption.fontFamily 등 */
  readonly fontFamily?: string;
};

export type ResolveMerchantLegalFooterTitleLineHeightOptions = {
  readonly fontScale?: number;
  readonly maxFontSizeMultiplier?: number;
  /** theme.fontSize.sm 등 */
  readonly fontSize?: number;
  readonly lineHeightMultiplier?: number;
};

/**
 * 접근성 fontScale 을 maxFontSizeMultiplier 로 캡한다.
 *
 * @param fontScale PixelRatio.getFontScale() 등
 * @param maxFontSizeMultiplier Text maxFontSizeMultiplier 상한
 * @returns 0 이상 · max 이하 배율
 */
export function resolveMerchantLegalFooterFontScale(
  fontScale: number,
  maxFontSizeMultiplier: number = MERCHANT_LEGAL_FOOTER_MAX_FONT_SIZE_MULTIPLIER,
): number {
  const safeScale =
    typeof fontScale === 'number' && Number.isFinite(fontScale) ? fontScale : 1;
  const safeMax =
    typeof maxFontSizeMultiplier === 'number' &&
    Number.isFinite(maxFontSizeMultiplier) &&
    maxFontSizeMultiplier > 0
      ? maxFontSizeMultiplier
      : MERCHANT_LEGAL_FOOTER_MAX_FONT_SIZE_MULTIPLIER;
  return Math.min(Math.max(safeScale, 0), safeMax);
}

/**
 * 푸터 detail 라인용 caption 스타일.
 * StyleSheet 고정 lineHeight 가 maxFontSizeMultiplier 로 커진 fontSize 보다
 * 작아 descender 가 잘리지 않도록, 캡된 fontScale 을 lineHeight 에 반영한다.
 *
 * @param options fontScale · 토큰 fontSize/lineHeightMultiplier
 * @returns caption fontFamily/fontSize + 스케일 반영 lineHeight
 */
export function resolveMerchantLegalFooterCaptionLineStyle(
  options: ResolveMerchantLegalFooterCaptionLineStyleOptions = {},
): MerchantLegalFooterCaptionLineStyle {
  const maxMult =
    options.maxFontSizeMultiplier ?? MERCHANT_LEGAL_FOOTER_MAX_FONT_SIZE_MULTIPLIER;
  const cappedScale = resolveMerchantLegalFooterFontScale(
    options.fontScale ?? 1,
    maxMult,
  );
  const baseFontSize = options.fontSize ?? MERCHANT_LEGAL_FOOTER_CAPTION_FONT_SIZE;
  const multiplier =
    options.lineHeightMultiplier ?? MERCHANT_LEGAL_FOOTER_LINE_HEIGHT_NORMAL;
  const scaledFontSize = baseFontSize * cappedScale;
  const scaledLineHeight = scaledFontSize * multiplier;

  return {
    fontFamily: options.fontFamily ?? MERCHANT_LEGAL_FOOTER_CAPTION_FONT_FAMILY,
    fontSize: baseFontSize,
    lineHeight: scaledLineHeight,
  };
}

/**
 * 푸터 타이틀(sm · semibold)용 최소 lineHeight — normal 배수 · fontScale 반영.
 *
 * @param options fontScale · fontSize · lineHeightMultiplier
 * @returns 스케일 반영 lineHeight
 */
export function resolveMerchantLegalFooterTitleLineHeight(
  options: ResolveMerchantLegalFooterTitleLineHeightOptions = {},
): number {
  const maxMult =
    options.maxFontSizeMultiplier ?? MERCHANT_LEGAL_FOOTER_MAX_FONT_SIZE_MULTIPLIER;
  const cappedScale = resolveMerchantLegalFooterFontScale(
    options.fontScale ?? 1,
    maxMult,
  );
  const baseFontSize = options.fontSize ?? MERCHANT_LEGAL_FOOTER_TITLE_FONT_SIZE;
  const multiplier =
    options.lineHeightMultiplier ?? MERCHANT_LEGAL_FOOTER_LINE_HEIGHT_NORMAL;
  return baseFontSize * multiplier * cappedScale;
}

/**
 * 안내 모달을 연다. body 가 비면 닫힌 상태 유지(빈 /terms 대체 금지).
 * social-signup consent disclosure 등 비공개 용도로만 유지.
 *
 * @param title 모달 제목
 * @param body 등록 본문
 * @returns 모달 상태
 */
export function openMerchantLegalGuideModal(
  title: string,
  body: string,
): MerchantLegalGuideModalState {
  if (!hasMerchantLegalGuideText(body)) {
    return { ...CLOSED_GUIDE_MODAL };
  }
  return {
    isOpen: true,
    title,
    body: body.trim(),
  };
}

/**
 * 푸터 안내 컬럼 — 웹과 동일하게 /legal/* 4링크 (항상 노출)
 *
 * @returns 공개 링크 목록
 */
export function buildMerchantLegalPublicFooterLinks(): ReadonlyArray<MerchantLegalPublicLinkItem> {
  return LEGAL_PUBLIC_FOOTER_LINKS.map((item) => ({
    key: item.key,
    path: item.path,
    label: item.label,
    testID: item.testID,
    openNativeRefund: item.openNativeRefund,
  }));
}
