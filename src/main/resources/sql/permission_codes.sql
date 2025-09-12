-- 권한 관련 공통코드 데이터
-- 코드 그룹: PERMISSION_SYSTEM

-- 1. 기능별 권한 설정
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
-- ERD 메뉴 접근 권한
('PERMISSION_SYSTEM', 'ERD_ACCESS', 'ERD 메뉴 접근', 'ERD 메뉴에 접근할 수 있는 권한', 1, true, '{"allowedRoles": ["BRANCH_SUPER_ADMIN"]}', NOW(), NOW(), false, 1),

-- 결제 기능 접근 권한
('PERMISSION_SYSTEM', 'PAYMENT_ACCESS', '결제 기능 접근', '결제 기능에 접근할 수 있는 권한', 2, true, '{"allowedRoles": ["ADMIN", "BRANCH_SUPER_ADMIN"]}', NOW(), NOW(), false, 1),

-- 비품구매 요청 권한
('PERMISSION_SYSTEM', 'SUPPLY_REQUEST', '비품구매 요청', '비품구매 요청을 할 수 있는 권한', 3, true, '{"allowedRoles": ["CONSULTANT"]}', NOW(), NOW(), false, 1),

-- 비품구매 결제 요청 권한
('PERMISSION_SYSTEM', 'SUPPLY_PAYMENT_REQUEST', '비품구매 결제 요청', '비품구매 결제 요청을 할 수 있는 권한', 4, true, '{"allowedRoles": ["ADMIN"]}', NOW(), NOW(), false, 1),

-- 비품구매 결제 승인 권한
('PERMISSION_SYSTEM', 'SUPPLY_PAYMENT_APPROVE', '비품구매 결제 승인', '비품구매 결제를 승인할 수 있는 권한', 5, true, '{"allowedRoles": ["BRANCH_SUPER_ADMIN"]}', NOW(), NOW(), false, 1),

-- 스케줄러 등록 권한
('PERMISSION_SYSTEM', 'SCHEDULER_REGISTER', '스케줄러 등록', '스케줄러를 등록할 수 있는 권한', 6, true, '{"allowedRoles": ["ADMIN", "BRANCH_SUPER_ADMIN"]}', NOW(), NOW(), false, 1),

-- 스케줄러 상담사 조회 권한
('PERMISSION_SYSTEM', 'SCHEDULER_CONSULTANT_VIEW', '스케줄러 상담사 조회', '스케줄러에서 상담사를 조회할 수 있는 권한', 7, true, '{"allowedRoles": ["ADMIN", "BRANCH_SUPER_ADMIN"]}', NOW(), NOW(), false, 1),

-- 지점 내역 조회 권한 (HQ_MASTER만)
('PERMISSION_SYSTEM', 'BRANCH_DETAILS_VIEW', '지점 내역 조회', '모든 지점 내역을 조회할 수 있는 권한', 8, true, '{"allowedRoles": ["HQ_MASTER"]}', NOW(), NOW(), false, 1),

-- 지점 생성/삭제 권한
('PERMISSION_SYSTEM', 'BRANCH_MANAGE', '지점 관리', '지점을 생성/삭제/관리할 수 있는 권한', 9, true, '{"allowedRoles": ["HQ_ADMIN", "SUPER_HQ_ADMIN", "HQ_MASTER"]}', NOW(), NOW(), false, 1),

-- 시스템 전체 관리 권한
('PERMISSION_SYSTEM', 'SYSTEM_MANAGE', '시스템 관리', '시스템 전체를 관리할 수 있는 권한', 10, true, '{"allowedRoles": ["HQ_MASTER"]}', NOW(), NOW(), false);

-- 2. 역할별 기본 권한 설정
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
-- CLIENT 기본 권한
('ROLE_PERMISSIONS', 'CLIENT_DEFAULT', '내담자 기본 권한', '내담자의 기본 권한', 1, true, '{"permissions": ["VIEW_OWN_SCHEDULE", "VIEW_OWN_PROFILE"]}', NOW(), NOW(), false, 1),

-- CONSULTANT 기본 권한
('ROLE_PERMISSIONS', 'CONSULTANT_DEFAULT', '상담사 기본 권한', '상담사의 기본 권한', 2, true, '{"permissions": ["MANAGE_OWN_SCHEDULE", "VIEW_OWN_CLIENTS", "SUPPLY_REQUEST"]}', NOW(), NOW(), false, 1),

-- ADMIN 기본 권한
('ROLE_PERMISSIONS', 'ADMIN_DEFAULT', '지점 관리자 기본 권한', '지점 관리자의 기본 권한', 3, true, '{"permissions": ["MANAGE_BRANCH", "PAYMENT_ACCESS", "SUPPLY_PAYMENT_REQUEST", "SCHEDULER_REGISTER", "SCHEDULER_CONSULTANT_VIEW"]}', NOW(), NOW(), false, 1),

-- BRANCH_SUPER_ADMIN 기본 권한
('ROLE_PERMISSIONS', 'BRANCH_SUPER_ADMIN_DEFAULT', '지점 수퍼 관리자 기본 권한', '지점 수퍼 관리자의 기본 권한', 4, true, '{"permissions": ["MANAGE_BRANCH", "ERD_ACCESS", "PAYMENT_ACCESS", "SUPPLY_PAYMENT_APPROVE", "SCHEDULER_REGISTER", "SCHEDULER_CONSULTANT_VIEW"]}', NOW(), NOW(), false, 1),

-- HQ_ADMIN 기본 권한
('ROLE_PERMISSIONS', 'HQ_ADMIN_DEFAULT', '본사 관리자 기본 권한', '본사 관리자의 기본 권한', 5, true, '{"permissions": ["BRANCH_MANAGE"]}', NOW(), NOW(), false, 1),

-- SUPER_HQ_ADMIN 기본 권한
('ROLE_PERMISSIONS', 'SUPER_HQ_ADMIN_DEFAULT', '본사 고급 관리자 기본 권한', '본사 고급 관리자의 기본 권한', 6, true, '{"permissions": ["BRANCH_MANAGE"]}', NOW(), NOW(), false, 1),

-- HQ_MASTER 기본 권한
('ROLE_PERMISSIONS', 'HQ_MASTER_DEFAULT', '본사 총관리자 기본 권한', '본사 총관리자의 기본 권한', 7, true, '{"permissions": ["SYSTEM_MANAGE", "BRANCH_DETAILS_VIEW", "BRANCH_MANAGE"]}', NOW(), NOW());
