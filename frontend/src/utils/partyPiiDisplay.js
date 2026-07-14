/**
 * 연락처·이메일 표시 보조 (FE 전용 마스킹).
 * - 통합 사용자 관리 목록: maskPhoneDisplay / maskEmailDisplay 항상 적용.
 * - 일정 요약 모달: applyPartyPiiPolicy (STAFF 마스킹, ADMIN 전체).
 * - DB email/phone 은 로그인 SSOT — 절대 DB에서 * 로 치환하지 않는다.
 */

import { USER_ROLES } from '../constants/roles';

/**
 * @param {string} phone
 * @returns {string}
 */
export function maskPhoneDisplay(phone) {
  if (phone == null || String(phone).trim() === '') return phone;
  const s = String(phone).trim();
  // 이미 개발 익명화·부분 마스킹된 값 (010****NNNN)
  if (s.includes('****')) {
    const digits = s.replace(/\D/g, '');
    if (digits.length >= 7) {
      return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
    }
    return s;
  }
  const digits = s.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
  }
  if (s.length <= 4) return '****';
  return `${s.slice(0, 2)}***${s.slice(-2)}`;
}

/**
 * @param {string} email
 * @returns {string}
 */
export function maskEmailDisplay(email) {
  if (email == null || String(email).trim() === '') return email;
  const s = String(email).trim();
  // 이미 개발 익명화 형태 (abNNNN***@***.com)
  if (s.includes('***@')) {
    return s;
  }
  const at = s.indexOf('@');
  if (at <= 0) return '***';
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  if (!domain) return '***';
  if (local.length <= 1) return `*@${domain}`;
  return `${local[0]}***@${domain}`;
}

/**
 * @param {unknown} value
 * @param {'phone'|'email'} kind
 * @param {object|null|undefined} user
 * @returns {unknown}
 */
export function applyPartyPiiPolicy(value, kind, user) {
  if (value == null || value === '') return value;
  if (user?.role === USER_ROLES.ADMIN) return value;
  if (user?.role === USER_ROLES.STAFF) {
    return kind === 'phone' ? maskPhoneDisplay(String(value)) : maskEmailDisplay(String(value));
  }
  return value;
}
