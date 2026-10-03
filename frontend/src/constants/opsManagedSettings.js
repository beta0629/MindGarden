/**
 * 운영자(플랫폼) 전용 설정 — 테넌트 관리자 화면에서는 상태만 보여 준다.
 *
 * 서버 SSOT: `SystemConfigAccessPolicy.OPS_ONLY_WRITE_KEYS`,
 * `AdminNotificationSchedulerController` (전역 스케줄러 PUT 403),
 * `AdminSmsTemplateController.updateGlobalDispatchFlag` (전역 SMS PATCH 403).
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

/** 읽기 전용 스위치 아래 안내 문구 */
export const OPS_MANAGED_SETTING_CAPTION = '운영자가 관리하는 설정이에요. 이 화면에서는 상태만 볼 수 있어요.';

/** AI 프로바이더 화면 안내 문구 */
export const OPS_MANAGED_AI_PROVIDER_NOTICE =
  'AI 프로바이더 선택·API 키·URL·모델은 운영자가 관리해요. 이 화면에서는 설정 상태와 사용량만 볼 수 있어요.';

/** 읽기 전용 스위치 행 data-testid 접미사 */
export const OPS_MANAGED_TEST_ID_SUFFIX = 'ops-managed';
