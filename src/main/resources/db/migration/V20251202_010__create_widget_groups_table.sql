-- =====================================================
-- 위젯 그룹 테이블 생성
-- =====================================================
-- 목적: 업종별/역할별 위젯 그룹 관리
-- 작성일: 2025-12-02
-- 표준: DATABASE_SCHEMA_STANDARD.md 준수
-- =====================================================

CREATE TABLE IF NOT EXISTS widget_groups (
    -- ✅ 기본 키
    group_id VARCHAR(50) PRIMARY KEY COMMENT '위젯 그룹 ID (UUID)',
    
    -- ✅ 표준: 테넌트 격리
    tenant_id VARCHAR(50) NULL COMMENT '테넌트 ID (NULL이면 시스템 그룹)',
    
    -- ✅ 그룹 정보
    group_name VARCHAR(100) NOT NULL COMMENT '그룹명',
    group_name_ko VARCHAR(100) NOT NULL COMMENT '그룹명 (한글)',
    group_name_en VARCHAR(100) NULL COMMENT '그룹명 (영문)',
    
    -- ✅ 업종 및 역할
    business_type VARCHAR(50) NOT NULL COMMENT '업종 (CONSULTATION, ACADEMY, HOSPITAL, FOOD_SERVICE, RETAIL)',
    role_code VARCHAR(50) NOT NULL COMMENT '역할 코드 (ADMIN, CONSULTANT, CLIENT, STAFF)',
    
    -- ✅ 표시 정보
    display_order INT NOT NULL DEFAULT 1 COMMENT '표시 순서',
    description TEXT NULL COMMENT '설명',
    icon_name VARCHAR(50) NULL COMMENT '아이콘 이름',
    
    -- ✅ 표준: 활성화 플래그
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '활성화 여부',
    
    -- ✅ 표준: 감사 필드
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    created_by VARCHAR(100) NULL COMMENT '생성자',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    updated_by VARCHAR(100) NULL COMMENT '수정자',
    
    -- ✅ 표준: 소프트 삭제
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '삭제 여부',
    deleted_at TIMESTAMP NULL COMMENT '삭제일시',
    deleted_by VARCHAR(100) NULL COMMENT '삭제자',
    
    -- ✅ 표준: 인덱스
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_business_type_role (business_type, role_code),
    INDEX idx_tenant_business_role (tenant_id, business_type, role_code),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_display_order (display_order)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='위젯 그룹 테이블 (업종별/역할별 위젯 그룹 관리)';

-- =====================================================
-- 초기 데이터: 시스템 위젯 그룹 (상담소)
-- =====================================================

-- 상담소 - ADMIN
INSERT INTO widget_groups (
    group_id, tenant_id, group_name, group_name_ko, group_name_en,
    business_type, role_code, display_order, description, icon_name,
    is_active, created_by
) VALUES
-- 핵심 위젯 그룹
('consultation-admin-core', NULL, '핵심 위젯', '핵심 위젯', 'Core Widgets',
 'CONSULTATION', 'ADMIN', 1, '필수 핵심 위젯', 'star', TRUE, 'SYSTEM'),

-- 관리 위젯 그룹
('consultation-admin-management', NULL, '관리 위젯', '관리 위젯', 'Management Widgets',
 'CONSULTATION', 'ADMIN', 2, '상담사/내담자/회기 관리', 'users', TRUE, 'SYSTEM'),

-- 통계 위젯 그룹
('consultation-admin-statistics', NULL, '통계 위젯', '통계 위젯', 'Statistics Widgets',
 'CONSULTATION', 'ADMIN', 3, '통계 및 분석', 'bar-chart', TRUE, 'SYSTEM'),

-- 시스템 위젯 그룹
('consultation-admin-system', NULL, '시스템 위젯', '시스템 위젯', 'System Widgets',
 'CONSULTATION', 'ADMIN', 4, 'ERP 및 시스템 관리', 'settings', TRUE, 'SYSTEM');

-- 상담소 - CONSULTANT
INSERT INTO widget_groups (
    group_id, tenant_id, group_name, group_name_ko, group_name_en,
    business_type, role_code, display_order, description, icon_name,
    is_active, created_by
) VALUES
('consultation-consultant-core', NULL, '핵심 위젯', '핵심 위젯', 'Core Widgets',
 'CONSULTATION', 'CONSULTANT', 1, '필수 핵심 위젯', 'star', TRUE, 'SYSTEM'),

('consultation-consultant-session', NULL, '상담 위젯', '상담 위젯', 'Session Widgets',
 'CONSULTATION', 'CONSULTANT', 2, '상담 및 회기 관리', 'calendar', TRUE, 'SYSTEM'),

('consultation-consultant-client', NULL, '내담자 위젯', '내담자 위젯', 'Client Widgets',
 'CONSULTATION', 'CONSULTANT', 3, '내담자 관리', 'user', TRUE, 'SYSTEM');

-- 상담소 - CLIENT
INSERT INTO widget_groups (
    group_id, tenant_id, group_name, group_name_ko, group_name_en,
    business_type, role_code, display_order, description, icon_name,
    is_active, created_by
) VALUES
('consultation-client-core', NULL, '핵심 위젯', '핵심 위젯', 'Core Widgets',
 'CONSULTATION', 'CLIENT', 1, '필수 핵심 위젯', 'star', TRUE, 'SYSTEM'),

('consultation-client-session', NULL, '상담 위젯', '상담 위젯', 'Session Widgets',
 'CONSULTATION', 'CLIENT', 2, '내 상담 정보', 'calendar', TRUE, 'SYSTEM');

-- 상담소 - STAFF
INSERT INTO widget_groups (
    group_id, tenant_id, group_name, group_name_ko, group_name_en,
    business_type, role_code, display_order, description, icon_name,
    is_active, created_by
) VALUES
('consultation-staff-core', NULL, '핵심 위젯', '핵심 위젯', 'Core Widgets',
 'CONSULTATION', 'STAFF', 1, '필수 핵심 위젯', 'star', TRUE, 'SYSTEM'),

('consultation-staff-management', NULL, '관리 위젯', '관리 위젯', 'Management Widgets',
 'CONSULTATION', 'STAFF', 2, '상담사/내담자/회기 관리', 'users', TRUE, 'SYSTEM'),

('consultation-staff-statistics', NULL, '통계 위젯', '통계 위젯', 'Statistics Widgets',
 'CONSULTATION', 'STAFF', 3, '통계 및 분석', 'bar-chart', TRUE, 'SYSTEM'),

('consultation-staff-system', NULL, '시스템 위젯', '시스템 위젯', 'System Widgets',
 'CONSULTATION', 'STAFF', 4, 'ERP 및 시스템 관리', 'settings', TRUE, 'SYSTEM');

-- =====================================================
-- 초기 데이터: 시스템 위젯 그룹 (학원)
-- =====================================================

-- 학원 - ADMIN
INSERT INTO widget_groups (
    group_id, tenant_id, group_name, group_name_ko, group_name_en,
    business_type, role_code, display_order, description, icon_name,
    is_active, created_by
) VALUES
('academy-admin-core', NULL, '핵심 위젯', '핵심 위젯', 'Core Widgets',
 'ACADEMY', 'ADMIN', 1, '필수 핵심 위젯', 'star', TRUE, 'SYSTEM'),

('academy-admin-management', NULL, '관리 위젯', '관리 위젯', 'Management Widgets',
 'ACADEMY', 'ADMIN', 2, '강사/학생/학부모 관리', 'users', TRUE, 'SYSTEM'),

('academy-admin-academic', NULL, '학사 위젯', '학사 위젯', 'Academic Widgets',
 'ACADEMY', 'ADMIN', 3, '출결/성적/수업 관리', 'book', TRUE, 'SYSTEM'),

('academy-admin-system', NULL, '시스템 위젯', '시스템 위젯', 'System Widgets',
 'ACADEMY', 'ADMIN', 4, '청구 및 시스템 관리', 'settings', TRUE, 'SYSTEM');

