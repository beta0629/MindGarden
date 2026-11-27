-- SCT 본인확인 SMS OTP system_config 시드 (tenant_id='' 멱등)
-- @author MindGarden
-- @since 2026-11-27
-- 기존 마이그레이션 수정 금지. #1961=_003, #1962=_004 → 본 파일=_005

INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT '', 'sct.identity.otp.code.length', '6',
       'SCT 본인확인 SMS OTP 자릿수',
       'SCT', false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM system_config
    WHERE tenant_id = '' AND config_key = 'sct.identity.otp.code.length' AND is_active = 1
);

INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT '', 'sct.identity.otp.ttl.seconds', '180',
       'SCT 본인확인 SMS OTP TTL(초)',
       'SCT', false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM system_config
    WHERE tenant_id = '' AND config_key = 'sct.identity.otp.ttl.seconds' AND is_active = 1
);

INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT '', 'sct.identity.otp.max.attempts', '5',
       'SCT 본인확인 SMS OTP 최대 검증 시도',
       'SCT', false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM system_config
    WHERE tenant_id = '' AND config_key = 'sct.identity.otp.max.attempts' AND is_active = 1
);

INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT '', 'sct.identity.otp.resend.cooldown.seconds', '60',
       'SCT 본인확인 SMS OTP 재발송 쿨다운(초)',
       'SCT', false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM system_config
    WHERE tenant_id = '' AND config_key = 'sct.identity.otp.resend.cooldown.seconds' AND is_active = 1
);

INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT '', 'sct.identity.otp.send.limit.per.hour.invite', '10',
       'SCT 본인확인 SMS OTP 초대당 시간당 발송 상한',
       'SCT', false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM system_config
    WHERE tenant_id = '' AND config_key = 'sct.identity.otp.send.limit.per.hour.invite' AND is_active = 1
);

INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT '', 'sct.identity.otp.send.limit.per.hour.phone', '5',
       'SCT 본인확인 SMS OTP 번호 해시당 시간당 발송 상한',
       'SCT', false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM system_config
    WHERE tenant_id = '' AND config_key = 'sct.identity.otp.send.limit.per.hour.phone' AND is_active = 1
);

INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT '', 'sct.identity.otp.send.limit.per.hour.ip', '20',
       'SCT 본인확인 SMS OTP IP 해시당 시간당 발송 상한',
       'SCT', false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM system_config
    WHERE tenant_id = '' AND config_key = 'sct.identity.otp.send.limit.per.hour.ip' AND is_active = 1
);

INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT '', 'sct.identity.otp.lock.minutes', '15',
       'SCT 본인확인 SMS OTP 오답 잠금(분)',
       'SCT', false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM system_config
    WHERE tenant_id = '' AND config_key = 'sct.identity.otp.lock.minutes' AND is_active = 1
);

INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
)
SELECT '', 'sct.identity.otp.timing.pad.ms', '200',
       'SCT 본인확인 SMS OTP 불일치 응답 timing pad(ms)',
       'SCT', false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM system_config
    WHERE tenant_id = '' AND config_key = 'sct.identity.otp.timing.pad.ms' AND is_active = 1
);
