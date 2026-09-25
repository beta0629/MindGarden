-- =============================================================================
-- Client WEB community path SSOT: /client/community (v4 lobby chrome)
-- Legacy: /client/more/community (ClientAppShell) → redirect on FE; menu_path UPDATE
-- menu_code 기준만. tenant/host/center URL 하드코딩 금지.
-- =============================================================================

UPDATE menus
SET menu_path = '/client/community',
    updated_at = CURRENT_TIMESTAMP
WHERE menu_code = 'CLT_COMMUNITY'
  AND (menu_path IS NULL OR menu_path <> '/client/community');
