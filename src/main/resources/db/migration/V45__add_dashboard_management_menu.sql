-- 대시보드 관리 메뉴 추가
-- 관리자 메뉴의 시스템 관리 서브 메뉴에 추가

INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
-- 관리자 메뉴: 시스템 관리 서브 메뉴에 대시보드 관리 추가
('ADMIN_MENU', 'ADMIN_DASHBOARD_MANAGEMENT', '대시보드 관리', '역할별 대시보드 및 위젯 관리', 35, true, '{"icon": "bi-layout-text-window", "path": "/admin/dashboards", "parent": "SYSTEM_MAIN", "type": "sub"}', NOW(), NOW(), false, 1)
ON DUPLICATE KEY UPDATE
    code_label = '대시보드 관리',
    code_description = '역할별 대시보드 및 위젯 관리',
    extra_data = '{"icon": "bi-layout-text-window", "path": "/admin/dashboards", "parent": "SYSTEM_MAIN", "type": "sub"}',
    updated_at = NOW(),
    is_deleted = false;

-- 본사 관리자 메뉴에도 추가
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at, is_deleted, version) VALUES
('HQ_ADMIN_MENU', 'HQ_DASHBOARD_MANAGEMENT', '대시보드 관리', '역할별 대시보드 및 위젯 관리', 35, true, '{"icon": "bi-layout-text-window", "path": "/admin/dashboards", "parent": "HQ_SYSTEM_MAIN", "type": "sub"}', NOW(), NOW(), false, 1)
ON DUPLICATE KEY UPDATE
    code_label = '대시보드 관리',
    code_description = '역할별 대시보드 및 위젯 관리',
    extra_data = '{"icon": "bi-layout-text-window", "path": "/admin/dashboards", "parent": "HQ_SYSTEM_MAIN", "type": "sub"}',
    updated_at = NOW(),
    is_deleted = false;

