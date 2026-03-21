-- LNB: '보고서' 그룹(통계) 제거 — 운영에서 불필요로 판단
-- - ADM_REPORTS / ADM_REPORTS_STAT 비활성화
-- - 컴플라이언스(ADM_REPORTS_COMP)는 설정(ADM_SETTINGS) 하위로 이동해 유지

UPDATE menus comp
INNER JOIN menus st ON st.menu_code = 'ADM_SETTINGS' AND st.is_active = 1
SET comp.parent_menu_id = st.id,
    comp.depth = 1,
    comp.sort_order = 5
WHERE comp.menu_code = 'ADM_REPORTS_COMP';

UPDATE menus
SET is_active = 0, updated_at = CURRENT_TIMESTAMP
WHERE menu_code IN ('ADM_REPORTS', 'ADM_REPORTS_STAT');
