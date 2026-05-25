-- =============================================================================
-- LNB: 설정(ADM_SETTINGS) 하위에 AI 프로바이더 관리 메뉴 추가 (hotfix)
-- - 배경: AI Provider Management 페이지 (frontend `menuItems.js` L74,
--         `ADMIN_ROUTES.AI_PROVIDERS`) 에 대응하는 `menus` Flyway 시드가 누락되어
--         운영/개발 모두 LNB 에 'AI 프로바이더 관리' 가 노출되지 않음.
--         (`menus` 테이블이 SSOT — `DEFAULT_MENU_ITEMS` 폴백은 미사용)
-- - 경로: /admin/system/ai-providers (= `ADMIN_ROUTES.AI_PROVIDERS`)
-- - 역할: required_role='ADMIN', min_required_role='ADMIN' (ADMIN 전용 페이지)
--   - 트랙 B PR-4 AI 프로바이더 관리: API 키·헬스체크·사용량 통계 등 운영 도구.
--     쓰기/조회 모두 ADMIN 으로 게이트.
--   - `MenuServiceImpl.getLnbMenus` 의 ADMIN 가시 집합에 포함되어 ADMIN 사용자에게 정상 노출.
-- - menu_location = 'ADMIN_ONLY' → 어드민 LNB 전용
-- - icon = 'Cpu' (frontend `menuItems.js` L74 매핑 키 'CPU' → Lucide `Cpu` 아이콘)
-- - sort_order 13 고정 (V20260530_001 에서 ADM_REPORTS_COMP 12 로 이동했으므로 그 다음 슬롯).
--   향후 정렬 재조정은 별도 PR.
-- - 멱등: INSERT 는 menu_code NOT EXISTS, UPDATE 는 고정 sort_order
--   (V20260526_004 / V20260530_001 와 동일 패턴)
-- - 멀티테넌트: `menus` 테이블은 전역 마스터 (테넌트 컬럼 없음) — 단일 row INSERT
-- - 운영 영향: menus 테이블에 row 1건 추가 (sort_order 재정렬 없음)
-- =============================================================================

INSERT INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, depth,
                   required_role, min_required_role, is_admin_only, menu_location, icon,
                   sort_order, is_active, description, created_at, updated_at)
SELECT 'ADM_SETTINGS_AI_PROVIDER', 'AI 프로바이더 관리', 'AI Provider Management',
  '/admin/system/ai-providers',
  (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'ADM_SETTINGS' LIMIT 1) AS p),
  1, 'ADMIN', 'ADMIN', 1, 'ADMIN_ONLY', 'Cpu', 13, 1,
  'AI 프로바이더(OpenAI/Gemini/Anthropic) 관리 + API 키 + 헬스체크 + 사용량 통계 (ADMIN 전용)',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT 1) AS d
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE menu_code = 'ADM_SETTINGS_AI_PROVIDER');

UPDATE menus SET sort_order = 13, updated_at = CURRENT_TIMESTAMP
  WHERE menu_code = 'ADM_SETTINGS_AI_PROVIDER';
