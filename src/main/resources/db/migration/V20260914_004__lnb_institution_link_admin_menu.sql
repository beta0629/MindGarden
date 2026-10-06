-- =============================================================================
-- V20260914_004 — 어드민 LNB 「타기관 연계」 (배정·결제·환불 하위)
-- 폴백 DEFAULT_MENU_ITEMS 와 동일 path. 기존 회기 등록 화면 분기 없음.
-- =============================================================================

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_INSTITUTION_LINKS', '타기관 연계', 'Institution links',
       '/admin/institution-links',
       (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_MATCHING_PAYMENT_REFUND' LIMIT 1) AS p),
       1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'Building', 4, 1,
       '연계 기관 마스터 + 타기관 연계 등록 (회기 잔여·바우처 화면 아님)',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_INSTITUTION_LINKS');

UPDATE menus
SET menu_name = '타기관 연계',
    menu_path = '/admin/institution-links',
    parent_menu_id = (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_MATCHING_PAYMENT_REFUND' LIMIT 1) AS p),
    depth = 1,
    required_role = 'STAFF',
    min_required_role = 'STAFF',
    is_admin_only = 1,
    menu_location = 'ADMIN_ONLY',
    icon = 'Building',
    sort_order = 4,
    is_active = 1,
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_INSTITUTION_LINKS';
