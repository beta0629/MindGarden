-- ========================================
-- ERP LNB(menus) — 프론트 폴백 menuItems.js 와 정합 (Phase F2a)
-- 작성일: 2026-04-09
-- - ERP_* 라벨·경로·순서를 DEFAULT_MENU_ITEMS / ERP_MENU_ITEMS 과 일치
-- - 세무(ERP_TAX) LNB 비노출: is_active = 0 (URL /erp/tax 는 앱 라우트 유지)
-- - 급여·승인 센터 누락 시 INSERT (V20260212_003 동일 컬럼 목록, NOT EXISTS)
-- 멱등: 반복 실행 시 동일 결과
-- 검증: 프론트 LNB 폴백·ERP_MENU_ITEMS 정합은 `frontend` 에서 `npm run verify:erp`(스크립트
--   `scripts/verify-erp-menu-items-sync.mjs` 등)로 확인 가능.
-- 환경: ADM_ERP / ERP_MAIN 구성이 배포·DB마다 다를 수 있으면 운영 DB에서 해당 menu_code
--   행 SELECT 로 부모·경로·정렬이 기대와 맞는지 확인하는 것을 권장.
-- ========================================

-- ----------------------------------------
-- 1. 어드민 LNB 상위(ADM_ERP) 표시명 — 폴백 "운영·재무" 와 동기화
-- ----------------------------------------

UPDATE menus
SET menu_name = '운영·재무',
    menu_name_en = 'Operations & Finance',
    description = '운영 현황·조달·거래·예산·급여·승인 센터',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ADM_ERP';

-- ----------------------------------------
-- 2. ERP 하위 — 표시명·영문명·설명 (menu_code 기준)
-- ----------------------------------------

UPDATE menus
SET menu_name = '운영 현황',
    menu_name_en = 'Operations Overview',
    description = '수입·지출·구매 등 운영 지표 요약',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ERP_DASHBOARD';

UPDATE menus
SET menu_name = '조달·품목',
    menu_name_en = 'Procurement & Items',
    description = '구매 요청·발주 및 품목 관리',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ERP_PURCHASE';

UPDATE menus
SET menu_name = '거래·정산',
    menu_name_en = 'Transactions & Settlement',
    description = '재무 거래·정산·회계 처리',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ERP_FINANCIAL';

UPDATE menus
SET description = '예산 계획·집행·잔액 관리',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ERP_BUDGET';

-- ----------------------------------------
-- 3. 세무 — LNB 에서 소프트 숨김 (직접 URL 은 유효)
-- ----------------------------------------

UPDATE menus
SET is_active = 0,
    sort_order = 99,
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'ERP_TAX';

-- ----------------------------------------
-- 4. 누락 시 INSERT — V20260212_003 하위 행과 동일 컬럼 집합
--    parent/depth 는 기존 ERP_BUDGET 행과 동일( ADM_ERP 하위 정렬 후 기준 )
-- ----------------------------------------

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, is_admin_only, icon, sort_order, description, min_required_role, menu_location, is_active)
SELECT 'ERP_SALARY', '급여 관리', 'Salary', '/erp/salary',
    COALESCE(
        (SELECT parent_menu_id FROM (SELECT parent_menu_id FROM menus WHERE menu_code = 'ERP_BUDGET' LIMIT 1) AS pb),
        (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_ERP' LIMIT 1) AS ae),
        (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ERP_MAIN' LIMIT 1) AS em)
    ),
    COALESCE(
        (SELECT depth FROM (SELECT depth FROM menus WHERE menu_code = 'ERP_BUDGET' LIMIT 1) AS db),
        1
    ),
    'ADMIN', 1, 'cash-stack', 5, '급여 산정 및 지급 관리', 'ADMIN', 'ADMIN_ONLY', 1
FROM (SELECT 1) AS t
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ERP_SALARY');

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth, required_role, is_admin_only, icon, sort_order, description, min_required_role, menu_location, is_active)
SELECT 'ERP_APPROVALS', '승인 센터', 'Approval Center', '/erp/approvals',
    COALESCE(
        (SELECT parent_menu_id FROM (SELECT parent_menu_id FROM menus WHERE menu_code = 'ERP_BUDGET' LIMIT 1) AS pb2),
        (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_ERP' LIMIT 1) AS ae2),
        (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ERP_MAIN' LIMIT 1) AS em2)
    ),
    COALESCE(
        (SELECT depth FROM (SELECT depth FROM menus WHERE menu_code = 'ERP_BUDGET' LIMIT 1) AS db2),
        1
    ),
    'ADMIN', 1, 'clipboard-check', 6, '구매·환불·재무 등 승인 업무', 'ADMIN', 'ADMIN_ONLY', 1
FROM (SELECT 1) AS t
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ERP_APPROVALS');

-- ----------------------------------------
-- 5. 활성 ERP 서브 메뉴 sort_order 1~6 (세무 제외)
-- ----------------------------------------

UPDATE menus
SET sort_order = CASE menu_code
        WHEN 'ERP_DASHBOARD' THEN 1
        WHEN 'ERP_PURCHASE' THEN 2
        WHEN 'ERP_FINANCIAL' THEN 3
        WHEN 'ERP_BUDGET' THEN 4
        WHEN 'ERP_SALARY' THEN 5
        WHEN 'ERP_APPROVALS' THEN 6
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code IN ('ERP_DASHBOARD', 'ERP_PURCHASE', 'ERP_FINANCIAL', 'ERP_BUDGET', 'ERP_SALARY', 'ERP_APPROVALS');

-- 완료
