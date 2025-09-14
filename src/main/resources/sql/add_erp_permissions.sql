-- ERP 권한 코드 추가
-- 2025-09-15 ERP 시스템 구축

-- ERP 권한 그룹
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, is_deleted, version, extra_data, created_at, updated_at) 
VALUES ('PERMISSION', 'ERP_ACCESS', 'ERP 접근', 'ERP 시스템 전체 접근 권한', 1, true, false, 0, 
'{"description": "ERP 시스템에 접근할 수 있는 권한", "level": "system"}', NOW(), NOW());

-- ERP 세부 권한들
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, is_deleted, version, extra_data, created_at, updated_at) 
VALUES 
('PERMISSION', 'ERP_PURCHASE_VIEW', '구매 관리 조회', '구매 관리 페이지 조회 권한', 1, true, false, 0, 
'{"description": "구매 관리 페이지를 조회할 수 있는 권한", "level": "page", "parent": "ERP_ACCESS"}', NOW(), NOW()),

('PERMISSION', 'ERP_PURCHASE_EDIT', '구매 관리 편집', '구매 관리 데이터 편집 권한', 2, true, false, 0, 
'{"description": "구매 요청 및 주문을 편집할 수 있는 권한", "level": "data", "parent": "ERP_ACCESS"}', NOW(), NOW()),

('PERMISSION', 'ERP_FINANCIAL_VIEW', '재무 관리 조회', '재무 관리 페이지 조회 권한', 3, true, false, 0, 
'{"description": "재무 관리 페이지를 조회할 수 있는 권한", "level": "page", "parent": "ERP_ACCESS"}', NOW(), NOW()),

('PERMISSION', 'ERP_FINANCIAL_EDIT', '재무 관리 편집', '재무 거래 데이터 편집 권한', 4, true, false, 0, 
'{"description": "재무 거래를 편집할 수 있는 권한", "level": "data", "parent": "ERP_ACCESS"}', NOW(), NOW()),

('PERMISSION', 'ERP_BUDGET_VIEW', '예산 관리 조회', '예산 관리 페이지 조회 권한', 5, true, false, 0, 
'{"description": "예산 관리 페이지를 조회할 수 있는 권한", "level": "page", "parent": "ERP_ACCESS"}', NOW(), NOW()),

('PERMISSION', 'ERP_BUDGET_EDIT', '예산 관리 편집', '예산 데이터 편집 권한', 6, true, false, 0, 
'{"description": "예산을 편집할 수 있는 권한", "level": "data", "parent": "ERP_ACCESS"}', NOW(), NOW()),

('PERMISSION', 'ERP_INVENTORY_VIEW', '재고 관리 조회', '재고 관리 페이지 조회 권한', 7, true, false, 0, 
'{"description": "재고 관리 페이지를 조회할 수 있는 권한", "level": "page", "parent": "ERP_ACCESS"}', NOW(), NOW()),

('PERMISSION', 'ERP_INVENTORY_EDIT', '재고 관리 편집', '재고 데이터 편집 권한', 8, true, false, 0, 
'{"description": "재고를 편집할 수 있는 권한", "level": "data", "parent": "ERP_ACCESS"}', NOW(), NOW());
