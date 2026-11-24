/**
 * 결제 전 패키지 환불 차감 요약 — 웹 `clientMallConstants.CLIENT_CHECKOUT_REFUND_COPY` 패리티
 *
 * @author MindGarden
 * @since 2026-11-24
 */

export const CLIENT_REFUND_NOTICE = '환불 기준과 신청 방법은 센터 환불 규칙에 따라 안내해 드려요.';

export const CLIENT_CHECKOUT_REFUND_COPY = Object.freeze({
  DEDUCTION_TEMPLATE:
    '사용한 회기는 할인가가 아니라 {priceLabel}로 차감하고 남은 금액을 환불합니다.',
  DEDUCTION_CAP: '차감액은 결제금액을 넘지 않습니다.',
  PRICE_LABEL_FALLBACK: '정상가 기준',
  FULL_POLICY_LINK: '환불 규정 전문 보기',
  FIRST_SENTENCES_LIMIT: 2,
});
