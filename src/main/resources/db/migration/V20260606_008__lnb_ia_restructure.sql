-- =====================================================================
-- V20260606_008 — 어드민 LNB 정보 아키텍처(IA) 재배치 — Phase 3 (P3 core-coder)
--
-- SSOT 합의서: docs/project-management/2026-05-28/ADMIN_LNB_IA_RESTRUCTURE_PLAN.md (사용자 Q1~Q10 결재 완료)
-- 디자인 핸드오프: docs/project-management/2026-05-28/ADMIN_LNB_IA_DESIGN_HANDOFF.md (commit 53f2d5a6e)
--
-- 변경 요약 (DUP-1 ~ DUP-6 일괄 fix + 8 개 1차 IA 정합):
--   DUP-1: 1차 단독 신설 → ADM_INTEGRATED_SCHEDULE (`/admin/integrated-schedule`)
--   DUP-2: ADM_NOTIFICATIONS path → `/admin/system-notifications` → `/admin/notifications`
--   DUP-3: DB 시드 누락 신설 → ADM_CONSULTATION_LOGS, ADM_COMMUNITY_MODERATION, ADM_CONTENT_MASTER,
--           ADM_MIND_WEATHER_OBSERVABILITY, ADM_MIND_GARDEN_OBSERVABILITY, ADM_PUSH_MONITORING,
--           ADM_PG_OPS_APPROVAL, ADM_PACKAGE_PRICING
--   DUP-6: ADM_SETTINGS_PG path → `/tenant/pg-configuration` → `/tenant/pg-configurations` (복수형 통일)
--
-- IA 재배치 (1차 8개):
--   순위 1. ADM_DASHBOARD (단독)              sort_order = 10
--   순위 2. ADM_INTEGRATED_SCHEDULE (단독)     sort_order = 15  ← 신설
--   순위 3. ADM_NOTIFICATIONS (단독)          sort_order = 20
--   순위 4. ADM_MATCHING_PAYMENT_REFUND (그룹) sort_order = 25  ← 신설 그룹 헤더 (G2)
--   순위 5. ADM_USERS (그룹)                  sort_order = 30
--   순위 6. ADM_CONTENT_COMMUNITY (그룹)      sort_order = 35  ← 신설 그룹 헤더 (G4)
--   순위 7. ADM_SHOP (그룹)                   sort_order = 40
--   순위 8. ADM_ERP (그룹)                    sort_order = 45
--   순위 9. ADM_SETTINGS (그룹)               sort_order = 50
--   (ADM_REPORTS 는 is_active=0 유지)
--
-- 2차 강등:
--   ADM_MAPPING            → parent = ADM_MATCHING_PAYMENT_REFUND, depth=1, sort_order=1 (Q9 권고)
--   ADM_BILLING            → parent = ADM_MATCHING_PAYMENT_REFUND, depth=1, sort_order=2 (Q9 권고)
--   ADM_BILLING_SUBSCRIPTIONS  → parent unchanged (ADM_BILLING 하위 유지)
--   ADM_BILLING_PAYMENT_METHODS → parent unchanged
--   ADM_PG_OPS_APPROVAL    → parent = ADM_MATCHING_PAYMENT_REFUND, depth=1, sort_order=3 (신설)
--
-- 권한 (designer §6):
--   ADM_INTEGRATED_SCHEDULE / ADM_NOTIFICATIONS / ADM_USERS / ADM_CONTENT_COMMUNITY → STAFF
--   ADM_MATCHING_PAYMENT_REFUND (그룹) → STAFF (자식 ADM_MAPPING/ADM_BILLING 은 ADMIN/STAFF 혼합 유지)
--   ADM_PG_OPS_APPROVAL → ADMIN (OpsPermissionUtils.requireAdminOrOps() 정합)
--
-- 멱등 보장: 모든 INSERT 는 menu_code 기준 NOT EXISTS / IGNORE / ON DUPLICATE KEY UPDATE.
-- 운영 영향: menus 테이블 row 신설 ≈ 10건 + UPDATE ≈ 15건. 페이지 본문/API 코드 변경 없음.
-- =====================================================================

-- ----------------------------------------
-- §1. 신규 그룹 헤더 INSERT (1차, parent_menu_id = NULL)
-- ----------------------------------------

