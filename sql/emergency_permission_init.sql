-- 긴급 권한 시스템 초기화 SQL
-- 데이터베이스에 직접 실행하여 권한 시스템을 초기화합니다.

-- 1. 기본 권한 삽입
INSERT IGNORE INTO permissions (permission_code, permission_name, category, description, is_active, created_at, updated_at) VALUES
-- ERP 관련 권한
('ERP_ACCESS', 'ERP 접근', 'ERP', 'ERP 시스템 전체 접근 권한', true, NOW(), NOW()),
('ERP_DASHBOARD_VIEW', 'ERP 대시보드 조회', 'ERP', 'ERP 대시보드 조회 권한', true, NOW(), NOW()),
('INTEGRATED_FINANCE_VIEW', '통합 재무 조회', 'ERP', '통합 재무 관리 시스템 조회 권한', true, NOW(), NOW()),
('PAYMENT_ACCESS', '결제 관리 접근', 'ERP', '결제 관리 시스템 접근 권한', true, NOW(), NOW()),

-- 관리자 권한
('USER_VIEW', '사용자 조회', 'ADMIN', '사용자 목록 조회 권한', true, NOW(), NOW()),
('USER_MANAGE', '사용자 관리', 'ADMIN', '사용자 생성, 수정, 삭제 권한', true, NOW(), NOW()),
('CONSULTANT_VIEW', '상담사 조회', 'ADMIN', '상담사 목록 조회 권한', true, NOW(), NOW()),
('CONSULTANT_MANAGE', '상담사 관리', 'ADMIN', '상담사 생성, 수정, 삭제 권한', true, NOW(), NOW()),
('CLIENT_VIEW', '내담자 조회', 'ADMIN', '내담자 목록 조회 권한', true, NOW(), NOW()),
('CLIENT_MANAGE', '내담자 관리', 'ADMIN', '내담자 생성, 수정, 삭제 권한', true, NOW(), NOW()),
('MAPPING_VIEW', '매핑 조회', 'ADMIN', '매핑 목록 조회 권한', true, NOW(), NOW()),
('MAPPING_MANAGE', '매핑 관리', 'ADMIN', '매핑 생성, 수정, 삭제 권한', true, NOW(), NOW()),

-- 스케줄 권한
('SCHEDULE_VIEW', '스케줄 조회', 'SCHEDULE', '스케줄 목록 조회 권한', true, NOW(), NOW()),
('SCHEDULE_MANAGE', '스케줄 관리', 'SCHEDULE', '스케줄 생성, 수정, 삭제 권한', true, NOW(), NOW()),

-- 재무 권한
('FINANCIAL_VIEW', '재무 조회', 'FINANCIAL', '재무 정보 조회 권한', true, NOW(), NOW()),
('FINANCIAL_MANAGE', '재무 관리', 'FINANCIAL', '재무 정보 관리 권한', true, NOW(), NOW()),

-- HQ 권한
('HQ_DASHBOARD_VIEW', 'HQ 대시보드 조회', 'HQ', '본사 대시보드 조회 권한', true, NOW(), NOW()),
('BRANCH_VIEW', '지점 조회', 'HQ', '지점 정보 조회 권한', true, NOW(), NOW()),
('BRANCH_MANAGE', '지점 관리', 'HQ', '지점 정보 관리 권한', true, NOW(), NOW());

-- 2. 역할별 권한 매핑
INSERT IGNORE INTO role_permissions (role_name, permission_code, is_active, created_at, updated_at) VALUES
-- ADMIN 권한
('ADMIN', 'USER_VIEW', true, NOW(), NOW()),
('ADMIN', 'USER_MANAGE', true, NOW(), NOW()),
('ADMIN', 'CONSULTANT_VIEW', true, NOW(), NOW()),
('ADMIN', 'CONSULTANT_MANAGE', true, NOW(), NOW()),
('ADMIN', 'CLIENT_VIEW', true, NOW(), NOW()),
('ADMIN', 'CLIENT_MANAGE', true, NOW(), NOW()),
('ADMIN', 'MAPPING_VIEW', true, NOW(), NOW()),
('ADMIN', 'MAPPING_MANAGE', true, NOW(), NOW()),
('ADMIN', 'SCHEDULE_VIEW', true, NOW(), NOW()),
('ADMIN', 'SCHEDULE_MANAGE', true, NOW(), NOW()),
('ADMIN', 'FINANCIAL_VIEW', true, NOW(), NOW()),
('ADMIN', 'FINANCIAL_MANAGE', true, NOW(), NOW()),
('ADMIN', 'ERP_ACCESS', true, NOW(), NOW()),
('ADMIN', 'ERP_DASHBOARD_VIEW', true, NOW(), NOW()),
('ADMIN', 'INTEGRATED_FINANCE_VIEW', true, NOW(), NOW()),
('ADMIN', 'PAYMENT_ACCESS', true, NOW(), NOW()),

