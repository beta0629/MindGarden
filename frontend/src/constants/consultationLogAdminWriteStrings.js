/**
 * 상담일지 관리자 작성·수정 표시 — 사용자 표시 문구 SSOT.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */

export const CONSULTATION_LOG_ADMIN_WRITE_STRINGS = {
  BADGE_WRITTEN: '관리자 작성',
  BADGE_EDITED: '관리자 수정',
  /** "{role} · {time}" — 마지막 수정자 역할·시각 */
  META_SEPARATOR: ' · ',
  META_ARIA_PREFIX: '마지막 수정',
  ROLE_FALLBACK: '관리자'
};

/** 서버 역할 코드 → 표시 라벨 (관리자 계열만) */
export const CONSULTATION_LOG_ADMIN_ROLE_LABELS = {
  ADMIN: '관리자',
  STAFF: '사무원',
  SUPER_ADMIN: '최고 관리자',
  BRANCH_MANAGER: '지점 관리자',
  BRANCH_SUPER_ADMIN: '지점 최고 관리자'
};
