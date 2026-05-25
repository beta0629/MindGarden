-- =============================================================================
-- LNB: 설정(ADM_SETTINGS) 하위에 어드민 SMS 템플릿 관리 메뉴 추가 (hotfix)
-- - 배경: `feat/admin-sms-template-management` (a8d070ee6, 운영 정착) 에 LNB Flyway 시드가 누락
--   되어 운영/개발 모두 LNB 에 'SMS 템플릿 관리' 가 노출되지 않음 (frontend `menuItems.js`
--   `DEFAULT_MENU_ITEMS` 는 API 실패 시 폴백 — `menus` 테이블이 SSOT)
-- - 경로: /admin/sms-templates (= `ADMIN_ROUTES.SMS_TEMPLATES`)
-- - 역할: required_role='ADMIN', min_required_role='ADMIN'
--   - 백엔드 AdminSmsTemplateController: GET/preview = ADMIN·STAFF, PUT/DELETE = ADMIN.
--     쓰기 권한 기준으로 보수적으로 ADMIN 으로 게이트.
--   - `MenuServiceImpl.getLnbMenus` 의 ADMIN 가시 집합 {ADMIN,STAFF,CONSULTANT,CLIENT} 에
--     포함되어 ADMIN 사용자에게 정상 노출.
-- - menu_location = 'ADMIN_ONLY' → 어드민 LNB 전용
-- - sort_order 11 고정 (수동 알림 발송 10 다음). 컴플라이언스(ADM_REPORTS_COMP) 는 12 로 이동
-- - 멱등: INSERT 는 menu_code NOT EXISTS, UPDATE 는 고정 sort_order
-- - 멀티테넌트: `menus` 테이블은 전역 마스터 (테넌트 컬럼 없음) — 단일 row INSERT
-- - 운영 영향: menus 테이블에 row 1건 추가 + sort_order 일괄 갱신 (ADM_REPORTS_COMP 11 → 12)
-- =============================================================================

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_SETTINGS_SMS_TEMPLATE', 'SMS 템플릿 관리', 'SMS Template Management',
  '/admin/sms-templates',
  (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1) AS p),
  1, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'FileText', 11, 1,
  'SMS 본문 템플릿 글로벌·테넌트 override 관리 + 변수 미리보기 (ADMIN 전용)',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SETTINGS_SMS_TEMPLATE');

UPDATE menus SET sort_order = 11, updated_at = CURRENT_TIMESTAMP
  WHERE menu_code = 'ADM_SETTINGS_SMS_TEMPLATE';
UPDATE menus SET sort_order = 12, updated_at = CURRENT_TIMESTAMP
  WHERE menu_code = 'ADM_REPORTS_COMP';