-- BRANCH_SUPER_ADMIN 권한
('BRANCH_SUPER_ADMIN', 'USER_VIEW', true, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'CONSULTANT_VIEW', true, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'CONSULTANT_MANAGE', true, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'CLIENT_VIEW', true, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'CLIENT_MANAGE', true, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MAPPING_VIEW', true, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MAPPING_MANAGE', true, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'SCHEDULE_VIEW', true, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'SCHEDULE_MANAGE', true, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'FINANCIAL_VIEW', true, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'ERP_ACCESS', true, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'ERP_DASHBOARD_VIEW', true, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'INTEGRATED_FINANCE_VIEW', true, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'PAYMENT_ACCESS', true, NOW(), NOW()),

-- HQ_ADMIN 권한
('HQ_ADMIN', 'USER_VIEW', true, NOW(), NOW()),
('HQ_ADMIN', 'CONSULTANT_VIEW', true, NOW(), NOW()),
('HQ_ADMIN', 'CLIENT_VIEW', true, NOW(), NOW()),
('HQ_ADMIN', 'MAPPING_VIEW', true, NOW(), NOW()),
('HQ_ADMIN', 'SCHEDULE_VIEW', true, NOW(), NOW()),
('HQ_ADMIN', 'FINANCIAL_VIEW', true, NOW(), NOW()),
('HQ_ADMIN', 'HQ_DASHBOARD_VIEW', true, NOW(), NOW()),
('HQ_ADMIN', 'BRANCH_VIEW', true, NOW(), NOW()),
('HQ_ADMIN', 'BRANCH_MANAGE', true, NOW(), NOW()),
('HQ_ADMIN', 'ERP_ACCESS', true, NOW(), NOW()),
('HQ_ADMIN', 'ERP_DASHBOARD_VIEW', true, NOW(), NOW()),

-- SUPER_HQ_ADMIN 권한
('SUPER_HQ_ADMIN', 'USER_VIEW', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'USER_MANAGE', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'CONSULTANT_VIEW', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'CONSULTANT_MANAGE', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'CLIENT_VIEW', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'CLIENT_MANAGE', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'MAPPING_VIEW', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'MAPPING_MANAGE', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'SCHEDULE_VIEW', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'SCHEDULE_MANAGE', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'FINANCIAL_VIEW', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'FINANCIAL_MANAGE', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'HQ_DASHBOARD_VIEW', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'BRANCH_VIEW', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'BRANCH_MANAGE', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'ERP_ACCESS', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'ERP_DASHBOARD_VIEW', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'INTEGRATED_FINANCE_VIEW', true, NOW(), NOW()),

-- HQ_MASTER 권한 (모든 권한)
('HQ_MASTER', 'USER_VIEW', true, NOW(), NOW()),
('HQ_MASTER', 'USER_MANAGE', true, NOW(), NOW()),
('HQ_MASTER', 'CONSULTANT_VIEW', true, NOW(), NOW()),
('HQ_MASTER', 'CONSULTANT_MANAGE', true, NOW(), NOW()),
('HQ_MASTER', 'CLIENT_VIEW', true, NOW(), NOW()),
('HQ_MASTER', 'CLIENT_MANAGE', true, NOW(), NOW()),
('HQ_MASTER', 'MAPPING_VIEW', true, NOW(), NOW()),
('HQ_MASTER', 'MAPPING_MANAGE', true, NOW(), NOW()),
('HQ_MASTER', 'SCHEDULE_VIEW', true, NOW(), NOW()),
('HQ_MASTER', 'SCHEDULE_MANAGE', true, NOW(), NOW()),
('HQ_MASTER', 'FINANCIAL_VIEW', true, NOW(), NOW()),
('HQ_MASTER', 'FINANCIAL_MANAGE', true, NOW(), NOW()),
('HQ_MASTER', 'HQ_DASHBOARD_VIEW', true, NOW(), NOW()),
('HQ_MASTER', 'BRANCH_VIEW', true, NOW(), NOW()),
('HQ_MASTER', 'BRANCH_MANAGE', true, NOW(), NOW()),
('HQ_MASTER', 'ERP_ACCESS', true, NOW(), NOW()),
('HQ_MASTER', 'ERP_DASHBOARD_VIEW', true, NOW(), NOW()),
('HQ_MASTER', 'INTEGRATED_FINANCE_VIEW', true, NOW(), NOW()),
('HQ_MASTER', 'PAYMENT_ACCESS', true, NOW(), NOW()),

-- CONSULTANT 권한
('CONSULTANT', 'SCHEDULE_VIEW', true, NOW(), NOW()),
('CONSULTANT', 'ERP_ACCESS', true, NOW(), NOW()),

-- CLIENT 권한
('CLIENT', 'SCHEDULE_VIEW', true, NOW(), NOW());

-- 3. 초기화 완료 확인
SELECT '권한 시스템 초기화 완료' as status, COUNT(*) as permission_count FROM permissions;
SELECT '역할별 권한 매핑 완료' as status, COUNT(*) as role_permission_count FROM role_permissions;
