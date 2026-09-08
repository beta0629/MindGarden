/**
 * Ops 테넌트 본문 — 라벨·strip·status 한국어 SSOT
 * Visual: docs/design-system/OPS_TENANTS_CORE_CLINIC_OS_HANDOFF.md
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

export const OPS_TENANT_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED'
} as const;

export type OpsTenantStatus =
  (typeof OPS_TENANT_STATUS)[keyof typeof OPS_TENANT_STATUS];

export const OPS_TENANT_STATUS_LABELS: Record<string, string> = {
  [OPS_TENANT_STATUS.PENDING]: '승인 대기',
  [OPS_TENANT_STATUS.ACTIVE]: '운영중',
  [OPS_TENANT_STATUS.SUSPENDED]: '정지',
  [OPS_TENANT_STATUS.CLOSED]: '종료'
} as const;

export const OPS_TENANT_STRIP_FILTER = {
  ALL: 'ALL',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED'
} as const;

export type OpsTenantStripFilter =
  (typeof OPS_TENANT_STRIP_FILTER)[keyof typeof OPS_TENANT_STRIP_FILTER];

export const OPS_TENANT_LABELS = {
  TITLE: '테넌트',
  TITLE_ID: 'ops-tenants-title',
  TOPBAR_PRODUCT: 'ops · 테넌트 격리',
  REFRESH: '새로고침',
  STRIP_ARIA: '테넌트 요약',
  STRIP_ALL: '전체',
  STRIP_ACTIVE: '운영중',
  STRIP_SUSPENDED: '정지',
  SEARCH_PLACEHOLDER: '센터명 또는 서브도메인 검색',
  SEARCH_ARIA: '센터 검색',
  ISOLATION_BADGE: '격리',
  ENTER_CENTER: '센터 들어가기',
  MENU_ARIA: '센터 추가 작업',
  MENU_DETAIL: '상세',
  MENU_SUSPEND: '정지',
  MENU_RESUME: '재개',
  MENU_PG_VIEW: '결제 연결 보기',
  DETAIL_TITLE: '센터 상세',
  DETAIL_CLOSE: '닫기',
  DETAIL_NAME: '센터명',
  DETAIL_STATUS: '상태',
  DETAIL_SUBDOMAIN: '서브도메인',
  DETAIL_CONTACT: '담당자',
  DETAIL_EMAIL: '이메일',
  DETAIL_PHONE: '전화',
  DETAIL_BUSINESS: '업종',
  CONFIRM_SUSPEND_TITLE: '센터 정지',
  CONFIRM_SUSPEND_MESSAGE: '이 센터를 정지할까요? 운영 서비스가 제한될 수 있습니다.',
  CONFIRM_SUSPEND_OK: '정지',
  CONFIRM_RESUME_TITLE: '센터 재개',
  CONFIRM_RESUME_MESSAGE: '이 센터를 다시 운영중으로 전환할까요?',
  CONFIRM_RESUME_OK: '재개',
  CONFIRM_CANCEL: '취소',
  EMPTY_ALL: '등록된 센터가 없습니다.',
  EMPTY_FILTER: '조건에 맞는 센터가 없습니다.',
  RESET_FILTER: '필터 초기화',
  LOADING: '불러오는 중…',
  ERROR_LOAD: '테넌트 목록을 불러오지 못했습니다.',
  RETRY: '다시 시도',
  ENTER_NO_SUBDOMAIN: '서브도메인이 없어 센터로 이동할 수 없습니다.',
  SUSPEND_SUCCESS: '센터를 정지했습니다.',
  RESUME_SUCCESS: '센터를 재개했습니다.',
  COUNT_PLACEHOLDER: '—'
} as const;

export const OPS_TENANT_CSS = {
  PAGE: 'ops-tenants',
  STRIP: 'ops-tenants-summary',
  STRIP_CELL: 'ops-tenants-summary__cell',
  STRIP_CELL_ACTIVE: 'ops-tenants-summary__cell--active',
  STRIP_LABEL: 'ops-tenants-summary__label',
  STRIP_VALUE: 'ops-tenants-summary__value',
  TOOLBAR: 'ops-tenants__toolbar',
  SEARCH: 'ops-tenants__search',
  STAGE: 'ops-tenants__stage',
  GRID: 'ops-tenants__grid',
  CARD: 'ops-tenants-card',
  CARD_HEADER: 'ops-tenants-card__header',
  CARD_TITLE: 'ops-tenants-card__title',
  CARD_BADGES: 'ops-tenants-card__badges',
  STATUS_BADGE: 'ops-tenants-card__status',
  STATUS_ACTIVE: 'ops-tenants-card__status--active',
  STATUS_SUSPENDED: 'ops-tenants-card__status--suspended',
  STATUS_PENDING: 'ops-tenants-card__status--pending',
  STATUS_CLOSED: 'ops-tenants-card__status--closed',
  ISOLATION: 'ops-tenants-card__isolation',
  SUBDOMAIN: 'ops-tenants-card__subdomain',
  ACTIONS: 'ops-tenants-card__actions',
  CTA: 'ops-tenants-card__cta',
  OVERFLOW: 'ops-tenants-overflow',
  OVERFLOW_TRIGGER: 'ops-tenants-overflow__trigger',
  OVERFLOW_MENU: 'ops-tenants-overflow__menu',
  OVERFLOW_ITEM: 'ops-tenants-overflow__item',
  EMPTY: 'ops-tenants__empty',
  DETAIL_DL: 'ops-tenants-detail'
} as const;

/**
 * PG 승인 화면으로 이동하는 경로 (센터 ID 필터 쿼리).
 */
export function buildPgApprovalHref(tenantId: string | null | undefined): string {
  const id = typeof tenantId === 'string' ? tenantId.trim() : '';
  if (!id) {
    return '/pg-approval';
  }
  return `/pg-approval?centerId=${encodeURIComponent(id)}`;
}

/**
 * 센터 앱 새 탭 URL. subdomain 없으면 null.
 */
export function buildCenterEnterUrl(subdomain: string | null | undefined): string | null {
  const sub = typeof subdomain === 'string' ? subdomain.trim().toLowerCase() : '';
  if (!sub) {
    return null;
  }

  const origin = process.env.NEXT_PUBLIC_CENTER_APP_ORIGIN?.trim();
  const base = process.env.NEXT_PUBLIC_TENANT_APP_BASE?.trim();

  if (base && base.includes('{subdomain}')) {
    return base.split('{subdomain}').join(sub);
  }

  const parentHost = resolveParentHost(origin || base);
  if (parentHost) {
    const protocol = resolveProtocol(origin || base);
    return `${protocol}//${sub}.${parentHost}`;
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length >= 2) {
      const parent = parts.slice(1).join('.');
      return `${window.location.protocol}//${sub}.${parent}`;
    }
  }

  return null;
}

function resolveParentHost(raw: string | undefined): string | null {
  if (!raw) {
    return null;
  }
  try {
    const withProto = raw.includes('://') ? raw : `https://${raw}`;
    return new URL(withProto).host;
  } catch {
    return raw.replace(/^https?:\/\//, '').split('/')[0] || null;
  }
}

function resolveProtocol(raw: string | undefined): string {
  if (!raw) {
    return 'https:';
  }
  try {
    const withProto = raw.includes('://') ? raw : `https://${raw}`;
    return new URL(withProto).protocol;
  } catch {
    return 'https:';
  }
}

export function toDisplayString(value: unknown, fallback = ''): string {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
}
