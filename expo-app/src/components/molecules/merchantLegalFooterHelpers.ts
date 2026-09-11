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
