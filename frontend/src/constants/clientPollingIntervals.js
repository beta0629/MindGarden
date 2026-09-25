/**
 * 웹 클라이언트의 세션 확인·읽지 않은 알림 폴링 간격.
 * 호출 주기를 바꿀 때는 이 파일만 수정한다.
 *
 * @author MindGarden
 * @since 2026-09-25
 */

/** SessionContext·sessionManager 의 silent 세션 확인 간격. */
export const SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000;

/** NotificationContext 의 읽지 않은 메시지·알림 폴링 간격. */
export const UNREAD_POLLING_INTERVAL_MS = 10000;
