/**
 * 상담일지 로컬 초안 자동저장(Phase 1) — 사용자 표시 문구.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */

export const CONSULTATION_LOG_AUTOSAVE_STRINGS = {
  RESTORE_TITLE: '초안 복구',
  RESTORE_MESSAGE: '미완성 초안이 있습니다. 불러올까요?',
  CLOSE_UNSAVED_TITLE: '작성 중인 내용',
  CLOSE_UNSAVED_MESSAGE:
    '저장하지 않은 변경이 있습니다. 창을 닫을까요? 초안은 이 브라우저에 잠시 저장됩니다.',
  STATUS_FINAL_SAVING: '저장 중…',
  STATUS_LOCAL_SAVING: '초안 저장 중…',
  STATUS_LOCAL_SAVED_PREFIX: '초안 저장됨',
  STATUS_LOCAL_FAILED:
    '초안 저장 실패 — 입력을 계속하면 자동으로 다시 시도합니다',
  STATUS_LOCAL_UNAVAILABLE: '초안 저장을 사용할 수 없습니다(테넌트 정보 없음)',
  /** 서버 동기화 실패 시 본문·스택 미노출, 로컬 초안 유지 안내(스펙 §9) */
  STATUS_SERVER_DRAFT_FAILED: '서버 초안 동기화 실패 — 이 기기 초안은 유지됩니다'
};
