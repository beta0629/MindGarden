-- 지점 수퍼 관리자 메뉴 (BRANCH_SUPER_ADMIN_MENU) 추가
-- ERP 및 고급 관리 기능 접근 가능

INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
-- 메인 메뉴
('BRANCH_SUPER_ADMIN_MENU', 'BRANCH_SUPER_ADMIN_MAIN', '지점 수퍼 관리', '지점 수퍼 관리자 전용 기능', 1, true, '{"icon": "bi-shield-check", "type": "main", "hasSubMenu": true}', NOW(), NOW(), false, 1),
('BRANCH_SUPER_ADMIN_MENU', 'ERP_MAIN', 'ERP 관리', 'ERP 시스템 관리', 2, true, '{"icon": "bi-gear", "type": "main", "hasSubMenu": true}', NOW(), NOW(), false, 1),
('BRANCH_SUPER_ADMIN_MENU', 'FINANCE_MAIN', '재무 관리', '재무 및 회계 관리', 3, true, '{"icon": "bi-graph-up", "type": "main", "hasSubMenu": true}', NOW(), NOW(), false, 1),

-- 지점 수퍼 관리 서브 메뉴
('BRANCH_SUPER_ADMIN_MENU', 'BRANCH_SUPER_DASHBOARD', '지점 수퍼 대시보드', '지점 수퍼 관리자 전용 대시보드', 11, true, '{"icon": "bi-speedometer2", "path": "/branch-super-admin/dashboard", "parent": "BRANCH_SUPER_ADMIN_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('BRANCH_SUPER_ADMIN_MENU', 'BRANCH_SUPER_SETTINGS', '지점 수퍼 설정', '지점 수퍼 관리자 설정', 12, true, '{"icon": "bi-gear-fill", "path": "/branch-super-admin/settings", "parent": "BRANCH_SUPER_ADMIN_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),

-- ERP 관리 서브 메뉴
('BRANCH_SUPER_ADMIN_MENU', 'ERP_DASHBOARD', 'ERP 대시보드', 'ERP 통합 대시보드', 21, true, '{"icon": "bi-speedometer2", "path": "/erp/dashboard", "parent": "ERP_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('BRANCH_SUPER_ADMIN_MENU', 'ERP_FINANCIAL', '재무 관리', '재무 거래 및 회계 관리', 22, true, '{"icon": "bi-graph-up", "path": "/erp/financial", "parent": "ERP_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('BRANCH_SUPER_ADMIN_MENU', 'ERP_PURCHASE', '구매 관리', '비품 구매 요청 및 주문 관리', 23, true, '{"icon": "bi-cart-check", "path": "/erp/purchase", "parent": "ERP_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('BRANCH_SUPER_ADMIN_MENU', 'ERP_BUDGET', '예산 관리', '예산 계획 및 관리', 24, true, '{"icon": "bi-piggy-bank", "path": "/erp/budget", "parent": "ERP_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('BRANCH_SUPER_ADMIN_MENU', 'ERP_INVENTORY', '재고 관리', '재고 현황 및 관리', 25, true, '{"icon": "bi-box", "path": "/erp/inventory", "parent": "ERP_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),

-- 재무 관리 서브 메뉴
('BRANCH_SUPER_ADMIN_MENU', 'FINANCE_DASHBOARD', '재무 대시보드', '재무 현황 대시보드', 31, true, '{"icon": "bi-speedometer2", "path": "/finance/dashboard", "parent": "FINANCE_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('BRANCH_SUPER_ADMIN_MENU', 'FINANCE_REPORTS', '재무 보고서', '월별/연별 재무 보고서', 32, true, '{"icon": "bi-file-text", "path": "/finance/reports", "parent": "FINANCE_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('BRANCH_SUPER_ADMIN_MENU', 'FINANCE_TRANSACTIONS', '거래 내역', '재무 거래 내역 관리', 33, true, '{"icon": "bi-list-ul", "path": "/finance/transactions", "parent": "FINANCE_MAIN", "type": "sub"}', NOW(), NOW(), false, 1),
('BRANCH_SUPER_ADMIN_MENU', 'FINANCE_ACCOUNTS', '계좌 관리', '지점 계좌 관리', 34, true, '{"icon": "bi-bank", "path": "/finance/accounts", "parent": "FINANCE_MAIN", "type": "sub"}', NOW(), NOW(), false, 1);
