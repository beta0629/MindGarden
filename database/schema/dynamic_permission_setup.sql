-- 동적 권한 시스템 구축을 위한 SQL 스크립트

-- 1. 권한 정의 테이블
CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    permission_code VARCHAR(100) NOT NULL UNIQUE,
    permission_name VARCHAR(200) NOT NULL,
    permission_description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. 역할별 권한 매핑 테이블
CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    permission_code VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    granted_by VARCHAR(100),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role_permission (role_name, permission_code)
);

-- 3. 기본 권한 정의
INSERT INTO permissions (permission_code, permission_name, permission_description, category) VALUES
-- ERP 관련 권한
('ACCESS_ERP_DASHBOARD', 'ERP 대시보드 접근', 'ERP 메인 대시보드에 접근할 수 있는 권한', 'ERP'),
('ACCESS_INTEGRATED_FINANCE', '통합 회계 시스템 접근', '통합 회계 시스템에 접근할 수 있는 권한', 'ERP'),
('ACCESS_SALARY_MANAGEMENT', '급여 관리 접근', '급여 관리 시스템에 접근할 수 있는 권한', 'ERP'),
('ACCESS_TAX_MANAGEMENT', '세금 관리 접근', '세금 관리 시스템에 접근할 수 있는 권한', 'ERP'),
('ACCESS_REFUND_MANAGEMENT', '환불 관리 접근', '환불 관리 시스템에 접근할 수 있는 권한', 'ERP'),
('ACCESS_PURCHASE_REQUESTS', '구매 요청 접근', '구매 요청 시스템에 접근할 수 있는 권한', 'ERP'),
('ACCESS_APPROVAL_MANAGEMENT', '승인 관리 접근', '승인 관리 시스템에 접근할 수 있는 권한', 'ERP'),
('ACCESS_ITEM_MANAGEMENT', '아이템 관리 접근', '아이템 관리 시스템에 접근할 수 있는 권한', 'ERP'),
('ACCESS_BUDGET_MANAGEMENT', '예산 관리 접근', '예산 관리 시스템에 접근할 수 있는 권한', 'ERP'),

-- 관리자 권한
('ACCESS_ADMIN_DASHBOARD', '관리자 대시보드 접근', '관리자 대시보드에 접근할 수 있는 권한', 'ADMIN'),
('MANAGE_USERS', '사용자 관리', '사용자를 추가/수정/삭제할 수 있는 권한', 'ADMIN'),
('MANAGE_CONSULTANTS', '상담사 관리', '상담사를 추가/수정/삭제할 수 있는 권한', 'ADMIN'),
('MANAGE_CLIENTS', '내담자 관리', '내담자를 추가/수정/삭제할 수 있는 권한', 'ADMIN'),
('MANAGE_MAPPINGS', '매핑 관리', '상담사-내담자 매핑을 관리할 수 있는 권한', 'ADMIN'),
('VIEW_ALL_BRANCHES', '모든 지점 조회', '모든 지점의 데이터를 조회할 수 있는 권한', 'ADMIN'),
('VIEW_BRANCH_DETAILS', '지점 상세 조회', '지점별 상세 정보를 조회할 수 있는 권한', 'ADMIN'),

-- 스케줄 관련 권한
('ACCESS_SCHEDULE_MANAGEMENT', '스케줄 관리 접근', '스케줄 관리 시스템에 접근할 수 있는 권한', 'SCHEDULE'),
('CREATE_SCHEDULES', '스케줄 생성', '새로운 스케줄을 생성할 수 있는 권한', 'SCHEDULE'),
('MODIFY_SCHEDULES', '스케줄 수정', '기존 스케줄을 수정할 수 있는 권한', 'SCHEDULE'),
('DELETE_SCHEDULES', '스케줄 삭제', '스케줄을 삭제할 수 있는 권한', 'SCHEDULE'),

-- 상담일지 관련 권한
('ACCESS_CONSULTATION_RECORDS', '상담일지 접근', '상담일지에 접근할 수 있는 권한', 'CONSULTATION'),
('CREATE_CONSULTATION_RECORDS', '상담일지 작성', '상담일지를 작성할 수 있는 권한', 'CONSULTATION'),
('MODIFY_CONSULTATION_RECORDS', '상담일지 수정', '상담일지를 수정할 수 있는 권한', 'CONSULTATION'),

-- 통계 관련 권한
('ACCESS_STATISTICS', '통계 접근', '통계 데이터에 접근할 수 있는 권한', 'STATISTICS'),
('VIEW_FINANCIAL_STATISTICS', '재무 통계 조회', '재무 관련 통계를 조회할 수 있는 권한', 'STATISTICS'),
('VIEW_CONSULTATION_STATISTICS', '상담 통계 조회', '상담 관련 통계를 조회할 수 있는 권한', 'STATISTICS'),

