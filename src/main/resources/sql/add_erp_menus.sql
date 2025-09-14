-- ERP 메뉴 추가
-- 2025-09-15 ERP 시스템 구축

-- ERP 메인 메뉴
INSERT INTO menus (menu_name, menu_path, menu_icon, parent_id, sort_order, is_active, created_at, updated_at) 
VALUES ('ERP 관리', '/erp', 'bi-gear', NULL, 50, true, NOW(), NOW());

-- ERP 하위 메뉴들
INSERT INTO menus (menu_name, menu_path, menu_icon, parent_id, sort_order, is_active, created_at, updated_at) 
VALUES 
('구매 관리', '/erp/purchase', 'bi-cart-check', (SELECT id FROM menus WHERE menu_name = 'ERP 관리'), 1, true, NOW(), NOW()),
('재무 관리', '/erp/financial', 'bi-graph-up', (SELECT id FROM menus WHERE menu_name = 'ERP 관리'), 2, true, NOW(), NOW()),
('예산 관리', '/erp/budget', 'bi-piggy-bank', (SELECT id FROM menus WHERE menu_name = 'ERP 관리'), 3, true, NOW(), NOW()),
('재고 관리', '/erp/inventory', 'bi-box', (SELECT id FROM menus WHERE menu_name = 'ERP 관리'), 4, true, NOW(), NOW());

-- 권한별 메뉴 접근 설정
-- HQ_MASTER: 모든 ERP 메뉴 접근 가능
INSERT INTO menu_permissions (menu_id, role, can_view, can_edit, can_delete, created_at, updated_at)
SELECT m.id, 'HQ_MASTER', true, true, true, NOW(), NOW()
FROM menus m 
WHERE m.menu_name IN ('ERP 관리', '구매 관리', '재무 관리', '예산 관리', '재고 관리');

-- BRANCH_SUPER_ADMIN: 구매 관리, 재무 관리 접근 가능
INSERT INTO menu_permissions (menu_id, role, can_view, true, false, created_at, updated_at)
SELECT m.id, 'BRANCH_SUPER_ADMIN', true, true, false, NOW(), NOW()
FROM menus m 
WHERE m.menu_name IN ('구매 관리', '재무 관리');

-- BRANCH_ADMIN: 구매 관리만 조회 가능
INSERT INTO menu_permissions (menu_id, role, can_view, can_edit, can_delete, created_at, updated_at)
SELECT m.id, 'BRANCH_ADMIN', true, false, false, NOW(), NOW()
FROM menus m 
WHERE m.menu_name = '구매 관리';
