-- ============================================
-- SHOP_REWARD §7 — 쇼핑·리워드 ComponentCatalog 시드 (없을 때만)
-- MULTI_TENANT §3.1 step 4 — CLIENT_SHOP / CLIENT_REWARD / ADMIN_SHOP_CATALOG
-- ============================================

INSERT IGNORE INTO component_catalog (
    component_id, component_code, name, name_ko, name_en,
    category, description, description_ko, description_en,
    is_core, is_active, component_version, display_order,
    created_by, updated_by
) VALUES
(UUID(), 'CLIENT_SHOP', '내담자 쇼핑몰', '내담자 쇼핑몰', 'Client Shop',
 'ADDON', '내담자 카탈로그·장바구니·체크아웃', '내담자 카탈로그·장바구니·체크아웃',
 'Client catalog, cart, and checkout',
 FALSE, TRUE, '1.0.0', 10, 'system', 'system'),
(UUID(), 'CLIENT_REWARD', '내담자 리워드', '내담자 리워드', 'Client Reward',
 'ADDON', '포인트 잔액·체크아웃 사용·적립', '포인트 잔액·체크아웃 사용·적립',
 'Point balance, checkout redemption, and earn',
 FALSE, TRUE, '1.0.0', 11, 'system', 'system'),
(UUID(), 'ADMIN_SHOP_CATALOG', '어드민 쇼핑 카탈로그', '어드민 쇼핑 카탈로그', 'Admin Shop Catalog',
 'ADDON', '테넌트 SKU·가격·리워드 정책 관리', '테넌트 SKU·가격·리워드 정책 관리',
 'Tenant SKU, pricing, and reward policy administration',
 FALSE, TRUE, '1.0.0', 12, 'system', 'system');

-- ---------------------------------------------------------------------------
-- OPS 수동 활성화 (Flyway에서 tenant_id 하드코딩 금지)
-- MindGarden 등 대표 테넌트에 TenantComponent를 켤 때는 아래를 참고해
-- 운영 DB에서 tenant_id·component_id를 조회한 뒤 1회 실행한다.
--
-- 예시 (tenant_id·component_id는 환경별로 치환):
-- INSERT INTO tenant_components (
--     tenant_component_id, tenant_id, component_id, status,
--     activated_at, activated_by, is_deleted, created_by, updated_by
-- )
-- SELECT UUID(), :tenant_id, cc.component_id, 'ACTIVE',
--        CURRENT_TIMESTAMP, 'ops-manual', FALSE, 'ops-manual', 'ops-manual'
-- FROM component_catalog cc
-- WHERE cc.component_code IN ('CLIENT_SHOP', 'CLIENT_REWARD', 'ADMIN_SHOP_CATALOG')
--   AND cc.is_deleted = FALSE
--   AND NOT EXISTS (
--       SELECT 1 FROM tenant_components tc
--       WHERE tc.tenant_id = :tenant_id
--         AND tc.component_id = cc.component_id
--         AND tc.is_deleted = FALSE
--   );
-- ---------------------------------------------------------------------------
