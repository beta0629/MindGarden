/**
 * MerchantLegalFooter 순수 헬퍼 — Jest(node)에서 렌더 없이 검증
 *
 * @author MindGarden
 * @since 2026-09-09
 */
import {
  hasMerchantLegalGuideText,
  listVisibleMerchantLegalGuides,
  type MerchantLegalFields,
  type MerchantLegalGuideItem,
} from '@/utils/merchantLegal';

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

export type MerchantLegalGuideLabels = {
  readonly refund: string;
  readonly price: string;
};

/**
 * 안내 kind → 표시 라벨
 *
 * @param kind refund | price
 * @param labels i18n 라벨 맵
 * @returns 라벨 문자열
 */
export function labelForMerchantLegalGuide(
  kind: MerchantLegalGuideItem['kind'],
  labels: MerchantLegalGuideLabels,
): string {
  switch (kind) {
    case 'refund':
      return labels.refund;
    case 'price':
      return labels.price;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/**
 * 안내 모달을 연다. body 가 비면 닫힌 상태 유지(빈 /terms 대체 금지).
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
 * 푸터에 노출할 안내 + 테스트용 testID 목록
 *
 * @param legal merchantLegal
 * @param labels 라벨
 * @returns { kind, label, body, testID }[]
 */
export function buildMerchantLegalFooterGuides(
  legal: MerchantLegalFields,
  labels: MerchantLegalGuideLabels,
): ReadonlyArray<{
  readonly kind: MerchantLegalGuideItem['kind'];
  readonly label: string;
  readonly body: string;
  readonly testID: string;
}> {
  return listVisibleMerchantLegalGuides(legal).map((item) => ({
    kind: item.kind,
    label: labelForMerchantLegalGuide(item.kind, labels),
    body: item.body,
    testID:
      item.kind === 'refund' ? 'counseling-guide-refund' : 'counseling-guide-pricing',
  }));
}
