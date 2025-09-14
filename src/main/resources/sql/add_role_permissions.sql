-- 역할별 ERP 권한 매핑
-- 2025-09-15 ERP 시스템 구축

-- HQ_MASTER: 모든 ERP 권한
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, is_deleted, version, extra_data, created_at, updated_at) 
VALUES 
('ROLE_PERMISSION', 'HQ_MASTER_ERP_ACCESS', 'HQ_MASTER ERP 접근', 'HQ_MASTER의 ERP 전체 접근 권한', 1, true, false, 0, 
'{"role": "HQ_MASTER", "permission": "ERP_ACCESS", "level": "full"}', NOW(), NOW()),

('ROLE_PERMISSION', 'HQ_MASTER_ERP_PURCHASE', 'HQ_MASTER 구매 관리', 'HQ_MASTER의 구매 관리 권한', 2, true, false, 0, 
'{"role": "HQ_MASTER", "permission": "ERP_PURCHASE_VIEW,ERP_PURCHASE_EDIT", "level": "full"}', NOW(), NOW()),

('ROLE_PERMISSION', 'HQ_MASTER_ERP_FINANCIAL', 'HQ_MASTER 재무 관리', 'HQ_MASTER의 재무 관리 권한', 3, true, false, 0, 
'{"role": "HQ_MASTER", "permission": "ERP_FINANCIAL_VIEW,ERP_FINANCIAL_EDIT", "level": "full"}', NOW(), NOW()),

('ROLE_PERMISSION', 'HQ_MASTER_ERP_BUDGET', 'HQ_MASTER 예산 관리', 'HQ_MASTER의 예산 관리 권한', 4, true, false, 0, 
'{"role": "HQ_MASTER", "permission": "ERP_BUDGET_VIEW,ERP_BUDGET_EDIT", "level": "full"}', NOW(), NOW()),

('ROLE_PERMISSION', 'HQ_MASTER_ERP_INVENTORY', 'HQ_MASTER 재고 관리', 'HQ_MASTER의 재고 관리 권한', 5, true, false, 0, 
'{"role": "HQ_MASTER", "permission": "ERP_INVENTORY_VIEW,ERP_INVENTORY_EDIT", "level": "full"}', NOW(), NOW());

-- BRANCH_SUPER_ADMIN: 구매 관리, 재무 관리만
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, is_deleted, version, extra_data, created_at, updated_at) 
VALUES 
('ROLE_PERMISSION', 'BRANCH_SUPER_ADMIN_ERP_PURCHASE', 'BRANCH_SUPER_ADMIN 구매 관리', 'BRANCH_SUPER_ADMIN의 구매 관리 권한', 6, true, false, 0, 
'{"role": "BRANCH_SUPER_ADMIN", "permission": "ERP_PURCHASE_VIEW,ERP_PURCHASE_EDIT", "level": "limited"}', NOW(), NOW()),

('ROLE_PERMISSION', 'BRANCH_SUPER_ADMIN_ERP_FINANCIAL', 'BRANCH_SUPER_ADMIN 재무 관리', 'BRANCH_SUPER_ADMIN의 재무 관리 권한', 7, true, false, 0, 
'{"role": "BRANCH_SUPER_ADMIN", "permission": "ERP_FINANCIAL_VIEW,ERP_FINANCIAL_EDIT", "level": "limited"}', NOW(), NOW());

-- BRANCH_ADMIN: 구매 관리 조회만
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, is_deleted, version, extra_data, created_at, updated_at) 
VALUES 
('ROLE_PERMISSION', 'BRANCH_ADMIN_ERP_PURCHASE', 'BRANCH_ADMIN 구매 관리', 'BRANCH_ADMIN의 구매 관리 조회 권한', 8, true, false, 0, 
'{"role": "BRANCH_ADMIN", "permission": "ERP_PURCHASE_VIEW", "level": "readonly"}', NOW(), NOW());
