-- ========================================
-- LNB 메뉴 구조 (메인/서브) - 스펙 2장·5.3
-- 작성일: 2026-02-25
-- 목적: LNB 전용 menu_code (ADM_*, CLT_*, CST_*, HQ_*) INSERT
--       기존 SYSTEM_ADMIN, ERP_MAIN 등과 중복 없이 WHERE NOT EXISTS 사용
-- ========================================

-- ----------------------------------------
-- 1. 어드민 메인 메뉴 (1 depth, parent_menu_id NULL)
-- ----------------------------------------

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT * FROM (
    SELECT 'ADM_DASHBOARD' AS menu_code, '대시보드' AS menu_name, 'Dashboard' AS menu_name_en, '/admin/dashboard-v2' AS menu_path, NULL AS parent_menu_id, 0 AS depth, 'ADMIN' AS required_role, 'ADMIN' AS min_required_role, 1 AS is_admin_only, 'ADMIN_ONLY' AS menu_location, 'LayoutDashboard' AS icon, 10 AS sort_order, 1 AS is_active, '어드민 대시보드' AS description, CURRENT_TIMESTAMP AS created_at, CURRENT_TIMESTAMP AS updated_at
    UNION ALL SELECT 'ADM_MAPPING', '매칭 관리', 'Mapping', '/admin/mapping-management', NULL, 0, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'Link', 20, 1, '매칭 관리', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    UNION ALL SELECT 'ADM_USERS', '사용자/권한', 'Users', '#', NULL, 0, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'Users', 30, 1, '사용자·권한·계좌', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    UNION ALL SELECT 'ADM_ERP', 'ERP 관리', 'ERP', '/erp/dashboard', NULL, 0, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'LayoutDashboard', 40, 1, 'ERP 대시보드·구매·재무·예산·세무', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    UNION ALL SELECT 'ADM_SETTINGS', '설정', 'Settings', '#', NULL, 0, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'Settings', 50, 1, '테넌트·시스템·공통코드·PG', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    UNION ALL SELECT 'ADM_REPORTS', '보고서', 'Reports', '#', NULL, 0, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'FileText', 60, 1, '통계·컴플라이언스', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    UNION ALL SELECT 'ADM_NOTIFICATIONS', '알림', 'Notifications', '/admin/system-notifications', NULL, 0, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'MessageCircle', 70, 1, '시스템 알림', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
) AS t
WHERE NOT EXISTS (SELECT 1 FROM menus m WHERE m.menu_code = t.menu_code);

-- ----------------------------------------
-- 2. 어드민 서브 — ADM_USERS (사용자/권한)
-- ----------------------------------------

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_USERS_LIST', '사용자 관리', 'User List', '/admin/user-management', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_USERS' LIMIT 1) AS p), 1, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'Users', 1, 1, '사용자 관리', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_USERS_LIST');

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_PERMISSIONS', '권한 관리', 'Permissions', '/admin/permissions', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_USERS' LIMIT 1) AS p), 1, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'FileText', 2, 1, '권한 관리', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_PERMISSIONS');

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_ACCOUNTS', '계좌 관리', 'Accounts', '/admin/accounts', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_USERS' LIMIT 1) AS p), 1, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'CreditCard', 3, 1, '계좌 관리', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_ACCOUNTS');

-- ----------------------------------------
-- 3. 어드민 서브 — ADM_ERP (기존 ERP_*를 ADM_ERP 하위로 연결)
--     기존 ERP_DASHBOARD 등이 있으면 parent를 ADM_ERP로 변경
-- ----------------------------------------

SET @adm_erp_id = (SELECT id FROM menus WHERE menu_code = 'ADM_ERP' LIMIT 1);
UPDATE menus
SET parent_menu_id = @adm_erp_id, depth = 1
WHERE menu_code IN ('ERP_DASHBOARD', 'ERP_PURCHASE', 'ERP_FINANCIAL', 'ERP_BUDGET', 'ERP_TAX')
  AND @adm_erp_id IS NOT NULL;

