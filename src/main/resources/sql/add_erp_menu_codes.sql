-- ERP 메뉴 CommonCode 추가
-- 2025-09-15 ERP 시스템 구축

-- ERP 메인 메뉴
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, is_deleted, version, extra_data, created_at, updated_at) 
VALUES ('MENU', 'ERP_MAIN', 'ERP 관리', 'ERP 시스템 관리 메뉴', 50, true, false, 0, 
'{"icon": "bi-gear", "path": "/erp", "type": "main", "hasSubMenu": true}', NOW(), NOW());

-- ERP 하위 메뉴들
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, is_deleted, version, extra_data, created_at, updated_at) 
VALUES 
('MENU', 'ERP_PURCHASE', '구매 관리', '비품 구매 요청 및 주문 관리', 1, true, false, 0, 
'{"icon": "bi-cart-check", "path": "/erp/purchase", "type": "sub", "parent": "ERP_MAIN"}', NOW(), NOW()),

('MENU', 'ERP_FINANCIAL', '재무 관리', '재무 거래 및 회계 관리', 2, true, false, 0, 
'{"icon": "bi-graph-up", "path": "/erp/financial", "type": "sub", "parent": "ERP_MAIN"}', NOW(), NOW()),

('MENU', 'ERP_BUDGET', '예산 관리', '예산 계획 및 관리', 3, true, false, 0, 
'{"icon": "bi-piggy-bank", "path": "/erp/budget", "type": "sub", "parent": "ERP_MAIN"}', NOW(), NOW()),

('MENU', 'ERP_INVENTORY', '재고 관리', '재고 현황 및 관리', 4, true, false, 0, 
'{"icon": "bi-box", "path": "/erp/inventory", "type": "sub", "parent": "ERP_MAIN"}', NOW(), NOW());
