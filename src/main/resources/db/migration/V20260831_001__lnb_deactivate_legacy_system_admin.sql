-- ========================================
-- LNB: 레거시 SYSTEM_ADMIN 트리 비활성화
-- 작성일: 2026-08-31
-- 목적: `/admin` path 의 SYSTEM_ADMIN 이 ADM_* 설정 그룹과 함께
--       `/admin/*` 에서 false-active 되는 원인 제거.
--       Admin LNB SSOT 는 ADM_* (V20260225 / V20260606).
-- 정책: DELETE 금지. is_active=0 만. ADM_* 코드·「설정」라벨 변경 없음.
-- 멱등: is_active = 1 인 행만 갱신.
-- ========================================

-- 1) 레거시 루트
UPDATE menus
SET is_active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'SYSTEM_ADMIN'
  AND is_active = 1;

-- 2) SYSTEM_ADMIN 직계 자식 중 ADM_* 가 아닌 레거시 메뉴
UPDATE menus
SET is_active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE is_active = 1
  AND menu_code NOT LIKE 'ADM_%'
  AND parent_menu_id = (
        SELECT id
        FROM (
            SELECT id
            FROM menus
            WHERE menu_code = 'SYSTEM_ADMIN'
            LIMIT 1
        ) AS p
      );

-- 3) 위 레거시 직계의 손자(예: USER_MGMT / ERP_MAIN 하위) — ADM_* 제외
UPDATE menus
SET is_active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE is_active = 1
  AND menu_code NOT LIKE 'ADM_%'
  AND parent_menu_id IN (
        SELECT id
        FROM (
            SELECT id
            FROM menus
            WHERE menu_code NOT LIKE 'ADM_%'
              AND parent_menu_id = (
                    SELECT id
                    FROM menus
                    WHERE menu_code = 'SYSTEM_ADMIN'
                    LIMIT 1
                  )
        ) AS mid
      );
