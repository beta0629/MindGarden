-- =====================================================
-- STAFF 위젯 그룹 추가
-- =====================================================
-- 작성일: 2025-12-03
-- 목적: CONSULTATION 비즈니스 타입의 STAFF 역할에 대한 위젯 그룹 추가

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
 'CONSULTATION', 'STAFF', 4, 'ERP 및 시스템 관리', 'settings', TRUE, 'SYSTEM')
ON DUPLICATE KEY UPDATE
    group_name_ko = VALUES(group_name_ko),
    group_name_en = VALUES(group_name_en),
    description = VALUES(description),
    icon_name = VALUES(icon_name),
    is_active = VALUES(is_active);

