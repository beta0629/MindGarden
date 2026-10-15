/**
 * Ops 웹훅 시크릿 운영 화면 상수
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

export const OPS_WEBHOOK_SECRET_LABELS = {
  PAGE_TITLE: "웹훅 비밀값",
  PAGE_SUBTITLE:
    "센터 PG 설정의 포트원 웹훅 시크릿을 교체하고 테스트 모드를 전환합니다. 평문 시크릿은 화면에 다시 표시되지 않습니다.",
  SELECT_TENANT: "센터 선택",
  SELECT_CONFIG: "PG 설정 선택",
  OPTION_ALL: "전체",
  OPTION_SELECT: "선택",
  CONFIGURED: "설정됨",
  NOT_CONFIGURED: "미설정",
  SECRET_STATUS: "웹훅 시크릿",
  MASKED_HINT: "저장된 시크릿은 마스킹되며 복호화 값은 표시하지 않습니다.",
  NEW_SECRET: "새 웹훅 시크릿",
  NEW_SECRET_PLACEHOLDER: "교체할 시크릿을 입력하세요",
  SAVE_SECRET: "시크릿 저장",
  CONFIRM_SAVE_TITLE: "웹훅 시크릿 교체 확인",
  CONFIRM_SAVE_HINT: "기존 시크릿을 새 값으로 교체합니다. 평문은 저장 후 다시 볼 수 없습니다.",
  TEST_MODE: "테스트 모드",
  TEST_MODE_ON: "켜짐 (테스트 결제)",
  TEST_MODE_OFF: "꺼짐 (실결제)",
  TOGGLE_TEST_MODE: "테스트 모드 전환",
  CONFIRM_TEST_MODE_TITLE: "테스트 모드 변경 확인",
  CONFIRM_TEST_MODE_OFF_HINT:
    "실결제로 전환하려면 라이브 채널 키와 웹훅 시크릿이 필요합니다.",
  CONFIRM_TEST_MODE_ON_HINT: "테스트 모드로 되돌립니다.",
  LOADING: "불러오는 중…",
  EMPTY_TENANTS: "센터 목록이 없습니다.",
  EMPTY_CONFIGS: "선택한 센터의 PG 설정이 없습니다.",
  ERROR_LOAD: "목록을 불러오지 못했습니다.",
  ERROR_SAVE: "웹훅 시크릿을 저장하지 못했습니다.",
  SAVE_SUCCESS: "웹훅 시크릿이 저장되었습니다.",
  TEST_MODE_SUCCESS: "테스트 모드가 변경되었습니다.",
  CANCEL: "취소",
  REFRESH: "새로고침",
  STATUS: "상태",
  APPROVAL: "승인",
  PROVIDER: "PG",
  REAPPROVAL_BADGE: "재승인 대기"
} as const;

export const OPS_WEBHOOK_SECRET_TEST_IDS = {
  PAGE: "ops-webhook-secret-page",
  TENANT_SELECT: "ops-webhook-secret-tenant",
  CONFIG_SELECT: "ops-webhook-secret-config",
  SECRET_INPUT: "ops-webhook-secret-input",
  SAVE_BUTTON: "ops-webhook-secret-save",
  CONFIGURED_BADGE: "ops-webhook-secret-configured",
  TEST_MODE_TOGGLE: "ops-webhook-secret-test-mode"
} as const;