-- ----------------------------------------
-- 4. 어드민 서브 — ADM_SETTINGS
-- ----------------------------------------

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_SETTINGS_TENANT', '테넌트 프로필', 'Tenant Profile', '/tenant/profile', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1) AS p), 1, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'Settings', 1, 1, '테넌트 프로필', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SETTINGS_TENANT');

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_SETTINGS_SYSTEM', '시스템 설정', 'System Config', '/admin/system-config', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1) AS p), 1, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'Settings', 2, 1, '시스템 설정', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SETTINGS_SYSTEM');

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_SETTINGS_CODES', '공통코드', 'Common Codes', '/admin/common-codes', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1) AS p), 1, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'FileText', 3, 1, '공통코드', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SETTINGS_CODES');

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_SETTINGS_PG', 'PG 설정', 'PG Config', '/tenant/pg-configuration', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1) AS p), 1, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'CreditCard', 4, 1, 'PG 설정', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SETTINGS_PG');

-- ----------------------------------------
-- 5. 어드민 서브 — ADM_REPORTS
-- ----------------------------------------

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_REPORTS_STAT', '통계', 'Statistics', '/admin/statistics', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_REPORTS' LIMIT 1) AS p), 1, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'FileText', 1, 1, '통계', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_REPORTS_STAT');

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_REPORTS_COMP', '컴플라이언스', 'Compliance', '/admin/compliance', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_REPORTS' LIMIT 1) AS p), 1, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'FileText', 2, 1, '컴플라이언스', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_REPORTS_COMP');

-- ----------------------------------------
-- 6. 내담자(CLIENT) 메인 메뉴 (플랫)
-- ----------------------------------------

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT * FROM (
    SELECT 'CLT_DASHBOARD' AS menu_code, '대시보드' AS menu_name, 'Dashboard' AS menu_name_en, '/client/dashboard' AS menu_path, NULL AS parent_menu_id, 0 AS depth, 'CLIENT' AS required_role, 'CLIENT' AS min_required_role, 0 AS is_admin_only, 'CLIENT' AS menu_location, 'LayoutDashboard' AS icon, 10 AS sort_order, 1 AS is_active, '내담자 대시보드' AS description, CURRENT_TIMESTAMP AS created_at, CURRENT_TIMESTAMP AS updated_at
    UNION ALL SELECT 'CLT_SCHEDULE', '스케줄', 'Schedule', '/client/schedule', NULL, 0, 'CLIENT', 'CLIENT', 0, 'CLIENT', 'Calendar', 20, 1, '스케줄', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    UNION ALL SELECT 'CLT_SESSIONS', '회기 관리', 'Sessions', '/client/session-management', NULL, 0, 'CLIENT', 'CLIENT', 0, 'CLIENT', 'FileText', 30, 1, '회기 관리', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    UNION ALL SELECT 'CLT_PAYMENT', '결제 내역', 'Payment', '/client/payment-history', NULL, 0, 'CLIENT', 'CLIENT', 0, 'CLIENT', 'CreditCard', 40, 1, '결제 내역', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    UNION ALL SELECT 'CLT_SETTINGS', '설정', 'Settings', '/client/settings', NULL, 0, 'CLIENT', 'CLIENT', 0, 'CLIENT', 'Settings', 50, 1, '설정', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
) AS t
WHERE NOT EXISTS (SELECT 1 FROM menus m WHERE m.menu_code = t.menu_code);

-- ----------------------------------------
-- 7. 상담사(CONSULTANT) 메인 메뉴 (플랫)
-- ----------------------------------------

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT * FROM (
    SELECT 'CST_DASHBOARD' AS menu_code, '대시보드' AS menu_name, 'Dashboard' AS menu_name_en, '/consultant/dashboard' AS menu_path, NULL AS parent_menu_id, 0 AS depth, 'CONSULTANT' AS required_role, 'CONSULTANT' AS min_required_role, 0 AS is_admin_only, 'CONSULTANT' AS menu_location, 'LayoutDashboard' AS icon, 10 AS sort_order, 1 AS is_active, '상담사 대시보드' AS description, CURRENT_TIMESTAMP AS created_at, CURRENT_TIMESTAMP AS updated_at
    UNION ALL SELECT 'CST_SCHEDULE', '스케줄', 'Schedule', '/consultant/schedule', NULL, 0, 'CONSULTANT', 'CONSULTANT', 0, 'CONSULTANT', 'Calendar', 20, 1, '스케줄', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    UNION ALL SELECT 'CST_RECORDS', '상담 기록', 'Records', '/consultant/consultation-records', NULL, 0, 'CONSULTANT', 'CONSULTANT', 0, 'CONSULTANT', 'FileText', 30, 1, '상담 기록', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    UNION ALL SELECT 'CST_AVAILABILITY', '가능 시간', 'Availability', '/consultant/availability', NULL, 0, 'CONSULTANT', 'CONSULTANT', 0, 'CONSULTANT', 'Calendar', 40, 1, '가능 시간', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    UNION ALL SELECT 'CST_MESSAGES', '메시지', 'Messages', '/consultant/messages', NULL, 0, 'CONSULTANT', 'CONSULTANT', 0, 'CONSULTANT', 'MessageCircle', 50, 1, '메시지', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
) AS t
WHERE NOT EXISTS (SELECT 1 FROM menus m WHERE m.menu_code = t.menu_code);

