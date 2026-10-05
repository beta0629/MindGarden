/**
 * Ops Shell paths kept for existing screens.
 * Rail labels and order live in opsNav.ts.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import { OPS_NAV_PATH } from './opsNav';

export const OPS_SHELL_BRAND = 'Ops' as const;

export const OPS_SHELL_PRODUCT_COPY = 'ops · 테넌트 격리' as const;

export const OPS_SHELL_PATHS = {
  OVERVIEW: OPS_NAV_PATH.OVERVIEW,
  PG_APPROVAL: OPS_NAV_PATH.PG_APPROVAL,
  TENANTS: OPS_NAV_PATH.TENANT_LIST,
  LOGIN: '/auth/login'
} as const;

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
