/**
 * 일정 배정 변경(회기 정정) UI·API 상수.
 *
 * N(총 회기) 상한은 하드코딩하지 않는다. 격자 열 수·창 크기만 표시 규칙이다.
 *
 * @author MindGarden
 * @since 2026-11-26
 */

/** 회기 칸 표시: 한 줄·격자 열 수 (N 상한 아님) */
export const SESSION_CELL_GRID_COLUMNS = 10;

/** N>20 일 때 보이는 창 칸 수 (N 상한 아님) */
export const SESSION_CELL_WINDOW_SIZE = 10;

/** 사유 직접입력 최대 글자 */
export const REASSIGN_REASON_MAX_LENGTH = 200;

/** 사유 칩 value → 확정 시 reason 문자열 */
export const REASSIGN_REASON_CHIP_CUSTOM = 'CUSTOM';

export const REASSIGN_REASON_CHIPS = Object.freeze([
  {
    value: 'WRONG_PRE_PAYMENT',
    label: '결제 전 배정에 잘못 연결됨'
  },
  {
    value: 'WRONG_PACKAGE',
    label: '다른 상품으로 잘못 연결됨'
  },
  {
    value: 'CLIENT_REQUEST',
    label: '내담자 요청'
  },
  {
    value: REASSIGN_REASON_CHIP_CUSTOM,
    label: '직접 입력'
  }
]);

export const REASSIGN_STEPS = Object.freeze({
  SELECT: 1,
  PREVIEW: 2,
  REASON: 3
});

export const REASSIGN_UI = Object.freeze({
  CTA: '배정 변경',
  TITLE: '배정 변경',
  SUBTITLE: '회기 정정',
  CLOSE: '닫기',
  NEXT: '다음',
  PREV: '이전',
  CONFIRM: '배정 변경',
  STEP_SELECT: '옮길 배정',
  STEP_PREVIEW: '바뀌는 회기',
  STEP_REASON: '사유',
  CURRENT_BADGE: '현재',
  DISCLAIMER: '결제 금액과 장부는 바뀌지 않습니다.',
  SUCCESS_TOAST: '배정을 바꿨습니다',
  LOAD_CANDIDATES_FAILED: '옮길 수 있는 배정을 불러오지 못했습니다.',
  LOAD_PREVIEW_FAILED: '회기 미리보기를 불러오지 못했습니다.',
  EXECUTE_FAILED: '배정 변경에 실패했습니다.',
  REASON_REQUIRED: '사유를 선택하거나 입력해 주세요.',
  REASON_TOO_LONG: '사유는 200자까지 입력할 수 있습니다.',
  REASON_PLACEHOLDER: '사유를 입력해 주세요',
  EMPTY_CANDIDATES: '옮길 수 있는 다른 배정이 없습니다.',
  SELECT_REQUIRED: '옮길 배정을 선택해 주세요.',
  CANCEL_RECOMMENDED_LEAD: '원 배정이 결제 대기로 비었습니다. 필요 없으면 배정 관리에서 정리해 주세요.',
  CANCEL_RECOMMENDED_LINK: '배정 관리로 이동',
  HISTORY_TITLE: '배정 변경 기록',
  HISTORY_EMPTY: '이 세션에서 변경한 기록이 없습니다.',
  HISTORY_HINT: '서버 이력 API가 없어 이 화면을 연 동안의 성공 기록만 표시합니다.',
  ORIGIN_LABEL: '현재 배정',
  TARGET_LABEL: '옮길 배정',
  SESSIONS_SUMMARY: '사용 {{used}} / 총 {{total}} · 잔여 {{remaining}}',
  PLANNED_SEQUENCE: '예정 회차 {{sequence}}회기',
  PREFIX_SUMMARY: '앞 {{count}}회',
  SUFFIX_SUMMARY: '뒤 {{count}}회',
  BLOCKED_SECTION: '고를 수 없는 배정',
  ELIGIBLE_SECTION: '옮길 수 있는 배정'
});

export const SESSION_CELL_STATE = Object.freeze({
  USED: 'used',
  REMAINING: 'remaining',
  PLANNED: 'planned',
  RESTORED: 'restored'
});
