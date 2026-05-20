/**
 * 상담 메시지 목록 API 경로 (역할·테넌트 스코프 정합).
 * 관리자 계열은 /all (MESSAGE_MANAGE), 그 외는 상담사/내담자별 엔드포인트.
 *
 * @param {{ id?: number|string, role?: string }|null|undefined} user
 * @returns {string|null} 쿼리스트링 없는 경로
 */
import { USER_ROLES, LEGACY_USER_ROLES } from '../constants/roles';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_CONSULTATION_MESSAGES_ALL = '/api/v1/consultation-messages/all';


export function getConsultationMessagesListPath(user) {
  if (user == null || user.id == null || user.id === '') {
    return null;
  }
  const role = String(user.role || '');
  if (role === USER_ROLES.CONSULTANT || role === LEGACY_USER_ROLES.ROLE_CONSULTANT) {
    return `/api/v1/consultation-messages/consultant/${user.id}`;
  }
  if (role === USER_ROLES.CLIENT || role === LEGACY_USER_ROLES.ROLE_CLIENT) {
    return `/api/v1/consultation-messages/client/${user.id}`;
  }
  if (role === USER_ROLES.ADMIN || role.includes(USER_ROLES.ADMIN)) {
    return API_CONSULTATION_MESSAGES_ALL;
  }
  return `/api/v1/consultation-messages/client/${user.id}`;
}
