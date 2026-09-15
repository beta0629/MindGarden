/**
 * 타기관 연계 어드민 화면 상수. 회기 잔여·바우처 라벨 없음.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

export const INSTITUTION_LINK_PAGE_TITLE_ID = 'institution-link-admin-title';

export const INSTITUTION_LINK_LABELS = Object.freeze({
  PAGE_TITLE: '타기관 연계',
  PAGE_SUBTITLE: '연계 기관 정보와 월결제·초기 선납으로 등록합니다. 회기 잔여·바우처와 섞이지 않습니다.',
  INSTITUTION_SECTION: '연계 기관',
  INSTITUTION_SECTION_SUB: '월말 상담내역 문서 수신처',
  ENROLL_SECTION: '타기관 연계 등록',
  ENROLL_SECTION_SUB: '내담자 · 기관 · 월결제 · 초기 선납',
  ADD_INSTITUTION: '기관 등록',
  EDIT_INSTITUTION: '기관 수정',
  ADD_ENROLLMENT: '연계 등록',
  SAVE: '저장',
  CANCEL: '취소',
  NAME: '기관명',
  CONTACT_NAME: '담당자',
  CONTACT_PHONE: '연락처',
  DOCUMENT_EMAIL: '월말 문서 수신 이메일',
  NOTES: '메모',
  CLIENT: '내담자',
  INSTITUTION: '연계 기관',
  MONTHLY_AMOUNT: '월결제 금액(원)',
  PREPAID_AMOUNT: '초기 선납 금액(원)',
  PERIOD_START: '월결제 시작일',
  EMPTY_INSTITUTION: '등록된 연계 기관이 없습니다.',
  EMPTY_ENROLLMENT: '등록된 타기관 연계가 없습니다.',
  SELECT_CLIENT: '내담자를 선택하세요',
  SELECT_INSTITUTION: '기관을 선택하세요',
  REQUIRED: '필수 항목을 입력하세요.',
  LOAD_FAIL: '목록을 불러오지 못했습니다.',
  SAVE_OK: '저장했습니다.',
  SAVE_FAIL: '저장에 실패했습니다.',
  COL_NAME: '기관명',
  COL_CONTACT: '담당자',
  COL_EMAIL: '문서 수신',
  COL_CLIENT: '내담자',
  COL_MONTHLY: '월결제',
  COL_PREPAID: '초기 선납',
  COL_DOCUMENT: '문서 수신처'
});

export const INSTITUTION_LINK_CSS = Object.freeze({
  PAGE: 'mg-v2-ad-b0kla institution-link-admin',
  CONTAINER: 'mg-v2-ad-b0kla__container',
  SECTIONS: 'institution-link-admin__sections',
  FORM: 'institution-link-admin__form',
  FORM_FIELD: 'institution-link-admin__field',
  ACTIONS: 'institution-link-admin__actions',
  REQUIRED: 'form-input-required'
});
