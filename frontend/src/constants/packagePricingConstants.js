/**
 * 패키지 요금 관리 화면 상수
 * @author Core Solution
 * @since 2026-02-26
 */

export const CODE_GROUP_CONSULTATION_PACKAGE = 'CONSULTATION_PACKAGE';

export const API = {
  TENANT_CODES_LIST: '/api/v1/common-codes/tenant',
  TENANT_COMMON_CODES: '/api/v1/tenant/common-codes'
};

/** 패키지 코드 발급 방식 (신규 생성) */
export const CODE_ISSUE_MODE = {
  AUTO: 'AUTO',
  MANUAL: 'MANUAL'
};

export const LABELS = {
  PAGE_TITLE: '패키지 요금 관리',
  PAGE_SUBTITLE: '상담 패키지별 가격과 회기 수를 관리합니다',
  ADD_BUTTON: '새 패키지 추가',
  SECTION_LIST: '패키지 목록',
  COL_CODE: '패키지 코드',
  COL_NAME: '패키지명',
  COL_SESSIONS: '회기 수',
  COL_PRICE: '가격(원)',
  COL_REMARK: '비고',
  COL_ACTIVE: '사용 여부',
  COL_PUBLIC_VISIBLE: '공개 노출',
  COL_ACTIONS: '작업',
  EDIT: '수정',
  DEACTIVATE: '비활성화',
  ACTIVATE: '활성화',
  PUBLIC_HIDE: '비공개로',
  PUBLIC_SHOW: '공개로',
  MODAL_ADD_TITLE: '새 패키지 추가',
  MODAL_EDIT_TITLE: '패키지 수정',
  LABEL_CODE: '패키지 코드',
  LABEL_CODE_ISSUE: '코드 발급',
  CODE_ISSUE_AUTO: '자동',
  CODE_ISSUE_MANUAL: '수동',
  CODE_AUTO_HINT: '저장 시 자동 생성됩니다',
  CODE_MANUAL_PLACEHOLDER: '예: BASIC, SINGLE_80000',
  CODE_REQUIRED: '패키지 코드를 입력하세요.',
  LABEL_NAME: '패키지명(한글)',
  LABEL_SESSIONS: '회기 수',
  LABEL_PRICE: '가격(원)',
  LABEL_REMARK: '비고',
  LABEL_ACTIVE: '사용 여부',
  LABEL_PUBLIC_VISIBLE: '공개 노출 (홈·/legal/products)',
  SAVE: '저장',
  CANCEL: '취소',
  ACTIVE_YES: '사용',
  ACTIVE_NO: '미사용',
  PUBLIC_YES: '공개',
  PUBLIC_NO: '비공개',
  TOAST_ACTIVE_ON: '활성화되었습니다.',
  TOAST_ACTIVE_OFF: '비활성화되었습니다.',
  TOAST_PUBLIC_ON: '공개 노출로 설정되었습니다.',
  TOAST_PUBLIC_OFF: '비공개로 설정되었습니다.',
  TOAST_TOGGLE_FAIL: '상태 변경에 실패했습니다.',
  LIST_BACK: '목록으로',
  NEW_PAGE_TITLE: '새 패키지 등록',
  DETAIL_PAGE_TITLE: '패키지 요금 상세'
};
