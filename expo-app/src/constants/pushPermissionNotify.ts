/**
 * 푸시 토큰 등록 실패 시 사용자 토스트 표시 여부.
 * 사용자가 조치 가능한 경우(실기기 OS 권한 거부)만 true.
 *
 * @author MindGarden
 * @since 2026-11-10
 */

/** registerToken 실패 reason — 실기기에서 OS 알림 권한이 거부된 경우 */
export const PUSH_REGISTER_FAILURE_PERMISSION_DENIED = 'notification_permission_denied';

/** 시뮬레이터·에뮬레이터 등 실기기가 아닌 환경 */
export const PUSH_REGISTER_FAILURE_NOT_A_DEVICE = 'not_a_device';

/**
 * claim-retry 경로에서 실패 토스트를 띄울지 여부.
 * 실기기에서만 의미 있는 `notification_permission_denied` 일 때만 true.
 *
 * @param reason registerToken 이 기록한 실패 reason
 * @returns 사용자에게 토스트를 보여줄지
 */
export function shouldNotifyUserForPushRegisterFailure(reason: string): boolean {
  return reason === PUSH_REGISTER_FAILURE_PERMISSION_DENIED;
}
