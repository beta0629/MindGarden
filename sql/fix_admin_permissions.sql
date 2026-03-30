-- ADMIN 역할에 필요한 권한 추가
-- 콘솔 403 오류 해결을 위한 권한 설정

-- 1. 필요한 권한들이 permissions 테이블에 존재하는지 확인하고 없으면 추가
INSERT INTO permissions (permission_code, permission_name, permission_description, category, is_active, created_at, updated_at)
VALUES 
    ('CONSULTANT_MANAGE', '상담사 관리', '상담사 정보를 조회하고 관리할 수 있는 권한', 'ADMIN', TRUE, NOW(), NOW()),
    ('REPORT_VIEW', '리포트 조회', '각종 통계 및 리포트를 조회할 수 있는 권한', 'STATISTICS', TRUE, NOW(), NOW()),
    ('DASHBOARD_VIEW', '대시보드 조회', '관리자 대시보드를 조회할 수 있는 권한', 'ADMIN', TRUE, NOW(), NOW()),
    ('MESSAGE_VIEW', '메시지 조회', '상담 메시지를 조회할 수 있는 권한', 'COMMUNICATION', TRUE, NOW(), NOW()),
    ('NOTIFICATION_VIEW', '알림 조회', '시스템 알림을 조회할 수 있는 권한', 'COMMUNICATION', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- 2. ADMIN 역할에 권한 추가
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES 
    ('ADMIN', 'CONSULTANT_MANAGE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
    ('ADMIN', 'REPORT_VIEW', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
    ('ADMIN', 'DASHBOARD_VIEW', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
    ('ADMIN', 'MESSAGE_VIEW', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
    ('ADMIN', 'NOTIFICATION_VIEW', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- 권한 캐시 무효화를 위한 더미 업데이트
UPDATE role_permissions SET updated_at = NOW() WHERE role_name = 'ADMIN' AND is_active = TRUE;
