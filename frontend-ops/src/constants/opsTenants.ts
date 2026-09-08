/**
 * Ops 테넌트 Phase 1 — empty/coming slot 라벨·CSS SSOT
 * Visual: docs/design-system/OPS_TENANTS_CORE_CLINIC_OS_HANDOFF.md
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

export const OPS_TENANT_LABELS = {
  TITLE: '테넌트',
  TITLE_ID: 'ops-tenants-title',
  TOPBAR_PRODUCT: 'ops · 테넌트 격리',
  EMPTY_TITLE: '테넌트 관리를 준비 중입니다',
  EMPTY_DESCRIPTION: '센터 목록과 운영 도구는 이후 단계에서 제공됩니다.'
} as const;

export const OPS_TENANT_CSS = {
  PAGE: 'ops-tenants',
  STAGE: 'ops-tenants__stage',
  EMPTY: 'ops-tenants__empty',
  EMPTY_TITLE: 'ops-tenants__empty-title',
  EMPTY_DESC: 'ops-tenants__empty-desc'
} as const;
