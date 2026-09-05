-- =============================================================================
-- V20260905_001 — 센터 어드민 LNB 정리 P0/P1
--
-- 목적:
--   P0 hide: 센터 LNB에서 불필요 항목 비활성 (라우트·페이지 유지, 메뉴만 is_active=0)
--   P1 placement/dedupe: 상담·기록 그룹, 계정·권한 라벨, 디러티 매칭 정리 배선,
--                        메시지 발송을 알림·메시지 하위로 이동
--
-- IA 결정 (짧게):
--   1) 상담일지 → 1차 그룹 ADM_CONSULTATION_RECORDS 「상담·기록」(sort=18) + 자식 이동
--   2) ADM_USERS 라벨 → 「계정·권한」; ADM_USERS_LIST 비활성 (1차 ADM_USER_MANAGEMENT 유지)
--   3) FE-only 디러티 매칭 정리 → ADM_MAPPINGS_PENDING_PAYMENT_CLEANUP INSERT
--
-- 정책: DELETE 금지. UPDATE / INSERT … WHERE NOT EXISTS 만.
-- 멱등: is_active=0 은 is_active=1 인 행만; INSERT 는 menu_code NOT EXISTS.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- P0 — hide (is_active=0, 멱등: is_active=1 인 행만)
-- -----------------------------------------------------------------------------

-- P0-1) ADM_PG_OPS_APPROVAL — 센터 LNB 숨김 (path /admin/ops/pg-approval 유지)
UPDATE menus
SET is_active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_PG_OPS_APPROVAL'
  AND is_active = 1;

-- P0-2) ADM_SETTINGS_CODES — 공통코드 숨김 (센터 코드 ADM_SETTINGS_TENANT_CODES 등 유지)
UPDATE menus
SET is_active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_SETTINGS_CODES'
  AND is_active = 1;

-- P0-3) ADM_SETTINGS_TEST_NOTIFICATION — 알림 테스트 발송 숨김
UPDATE menus
SET is_active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_SETTINGS_TEST_NOTIFICATION'
  AND is_active = 1;

-- -----------------------------------------------------------------------------
-- P1 — placement / dedupe
-- -----------------------------------------------------------------------------

-- P1-4a) ADM_USERS_LIST — 1차 숏컷만 남기고 그룹 내 「사용자 목록」 비활성
UPDATE menus
SET is_active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_USERS_LIST'
  AND is_active = 1;

-- P1-4b) ADM_USERS 그룹 라벨 → 「계정·권한」
UPDATE menus
SET menu_name = '계정·권한',
    menu_name_en = 'Accounts & Permissions',
    description = '계정·권한·계좌 (센터 어드민 LNB P1)',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_USERS';

-- P1-5a) ADM_CONSULTATION_RECORDS — 1차 그룹 「상담·기록」(sort=18, 사용자 관리 17 ↔ 알림 20)
INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_CONSULTATION_RECORDS', '상담·기록', 'Consultation & Records',
       '/admin/consultation-logs',
       NULL, 0, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'FileText', 18, 1,
       '센터 LNB P1 — 상담일지 등 기록 그룹 (향후 확장용)',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_CONSULTATION_RECORDS');

-- P1-5b) ADM_CONSULTATION_LOGS — 부모를 상담·기록 그룹으로 이동
UPDATE menus
SET parent_menu_id = (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_CONSULTATION_RECORDS' LIMIT 1) AS p),
    depth = 1,
    sort_order = 1,
    description = '상담일지 조회 (P1: ADM_NOTIFICATIONS → ADM_CONSULTATION_RECORDS)',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_CONSULTATION_LOGS';

-- P1-6) ADM_MAPPINGS_PENDING_PAYMENT_CLEANUP — 매칭·결제·환불 하위 (sort=4, 마지막)
INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_MAPPINGS_PENDING_PAYMENT_CLEANUP', '디러티 매칭 정리', 'Pending Payment Mapping Cleanup',
       '/admin/mappings/pending-payment-cleanup',
       (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_MATCHING_PAYMENT_REFUND' LIMIT 1) AS p),
       1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'Trash2', 4, 1,
       '디러티 매칭(미결제) 정리 — FE 폴백과 DB SSOT 동기화 (P1)',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_MAPPINGS_PENDING_PAYMENT_CLEANUP');

-- 정렬·부모·경로 보장 (재실행 시에도 동일)
UPDATE menus
SET parent_menu_id = (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_MATCHING_PAYMENT_REFUND' LIMIT 1) AS p),
    depth = 1,
    sort_order = 4,
    menu_path = '/admin/mappings/pending-payment-cleanup',
    menu_name = '디러티 매칭 정리',
    required_role = 'STAFF',
    min_required_role = 'STAFF',
    is_active = 1,
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_MAPPINGS_PENDING_PAYMENT_CLEANUP';

-- P1-7) ADM_PUSH_MONITORING — 알림·메시지 하위로 이동 (라벨·path 유지)
UPDATE menus
SET parent_menu_id = (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_NOTIFICATIONS' LIMIT 1) AS p),
    depth = 1,
    sort_order = 1,
    menu_name = '메시지 발송',
    menu_name_en = 'Message Send',
    menu_path = '/admin/push-monitoring',
    description = '문자/푸시 발송 현황 (메시지 발송) — P1: ADM_SETTINGS → ADM_NOTIFICATIONS',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_PUSH_MONITORING';
