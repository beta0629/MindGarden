-- DEV ONLY — 운영→.dev D-1 복원 후 SCT feature 플래그 복원
-- V20261123_003 과 동일: tenants name/subdomain 에 마인드가든/mindgarden 매칭 테넌트만 ON
-- UUID 하드코딩 금지. 전역 tenant_id='' 은 건드리지 않음(false 유지).
-- 운영 DB WRITE 금지. prod-to-dev-daily.sh 후처리에서만 실행.
-- @author MindGarden
-- @since 2026-11-24

INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT
    t.tenant_id,
    'feature.sct.enabled',
    'true',
    'SCT 온라인 질문지 — 마인드가든 테넌트 ON (DEV D-1 후처리)',
    'FEATURE',
    false,
    true,
    'SYSTEM',
    'SYSTEM',
    NOW(),
    NOW()
FROM tenants t
WHERE t.is_deleted = 0
  AND (
        t.name LIKE '%마인드가든%'
     OR LOWER(IFNULL(t.subdomain, '')) LIKE '%mindgarden%'
     OR LOWER(IFNULL(t.name, '')) LIKE '%mindgarden%'
  )
ON DUPLICATE KEY UPDATE
    config_value = 'true',
    description = VALUES(description),
    updated_at = NOW();
