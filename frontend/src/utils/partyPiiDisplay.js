/**
 * 일정 상세 — 내담자/상담사 요약 모달 연락처·이메일 표시 보조
 * STAFF는 마스킹, ADMIN은 전체 표시(백엔드에서 이미 복호화된 값 전제).
 */

import { USER_ROLES } from '../constants/roles';

/**
 * @param {string} phone
 * @returns {string}
 */
export function maskPhoneDisplay(phone) {
  if (phone == null || String(phone).trim() === '') return phone;
  const s = String(phone).trim();
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
