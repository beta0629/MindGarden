-- LNB: 어드민 「쇼핑·리워드」 메뉴 그룹 (ADM_SHOP + 하위 3종)
-- - 경로: /admin/shop/catalog-skus, /admin/shop/point-policies, /admin/shop/orders
-- - 역할·플래그: STAFF, ADMIN_ONLY (TenantComponent off 여부와 무관하게 LNB 노출)
-- - sort_order 35: ADM_USERS(30)와 ADM_ERP(40) 사이
-- 멱등: INSERT 는 menu_code 기준 NOT EXISTS

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_SHOP', '쇼핑·리워드', 'Shop & Reward', '/admin/shop/catalog-skus', NULL, 0, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'ShoppingBag', 35, 1, '온라인 쇼핑·리워드 어드민', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SHOP');

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_SHOP_CATALOG', '상품(SKU) 관리', 'Catalog SKUs', '/admin/shop/catalog-skus', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SHOP' LIMIT 1) AS p), 1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'Package', 1, 1, '쇼핑 카탈로그 SKU 관리', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SHOP_CATALOG');

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_SHOP_POINT_POLICIES', '리워드 정책', 'Point Policies', '/admin/shop/point-policies', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SHOP' LIMIT 1) AS p), 1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'Gift', 2, 1, '테넌트 포인트·리워드 정책', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SHOP_POINT_POLICIES');

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_SHOP_ORDERS', '온라인 주문', 'Shop Orders', '/admin/shop/orders', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SHOP' LIMIT 1) AS p), 1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'Receipt', 3, 1, '온라인 쇼핑 주문 관리', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SHOP_ORDERS');
