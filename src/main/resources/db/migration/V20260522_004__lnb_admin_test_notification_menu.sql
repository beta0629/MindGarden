-- LNB: 설정(ADM_SETTINGS) 하위에 어드민 알림 테스트 발송 메뉴 추가
-- - 경로는 `ADMIN_ROUTES.TEST_NOTIFICATION` 와 동일: /admin/test-notification
-- - 역할·플래그는 카카오 알림톡(ADM_SETTINGS_KAKAO_ALIMTALK)·문자 메시지(ADM_SETTINGS_TENANT_SMS)와 동형(STAFF)
--   - required_role/min_required_role = 'STAFF' → MenuServiceImpl.getLnbMenus 에서 ADMIN/STAFF 가시 (HQ_ADMIN/SUPER_ADMIN 은 switch 미매칭으로 제외)
-- - menu_location = 'ADMIN_ONLY' → 어드민 LNB 전용
-- - sort_order 9 고정(카카오 7·SMS 8 다음). 컴플라이언스(ADM_REPORTS_COMP) 등 기존 9는 10으로 정리
-- - 멀티테넌트: `menus` 테이블은 전역 마스터(테넌트 컬럼 없음) — 단일 row INSERT
-- - 멱등: INSERT 는 menu_code 기준 NOT EXISTS; UPDATE 는 menu_code 별 고정 sort_order
-- - 운영 영향: menus 테이블에 row 1건 추가 + sort_order 일괄 정렬(ADM_REPORTS_COMP 만 9 → 10 이동)

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, min_required_role, is_admin_only, menu_location, icon, sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_SETTINGS_TEST_NOTIFICATION', '알림 테스트 발송', 'Test Notification', '/admin/test-notification', (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1) AS p), 1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'Send', 9, 1, 'SMS·카카오 알림톡 테스트 발송 도구(ADMIN/STAFF 전용)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SETTINGS_TEST_NOTIFICATION');

-- 기대 순서(설정 하위): 테넌트 프로필 → 브랜딩 → 시스템 설정 → 공통코드 → 테넌트 공통코드 → PG → 카카오 알림톡 → 문자 메시지(SMS) → 알림 테스트 발송 → 컴플라이언스(동위 유지 시)
UPDATE menus SET sort_order = 1, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_TENANT';
UPDATE menus SET sort_order = 2, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_BRANDING';
UPDATE menus SET sort_order = 3, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_SYSTEM';
UPDATE menus SET sort_order = 4, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_CODES';
UPDATE menus SET sort_order = 5, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_TENANT_CODES';
UPDATE menus SET sort_order = 6, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_PG';
UPDATE menus SET sort_order = 7, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_KAKAO_ALIMTALK';
UPDATE menus SET sort_order = 8, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_TENANT_SMS';
UPDATE menus SET sort_order = 9, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS_TEST_NOTIFICATION';
UPDATE menus SET sort_order = 10, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_REPORTS_COMP';
