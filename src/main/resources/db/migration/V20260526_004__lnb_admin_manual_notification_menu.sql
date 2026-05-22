-- =============================================================================
-- LNB: 설정(ADM_SETTINGS) 하위에 어드민 수동 알림 발송 메뉴 추가 (P1.2)
-- 인벤토리 권장 V20260524_004 → ordering 안전을 위해 V20260526_004 로 배치 (V20260526_002 LNB 마이그레이션 이후).
-- - 경로: /admin/manual-notification (ADMIN_ROUTES 와 동일 — P1.3 프론트에서 등록)
-- - 역할·플래그: ADM_SETTINGS_TEST_NOTIFICATION 과 동형(STAFF, ADMIN_ONLY)
-- - sort_order 10 고정(테스트 발송 9 다음). 컴플라이언스(ADM_REPORTS_COMP) 는 11 로 이동
-- - 멱등: INSERT 는 menu_code NOT EXISTS, UPDATE 는 고정 sort_order
-- =============================================================================

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_SETTINGS_MANUAL_NOTIFICATION', '수동 알림 발송', 'Manual Notification',
  '/admin/manual-notification',
  (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1) AS p),
  1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'BellRing', 10, 1,
  'SMS·카카오 알림톡 다중 사용자 수동 발송 도구(ADMIN/STAFF 전용, 배치 ID 추적)',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SETTINGS_MANUAL_NOTIFICATION');

UPDATE menus SET sort_order = 10, updated_at = CURRENT_TIMESTAMP
  WHERE menu_code = 'ADM_SETTINGS_MANUAL_NOTIFICATION';
UPDATE menus SET sort_order = 11, updated_at = CURRENT_TIMESTAMP
  WHERE menu_code = 'ADM_REPORTS_COMP';