-- 시스템 관리 권한
('SYSTEM_CONFIGURATION', '시스템 설정', '시스템 설정을 변경할 수 있는 권한', 'SYSTEM'),
('USER_ROLE_MANAGEMENT', '사용자 역할 관리', '사용자의 역할을 변경할 수 있는 권한', 'SYSTEM'),
('PERMISSION_MANAGEMENT', '권한 관리', '시스템 권한을 관리할 수 있는 권한', 'SYSTEM');

-- 4. 역할별 권한 매핑 설정
-- BRANCH_SUPER_ADMIN 권한
INSERT INTO role_permissions (role_name, permission_code, granted_by) VALUES
('BRANCH_SUPER_ADMIN', 'ACCESS_ERP_DASHBOARD', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'ACCESS_INTEGRATED_FINANCE', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'ACCESS_SALARY_MANAGEMENT', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'ACCESS_TAX_MANAGEMENT', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'ACCESS_REFUND_MANAGEMENT', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'ACCESS_PURCHASE_REQUESTS', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'ACCESS_APPROVAL_MANAGEMENT', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'ACCESS_ITEM_MANAGEMENT', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'ACCESS_BUDGET_MANAGEMENT', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'ACCESS_ADMIN_DASHBOARD', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'MANAGE_USERS', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'MANAGE_CONSULTANTS', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'MANAGE_CLIENTS', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'MANAGE_MAPPINGS', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'VIEW_BRANCH_DETAILS', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'ACCESS_SCHEDULE_MANAGEMENT', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'CREATE_SCHEDULES', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'MODIFY_SCHEDULES', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'DELETE_SCHEDULES', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'ACCESS_CONSULTATION_RECORDS', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'ACCESS_STATISTICS', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'VIEW_FINANCIAL_STATISTICS', 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'VIEW_CONSULTATION_STATISTICS', 'SYSTEM');

-- ADMIN 권한
INSERT INTO role_permissions (role_name, permission_code, granted_by) VALUES
('ADMIN', 'ACCESS_ERP_DASHBOARD', 'SYSTEM'),
('ADMIN', 'ACCESS_INTEGRATED_FINANCE', 'SYSTEM'),
('ADMIN', 'ACCESS_SALARY_MANAGEMENT', 'SYSTEM'),
('ADMIN', 'ACCESS_TAX_MANAGEMENT', 'SYSTEM'),
('ADMIN', 'ACCESS_REFUND_MANAGEMENT', 'SYSTEM'),
('ADMIN', 'ACCESS_PURCHASE_REQUESTS', 'SYSTEM'),
('ADMIN', 'ACCESS_APPROVAL_MANAGEMENT', 'SYSTEM'),
('ADMIN', 'ACCESS_ITEM_MANAGEMENT', 'SYSTEM'),
('ADMIN', 'ACCESS_BUDGET_MANAGEMENT', 'SYSTEM'),
('ADMIN', 'ACCESS_ADMIN_DASHBOARD', 'SYSTEM'),
('ADMIN', 'MANAGE_USERS', 'SYSTEM'),
('ADMIN', 'MANAGE_CONSULTANTS', 'SYSTEM'),
('ADMIN', 'MANAGE_CLIENTS', 'SYSTEM'),
('ADMIN', 'MANAGE_MAPPINGS', 'SYSTEM'),
('ADMIN', 'VIEW_ALL_BRANCHES', 'SYSTEM'),
('ADMIN', 'VIEW_BRANCH_DETAILS', 'SYSTEM'),
('ADMIN', 'ACCESS_SCHEDULE_MANAGEMENT', 'SYSTEM'),
('ADMIN', 'CREATE_SCHEDULES', 'SYSTEM'),
('ADMIN', 'MODIFY_SCHEDULES', 'SYSTEM'),
('ADMIN', 'DELETE_SCHEDULES', 'SYSTEM'),
('ADMIN', 'ACCESS_CONSULTATION_RECORDS', 'SYSTEM'),
('ADMIN', 'ACCESS_STATISTICS', 'SYSTEM'),
('ADMIN', 'VIEW_FINANCIAL_STATISTICS', 'SYSTEM'),
('ADMIN', 'VIEW_CONSULTATION_STATISTICS', 'SYSTEM');

