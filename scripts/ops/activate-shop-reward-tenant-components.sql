-- =============================================================================
-- Shop·Reward — TenantComponent OPS 활성화 (Flyway V20260519_003 이후)
-- =============================================================================
-- 사용법:
--   1) Flyway V20260519_003 적용으로 component_catalog 3종 시드 완료 확인
--   2) §2.2 런북 SQL로 tenant_id 조회 (저장소·Flyway에 tenant UUID 하드코딩 금지)
--   3) mysql에서 @tenant_id 설정 후 SOURCE (멱등 — NOT EXISTS)
--
-- 예시 (mysql CLI):
--   SET @tenant_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
--   SOURCE scripts/ops/activate-shop-reward-tenant-components.sql;
-- =============================================================================

-- @tenant_id ← tenants.subdomain 등으로 조회한 UUID (실행 전 SET 필수)

INSERT INTO tenant_components (
    tenant_component_id, tenant_id, component_id, status,
    activated_at, activated_by, is_deleted, created_by, updated_by
)
SELECT UUID(), @tenant_id, cc.component_id, 'ACTIVE',
       CURRENT_TIMESTAMP, 'ops-manual', FALSE, 'ops-manual', 'ops-manual'
FROM component_catalog cc
WHERE cc.component_code IN ('CLIENT_SHOP', 'CLIENT_REWARD', 'ADMIN_SHOP_CATALOG')
  AND cc.is_deleted = FALSE
  AND NOT EXISTS (
      SELECT 1 FROM tenant_components tc
      WHERE tc.tenant_id = @tenant_id
        AND tc.component_id = cc.component_id
        AND tc.is_deleted = FALSE
  );
