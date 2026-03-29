/**
 * 어드민 온보딩 심사 화면용 상수
 * 하드코딩 지양을 위한 상수화
 * 
 * @author CoreSolution
 * @since 2026-03-29
 */

export const ONBOARDING_TEXT = {
  PAGE_TITLE: '온보딩 심사',
  LOADING: '데이터를 불러오는 중...',
  SECTION_BASIC_INFO: '기본 정보',
  LABEL_TENANT_NAME: '기관명',
  LABEL_CONTACT_PHONE: '연락처',
  LABEL_BUSINESS_TYPE: '업종',
  SECTION_ADMIN_INFO: '관리자 정보',
  LABEL_ADMIN_NAME: '관리자 이름',
  LABEL_ADMIN_EMAIL: '관리자 이메일',
  SECTION_FINAL_REVIEW: '최종 심사',
  DESC_FINAL_REVIEW: '입력된 모든 정보를 확인했습니다. 승인 또는 반려를 선택해주세요.',
} as const;

export const ONBOARDING_STEPS = [
  { id: 1, label: ONBOARDING_TEXT.SECTION_BASIC_INFO },
  { id: 2, label: ONBOARDING_TEXT.SECTION_ADMIN_INFO },
  { id: 3, label: ONBOARDING_TEXT.SECTION_FINAL_REVIEW }
] as const;

export const ONBOARDING_MOCK_DATA = {
  TENANT_NAME: '테스트 기관',
  CONTACT_PHONE: '010-1234-5678',
  BUSINESS_TYPE: '심리상담센터',
  ADMIN_NAME: '홍길동',
  ADMIN_EMAIL: 'admin@test.com',
  NOTE_APPROVE: '승인 처리',
} as const;

export const ONBOARDING_MESSAGES = {
  APPROVE_SUCCESS: '온보딩이 성공적으로 승인되었습니다.',
  REJECT_SUCCESS: '온보딩이 반려되었습니다.',
  ERROR_DECISION: '심사 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
  REJECT_REASON_REQUIRED: '반려 사유를 입력해주세요.',
  CONFIRM_APPROVE: '이 온보딩 요청을 승인하시겠습니까?',
  MODAL_REJECT_TITLE: '온보딩 반려',
  MODAL_REJECT_SUBTITLE: '반려 사유를 입력해주세요. 해당 사유는 요청자에게 전달될 수 있습니다.',
  MODAL_PLACEHOLDER_REASON: '반려 사유 상세 입력',
  BTN_PREV: '이전',
  BTN_NEXT: '다음',
  BTN_APPROVE: '승인',
  BTN_REJECT: '거절',
  BTN_CANCEL: '취소',
  BTN_CONFIRM: '확인',
} as const;

export const ONBOARDING_API_ENDPOINTS = {
  DECISION: (id: string) => `/api/v1/admin/onboarding/requests/${id}/decision`, // 또는 /ops/onboarding
} as const;