-- HQ_ADMIN 권한
INSERT INTO role_permissions (role_name, permission_code, granted_by) VALUES
('HQ_ADMIN', 'ACCESS_ERP_DASHBOARD', 'SYSTEM'),
('HQ_ADMIN', 'ACCESS_INTEGRATED_FINANCE', 'SYSTEM'),
('HQ_ADMIN', 'ACCESS_SALARY_MANAGEMENT', 'SYSTEM'),
('HQ_ADMIN', 'ACCESS_TAX_MANAGEMENT', 'SYSTEM'),
('HQ_ADMIN', 'ACCESS_REFUND_MANAGEMENT', 'SYSTEM'),
('HQ_ADMIN', 'ACCESS_PURCHASE_REQUESTS', 'SYSTEM'),
('HQ_ADMIN', 'ACCESS_APPROVAL_MANAGEMENT', 'SYSTEM'),
('HQ_ADMIN', 'ACCESS_ITEM_MANAGEMENT', 'SYSTEM'),
('HQ_ADMIN', 'ACCESS_BUDGET_MANAGEMENT', 'SYSTEM'),
('HQ_ADMIN', 'ACCESS_ADMIN_DASHBOARD', 'SYSTEM'),
('HQ_ADMIN', 'MANAGE_USERS', 'SYSTEM'),
('HQ_ADMIN', 'MANAGE_CONSULTANTS', 'SYSTEM'),
('HQ_ADMIN', 'MANAGE_CLIENTS', 'SYSTEM'),
('HQ_ADMIN', 'MANAGE_MAPPINGS', 'SYSTEM'),
('HQ_ADMIN', 'VIEW_BRANCH_DETAILS', 'SYSTEM'),
('HQ_ADMIN', 'ACCESS_SCHEDULE_MANAGEMENT', 'SYSTEM'),
('HQ_ADMIN', 'ACCESS_STATISTICS', 'SYSTEM'),
('HQ_ADMIN', 'VIEW_FINANCIAL_STATISTICS', 'SYSTEM'),
('HQ_ADMIN', 'VIEW_CONSULTATION_STATISTICS', 'SYSTEM');

-- SUPER_HQ_ADMIN 권한
INSERT INTO role_permissions (role_name, permission_code, granted_by) VALUES
('SUPER_HQ_ADMIN', 'ACCESS_ERP_DASHBOARD', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'ACCESS_INTEGRATED_FINANCE', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'ACCESS_SALARY_MANAGEMENT', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'ACCESS_TAX_MANAGEMENT', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'ACCESS_REFUND_MANAGEMENT', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'ACCESS_PURCHASE_REQUESTS', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'ACCESS_APPROVAL_MANAGEMENT', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'ACCESS_ITEM_MANAGEMENT', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'ACCESS_BUDGET_MANAGEMENT', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'ACCESS_ADMIN_DASHBOARD', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'MANAGE_USERS', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'MANAGE_CONSULTANTS', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'MANAGE_CLIENTS', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'MANAGE_MAPPINGS', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'VIEW_ALL_BRANCHES', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'VIEW_BRANCH_DETAILS', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'ACCESS_SCHEDULE_MANAGEMENT', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'ACCESS_STATISTICS', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'VIEW_FINANCIAL_STATISTICS', 'SYSTEM'),
('SUPER_HQ_ADMIN', 'VIEW_CONSULTATION_STATISTICS', 'SYSTEM');

-- HQ_MASTER 권한 (모든 권한)
INSERT INTO role_permissions (role_name, permission_code, granted_by) VALUES
('HQ_MASTER', 'ACCESS_ERP_DASHBOARD', 'SYSTEM'),
('HQ_MASTER', 'ACCESS_INTEGRATED_FINANCE', 'SYSTEM'),
('HQ_MASTER', 'ACCESS_SALARY_MANAGEMENT', 'SYSTEM'),
('HQ_MASTER', 'ACCESS_TAX_MANAGEMENT', 'SYSTEM'),
('HQ_MASTER', 'ACCESS_REFUND_MANAGEMENT', 'SYSTEM'),
('HQ_MASTER', 'ACCESS_PURCHASE_REQUESTS', 'SYSTEM'),
('HQ_MASTER', 'ACCESS_APPROVAL_MANAGEMENT', 'SYSTEM'),
('HQ_MASTER', 'ACCESS_ITEM_MANAGEMENT', 'SYSTEM'),
('HQ_MASTER', 'ACCESS_BUDGET_MANAGEMENT', 'SYSTEM'),
('HQ_MASTER', 'ACCESS_ADMIN_DASHBOARD', 'SYSTEM'),
('HQ_MASTER', 'MANAGE_USERS', 'SYSTEM'),
('HQ_MASTER', 'MANAGE_CONSULTANTS', 'SYSTEM'),
('HQ_MASTER', 'MANAGE_CLIENTS', 'SYSTEM'),
('HQ_MASTER', 'MANAGE_MAPPINGS', 'SYSTEM'),
('HQ_MASTER', 'VIEW_ALL_BRANCHES', 'SYSTEM'),
('HQ_MASTER', 'VIEW_BRANCH_DETAILS', 'SYSTEM'),
('HQ_MASTER', 'ACCESS_SCHEDULE_MANAGEMENT', 'SYSTEM'),
('HQ_MASTER', 'CREATE_SCHEDULES', 'SYSTEM'),
('HQ_MASTER', 'MODIFY_SCHEDULES', 'SYSTEM'),
('HQ_MASTER', 'DELETE_SCHEDULES', 'SYSTEM'),
('HQ_MASTER', 'ACCESS_CONSULTATION_RECORDS', 'SYSTEM'),
('HQ_MASTER', 'CREATE_CONSULTATION_RECORDS', 'SYSTEM'),
('HQ_MASTER', 'MODIFY_CONSULTATION_RECORDS', 'SYSTEM'),
('HQ_MASTER', 'ACCESS_STATISTICS', 'SYSTEM'),
('HQ_MASTER', 'VIEW_FINANCIAL_STATISTICS', 'SYSTEM'),
('HQ_MASTER', 'VIEW_CONSULTATION_STATISTICS', 'SYSTEM'),
('HQ_MASTER', 'SYSTEM_CONFIGURATION', 'SYSTEM'),
('HQ_MASTER', 'USER_ROLE_MANAGEMENT', 'SYSTEM'),
('HQ_MASTER', 'PERMISSION_MANAGEMENT', 'SYSTEM');