-- §1.1 ADM_INTEGRATED_SCHEDULE — 1차 단독 (sort=15)
INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_INTEGRATED_SCHEDULE', '통합 스케줄', 'Integrated Schedule',
       '/admin/integrated-schedule',
       NULL, 0, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'CalendarDays', 15, 1,
       'IA 재배치 — 1차 단독 (DUP-1 fix, planner §3 권고: 매일 다회 방문)',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_INTEGRATED_SCHEDULE');

-- §1.2 ADM_MATCHING_PAYMENT_REFUND — G2 그룹 헤더 (sort=25)
INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_MATCHING_PAYMENT_REFUND', '매칭·결제·환불', 'Matching, Payment & Refund',
       '#',
       NULL, 0, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'CreditCard', 25, 1,
       'IA G2 그룹 — 매칭(환불·취소) + 결제/구독 + PG 승인 (Q9 권고: ADM_MAPPING/ADM_BILLING 강등)',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_MATCHING_PAYMENT_REFUND');

-- §1.3 ADM_CONTENT_COMMUNITY — G4 그룹 헤더 (sort=35)
INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_CONTENT_COMMUNITY', '콘텐츠·커뮤니티', 'Content & Community',
       '#',
       NULL, 0, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'Layers', 35, 1,
       'IA G4 그룹 — 커뮤니티 검수큐/심리교육/마음 날씨·정원/푸시 모니터링',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_CONTENT_COMMUNITY');

-- §1.4 ADM_SHOP 이 이미 존재. 그룹 헤더 확보용 path 통일만 보장 (path 유지)
-- §1.5 ADM_ERP, ADM_USERS, ADM_SETTINGS 도 이미 존재.

-- ----------------------------------------
-- §2. ADM_NOTIFICATIONS 1차 path 갱신 (DUP-2 fix) + STAFF 유지
-- ----------------------------------------

UPDATE menus
SET menu_path = '/admin/notifications',
    description = '통합 알림·메시지 관리 (DUP-2 fix: /admin/system-notifications → /admin/notifications)',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_NOTIFICATIONS';

-- ----------------------------------------
-- §3. DUP-3 — DB 시드 누락 2차 메뉴 신설
-- ----------------------------------------

