/**
 * 공통 토스트 알림 시간 SSOT
 *
 * notificationManager / UnifiedNotification / ToastContext 가 모두 이 값을 쓴다.
 * 호출부에서 duration 을 생략하면 타입별 기본값 + 긴 문구 가산이 적용된다.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

export const NOTIFICATION_DURATION = Object.freeze({
  BY_TYPE: Object.freeze({
    error: 5000,
    warning: 4000,
    info: 4000,
    success: 3000
  }),
  FALLBACK_TYPE: 'info',
  LONG_TEXT_THRESHOLD_CHARS: 40,
  LONG_TEXT_STEP_CHARS: 20,
  LONG_TEXT_STEP_MS: 1000,
  MAX_MS: 8000
});

/** 같은 메시지+타입이 이 시간 안에 다시 오면 하나로 합친다 */
export const NOTIFICATION_DEDUPE_WINDOW_MS = 1000;
