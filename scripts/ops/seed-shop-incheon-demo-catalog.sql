-- =============================================================================
-- Shop — 인천 dev 테넌트 QA용 카탈로그 SKU 다건 시드 (OPS, 멱등)
-- =============================================================================
-- 사용법:
--   SET @tenant_id = 'tenant-incheon-counseling-001' COLLATE utf8mb4_unicode_ci;
--   SOURCE scripts/ops/seed-shop-incheon-demo-catalog.sql;
--
-- 선행: Flyway shop_catalog_skus, tenant_components CLIENT_SHOP/ADMIN_SHOP_CATALOG ACTIVE
-- dev QA 전용 — 운영 DB 금지
-- =============================================================================

-- @tenant_id ← 실행 전 SET 필수 (예: tenant-incheon-counseling-001)

SET @thumb = '/api/v1/files/shop-catalog-thumbnails/placeholder-dev-consult-demo.png';

INSERT INTO shop_catalog_skus (
    tenant_id,
    sku_code,
    title,
    description_text,
    catalog_category,
    thumbnail_url,
    unit_price_minor,
    currency,
    catalog_visible,
    active,
    sort_order,
    is_deleted
)
SELECT @tenant_id, v.sku_code, v.title, v.description_text, v.catalog_category, @thumb,
       v.unit_price_minor, 'KRW', 1, 1, v.sort_order, 0
FROM (
    SELECT 'DEV-CONSULT-DEMO-01' AS sku_code,
           '기본 상담 패키지 (4회)' AS title,
           '1:1 대면·화상 상담 50분 × 4회 패키지입니다.' AS description_text,
           'CONSULTATION' AS catalog_category,
           200000 AS unit_price_minor,
           10 AS sort_order
    UNION ALL
    SELECT 'DEV-CONSULT-DEMO-02',
           '심층 상담 패키지 (8회)',
           '8회 구성 상담 패키지 — 장기 프로그램 QA용.',
           'CONSULTATION',
           360000,
           20
    UNION ALL
    SELECT 'DEV-CONSULT-DEMO-03',
           '청소년 상담 (단회)',
           '만 13~18세 대상 단회 상담 상품.',
           'CONSULTATION',
           65000,
           30
    UNION ALL
    SELECT 'DEV-ASSESS-DEMO-01',
           'MMPI-2-RF 검사 패키지',
           '표준화 심리검사 + 결과 해석 1회 포함.',
           'ASSESSMENT',
           120000,
           40
    UNION ALL
    SELECT 'DEV-ASSESS-DEMO-02',
           '종합 심리검사 세트',
           '다면적 평가·해석 리포트 제공 (dev 시드).',
           'ASSESSMENT',
           180000,
           50
) AS v
WHERE NOT EXISTS (
    SELECT 1
    FROM shop_catalog_skus s
    WHERE s.tenant_id = @tenant_id
      AND s.sku_code = v.sku_code
      AND s.is_deleted = 0
);

UPDATE shop_catalog_skus
SET
    catalog_category = CASE sku_code
        WHEN 'DEV-ASSESS-DEMO-01' THEN 'ASSESSMENT'
        WHEN 'DEV-ASSESS-DEMO-02' THEN 'ASSESSMENT'
        ELSE 'CONSULTATION'
    END,
    thumbnail_url = COALESCE(NULLIF(TRIM(thumbnail_url), ''), @thumb),
    catalog_visible = 1,
    active = 1,
    is_deleted = 0
WHERE tenant_id = @tenant_id
  AND sku_code IN (
      'DEV-CONSULT-DEMO-01',
      'DEV-CONSULT-DEMO-02',
      'DEV-CONSULT-DEMO-03',
      'DEV-ASSESS-DEMO-01',
      'DEV-ASSESS-DEMO-02'
  )
  AND is_deleted = 0;
