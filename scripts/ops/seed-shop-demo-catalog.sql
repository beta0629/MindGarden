-- =============================================================================
-- Shop — dev/staging QA용 CONSULTATION SKU 시드 (Flyway 외 OPS)
-- =============================================================================
-- 사용법:
--   1) Flyway P2 002~007 및 V20260520_001 적용 확인
--   2) SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md §2.2 로 tenant_id 조회
--      (저장소·Flyway·본 스크립트에 tenant UUID 하드코딩 금지)
--   3) mysql에서 @tenant_id 설정 후 SOURCE (멱등 — 동일 sku_code 시 INSERT 스킵)
--
-- 예시 (dev SSH 1267 collation 대응):
--   SET @tenant_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' COLLATE utf8mb4_unicode_ci;
--   SOURCE scripts/ops/seed-shop-demo-catalog.sql;
--
-- dev QA 전용 — 운영 DB·덤프 이식 금지. unit_price_minor는 dev 더미(50_000 KRW).
-- =============================================================================

-- @tenant_id ← tenants.subdomain 등으로 조회한 UUID (실행 전 SET 필수)

INSERT INTO shop_catalog_skus (
    tenant_id,
    sku_code,
    title,
    catalog_category,
    thumbnail_url,
    unit_price_minor,
    currency,
    catalog_visible,
    active,
    sort_order,
    is_deleted
)
SELECT
    @tenant_id,
    'DEV-CONSULT-DEMO-01',
    'Dev 상담 패키지 (QA)',
    'CONSULTATION',
    '/api/v1/files/shop-catalog-thumbnails/placeholder-dev-consult-demo.png',
    50000,
    'KRW',
    1,
    1,
    0,
    0
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1
    FROM shop_catalog_skus s
    WHERE s.tenant_id = @tenant_id
      AND s.sku_code = 'DEV-CONSULT-DEMO-01'
      AND s.is_deleted = 0
);

-- 기존 행이 있으면 PLP·E2E 전제(catalog_visible·active·CONSULTATION·썸네일) 맞춤
UPDATE shop_catalog_skus
SET
    catalog_category = 'CONSULTATION',
    thumbnail_url = COALESCE(
        NULLIF(TRIM(thumbnail_url), ''),
        '/api/v1/files/shop-catalog-thumbnails/placeholder-dev-consult-demo.png'
    ),
    catalog_visible = 1,
    active = 1,
    is_deleted = 0
WHERE tenant_id = @tenant_id
  AND sku_code = 'DEV-CONSULT-DEMO-01'
  AND is_deleted = 0;
