-- PermissionMatrix 마이그레이션: 정적 권한 매트릭스를 데이터베이스로 이동
-- 작성일: 2025-11-20
-- 목적: PermissionMatrix의 메뉴 그룹, API 패턴, 기능 권한을 데이터베이스 기반으로 전환
-- 주의: 이 마이그레이션은 레거시 시스템(consultation.entity.RolePermission)을 위한 것입니다.
--       레거시 시스템은 role_name을 사용하므로, role_permissions 테이블에 role_name 컬럼이 있어야 합니다.
--       만약 role_name 컬럼이 없다면, 이 마이그레이션 전에 컬럼을 추가해야 합니다.

-- 레거시 시스템 호환을 위한 스키마 수정
-- 1. tenant_role_id를 NULL 허용으로 변경 (레거시 시스템용)
ALTER TABLE role_permissions 
MODIFY COLUMN tenant_role_id VARCHAR(36) NULL COMMENT '테넌트 역할 ID (레거시 시스템은 NULL)';

-- 2. role_name 컬럼 추가 (없는 경우)
SET @dbname = DATABASE();
SET @tablename = 'role_permissions';
SET @columnname = 'role_name';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1', -- 컬럼이 이미 존재하면 아무것도 하지 않음
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(50) NULL COMMENT ''역할명 (레거시 호환)''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 3. is_active 컬럼 추가 (없는 경우)
SET @columnname = 'is_active';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1', -- 컬럼이 이미 존재하면 아무것도 하지 않음
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' BOOLEAN DEFAULT TRUE COMMENT ''활성 여부 (레거시 호환)''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================
-- 1. 메뉴 그룹 권한 정의
-- ============================================
INSERT INTO permissions (permission_code, permission_name, permission_description, category, is_active, created_at, updated_at)
VALUES
('MENU_GROUP_COMMON', '공통 메뉴 접근', '공통 메뉴 그룹에 접근할 수 있는 권한', 'MENU', TRUE, NOW(), NOW()),
('MENU_GROUP_CLIENT', '내담자 메뉴 접근', '내담자 메뉴 그룹에 접근할 수 있는 권한', 'MENU', TRUE, NOW(), NOW()),
('MENU_GROUP_CONSULTANT', '상담사 메뉴 접근', '상담사 메뉴 그룹에 접근할 수 있는 권한', 'MENU', TRUE, NOW(), NOW()),
('MENU_GROUP_ADMIN', '관리자 메뉴 접근', '관리자 메뉴 그룹에 접근할 수 있는 권한', 'MENU', TRUE, NOW(), NOW()),
('MENU_GROUP_HQ_ADMIN', '본사 관리자 메뉴 접근', '본사 관리자 메뉴 그룹에 접근할 수 있는 권한', 'MENU', TRUE, NOW(), NOW()),
('MENU_GROUP_BRANCH_SUPER_ADMIN', '지점 수퍼 관리자 메뉴 접근', '지점 수퍼 관리자 메뉴 그룹에 접근할 수 있는 권한', 'MENU', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    permission_name = VALUES(permission_name),
    permission_description = VALUES(permission_description),
    category = VALUES(category),
    updated_at = NOW();

-- ============================================
-- 2. API 패턴 권한 정의
-- ============================================
INSERT INTO permissions (permission_code, permission_name, permission_description, category, is_active, created_at, updated_at)
VALUES
('API_ACCESS_AUTH', '인증 API 접근', '/api/auth/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_MENU', '메뉴 API 접근', '/api/menu/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_USER', '사용자 API 접근', '/api/user/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_USERS', '사용자 목록 API 접근', '/api/users/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_CLIENT', '내담자 API 접근', '/api/client/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_CONSULTANT', '상담사 API 접근', '/api/consultant/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_CONSULTATIONS', '상담 API 접근', '/api/v1/consultations/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_CONSULTATION_MESSAGES', '상담 메시지 API 접근', '/api/consultation-messages/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_SCHEDULES', '스케줄 API 접근', '/api/schedules/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_RATINGS', '평점 API 접근', '/api/ratings/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_MOTIVATION', '동기부여 API 접근', '/api/motivation/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_SMS_AUTH', 'SMS 인증 API 접근', '/api/sms-auth/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_ADMIN', '관리자 API 접근', '/api/admin/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_HQ', '본사 API 접근', '/api/hq/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_ERP', 'ERP API 접근', '/api/erp/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_PAYMENTS', '결제 API 접근', '/api/payments/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_ACCOUNTS', '계정 API 접근', '/api/accounts/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_BRANCHES', '지점 API 접근', '/api/branches/** 패턴의 API에 접근할 수 있는 권한', 'API', TRUE, NOW(), NOW()),
('API_ACCESS_ALL', '모든 API 접근', '/api/** 패턴의 모든 API에 접근할 수 있는 권한 (HQ_MASTER 전용)', 'API', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    permission_name = VALUES(permission_name),
    permission_description = VALUES(permission_description),
    category = VALUES(category),
    updated_at = NOW();

-- ============================================
-- 3. 기능 권한 정의 (기존 권한과 중복 확인 후 추가)
-- ============================================
INSERT INTO permissions (permission_code, permission_name, permission_description, category, is_active, created_at, updated_at)
VALUES
('VIEW_OWN_PROFILE', '본인 프로필 조회', '본인의 프로필 정보를 조회할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('EDIT_OWN_PROFILE', '본인 프로필 수정', '본인의 프로필 정보를 수정할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('VIEW_OWN_CONSULTATIONS', '본인 상담 조회', '본인의 상담 내역을 조회할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('VIEW_ASSIGNED_CONSULTATIONS', '배정된 상담 조회', '배정된 상담 내역을 조회할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('VIEW_ALL_CONSULTATIONS', '모든 상담 조회', '모든 상담 내역을 조회할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('CREATE_CONSULTATION_REQUEST', '상담 요청 생성', '새로운 상담 요청을 생성할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('UPDATE_CONSULTATION_STATUS', '상담 상태 변경', '상담 상태를 변경할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('SEND_MESSAGE', '메시지 전송', '메시지를 전송할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('RATE_CONSULTANT', '상담사 평가', '상담사를 평가할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('VIEW_CLIENT_RATINGS', '내담자 평가 조회', '내담자의 평가를 조회할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('VIEW_RATINGS', '평가 조회', '평가 정보를 조회할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('VIEW_ALL_RATINGS', '모든 평가 조회', '모든 평가 정보를 조회할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('VIEW_MOTIVATION', '동기부여 조회', '동기부여 콘텐츠를 조회할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('MANAGE_SCHEDULE', '스케줄 관리', '본인의 스케줄을 관리할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('MANAGE_SCHEDULES', '스케줄 관리 (전체)', '모든 스케줄을 관리할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('MANAGE_ALL_SCHEDULES', '모든 스케줄 관리', '모든 지점의 스케줄을 관리할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('MANAGE_USERS', '사용자 관리', '사용자를 관리할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('MANAGE_ALL_USERS', '모든 사용자 관리', '모든 지점의 사용자를 관리할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('MANAGE_CONSULTANTS', '상담사 관리', '상담사를 관리할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('MANAGE_ALL_CONSULTANTS', '모든 상담사 관리', '모든 지점의 상담사를 관리할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('MANAGE_CLIENTS', '내담자 관리', '내담자를 관리할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('MANAGE_ALL_CLIENTS', '모든 내담자 관리', '모든 지점의 내담자를 관리할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('VIEW_STATISTICS', '통계 조회', '통계 정보를 조회할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('VIEW_ALL_STATISTICS', '모든 통계 조회', '모든 지점의 통계 정보를 조회할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('MANAGE_BRANCH_SETTINGS', '지점 설정 관리', '지점 설정을 관리할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('MANAGE_ALL_BRANCHES', '모든 지점 관리', '모든 지점을 관리할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('MANAGE_ERP', 'ERP 관리', 'ERP 시스템을 관리할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('MANAGE_PAYMENTS', '결제 관리', '결제를 관리할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('MANAGE_ACCOUNTS', '계정 관리', '계정을 관리할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('APPROVE_PURCHASE_REQUESTS', '구매 요청 승인', '구매 요청을 승인할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('MANAGE_SYSTEM_SETTINGS', '시스템 설정 관리', '시스템 설정을 관리할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('MANAGE_ADMIN_USERS', '관리자 사용자 관리', '관리자 사용자를 관리할 수 있는 권한', 'FEATURE', TRUE, NOW(), NOW()),
('ALL_FEATURES', '모든 기능 접근', '모든 기능에 접근할 수 있는 권한 (HQ_MASTER 전용)', 'FEATURE', TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    permission_name = VALUES(permission_name),
    permission_description = VALUES(permission_description),
    category = VALUES(category),
    updated_at = NOW();

-- ============================================
-- 4. 역할별 메뉴 그룹 권한 매핑 (레거시 시스템용 - role_name 사용)
-- ============================================
-- 주의: 이 섹션은 레거시 시스템(consultation.entity.RolePermission)을 위한 것입니다.
--       tenant_role_id는 NULL로 설정됩니다.
-- CLIENT (내담자)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('CLIENT', 'MENU_GROUP_COMMON', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CLIENT', 'MENU_GROUP_CLIENT', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- CONSULTANT (상담사)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('CONSULTANT', 'MENU_GROUP_COMMON', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'MENU_GROUP_CONSULTANT', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- ADMIN (지점 관리자)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('ADMIN', 'MENU_GROUP_COMMON', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'MENU_GROUP_ADMIN', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- BRANCH_SUPER_ADMIN (지점 수퍼 관리자)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('BRANCH_SUPER_ADMIN', 'MENU_GROUP_COMMON', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MENU_GROUP_ADMIN', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MENU_GROUP_BRANCH_SUPER_ADMIN', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- HQ_ADMIN (본사 관리자)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('HQ_ADMIN', 'MENU_GROUP_COMMON', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'MENU_GROUP_HQ_ADMIN', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- SUPER_HQ_ADMIN (본사 고급 관리자)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('SUPER_HQ_ADMIN', 'MENU_GROUP_COMMON', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'MENU_GROUP_HQ_ADMIN', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- HQ_MASTER (본사 총관리자) - 모든 메뉴 접근 가능
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('HQ_MASTER', 'MENU_GROUP_COMMON', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_MASTER', 'MENU_GROUP_ADMIN', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_MASTER', 'MENU_GROUP_HQ_ADMIN', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_MASTER', 'MENU_GROUP_BRANCH_SUPER_ADMIN', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_MASTER', 'MENU_GROUP_CONSULTANT', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_MASTER', 'MENU_GROUP_CLIENT', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- BRANCH_MANAGER (지점장) - 기존 호환성
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('BRANCH_MANAGER', 'MENU_GROUP_COMMON', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'MENU_GROUP_ADMIN', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- HQ_SUPER_ADMIN (본사 최고관리자) - 기존 호환성
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('HQ_SUPER_ADMIN', 'MENU_GROUP_COMMON', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'MENU_GROUP_HQ_ADMIN', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- ============================================
-- 5. 역할별 API 패턴 권한 매핑
-- ============================================
-- CLIENT (내담자)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('CLIENT', 'API_ACCESS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CLIENT', 'API_ACCESS_MENU', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CLIENT', 'API_ACCESS_USER', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CLIENT', 'API_ACCESS_CLIENT', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CLIENT', 'API_ACCESS_CONSULTATIONS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CLIENT', 'API_ACCESS_CONSULTATION_MESSAGES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CLIENT', 'API_ACCESS_SCHEDULES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CLIENT', 'API_ACCESS_RATINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CLIENT', 'API_ACCESS_MOTIVATION', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CLIENT', 'API_ACCESS_SMS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- CONSULTANT (상담사)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('CONSULTANT', 'API_ACCESS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'API_ACCESS_MENU', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'API_ACCESS_USER', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'API_ACCESS_CONSULTANT', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'API_ACCESS_CONSULTATIONS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'API_ACCESS_CONSULTATION_MESSAGES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'API_ACCESS_SCHEDULES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'API_ACCESS_RATINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'API_ACCESS_MOTIVATION', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'API_ACCESS_SMS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- ADMIN (지점 관리자)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('ADMIN', 'API_ACCESS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'API_ACCESS_MENU', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'API_ACCESS_USER', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'API_ACCESS_USERS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'API_ACCESS_ADMIN', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'API_ACCESS_CONSULTATION_MESSAGES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'API_ACCESS_SCHEDULES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'API_ACCESS_RATINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'API_ACCESS_MOTIVATION', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'API_ACCESS_BRANCHES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'API_ACCESS_SMS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- BRANCH_SUPER_ADMIN (지점 수퍼 관리자)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('BRANCH_SUPER_ADMIN', 'API_ACCESS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'API_ACCESS_MENU', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'API_ACCESS_USER', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'API_ACCESS_USERS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'API_ACCESS_ADMIN', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'API_ACCESS_CONSULTATION_MESSAGES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'API_ACCESS_ERP', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'API_ACCESS_PAYMENTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'API_ACCESS_ACCOUNTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'API_ACCESS_SCHEDULES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'API_ACCESS_RATINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'API_ACCESS_MOTIVATION', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'API_ACCESS_BRANCHES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'API_ACCESS_SMS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- HQ_ADMIN (본사 관리자)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('HQ_ADMIN', 'API_ACCESS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'API_ACCESS_MENU', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'API_ACCESS_USER', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'API_ACCESS_USERS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'API_ACCESS_HQ', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'API_ACCESS_CONSULTATION_MESSAGES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'API_ACCESS_SCHEDULES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'API_ACCESS_RATINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'API_ACCESS_MOTIVATION', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'API_ACCESS_BRANCHES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'API_ACCESS_SMS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- SUPER_HQ_ADMIN (본사 고급 관리자)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('SUPER_HQ_ADMIN', 'API_ACCESS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'API_ACCESS_MENU', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'API_ACCESS_USER', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'API_ACCESS_USERS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'API_ACCESS_ADMIN', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'API_ACCESS_HQ', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'API_ACCESS_CONSULTATION_MESSAGES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'API_ACCESS_SCHEDULES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'API_ACCESS_RATINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'API_ACCESS_MOTIVATION', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'API_ACCESS_BRANCHES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'API_ACCESS_SMS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- HQ_MASTER (본사 총관리자) - 모든 API 접근 가능
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('HQ_MASTER', 'API_ACCESS_ALL', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- BRANCH_MANAGER (지점장) - 기존 호환성
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('BRANCH_MANAGER', 'API_ACCESS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'API_ACCESS_MENU', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'API_ACCESS_USER', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'API_ACCESS_USERS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'API_ACCESS_ADMIN', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'API_ACCESS_SCHEDULES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'API_ACCESS_RATINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'API_ACCESS_MOTIVATION', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'API_ACCESS_BRANCHES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'API_ACCESS_SMS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- HQ_SUPER_ADMIN (본사 최고관리자) - 기존 호환성
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('HQ_SUPER_ADMIN', 'API_ACCESS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'API_ACCESS_MENU', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'API_ACCESS_USER', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'API_ACCESS_USERS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'API_ACCESS_ADMIN', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'API_ACCESS_HQ', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'API_ACCESS_SCHEDULES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'API_ACCESS_RATINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'API_ACCESS_MOTIVATION', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'API_ACCESS_BRANCHES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'API_ACCESS_SMS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- ============================================
-- 6. 역할별 기능 권한 매핑
-- ============================================
-- CLIENT (내담자)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('CLIENT', 'VIEW_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CLIENT', 'EDIT_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CLIENT', 'VIEW_OWN_CONSULTATIONS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CLIENT', 'CREATE_CONSULTATION_REQUEST', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CLIENT', 'SEND_MESSAGE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CLIENT', 'RATE_CONSULTANT', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CLIENT', 'VIEW_MOTIVATION', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- CONSULTANT (상담사)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('CONSULTANT', 'VIEW_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'EDIT_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'VIEW_ASSIGNED_CONSULTATIONS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'UPDATE_CONSULTATION_STATUS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'SEND_MESSAGE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'VIEW_CLIENT_RATINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'VIEW_MOTIVATION', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('CONSULTANT', 'MANAGE_SCHEDULE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- ADMIN (지점 관리자)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('ADMIN', 'VIEW_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'EDIT_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'VIEW_ALL_CONSULTATIONS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'MANAGE_USERS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'MANAGE_CONSULTANTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'MANAGE_CLIENTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'VIEW_STATISTICS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'MANAGE_SCHEDULES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'VIEW_RATINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('ADMIN', 'MANAGE_BRANCH_SETTINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- BRANCH_SUPER_ADMIN (지점 수퍼 관리자)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('BRANCH_SUPER_ADMIN', 'VIEW_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'EDIT_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'VIEW_ALL_CONSULTATIONS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MANAGE_USERS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MANAGE_CONSULTANTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MANAGE_CLIENTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'VIEW_STATISTICS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MANAGE_SCHEDULES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'VIEW_RATINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MANAGE_BRANCH_SETTINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MANAGE_ERP', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MANAGE_PAYMENTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MANAGE_ACCOUNTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'APPROVE_PURCHASE_REQUESTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- HQ_ADMIN (본사 관리자)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('HQ_ADMIN', 'VIEW_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'EDIT_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'VIEW_ALL_CONSULTATIONS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'MANAGE_ALL_USERS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'MANAGE_ALL_CONSULTANTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'MANAGE_ALL_CLIENTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'VIEW_ALL_STATISTICS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'MANAGE_ALL_SCHEDULES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'VIEW_ALL_RATINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'MANAGE_ALL_BRANCHES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_ADMIN', 'MANAGE_SYSTEM_SETTINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- SUPER_HQ_ADMIN (본사 고급 관리자)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('SUPER_HQ_ADMIN', 'VIEW_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'EDIT_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'VIEW_ALL_CONSULTATIONS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'MANAGE_ALL_USERS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'MANAGE_ALL_CONSULTANTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'MANAGE_ALL_CLIENTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'VIEW_ALL_STATISTICS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'MANAGE_ALL_SCHEDULES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'VIEW_ALL_RATINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'MANAGE_ALL_BRANCHES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'MANAGE_SYSTEM_SETTINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'MANAGE_ADMIN_USERS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- HQ_MASTER (본사 총관리자) - 모든 기능 접근 가능
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('HQ_MASTER', 'ALL_FEATURES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- BRANCH_MANAGER (지점장) - 기존 호환성
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('BRANCH_MANAGER', 'VIEW_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'EDIT_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'VIEW_ALL_CONSULTATIONS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'MANAGE_USERS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'MANAGE_CONSULTANTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'MANAGE_CLIENTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'VIEW_STATISTICS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'MANAGE_SCHEDULES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'VIEW_RATINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('BRANCH_MANAGER', 'MANAGE_BRANCH_SETTINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

-- HQ_SUPER_ADMIN (본사 최고관리자) - 기존 호환성
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
VALUES
('HQ_SUPER_ADMIN', 'VIEW_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'EDIT_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'VIEW_ALL_CONSULTATIONS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'MANAGE_ALL_USERS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'MANAGE_ALL_CONSULTANTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'MANAGE_ALL_CLIENTS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'VIEW_ALL_STATISTICS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'MANAGE_ALL_SCHEDULES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'VIEW_ALL_RATINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'MANAGE_ALL_BRANCHES', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()),
('HQ_SUPER_ADMIN', 'MANAGE_SYSTEM_SETTINGS', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = TRUE,
    updated_at = NOW();