-- CONSULTANT 권한 (제한적)
INSERT INTO role_permissions (role_name, permission_code, granted_by) VALUES
('CONSULTANT', 'ACCESS_SCHEDULE_MANAGEMENT', 'SYSTEM'),
('CONSULTANT', 'CREATE_SCHEDULES', 'SYSTEM'),
('CONSULTANT', 'MODIFY_SCHEDULES', 'SYSTEM'),
('CONSULTANT', 'ACCESS_CONSULTATION_RECORDS', 'SYSTEM'),
('CONSULTANT', 'CREATE_CONSULTATION_RECORDS', 'SYSTEM'),
('CONSULTANT', 'ACCESS_STATISTICS', 'SYSTEM'),
('CONSULTANT', 'VIEW_CONSULTATION_STATISTICS', 'SYSTEM');

-- CLIENT 권한 (최소한)
INSERT INTO role_permissions (role_name, permission_code, granted_by) VALUES
('CLIENT', 'ACCESS_CONSULTATION_RECORDS', 'SYSTEM');

-- 5. 인덱스 생성
CREATE INDEX idx_permissions_code ON permissions(permission_code);
CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_name);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_code);
CREATE INDEX idx_role_permissions_active ON role_permissions(is_active);

-- 6. 뷰 생성 (권한 체크용)
CREATE VIEW user_permissions AS
SELECT 
    rp.role_name,
    rp.permission_code,
    p.permission_name,
    p.permission_description,
    p.category,
    rp.is_active,
    rp.granted_by,
    rp.granted_at
FROM role_permissions rp
JOIN permissions p ON rp.permission_code = p.permission_code
WHERE rp.is_active = TRUE AND p.is_active = TRUE;

-- 7. 권한 체크용 저장 프로시저
DELIMITER //

CREATE PROCEDURE CheckUserPermission(
    IN p_role_name VARCHAR(50),
    IN p_permission_code VARCHAR(100),
    OUT p_has_permission BOOLEAN,
    OUT p_permission_info TEXT
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_permission_name VARCHAR(200);
    DECLARE v_permission_description TEXT;
    
    -- 권한 확인
    SELECT COUNT(*), permission_name, permission_description
    INTO v_count, v_permission_name, v_permission_description
    FROM user_permissions
    WHERE role_name = p_role_name 
    AND permission_code = p_permission_code;
    
    SET p_has_permission = (v_count > 0);
    
    IF p_has_permission THEN
        SET p_permission_info = CONCAT('권한 있음: ', v_permission_name, ' - ', v_permission_description);
    ELSE
        SET p_permission_info = CONCAT('권한 없음: ', p_permission_code, ' (역할: ', p_role_name, ')');
    END IF;
END //

DELIMITER ;

-- 8. 권한 목록 조회용 저장 프로시저
DELIMITER //

CREATE PROCEDURE GetUserPermissions(
    IN p_role_name VARCHAR(50)
)
BEGIN
    SELECT 
        permission_code,
        permission_name,
        permission_description,
        category,
        granted_by,
        granted_at
    FROM user_permissions
    WHERE role_name = p_role_name
    ORDER BY category, permission_name;
END //

DELIMITER ;
