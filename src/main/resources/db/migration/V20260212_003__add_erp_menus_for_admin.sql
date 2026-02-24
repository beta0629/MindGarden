-- ========================================
-- ERP 메뉴를 관리자(ADMIN) 전용 메뉴에 추가
-- 어드민 권한 시 admin 메뉴에 ERP까지 노출 (최고 권한)
-- ========================================

-- ERP 최상위 메뉴 (SYSTEM_ADMIN 하위)
INSERT INTO menus (
    menu_code,
    menu_name,
    menu_name_en,
    menu_path,
    parent_menu_id,
    depth,
    required_role,
    is_admin_only,
    icon,
    sort_order,
    description,
    min_required_role,
    menu_location,
    is_active
)
SELECT
    'ERP_MAIN',
    'ERP 관리',
    'ERP Management',
    '/erp',
    (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'SYSTEM_ADMIN' LIMIT 1) AS t1),
    1,
    'ADMIN',
    1,
    'gear-fill',
    10,
    'ERP 대시보드·구매·재무·예산·세무 관리',
    'ADMIN',
    'ADMIN_ONLY',
    1
FROM (SELECT 1) AS t
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ERP_MAIN');

-- ERP 하위 메뉴 (ERP_MAIN 하위)
INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, is_admin_only, icon, sort_order, description, min_required_role, menu_location, is_active)
SELECT 'ERP_DASHBOARD', 'ERP 대시보드', 'ERP Dashboard', '/erp/dashboard', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ERP_MAIN' LIMIT 1) AS t1), 2, 'ADMIN', 1, 'speedometer2', 1, 'ERP 통합 대시보드', 'ADMIN', 'ADMIN_ONLY', 1
FROM (SELECT 1) AS t WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ERP_DASHBOARD');

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, is_admin_only, icon, sort_order, description, min_required_role, menu_location, is_active)
SELECT 'ERP_PURCHASE', '구매 관리', 'Purchase', '/erp/purchase', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ERP_MAIN' LIMIT 1) AS t1), 2, 'ADMIN', 1, 'cart-check', 2, '구매 요청 및 주문 관리', 'ADMIN', 'ADMIN_ONLY', 1
FROM (SELECT 1) AS t WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ERP_PURCHASE');

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, is_admin_only, icon, sort_order, description, min_required_role, menu_location, is_active)
SELECT 'ERP_FINANCIAL', '재무 관리', 'Financial', '/erp/financial', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ERP_MAIN' LIMIT 1) AS t1), 2, 'ADMIN', 1, 'graph-up', 3, '재무 거래 및 회계', 'ADMIN', 'ADMIN_ONLY', 1
FROM (SELECT 1) AS t WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ERP_FINANCIAL');

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, is_admin_only, icon, sort_order, description, min_required_role, menu_location, is_active)
SELECT 'ERP_BUDGET', '예산 관리', 'Budget', '/erp/budget', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ERP_MAIN' LIMIT 1) AS t1), 2, 'ADMIN', 1, 'piggy-bank', 4, '예산 계획 및 관리', 'ADMIN', 'ADMIN_ONLY', 1
FROM (SELECT 1) AS t WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ERP_BUDGET');

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, is_admin_only, icon, sort_order, description, min_required_role, menu_location, is_active)
SELECT 'ERP_TAX', '세무 관리', 'Tax', '/erp/tax', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ERP_MAIN' LIMIT 1) AS t1), 2, 'ADMIN', 1, 'receipt', 5, '세무 관리', 'ADMIN', 'ADMIN_ONLY', 1
FROM (SELECT 1) AS t WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ERP_TAX');