-- ----------------------------------------
-- 8. HQ(본사) 메인 메뉴 (선택, menu_location = HQ)
-- ----------------------------------------

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT * FROM (
    SELECT 'HQ_DASHBOARD' AS menu_code, '대시보드' AS menu_name, 'HQ Dashboard' AS menu_name_en, '/hq/dashboard' AS menu_path, NULL AS parent_menu_id, 0 AS depth, 'ADMIN' AS required_role, 'ADMIN' AS min_required_role, 1 AS is_admin_only, 'HQ' AS menu_location, 'LayoutDashboard' AS icon, 10 AS sort_order, 1 AS is_active, 'HQ 대시보드' AS description, CURRENT_TIMESTAMP AS created_at, CURRENT_TIMESTAMP AS updated_at
    UNION ALL SELECT 'HQ_BRANCH', '지점 관리', 'Branch', '/hq/branch-management', NULL, 0, 'ADMIN', 'ADMIN', 1, 'HQ', 'Building2', 20, 1, '지점 관리', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    UNION ALL SELECT 'HQ_FIN_BRANCH', '지점별 재무', 'Branch Financial', '/hq/erp/branch-financial', NULL, 0, 'ADMIN', 'ADMIN', 1, 'HQ', 'DollarSign', 30, 1, '지점별 재무', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    UNION ALL SELECT 'HQ_FIN_CONSOL', '통합 재무', 'Consolidated', '/hq/erp/consolidated', NULL, 0, 'ADMIN', 'ADMIN', 1, 'HQ', 'BarChart3', 40, 1, '통합 재무', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    UNION ALL SELECT 'HQ_REPORTS', '재무 보고서', 'Reports', '/hq/erp/reports', NULL, 0, 'ADMIN', 'ADMIN', 1, 'HQ', 'FileText', 50, 1, '재무 보고서', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
) AS t
WHERE NOT EXISTS (SELECT 1 FROM menus m WHERE m.menu_code = t.menu_code);

-- ----------------------------------------
-- STAFF도 어드민 LNB 메뉴 접근 가능하도록 required_role 보완
--     (스펙 4.1: STAFF는 O* 조건부 노출; API에서 권한으로 필터)
-- ----------------------------------------
UPDATE menus SET required_role = 'STAFF', min_required_role = 'STAFF'
WHERE menu_code IN ('ADM_DASHBOARD', 'ADM_MAPPING', 'ADM_USERS', 'ADM_NOTIFICATIONS', 'ADM_SETTINGS', 'ADM_REPORTS')
  AND required_role = 'ADMIN';

UPDATE menus SET required_role = 'STAFF', min_required_role = 'STAFF'
WHERE menu_code IN ('ADM_USERS_LIST', 'ADM_PERMISSIONS', 'ADM_ACCOUNTS', 'ADM_SETTINGS_TENANT', 'ADM_SETTINGS_SYSTEM', 'ADM_SETTINGS_CODES', 'ADM_SETTINGS_PG', 'ADM_REPORTS_STAT', 'ADM_REPORTS_COMP')
  AND required_role = 'ADMIN';

-- ADM_ERP 및 ERP_* 는 ADMIN만 유지 (STAFF는 ERP_ACCESS 권한 시 API에서 포함)
-- 완료
