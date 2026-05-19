-- =============================================================================
-- Shop·Reward P0 — ACTIVE 상담 계열 테넌트 tenant_components 백필 (멱등)
-- SSOT: 배포 후 Flyway 자동 적용. 단일 테넌트 응급은 scripts/ops/…
-- 전제: V20260519_003 component_catalog 3종 시드
-- =============================================================================

INSERT INTO tenant_components (
    tenant_component_id,
    tenant_id,
    component_id,
    status,
    activated_at,
    activated_by,
    is_deleted,
    created_by,
    updated_by
)
SELECT
    UUID(),
    t.tenant_id,
    cc.component_id,
    'ACTIVE',
    CURRENT_TIMESTAMP,
    'flyway-backfill',
    FALSE,
    'flyway-backfill',
    'flyway-backfill'
FROM tenants t
INNER JOIN component_catalog cc
    ON cc.component_code IN ('CLIENT_SHOP', 'CLIENT_REWARD', 'ADMIN_SHOP_CATALOG')
   AND cc.is_deleted = FALSE
   AND cc.is_active = TRUE
WHERE t.status = 'ACTIVE'
  AND (t.is_deleted = 0 OR t.is_deleted IS NULL OR t.is_deleted = FALSE)
  AND t.business_type IN ('CONSULTATION', 'COUNSELING')
  AND NOT EXISTS (
      SELECT 1
      FROM tenant_components tc
      WHERE tc.tenant_id = t.tenant_id
        AND tc.component_id = cc.component_id
        AND (tc.is_deleted = 0 OR tc.is_deleted IS NULL OR tc.is_deleted = FALSE)
  );
