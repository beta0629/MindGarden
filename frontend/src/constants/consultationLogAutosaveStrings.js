/**
 * 상담일지 초안 자동저장 — 사용자 표시 문구 SSOT.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */

export const CONSULTATION_LOG_AUTOSAVE_STRINGS = {
  RESTORE_TITLE: '임시저장 불러오기',
  RESTORE_MESSAGE: '임시저장된 내용이 있어요. 불러올까요?',
  /** 시각 포함 안내 — {time} 치환 (KST) */
  RESTORE_MESSAGE_WITH_TIME: '임시저장된 내용이 있어요({time}). 불러올까요?',
  RESTORE_CONFIRM: '불러오기',
  RESTORE_DISCARD: '버리기',
  CLOSE_UNSAVED_TITLE: '작성 중인 내용',
  CLOSE_UNSAVED_MESSAGE:
    '저장하지 않은 변경이 있습니다. 창을 닫을까요? 작성 중 내용은 서버 임시저장에 남습니다.',
  CLOSE_UNSAVED_CONFIRM: '닫기',
  CLOSE_UNSAVED_CANCEL: '계속 작성',
  STATUS_FINAL_SAVING: '저장 중…',
  /** 자동저장 진행 */
  STATUS_DRAFT_SAVING: '저장 중…',
  /** "2:03 임시저장됨" — {time} 치환 (KST) */
  STATUS_DRAFT_SAVED_WITH_TIME: '{time} 임시저장됨',
  STATUS_DRAFT_RETRYING: '저장 실패(재시도 중)',
  STATUS_DRAFT_FAILED: '저장 실패 — 입력은 이 브라우저에 안전하게 보관됩니다',
  /** 브라우저 백업까지 실패(IndexedDB 불가 등) — '보관' 이라고 말하지 않는다 */
  STATUS_DRAFT_FAILED_NOT_KEPT: '저장 실패 — 브라우저에도 보관하지 못했습니다. 창을 닫지 말고 내용을 복사해 두세요',
  STATUS_DRAFT_UNAVAILABLE: '임시저장을 사용할 수 없습니다(일정·테넌트 정보 없음)',
  CONFLICT_TITLE: '다른 곳에서 편집 중',
  CONFLICT_MESSAGE:
    '같은 상담일지를 다른 탭 또는 다른 기기에서 저장했습니다. 어느 쪽을 쓸지 선택해 주세요.',
  CONFLICT_KEEP_MINE: '내 것 유지',
  CONFLICT_LOAD_LATEST: '최신 불러오기',
  LEAVE_TITLE: '작성 중인 내용',
  LEAVE_MESSAGE: '저장하지 않은 변경이 있습니다. 이 화면을 떠날까요?',
  LEAVE_CONFIRM: '떠나기',
  LEAVE_CANCEL: '계속 작성',
  FORM_LOADING: '상담일지를 불러오는 중…',
  /** 작성 중 내용 위에 임시저장을 덮어쓸 때 한 번 더 확인 */
  RESTORE_OVERWRITE_TITLE: '작성 중인 내용 덮어쓰기',
  RESTORE_OVERWRITE_MESSAGE:
    '지금 화면에 입력된 내용이 임시저장 내용으로 바뀝니다. 불러올까요?',
  RESTORE_OVERWRITE_CONFIRM: '덮어쓰고 불러오기',
  RESTORE_OVERWRITE_CANCEL: '취소'
};

/**
 * {time} 자리에 KST 시각 라벨을 넣는다.
 *
 * @param {string} template 문구 템플릿
 * @param {string} time 시각 라벨
 * @returns {string}
 */
export const formatConsultationLogAutosaveString = (template, time) =>
  String(template ?? '').replace('{time}', String(time ?? ''));

/**
 * 상담일지 회기(sessionNumber) 표시·검증 문구 — 가짜 1회기 폴백 금지.
 */
export const CONSULTATION_LOG_SESSION_NUMBER_STRINGS = {
  UNSET_CHIP_LABEL: '회기 없음',
  UNSET_CHIP_TITLE: '가예약 회차 미부여',
  ASSIGNED_CHIP_TITLE: '회기 번호(시스템 부여)',
  REQUIRED_FOR_COMPLETE:
    '일정 회기(sessionNumber)가 없어 완료할 수 없습니다. 일정을 다시 불러온 뒤 시도해 주세요.',
  REQUIRED_FOR_SAVE: '회기수(sessionNumber)는 필수입니다.',
  REQUIRED_FIELD_LABEL: '회기'
};
