/**
 * 상담 메시지 목록 API 경로 (역할·테넌트 스코프 정합).
 * 관리자 계열은 /all (MESSAGE_MANAGE), 그 외는 상담사/내담자별 엔드포인트.
 *
 * @param {{ id?: number|string, role?: string }|null|undefined} user
 * @returns {string|null} 쿼리스트링 없는 경로
 */
export function getConsultationMessagesListPath(user) {
  if (user == null || user.id == null || user.id === '') {
    return null;
  }
  const role = String(user.role || '');
  if (role === 'CONSULTANT' || role === 'ROLE_CONSULTANT') {
    return `/api/v1/consultation-messages/consultant/${user.id}`;
  }
  if (role === 'CLIENT' || role === 'ROLE_CLIENT') {
    return `/api/v1/consultation-messages/client/${user.id}`;
  }
  if (role === 'ADMIN' || role.includes('ADMIN')) {
    return '/api/v1/consultation-messages/all';
  }
  return `/api/v1/consultation-messages/client/${user.id}`;
}
