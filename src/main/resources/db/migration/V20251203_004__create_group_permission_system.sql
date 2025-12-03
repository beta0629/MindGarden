-- ========================================
-- 그룹 기반 권한 시스템 생성
-- 작성일: 2025-12-03
-- 목적: 대시보드 섹션별 그룹 권한 관리 시스템
-- ========================================

-- ========================================
-- 1. permission_groups 테이블 생성
-- ========================================

CREATE TABLE IF NOT EXISTS permission_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NULL COMMENT '테넌트 ID (NULL = 시스템 그룹)',
    
    -- 그룹 정보
    group_code VARCHAR(50) NOT NULL COMMENT '그룹 코드 (예: ERP_MANAGEMENT)',
    group_name VARCHAR(100) NOT NULL COMMENT '그룹명 (예: ERP 관리)',
    group_name_en VARCHAR(100) COMMENT '영문 그룹명',
    description TEXT COMMENT '그룹 설명',
    
    -- 그룹 타입
    group_type VARCHAR(20) NOT NULL COMMENT 'DASHBOARD_SECTION, MENU, FEATURE',
    parent_group_code VARCHAR(50) COMMENT '상위 그룹 코드',
    
    -- 메타데이터
    sort_order INT DEFAULT 0,
    icon VARCHAR(50) COMMENT '아이콘',
    color_code VARCHAR(7) COMMENT '색상 코드',
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_tenant_group_code (tenant_id, group_code),
    INDEX idx_group_type (group_type),
    INDEX idx_parent_group (parent_group_code),
    INDEX idx_active (is_active),
    INDEX idx_tenant (tenant_id)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='권한 그룹 테이블';

-- ========================================
-- 2. role_permission_groups 테이블 생성
-- ========================================

CREATE TABLE IF NOT EXISTS role_permission_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    tenant_role_id VARCHAR(36) NOT NULL COMMENT '테넌트 역할 ID',
    
    -- 그룹 권한
    permission_group_code VARCHAR(50) NOT NULL COMMENT '권한 그룹 코드',
    
    -- 권한 레벨
    access_level VARCHAR(20) DEFAULT 'READ' COMMENT 'READ, WRITE, FULL',
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_role_group (tenant_id, tenant_role_id, permission_group_code),
    INDEX idx_tenant_role (tenant_id, tenant_role_id),
    INDEX idx_group_code (permission_group_code),
    INDEX idx_active (is_active)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='역할별 권한 그룹 테이블';

-- ========================================
-- 3. 기본 권한 그룹 데이터 삽입 (시스템 그룹)
-- ========================================

-- 대시보드 섹션 그룹
INSERT INTO permission_groups (tenant_id, group_code, group_name, group_name_en, description, group_type, sort_order, icon, is_active) VALUES
(NULL, 'DASHBOARD_STATISTICS', '통계 섹션', 'Statistics Section', '대시보드 통계 섹션', 'DASHBOARD_SECTION', 1, 'graph-up', true),
(NULL, 'DASHBOARD_MANAGEMENT', '관리 섹션', 'Management Section', '대시보드 관리 섹션', 'DASHBOARD_SECTION', 2, 'folder', true),
(NULL, 'DASHBOARD_ERP', 'ERP 섹션', 'ERP Section', '대시보드 ERP 섹션 (관리자 전용)', 'DASHBOARD_SECTION', 3, 'building', true),
(NULL, 'DASHBOARD_SYSTEM', '시스템 섹션', 'System Section', '대시보드 시스템 섹션', 'DASHBOARD_SECTION', 4, 'gear', true)
ON DUPLICATE KEY UPDATE
    group_name = VALUES(group_name),
    description = VALUES(description);

