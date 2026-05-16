/**
 * 어드민 모바일 — 사용자 조회 화면 카피·역할 필터
 *
 * @author MindGarden
 * @since 2026-05-16
 */

/** API `role` 쿼리 — `ALL` 은 파라미터 생략 */
export type AdminUserManagementRoleFilter = 'ALL' | 'CLIENT' | 'CONSULTANT' | 'STAFF';

export const ADMIN_USER_MANAGEMENT_ROLE_FILTERS: readonly {
  readonly value: AdminUserManagementRoleFilter;
  readonly label: string;
}[] = [
  { value: 'ALL', label: '전체' },
  { value: 'CLIENT', label: '내담자' },
  { value: 'CONSULTANT', label: '상담사' },
  { value: 'STAFF', label: '스태프' },
] as const;

/** 백엔드 UserRole name → 표시명 (웹 STAFF_MGMT_ROLE_LABELS 정합) */
export const ADMIN_USER_MANAGEMENT_ROLE_LABELS: Record<string, string> = {
  ADMIN: '관리자',
  STAFF: '사무원',
  CONSULTANT: '상담사',
  CLIENT: '내담자',
  PLAY_THERAPIST: '놀이치료',
  SPEECH_THERAPIST: '언어치료',
};

export const ADMIN_USER_MANAGEMENT_COPY = {
  SEARCH_PLACEHOLDER: '이름, 이메일, 전화번호로 검색',
  EMPTY: '조건에 맞는 사용자가 없습니다.',
  ERROR: '사용자 목록을 불러오지 못했습니다. 권한·네트워크를 확인해 주세요.',
  ACCESS_DENIED: '사용자 조회는 관리자·사무원 계정에서만 이용할 수 있습니다.',
  STATUS_ACTIVE: '활성',
  STATUS_INACTIVE: '비활성',
  DETAIL_MODAL_TITLE: '사용자 정보',
  DETAIL_CLOSE: '닫기',
  DETAIL_LABEL_NAME: '이름',
  DETAIL_LABEL_EMAIL: '이메일',
  DETAIL_LABEL_PHONE: '전화번호',
  DETAIL_LABEL_ROLE: '역할',
  DETAIL_LABEL_STATUS: '상태',
  PHONE_NONE: '전화번호 없음',
} as const;
