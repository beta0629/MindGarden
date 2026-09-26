-- =============================================================================
-- system_config — 세션 보안 OAuth/팬텀 완화 스위치 시드 (전역 tenant_id='')
--   (2026-09-26, SNS 웹 OAuth 팬텀 세션 P0)
--
-- 키 SSOT: com.coresolution.consultation.constant.SessionSecurityFlagKeys
-- 테넌트 행이 있으면 테넌트 우선, 없으면 본 전역 행, 없으면 Java DEFAULT 상수.
-- =============================================================================

INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
) VALUES
    ('', 'security.session.oauth.require-server-verify', 'true',
     'OAuth 웹 로그인 후 current-user foreground 200 전 isLoggedIn 확정 금지. 기본 true',
     'SECURITY',
     false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()),
    ('', 'security.session.background-401.keep-user', 'false',
     'background checkSession 401 시 FE user 유지. 기본 false(팬텀 방지)',
     'SECURITY',
     false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()),
    ('', 'security.session.soft-fail.enabled', 'true',
     'shell chrome soft-fail(브랜딩·LNB 등) 활성. 회기·샵 API 확대 금지. 기본 true',
     'SECURITY',
     false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    category = VALUES(category),
    updated_at = NOW();