-- §3.1 ADM_CONSULTATION_LOGS — ADM_NOTIFICATIONS 하위
INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_CONSULTATION_LOGS', '상담일지', 'Consultation Logs',
       '/admin/consultation-logs',
       (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_NOTIFICATIONS' LIMIT 1) AS p),
       1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'FileText', 1, 1,
       '상담일지 조회 (DUP-3 fix: DB 시드 누락)',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_CONSULTATION_LOGS');

-- §3.2 ADM_PG_OPS_APPROVAL — ADM_MATCHING_PAYMENT_REFUND 하위 (sort=3, ADMIN 전용)
INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_PG_OPS_APPROVAL', 'PG 승인(운영)', 'PG Ops Approval',
       '/admin/ops/pg-approval',
       (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_MATCHING_PAYMENT_REFUND' LIMIT 1) AS p),
       1, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'ShieldCheck', 3, 1,
       'PG 운영 승인 (OpsPermissionUtils.requireAdminOrOps() 정합 — DUP-3 fix)',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_PG_OPS_APPROVAL');

-- §3.3 ADM_COMMUNITY_MODERATION — ADM_CONTENT_COMMUNITY 하위 (sort=1)
INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_COMMUNITY_MODERATION', '커뮤니티 검수큐', 'Community Moderation Queue',
       '/admin/community-moderation',
       (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_CONTENT_COMMUNITY' LIMIT 1) AS p),
       1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'Inbox', 1, 1,
       '커뮤니티 게시 검수 큐 (DUP-3 fix)',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_COMMUNITY_MODERATION');

-- §3.4 ADM_CONTENT_MASTER — ADM_CONTENT_COMMUNITY 하위 (sort=2)
INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_CONTENT_MASTER', '심리교육·힐링 마스터', 'Content Master (Psych Education)',
       '/admin/content-master',
       (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_CONTENT_COMMUNITY' LIMIT 1) AS p),
       1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'BookOpen', 2, 1,
       '심리교육·힐링 콘텐츠 마스터 (DUP-3 fix)',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_CONTENT_MASTER');

-- §3.5 ADM_MIND_WEATHER_OBSERVABILITY — ADM_CONTENT_COMMUNITY 하위 (sort=3)
INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_MIND_WEATHER_OBSERVABILITY', '마음 날씨 관측', 'Mind Weather Observability',
       '/admin/wellness/mind-weather-observability',
       (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_CONTENT_COMMUNITY' LIMIT 1) AS p),
       1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'CloudSun', 3, 1,
       'BW-6 마음 날씨 관측 (DUP-3 fix)',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_MIND_WEATHER_OBSERVABILITY');

-- §3.6 ADM_MIND_GARDEN_OBSERVABILITY — ADM_CONTENT_COMMUNITY 하위 (sort=4)
INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_MIND_GARDEN_OBSERVABILITY', '마음 정원 관측', 'Mind Garden Observability',
       '/admin/wellness/mind-garden-observability',
       (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_CONTENT_COMMUNITY' LIMIT 1) AS p),
       1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'Flower2', 4, 1,
       'BW-6 마음 정원 관측 (DUP-3 fix)',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_MIND_GARDEN_OBSERVABILITY');

-- §3.7 ADM_PUSH_MONITORING — ADM_CONTENT_COMMUNITY 하위 (sort=5)
INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_PUSH_MONITORING', '푸시 설정 모니터링', 'Push Settings Monitoring',
       '/admin/push-monitoring',
       (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_CONTENT_COMMUNITY' LIMIT 1) AS p),
       1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'Send', 5, 1,
       '푸시·알림 설정 모니터링 (BW-1, DUP-3 fix)',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_PUSH_MONITORING');

-- §3.8 ADM_PACKAGE_PRICING — ADM_SETTINGS 하위 (sort=14)
INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_PACKAGE_PRICING', '패키지 요금 관리', 'Package Pricing',
       '/admin/package-pricing',
       (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1) AS p),
       1, 'STAFF', 'STAFF', 1, 'ADMIN_ONLY', 'Tags', 14, 1,
       '패키지 요금(가격) 관리 (DUP-3 fix)',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_PACKAGE_PRICING');

-- ----------------------------------------
-- §4. ADM_MAPPING / ADM_BILLING — G2 그룹 하위로 강등 (Q9 권고)
-- ----------------------------------------

UPDATE menus
SET parent_menu_id = (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_MATCHING_PAYMENT_REFUND' LIMIT 1) AS p),
    depth = 1,
    sort_order = 1,
    menu_name = '매칭 관리(환불·취소)',
    description = 'IA 강등: 1차 → G2 매칭·결제·환불 하위 (Q9 권고)',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_MAPPING';

UPDATE menus
SET parent_menu_id = (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_MATCHING_PAYMENT_REFUND' LIMIT 1) AS p),
    depth = 1,
    sort_order = 2,
    description = 'IA 강등: 1차 → G2 매칭·결제·환불 하위 (Q9 권고)',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_BILLING';

-- ----------------------------------------
-- §5. DUP-6 — ADM_SETTINGS_PG path 복수형 통일 (`/tenant/pg-configuration` → `/tenant/pg-configurations`)
-- ----------------------------------------

UPDATE menus
SET menu_path = '/tenant/pg-configurations',
    description = 'PG 설정 (DUP-6 fix: 단수형 → 복수형 통일)',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_SETTINGS_PG';

-- ----------------------------------------
-- §6. 1차 메뉴 sort_order 재정렬 (Q3 권고 — 매일/주/케이스 빈도 순)
-- ----------------------------------------

UPDATE menus SET sort_order = 10, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_DASHBOARD';
UPDATE menus SET sort_order = 15, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_INTEGRATED_SCHEDULE';
UPDATE menus SET sort_order = 20, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_NOTIFICATIONS';
UPDATE menus SET sort_order = 25, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_MATCHING_PAYMENT_REFUND';
UPDATE menus SET sort_order = 30, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_USERS';
UPDATE menus SET sort_order = 35, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_CONTENT_COMMUNITY';
UPDATE menus SET sort_order = 40, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SHOP';
UPDATE menus SET sort_order = 45, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_ERP';
UPDATE menus SET sort_order = 50, updated_at = CURRENT_TIMESTAMP WHERE menu_code = 'ADM_SETTINGS';

-- ----------------------------------------
-- §7. STAFF 가시성 보강 — 신규 1차 그룹/단독에 대해 (designer §6 정합)
-- ----------------------------------------
-- 이미 §1 INSERT 단계에서 required_role='STAFF' 로 신설하였으므로 추가 UPDATE 불필요.
-- ADM_MAPPING / ADM_BILLING 강등 후에도 기존 required_role 보존 (ADM_BILLING=ADMIN 유지).

-- 완료 — Phase 4 (core-tester) 권한별 노출 매트릭스 + 시각 회귀 게이트 대기.