-- 하위 통계 그룹
INSERT INTO permission_groups (tenant_id, group_code, group_name, group_name_en, description, group_type, parent_group_code, sort_order, is_active) VALUES
(NULL, 'STAT_USERS', '사용자 통계', 'User Statistics', '사용자 통계', 'DASHBOARD_SECTION', 'DASHBOARD_STATISTICS', 1, true),
(NULL, 'STAT_CONSULTATIONS', '상담 통계', 'Consultation Statistics', '상담 통계', 'DASHBOARD_SECTION', 'DASHBOARD_STATISTICS', 2, true),
(NULL, 'STAT_REVENUE', '매출 통계', 'Revenue Statistics', '매출 통계', 'DASHBOARD_SECTION', 'DASHBOARD_STATISTICS', 3, true)
ON DUPLICATE KEY UPDATE
    group_name = VALUES(group_name);

-- 하위 관리 그룹
INSERT INTO permission_groups (tenant_id, group_code, group_name, group_name_en, description, group_type, parent_group_code, sort_order, is_active) VALUES
(NULL, 'MGMT_USERS', '사용자 관리', 'User Management', '사용자 관리', 'DASHBOARD_SECTION', 'DASHBOARD_MANAGEMENT', 1, true),
(NULL, 'MGMT_SCHEDULES', '일정 관리', 'Schedule Management', '일정 관리', 'DASHBOARD_SECTION', 'DASHBOARD_MANAGEMENT', 2, true),
(NULL, 'MGMT_CONSULTANTS', '상담사 관리', 'Consultant Management', '상담사 관리', 'DASHBOARD_SECTION', 'DASHBOARD_MANAGEMENT', 3, true)
ON DUPLICATE KEY UPDATE
    group_name = VALUES(group_name);

-- 하위 ERP 그룹
INSERT INTO permission_groups (tenant_id, group_code, group_name, group_name_en, description, group_type, parent_group_code, sort_order, is_active) VALUES
(NULL, 'ERP_PURCHASE', '구매 관리', 'Purchase Management', '구매 관리', 'DASHBOARD_SECTION', 'DASHBOARD_ERP', 1, true),
(NULL, 'ERP_FINANCIAL', '재무 관리', 'Financial Management', '재무 관리', 'DASHBOARD_SECTION', 'DASHBOARD_ERP', 2, true),
(NULL, 'ERP_BUDGET', '예산 관리', 'Budget Management', '예산 관리', 'DASHBOARD_SECTION', 'DASHBOARD_ERP', 3, true),
(NULL, 'ERP_INVENTORY', '재고 관리', 'Inventory Management', '재고 관리', 'DASHBOARD_SECTION', 'DASHBOARD_ERP', 4, true)
ON DUPLICATE KEY UPDATE
    group_name = VALUES(group_name);

-- 하위 시스템 그룹
INSERT INTO permission_groups (tenant_id, group_code, group_name, group_name_en, description, group_type, parent_group_code, sort_order, is_active) VALUES
(NULL, 'SYS_SETTINGS', '설정', 'Settings', '시스템 설정', 'DASHBOARD_SECTION', 'DASHBOARD_SYSTEM', 1, true),
(NULL, 'SYS_CODES', '공통코드', 'Common Codes', '공통코드 관리', 'DASHBOARD_SECTION', 'DASHBOARD_SYSTEM', 2, true),
(NULL, 'SYS_LOGS', '로그', 'Logs', '시스템 로그', 'DASHBOARD_SECTION', 'DASHBOARD_SYSTEM', 3, true)
ON DUPLICATE KEY UPDATE
    group_name = VALUES(group_name);

-- ========================================
-- 4. 기본 역할별 그룹 권한 매핑 데이터 삽입
-- ========================================

-- 주의: tenant_roles 테이블에서 실제 역할 ID를 조회하여 매핑
-- 관리자 (ADMIN): 모든 그룹 접근
-- 사무원 (STAFF): ERP 제외
-- 상담사 (CONSULTANT): 통계만
-- 내담자 (CLIENT): 통계만

-- 관리자 권한은 온보딩 시 자동 부여되도록 설정
-- 여기서는 기본 구조만 생성

-- ========================================
-- 완료
-- ========================================

