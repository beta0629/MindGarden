/**
 * EmptyInvite — CTA 라벨·라우트 pure helpers
 * 회기0: 「회기 고르기」「결제하기」만 · 「예약하기」/직접예약 금지.
 *
 * @author MindGarden
 * @since 2026-10-28
 */
import { CLIENT_HOME_ROUTES } from '@/constants/clientHomeCopy';

export const EMPTY_INVITE_COPY = {
  TITLE: '회기를 확인해 주세요',
  DATETIME: '남은 회기 0',
  META: '센터에서 일정을 잡아 드립니다. 먼저 회기를 고르거나 결제를 이어서 진행해 주세요.',
  PRIMARY_CTA: '회기 고르기',
  GHOST_CTA: '결제하기',
} as const;

/** 두 CTA 모두 회기·결제 입구 — 예약 생성 라우트 금지 */
export const EMPTY_INVITE_ROUTES = {
  PRIMARY: CLIENT_HOME_ROUTES.SESSIONS_PAYMENT,
  GHOST: CLIENT_HOME_ROUTES.SESSIONS_PAYMENT,
} as const;

/** 회귀 방지: EmptyInvite CTA에 「예약하기」 문자열이 없어야 함 */
export function emptyInviteHasBookingCta(labels: readonly string[]): boolean {
  return labels.some((label) => label.includes('예약하기'));
}
