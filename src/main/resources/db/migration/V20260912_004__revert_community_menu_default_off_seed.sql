-- =============================================================================
-- 교정: 구 V20260912_001 커뮤니티 기본 OFF 시드 철회 (#988 정책)
--
-- 번호: develop #988 과 merge 시 V20260912_002 충돌 → 본 파일을 004로 재번호.
-- 정책: CLT_COMMUNITY / CST_COMMUNITY 를 Flyway 로 사전 OFF 하지 않음.
--       심사 시 숨김은 Admin 메뉴 권한(필요 시 iOS 원버튼)으로만 적용.
-- 신규 설치: V20260912_001 제거됨 → 본 스크립트는 no-op.
-- 이미 001 적용 DB: assigned_by='FLYWAY_V20260912_001' 시드 행만 삭제
--                 (행 없음 = min-role 기본 노출로 복귀).
-- =============================================================================

DELETE rmp
FROM role_menu_permissions rmp
INNER JOIN menus m
    ON m.id = rmp.menu_id
   AND m.menu_code IN ('CLT_COMMUNITY', 'CST_COMMUNITY')
WHERE rmp.assigned_by = 'FLYWAY_V20260912_001';
