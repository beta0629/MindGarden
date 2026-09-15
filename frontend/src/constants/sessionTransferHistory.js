/**
 * 회기 승계 이력 UI·API 상수.
 * 사용자 노출 라벨은 방향(OUTGOING/INCOMING)과 무관하게 전부 「승계」.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

export const SESSION_TRANSFER_DIRECTION = Object.freeze({
  OUTGOING: 'OUTGOING',
  INCOMING: 'INCOMING'
});

/** 표시용 동사 — INCOMING도 「승계」(레거시 「이관」 혼용 제거) */
export const SESSION_TRANSFER_VERB = Object.freeze({
  [SESSION_TRANSFER_DIRECTION.OUTGOING]: '승계',
  [SESSION_TRANSFER_DIRECTION.INCOMING]: '승계'
});

export const SESSION_TRANSFER_HISTORY_UI = Object.freeze({
  SECTION_TITLE: '회기 승계 이력',
  SECTION_SUBTITLE: '총·잔여 숫자는 바꾸지 않습니다. 회기가 어디로 이동했는지 표시합니다.',
  EMPTY_TITLE: '승계 이력이 없습니다.',
  EMPTY_DESCRIPTION: '이 내담자(매핑)에 기록된 회기 이동이 없습니다.',
  LOADING_TEXT: '승계 이력을 불러오는 중...',
  LOAD_FAILED: '승계 이력을 불러오지 못했습니다.',
  RETRY_LABEL: '다시 시도',
  SESSIONS_SUFFIX: '회',
  MAPPING_ARROW_FMT: '매핑 #{from} → #{to}',
  UNKNOWN_NAME: '알 수 없음',
  HEADLINE_FMT: '{from} → {to}: {count}회 {verb}',
  BADGE_OUTGOING: '승계',
  BADGE_INCOMING: '승계',
  /** API·구버전 응답에 남은 동사 — 화면에서는 승계로 정규화 */
  LEGACY_VERB_TRANSFER: '이관'
});
