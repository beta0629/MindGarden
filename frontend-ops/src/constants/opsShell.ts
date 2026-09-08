/**
 * Ops Shell Phase 1 — LNB IA · quiet chrome labels (과밀 금지: 3항만)
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

export const OPS_SHELL_BRAND = 'Trinity Ops' as const;

export const OPS_SHELL_LNB_LABELS = {
  OVERVIEW: '현황',
  PG_APPROVAL: 'PG 승인',
  TENANTS: '테넌트'
} as const;

export const OPS_SHELL_PATHS = {
  OVERVIEW: '/dashboard',
  PG_APPROVAL: '/pg-approval',
  TENANTS: '/tenants',
  LOGIN: '/auth/login'
} as const;

/** Phase 1 primary LNB — keep IA to three items only */
export const OPS_SHELL_LNB_ITEMS = [
  {
    href: OPS_SHELL_PATHS.OVERVIEW,
    label: OPS_SHELL_LNB_LABELS.OVERVIEW
  },
  {
    href: OPS_SHELL_PATHS.PG_APPROVAL,
    label: OPS_SHELL_LNB_LABELS.PG_APPROVAL
  },
  {
    href: OPS_SHELL_PATHS.TENANTS,
    label: OPS_SHELL_LNB_LABELS.TENANTS
  }
] as const;

export const OPS_OVERVIEW_COPY = {
  TITLE: '현황',
  TITLE_ID: 'ops-overview-title',
  PENDING_CAPTION: '승인 대기',
  LOADING: '불러오는 중…',
  ERROR: '현황을 불러오지 못했습니다.',
  REFRESH: '새로고침'
} as const;

export const OPS_PUBLIC_PATH_PREFIXES = [
  '/auth/login',
  '/api/auth/login',
  '/api/auth/logout'
] as const;
