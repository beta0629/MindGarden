/**
 * PG 승인 관련 상수·라벨 (사용자 카피 「센터」 사용)
 *
 * @author CoreSolution
 * @since 2026-09-07
 */

export const PG_APPROVAL_LABELS = {
  PAGE_TITLE: "PG 승인",
  PAGE_SUBTITLE: "센터가 등록한 PG 설정을 검토하고 승인/거부합니다.",
  EMPTY: "승인 대기 중인 PG 설정이 없습니다.",
  CENTER_ID: "센터 ID",
  CENTER_ID_FILTER: "센터 ID 필터",
  PROVIDER: "PG 제공자",
  PG_NAME: "PG사명",
  STATUS: "상태",
  APPROVAL_STATUS: "승인 상태",
  ACTIONS: "작업",
  APPROVE: "승인",
  REJECT: "거부",
  TEST_CONNECTION: "연결 테스트",
  APPROVE_TITLE: "PG 설정 승인",
  REJECT_TITLE: "PG 설정 거부",
  APPROVAL_NOTE: "승인 메모",
  REJECTION_REASON: "거부 사유",
  REJECTION_REASON_REQUIRED: "거부 사유는 필수입니다 (최소 10자).",
  REJECTION_HINT: "거부 사유는 센터에게 전달됩니다.",
  TEST_BEFORE_APPROVE: "승인 전 연결 테스트",
  LOADING: "데이터를 불러오는 중입니다...",
  ERROR_LOAD: "승인 대기 목록을 불러오지 못했습니다.",
  APPROVE_SUCCESS: "PG 설정이 승인되었습니다.",
  REJECT_SUCCESS: "PG 설정이 거부되었습니다. 센터에게 알림이 전송됩니다.",
  TEST_SUCCESS: "연결 테스트 성공",
  TEST_FAILED: "연결 테스트 실패",
  SEARCH_PLACEHOLDER: "PG사명, 제공자, 센터 ID로 검색...",
  REFRESH: "새로고침",
  CANCEL: "취소",
  SUBMIT_APPROVE: "승인하기",
  SUBMIT_REJECT: "거부하기"
} as const;

export const PG_APPROVAL_MIN_REJECTION_REASON_LENGTH = 10;
