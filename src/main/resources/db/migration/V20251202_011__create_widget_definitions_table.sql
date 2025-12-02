-- =====================================================
-- 위젯 정의 테이블 생성
-- =====================================================
-- 목적: 개별 위젯 정의 및 권한 관리
-- 작성일: 2025-12-02
-- 표준: DATABASE_SCHEMA_STANDARD.md 준수
-- =====================================================

CREATE TABLE IF NOT EXISTS widget_definitions (
    -- ✅ 기본 키
    widget_id VARCHAR(50) PRIMARY KEY COMMENT '위젯 ID (UUID)',
    
    -- ✅ 표준: 테넌트 격리
    tenant_id VARCHAR(50) NULL COMMENT '테넌트 ID (NULL이면 시스템 위젯)',
    
    -- ✅ 위젯 정보
    widget_type VARCHAR(100) NOT NULL COMMENT '위젯 타입 (welcome, summary-panels, statistics-grid 등)',
    widget_name VARCHAR(100) NOT NULL COMMENT '위젯명',
    widget_name_ko VARCHAR(100) NOT NULL COMMENT '위젯명 (한글)',
    widget_name_en VARCHAR(100) NULL COMMENT '위젯명 (영문)',
    
    -- ✅ 그룹 연결 (NULL이면 독립 위젯)
    group_id VARCHAR(50) NULL COMMENT '위젯 그룹 ID (NULL이면 독립 위젯)',
    
    -- ✅ 업종 및 역할
    business_type VARCHAR(50) NOT NULL COMMENT '업종',
    role_code VARCHAR(50) NULL COMMENT '역할 코드 (NULL이면 모든 역할)',
    
    -- ✅ 위젯 설정
    default_config JSON NULL COMMENT '기본 설정 (JSON)',
    display_order INT NOT NULL DEFAULT 1 COMMENT '표시 순서',
    description TEXT NULL COMMENT '설명',
    icon_name VARCHAR(50) NULL COMMENT '아이콘 이름',
    
    -- ✅ 표준: 권한 관리 필드
    is_system_managed BOOLEAN NOT NULL DEFAULT TRUE COMMENT '시스템 관리 여부',
    is_required BOOLEAN NOT NULL DEFAULT FALSE COMMENT '필수 위젯 여부',
    is_deletable BOOLEAN NOT NULL DEFAULT FALSE COMMENT '삭제 가능 여부',
    is_movable BOOLEAN NOT NULL DEFAULT TRUE COMMENT '이동 가능 여부',
    is_configurable BOOLEAN NOT NULL DEFAULT TRUE COMMENT '설정 변경 가능 여부',
    
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
    
    -- ✅ 표준: 외래키
    FOREIGN KEY (group_id) REFERENCES widget_groups(group_id) ON DELETE SET NULL,
    
    -- ✅ 표준: 인덱스
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_group_id (group_id),
    INDEX idx_widget_type (widget_type),
    INDEX idx_business_type_role (business_type, role_code),
    INDEX idx_tenant_business_role (tenant_id, business_type, role_code),
    INDEX idx_is_system_managed (is_system_managed),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_display_order (display_order)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='위젯 정의 테이블 (개별 위젯 정의 및 권한 관리)';

-- =====================================================
-- 초기 데이터: 시스템 위젯 (상담소 - ADMIN)
-- =====================================================

INSERT INTO widget_definitions (
    widget_id, tenant_id, widget_type, widget_name, widget_name_ko, widget_name_en,
    group_id, business_type, role_code, default_config, display_order,
    is_system_managed, is_required, is_deletable, is_movable, is_configurable,
    is_active, created_by
) VALUES
-- 핵심 위젯 그룹
('consultation-admin-welcome', NULL, 'welcome', '환영 위젯', '환영 위젯', 'Welcome Widget',
 'consultation-admin-core', 'CONSULTATION', 'ADMIN', 
 '{"refreshInterval": 30000}', 1,
 TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-admin-summary', NULL, 'summary-panels', '요약 패널', '요약 패널', 'Summary Panels',
 'consultation-admin-core', 'CONSULTATION', 'ADMIN',
 '{"refreshInterval": 60000}', 2,
 TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- 관리 위젯 그룹
('consultation-admin-consultant-mgmt', NULL, 'consultant-management', '상담사 관리', '상담사 관리', 'Consultant Management',
 'consultation-admin-management', 'CONSULTATION', 'ADMIN',
 '{"showQuickActions": true, "pageSize": 10}', 1,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-admin-client-mgmt', NULL, 'client-management', '내담자 관리', '내담자 관리', 'Client Management',
 'consultation-admin-management', 'CONSULTATION', 'ADMIN',
 '{"showQuickActions": true, "pageSize": 10}', 2,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-admin-session-mgmt', NULL, 'session-management', '회기 관리', '회기 관리', 'Session Management',
 'consultation-admin-management', 'CONSULTATION', 'ADMIN',
 '{"showProgress": true, "pageSize": 10}', 3,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- 통계 위젯 그룹
('consultation-admin-statistics', NULL, 'statistics-grid', '통계 그리드', '통계 그리드', 'Statistics Grid',
 'consultation-admin-statistics', 'CONSULTATION', 'ADMIN',
 '{"refreshInterval": 300000, "chartType": "bar"}', 1,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-admin-consultation-summary', NULL, 'consultation-summary', '상담 요약', '상담 요약', 'Consultation Summary',
 'consultation-admin-statistics', 'CONSULTATION', 'ADMIN',
 '{"period": "month", "showChart": true}', 2,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

-- 시스템 위젯 그룹
('consultation-admin-erp', NULL, 'erp-management', 'ERP 관리', 'ERP 관리', 'ERP Management',
 'consultation-admin-system', 'CONSULTATION', 'ADMIN',
 '{"showBudget": true, "showExpenses": true}', 1,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM'),

('consultation-admin-activities', NULL, 'recent-activities', '최근 활동', '최근 활동', 'Recent Activities',
 'consultation-admin-system', 'CONSULTATION', 'ADMIN',
 '{"limit": 10, "showTimestamp": true}', 2,
 TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 'SYSTEM');

-- =====================================================
-- 초기 데이터: 독립 위젯 템플릿 (사용자가 추가 가능)
-- =====================================================

INSERT INTO widget_definitions (
    widget_id, tenant_id, widget_type, widget_name, widget_name_ko, widget_name_en,
    group_id, business_type, role_code, default_config, display_order,
    is_system_managed, is_required, is_deletable, is_movable, is_configurable,
    is_active, created_by
) VALUES
-- 독립 위젯 (그룹 없음, 사용자 추가 가능)
('custom-chart-template', NULL, 'custom-chart', '커스텀 차트', '커스텀 차트', 'Custom Chart',
 NULL, 'CONSULTATION', NULL,
 '{"chartType": "line", "dataSource": "custom"}', 999,
 FALSE, FALSE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

('custom-table-template', NULL, 'custom-table', '커스텀 테이블', '커스텀 테이블', 'Custom Table',
 NULL, 'CONSULTATION', NULL,
 '{"columns": [], "pageSize": 10}', 999,
 FALSE, FALSE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM'),

('custom-memo-template', NULL, 'custom-memo', '메모 위젯', '메모 위젯', 'Memo Widget',
 NULL, 'CONSULTATION', NULL,
 '{"maxLength": 500, "showTimestamp": true}', 999,
 FALSE, FALSE, TRUE, TRUE, TRUE, TRUE, 'SYSTEM');

